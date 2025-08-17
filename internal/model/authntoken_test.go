package model

import (
	"database/sql/driver"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuthnTokenKind(t *testing.T) {
	t.Run("constants", func(t *testing.T) {
		assert.Equal(t, AuthnTokenKind("external"), AuthnTokenKindExternal)
		assert.Equal(t, AuthnTokenKind("user"), AuthnTokenKindUser)
		assert.Equal(t, AuthnTokenKind("cluster"), AuthnTokenKindCluster)
	})

	t.Run("Value method", func(t *testing.T) {
		testCases := []struct {
			name        string
			kind        AuthnTokenKind
			expectedVal driver.Value
			expectError bool
		}{
			{
				name:        "valid external kind",
				kind:        AuthnTokenKindExternal,
				expectedVal: "external",
				expectError: false,
			},
			{
				name:        "valid user kind",
				kind:        AuthnTokenKindUser,
				expectedVal: "user",
				expectError: false,
			},
			{
				name:        "valid cluster kind",
				kind:        AuthnTokenKindCluster,
				expectedVal: "cluster",
				expectError: false,
			},
			{
				name:        "invalid kind",
				kind:        AuthnTokenKind("invalid"),
				expectedVal: nil,
				expectError: true,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				val, err := tc.kind.Value()
				if tc.expectError {
					assert.Error(t, err)
					assert.Nil(t, val)
					assert.Equal(t, "invalid AuthnTokenKind value", err.Error())
				} else {
					assert.NoError(t, err)
					assert.Equal(t, tc.expectedVal, val)
				}
			})
		}
	})

	t.Run("Scan method", func(t *testing.T) {
		testCases := []struct {
			name        string
			input       interface{}
			expected    AuthnTokenKind
			expectError bool
		}{
			{
				name:        "scan from string - external",
				input:       "external",
				expected:    AuthnTokenKind("external"),
				expectError: false,
			},
			{
				name:        "scan from string - user",
				input:       "user",
				expected:    AuthnTokenKind("user"),
				expectError: false,
			},
			{
				name:        "scan from byte slice - cluster",
				input:       []byte("cluster"),
				expected:    AuthnTokenKind("cluster"),
				expectError: false,
			},
			{
				name:        "scan from nil",
				input:       nil,
				expected:    AuthnTokenKind(""),
				expectError: false,
			},
			{
				name:        "scan from invalid type",
				input:       123,
				expected:    AuthnTokenKind(""),
				expectError: true,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				var kind AuthnTokenKind
				err := kind.Scan(tc.input)

				if tc.expectError {
					assert.Error(t, err)
					assert.Contains(t, err.Error(), "cannot scan")
				} else {
					assert.NoError(t, err)
					assert.Equal(t, tc.expected, kind)
				}
			})
		}
	})

	t.Run("String method", func(t *testing.T) {
		testCases := []struct {
			name     string
			kind     AuthnTokenKind
			expected string
		}{
			{
				name:     "external kind",
				kind:     AuthnTokenKindExternal,
				expected: "external",
			},
			{
				name:     "user kind",
				kind:     AuthnTokenKindUser,
				expected: "user",
			},
			{
				name:     "cluster kind",
				kind:     AuthnTokenKindCluster,
				expected: "cluster",
			},
			{
				name:     "invalid kind",
				kind:     AuthnTokenKind("invalid"),
				expected: "",
			},
			{
				name:     "empty kind",
				kind:     AuthnTokenKind(""),
				expected: "",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				result := tc.kind.String()
				assert.Equal(t, tc.expected, result)
			})
		}
	})
}

