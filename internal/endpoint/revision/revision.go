package revision

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"

	"github.com/google/uuid"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"

	revisionv1 "go.admiral.io/admiral/api/revision/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/model"
	"go.admiral.io/admiral/internal/querybuilder"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
	"go.admiral.io/admiral/internal/service/objectstorage"
)

const Name = "endpoint.revision"

type api struct {
	sqlDb        *sql.DB
	gormDB       *gorm.DB
	queryBuilder querybuilder.QueryBuilder
	storage      objectstorage.Service
	bucket       string
	logger       *zap.Logger
	scope        tally.Scope
}

func New(cfg *config.Config, log *zap.Logger, scope tally.Scope) (endpoint.Endpoint, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config is nil")
	}

	dbService, err := service.GetService[database.Service]("service.database")
	if err != nil {
		return nil, err
	}

	storageService, err := service.GetService[objectstorage.Service]("service.objectstorage")
	if err != nil {
		return nil, err
	}

	if cfg.Endpoints.Revision.BucketName == "" {
		return nil, fmt.Errorf("revision bucket_name is required")
	}

	api := &api{
		sqlDb:        dbService.DB(),
		gormDB:       dbService.GormDB(),
		queryBuilder: querybuilder.New([]string{"name"}),
		storage:      storageService,
		bucket:       cfg.Endpoints.Revision.BucketName,
		logger:       log.Named("revision"),
		scope:        scope.SubScope("revision"),
	}
	return api, nil
}

func (a *api) Register(r endpoint.Registrar) error {
	revisionv1.RegisterRevisionAPIServer(r.GRPCServer(), a)
	return r.RegisterJSONGateway(revisionv1.RegisterRevisionAPIHandler)
}

