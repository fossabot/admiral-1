package manifest

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"math"
	"strings"

	"github.com/google/uuid"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gopkg.in/yaml.v3"
	"gorm.io/gorm"

	manifestv1 "go.admiral.io/admiral/api/manifest/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/model"
	"go.admiral.io/admiral/internal/querybuilder"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
	"go.admiral.io/admiral/internal/service/storage"
)

const Name = "endpoint.manifest"

type api struct {
	sqlDb        *sql.DB
	gormDB       *gorm.DB
	queryBuilder querybuilder.QueryBuilder
	storage      storage.Service
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

	storageService, err := service.GetService[storage.Service]("service.storage")
	if err != nil {
		return nil, err
	}

	if cfg.Handlers.Manifest.BucketName == "" {
		return nil, fmt.Errorf("manifest bucket_name is required")
	}

	api := &api{
		sqlDb:  dbService.DB(),
		gormDB: dbService.GormDB(),
		queryBuilder: querybuilder.New([]string{
			"application_id", "version_group_id", "name", "description", "version", "is_latest",
		}),
		storage: storageService,
		bucket:  cfg.Handlers.Manifest.BucketName,
		logger:  log.Named("manifest"),
		scope:   scope.SubScope("manifest"),
	}
	return api, nil
}

func (a *api) Register(r endpoint.Registrar) error {
	manifestv1.RegisterManifestAPIServer(r.GRPCServer(), a)
	return r.RegisterJSONGateway(manifestv1.RegisterManifestAPIHandler)
}

func (a *api) CreateManifest(ctx context.Context, req *manifestv1.CreateManifestRequest) (*manifestv1.CreateManifestResponse, error) {
	applicationId, err := uuid.Parse(req.GetApplicationId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "application id is not a valid uuid")
	}

	var description *string
	if req.GetDescription() != "" {
		desc := req.GetDescription()
		description = &desc
	}

	if err := yaml.Unmarshal(req.FileContent, &struct{}{}); err != nil {
		return nil, status.Error(codes.InvalidArgument, fmt.Sprintf("file content is not valid YAML: %v", err))
	}

	// Check for existing active manifest
	var existing model.Manifest
	if err := a.gormDB.WithContext(ctx).
		Where("application_id = ? AND name = ? AND is_latest = ? AND deleted_at IS NULL", applicationId, req.GetName(), true).
		First(&existing).Error; err == nil {
		return nil, status.Error(codes.AlreadyExists, fmt.Sprintf("active manifest with name %q already exists for application %s", req.GetName(), applicationId))
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to check existing manifest: %v", err))
	}

	// Compute SHA-256 checksum
	hash := sha256.New()
	if _, err := io.Copy(hash, bytes.NewReader(req.FileContent)); err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to compute checksum: %v", err))
	}
	checksum := fmt.Sprintf("%x", hash.Sum(nil))

	// Generate IDs
	manifestId := uuid.New()
	versionGroupId := uuid.New()

	// Configure storage
	path := fmt.Sprintf("manifests/%s/%s/%s", applicationId.String(), versionGroupId.String(), manifestId.String())

	// Upload file to storage
	if err := a.storage.PutObject(ctx, a.bucket, path, req.FileContent); err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to upload file to storage: %v", err))
	}

	// Create manifest
	manifest := model.Manifest{
		Id:             manifestId,
		ApplicationId:  applicationId,
		VersionGroupId: versionGroupId,
		Name:           req.GetName(),
		Description:    description,
		StorageBucket:  a.bucket,
		StorageKey:     path,
		Checksum:       checksum,
		ChecksumType:   "sha256",
		Version:        1,
		IsLatest:       true,
	}

	// Insert into database
	if err := a.gormDB.WithContext(ctx).Create(&manifest).Error; err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "constraint_unique_manifest_active") {
			return nil, status.Error(codes.AlreadyExists, fmt.Sprintf("active manifest with name %q already exists for application %s", req.GetName(), applicationId))
		}
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to create manifest: %v", err))
	}

	return &manifestv1.CreateManifestResponse{Manifest: model.ConvertManifestToProto(&manifest, nil)}, nil
}

