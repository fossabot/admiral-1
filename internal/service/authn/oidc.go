package authn

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/oauth2"

	authnv1 "go.admiral.io/admiral/api/authn/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/model"
)

var defaultScopes = []string{oidc.ScopeOpenID, oidc.ScopeOfflineAccess, "email", "profile"}

const admiralProvider = "admiral"

type OIDCProvider struct {
	httpClient      *http.Client
	oauth2          *oauth2.Config
	oidcProvider    *oidc.Provider
	oidcVerifier    *oidc.IDTokenVerifier
	endpointClaims  *endpointClaims
	nonceSecret     string
	signingKey      string
	refreshTokenTTL time.Duration
	store           *store
	providerName    string
}

type IntrospectionToken struct {
	Active     bool             `json:"active"`
	Subject    string           `json:"sub,omitempty"`
	Audience   []string         `json:"aud,omitempty"`
	NotBefore  *jwt.NumericDate `json:"nbf,omitempty"`
	Scope      string           `json:"scope,omitempty"`
	Issuer     string           `json:"iss,omitempty"`
	Expiration *jwt.NumericDate `json:"exp,omitempty"`
	IssuedAt   *jwt.NumericDate `json:"iat,omitempty"`
	JWTId      string           `json:"jti,omitempty"`
	TenantId   string           `json:"tid,omitempty"`
	ClientId   string           `json:"client_id,omitempty"`
	TokenType  string           `json:"token_type,omitempty"`
}

type endpointClaims struct {
	RevocationUrl    string `json:"revocation_endpoint"`
	IntrospectionUrl string `json:"introspection_endpoint"`
	EndSessionUrl    string `json:"end_session_endpoint"`
}

func NewOIDCProvider(cfg *config.Config, logger *zap.Logger, store *store) (Provider, error) {
	if err := validateConfig(cfg); err != nil {
		logger.Error("invalid configuration", zap.Error(err))
		return nil, fmt.Errorf("failed to initialize service: %w", err)
	}

	httpClient := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: cfg.Services.Authn.SkipTLSVerify, //nolint:gosec // Configurable for development environments
			},
		},
	}
	ctx := context.WithValue(context.Background(), oauth2.HTTPClient, httpClient)

	oidcProvider, err := oidc.NewProvider(ctx, cfg.Services.Authn.Issuer)
	if err != nil {
		logger.Error("failed to initialize oidc provider", zap.Error(err))
		return nil, fmt.Errorf("failed to initialize oidc provider: %w", err)
	}

	oidcVerifier := oidcProvider.Verifier(&oidc.Config{
		ClientID: cfg.Services.Authn.ClientID,
	})

	endpointClaims := &endpointClaims{}
	if err := oidcProvider.Claims(endpointClaims); err != nil {
		logger.Error("failed to retrieve OIDC provider endpointClaims", zap.Error(err))
		return nil, fmt.Errorf("failed to retrieve OIDC provider endpointClaims: %w", err)
	}

	if endpointClaims.RevocationUrl == "" || endpointClaims.IntrospectionUrl == "" || endpointClaims.EndSessionUrl == "" {
		errMsg := "missing revocation_endpoint, introspection_endpoint, or end_session_endpoint in OIDC metadata"
		logger.Error(errMsg)
		return nil, fmt.Errorf("invalid configuration: %s", errMsg)
	}

	scopes := cfg.Services.Authn.Scopes
	if len(scopes) == 0 {
		scopes = defaultScopes
		logger.Info("no scopes provided, using default scopes", zap.Strings("scopes", defaultScopes))
	} else {
		logger.Info("using provided scopes", zap.Strings("scopes", scopes))
	}

	oauthConfig := &oauth2.Config{
		ClientID:     cfg.Services.Authn.ClientID,
		ClientSecret: cfg.Services.Authn.ClientSecret,
		Endpoint:     oidcProvider.Endpoint(),
		RedirectURL:  cfg.Services.Authn.RedirectURL,
		Scopes:       scopes,
	}

	// Return the service instance
	return &OIDCProvider{
		httpClient:      httpClient,
		oauth2:          oauthConfig,
		oidcProvider:    oidcProvider,
		oidcVerifier:    oidcVerifier,
		endpointClaims:  endpointClaims,
		nonceSecret:     cfg.Services.Authn.NonceSecret,
		signingKey:      cfg.Services.Authn.NonceSecret,
		store:           store,
		providerName:    cfg.Services.Authn.Name,
		refreshTokenTTL: time.Hour * 12,
	}, nil
}

