package variable

import (
	"context"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/uber-go/tally/v4"
	"go.admiral.io/admiral/internal/model"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"

	variablev1 "go.admiral.io/admiral/api/variable/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/querybuilder"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "endpoint.variable"

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
		queryBuilder: querybuilder.New([]string{"application_id", "environment_id", "key", "is_sensitive"}),
		logger:       log.Named("variable"),
		scope:        scope.SubScope("variable"),
	}
	return api, nil
}

func (a *api) Register(r endpoint.Registrar) error {
	variablev1.RegisterVariableAPIServer(r.GRPCServer(), a)
	return r.RegisterJSONGateway(variablev1.RegisterVariableAPIHandler)
}

func (a *api) CreateVariable(ctx context.Context, req *variablev1.CreateVariableRequest) (*variablev1.CreateVariableResponse, error) {
	var applicationId, environmentId *uuid.UUID

	if req.ApplicationId != nil {
		appId, err := uuid.Parse(req.GetApplicationId())
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "application id is not a valid uuid")
		}
		applicationId = &appId
	}

	if req.EnvironmentId != nil {
		envId, err := uuid.Parse(req.GetEnvironmentId())
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "application id is not a valid uuid")
		}
		environmentId = &envId
	}

	var description *string
	if req.GetDescription() != "" {
		desc := req.GetDescription()
		description = &desc
	}

	variable := model.Variable{
		ApplicationId: applicationId,
		EnvironmentId: environmentId,
		Key:           req.GetKey(),
		Value:         req.GetValue(),
		Description:   description,
		IsSensitive:   req.GetIsSensitive(),
	}

	result := a.gormDB.WithContext(ctx).Create(&variable)
	if result.Error != nil {
		return nil, status.Error(codes.Internal, result.Error.Error())
	}

	return &variablev1.CreateVariableResponse{Variable: model.ConvertVariableToProto(&variable)}, nil
}

func (a *api) ListVariables(ctx context.Context, req *variablev1.ListVariablesRequest) (*variablev1.ListVariablesResponse, error) {
	var variables []*model.Variable
	var nextPageToken string

	var applicationID, environmentID *uuid.UUID
	var otherFilters string
	if req.Filter != "" {
		parsedFilter, err := a.parseSettingFilter(req.Filter)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, fmt.Sprintf("invalid filter: %v", err))
		}
		applicationID = parsedFilter.applicationID
		environmentID = parsedFilter.environmentID
		otherFilters = parsedFilter.otherFilters
	}

	effectiveLimit := querybuilder.DefaultLimit + 1
	if req.PageSize > 0 {
		if req.PageSize > querybuilder.MaxResultLimit {
			return nil, status.Error(codes.InvalidArgument, fmt.Sprintf("page_size exceeds maximum of %d", querybuilder.MaxResultLimit))
		}
		effectiveLimit = req.PageSize + 1
	}

	db := a.gormDB.WithContext(ctx)
	if req.Effective {
		db = a.buildEffectiveQuery(db, applicationID, environmentID, effectiveLimit, req.PageToken)
	} else {
		if environmentID != nil {
			db = db.Where("application_id = ? AND environment_id = ?", applicationID, environmentID)
		} else if applicationID != nil {
			db = db.Where("application_id = ? AND environment_id IS NULL", applicationID)
		} else {
			db = db.Where("application_id IS NULL AND environment_id IS NULL")
		}

		db = db.Scopes(a.queryBuilder.PaginatedQuery(otherFilters, effectiveLimit, req.PageToken))
	}

	if err := db.Find(&variables).Error; err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("failed to query variables: %v", err))
	}

	if req.PageSize > 0 && len(variables) > int(req.PageSize) {
		rawToken := fmt.Sprintf("%d|%s", variables[req.PageSize].CreatedAt.Unix(), variables[req.PageSize].Id.String())
		nextPageToken = base64.RawURLEncoding.EncodeToString([]byte(rawToken))
		variables = variables[:req.PageSize]
	} else {
		nextPageToken = ""
	}

	var pb []*variablev1.Variable
	for _, v := range variables {
		pb = append(pb, model.ConvertVariableToProto(v))
	}

	return &variablev1.ListVariablesResponse{
		Variables:     pb,
		NextPageToken: nextPageToken,
	}, nil
}

func (a *api) GetVariable(ctx context.Context, req *variablev1.GetVariableRequest) (*variablev1.GetVariableResponse, error) {
	var variable model.Variable

	result := a.gormDB.WithContext(ctx).First(&variable, "id = ?", req.GetId())
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "variable not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &variablev1.GetVariableResponse{Variable: model.ConvertVariableToProto(&variable)}, nil
}

func (a *api) UpdateVariable(ctx context.Context, req *variablev1.UpdateVariableRequest) (*variablev1.UpdateVariableResponse, error) {
	var variable model.Variable

	fetchResult := a.gormDB.WithContext(ctx).First(&variable, "id = ?", req.Variable.GetId())
	if e := fetchResult.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "setting not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	var applicationId, environmentId *uuid.UUID
	if req.Variable.GetApplicationId() != "" {
		appId, err := uuid.Parse(req.Variable.GetApplicationId())
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, err.Error())
		}
		applicationId = &appId
	}

	if req.Variable.GetEnvironmentId() != "" {
		envId, err := uuid.Parse(req.Variable.GetEnvironmentId())
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, err.Error())
		}
		environmentId = &envId
	}

	var description *string
	if req.Variable.GetDescription() != "" {
		desc := req.Variable.GetDescription()
		description = &desc
	}

	variable.ApplicationId = applicationId
	variable.EnvironmentId = environmentId
	variable.Key = req.Variable.GetKey()
	variable.Value = req.Variable.GetValue()
	variable.Description = description

	saveResult := a.gormDB.Save(&variable)
	if e := saveResult.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &variablev1.UpdateVariableResponse{Variable: model.ConvertVariableToProto(&variable)}, nil
}

func (a *api) DeleteVariable(ctx context.Context, req *variablev1.DeleteVariableRequest) (*variablev1.DeleteVariableResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not a valid uuid")
	}

	result := a.gormDB.WithContext(ctx).Delete(&model.Variable{}, "id = ?", id.String())
	if e := result.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	if result.RowsAffected == 0 {
		return nil, status.Error(codes.NotFound, "variable not found")
	}

	return &variablev1.DeleteVariableResponse{}, nil
}
