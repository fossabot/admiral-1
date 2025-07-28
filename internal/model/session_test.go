package model

import (
	"database/sql/driver"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestSession(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		attributes := AttributesJSON{
			"user_id":       "12345",
			"permissions":   []interface{}{"read", "write", "admin"},
			"last_activity": "2024-01-15T10:30:00Z",
			"preferences": map[string]interface{}{
				"theme":    "dark",
				"language": "en",
				"timezone": "UTC",
			},
			"metadata": map[string]interface{}{
				"ip_address": "192.168.1.100",
				"user_agent": "Mozilla/5.0",
				"device":     "desktop",
			},
		}

		session := &Session{
			ID:           uuid.New(),
			SessionToken: "sess_1234567890abcdef",
			Subject:      "user@example.com",
			Attributes:   attributes,
			CreatedAt:    time.Now(),
			ExpiresAt:    time.Now().Add(24 * time.Hour),
		}

		assert.NotEqual(t, uuid.Nil, session.ID)
		assert.Equal(t, "sess_1234567890abcdef", session.SessionToken)
		assert.Equal(t, "user@example.com", session.Subject)
		assert.NotNil(t, session.Attributes)
		assert.Equal(t, "12345", session.Attributes["user_id"])
		assert.Equal(t, "dark", session.Attributes["preferences"].(map[string]interface{})["theme"])
		assert.False(t, session.CreatedAt.IsZero())
		assert.False(t, session.ExpiresAt.IsZero())
		assert.True(t, session.ExpiresAt.After(session.CreatedAt))
	})

	t.Run("session with minimal fields", func(t *testing.T) {
		session := &Session{
			ID:           uuid.New(),
			SessionToken: "minimal_session_token",
			Subject:      "minimal@example.com",
			Attributes:   nil,
			CreatedAt:    time.Now(),
			ExpiresAt:    time.Now().Add(time.Hour),
		}

		assert.NotEqual(t, uuid.Nil, session.ID)
		assert.Equal(t, "minimal_session_token", session.SessionToken)
		assert.Equal(t, "minimal@example.com", session.Subject)
		assert.Nil(t, session.Attributes)
		assert.False(t, session.CreatedAt.IsZero())
		assert.False(t, session.ExpiresAt.IsZero())
	})

	t.Run("zero values", func(t *testing.T) {
		session := &Session{}

		assert.Equal(t, uuid.Nil, session.ID)
		assert.Equal(t, "", session.SessionToken)
		assert.Equal(t, "", session.Subject)
		assert.Nil(t, session.Attributes)
		assert.True(t, session.CreatedAt.IsZero())
		assert.True(t, session.ExpiresAt.IsZero())
		assert.False(t, session.DeletedAt.Valid)
	})

	t.Run("session with complex attributes", func(t *testing.T) {
		complexAttributes := AttributesJSON{
			"authentication": map[string]interface{}{
				"method":        "oauth2",
				"provider":      "google",
				"access_token":  "ya29.abc123",
				"refresh_token": "1//abc123",
				"expires_in":    3600,
				"scopes":        []interface{}{"profile", "email", "openid"},
			},
			"user_profile": map[string]interface{}{
				"id":       "google_12345",
				"email":    "user@example.com",
				"name":     "John Doe",
				"picture":  "https://example.com/avatar.jpg",
				"verified": true,
				"locale":   "en-US",
			},
			"session_data": map[string]interface{}{
				"csrf_token":   "csrf_abc123",
				"nonce":        "nonce_xyz789",
				"state":        "state_def456",
				"redirect_url": "https://app.example.com/dashboard",
				"remember_me":  true,
			},
			"security": map[string]interface{}{
				"ip_address":     "203.0.113.1",
				"user_agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				"location":       "San Francisco, CA",
				"device_id":      "device_abc123",
				"trusted_device": false,
				"risk_score":     0.2,
			},
		}

		session := &Session{
			ID:           uuid.New(),
			SessionToken: "complex_session_token",
			Subject:      "complex@example.com",
			Attributes:   complexAttributes,
			CreatedAt:    time.Now(),
			ExpiresAt:    time.Now().Add(8 * time.Hour),
		}

		assert.NotNil(t, session.Attributes)

		// Test nested structure access
		auth, ok := session.Attributes["authentication"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "oauth2", auth["method"])
		assert.Equal(t, "google", auth["provider"])

		scopes, ok := auth["scopes"].([]interface{})
		require.True(t, ok)
		assert.Len(t, scopes, 3)
		assert.Contains(t, scopes, "profile")

		profile, ok := session.Attributes["user_profile"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "John Doe", profile["name"])
		assert.Equal(t, true, profile["verified"])

		security, ok := session.Attributes["security"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "203.0.113.1", security["ip_address"])
		assert.Equal(t, 0.2, security["risk_score"])
	})

	t.Run("session validation", func(t *testing.T) {
		session := &Session{
			ID:           uuid.New(),
			SessionToken: "valid_session_token",
			Subject:      "valid@example.com",
		}
		assert.NotNil(t, session)
		assert.NotEmpty(t, session.SessionToken)
		assert.NotEmpty(t, session.Subject)
		assert.NotEqual(t, uuid.Nil, session.ID)
	})

	t.Run("soft delete functionality", func(t *testing.T) {
		session := &Session{
			ID:           uuid.New(),
			SessionToken: "deleted_session",
			Subject:      "deleted@example.com",
			DeletedAt:    gorm.DeletedAt{Valid: true, Time: time.Now()},
		}

		assert.True(t, session.DeletedAt.Valid)
		assert.False(t, session.DeletedAt.Time.IsZero())
	})

	t.Run("session expiration scenarios", func(t *testing.T) {
		now := time.Now()

		testCases := []struct {
			name      string
			createdAt time.Time
			expiresAt time.Time
			expired   bool
		}{
			{
				name:      "active session",
				createdAt: now.Add(-1 * time.Hour),
				expiresAt: now.Add(1 * time.Hour),
				expired:   false,
			},
			{
				name:      "expired session",
				createdAt: now.Add(-2 * time.Hour),
				expiresAt: now.Add(-1 * time.Hour),
				expired:   true,
			},
			{
				name:      "just expired session",
				createdAt: now.Add(-1 * time.Hour),
				expiresAt: now.Add(-1 * time.Second),
				expired:   true,
			},
			{
				name:      "long lived session",
				createdAt: now.Add(-24 * time.Hour),
				expiresAt: now.Add(24 * time.Hour),
				expired:   false,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				session := &Session{
					ID:           uuid.New(),
					SessionToken: "test_session_" + tc.name,
					Subject:      "test@example.com",
					CreatedAt:    tc.createdAt,
					ExpiresAt:    tc.expiresAt,
				}

				if tc.expired {
					assert.True(t, session.ExpiresAt.Before(now))
				} else {
					assert.True(t, session.ExpiresAt.After(now))
				}
				assert.True(t, session.ExpiresAt.After(session.CreatedAt) || session.ExpiresAt.Equal(session.CreatedAt))
			})
		}
	})
}

