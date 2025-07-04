package client

import "time"

// DefaultHost is the default hostname for the gRPC server.
const DefaultHost = "localhost"

// DefaultPort is the default port for the gRPC server.
const DefaultPort = 9443

// DefaultDialTimeout is the default timeout for establishing a gRPC connection.
const DefaultDialTimeout = 30 * time.Second

// DefaultKeepAliveTime is the default interval for sending keepalive pings.
const DefaultKeepAliveTime = 30 * time.Second

// DefaultKeepAliveTimeout is the default timeout for keepalive ping responses.
const DefaultKeepAliveTimeout = 90 * time.Second