func TestAuthnToken(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		parentID := uuid.New()
		token := &AuthnToken{
			Id:           uuid.New(),
			ParentID:     &parentID,
			Subject:      "user-123",
			Issuer:       "keycloak",
			Kind:         AuthnTokenKindUser,
			AccessToken:  []byte("access-token-data"),
			RefreshToken: []byte("refresh-token-data"),
			IdToken:      []byte("id-token-data"),
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
			ExpiresAt:    time.Now().Add(time.Hour),
		}

		assert.NotEqual(t, uuid.Nil, token.Id)
		assert.NotNil(t, token.ParentID)
		assert.Equal(t, parentID, *token.ParentID)
		assert.Equal(t, "user-123", token.Subject)
		assert.Equal(t, "keycloak", token.Issuer)
		assert.Equal(t, AuthnTokenKindUser, token.Kind)
		assert.Equal(t, []byte("access-token-data"), token.AccessToken)
		assert.Equal(t, []byte("refresh-token-data"), token.RefreshToken)
		assert.Equal(t, []byte("id-token-data"), token.IdToken)
		assert.False(t, token.CreatedAt.IsZero())
		assert.False(t, token.UpdatedAt.IsZero())
		assert.False(t, token.ExpiresAt.IsZero())
	})

	t.Run("nil parent ID", func(t *testing.T) {
		token := &AuthnToken{
			Id:           uuid.New(),
			ParentID:     nil,
			Subject:      "cluster-abc",
			Issuer:       "keycloak",
			Kind:         AuthnTokenKindCluster,
			AccessToken:  []byte("access-token"),
			RefreshToken: []byte("refresh-token"),
			IdToken:      []byte("id-token"),
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
			ExpiresAt:    time.Now().Add(time.Hour),
		}

		assert.Nil(t, token.ParentID)
		assert.Equal(t, AuthnTokenKindCluster, token.Kind)
		assert.Equal(t, "cluster-abc", token.Subject)
	})

	t.Run("empty token data", func(t *testing.T) {
		token := &AuthnToken{
			Id:           uuid.New(),
			Subject:      "user-456",
			Issuer:       "provider",
			Kind:         AuthnTokenKindUser,
			AccessToken:  []byte{},
			RefreshToken: nil,
			IdToken:      []byte{},
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
			ExpiresAt:    time.Now().Add(time.Hour),
		}

		assert.Empty(t, token.AccessToken)
		assert.Nil(t, token.RefreshToken)
		assert.Empty(t, token.IdToken)
	})

	t.Run("zero values", func(t *testing.T) {
		token := &AuthnToken{}

		assert.Equal(t, uuid.Nil, token.Id)
		assert.Nil(t, token.ParentID)
		assert.Empty(t, token.Subject)
		assert.Empty(t, token.Issuer)
		assert.Equal(t, AuthnTokenKind(""), token.Kind)
		assert.Nil(t, token.AccessToken)
		assert.Nil(t, token.RefreshToken)
		assert.Nil(t, token.IdToken)
		assert.True(t, token.CreatedAt.IsZero())
		assert.True(t, token.UpdatedAt.IsZero())
		assert.True(t, token.ExpiresAt.IsZero())
	})

	t.Run("ToOAuth2Token method", func(t *testing.T) {
		expiry := time.Now().Add(time.Hour)
		token := &AuthnToken{
			AccessToken:  []byte("test-access-token"),
			RefreshToken: []byte("test-refresh-token"),
			IdToken:      []byte("test-id-token"),
			ExpiresAt:    expiry,
		}

		oauth2Token := token.ToOAuth2Token()

		assert.Equal(t, "test-access-token", oauth2Token.AccessToken)
		assert.Equal(t, "test-refresh-token", oauth2Token.RefreshToken)
		assert.Equal(t, "Bearer", oauth2Token.TokenType)
		assert.Equal(t, expiry, oauth2Token.Expiry)

		idToken, ok := oauth2Token.Extra("id_token").(string)
		assert.True(t, ok)
		assert.Equal(t, "test-id-token", idToken)
	})

	t.Run("ToOAuth2Token method with empty refresh and id tokens", func(t *testing.T) {
		expiry := time.Now().Add(time.Hour)
		token := &AuthnToken{
			AccessToken:  []byte("test-access-token"),
			RefreshToken: []byte{},
			IdToken:      nil,
			ExpiresAt:    expiry,
		}

		oauth2Token := token.ToOAuth2Token()

		assert.Equal(t, "test-access-token", oauth2Token.AccessToken)
		assert.Empty(t, oauth2Token.RefreshToken)
		assert.Equal(t, "Bearer", oauth2Token.TokenType)
		assert.Equal(t, expiry, oauth2Token.Expiry)

		_, ok := oauth2Token.Extra("id_token").(string)
		assert.False(t, ok)
	})

	t.Run("external token type", func(t *testing.T) {
		token := &AuthnToken{
			Id:      uuid.New(),
			Subject: "external-provider-sub",
			Kind:    AuthnTokenKindExternal,
		}

		assert.Equal(t, AuthnTokenKindExternal, token.Kind)
		assert.Equal(t, "external-provider-sub", token.Subject)
	})

	t.Run("TableName method", func(t *testing.T) {
		token := &AuthnToken{}
		assert.Equal(t, "authn_tokens", token.TableName())
	})
}

// Benchmark tests for performance
func BenchmarkAuthnTokenKindValue(b *testing.B) {
	kind := AuthnTokenKindUser

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = kind.Value()
	}
}

func BenchmarkAuthnTokenKindString(b *testing.B) {
	kind := AuthnTokenKindUser

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = kind.String()
	}
}

func BenchmarkToOAuth2Token(b *testing.B) {
	token := &AuthnToken{
		AccessToken:  []byte("test-access-token"),
		RefreshToken: []byte("test-refresh-token"),
		IdToken:      []byte("test-id-token"),
		ExpiresAt:    time.Now().Add(time.Hour),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = token.ToOAuth2Token()
	}
}