func (a *api) CreateRevision(ctx context.Context, req *revisionv1.CreateRevisionRequest) (*revisionv1.CreateRevisionResponse, error) {
	applicationId, err := uuid.Parse(req.GetApplicationId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "application id is not a valid uuid")
	}
	environmentId, err := uuid.Parse(req.GetEnvironmentId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "environment id is not a valid uuid")
	}
	var variables []*model.Variable
	err = a.gormDB.WithContext(ctx).Raw(`
        SELECT
            DISTINCT ON (key)
                id,
                application_id,
                environment_id,
                key,
                value,
                is_sensitive,
                created_at,
                updated_at,
                deleted_at
        FROM
            variables
        WHERE
            (application_id = ? AND environment_id = ? AND deleted_at IS NULL) OR
            (application_id = ? AND environment_id IS NULL AND deleted_at IS NULL) OR
            (application_id IS NULL AND environment_id IS NULL AND deleted_at IS NULL)
        ORDER BY
            key,
            CASE
                WHEN environment_id IS NOT NULL THEN 3
                WHEN application_id IS NOT NULL THEN 2
                ELSE 1
            END DESC,
            updated_at DESC
    `, applicationId, environmentId, applicationId).Scan(&variables).Error
	if err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to query variables: %v", err))
	}
	var manifests []*model.Manifest
	err = a.gormDB.WithContext(ctx).
		Where("application_id = ? AND is_latest = ? AND deleted_at IS NULL", applicationId, true).
		Find(&manifests).Error
	if err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to query manifests: %v", err))
	}
	if len(manifests) == 0 {
		return nil, status.Error(codes.FailedPrecondition, "no latest manifests found for the application")
	}
	tempDir, err := os.MkdirTemp("", "admiral-*")
	if err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to create temporary directory: %v", err))
	}
	defer func() {
		if err := os.RemoveAll(tempDir); err != nil {
			a.logger.Error("Failed to clean up temporary directory",
				zap.String("temp_dir", tempDir),
				zap.Error(err))
		}
	}()
	values := make(map[string]string)
	for _, v := range variables {
		if !v.IsSensitive {
			values[v.Key] = v.Value
		}
	}
	processedFiles := make(map[string]string)
	for _, m := range manifests {
		content, err := a.storage.GetObject(ctx, m.StorageBucket, m.StorageKey)
		if err != nil {
			return nil, status.Error(codes.Internal, fmt.Sprintf("failed to download manifest %s from S3: %v", m.Id, err))
		}
		tmpl, err := template.New(m.Id.String()).Parse(string(content))
		if err != nil {
			return nil, status.Error(codes.Internal, fmt.Sprintf("failed to parse template for manifest %s: %v", m.Id, err))
		}
		var processed bytes.Buffer
		if err := tmpl.Execute(&processed, map[string]interface{}{"Values": values}); err != nil {
			return nil, status.Error(codes.Internal, fmt.Sprintf("failed to execute template for manifest %s: %v", m.Id, err))
		}
		filename := m.Name
		if filename == "" {
			filename = fmt.Sprintf("%s.yaml", m.Id.String())
		}
		filePath := filepath.Join(tempDir, filename)
		base, ext := filepath.Base(filename), filepath.Ext(filename)
		for i := 1; ; i++ {
			_, err := os.Stat(filePath)
			if os.IsNotExist(err) {
				break
			}
			if err != nil {
				return nil, status.Error(codes.Internal, fmt.Sprintf("failed to check file existence for %s: %v", filePath, err))
			}
			filename = fmt.Sprintf("%s-%d%s", strings.TrimSuffix(base, ext), i, ext)
			filePath = filepath.Join(tempDir, filename)
		}
		if err := os.WriteFile(filePath, processed.Bytes(), 0600); err != nil {
			return nil, status.Error(codes.Internal, fmt.Sprintf("failed to write processed manifest %s to file %s: %v", m.Id, filePath, err))
		}
		processedFiles[m.Id.String()] = filePath
	}
	var bundle bytes.Buffer
	for _, m := range manifests {
		manifestId := m.Id.String()
		filePath, ok := processedFiles[manifestId]
		if !ok {
			return nil, status.Error(codes.Internal, fmt.Sprintf("missing processed file for manifest %s", manifestId))
		}
		content, err := os.ReadFile(filePath) //nolint:gosec // filePath is controlled and comes from processedFiles map
		if err != nil {
			return nil, status.Error(codes.Internal, fmt.Sprintf("failed to read processed manifest %s from %s: %v", manifestId, filePath, err))
		}
		if len(content) > 0 {
			bundle.WriteString("---\n")
			bundle.Write(content)
		}
	}
	bundleBytes := bundle.Bytes()
	if len(bundleBytes) == 0 {
		return nil, status.Error(codes.InvalidArgument, "no valid processed manifests to bundle")
	}
	hash := sha256.Sum256(bundleBytes)
	checksum := fmt.Sprintf("%x", hash[:])
	revisionId := uuid.New()
	storageKey := fmt.Sprintf("revisions/%s/%s.yaml", environmentId.String(), revisionId.String())
	err = a.storage.PutObject(ctx, a.bucket, storageKey, bundleBytes)
	if err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to upload revision %s to S3: %v", revisionId, err))
	}
	settingSummaries := make([]model.SettingSummary, len(variables))
	for i, s := range variables {
		settingSummaries[i] = model.SettingSummary{
			Id:           s.Id,
			Key:          s.Key,
			SettingValue: s.Value,
			IsSensitive:  s.IsSensitive,
		}
	}
	manifestSummaries := make([]model.ManifestSummary, len(manifests))
	for i, m := range manifests {
		manifestSummaries[i] = model.ManifestSummary{
			Id:            m.Id,
			StorageBucket: m.StorageBucket,
			StorageKey:    m.StorageKey,
			Checksum:      m.Checksum,
			ChecksumType:  m.ChecksumType,
		}
	}
	revision := &model.Revision{
		Id:            revisionId,
		ApplicationId: applicationId,
		EnvironmentId: environmentId,
		Settings:      settingSummaries,
		Manifests:     manifestSummaries,
		StorageBucket: a.bucket,
		StorageKey:    storageKey,
		Checksum:      checksum,
		ChecksumType:  "sha256",
		IsActive:      false,
		Status:        "pending",
	}
	result := a.gormDB.WithContext(ctx).Create(revision)
	if result.Error != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to create revision %s: %v", revisionId, result.Error))
	}

	return &revisionv1.CreateRevisionResponse{Revision: model.ConvertRevisionToProto(revision)}, nil
}
