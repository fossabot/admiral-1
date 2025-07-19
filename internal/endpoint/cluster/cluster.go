package cluster

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	authnv1 "go.admiral.io/admiral/api/authn/v1"
	clusterv1 "go.admiral.io/admiral/api/cluster/v1"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/endpoint"
	"go.admiral.io/admiral/internal/model"
	"go.admiral.io/admiral/internal/querybuilder"
	"go.admiral.io/admiral/internal/service"
	"go.admiral.io/admiral/internal/service/authn"
	"go.admiral.io/admiral/internal/service/database"
)

const Name = "endpoint.cluster"

var maxDuration time.Duration = 1<<63 - 1

type api struct {
	database     *gorm.DB
	queryBuilder querybuilder.QueryBuilder
	issuer       authn.Issuer
	logger       *zap.Logger
	scope        tally.Scope
}

func New(_ *config.Config, log *zap.Logger, scope tally.Scope) (endpoint.Endpoint, error) {
	dbService, err := service.GetService[database.Service]("service.database")
	if err != nil {
		return nil, err
	}

	authnService, err := service.GetService[authn.Service]("service.authn")
	if err != nil {
		return nil, err
	}

	api := &api{
		database:     dbService.GormDB(),
		queryBuilder: querybuilder.New([]string{"name"}),
		issuer:       authnService,
		logger:       log.Named("cluster"),
		scope:        scope.SubScope("cluster"),
	}
	return api, nil
}

func (a *api) Register(r endpoint.Registrar) error {
	clusterv1.RegisterClusterAPIServer(r.GRPCServer(), a)
	return r.RegisterJSONGateway(clusterv1.RegisterClusterAPIHandler)
}

func (a *api) CreateCluster(ctx context.Context, req *clusterv1.CreateClusterRequest) (*clusterv1.CreateClusterResponse, error) {
	metadata := make(datatypes.JSONMap, len(req.Metadata))
	for k, v := range req.Metadata {
		metadata[k] = v
	}

	var cluster model.Cluster
	var accessToken string

	err := a.database.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("name = ? AND deleted_at IS NULL", req.Name).
			First(&model.Cluster{}).Error

		if err == nil {
			return status.Error(codes.AlreadyExists, "cluster name already exists")
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("checking existing cluster: %w", err)
		}

		cluster = model.Cluster{
			Id:       uuid.New(),
			Name:     req.Name,
			Metadata: metadata,
		}

		if err := tx.Create(&cluster).Error; err != nil {
			return fmt.Errorf("creating cluster: %w", err)
		}

		authnToken, err := a.issuer.CreateToken(ctx, cluster.Id.String(), authnv1.CreateTokenRequest_CLUSTER, &maxDuration)
		if err != nil {
			return fmt.Errorf("creating auth token: %w", err)
		}

		tokenId, err := uuid.Parse(authnToken.Id)
		if err != nil {
			return status.Errorf(codes.Internal, "invalid token ID format: %v", err)
		}

		cluster.TokenId = &tokenId
		if err := tx.Save(&cluster).Error; err != nil {
			return fmt.Errorf("saving cluster token: %w", err)
		}

		accessToken = string(authnToken.AccessToken)
		return nil
	})

	if err != nil {
		if st, ok := status.FromError(err); ok {
			return nil, st.Err()
		}
		return nil, status.Error(codes.Internal, "failed to create cluster")
	}

	return &clusterv1.CreateClusterResponse{
		Cluster:     model.ConvertClusterToProto(&cluster),
		AccessToken: accessToken,
	}, nil
}

