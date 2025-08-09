package authn

import (
	"context"
	"fmt"
	"time"

	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"golang.org/x/oauth2"

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "service.authn"

var AlwaysAllowedMethods = []string{
	"/admiral.authn.v1.AuthnAPI/Callback",
	"/admiral.authn.v1.AuthnAPI/Login",
	"/admiral.healthcheck.v1.HealthcheckAPI/*",
}

type TokenKind string

const (
	TokenKindUser    TokenKind = "user"
	TokenKindCluster TokenKind = "cluster"
)

func ParseTokenKind(s string) (TokenKind, error) {
	tokenKindLookup := map[string]TokenKind{
		"user":    TokenKindUser,
		"cluster": TokenKindCluster,
	}

	if k, ok := tokenKindLookup[s]; ok {
		return k, nil
	}
	return "", fmt.Errorf("invalid reference kind %q", s)
}

type Service interface {
	Issuer
	Provider
}

type Provider interface {
	GetStateNonce(ctx context.Context, redirectURL string) (string, error)
	ValidateStateNonce(ctx context.Context, state string) (string, error)
	GetAuthCodeURL(ctx context.Context, state string) (string, error)
	Exchange(ctx context.Context, code string) (*oauth2.Token, error)
	Verify(ctx context.Context, raw string) (*Claims, error)
}

type Issuer interface {
	// TODO: improve options for example, additional claims, generate refresh token, etc.
	CreateToken(ctx context.Context, subject string, tokenKind TokenKind, expiry *time.Duration) (*oauth2.Token, error)
	RefreshToken(ctx context.Context, token *oauth2.Token) (*oauth2.Token, error)
	RevokeToken(ctx context.Context, token *oauth2.Token) error
}

func New(cfg *config.Config, logger *zap.Logger, _ tally.Scope) (service.Service, error) {
	db, err := service.GetService[database.Service]("service.database")
	if err != nil {
		return nil, err
	}

	store, err := newStore(cfg, db.GormDB())
	if err != nil {
		return nil, err
	}

	return NewOIDCProvider(cfg, logger, store)
}
