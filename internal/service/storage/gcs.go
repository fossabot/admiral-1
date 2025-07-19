package storage

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"time"

	"cloud.google.com/go/storage"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"

	"go.admiral.io/admiral/internal/config"
)

type gcsService struct {
	client *storage.Client
	logger *zap.Logger
	scope  tally.Scope
	config *config.GCSStorageConfig
}

func newGCSService(cfg *config.GCSStorageConfig, logger *zap.Logger, scope tally.Scope) (Service, error) {
	var opts []option.ClientOption

	switch {
	case cfg.UseADC:
		// Application Default Credentials – no opts needed
	case cfg.CredentialsFile != "":
		opts = append(opts, option.WithCredentialsFile(cfg.CredentialsFile))
	case cfg.CredentialsJSON != "":
		decoded, err := base64.StdEncoding.DecodeString(cfg.CredentialsJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to decode GCS credentials_json: %w", err)
		}
		opts = append(opts, option.WithCredentialsJSON(decoded))
	default:
		logger.Warn("no GCS credentials specified; falling back to ADC")
	}

	client, err := storage.NewClient(context.Background(), opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize GCS client: %w", err)
	}

	return &gcsService{
		client: client,
		logger: logger.Named("storage"),
		scope:  scope.SubScope("storage"),
		config: cfg,
	}, nil
}

func (s *gcsService) GetObject(ctx context.Context, bucket, path string) ([]byte, error) {
	if bucket == "" || path == "" {
		return nil, fmt.Errorf("bucket and path are required")
	}

	reader, err := s.client.Bucket(bucket).Object(path).NewReader(ctx)
	if err != nil {
		return nil, fmt.Errorf("gcs: failed to read object %s/%s: %w", bucket, path, err)
	}
	defer func() { _ = reader.Close() }()

	return io.ReadAll(reader)
}

func (s *gcsService) PutObject(ctx context.Context, bucket, path string, content []byte) error {
	if bucket == "" || path == "" {
		return fmt.Errorf("bucket and path are required")
	}
	if content == nil {
		return fmt.Errorf("content cannot be nil")
	}

	writer := s.client.Bucket(bucket).Object(path).NewWriter(ctx)
	writer.ContentType = "application/octet-stream"

	if _, err := writer.Write(content); err != nil {
		_ = writer.Close()
		return fmt.Errorf("gcs: failed to write object %s/%s: %w", bucket, path, err)
	}

	if err := writer.Close(); err != nil {
		return fmt.Errorf("gcs: failed to finalize object %s/%s: %w", bucket, path, err)
	}
	return nil
}

func (s *gcsService) DeleteObject(ctx context.Context, bucket, path string) error {
	if bucket == "" || path == "" {
		return fmt.Errorf("bucket and path are required")
	}

	err := s.client.Bucket(bucket).Object(path).Delete(ctx)
	if err != nil {
		return fmt.Errorf("gcs: failed to delete object %s/%s: %w", bucket, path, err)
	}
	return nil
}

func (s *gcsService) ListObjects(ctx context.Context, prefix string) ([]Object, error) {
	var results []Object

	it := s.client.Bucket(s.config.Bucket).Objects(ctx, &storage.Query{
		Prefix: prefix,
	})

	for {
		attr, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("gcs: list failed: %w", err)
		}
		results = append(results, Object{
			Name:         attr.Name,
			Size:         attr.Size,
			LastModified: attr.Updated.Format(time.RFC3339),
		})
	}

	return results, nil
}
