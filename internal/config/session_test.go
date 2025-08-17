package config

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func TestSession_SetDefaults(t *testing.T) {
	tests := []struct {
		name     string
		session  *Session
		expected Session
	}{
		{
			name:     "nil session does not panic",
			session:  nil,
			expected: Session{}, // No assertion for nil case
		},
		{
			name:    "empty session gets all defaults",
			session: &Session{},
			expected: Session{
				IdleTimeout: 20 * time.Minute,
				Lifetime:    24 * time.Hour,
				Cookie: Cookie{
					Name:     "session",
					SameSite: SessionSameSiteLax,
					HttpOnly: boolPtr(true),
					Secure:   boolPtr(false),
					Persist:  boolPtr(true),
				},
			},
		},
		{
			name: "partially populated session fills missing defaults",
			session: &Session{
				IdleTimeout: 30 * time.Minute, // Custom value
				Cookie: Cookie{
					Name:   "custom-session", // Custom value
					Domain: "example.com",    // Custom value
				},
			},
			expected: Session{
				IdleTimeout: 30 * time.Minute, // Preserved
				Lifetime:    24 * time.Hour,   // Default
				Cookie: Cookie{
					Name:     "custom-session", // Preserved
					Domain:   "example.com",    // Preserved
					SameSite: SessionSameSiteLax,
					HttpOnly: boolPtr(true),
					Secure:   boolPtr(false),
					Persist:  boolPtr(true),
				},
			},
		},
		{
			name: "fully populated session preserves all values",
			session: &Session{
				IdleTimeout: 15 * time.Minute,
				Lifetime:    12 * time.Hour,
				Cookie: Cookie{
					Name:     "my-session",
					Domain:   "app.example.com",
					SameSite: SessionSameSiteStrict,
					HttpOnly: boolPtr(false),
					Secure:   boolPtr(true),
					Persist:  boolPtr(false),
				},
			},
			expected: Session{
				IdleTimeout: 15 * time.Minute,
				Lifetime:    12 * time.Hour,
				Cookie: Cookie{
					Name:     "my-session",
					Domain:   "app.example.com",
					SameSite: SessionSameSiteStrict,
					HttpOnly: boolPtr(false),
					Secure:   boolPtr(true),
					Persist:  boolPtr(false),
				},
			},
		},
		{
			name: "session with zero durations gets defaults",
			session: &Session{
				IdleTimeout: 0,
				Lifetime:    0,
			},
			expected: Session{
				IdleTimeout: 20 * time.Minute,
				Lifetime:    24 * time.Hour,
				Cookie: Cookie{
					Name:     "session",
					SameSite: SessionSameSiteLax,
					HttpOnly: boolPtr(true),
					Secure:   boolPtr(false),
					Persist:  boolPtr(true),
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.session == nil {
				// Test nil case separately
				var session *Session = nil
				session.SetDefaults() // Should not panic
				return
			}

			tt.session.SetDefaults()
			assert.Equal(t, tt.expected, *tt.session)
		})
	}
}

func TestSession_Validate(t *testing.T) {
	tests := []struct {
		name        string
		session     *Session
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil session returns nil",
			session:     nil,
			expectError: false,
		},
		{
			name: "valid session passes validation",
			session: &Session{
				IdleTimeout: 20 * time.Minute,
				Lifetime:    24 * time.Hour,
				Cookie: Cookie{
					Name:     "session",
					SameSite: SessionSameSiteLax,
				},
			},
			expectError: false,
		},
		{
			name: "session with valid strict same site passes",
			session: &Session{
				Cookie: Cookie{
					SameSite: SessionSameSiteStrict,
				},
			},
			expectError: false,
		},
		{
			name: "session with valid none same site passes",
			session: &Session{
				Cookie: Cookie{
					SameSite: SessionSameSiteNone,
				},
			},
			expectError: false,
		},
		{
			name: "session with empty same site passes",
			session: &Session{
				Cookie: Cookie{
					SameSite: "",
				},
			},
			expectError: false,
		},
		{
			name: "session with invalid same site fails",
			session: &Session{
				Cookie: Cookie{
					SameSite: "invalid",
				},
			},
			expectError: true,
			errorMsg:    "invalid same_site mode: \"invalid\" (valid: lax, strict, none)",
		},
		{
			name:        "empty session passes validation",
			session:     &Session{},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.session.Validate()
			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestSameSiteMode_Validate(t *testing.T) {
	tests := []struct {
		name        string
		sameSite    SameSiteMode
		expectError bool
		errorMsg    string
	}{
		{
			name:        "lax same site is valid",
			sameSite:    SessionSameSiteLax,
			expectError: false,
		},
		{
			name:        "strict same site is valid",
			sameSite:    SessionSameSiteStrict,
			expectError: false,
		},
		{
			name:        "none same site is valid",
			sameSite:    SessionSameSiteNone,
			expectError: false,
		},
		{
			name:        "empty string is valid",
			sameSite:    "",
			expectError: false,
		},
		{
			name:        "invalid same site mode fails",
			sameSite:    "invalid",
			expectError: true,
			errorMsg:    "invalid same_site mode: \"invalid\" (valid: lax, strict, none)",
		},
		{
			name:        "uppercase lax is invalid",
			sameSite:    "LAX",
			expectError: true,
			errorMsg:    "invalid same_site mode: \"LAX\" (valid: lax, strict, none)",
		},
		{
			name:        "mixed case strict is invalid",
			sameSite:    "Strict",
			expectError: true,
			errorMsg:    "invalid same_site mode: \"Strict\" (valid: lax, strict, none)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.sameSite.Validate()
			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestSession_UnmarshalYAML(t *testing.T) {
	tests := []struct {
		name     string
		yaml     string
		expected Session
	}{
		{
			name: "complete session configuration",
			yaml: `
idle_timeout: 30m
lifetime: 48h
cookie:
  name: "custom-session"
  domain: "example.com"
  http_only: false
  same_site: "strict"
  secure: true
  persist: false
`,
			expected: Session{
				IdleTimeout: 30 * time.Minute,
				Lifetime:    48 * time.Hour,
				Cookie: Cookie{
					Name:     "custom-session",
					Domain:   "example.com",
					HttpOnly: boolPtr(false),
					SameSite: SessionSameSiteStrict,
					Secure:   boolPtr(true),
					Persist:  boolPtr(false),
				},
			},
		},
		{
			name: "minimal session configuration",
			yaml: `
idle_timeout: 15m
`,
			expected: Session{
				IdleTimeout: 15 * time.Minute,
				Lifetime:    0,
				Cookie: Cookie{
					SameSite: "",
				},
			},
		},
		{
			name: "session with only cookie configuration",
			yaml: `
cookie:
  name: "app-session"
  same_site: "none"
`,
			expected: Session{
				Cookie: Cookie{
					Name:     "app-session",
					SameSite: SessionSameSiteNone,
				},
			},
		},
		{
			name:     "empty session configuration",
			yaml:     `{}`,
			expected: Session{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var session Session
			err := yaml.Unmarshal([]byte(tt.yaml), &session)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, session)
		})
	}
}

func TestSession_UnmarshalYAML_ErrorCases(t *testing.T) {
	tests := []struct {
		name        string
		yaml        string
		expectError bool
	}{
		{
			name:        "invalid yaml structure",
			yaml:        `idle_timeout: [invalid`,
			expectError: true,
		},
		{
			name: "invalid duration format",
			yaml: `
idle_timeout: "not-a-duration"
`,
			expectError: true,
		},
		{
			name: "invalid boolean type",
			yaml: `
cookie:
  http_only: "not-a-boolean"
`,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var session Session
			err := yaml.Unmarshal([]byte(tt.yaml), &session)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestSession_StructFields(t *testing.T) {
	t.Run("session struct has all expected fields", func(t *testing.T) {
		session := Session{
			IdleTimeout: 20 * time.Minute,
			Lifetime:    24 * time.Hour,
			Cookie: Cookie{
				Name:     "test",
				Domain:   "example.com",
				HttpOnly: boolPtr(true),
				SameSite: SessionSameSiteLax,
				Secure:   boolPtr(false),
				Persist:  boolPtr(true),
			},
		}

		// Verify struct fields are accessible
		assert.Equal(t, 20*time.Minute, session.IdleTimeout)
		assert.Equal(t, 24*time.Hour, session.Lifetime)
		assert.Equal(t, "test", session.Cookie.Name)
		assert.Equal(t, "example.com", session.Cookie.Domain)
		assert.Equal(t, true, *session.Cookie.HttpOnly)
		assert.Equal(t, SessionSameSiteLax, session.Cookie.SameSite)
		assert.Equal(t, false, *session.Cookie.Secure)
		assert.Equal(t, true, *session.Cookie.Persist)
	})

	t.Run("cookie struct has all expected fields", func(t *testing.T) {
		cookie := Cookie{
			Name:     "session",
			Domain:   "app.example.com",
			HttpOnly: boolPtr(true),
			SameSite: SessionSameSiteStrict,
			Secure:   boolPtr(true),
			Persist:  boolPtr(false),
		}

		assert.Equal(t, "session", cookie.Name)
		assert.Equal(t, "app.example.com", cookie.Domain)
		assert.Equal(t, true, *cookie.HttpOnly)
		assert.Equal(t, SessionSameSiteStrict, cookie.SameSite)
		assert.Equal(t, true, *cookie.Secure)
		assert.Equal(t, false, *cookie.Persist)
	})
}

func TestSession_EdgeCases(t *testing.T) {
	t.Run("session with very short durations", func(t *testing.T) {
		session := &Session{
			IdleTimeout: 1 * time.Nanosecond,
			Lifetime:    1 * time.Microsecond,
		}

		err := session.Validate()
		assert.NoError(t, err) // Current implementation has no duration limits
	})

	t.Run("session with very long durations", func(t *testing.T) {
		session := &Session{
			IdleTimeout: 8760 * time.Hour,  // 1 year
			Lifetime:    87600 * time.Hour, // 10 years
		}

		err := session.Validate()
		assert.NoError(t, err) // Current implementation has no duration limits
	})

	t.Run("session with negative durations", func(t *testing.T) {
		session := &Session{
			IdleTimeout: -5 * time.Minute,
			Lifetime:    -1 * time.Hour,
		}

		err := session.Validate()
		assert.NoError(t, err) // Current implementation doesn't validate duration signs
	})

	t.Run("cookie with very long name", func(t *testing.T) {
		longName := string(make([]byte, 1000))
		for i := range longName {
			longName = longName[:i] + "a" + longName[i+1:]
		}

		session := &Session{
			Cookie: Cookie{
				Name:     longName,
				SameSite: SessionSameSiteLax,
			},
		}

		err := session.Validate()
		assert.NoError(t, err) // Current implementation has no name length limits
	})

	t.Run("cookie with special characters in name", func(t *testing.T) {
		session := &Session{
			Cookie: Cookie{
				Name:     "session-name_with.special@chars",
				SameSite: SessionSameSiteLax,
			},
		}

		err := session.Validate()
		assert.NoError(t, err) // Current implementation doesn't validate cookie name format
	})

	t.Run("cookie with unicode name", func(t *testing.T) {
		session := &Session{
			Cookie: Cookie{
				Name:     "session-名前-мяч",
				SameSite: SessionSameSiteLax,
			},
		}

		err := session.Validate()
		assert.NoError(t, err) // Current implementation accepts unicode
	})
}

func TestSession_BooleanPointerHandling(t *testing.T) {
	t.Run("nil boolean pointers get defaults", func(t *testing.T) {
		session := &Session{
			Cookie: Cookie{
				HttpOnly: nil,
				Secure:   nil,
				Persist:  nil,
			},
		}

		session.SetDefaults()

		assert.NotNil(t, session.Cookie.HttpOnly)
		assert.NotNil(t, session.Cookie.Secure)
		assert.NotNil(t, session.Cookie.Persist)
		assert.Equal(t, true, *session.Cookie.HttpOnly)
		assert.Equal(t, false, *session.Cookie.Secure)
		assert.Equal(t, true, *session.Cookie.Persist)
	})

	t.Run("explicit boolean values are preserved", func(t *testing.T) {
		session := &Session{
			Cookie: Cookie{
				HttpOnly: boolPtr(false),
				Secure:   boolPtr(true),
				Persist:  boolPtr(false),
			},
		}

		session.SetDefaults()

		assert.Equal(t, false, *session.Cookie.HttpOnly)
		assert.Equal(t, true, *session.Cookie.Secure)
		assert.Equal(t, false, *session.Cookie.Persist)
	})
}

func TestSession_NilPointerSafety(t *testing.T) {
	t.Run("nil session pointer validation", func(t *testing.T) {
		var session *Session = nil

		// Should not panic
		session.SetDefaults()
		err := session.Validate()
		assert.NoError(t, err)
	})
}

// TestSession_ConcurrentAccess removed as SetDefaults is not designed for concurrent use
// SetDefaults is typically called during initialization, not concurrently in production

func TestSession_DefaultValues(t *testing.T) {
	t.Run("verify all default values", func(t *testing.T) {
		session := &Session{}
		session.SetDefaults()

		// Verify all defaults match expected values
		assert.Equal(t, 20*time.Minute, session.IdleTimeout)
		assert.Equal(t, 24*time.Hour, session.Lifetime)
		assert.Equal(t, "session", session.Cookie.Name)
		assert.Equal(t, SessionSameSiteLax, session.Cookie.SameSite)
		assert.Equal(t, true, *session.Cookie.HttpOnly)
		assert.Equal(t, false, *session.Cookie.Secure)
		assert.Equal(t, true, *session.Cookie.Persist)
		assert.Empty(t, session.Cookie.Domain) // No default for domain
	})
}

func TestSameSiteMode_Constants(t *testing.T) {
	t.Run("verify same site mode constants", func(t *testing.T) {
		assert.Equal(t, SameSiteMode("lax"), SessionSameSiteLax)
		assert.Equal(t, SameSiteMode("strict"), SessionSameSiteStrict)
		assert.Equal(t, SameSiteMode("none"), SessionSameSiteNone)
	})
}

// Helper function to create boolean pointers
func boolPtr(b bool) *bool {
	return &b
}
