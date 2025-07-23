package temporal

import (
	"fmt"
	"sync"

	"github.com/uber-go/tally/v4"
	temporalclient "go.temporal.io/sdk/client"
	temporaltally "go.temporal.io/sdk/contrib/tally"
	"go.temporal.io/sdk/log"
	"go.uber.org/zap"

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/service"
)

const Name = "service.temporal"

type ClientManager interface {
	GetNamespaceClient(namespace string) (Client, error)
}

type Client interface {
	GetConnection() (temporalclient.Client, error)
}

func New(cfg *config.Config, logger *zap.Logger, scope tally.Scope) (service.Service, error) {
	ret := &clientManagerImpl{
		hostPort:       fmt.Sprintf("%s:%d", cfg.Services.Temporal.Host, cfg.Services.Temporal.Port),
		metricsHandler: temporaltally.NewMetricsHandler(scope),
		logger:         newTemporalLogger(logger),
		copts:          temporalclient.ConnectionOptions{},
	}

	return ret, nil
}

type clientManagerImpl struct {
	hostPort       string
	logger         log.Logger
	metricsHandler temporalclient.MetricsHandler
	copts          temporalclient.ConnectionOptions
}

func (c *clientManagerImpl) GetNamespaceClient(namespace string) (Client, error) {
	return &lazyClientImpl{
		opts: &temporalclient.Options{
			HostPort:          c.hostPort,
			Logger:            c.logger,
			MetricsHandler:    c.metricsHandler,
			Namespace:         namespace,
			ConnectionOptions: c.copts,
		},
	}, nil
}

type lazyClientImpl struct {
	mu           sync.Mutex
	cachedClient temporalclient.Client

	opts *temporalclient.Options
}

func (l *lazyClientImpl) GetConnection() (temporalclient.Client, error) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.cachedClient == nil {
		c, err := temporalclient.Dial(*l.opts)
		if err != nil {
			return nil, err
		}
		l.cachedClient = c
	}

	return l.cachedClient, nil
}
