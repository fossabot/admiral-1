package client

import (
	"compress/gzip"
	"context"
	"fmt"
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
			conn.Close()
			return fmt.Errorf("dialGRPC: connection to %s not ready after timeout: %w", hostPort, dialContext.Err())
		}
		if dialContext.Err() != nil {
			conn.Close()
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

func (c *Client) CreateApplication(ctx context.Context, request *applicationv1.CreateApplicationRequest) (*applicationv1.CreateApplicationResponse, error) {
	response, err := c.grpc.CreateApplication(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("CreateApplication: %w", err)
	}
	return response, nil
}

func (c *Client) ListApplications(ctx context.Context, request *applicationv1.ListApplicationsRequest) (*applicationv1.ListApplicationsResponse, error) {
	response, err := c.grpc.ListApplications(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("ListApplications: %w", err)
	}
	return response, nil
}

func (c *Client) GetApplication(ctx context.Context, request *applicationv1.GetApplicationRequest) (*applicationv1.GetApplicationResponse, error) {
	response, err := c.grpc.GetApplication(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("GetApplication: %w", err)
	}
	return response, nil
}

func (c *Client) UpdateApplication(ctx context.Context, request *applicationv1.UpdateApplicationRequest) (*applicationv1.UpdateApplicationResponse, error) {
	response, err := c.grpc.UpdateApplication(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("UpdateApplication: %w", err)
	}
	return response, nil
}

func (c *Client) DeleteApplication(ctx context.Context, request *applicationv1.DeleteApplicationRequest) (*applicationv1.DeleteApplicationResponse, error) {
	response, err := c.grpc.DeleteApplication(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("DeleteApplication: %w", err)
	}
	return response, nil
}

func (c *Client) CreateCluster(ctx context.Context, request *clusterv1.CreateClusterRequest) (*clusterv1.CreateClusterResponse, error) {
	response, err := c.grpc.CreateCluster(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("CreateCluster: %w", err)
	}
	return response, nil
}

func (c *Client) ListClusters(ctx context.Context, request *clusterv1.ListClustersRequest) (*clusterv1.ListClustersResponse, error) {
	response, err := c.grpc.ListClusters(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("ListClusters: %w", err)
	}
	return response, nil
}

func (c *Client) GetCluster(ctx context.Context, request *clusterv1.GetClusterRequest) (*clusterv1.GetClusterResponse, error) {
	response, err := c.grpc.GetCluster(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("GetCluster: %w", err)
	}
	return response, nil
}

func (c *Client) UpdateCluster(ctx context.Context, request *clusterv1.UpdateClusterRequest) (*clusterv1.UpdateClusterResponse, error) {
	response, err := c.grpc.UpdateCluster(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("UpdateCluster: %w", err)
	}
	return response, nil
}

func (c *Client) DeleteCluster(ctx context.Context, request *clusterv1.DeleteClusterRequest) (*clusterv1.DeleteClusterResponse, error) {
	response, err := c.grpc.DeleteCluster(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("DeleteCluster: %w", err)
	}
	return response, nil
}

func (c *Client) CreateEnvironment(ctx context.Context, request *environmentv1.CreateEnvironmentRequest) (*environmentv1.CreateEnvironmentResponse, error) {
	response, err := c.grpc.CreateEnvironment(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("CreateEnvironment: %w", err)
	}
	return response, nil
}

func (c *Client) ListEnvironments(ctx context.Context, request *environmentv1.ListEnvironmentsRequest) (*environmentv1.ListEnvironmentsResponse, error) {
	response, err := c.grpc.ListEnvironments(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("ListEnvironments: %w", err)
	}
	return response, nil
}

func (c *Client) GetEnvironment(ctx context.Context, request *environmentv1.GetEnvironmentRequest) (*environmentv1.GetEnvironmentResponse, error) {
	response, err := c.grpc.GetEnvironment(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("GetEnvironment: %w", err)
	}
	return response, nil
}

func (c *Client) UpdateEnvironment(ctx context.Context, request *environmentv1.UpdateEnvironmentRequest) (*environmentv1.UpdateEnvironmentResponse, error) {
	response, err := c.grpc.UpdateEnvironment(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("UpdateEnvironment: %w", err)
	}
	return response, nil
}

func (c *Client) DeleteEnvironment(ctx context.Context, request *environmentv1.DeleteEnvironmentRequest) (*environmentv1.DeleteEnvironmentResponse, error) {
	response, err := c.grpc.DeleteEnvironment(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("DeleteEnvironment: %w", err)
	}
	return response, nil
}

func (c *Client) Healthcheck(ctx context.Context, request *healthcheckv1.HealthcheckRequest) (*healthcheckv1.HealthcheckResponse, error) {
	response, err := c.grpc.Healthcheck(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("Healthcheck: %w", err)
	}
	return response, nil
}

func (c *Client) CreateManifest(ctx context.Context, request *manifestv1.CreateManifestRequest) (*manifestv1.CreateManifestResponse, error) {
	response, err := c.grpc.CreateManifest(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("CreateManifest: %w", err)
	}
	return response, nil
}

func (c *Client) ListManifests(ctx context.Context, request *manifestv1.ListManifestsRequest) (*manifestv1.ListManifestsResponse, error) {
	response, err := c.grpc.ListManifests(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("ListManifests: %w", err)
	}
	return response, nil
}

func (c *Client) GetManifest(ctx context.Context, request *manifestv1.GetManifestRequest) (*manifestv1.GetManifestResponse, error) {
	response, err := c.grpc.GetManifest(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("GetManifest: %w", err)
	}
	return response, nil
}

func (c *Client) UpdateManifest(ctx context.Context, request *manifestv1.UpdateManifestRequest) (*manifestv1.UpdateManifestResponse, error) {
	response, err := c.grpc.UpdateManifest(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("UpdateManifest: %w", err)
	}
	return response, nil
}

func (c *Client) DeleteManifest(ctx context.Context, request *manifestv1.DeleteManifestRequest) (*manifestv1.DeleteManifestResponse, error) {
	response, err := c.grpc.DeleteManifest(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("DeleteManifest: %w", err)
	}
	return response, nil
}

func (c *Client) CreateRevision(ctx context.Context, request *revisionv1.CreateRevisionRequest) (*revisionv1.CreateRevisionResponse, error) {
	response, err := c.grpc.CreateRevision(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("CreateRevision: %w", err)
	}
	return response, nil
}

func (c *Client) CreateSetting(ctx context.Context, request *variablev1.CreateVariableRequest) (*variablev1.CreateVariableResponse, error) {
	response, err := c.grpc.CreateVariable(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("CreateSetting: %w", err)
	}
	return response, nil
}

func (c *Client) ListSettings(ctx context.Context, request *variablev1.ListVariablesRequest) (*variablev1.ListVariablesResponse, error) {
	response, err := c.grpc.ListVariables(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("ListSettings: %w", err)
	}
	return response, nil
}

func (c *Client) GetSetting(ctx context.Context, request *variablev1.GetVariableRequest) (*variablev1.GetVariableResponse, error) {
	response, err := c.grpc.GetVariable(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("GetSetting: %w", err)
	}
	return response, nil
}

func (c *Client) UpdateSetting(ctx context.Context, request *variablev1.UpdateVariableRequest) (*variablev1.UpdateVariableResponse, error) {
	response, err := c.grpc.UpdateVariable(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("UpdateSetting: %w", err)
	}
	return response, nil
}

func (c *Client) DeleteSetting(ctx context.Context, request *variablev1.DeleteVariableRequest) (*variablev1.DeleteVariableResponse, error) {
	response, err := c.grpc.DeleteVariable(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("DeleteSetting: %w", err)
	}
	return response, nil
}