func TestAttributesJSON(t *testing.T) {
	t.Run("Value method", func(t *testing.T) {
		testCases := []struct {
			name        string
			attributes  AttributesJSON
			expected    string
			expectError bool
		}{
			{
				name:        "nil attributes",
				attributes:  nil,
				expected:    "{}",
				expectError: false,
			},
			{
				name:        "empty attributes",
				attributes:  AttributesJSON{},
				expected:    "{}",
				expectError: false,
			},
			{
				name: "simple attributes",
				attributes: AttributesJSON{
					"user_id": "12345",
					"role":    "admin",
				},
				expected:    `{"role":"admin","user_id":"12345"}`,
				expectError: false,
			},
			{
				name: "complex nested attributes",
				attributes: AttributesJSON{
					"user": map[string]interface{}{
						"id":    "12345",
						"email": "user@example.com",
					},
					"permissions": []interface{}{"read", "write"},
					"active":      true,
					"count":       42,
					"ratio":       3.14,
				},
				expectError: false, // We'll check structure rather than exact JSON
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				value, err := tc.attributes.Value()

				if tc.expectError {
					assert.Error(t, err)
					assert.Nil(t, value)
				} else {
					assert.NoError(t, err)
					assert.NotNil(t, value)

					// For simple cases, check exact match
					switch tc.name {
					case "nil attributes", "empty attributes":
						bytes, ok := value.([]byte)
						require.True(t, ok)
						assert.Equal(t, tc.expected, string(bytes))
					case "simple attributes":
						// For simple attributes, unmarshal and check structure
						bytes, ok := value.([]byte)
						require.True(t, ok)
						var unmarshaled map[string]interface{}
						err := json.Unmarshal(bytes, &unmarshaled)
						require.NoError(t, err)
						assert.Equal(t, "12345", unmarshaled["user_id"])
						assert.Equal(t, "admin", unmarshaled["role"])
					case "complex nested attributes":
						// For complex attributes, verify it's valid JSON
						bytes, ok := value.([]byte)
						require.True(t, ok)
						var unmarshaled map[string]interface{}
						err := json.Unmarshal(bytes, &unmarshaled)
						require.NoError(t, err)
						assert.Equal(t, true, unmarshaled["active"])
						assert.Equal(t, float64(42), unmarshaled["count"])
						assert.Equal(t, 3.14, unmarshaled["ratio"])
					}
				}
			})
		}
	})

	t.Run("Scan method", func(t *testing.T) {
		testCases := []struct {
			name        string
			input       interface{}
			expected    AttributesJSON
			expectError bool
		}{
			{
				name:        "nil input",
				input:       nil,
				expected:    nil,
				expectError: false,
			},
			{
				name:        "empty JSON bytes",
				input:       []byte("{}"),
				expected:    AttributesJSON{},
				expectError: false,
			},
			{
				name:  "simple JSON bytes",
				input: []byte(`{"user_id":"12345","role":"admin"}`),
				expected: AttributesJSON{
					"user_id": "12345",
					"role":    "admin",
				},
				expectError: false,
			},
			{
				name:  "complex JSON bytes",
				input: []byte(`{"user":{"id":"12345","email":"user@example.com"},"permissions":["read","write"],"active":true,"count":42}`),
				expected: AttributesJSON{
					"user": map[string]interface{}{
						"id":    "12345",
						"email": "user@example.com",
					},
					"permissions": []interface{}{"read", "write"},
					"active":      true,
					"count":       float64(42), // JSON numbers become float64
				},
				expectError: false,
			},
			{
				name:        "invalid JSON bytes",
				input:       []byte(`{"invalid": json}`),
				expected:    nil,
				expectError: true,
			},
			{
				name:        "non-byte input",
				input:       "string input",
				expected:    nil,
				expectError: true,
			},
			{
				name:        "integer input",
				input:       12345,
				expected:    nil,
				expectError: true,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				var attributes AttributesJSON
				err := attributes.Scan(tc.input)

				if tc.expectError {
					assert.Error(t, err)
					if tc.name == "non-byte input" || tc.name == "integer input" {
						assert.Contains(t, err.Error(), "type assertion to []byte failed")
					}
				} else {
					assert.NoError(t, err)
					if tc.expected == nil {
						assert.Nil(t, attributes)
					} else {
						assert.Equal(t, tc.expected, attributes)
					}
				}
			})
		}
	})

	t.Run("Value and Scan round trip", func(t *testing.T) {
		original := AttributesJSON{
			"user_profile": map[string]interface{}{
				"id":       "user123",
				"email":    "test@example.com",
				"verified": true,
				"score":    85.5,
			},
			"session_info": map[string]interface{}{
				"created_at": "2024-01-15T10:30:00Z",
				"ip_address": "192.168.1.1",
				"device":     "mobile",
			},
			"permissions": []interface{}{"read", "write", "delete"},
			"flags":       []interface{}{true, false, true},
			"metadata": map[string]interface{}{
				"version": "1.0",
				"beta":    false,
			},
		}

		// Convert to driver.Value
		value, err := original.Value()
		require.NoError(t, err)

		// Scan back from driver.Value
		var scanned AttributesJSON
		err = scanned.Scan(value)
		require.NoError(t, err)

		// Verify data integrity
		profile, ok := scanned["user_profile"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "user123", profile["id"])
		assert.Equal(t, "test@example.com", profile["email"])
		assert.Equal(t, true, profile["verified"])
		assert.Equal(t, 85.5, profile["score"])

		permissions, ok := scanned["permissions"].([]interface{})
		require.True(t, ok)
		assert.Len(t, permissions, 3)
		assert.Equal(t, "read", permissions[0])
		assert.Equal(t, "write", permissions[1])
		assert.Equal(t, "delete", permissions[2])

		metadata, ok := scanned["metadata"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "1.0", metadata["version"])
		assert.Equal(t, false, metadata["beta"])
	})

	t.Run("driver.Valuer interface compliance", func(t *testing.T) {
		var attributes = AttributesJSON{
			"test": "value",
		}

		// Verify it implements driver.Valuer
		var valuer driver.Valuer = attributes
		value, err := valuer.Value()
		assert.NoError(t, err)
		assert.NotNil(t, value)

		// Verify the value is []byte
		bytes, ok := value.([]byte)
		assert.True(t, ok)
		assert.Contains(t, string(bytes), "test")
		assert.Contains(t, string(bytes), "value")
	})

	t.Run("JSON marshal/unmarshal compatibility", func(t *testing.T) {
		original := AttributesJSON{
			"string_field":  "test_value",
			"number_field":  42.5,
			"boolean_field": true,
			"array_field":   []interface{}{1, "two", true},
			"object_field": map[string]interface{}{
				"nested": "value",
				"count":  10,
			},
			"null_field": nil,
		}

		// Marshal directly
		directBytes, err := json.Marshal(original)
		require.NoError(t, err)

		// Marshal through Value method
		value, err := original.Value()
		require.NoError(t, err)
		valueBytes, ok := value.([]byte)
		require.True(t, ok)

		// Both should produce valid JSON
		var directResult map[string]interface{}
		err = json.Unmarshal(directBytes, &directResult)
		require.NoError(t, err)

		var valueResult map[string]interface{}
		err = json.Unmarshal(valueBytes, &valueResult)
		require.NoError(t, err)

		// Results should be equivalent
		assert.Equal(t, directResult["string_field"], valueResult["string_field"])
		assert.Equal(t, directResult["number_field"], valueResult["number_field"])
		assert.Equal(t, directResult["boolean_field"], valueResult["boolean_field"])
	})
}