func validateConfig(cfg *config.Config) error {
	if cfg == nil {
		return errors.New("configuration is nil: provide a valid configuration")
	}

	authn := cfg.Services.Authn
	if authn.Name == "" {
		return fmt.Errorf("authn configuration error: 'name' field is empty; specify a valid authentication provider name")
	}

	if authn.ClientID == "" {
		return fmt.Errorf("authn configuration error: 'client_id' is empty; provide a valid OAuth2 client ID")
	}

	if authn.ClientSecret == "" {
		return fmt.Errorf("authn configuration error: 'client_secret' is empty; provide a valid OAuth2 client secret")
	}

	if authn.Issuer == "" {
		return fmt.Errorf("authn configuration error: 'issuer' is empty; specify the OIDC provider's issuer URL (e.g., https://accounts.google.com)")
	}

	if authn.RedirectURL == "" {
		return fmt.Errorf("authn configuration error: 'redirect_url' is empty; provide the OAuth2 redirect URL (e.g., https://yourapp.com/callback)")
	}

	if authn.NonceSecret == "" {
		return fmt.Errorf("authn configuration error: 'nonce_secret' is empty; provide a secure secret for state nonce generation")
	}

	return nil
}

func (p *OIDCProvider) GetStateNonce(_ context.Context, redirectURL string) (string, error) {
	u, err := url.Parse(redirectURL)
	if err != nil {
		return "", fmt.Errorf("invalid redirect URL: %w", err)
	}

	if u.Scheme != "" || u.Host != "" {
		return "", errors.New("only relative redirect URLs are supported")
	}

	dest := u.RequestURI()
	if !strings.HasPrefix(dest, "/") {
		dest = fmt.Sprintf("/%s", dest)
	}

	claims := &stateClaims{
		RegisteredClaims: &jwt.RegisteredClaims{
			Subject:   uuid.New().String(),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
		RedirectURL: dest,
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(p.nonceSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign state nonce: %w", err)
	}

	return token, nil
}

func (p *OIDCProvider) GetAuthCodeURL(_ context.Context, state string) (string, error) {
	if state == "" {
		return "", errors.New("state parameter cannot be empty")
	}

	opts := []oauth2.AuthCodeOption{oauth2.AccessTypeOffline}
	authURL := p.oauth2.AuthCodeURL(state, opts...)
	if authURL == "" {
		return "", errors.New("failed to generate auth code URL")
	}

	return authURL, nil
}

func (p *OIDCProvider) ValidateStateNonce(_ context.Context, state string) (string, error) {
	if state == "" {
		return "", fmt.Errorf("validation failed: state token is empty")
	}

	claims := &stateClaims{}
	token, err := jwt.ParseWithClaims(state, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok || token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("invalid signing method: expected HS256")
		}
		return []byte(p.nonceSecret), nil
	})
	if err != nil {
		return "", fmt.Errorf("invalid state token: %w", err)
	}

	if !token.Valid {
		return "", fmt.Errorf("state token is invalid")
	}

	if err := claims.Validate(); err != nil {
		return "", fmt.Errorf("state token validation failed: %w", err)
	}

	return claims.RedirectURL, nil
}

func (p *OIDCProvider) Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	if code == "" {
		return nil, errors.New("authorization code cannot be empty")
	}

	httpCtx := context.WithValue(ctx, oauth2.HTTPClient, p.httpClient)
	token, err := p.oauth2.Exchange(httpCtx, code, oauth2.AccessTypeOffline)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange auth code: %w", err)
	}

	oidcClaims, err := p.verifyAndExtractClaims(httpCtx, token)
	if err != nil {
		return nil, fmt.Errorf("failed to extract claims from token: %w", err)
	}

	authenticatedUser, err := p.store.syncUserByPrincipal(httpCtx, oidcClaims)
	if err != nil {
		return nil, fmt.Errorf("failed to sync user: %w", err)
	}

	internalClaims := p.prepareTokenClaims(oidcClaims, authenticatedUser)

	providerToken, err := p.store.StoreToken(httpCtx, oidcClaims.ID, nil, p.providerName, model.ReferenceKindUser, authenticatedUser.Id, token)
	if err != nil {
		return nil, fmt.Errorf("failed to store provider token: %w", err)
	}

	newToken, err := p.issueToken(internalClaims, true)
	if err != nil {
		return nil, fmt.Errorf("failed to issue token: %w", err)
	}

	if _, err = p.store.StoreToken(httpCtx, internalClaims.ID, &providerToken.Id, admiralProvider, model.ReferenceKindUser, authenticatedUser.Id, newToken); err != nil {
		return nil, fmt.Errorf("failed to store internal token: %w", err)
	}

	return newToken, nil
}