func (a *api) ListManifests(ctx context.Context, req *manifestv1.ListManifestsRequest) (*manifestv1.ListManifestsResponse, error) {
	var manifests []*model.Manifest
	var nextPageToken string

	effectiveLimit := req.PageSize
	if req.PageSize > 0 {
		effectiveLimit = req.PageSize + 1
	}

	if err := a.gormDB.WithContext(ctx).
		Scopes(a.queryBuilder.PaginatedQuery(req.Filter, effectiveLimit, req.PageToken)).
		Find(&manifests).Error; err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	if req.PageSize > 0 && len(manifests) > int(req.PageSize) {
		rawToken := fmt.Sprintf("%d|%s", manifests[req.PageSize].CreatedAt.Unix(), manifests[req.PageSize].Id.String())
		nextPageToken = base64.RawURLEncoding.EncodeToString([]byte(rawToken))
		manifests = manifests[:req.PageSize]
	} else {
		nextPageToken = ""
	}

	var pb []*manifestv1.Manifest
	for _, v := range manifests {
		pb = append(pb, model.ConvertManifestToProto(v, nil))
	}

	return &manifestv1.ListManifestsResponse{
		Manifests:     pb,
		NextPageToken: nextPageToken,
	}, nil

}

func (a *api) GetManifest(ctx context.Context, req *manifestv1.GetManifestRequest) (*manifestv1.GetManifestResponse, error) {
	var manifest model.Manifest

	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "version group id is not a valid uuid")
	}

	result := a.gormDB.WithContext(ctx).First(&manifest, "id = ?", id)
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "manifest not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	content, err := a.storage.GetObject(ctx, manifest.StorageBucket, manifest.StorageKey)
	if err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to fetch file content for manifest %s: %v", id, err))
	}

	return &manifestv1.GetManifestResponse{Manifest: model.ConvertManifestToProto(&manifest, &content)}, nil
}

