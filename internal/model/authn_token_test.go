package model

import (
	"database/sql/driver"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestReferenceKind(t *testing.T) {
	t.Run("constants", func(t *testing.T) {
		assert.Equal(t, ReferenceKind("user"), ReferenceKindUser)
		assert.Equal(t, ReferenceKind("cluster"), ReferenceKindCluster)
	})

	t.Run("Value method", func(t *testing.T) {
		testCases := []struct {
			name        string
			kind        ReferenceKind
			expectedVal driver.Value
			expectError bool
		}{
			{
				name:        "valid user kind",
				kind:        ReferenceKindUser,
				expectedVal: "user",
				expectError: false,
			},
			{
				name:        "valid cluster kind",
				kind:        ReferenceKindCluster,
				expectedVal: "cluster",
				expectError: false,
			},
			{
				name:        "invalid kind",
				kind:        ReferenceKind("invalid"),
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
					assert.Equal(t, "invalid reference_kind value", err.Error())
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
			expected    ReferenceKind
			expectError bool
		}{
			{
				name:        "scan from string",
				input:       "user",
				expected:    ReferenceKind("user"),
				expectError: false,
			},
			{
				name:        "scan from byte slice",
				input:       []byte("cluster"),
				expected:    ReferenceKind("cluster"),
				expectError: false,
			},
			{
				name:        "scan from invalid type",
				input:       123,
				expected:    ReferenceKind(""),
				expectError: true,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				var rk ReferenceKind
				err := rk.Scan(tc.input)

				if tc.expectError {
					assert.Error(t, err)
					assert.Contains(t, err.Error(), "cannot scan")
				} else {
					assert.NoError(t, err)
					assert.Equal(t, tc.expected, rk)
				}
			})
		}
	})

	t.Run("String method", func(t *testing.T) {
		testCases := []struct {
			name     string
			kind     ReferenceKind
			expected string
		}{
			{
				name:     "user kind",
				kind:     ReferenceKindUser,
				expected: "user",
			},
			{
				name:     "cluster kind",
				kind:     ReferenceKindCluster,
				expected: "cluster",
			},
			{
				name:     "invalid kind",
				kind:     ReferenceKind("invalid"),
				expected: "",
			},
			{
				name:     "empty kind",
				kind:     ReferenceKind(""),
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

func TestParseReferenceKind(t *testing.T) {
	testCases := []struct {
		name        string
		input       string
		expected    ReferenceKind
		expectError bool
	}{
		{
			name:        "valid user",
			input:       "user",
			expected:    ReferenceKindUser,
			expectError: false,
		},
		{
			name:        "valid cluster",
			input:       "cluster",
			expected:    ReferenceKindCluster,
			expectError: false,
		},
		{
			name:        "invalid kind",
			input:       "invalid",
			expected:    ReferenceKind(""),
			expectError: true,
		},
		{
			name:        "empty string",
			input:       "",
			expected:    ReferenceKind(""),
			expectError: true,
		},
		{
			name:        "case sensitive",
			input:       "USER",
			expected:    ReferenceKind(""),
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := ParseReferenceKind(tc.input)

			if tc.expectError {
				assert.Error(t, err)
				assert.Equal(t, tc.expected, result)
				assert.Contains(t, err.Error(), "invalid reference kind")
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expected, result)
			}
		})
	}
}

func TestAuthnToken(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		parentID := "parent-token-id"
		token := &AuthnToken{
			Id:            uuid.New().String(),
			ParentID:      &parentID,
			Provider:      "keycloak",
			ReferenceKind: ReferenceKindUser,
			ReferenceId:   uuid.New(),
			AccessToken:   []byte("access-token-data"),
			RefreshToken:  []byte("refresh-token-data"),
			IdToken:       []byte("id-token-data"),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
			ExpiresAt:     time.Now().Add(time.Hour),
		}

		assert.NotEmpty(t, token.Id)
		assert.NotNil(t, token.ParentID)
		assert.Equal(t, parentID, *token.ParentID)
		assert.Equal(t, "keycloak", token.Provider)
		assert.Equal(t, ReferenceKindUser, token.ReferenceKind)
		assert.NotEqual(t, uuid.Nil, token.ReferenceId)
		assert.Equal(t, []byte("access-token-data"), token.AccessToken)
		assert.Equal(t, []byte("refresh-token-data"), token.RefreshToken)
		assert.Equal(t, []byte("id-token-data"), token.IdToken)
		assert.False(t, token.CreatedAt.IsZero())
		assert.False(t, token.UpdatedAt.IsZero())
		assert.False(t, token.ExpiresAt.IsZero())
	})

	t.Run("nil parent ID", func(t *testing.T) {
		token := &AuthnToken{
			Id:            uuid.New().String(),
			ParentID:      nil,
			Provider:      "keycloak",
			ReferenceKind: ReferenceKindCluster,
			ReferenceId:   uuid.New(),
			AccessToken:   []byte("access-token"),
			RefreshToken:  []byte("refresh-token"),
			IdToken:       []byte("id-token"),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
			ExpiresAt:     time.Now().Add(time.Hour),
		}

		assert.Nil(t, token.ParentID)
		assert.Equal(t, ReferenceKindCluster, token.ReferenceKind)
	})

	t.Run("empty token data", func(t *testing.T) {
		token := &AuthnToken{
			Id:            uuid.New().String(),
			Provider:      "provider",
			ReferenceKind: ReferenceKindUser,
			ReferenceId:   uuid.New(),
			AccessToken:   []byte{},
			RefreshToken:  nil,
			IdToken:       []byte{},
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
			ExpiresAt:     time.Now().Add(time.Hour),
		}

		assert.Empty(t, token.AccessToken)
		assert.Nil(t, token.RefreshToken)
		assert.Empty(t, token.IdToken)
	})

	t.Run("zero values", func(t *testing.T) {
		token := &AuthnToken{}

		assert.Empty(t, token.Id)
		assert.Nil(t, token.ParentID)
		assert.Empty(t, token.Provider)
		assert.Equal(t, ReferenceKind(""), token.ReferenceKind)
		assert.Equal(t, uuid.Nil, token.ReferenceId)
		assert.Nil(t, token.AccessToken)
		assert.Nil(t, token.RefreshToken)
		assert.Nil(t, token.IdToken)
		assert.True(t, token.CreatedAt.IsZero())
		assert.True(t, token.UpdatedAt.IsZero())
		assert.True(t, token.ExpiresAt.IsZero())
	})

	t.Run("token references user", func(t *testing.T) {
		referenceId := uuid.New()
		token := &AuthnToken{
			ReferenceKind: ReferenceKindUser,
			ReferenceId:   referenceId,
		}

		assert.Equal(t, ReferenceKindUser, token.ReferenceKind)
		assert.Equal(t, referenceId, token.ReferenceId)
	})

	t.Run("token references cluster", func(t *testing.T) {
		referenceId := uuid.New()
		token := &AuthnToken{
			ReferenceKind: ReferenceKindCluster,
			ReferenceId:   referenceId,
		}

		assert.Equal(t, ReferenceKindCluster, token.ReferenceKind)
		assert.Equal(t, referenceId, token.ReferenceId)
	})
}

// Benchmark tests for performance
func BenchmarkReferenceKindValue(b *testing.B) {
	rk := ReferenceKindUser

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = rk.Value()
	}
}

func BenchmarkParseReferenceKind(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ParseReferenceKind("user")
	}
}