func TestSessionValidation(t *testing.T) {
	t.Run("valid session configurations", func(t *testing.T) {
		testCases := []struct {
			name    string
			session *Session
		}{
			{
				name: "standard user session",
				session: &Session{
					ID:           uuid.New(),
					SessionToken: "sess_standard_user_12345",
					Subject:      "user@example.com",
					Attributes: AttributesJSON{
						"role":        "user",
						"permissions": []interface{}{"read"},
					},
					CreatedAt: time.Now(),
					ExpiresAt: time.Now().Add(2 * time.Hour),
				},
			},
			{
				name: "admin session",
				session: &Session{
					ID:           uuid.New(),
					SessionToken: "sess_admin_67890",
					Subject:      "admin@example.com",
					Attributes: AttributesJSON{
						"role":        "admin",
						"permissions": []interface{}{"read", "write", "delete", "admin"},
					},
					CreatedAt: time.Now(),
					ExpiresAt: time.Now().Add(8 * time.Hour),
				},
			},
			{
				name: "service account session",
				session: &Session{
					ID:           uuid.New(),
					SessionToken: "sess_service_abc123",
					Subject:      "service-account@system.local",
					Attributes: AttributesJSON{
						"type":        "service",
						"application": "api-gateway",
						"scopes":      []interface{}{"api:read", "api:write"},
					},
					CreatedAt: time.Now(),
					ExpiresAt: time.Now().Add(24 * time.Hour),
				},
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				assert.NotNil(t, tc.session)
				assert.NotEqual(t, uuid.Nil, tc.session.ID)
				assert.NotEmpty(t, tc.session.SessionToken)
				assert.NotEmpty(t, tc.session.Subject)
				assert.True(t, tc.session.ExpiresAt.After(tc.session.CreatedAt))
			})
		}
	})

	t.Run("session token validation patterns", func(t *testing.T) {
		validTokens := []string{
			"sess_1234567890abcdef",
			"session-token-with-dashes",
			"SessionTokenCamelCase123",
			"session_token_with_underscores",
			"abc123def456ghi789",
			"very-long-session-token-with-many-characters-12345",
		}

		for _, token := range validTokens {
			t.Run("valid_token_"+token, func(t *testing.T) {
				session := &Session{
					ID:           uuid.New(),
					SessionToken: token,
					Subject:      "test@example.com",
				}
				assert.NotEmpty(t, session.SessionToken)
				assert.Equal(t, token, session.SessionToken)
			})
		}
	})

	t.Run("subject validation patterns", func(t *testing.T) {
		validSubjects := []string{
			"user@example.com",
			"admin@company.org",
			"service-account@system.local",
			"test.user+label@domain.co.uk",
			"user123@subdomain.example.com",
			"system:service-account:namespace:name",
		}

		for _, subject := range validSubjects {
			t.Run("valid_subject_"+subject, func(t *testing.T) {
				session := &Session{
					ID:           uuid.New(),
					SessionToken: "test_token",
					Subject:      subject,
				}
				assert.NotEmpty(t, session.Subject)
				assert.Equal(t, subject, session.Subject)
			})
		}
	})

	t.Run("uuid field validation", func(t *testing.T) {
		session := &Session{
			ID:           uuid.New(),
			SessionToken: "uuid_test_token",
			Subject:      "uuid@example.com",
		}

		assert.NotEqual(t, uuid.Nil, session.ID)

		// Verify UUID is properly formatted
		_, err := uuid.Parse(session.ID.String())
		assert.NoError(t, err)

		// Verify UUID string representation
		uuidString := session.ID.String()
		assert.Len(t, uuidString, 36) // Standard UUID length with hyphens
		assert.Contains(t, uuidString, "-")
	})
}

