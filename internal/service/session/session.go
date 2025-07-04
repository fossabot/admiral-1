package session

import (
	"context"
	"net/http"
	"time"

	"github.com/alexedwards/scs/gormstore"
	"github.com/alexedwards/scs/v2"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "service.session"

type srv struct {
	gormDB *gorm.DB
	logger *zap.Logger
	scope  tally.Scope

	*scs.SessionManager
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

func New(_ *config.Config, logger *zap.Logger, scope tally.Scope) (service.Service, error) {
	dbService, err := service.GetService[database.Service]("service.database")
	if err != nil {
		return nil, err
	}

	s := &srv{
		gormDB:         dbService.GormDB(),
		SessionManager: scs.New(),
		logger:         logger.Named("session"),
		scope:          scope.SubScope("session"),
	}

	store, err := gormstore.New(dbService.GormDB())
	if err != nil {
		return nil, err
	}
	s.Store = store

	return s, nil
}
