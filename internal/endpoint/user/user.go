package user

import (
	"context"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"

	userv1 "go.admiral.io/admiral/api/user/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/model"
	"go.admiral.io/admiral/internal/querybuilder"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/authn"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "endpoint.user"

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
		queryBuilder: querybuilder.New([]string{"email", "name", "given_name", "family_name"}),
		logger:       log.Named("user"),
		scope:        scope.SubScope("user"),
	}
	return api, nil
}

func (a *api) Register(r endpoint.Registrar) error {
	userv1.RegisterUserAPIServer(r.GRPCServer(), a)
	return r.RegisterJSONGateway(userv1.RegisterUserAPIHandler)
}

func (a *api) GetMe(ctx context.Context, _ *userv1.GetMeRequest) (*userv1.GetMeResponse, error) {
	claims, err := authn.ClaimsFromContext(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "unauthenticated")
	}

	var user model.User
	result := a.gormDB.WithContext(ctx).First(&user, "id = ?", claims.Subject)
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "user not found")
		} else {
			return nil, status.Error(codes.Internal, result.Error.Error())
		}
	}

	return &userv1.GetMeResponse{User: model.ConvertUserToProto(&user)}, nil
}

func (a *api) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
	var user model.User

	result := a.gormDB.WithContext(ctx).First(&user, "id = ?", req.GetId())
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "user not found")
		} else {
			return nil, status.Error(codes.Internal, result.Error.Error())
		}
	}

	return &userv1.GetUserResponse{User: model.ConvertUserToProto(&user)}, nil
}

func (a *api) ListUsers(ctx context.Context, req *userv1.ListUsersRequest) (*userv1.ListUsersResponse, error) {
	var users []*model.User
	var nextPageToken string

	effectiveLimit := req.PageSize
	if req.PageSize > 0 {
		effectiveLimit = req.PageSize + 1
	}

	if err := a.gormDB.WithContext(ctx).
		Scopes(a.queryBuilder.PaginatedQuery(req.Filter, effectiveLimit, req.PageToken)).
		Find(&users).Error; err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	if req.PageSize > 0 && len(users) > int(req.PageSize) {
		rawToken := fmt.Sprintf("%d|%s", users[req.PageSize].CreatedAt.Unix(), users[req.PageSize].Id.String())
		nextPageToken = base64.RawURLEncoding.EncodeToString([]byte(rawToken))
		users = users[:req.PageSize]
	} else {
		nextPageToken = ""
	}

	var pb []*userv1.User
	for _, v := range users {
		pb = append(pb, model.ConvertUserToProto(v))
	}

	return &userv1.ListUsersResponse{
		Users:         pb,
		NextPageToken: nextPageToken,
	}, nil
}
