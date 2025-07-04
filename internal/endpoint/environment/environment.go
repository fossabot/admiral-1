package environment

import (
	"context"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"

	environmentv1 "go.admiral.io/admiral/api/environment/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/model"
	"go.admiral.io/admiral/internal/querybuilder"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "endpoint.environment"

type api struct {
	sqlDb        *sql.DB
	gormDB       *gorm.DB
	queryBuilder querybuilder.QueryBuilder
	logger       *zap.Logger
	scope        tally.Scope
}

func New(_ *config.Config, log *zap.Logger, scope tally.Scope) (endpoint.Endpoint, error) {
	dbService, err := service.GetService[database.Service]("service.database")
	if err != nil {
		return nil, err
	}

	api := &api{
		sqlDb:        dbService.DB(),
		gormDB:       dbService.GormDB(),
		queryBuilder: querybuilder.New([]string{"application_id", "cluster_id", "name", "description"}),
		logger:       log.Named("environment"),
		scope:        scope.SubScope("environment"),
	}
	return api, nil
}

func (a *api) Register(r endpoint.Registrar) error {
	environmentv1.RegisterEnvironmentAPIServer(r.GRPCServer(), a)
	return r.RegisterJSONGateway(environmentv1.RegisterEnvironmentAPIHandler)
}

func (a *api) CreateEnvironment(ctx context.Context, req *environmentv1.CreateEnvironmentRequest) (*environmentv1.CreateEnvironmentResponse, error) {
	appId, err := uuid.Parse(req.GetApplicationId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "application id is not a valid uuid")
	}

	var clusterId *uuid.UUID
	if req.ClusterId != nil {
		c, err := uuid.Parse(req.GetClusterId())
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "cluster id is not a valid uuid")
		}
		clusterId = &c
	}

	var namespace *string
	if req.GetNamespace() != "" {
		ns := req.GetNamespace()
		namespace = &ns
	}

	environment := model.Environment{
		ApplicationId: appId,
		ClusterId:     clusterId,
		Name:          req.GetName(),
		Namespace:     namespace,
	}

	result := a.gormDB.WithContext(ctx).Create(&environment)
	if result.Error != nil {
		return nil, status.Error(codes.Internal, result.Error.Error())
	}

	return &environmentv1.CreateEnvironmentResponse{Environment: model.ConvertEnvironmentToProto(&environment)}, nil
}

func (a *api) ListEnvironments(ctx context.Context, req *environmentv1.ListEnvironmentsRequest) (*environmentv1.ListEnvironmentsResponse, error) {
	var environments []*model.Environment
	var nextPageToken string

	effectiveLimit := req.PageSize
	if req.PageSize > 0 {
		effectiveLimit = req.PageSize + 1
	}

	if err := a.gormDB.WithContext(ctx).
		Scopes(a.queryBuilder.PaginatedQuery(req.Filter, effectiveLimit, req.PageToken)).
		Find(&environments).Error; err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	if req.PageSize > 0 && len(environments) > int(req.PageSize) {
		rawToken := fmt.Sprintf("%d|%s", environments[req.PageSize].CreatedAt.Unix(), environments[req.PageSize].Id.String())
		nextPageToken = base64.RawURLEncoding.EncodeToString([]byte(rawToken))
		environments = environments[:req.PageSize]
	} else {
		nextPageToken = ""
	}

	var pb []*environmentv1.Environment
	for _, v := range environments {
		pb = append(pb, model.ConvertEnvironmentToProto(v))
	}

	return &environmentv1.ListEnvironmentsResponse{
		Environments:  pb,
		NextPageToken: nextPageToken,
	}, nil
}

func (a *api) GetEnvironment(ctx context.Context, req *environmentv1.GetEnvironmentRequest) (*environmentv1.GetEnvironmentResponse, error) {
	var environment model.Environment

	result := a.gormDB.WithContext(ctx).First(&environment, "id = ?", req.GetId())
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "environment not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &environmentv1.GetEnvironmentResponse{Environment: model.ConvertEnvironmentToProto(&environment)}, nil
}

func (a *api) UpdateEnvironment(ctx context.Context, req *environmentv1.UpdateEnvironmentRequest) (*environmentv1.UpdateEnvironmentResponse, error) {
	var environment model.Environment

	fetchResult := a.gormDB.WithContext(ctx).First(&environment, "id = ?", req.Environment.GetId())
	if e := fetchResult.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "environment not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	environment.Name = req.Environment.GetName()

	saveResult := a.gormDB.Save(&environment)
	if e := saveResult.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &environmentv1.UpdateEnvironmentResponse{Environment: model.ConvertEnvironmentToProto(&environment)}, nil
}

func (a *api) DeleteEnvironment(ctx context.Context, req *environmentv1.DeleteEnvironmentRequest) (*environmentv1.DeleteEnvironmentResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not a valid uuid")
	}

	result := a.gormDB.WithContext(ctx).Delete(&model.Environment{}, "id = ?", id.String())
	if e := result.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	if result.RowsAffected == 0 {
		return nil, status.Error(codes.NotFound, "environment not found")
	}

	return &environmentv1.DeleteEnvironmentResponse{}, nil
}
