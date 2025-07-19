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
