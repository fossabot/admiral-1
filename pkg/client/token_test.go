package client

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"
)

func createTestJWT(claims JWTClaims) string {
	// Create a simple test JWT (header.payload.signature)
	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}

	headerBytes, _ := json.Marshal(header)
	claimsBytes, _ := json.Marshal(claims)

	headerEncoded := base64.URLEncoding.EncodeToString(headerBytes)
	payloadEncoded := base64.URLEncoding.EncodeToString(claimsBytes)

	// Remove padding
	headerEncoded = strings.TrimRight(headerEncoded, "=")
	payloadEncoded = strings.TrimRight(payloadEncoded, "=")

	return fmt.Sprintf("%s.%s.fake_signature", headerEncoded, payloadEncoded)
}

func TestValidateAuthToken(t *testing.T) {
	tests := []struct {
		name    string
		token   string
		wantErr bool
		errType error
	}{
		{
			name:    "empty token",
			token:   "",
			wantErr: true,
		},
		{
			name:    "short opaque token",
			token:   "short",
			wantErr: true,
		},
		{
			name:    "valid opaque token",
			token:   "this-is-a-valid-opaque-token-12345",
			wantErr: false,
		},
		{
			name:    "invalid JWT format",
			token:   "invalid.jwt",
			wantErr: true,
			errType: ErrInvalidTokenFormat,
		},
		{
			name: "valid JWT",
			token: createTestJWT(JWTClaims{
				Subject:        "test-user",
				ExpirationTime: time.Now().Add(1 * time.Hour).Unix(),
				IssuedAt:       time.Now().Unix(),
			}),
			wantErr: false,
		},
		{
			name: "expired JWT",
			token: createTestJWT(JWTClaims{
				Subject:        "test-user",
				ExpirationTime: time.Now().Add(-1 * time.Hour).Unix(),
				IssuedAt:       time.Now().Add(-2 * time.Hour).Unix(),
			}),
			wantErr: true,
			errType: ErrTokenExpired,
		},
		{
			name: "not yet valid JWT",
			token: createTestJWT(JWTClaims{
				Subject:        "test-user",
				ExpirationTime: time.Now().Add(2 * time.Hour).Unix(),
				NotBefore:      time.Now().Add(1 * time.Hour).Unix(),
				IssuedAt:       time.Now().Unix(),
			}),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateAuthToken(tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateAuthToken() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.errType != nil && err != nil {
				if !strings.Contains(err.Error(), tt.errType.Error()) {
					t.Errorf("validateAuthToken() error = %v, want error containing %v", err, tt.errType)
				}
			}
		})
	}
}

func TestParseJWTToken(t *testing.T) {
	testClaims := JWTClaims{
		Subject:        "test-user",
		Issuer:         "test-issuer",
		ExpirationTime: time.Now().Add(1 * time.Hour).Unix(),
		IssuedAt:       time.Now().Unix(),
	}

	token := createTestJWT(testClaims)

	claims, err := parseJWTToken(token)
	if err != nil {
		t.Fatalf("parseJWTToken() error = %v", err)
	}

	if claims.Subject != testClaims.Subject {
		t.Errorf("parseJWTToken() subject = %v, want %v", claims.Subject, testClaims.Subject)
	}

	if claims.Issuer != testClaims.Issuer {
		t.Errorf("parseJWTToken() issuer = %v, want %v", claims.Issuer, testClaims.Issuer)
	}

	if claims.ExpirationTime != testClaims.ExpirationTime {
		t.Errorf("parseJWTToken() exp = %v, want %v", claims.ExpirationTime, testClaims.ExpirationTime)
	}
}

func TestJWTClaims_IsExpired(t *testing.T) {
	tests := []struct {
		name    string
		claims  JWTClaims
		expired bool
	}{
		{
			name: "no expiration",
			claims: JWTClaims{
				ExpirationTime: 0,
			},
			expired: false,
		},
		{
			name: "expired",
			claims: JWTClaims{
				ExpirationTime: time.Now().Add(-1 * time.Hour).Unix(),
			},
			expired: true,
		},
		{
			name: "not expired",
			claims: JWTClaims{
				ExpirationTime: time.Now().Add(1 * time.Hour).Unix(),
			},
			expired: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.claims.IsExpired(); got != tt.expired {
				t.Errorf("JWTClaims.IsExpired() = %v, want %v", got, tt.expired)
			}
		})
	}
}

func TestJWTClaims_ExpiresIn(t *testing.T) {
	// Test token that expires in 1 hour
	claims := JWTClaims{
		ExpirationTime: time.Now().Add(1 * time.Hour).Unix(),
	}

	expiresIn := claims.ExpiresIn()

	// Should be approximately 1 hour (within 1 minute tolerance)
	expected := 1 * time.Hour
	tolerance := 1 * time.Minute

	if expiresIn < expected-tolerance || expiresIn > expected+tolerance {
		t.Errorf("JWTClaims.ExpiresIn() = %v, want approximately %v", expiresIn, expected)
	}

	// Test token with no expiration
	claimsNoExp := JWTClaims{
		ExpirationTime: 0,
	}

	if got := claimsNoExp.ExpiresIn(); got != 0 {
		t.Errorf("JWTClaims.ExpiresIn() for no expiration = %v, want 0", got)
	}
}
