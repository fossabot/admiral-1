package client

import (
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"strings"
	"sync/atomic"

	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	ggzip "google.golang.org/grpc/encoding/gzip"

	applicationv1 "go.admiral.io/admiral/api/application/v1"
	clusterv1 "go.admiral.io/admiral/api/cluster/v1"
	environmentv1 "go.admiral.io/admiral/api/environment/v1"
	healthcheckv1 "go.admiral.io/admiral/api/healthcheck/v1"
	manifestv1 "go.admiral.io/admiral/api/manifest/v1"
	revisionv1 "go.admiral.io/admiral/api/revision/v1"
	userv1 "go.admiral.io/admiral/api/user/v1"
	variablev1 "go.admiral.io/admiral/api/variable/v1"
)

func init() {
	if err := ggzip.SetLevel(gzip.BestSpeed); err != nil {
		panic(err)
	}
}

type Client struct {
	config     Config
	conn       *grpc.ClientConn
	grpc       serviceClient
	closedFlag int32
}

type serviceClient struct {
	applicationv1.ApplicationAPIClient
	clusterv1.ClusterAPIClient
	environmentv1.EnvironmentAPIClient
	healthcheckv1.HealthcheckAPIClient
	manifestv1.ManifestAPIClient
	revisionv1.RevisionAPIClient
	variablev1.VariableAPIClient
	userv1.UserAPIClient
}