func (p *OIDCProvider) Verify(ctx context.Context, rawToken string) (*Claims, error) {
	if rawToken == "" {
		return nil, errors.New("raw token is empty")
	}

	claims := &Claims{}
	_, err := jwt.ParseWithClaims(rawToken, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok || token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("invalid signing method: expected HS256")
		}

		if p.signingKey == "" {
			return nil, errors.New("signing key is not configured")
		}
		return []byte(p.signingKey), nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if err := claims.Validate(); err != nil {
		return nil, fmt.Errorf("invalid claims: %w", err)
	}

	_, storedToken, err := p.store.GetToken(ctx, claims.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve token: %w", err)
	}

	now := time.Now().UTC()
	if !storedToken.Expiry.IsZero() && storedToken.Expiry.Before(now) {
		return nil, errors.New("token has expired")
	}

	return claims, nil
}

func (p *OIDCProvider) CreateToken(ctx context.Context, subjectId string, tokenType authnv1.CreateTokenRequest_TokenType, expiry *time.Duration) (*model.AuthnToken, error) {
	if subjectId == "" {
		return nil, errors.New("create token: subjectID is empty")
	}
	subject, err := uuid.Parse(subjectId)
	if err != nil {
		return nil, fmt.Errorf("create token: invalid UUID format for subjectID: %w", err)
	}
	if expiry == nil || *expiry <= 0 {
		return nil, errors.New("create token: expiry must be positive")
	}

	var kind string
	switch tokenType {
	case authnv1.CreateTokenRequest_USER:
		kind = string(model.ReferenceKindUser)
	case authnv1.CreateTokenRequest_CLUSTER:
		kind = string(model.ReferenceKindCluster)
	default:
		return nil, fmt.Errorf("create token: unsupported token type %v", tokenType)
	}

	now := time.Now().UTC()
	claims := &Claims{
		RegisteredClaims: &jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			Issuer:    admiralProvider,
			Subject:   subject.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(*expiry)),
		},
		Kind: kind,
	}

	newToken, err := p.issueToken(claims, true)
	if err != nil {
		return nil, fmt.Errorf("create token: failed to issue token: %w", err)
	}

	referenceKind, err := model.ParseReferenceKind(kind)
	if err != nil {
		return nil, fmt.Errorf("create token: failed to parse reference kind %q: %w", kind, err)
	}

	httpCtx := context.WithValue(ctx, oauth2.HTTPClient, p.httpClient)
	authnToken, err := p.store.StoreToken(httpCtx, claims.ID, nil, admiralProvider, referenceKind, subject, newToken)
	if err != nil {
		return nil, fmt.Errorf("create token: failed to store token: %w", err)
	}

	return authnToken, nil
}

func (p *OIDCProvider) RefreshToken(ctx context.Context, token *oauth2.Token) (*oauth2.Token, error) {
	httpCtx := context.WithValue(ctx, oauth2.HTTPClient, p.httpClient)

	claims := &jwt.RegisteredClaims{}
	_, err := jwt.ParseWithClaims(token.RefreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok || token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("invalid signing method: expected HS256")
		}
		return []byte(p.signingKey), nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to parse refresh token: %w", err)
	}

	admiralAt, admiralToken, err := p.store.GetToken(httpCtx, claims.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get stored token: %w", err)
	}
	if admiralToken.RefreshToken != token.RefreshToken {
		return nil, errors.New("refresh token did not match")
	}

	parentAt, parentToken, err := p.store.GetToken(httpCtx, *admiralAt.ParentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get parent token: %w", err)
	}

	if !parentToken.Valid() {
		parentToken, err = p.oauth2.TokenSource(httpCtx, parentToken).Token()
		if err != nil {
			return nil, fmt.Errorf("failed to refresh external token: %w", err)
		}

		oidcClaims, err := p.verifyAndExtractClaims(httpCtx, parentToken)
		if err != nil {
			return nil, fmt.Errorf("failed to extract claims from token: %w", err)
		}

		if _, err = p.store.StoreToken(httpCtx, oidcClaims.ID, nil, p.providerName, parentAt.ReferenceKind, parentAt.ReferenceId, parentToken); err != nil {
			return nil, fmt.Errorf("failed to store new token: %w", err)
		}
	}

	oidcClaims, err := p.verifyAndExtractClaims(httpCtx, parentToken)
	if err != nil {
		return nil, fmt.Errorf("failed to extract claims from token: %w", err)
	}

	authenticatedUser, err := p.store.syncUserByPrincipal(httpCtx, oidcClaims)
	if err != nil {
		return nil, fmt.Errorf("failed to sync user: %w", err)
	}

	internalClaims := p.prepareTokenClaims(oidcClaims, authenticatedUser)

	newToken, err := p.issueToken(internalClaims, true)
	if err != nil {
		return nil, fmt.Errorf("failed to issue token: %w", err)
	}

	if _, err = p.store.StoreToken(ctx, internalClaims.ID, &oidcClaims.ID, admiralProvider, admiralAt.ReferenceKind, admiralAt.ReferenceId, newToken); err != nil {
		return nil, fmt.Errorf("failed to store internal token: %w", err)
	}

	return newToken, nil
}