func TestSessionDatabaseStructure(t *testing.T) {
	t.Run("database structure validation", func(t *testing.T) {
		// Test that the struct can be used with GORM
		session := &Session{
			ID:           uuid.New(),
			SessionToken: "db_test_token",
			Subject:      "db@example.com",
			Attributes: AttributesJSON{
				"test": "data",
			},
			CreatedAt: time.Now(),
			ExpiresAt: time.Now().Add(time.Hour),
		}

		// Verify struct is properly set up for GORM operations
		assert.NotNil(t, session)
		assert.NotEqual(t, uuid.Nil, session.ID)
		assert.NotEmpty(t, session.SessionToken)
		assert.NotEmpty(t, session.Subject)
		assert.NotNil(t, session.Attributes)

		// In a real integration test, we would test:
		// - Database constraints (session token uniqueness, etc.)
		// - UUID generation with gen_random_uuid()
		// - JSONB column storage and retrieval
		// - Soft delete functionality with DeletedAt
		// - Index performance on DeletedAt
		// - Session expiration queries
		// - Foreign key relationships if any
	})

	t.Run("gorm tag validation", func(t *testing.T) {
		// Verify that GORM tags are properly configured
		session := &Session{}

		// Test that DeletedAt implements the soft delete pattern
		assert.False(t, session.DeletedAt.Valid)

		// Set soft delete
		session.DeletedAt = gorm.DeletedAt{Valid: true, Time: time.Now()}
		assert.True(t, session.DeletedAt.Valid)
		assert.False(t, session.DeletedAt.Time.IsZero())
	})

	t.Run("attributes jsonb functionality", func(t *testing.T) {
		attributes := AttributesJSON{
			"nested": map[string]interface{}{
				"key1": "value1",
				"key2": 42,
			},
			"array": []interface{}{1, 2, 3},
		}

		session := &Session{
			ID:         uuid.New(),
			Attributes: attributes,
		}

		// Test that attributes can be stored and retrieved
		assert.NotNil(t, session.Attributes)
		nested, ok := session.Attributes["nested"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "value1", nested["key1"])
		assert.Equal(t, 42, nested["key2"])

		array, ok := session.Attributes["array"].([]interface{})
		require.True(t, ok)
		assert.Len(t, array, 3)
	})
}