func (a *api) RegisterCluster(ctx context.Context, req *clusterv1.RegisterClusterRequest) (*clusterv1.RegisterClusterResponse, error) {
	claims, err := authn.ClaimsFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid authentication token")
	}

	subjectID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid subject in token")
	}

	if claims.Kind != string(model.ReferenceKindCluster) {
		return nil, status.Error(codes.Unauthenticated, "invalid token kind")
	}

	var cluster model.Cluster
	result := a.database.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", subjectID).
		First(&cluster)
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "cluster not found")
		}
		return nil, status.Errorf(codes.Internal, "database error: %v", e)
	}

	jwtId, err := uuid.Parse(claims.ID)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid token ID: must be a valid UUID")
	}

	if cluster.TokenId == nil {
		return nil, status.Error(codes.Unauthenticated, "no active token for cluster")
	}
	if *cluster.TokenId != jwtId {
		return nil, status.Error(codes.Unauthenticated, "token is not active for this cluster")
	}

	kubeId, err := uuid.Parse(req.ClusterIdentifier)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid cluster identifier: must be a valid UUID")
	}

	if cluster.ClusterIdentifier != nil && *cluster.ClusterIdentifier != kubeId {
		return nil, status.Error(codes.InvalidArgument, "cluster identifier does not match")
	}

	if cluster.ClusterIdentifier == nil {
		tx := a.database.WithContext(ctx).Begin()
		if tx.Error != nil {
			return nil, status.Errorf(codes.Internal, "failed to start transaction: %v", tx.Error)
		}
		defer func() {
			if tx.Error != nil {
				tx.Rollback()
			}
		}()

		if err := tx.Model(&model.Cluster{}).
			Where("id = ? AND deleted_at IS NULL", cluster.Id).
			UpdateColumn("cluster_identifier", kubeId).Error; err != nil {
			return nil, status.Errorf(codes.Internal, "failed to set cluster identifier: %v", err)
		}

		if err := tx.Commit().Error; err != nil {
			return nil, status.Errorf(codes.Internal, "transaction commit failed: %v", err)
		}
	}

	var updated model.Cluster
	if err := a.database.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", cluster.Id).
		First(&updated).Error; err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch cluster: %v", err)
	}

	return &clusterv1.RegisterClusterResponse{
		Cluster: model.ConvertClusterToProto(&updated),
	}, nil
}

func (a *api) ListClusters(ctx context.Context, req *clusterv1.ListClustersRequest) (*clusterv1.ListClustersResponse, error) {
	var clusters []*model.Cluster
	var nextPageToken string

	effectiveLimit := req.PageSize
	if req.PageSize > 0 {
		effectiveLimit = req.PageSize + 1
	}

	if err := a.database.WithContext(ctx).
		Scopes(a.queryBuilder.PaginatedQuery(req.Filter, effectiveLimit, req.PageToken)).
		Where("deleted_at IS NULL").
		Find(&clusters).Error; err != nil {
		return nil, status.Errorf(codes.Internal, "database error: %v", err)
	}

	if req.PageSize > 0 && len(clusters) > int(req.PageSize) {
		lastCluster := clusters[req.PageSize]
		rawToken := fmt.Sprintf("%d|%s", lastCluster.CreatedAt.Unix(), lastCluster.Id.String())
		nextPageToken = base64.RawURLEncoding.EncodeToString([]byte(rawToken))
		clusters = clusters[:req.PageSize]
	} else {
		nextPageToken = ""
	}

	var pb []*clusterv1.Cluster
	for _, v := range clusters {
		pb = append(pb, model.ConvertClusterToProto(v))
	}

	return &clusterv1.ListClustersResponse{
		Clusters:      pb,
		NextPageToken: nextPageToken,
	}, nil
}

func (a *api) GetCluster(ctx context.Context, req *clusterv1.GetClusterRequest) (*clusterv1.GetClusterResponse, error) {
	var cluster model.Cluster

	result := a.database.WithContext(ctx).First(&cluster, "id = ?", req.GetId())
	if e := result.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "cluster not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &clusterv1.GetClusterResponse{Cluster: model.ConvertClusterToProto(&cluster)}, nil
}

func (a *api) UpdateCluster(ctx context.Context, req *clusterv1.UpdateClusterRequest) (*clusterv1.UpdateClusterResponse, error) {
	var cluster model.Cluster

	fetchResult := a.database.WithContext(ctx).First(&cluster, "id = ?", req.Cluster.GetId())
	if e := fetchResult.Error; e != nil {
		if errors.Is(e, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "cluster not found")
		}
		return nil, status.Error(codes.Internal, e.Error())
	}

	cluster.Name = req.Cluster.GetName()

	saveResult := a.database.Save(&cluster)
	if e := saveResult.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	return &clusterv1.UpdateClusterResponse{Cluster: model.ConvertClusterToProto(&cluster)}, nil
}

func (a *api) DeleteCluster(ctx context.Context, req *clusterv1.DeleteClusterRequest) (*clusterv1.DeleteClusterResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "id is not a valid uuid")
	}

	result := a.database.WithContext(ctx).Delete(&model.Cluster{}, "id = ?", id.String())
	if e := result.Error; e != nil {
		return nil, status.Error(codes.Internal, e.Error())
	}

	if result.RowsAffected == 0 {
		return nil, status.Error(codes.NotFound, "cluster not found")
	}

	return &clusterv1.DeleteClusterResponse{}, nil
}
