package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"

	"go.admiral.io/admiral/internal/config"
)

type s3Service struct {
	client *s3.Client
	logger *zap.Logger
	scope  tally.Scope
	config *config.S3StorageConfig
}

func newS3Service(cfg *config.S3StorageConfig, logger *zap.Logger, scope tally.Scope) (Service, error) {
	if cfg.Region == "" {
		cfg.Region = "us-east-1"
	}

	opts := []func(*awsconfig.LoadOptions) error{
		awsconfig.WithRegion(cfg.Region),
	}

	if cfg.AccessKey != "" && cfg.SecretKey != "" {
		creds := credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, cfg.SessionToken)
		opts = append(opts, awsconfig.WithCredentialsProvider(creds))
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(), opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS SDK config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true
		if cfg.Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		}
	})

	return &s3Service{
		client: client,
		logger: logger.Named("storage"),
		scope:  scope.SubScope("storage"),
		config: cfg,
	}, nil
}

func (s *s3Service) GetObject(ctx context.Context, bucket, path string) ([]byte, error) {
	if bucket == "" || path == "" {
		return nil, fmt.Errorf("bucket and path are required")
	}

	out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get object from %s/%s: %w", bucket, path, err)
	}
	defer func() { _ = out.Body.Close() }()

	return io.ReadAll(out.Body)
}

func (s *s3Service) PutObject(ctx context.Context, bucket, path string, content []byte) error {
	if bucket == "" || path == "" {
		return fmt.Errorf("bucket and path are required")
	}
	if content == nil {
		return fmt.Errorf("content cannot be nil")
	}

	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(path),
		Body:        bytes.NewReader(content),
		ContentType: aws.String("application/octet-stream"),
	})
	if err != nil {
		return fmt.Errorf("failed to put object to %s/%s: %w", bucket, path, err)
	}
	return nil
}

func (s *s3Service) DeleteObject(ctx context.Context, bucket, path string) error {
	if bucket == "" || path == "" {
		return fmt.Errorf("bucket and path are required")
	}

	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(path),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object %s/%s: %w", bucket, path, err)
	}
	return nil
}

func (s *s3Service) ListObjects(ctx context.Context, prefix string) ([]Object, error) {
	var results []Object

	paginator := s3.NewListObjectsV2Paginator(s.client, &s3.ListObjectsV2Input{
		Bucket: &s.config.Bucket,
		Prefix: aws.String(prefix),
	})

	for paginator.HasMorePages() {
		page, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to list objects: %w", err)
		}
		for _, obj := range page.Contents {
			results = append(results, Object{
				Name:         aws.ToString(obj.Key),
				Size:         aws.ToInt64(obj.Size),
				LastModified: obj.LastModified.String(),
			})
		}
	}

	return results, nil
}