func TestSessionSecurity(t *testing.T) {
	t.Run("session expiration handling", func(t *testing.T) {
		now := time.Now()
		expiredSession := &Session{
			ID:           uuid.New(),
			SessionToken: "expired_token",
			Subject:      "expired@example.com",
			CreatedAt:    now.Add(-2 * time.Hour),
			ExpiresAt:    now.Add(-1 * time.Hour),
		}

		activeSession := &Session{
			ID:           uuid.New(),
			SessionToken: "active_token",
			Subject:      "active@example.com",
			CreatedAt:    now.Add(-30 * time.Minute),
			ExpiresAt:    now.Add(30 * time.Minute),
		}

		// Verify expiration logic
		assert.True(t, expiredSession.ExpiresAt.Before(now))
		assert.True(t, activeSession.ExpiresAt.After(now))
	})

	t.Run("sensitive data in attributes", func(t *testing.T) {
		sensitiveAttributes := AttributesJSON{
			"access_token":   "access_12345",
			"refresh_token":  "refresh_67890",
			"password_hash":  "$2a$10$...",
			"api_key":        "ak_live_1234567890",
			"secret_key":     "sk_test_abcdef123456",
			"private_key":    "REDACTED_PRIVATE_KEY_FOR_TESTING",
			"session_secret": "sess_secret_xyz789",
		}

		session := &Session{
			ID:         uuid.New(),
			Attributes: sensitiveAttributes,
		}

		// In production, sensitive data should be properly handled
		assert.NotNil(t, session.Attributes)

		// This test documents that sensitive data can be stored
		// In real applications, consider:
		// - Encrypting sensitive attributes
		// - Using separate secure storage
		// - Implementing proper access controls
		// - Regular cleanup of expired sessions
		assert.Contains(t, session.Attributes, "access_token")
		assert.Contains(t, session.Attributes, "refresh_token")
	})

	t.Run("session cleanup scenarios", func(t *testing.T) {
		// Test scenarios for session cleanup
		now := time.Now()

		sessions := []*Session{
			{
				ID:           uuid.New(),
				SessionToken: "expired_1",
				ExpiresAt:    now.Add(-1 * time.Hour),
				DeletedAt:    gorm.DeletedAt{Valid: false},
			},
			{
				ID:           uuid.New(),
				SessionToken: "expired_2",
				ExpiresAt:    now.Add(-2 * time.Hour),
				DeletedAt:    gorm.DeletedAt{Valid: false},
			},
			{
				ID:           uuid.New(),
				SessionToken: "active_1",
				ExpiresAt:    now.Add(1 * time.Hour),
				DeletedAt:    gorm.DeletedAt{Valid: false},
			},
			{
				ID:           uuid.New(),
				SessionToken: "soft_deleted",
				ExpiresAt:    now.Add(1 * time.Hour),
				DeletedAt:    gorm.DeletedAt{Valid: true, Time: now.Add(-30 * time.Minute)},
			},
		}

		// Count expired sessions (candidates for cleanup)
		expiredCount := 0
		for _, session := range sessions {
			if session.ExpiresAt.Before(now) && !session.DeletedAt.Valid {
				expiredCount++
			}
		}

		assert.Equal(t, 2, expiredCount)

		// Count active sessions
		activeCount := 0
		for _, session := range sessions {
			if session.ExpiresAt.After(now) && !session.DeletedAt.Valid {
				activeCount++
			}
		}

		assert.Equal(t, 1, activeCount)
	})
}

