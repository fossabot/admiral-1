package storage

import (
	"context"
	"fmt"

	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/service"
)

const Name = "service.storage"

type Service interface {
	ListObjects(ctx context.Context, prefix string) ([]Object, error)
	GetObject(ctx context.Context, bucket, path string) ([]byte, error)
	PutObject(ctx context.Context, bucket, path string, content []byte) error
	DeleteObject(ctx context.Context, bucket, path string) error
}

type Object struct {
	Name         string
	Size         int64
	LastModified string
}

func New(cfg *config.Config, logger *zap.Logger, scope tally.Scope) (service.Service, error) {
	switch cfg.Services.Storage.Type {
	case config.StorageTypeS3:
		return newS3Service(cfg.Services.Storage.S3, logger, scope)
	case config.StorageTypeGCS:
		return newGCSService(cfg.Services.Storage.GCS, logger, scope)
	default:
		return nil, fmt.Errorf("unsupported storage type: %q", cfg.Services.Storage.Type)
	}
}
