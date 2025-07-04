package application

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

	applicationv1 "go.admiral.io/admiral/api/application/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/model"
	"go.admiral.io/admiral/internal/querybuilder"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "endpoint.application"

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
		queryBuilder: querybuilder.New([]string{"name"}),
		logger:       log.Named("application"),
		scope:        scope.SubScope("application"),
	}
	return api, nil
}

func (a *api) Register(r endpoint.Registrar) error {
	applicationv1.RegisterApplicationAPIServer(r.GRPCServer(), a)
	return r.RegisterJSONGateway(applicationv1.RegisterApplicationAPIHandler)
}

func (a *api) CreateApplication(ctx context.Context, req *applicationv1.CreateApplicationRequest) (*applicationv1.CreateApplicationResponse, error) {
	var description *string
	if req.GetDescription() != "" {
		desc := req.GetDescription()
		description = &desc
	}

	application := model.Application{
		Name:        req.GetName(),
		Description: description,
	}

	result := a.gormDB.WithContext(ctx).Create(&application)
	if result.Error != nil {
		return nil, status.Error(codes.Internal, result.Error.Error())
	}

	return &applicationv1.CreateApplicationResponse{Application: model.ConvertApplicationToProto(&application)}, nil
}

func (a *api) ListApplications(ctx context.Context, req *applicationv1.ListApplicationsRequest) (*applicationv1.ListApplicationsResponse, error) {
	var applications []*model.Application
	var nextPageToken string

	effectiveLimit := req.PageSize
	if req.PageSize > 0 {
		effectiveLimit = req.PageSize + 1
	}

	if err := a.gormDB.WithContext(ctx).
		Scopes(a.queryBuilder.PaginatedQuery(req.Filter, effectiveLimit, req.PageToken)).
		Find(&applications).Error; err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	if req.PageSize > 0 && len(applications) > int(req.PageSize) {
		rawToken := fmt.Sprintf("%d|%s", applications[req.PageSize].CreatedAt.Unix(), applications[req.PageSize].Id.String())
		nextPageToken = base64.RawURLEncoding.EncodeToString([]byte(rawToken))
		applications = applications[:req.PageSize]
	} else {
		nextPageToken = ""
	}

	var pb []*applicationv1.Application
	for _, v := range applications {
		pb = append(pb, model.ConvertApplicationToProto(v))
	}

	return &applicationv1.ListApplicationsResponse{
		Applications:  pb,
		NextPageToken: nextPageToken,
	}, nil
}

func (a *api) GetApplication(ctx context.Context, req *applicationv1.GetApplicationRequest) (*applicationv1.GetApplicationResponse, error) {
	var application model.Application

	result := a.gormDB.WithContext(ctx).First(&application, "id = ?", req.GetId())
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "application not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &applicationv1.GetApplicationResponse{Application: model.ConvertApplicationToProto(&application)}, nil
}

func (a *api) UpdateApplication(ctx context.Context, req *applicationv1.UpdateApplicationRequest) (*applicationv1.UpdateApplicationResponse, error) {
	var application model.Application

	fetchResult := a.gormDB.WithContext(ctx).First(&application, "id = ?", req.Application.GetId())
	if e := fetchResult.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "application not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	application.Name = req.Application.GetName()

	var description *string
	if req.Application.GetDescription() != "" {
		desc := req.Application.GetDescription()
		description = &desc
	}
	application.Description = description

	saveResult := a.gormDB.Save(&application)
	if e := saveResult.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &applicationv1.UpdateApplicationResponse{Application: model.ConvertApplicationToProto(&application)}, nil
}

func (a *api) DeleteApplication(ctx context.Context, req *applicationv1.DeleteApplicationRequest) (*applicationv1.DeleteApplicationResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not a valid uuid")
	}

	result := a.gormDB.WithContext(ctx).Delete(&model.Application{}, "id = ?", id.String())
	if e := result.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	if result.RowsAffected == 0 {
		return nil, status.Error(codes.NotFound, "application not found")
	}

	return &applicationv1.DeleteApplicationResponse{}, nil
}
