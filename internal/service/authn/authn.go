package authn

import (
	"context"
	"time"

	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"golang.org/x/oauth2"

	authnv1 "go.admiral.io/admiral/api/authn/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/model"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "service.authn"

var AlwaysAllowedMethods = []string{
	"/admiral.authn.v1.AuthnAPI/Callback",
	"/admiral.authn.v1.AuthnAPI/Login",
	"/admiral.healthcheck.v1.HealthcheckAPI/*",
}

type Provider interface {
	GetStateNonce(ctx context.Context, redirectURL string) (string, error)
	ValidateStateNonce(ctx context.Context, state string) (string, error)
	GetAuthCodeURL(ctx context.Context, state string) (string, error)
	Exchange(ctx context.Context, code string) (*oauth2.Token, error)
	Verify(ctx context.Context, raw string) (*Claims, error)
}

type Issuer interface {
	// TODO: i don't want proto to bleed through to the interface, this needs to change
	CreateToken(ctx context.Context, subjectId string, tokenType authnv1.CreateTokenRequest_TokenType, expiry *time.Duration) (*model.AuthnToken, error)
	RefreshToken(ctx context.Context, token *oauth2.Token) (*oauth2.Token, error)
	//RevokeToken(token *oauth2.Token) error
}

type Service interface {
	Issuer
	Provider
}

func New(cfg *config.Config, logger *zap.Logger, scope tally.Scope) (service.Service, error) {
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