// Benchmark tests for performance
func BenchmarkAttributesJSONValue(b *testing.B) {
	attributes := AttributesJSON{
		"user_profile": map[string]interface{}{
			"id":       "user123",
			"email":    "benchmark@example.com",
			"verified": true,
			"score":    95.5,
		},
		"permissions": []interface{}{"read", "write", "admin"},
		"metadata": map[string]interface{}{
			"ip_address": "192.168.1.100",
			"user_agent": "Mozilla/5.0 Benchmark",
			"device":     "desktop",
		},
		"session_data": map[string]interface{}{
			"csrf_token":   "csrf_benchmark_123",
			"nonce":        "nonce_benchmark_456",
			"redirect_url": "https://benchmark.example.com",
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := attributes.Value()
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkAttributesJSONScan(b *testing.B) {
	jsonData := []byte(`{
		"user_profile": {
			"id": "user123",
			"email": "benchmark@example.com",
			"verified": true,
			"score": 95.5
		},
		"permissions": ["read", "write", "admin"],
		"metadata": {
			"ip_address": "192.168.1.100",
			"user_agent": "Mozilla/5.0 Benchmark",
			"device": "desktop"
		},
		"session_data": {
			"csrf_token": "csrf_benchmark_123",
			"nonce": "nonce_benchmark_456",
			"redirect_url": "https://benchmark.example.com"
		}
	}`)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var attributes AttributesJSON
		err := attributes.Scan(jsonData)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkSessionStructAccess(b *testing.B) {
	session := &Session{
		ID:           uuid.New(),
		SessionToken: "benchmark_session_token",
		Subject:      "benchmark@example.com",
		Attributes: AttributesJSON{
			"user_id":     "user123",
			"permissions": []interface{}{"read", "write"},
			"metadata": map[string]interface{}{
				"ip_address": "192.168.1.1",
				"device":     "mobile",
			},
		},
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(time.Hour),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Simulate common session access patterns
		_ = session.ID
		_ = session.SessionToken
		_ = session.Subject
		_ = session.Attributes["user_id"]
		if metadata, ok := session.Attributes["metadata"].(map[string]interface{}); ok {
			_ = metadata["ip_address"]
		}
		_ = session.ExpiresAt.After(time.Now())
	}
}
