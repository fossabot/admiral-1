package client

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrInvalidTokenFormat = errors.New("invalid token format")
	ErrTokenExpired       = errors.New("token is expired")
	ErrInvalidClaims      = errors.New("invalid token claims")
)

// JWTClaims represents the standard JWT claims we care about for validation
type JWTClaims struct {
	Issuer         string `json:"iss,omitempty"`
	Subject        string `json:"sub,omitempty"`
	Audience       string `json:"aud,omitempty"`
	ExpirationTime int64  `json:"exp,omitempty"`
	NotBefore      int64  `json:"nbf,omitempty"`
	IssuedAt       int64  `json:"iat,omitempty"`
	JWTId          string `json:"jti,omitempty"`
}

// IsExpired checks if the token is expired based on the exp claim
func (c *JWTClaims) IsExpired() bool {
	if c.ExpirationTime == 0 {
		return false // No expiration set
	}
	return time.Now().Unix() >= c.ExpirationTime
}

// IsNotYetValid checks if the token is not yet valid based on the nbf claim
func (c *JWTClaims) IsNotYetValid() bool {
	if c.NotBefore == 0 {
		return false // No nbf claim set
	}
	return time.Now().Unix() < c.NotBefore
}

// ExpiresIn returns the duration until the token expires
func (c *JWTClaims) ExpiresIn() time.Duration {
	if c.ExpirationTime == 0 {
		return 0 // No expiration
	}
	expTime := time.Unix(c.ExpirationTime, 0)
	return time.Until(expTime)
}

// parseJWTToken parses a JWT token and extracts claims without validating the signature.
// This is sufficient for basic format validation and expiration checking.
// For production use, you should also validate the signature with the appropriate key.
func parseJWTToken(token string) (*JWTClaims, error) {
	// JWT tokens have 3 parts separated by dots: header.payload.signature
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("%w: expected 3 parts separated by '.', got %d", ErrInvalidTokenFormat, len(parts))
	}

	// Decode the payload (second part)
	payload := parts[1]

	// Add padding if necessary for base64 decoding
	if padding := len(payload) % 4; padding != 0 {
		payload += strings.Repeat("=", 4-padding)
	}

	decoded, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to decode payload: %v", ErrInvalidTokenFormat, err)
	}

	var claims JWTClaims
	if err := json.Unmarshal(decoded, &claims); err != nil {
		return nil, fmt.Errorf("%w: failed to parse claims: %v", ErrInvalidClaims, err)
	}

	return &claims, nil
}

// validateAuthToken validates the format and expiration of an auth token.
// It assumes the token is a JWT but gracefully handles non-JWT tokens.
func validateAuthToken(token string) error {
	if token == "" {
		return errors.New("auth token is empty")
	}

	// Check if token looks like a JWT (has Bearer prefix or dot-separated format)
	actualToken := strings.TrimPrefix(token, "Bearer ")

	// If it doesn't look like a JWT (no dots), treat it as an opaque token
	if !strings.Contains(actualToken, ".") {
		// For opaque tokens, just check basic format requirements
		if len(actualToken) < 10 {
			return fmt.Errorf("token appears too short to be valid (length: %d)", len(actualToken))
		}
		return nil // Assume opaque token is valid
	}

	// Parse as JWT
	claims, err := parseJWTToken(actualToken)
	if err != nil {
		return fmt.Errorf("JWT validation failed: %w", err)
	}

	// Check if token is expired
	if claims.IsExpired() {
		return fmt.Errorf("%w: token expired at %v", ErrTokenExpired, time.Unix(claims.ExpirationTime, 0))
	}

	// Check if token is not yet valid
	if claims.IsNotYetValid() {
		return fmt.Errorf("token not yet valid until %v", time.Unix(claims.NotBefore, 0))
	}

	// Warn if token expires soon (within 5 minutes)
	if expiresIn := claims.ExpiresIn(); expiresIn > 0 && expiresIn < 5*time.Minute {
		// Note: In a real implementation, you might want to log this warning
		// instead of returning an error, depending on your requirements
		_ = expiresIn // We'll just note it for now
	}

	return nil
}