func (p *OIDCProvider) verifyAndExtractClaims(ctx context.Context, token *oauth2.Token) (*Claims, error) {
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, errors.New("id_token was not present or invalid in oauth token")
	}

	idToken, err := p.oidcVerifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, fmt.Errorf("failed to verify ID token: %w", err)
	}

	return p.claimsFromOIDCToken(idToken)
}

func (p *OIDCProvider) issueToken(claims *Claims, refresh bool) (*oauth2.Token, error) {
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(p.signingKey))
	if err != nil {
		return nil, err
	}

	token := &oauth2.Token{
		AccessToken: accessToken,
		Expiry:      claims.ExpiresAt.Time,
		TokenType:   "Bearer",
	}

	if refresh {
		refreshClaims := &jwt.RegisteredClaims{
			ID:        claims.ID,
			Issuer:    claims.Issuer,
			Subject:   claims.Subject,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(p.refreshTokenTTL)),
		}

		refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(p.signingKey))
		if err != nil {
			return nil, fmt.Errorf("failed to create refresh token: %w", err)
		}
		token.RefreshToken = refreshToken
	}

	return token, nil
}

func (p *OIDCProvider) prepareTokenClaims(oidcClaims *Claims, user *model.User) *Claims {
	tokenClaims := Claims{
		RegisteredClaims: &jwt.RegisteredClaims{},
		ExternalSubject:  oidcClaims.ExternalSubject,
		Kind:             oidcClaims.Kind,
		Email:            oidcClaims.Email,
		EmailVerified:    oidcClaims.EmailVerified,
		Name:             oidcClaims.Name,
		GivenName:        oidcClaims.GivenName,
		FamilyName:       oidcClaims.FamilyName,
		Picture:          oidcClaims.Picture,
		Groups:           make([]string, len(oidcClaims.Groups)),
	}

	if oidcClaims.RegisteredClaims != nil {
		*tokenClaims.RegisteredClaims = *oidcClaims.RegisteredClaims
	}

	copy(tokenClaims.Groups, oidcClaims.Groups)

	tokenClaims.ID = uuid.NewString()
	tokenClaims.Subject = user.Id.String()

	return &tokenClaims

}

func (p *OIDCProvider) claimsFromOIDCToken(t *oidc.IDToken) (*Claims, error) {
	oidcClaims := &Claims{}
	if err := t.Claims(oidcClaims); err != nil {
		return nil, fmt.Errorf("failed to parse OIDC claims: %w", err)
	}
	if oidcClaims.Email == "" {
		return nil, errors.New("required field 'email' missing from OIDC claims")
	}

	tokenID := oidcClaims.ID
	if tokenID == "" {
		tokenID = uuid.NewString()
	}

	claims := &Claims{
		RegisteredClaims: &jwt.RegisteredClaims{
			ID:        tokenID,
			Subject:   oidcClaims.Subject,
			ExpiresAt: jwt.NewNumericDate(t.Expiry),
			IssuedAt:  jwt.NewNumericDate(t.IssuedAt),
			Issuer:    t.Issuer,
		},
		ExternalSubject: oidcClaims.Subject,
		Kind:            string(model.ReferenceKindUser),
		Email:           oidcClaims.Email,
		EmailVerified:   oidcClaims.EmailVerified,
		Name:            oidcClaims.Name,
		GivenName:       oidcClaims.GivenName,
		FamilyName:      oidcClaims.FamilyName,
		Picture:         oidcClaims.Picture,
		Groups:          oidcClaims.Groups,
	}

	return claims, nil
}
