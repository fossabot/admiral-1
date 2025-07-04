package validate

import (
	"buf.build/go/protovalidate"
	protovalidatemiddleware "github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/protovalidate"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/middleware"
)

const Name = "middleware.validate"

func New(_ *config.Config, logger *zap.Logger, scope tally.Scope) (middleware.Middleware, error) {
	return &mid{
		logger: logger.Named("validate"),
		scope:  scope.SubScope("validate"),
	}, nil
}

type mid struct {
	logger *zap.Logger
	scope  tally.Scope
}

func (m *mid) UnaryInterceptor() grpc.UnaryServerInterceptor {
	validator, err := protovalidate.New()
	if err != nil {
		panic(err)
	}

	return protovalidatemiddleware.UnaryServerInterceptor(validator)
}