func New(ctx context.Context, cfg Config) (*Client, error) {
	if err := cfg.CheckAndSetDefaults(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	client := &Client{
		config: cfg,
	}
	if err := client.dialGRPC(ctx, cfg.HostPort); err != nil {
		return nil, fmt.Errorf("failed to connect to %v: %w", cfg.HostPort, err)
	}
	return client, nil
}

func (c *Client) dialGRPC(ctx context.Context, hostPort string) error {
	dialContext, cancel := context.WithTimeout(ctx, c.config.ConnectionOptions.DialTimeout)
	defer cancel()

	var dialOpts []grpc.DialOption
	dialOpts = append(dialOpts,
		grpc.WithUserAgent(fmt.Sprintf("admiral-cli/%s", "0.0.0")),
	)

	if c.config.ConnectionOptions.Insecure {
		dialOpts = append(dialOpts, grpc.WithTransportCredentials(insecure.NewCredentials()))
	} else {
		dialOpts = append(dialOpts, grpc.WithTransportCredentials(credentials.NewTLS(c.config.ConnectionOptions.TLSConfig)))
	}
	dialOpts = append(dialOpts, c.config.ConnectionOptions.DialOptions...)

	conn, err := grpc.NewClient(hostPort, dialOpts...)
	if err != nil {
		return fmt.Errorf("dialGRPC: failed to create client: %w", err)
	}

	conn.Connect()

	for state := conn.GetState(); state != connectivity.Ready; state = conn.GetState() {
		if !conn.WaitForStateChange(dialContext, state) {
			_ = conn.Close()
			return fmt.Errorf("dialGRPC: connection to %s not ready after timeout: %w", hostPort, dialContext.Err())
		}
		if dialContext.Err() != nil {
			_ = conn.Close()
			return fmt.Errorf("dialGRPC: context canceled or timed out: %w", dialContext.Err())
		}
	}

	c.conn = conn
	c.grpc = serviceClient{
		ApplicationAPIClient: applicationv1.NewApplicationAPIClient(c.conn),
		ClusterAPIClient:     clusterv1.NewClusterAPIClient(c.conn),
		EnvironmentAPIClient: environmentv1.NewEnvironmentAPIClient(c.conn),
		HealthcheckAPIClient: healthcheckv1.NewHealthcheckAPIClient(c.conn),
		ManifestAPIClient:    manifestv1.NewManifestAPIClient(c.conn),
		RevisionAPIClient:    revisionv1.NewRevisionAPIClient(c.conn),
		VariableAPIClient:    variablev1.NewVariableAPIClient(c.conn),
		UserAPIClient:        userv1.NewUserAPIClient(c.conn),
	}

	return nil
}

func (c *Client) GetConnection() *grpc.ClientConn {
	if c.isClosed() {
		return nil
	}
	return c.conn
}

func (c *Client) Close() error {
	if !c.setClosed() {
		return nil
	}
	if c.conn == nil {
		return nil
	}
	err := c.conn.Close()
	if err != nil {
		c.config.Logger.Printf("Failed to close gRPC connection: %v", err)
	}
	c.config.Logger.Printf("Closed gRPC connection")
	return err
}

func (c *Client) isClosed() bool {
	return atomic.LoadInt32(&c.closedFlag) == 1
}

func (c *Client) setClosed() bool {
	return atomic.CompareAndSwapInt32(&c.closedFlag, 0, 1)
}

// ValidateToken validates the current auth token for format and expiration.
// This can be called periodically to check if the token needs to be refreshed.
func (c *Client) ValidateToken() error {
	if c.isClosed() {
		return errors.New("client is closed")
	}
	return validateAuthToken(c.config.AuthToken)
}

// GetTokenInfo returns information about the current auth token.
// Returns nil if the token is not a valid JWT.
func (c *Client) GetTokenInfo() (*JWTClaims, error) {
	if c.isClosed() {
		return nil, errors.New("client is closed")
	}

	actualToken := strings.TrimPrefix(c.config.AuthToken, "Bearer ")
	if !strings.Contains(actualToken, ".") {
		return nil, errors.New("token is not a JWT")
	}

	return parseJWTToken(actualToken)
}

func (c *Client) CreateApplication(ctx context.Context, request *applicationv1.CreateApplicationRequest) (*applicationv1.CreateApplicationResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.CreateApplication(ctx, request)
}

func (c *Client) ListApplications(ctx context.Context, request *applicationv1.ListApplicationsRequest) (*applicationv1.ListApplicationsResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.ListApplications(ctx, request)
}

func (c *Client) GetApplication(ctx context.Context, request *applicationv1.GetApplicationRequest) (*applicationv1.GetApplicationResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.GetApplication(ctx, request)
}

func (c *Client) UpdateApplication(ctx context.Context, request *applicationv1.UpdateApplicationRequest) (*applicationv1.UpdateApplicationResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.UpdateApplication(ctx, request)
}

func (c *Client) DeleteApplication(ctx context.Context, request *applicationv1.DeleteApplicationRequest) (*applicationv1.DeleteApplicationResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.DeleteApplication(ctx, request)
}

func (c *Client) CreateCluster(ctx context.Context, request *clusterv1.CreateClusterRequest) (*clusterv1.CreateClusterResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.CreateCluster(ctx, request)
}

func (c *Client) ListClusters(ctx context.Context, request *clusterv1.ListClustersRequest) (*clusterv1.ListClustersResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.ListClusters(ctx, request)
}

func (c *Client) GetCluster(ctx context.Context, request *clusterv1.GetClusterRequest) (*clusterv1.GetClusterResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.GetCluster(ctx, request)
}

func (c *Client) UpdateCluster(ctx context.Context, request *clusterv1.UpdateClusterRequest) (*clusterv1.UpdateClusterResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.UpdateCluster(ctx, request)
}

func (c *Client) DeleteCluster(ctx context.Context, request *clusterv1.DeleteClusterRequest) (*clusterv1.DeleteClusterResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.DeleteCluster(ctx, request)
}

func (c *Client) CreateEnvironment(ctx context.Context, request *environmentv1.CreateEnvironmentRequest) (*environmentv1.CreateEnvironmentResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.CreateEnvironment(ctx, request)
}

func (c *Client) ListEnvironments(ctx context.Context, request *environmentv1.ListEnvironmentsRequest) (*environmentv1.ListEnvironmentsResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.ListEnvironments(ctx, request)
}

func (c *Client) GetEnvironment(ctx context.Context, request *environmentv1.GetEnvironmentRequest) (*environmentv1.GetEnvironmentResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.GetEnvironment(ctx, request)
}

func (c *Client) UpdateEnvironment(ctx context.Context, request *environmentv1.UpdateEnvironmentRequest) (*environmentv1.UpdateEnvironmentResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.UpdateEnvironment(ctx, request)
}

func (c *Client) DeleteEnvironment(ctx context.Context, request *environmentv1.DeleteEnvironmentRequest) (*environmentv1.DeleteEnvironmentResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.DeleteEnvironment(ctx, request)
}

func (c *Client) Healthcheck(ctx context.Context, request *healthcheckv1.HealthcheckRequest) (*healthcheckv1.HealthcheckResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.Healthcheck(ctx, request)
}

func (c *Client) CreateManifest(ctx context.Context, request *manifestv1.CreateManifestRequest) (*manifestv1.CreateManifestResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.CreateManifest(ctx, request)
}

func (c *Client) ListManifests(ctx context.Context, request *manifestv1.ListManifestsRequest) (*manifestv1.ListManifestsResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.ListManifests(ctx, request)
}

func (c *Client) GetManifest(ctx context.Context, request *manifestv1.GetManifestRequest) (*manifestv1.GetManifestResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.GetManifest(ctx, request)
}

func (c *Client) UpdateManifest(ctx context.Context, request *manifestv1.UpdateManifestRequest) (*manifestv1.UpdateManifestResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.UpdateManifest(ctx, request)
}

func (c *Client) DeleteManifest(ctx context.Context, request *manifestv1.DeleteManifestRequest) (*manifestv1.DeleteManifestResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.DeleteManifest(ctx, request)
}

func (c *Client) CreateRevision(ctx context.Context, request *revisionv1.CreateRevisionRequest) (*revisionv1.CreateRevisionResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.CreateRevision(ctx, request)
}

func (c *Client) CreateVariable(ctx context.Context, request *variablev1.CreateVariableRequest) (*variablev1.CreateVariableResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.CreateVariable(ctx, request)
}

func (c *Client) ListVariables(ctx context.Context, request *variablev1.ListVariablesRequest) (*variablev1.ListVariablesResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.ListVariables(ctx, request)
}

func (c *Client) GetVariable(ctx context.Context, request *variablev1.GetVariableRequest) (*variablev1.GetVariableResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.GetVariable(ctx, request)
}

func (c *Client) UpdateVariable(ctx context.Context, request *variablev1.UpdateVariableRequest) (*variablev1.UpdateVariableResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.UpdateVariable(ctx, request)
}

func (c *Client) DeleteVariable(ctx context.Context, request *variablev1.DeleteVariableRequest) (*variablev1.DeleteVariableResponse, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return c.grpc.DeleteVariable(ctx, request)
}