func (a *api) UpdateManifest(ctx context.Context, req *manifestv1.UpdateManifestRequest) (*manifestv1.UpdateManifestResponse, error) {
	// Validate inputs
	applicationId, err := uuid.Parse(req.GetApplicationId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "application id is not a valid uuid")
	}

	versionGroupId, err := uuid.Parse(req.GetVersionGroupId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "version group id is not a valid uuid")
	}

	// Ensure at least one field to update
	updateName := req.Name != nil
	updateDescription := req.Description != nil
	updateFile := len(req.FileContent) > 0 // probably going to break
	if !updateName && !updateDescription && !updateFile {
		return nil, status.Error(codes.InvalidArgument, "at least one of name, description, or file_content must be provided")
	}

	// Fetch latest manifest in the group
	var existing model.Manifest
	if err := a.gormDB.WithContext(ctx).
		Where("application_id = ? AND name = ? AND deleted_at IS NULL", applicationId, req.GetName()).
		First(&existing).Error; err == nil {
		return nil, status.Error(codes.AlreadyExists, fmt.Sprintf("active manifest with name %q already exists for application %s", req.GetName(), applicationId))
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to check existing manifest: %v", err))
	}

	// Perform update in a transaction
	var manifest model.Manifest
	err = a.gormDB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Fetch latest active manifest in the group
		var existing model.Manifest
		if err := tx.
			Where("version_group_id = ? AND application_id = ? AND is_latest = ? AND deleted_at IS NULL", versionGroupId, applicationId, true).
			First(&existing).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return status.Error(codes.NotFound, fmt.Sprintf("no active manifest found for version group %s in application %s", versionGroupId, applicationId))
			}
			return status.Error(codes.Internal, fmt.Sprintf("failed to fetch manifest: %v", err))
		}

		// Check version overflow
		if existing.Version >= math.MaxUint32 {
			return status.Error(codes.InvalidArgument, fmt.Sprintf("version for version group %s has reached maximum (%d)", versionGroupId, math.MaxUint32))
		}

		description := existing.Description
		if updateDescription {
			description = req.Description
		}

		// Check uniqueness for name
		name := existing.Name
		if updateName {
			name = req.GetName()
			var duplicate model.Manifest
			if err := tx.
				Where("application_id = ? AND name = ? AND deleted_at IS NULL AND version_group_id != ?", applicationId, name, versionGroupId).
				First(&duplicate).Error; err == nil {
				return status.Error(codes.AlreadyExists, fmt.Sprintf("cannot rename manifest to %q: name is already used by another active manifest in application %s", name, applicationId))
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				return status.Error(codes.Internal, fmt.Sprintf("failed to check name uniqueness: %v", err))
			}
		}

		// Update existing manifest
		if err := tx.
			Model(&model.Manifest{}).
			Where("id = ?", existing.Id).
			Updates(map[string]interface{}{
				"is_latest": false,
			}).Error; err != nil {
			return status.Error(codes.Internal, fmt.Sprintf("failed to soft-delete existing manifest: %v", err))
		}

		// Validate and process file_content if provided
		manifestId := uuid.New()
		var bucket, checksum, storageKey, checksumType string
		if updateFile {
			// Validate YAML
			if err := yaml.Unmarshal(req.FileContent, &struct{}{}); err != nil {
				return status.Error(codes.InvalidArgument, fmt.Sprintf("file content is not valid YAML: %v", err))
			}

			// Compute checksum
			hash := sha256.New()
			if _, err := io.Copy(hash, bytes.NewReader(req.FileContent)); err != nil {
				return status.Error(codes.Internal, fmt.Sprintf("failed to compute checksum: %v", err))
			}
			checksum = fmt.Sprintf("%x", hash.Sum(nil))
			checksumType = "sha256"

			// Generate new storage path
			storageKey = fmt.Sprintf("manifests/%s/%s/%s", applicationId.String(), versionGroupId.String(), manifestId.String())

			// Upload file
			bucket = a.bucket
			if err := a.storage.PutObject(ctx, bucket, storageKey, req.FileContent); err != nil {
				return status.Error(codes.Internal, fmt.Sprintf("failed to upload file to storage: %v", err))
			}
		} else {
			storageKey = existing.StorageKey
			bucket = existing.StorageBucket
			checksumType = existing.ChecksumType
			checksum = existing.Checksum
		}

		// Create new manifest
		manifest = model.Manifest{
			Id:             manifestId,
			ApplicationId:  applicationId,
			VersionGroupId: versionGroupId,
			Name:           name,
			Description:    description,
			StorageBucket:  bucket,
			StorageKey:     storageKey,
			Checksum:       checksum,
			ChecksumType:   checksumType,
			Version:        existing.Version + 1,
			IsLatest:       true,
		}

		// Insert new manifest
		if err := tx.Create(&manifest).Error; err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "constraint_unique_manifest_active") {
				return status.Error(codes.AlreadyExists, fmt.Sprintf("cannot rename manifest to %q: name is already used by another active manifest in application %s", name, applicationId))
			}
			return status.Error(codes.Internal, fmt.Sprintf("failed to create updated manifest: %v", err))
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &manifestv1.UpdateManifestResponse{Manifest: model.ConvertManifestToProto(&manifest, nil)}, nil
}

func (a *api) DeleteManifest(ctx context.Context, req *manifestv1.DeleteManifestRequest) (*manifestv1.DeleteManifestResponse, error) {
	versionGroupId, err := uuid.Parse(req.GetVersionGroupId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "version group id is not a valid uuid")
	}

	result := a.gormDB.WithContext(ctx).Delete(&model.Manifest{}, "version_group_id = ?", versionGroupId.String())
	if e := result.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	if result.RowsAffected == 0 {
		return nil, status.Error(codes.NotFound, "manifest not found")
	}

	return &manifestv1.DeleteManifestResponse{}, nil
}
