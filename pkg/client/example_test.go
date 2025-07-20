package client_test

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.admiral.io/admiral/pkg/client"
)

func ExampleClient_ValidateToken() {
	// Create a client configuration
	cfg := client.Config{
		HostPort:  "localhost:9443",
		AuthToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.invalid", // Example JWT
		ConnectionOptions: client.ConnectionOptions{
			Insecure: true, // For testing only
		},
	}

	// Create client
	c, err := client.New(context.Background(), cfg)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	defer func() { _ = c.Close() }()

	// Validate token
	if err := c.ValidateToken(); err != nil {
		log.Printf("Token validation failed: %v", err)
		return
	}

	// Get token information
	tokenInfo, err := c.GetTokenInfo()
	if err != nil {
		log.Printf("Failed to get token info: %v", err)
		return
	}

	fmt.Printf("Token subject: %s\n", tokenInfo.Subject)
	fmt.Printf("Token expires in: %v\n", tokenInfo.ExpiresIn())
}

func ExampleJWTClaims_IsExpired() {
	claims := &client.JWTClaims{
		ExpirationTime: time.Now().Add(-1 * time.Hour).Unix(), // Expired 1 hour ago
	}

	if claims.IsExpired() {
		fmt.Println("Token is expired")
	} else {
		fmt.Println("Token is still valid")
	}

	// Output: Token is expired
}

func ExampleJWTClaims_ExpiresIn() {
	claims := &client.JWTClaims{
		ExpirationTime: time.Now().Add(2 * time.Hour).Unix(), // Expires in 2 hours
	}

	expiresIn := claims.ExpiresIn()
	fmt.Printf("Token expires in approximately %.0f minutes\n", expiresIn.Minutes())
}

func ExampleGetVersion() {
	// Get version information for the client library
	version := client.GetVersion()

	fmt.Printf("Client version: %s\n", version.Version)
	fmt.Printf("Git commit: %s\n", version.GitCommit)
	fmt.Printf("Build date: %s\n", version.BuildDate)
	fmt.Printf("Built by: %s\n", version.BuiltBy)
	fmt.Printf("Go version: %s\n", version.GoVersion)
	fmt.Printf("Platform: %s\n", version.Platform)

	// Get formatted version string
	fmt.Printf("Formatted: %s\n", version.String())

	// Get User-Agent string for HTTP requests
	fmt.Printf("User-Agent: %s\n", version.UserAgent())
}

func ExampleClient_Version() {
	// Create a client configuration
	cfg := client.Config{
		HostPort:  "localhost:9443",
		AuthToken: "your-token-here",
		ConnectionOptions: client.ConnectionOptions{
			Insecure: true, // For testing only
		},
	}

	// Create client
	c, err := client.New(context.Background(), cfg)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}
	defer func() { _ = c.Close() }()

	// Get version information from the client instance
	version := c.Version()
	fmt.Printf("Using client version: %s\n", version.String())
}
