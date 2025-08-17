package session

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/alexedwards/scs/gormstore"

	"github.com/alexedwards/scs/v2"
	"github.com/uber-go/tally/v4"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
	"go.uber.org/zap"
)

const Name = "service.session"

type srv struct {
	*scs.SessionManager
	logger *zap.Logger
	scope  tally.Scope
}

type Service interface {
	Load(ctx context.Context, token string) (context.Context, error)
	LoadAndSave(next http.Handler) http.Handler
	WriteSessionCookie(ctx context.Context, w http.ResponseWriter, token string, expiry time.Time)
	Commit(ctx context.Context) (string, time.Time, error)
	Destroy(ctx context.Context) error
	Put(ctx context.Context, key string, val interface{})
	Get(ctx context.Context, key string) interface{}
	Pop(ctx context.Context, key string) interface{}
	Remove(ctx context.Context, key string)
	Clear(ctx context.Context) error
	Exists(ctx context.Context, key string) bool
	Keys(ctx context.Context) []string
	RenewToken(ctx context.Context) error
	MergeSession(ctx context.Context, token string) error
	Status(ctx context.Context) scs.Status
	GetString(ctx context.Context, key string) string
	GetBool(ctx context.Context, key string) bool
	GetInt(ctx context.Context, key string) int
	GetInt64(ctx context.Context, key string) int64
	GetInt32(ctx context.Context, key string) int32
	GetFloat(ctx context.Context, key string) float64
	GetBytes(ctx context.Context, key string) []byte
	GetTime(ctx context.Context, key string) time.Time
	PopString(ctx context.Context, key string) string
	PopBool(ctx context.Context, key string) bool
	PopInt(ctx context.Context, key string) int
	PopFloat(ctx context.Context, key string) float64
	PopBytes(ctx context.Context, key string) []byte
	PopTime(ctx context.Context, key string) time.Time
	RememberMe(ctx context.Context, val bool)
	Iterate(ctx context.Context, fn func(context.Context) error) error
	Deadline(ctx context.Context) time.Time
	SetDeadline(ctx context.Context, expire time.Time)
	Token(ctx context.Context) string
}

func New(cfg *config.Config, logger *zap.Logger, scope tally.Scope) (service.Service, error) {
	if err := validateConfig(cfg); err != nil {
		logger.Error("invalid configuration", zap.Error(err))
		return nil, fmt.Errorf("failed to initialize service: %w", err)
	}

	dbService, err := service.GetService[database.Service]("service.database")
	if err != nil {
		return nil, err
	}

	s := &srv{
		SessionManager: scs.New(),
		logger:         logger.Named("session"),
		scope:          scope.SubScope("session"),
	}

	if err := configureSession(cfg, s.SessionManager); err != nil {
		return nil, fmt.Errorf("failed to configure session: %w", err)
	}

	store, err := gormstore.New(dbService.GormDB())
	if err != nil {
		return nil, err
	}
	s.Store = store

	return s, nil
}

func validateConfig(cfg *config.Config) error {
	if cfg == nil {
		return errors.New("configuration is nil: provide a valid configuration")
	}

	session := cfg.Services.Session
	if session == nil {
		// Nil session config is valid - we'll use defaults
		return nil
	}

	if session.Cookie.SameSite != "" {
		switch session.Cookie.SameSite {
		case config.SessionSameSiteLax, config.SessionSameSiteStrict, config.SessionSameSiteNone:
			// Valid values
		default:
			return fmt.Errorf("invalid SameSite mode: %s", session.Cookie.SameSite)
		}
	}

	return nil
}

func configureSession(cfg *config.Config, sm *scs.SessionManager) error {
	session := cfg.Services.Session
	if session == nil {
		// No session configuration provided, use defaults
		return nil
	}

	if session.Lifetime > 0 {
		sm.Lifetime = session.Lifetime
	}

	if session.IdleTimeout > 0 {
		sm.IdleTimeout = session.IdleTimeout
	}

	cookie := session.Cookie
	if cookie.Name != "" {
		sm.Cookie.Name = cookie.Name
	}

	if cookie.Domain != "" {
		sm.Cookie.Domain = cookie.Domain
	}

	if cookie.HttpOnly != nil {
		sm.Cookie.HttpOnly = *cookie.HttpOnly
	}

	if cookie.Secure != nil {
		sm.Cookie.Secure = *cookie.Secure
	}

	if cookie.Persist != nil {
		sm.Cookie.Persist = *cookie.Persist
	}

	var sameSiteMode http.SameSite
	switch cookie.SameSite {
	case config.SessionSameSiteLax:
		sameSiteMode = http.SameSiteLaxMode
	case config.SessionSameSiteStrict:
		sameSiteMode = http.SameSiteStrictMode
	case config.SessionSameSiteNone:
		sameSiteMode = http.SameSiteNoneMode
	case "":
		sameSiteMode = http.SameSiteLaxMode
	default:
		sameSiteMode = http.SameSiteLaxMode
	}
	sm.Cookie.SameSite = sameSiteMode
	sm.Cookie.Path = "/"

	return nil
}
