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

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/model"
)

var defaultScopes = []string{oidc.ScopeOpenID, "email", "profile"}

const admiralProvider = "admiral"

type OIDCProvider struct {
	httpClient      *http.Client
	oauth2          *oauth2.Config
	oidcProvider    *oidc.Provider
	oidcVerifier    *oidc.IDTokenVerifier
	signingKey      string
	refreshTokenTTL time.Duration
	store           *store
	providerName    string
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

	return &OIDCProvider{
		httpClient:      httpClient,
		oauth2:          oauthConfig,
		oidcProvider:    oidcProvider,
		oidcVerifier:    oidcVerifier,
		signingKey:      cfg.Services.Authn.SigningSecret,
		store:           store,
		providerName:    cfg.Services.Authn.Name,
		refreshTokenTTL: time.Hour * 12, // TODO: make configurable
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

	if authn.SigningSecret == "" {
		return fmt.Errorf("authn configuration error: 'signing_secret' is empty; provide a secure secret for state nonce generation")
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

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(p.signingKey))
	if err != nil {
		return "", fmt.Errorf("failed to sign state nonce: %w", err)
	}

	return token, nil
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
		return []byte(p.signingKey), nil
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

	providerToken, err := p.store.StoreToken(httpCtx, oidcClaims.ID, nil, p.providerName, TokenKindUser, authenticatedUser.Id, token)
	if err != nil {
		return nil, fmt.Errorf("failed to store provider token: %w", err)
	}

	newToken, err := p.issueToken(internalClaims, true)
	if err != nil {
		return nil, fmt.Errorf("failed to issue token: %w", err)
	}

	if _, err = p.store.StoreToken(httpCtx, internalClaims.ID, &providerToken.Id, admiralProvider, TokenKindUser, authenticatedUser.Id, newToken); err != nil {
		return nil, fmt.Errorf("failed to store internal token: %w", err)
	}

	return newToken, nil
}

func (p *OIDCProvider) Verify(ctx context.Context, rawToken string) (*Claims, error) {
	claims, err := ParseTokenClaims(rawToken, p.signingKey)
	if err != nil {
		return nil, err
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

func (p *OIDCProvider) CreateToken(ctx context.Context, subjectId string, tokenKind TokenKind, expiry *time.Duration) (*oauth2.Token, error) {
	if subjectId == "" {
		return nil, errors.New("create token: subjectID is empty")
	}

	sid, err := uuid.Parse(subjectId)
	if err != nil {
		return nil, fmt.Errorf("create token: invalid UUID format for subjectID: %w", err)
	}

	if expiry == nil || *expiry <= 0 {
		return nil, errors.New("create token: expiry must be positive")
	}

	now := time.Now().UTC()
	claims := &Claims{
		RegisteredClaims: &jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			Issuer:    admiralProvider,
			Subject:   subjectId,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(*expiry)),
		},
		Kind: string(tokenKind),
	}

	newToken, err := p.issueToken(claims, true)
	if err != nil {
		return nil, fmt.Errorf("create token: failed to issue token: %w", err)
	}

	httpCtx := context.WithValue(ctx, oauth2.HTTPClient, p.httpClient)
	_, err = p.store.StoreToken(httpCtx, claims.ID, nil, admiralProvider, tokenKind, sid, newToken)
	if err != nil {
		return nil, fmt.Errorf("create token: failed to store token: %w", err)
	}

	return newToken, nil
}

func (p *OIDCProvider) RefreshToken(ctx context.Context, token *oauth2.Token) (*oauth2.Token, error) {
	//	if tokenId == "" {
	//		return nil, errors.New("refresh token: tokenId is empty")
	//	}
	//
	//	httpCtx := context.WithValue(ctx, oauth2.HTTPClient, p.httpClient)
	//
	//	admiralAt, _, err := p.store.GetToken(httpCtx, tokenId)
	//	if err != nil {
	//		return nil, fmt.Errorf("failed to get stored token: %w", err)
	//	}
	//
	//	parentAt, parentToken, err := p.store.GetToken(httpCtx, *admiralAt.ParentID)
	//	if err != nil {
	//		return nil, fmt.Errorf("failed to get parent token: %w", err)
	//	}
	//
	//	if !parentToken.Valid() {
	//		parentToken, err = p.oauth2.TokenSource(httpCtx, parentToken).Token()
	//		if err != nil {
	//			return nil, fmt.Errorf("failed to refresh external token: %w", err)
	//		}
	//
	//		oidcClaims, err := p.verifyAndExtractClaims(httpCtx, parentToken)
	//		if err != nil {
	//			return nil, fmt.Errorf("failed to extract claims from token: %w", err)
	//		}
	//
	//		if _, err = p.store.StoreToken(httpCtx, oidcClaims.ID, nil, p.providerName, parentAt.ReferenceKind, parentAt.ReferenceId, parentToken); err != nil {
	//			return nil, fmt.Errorf("failed to store new token: %w", err)
	//		}
	//	}
	//
	//	oidcClaims, err := p.verifyAndExtractClaims(httpCtx, parentToken)
	//	if err != nil {
	//		return nil, fmt.Errorf("failed to extract claims from token: %w", err)
	//	}
	//
	//	authenticatedUser, err := p.store.syncUserByPrincipal(httpCtx, oidcClaims)
	//	if err != nil {
	//		return nil, fmt.Errorf("failed to sync user: %w", err)
	//	}
	//
	//	internalClaims := p.prepareTokenClaims(oidcClaims, authenticatedUser)
	//
	//	newToken, err := p.issueToken(internalClaims, true)
	//	if err != nil {
	//		return nil, fmt.Errorf("failed to issue token: %w", err)
	//	}
	//
	//	refreshedToken, err := p.store.StoreToken(ctx, internalClaims.ID, &oidcClaims.ID, admiralProvider, admiralAt.ReferenceKind, admiralAt.ReferenceId, newToken)
	//	if err != nil {
	//		return nil, fmt.Errorf("failed to store internal token: %w", err)
	//	}
	//
	//	return refreshedToken, nil
	return nil, errors.New("refresh token: not implemented")
}

func (p *OIDCProvider) RevokeToken(ctx context.Context, token *oauth2.Token) error {
	//	if tokenId == "" {
	//		return errors.New("revoke token: tokenId is empty")
	//	}
	//
	//	httpCtx := context.WithValue(ctx, oauth2.HTTPClient, p.httpClient)
	//
	//	// Get the token to be revoked
	//	_, storedToken, err := p.store.GetToken(httpCtx, tokenId)
	//	if err != nil {
	//		return fmt.Errorf("revoke token: failed to get stored token: %w", err)
	//	}
	//
	//	// Revoke the token by deleting it from storage
	//	if err := p.store.DeleteToken(httpCtx, tokenId); err != nil {
	//		return fmt.Errorf("revoke token: failed to delete token: %w", err)
	//	}
	//
	//	// If the token has a refresh token and we have an external revocation endpoint,
	//	// attempt to revoke it with the OIDC provider
	//	// TODO: Check if provider supports revocation endpoint
	//	if storedToken.RefreshToken != "" {
	//		if err := p.revokeExternalToken(httpCtx, storedToken.RefreshToken); err != nil {
	//			// Log the error but don't fail the operation since we've already revoked locally
	//			// This ensures we don't leave the token in an inconsistent state
	//			// TODO: Consider adding proper logging here
	//		}
	//	}
	//
	//	return nil
	return nil
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
		Kind:            string(TokenKindUser),
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
