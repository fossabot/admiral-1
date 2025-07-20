package client

import (
	"context"

	applicationv1 "go.admiral.io/admiral/api/application/v1"
	clusterv1 "go.admiral.io/admiral/api/cluster/v1"
	environmentv1 "go.admiral.io/admiral/api/environment/v1"
	healthcheckv1 "go.admiral.io/admiral/api/healthcheck/v1"
	manifestv1 "go.admiral.io/admiral/api/manifest/v1"
	revisionv1 "go.admiral.io/admiral/api/revision/v1"
	variablev1 "go.admiral.io/admiral/api/variable/v1"
	"google.golang.org/grpc"
)

// AdmiralClient defines the interface for the Admiral gRPC client.
// This interface allows for easy mocking and testing of client operations.
type AdmiralClient interface {
	// Connection management
	GetConnection() *grpc.ClientConn
	Close() error

	// Token management
	ValidateToken() error
	GetTokenInfo() (*JWTClaims, error)

	// Version information
	Version() Version

	// Application operations
	CreateApplication(ctx context.Context, request *applicationv1.CreateApplicationRequest) (*applicationv1.CreateApplicationResponse, error)
	ListApplications(ctx context.Context, request *applicationv1.ListApplicationsRequest) (*applicationv1.ListApplicationsResponse, error)
	GetApplication(ctx context.Context, request *applicationv1.GetApplicationRequest) (*applicationv1.GetApplicationResponse, error)
	UpdateApplication(ctx context.Context, request *applicationv1.UpdateApplicationRequest) (*applicationv1.UpdateApplicationResponse, error)
	DeleteApplication(ctx context.Context, request *applicationv1.DeleteApplicationRequest) (*applicationv1.DeleteApplicationResponse, error)

	// Cluster operations
	CreateCluster(ctx context.Context, request *clusterv1.CreateClusterRequest) (*clusterv1.CreateClusterResponse, error)
	ListClusters(ctx context.Context, request *clusterv1.ListClustersRequest) (*clusterv1.ListClustersResponse, error)
	GetCluster(ctx context.Context, request *clusterv1.GetClusterRequest) (*clusterv1.GetClusterResponse, error)
	UpdateCluster(ctx context.Context, request *clusterv1.UpdateClusterRequest) (*clusterv1.UpdateClusterResponse, error)
	DeleteCluster(ctx context.Context, request *clusterv1.DeleteClusterRequest) (*clusterv1.DeleteClusterResponse, error)

	// Environment operations
	CreateEnvironment(ctx context.Context, request *environmentv1.CreateEnvironmentRequest) (*environmentv1.CreateEnvironmentResponse, error)
	ListEnvironments(ctx context.Context, request *environmentv1.ListEnvironmentsRequest) (*environmentv1.ListEnvironmentsResponse, error)
	GetEnvironment(ctx context.Context, request *environmentv1.GetEnvironmentRequest) (*environmentv1.GetEnvironmentResponse, error)
	UpdateEnvironment(ctx context.Context, request *environmentv1.UpdateEnvironmentRequest) (*environmentv1.UpdateEnvironmentResponse, error)
	DeleteEnvironment(ctx context.Context, request *environmentv1.DeleteEnvironmentRequest) (*environmentv1.DeleteEnvironmentResponse, error)

	// Health check operations
	Healthcheck(ctx context.Context, request *healthcheckv1.HealthcheckRequest) (*healthcheckv1.HealthcheckResponse, error)

	// Manifest operations
	CreateManifest(ctx context.Context, request *manifestv1.CreateManifestRequest) (*manifestv1.CreateManifestResponse, error)
	ListManifests(ctx context.Context, request *manifestv1.ListManifestsRequest) (*manifestv1.ListManifestsResponse, error)
	GetManifest(ctx context.Context, request *manifestv1.GetManifestRequest) (*manifestv1.GetManifestResponse, error)
	UpdateManifest(ctx context.Context, request *manifestv1.UpdateManifestRequest) (*manifestv1.UpdateManifestResponse, error)
	DeleteManifest(ctx context.Context, request *manifestv1.DeleteManifestRequest) (*manifestv1.DeleteManifestResponse, error)

	// Revision operations
	CreateRevision(ctx context.Context, request *revisionv1.CreateRevisionRequest) (*revisionv1.CreateRevisionResponse, error)

	// Variable operations
	CreateVariable(ctx context.Context, request *variablev1.CreateVariableRequest) (*variablev1.CreateVariableResponse, error)
	ListVariables(ctx context.Context, request *variablev1.ListVariablesRequest) (*variablev1.ListVariablesResponse, error)
	GetVariable(ctx context.Context, request *variablev1.GetVariableRequest) (*variablev1.GetVariableResponse, error)
	UpdateVariable(ctx context.Context, request *variablev1.UpdateVariableRequest) (*variablev1.UpdateVariableResponse, error)
	DeleteVariable(ctx context.Context, request *variablev1.DeleteVariableRequest) (*variablev1.DeleteVariableResponse, error)
}

// Ensure Client implements AdmiralClient interface
var _ AdmiralClient = (*Client)(nil)
