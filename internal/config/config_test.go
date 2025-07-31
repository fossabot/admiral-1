package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func TestSetDefaults(t *testing.T) {
	t.Run("sets database SSL mode to require when unspecified", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Database: &Database{
					SSLMode: SSLModeUnspecified,
				},
			},
		}

		result := setDefaults(cfg)

		assert.Equal(t, SSLModeRequire, result.Services.Database.SSLMode)
	})

	t.Run("sets database port to 5432 when unspecified", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Database: &Database{
					Port: 0,
				},
			},
		}

		result := setDefaults(cfg)

		assert.Equal(t, 5432, result.Services.Database.Port)
	})

	t.Run("preserves existing database SSL mode", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Database: &Database{
					SSLMode: SSLModeRequire,
				},
			},
		}

		result := setDefaults(cfg)

		assert.Equal(t, SSLModeRequire, result.Services.Database.SSLMode)
	})

	t.Run("preserves existing database port", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Database: &Database{
					Port: 3306,
				},
			},
		}

		result := setDefaults(cfg)

		assert.Equal(t, 3306, result.Services.Database.Port)
	})

	t.Run("sets both database defaults when unspecified", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Database: &Database{
					SSLMode: SSLModeUnspecified,
					Port:    0,
				},
			},
		}

		result := setDefaults(cfg)

		assert.Equal(t, SSLModeRequire, result.Services.Database.SSLMode)
		assert.Equal(t, 5432, result.Services.Database.Port)
	})

	t.Run("handles nil database config gracefully", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Database: nil,
			},
		}

		// Should not panic
		result := setDefaults(cfg)

		assert.Nil(t, result.Services.Database)
	})

	t.Run("sets server listener defaults", func(t *testing.T) {
		cfg := &Config{}

		result := setDefaults(cfg)

		assert.Equal(t, "0.0.0.0", result.Server.Listener.Address)
		assert.Equal(t, 8080, result.Server.Listener.Port)
	})

	t.Run("sets logger defaults", func(t *testing.T) {
		cfg := &Config{}

		result := setDefaults(cfg)

		assert.NotNil(t, result.Server.Logger)
		assert.Equal(t, zap.ErrorLevel, result.Server.Logger.Level)
	})

	t.Run("logger level parsed from YAML defaults to error when empty", func(t *testing.T) {
		// This test is covered by TestLogger_UnmarshalYAML
		// The UnmarshalYAML method handles empty values during YAML parsing
		// Here we just verify that a logger created without explicit level
		// will have the zero value (DebugLevel=0) until parsed from YAML
		logger := &Logger{}
		assert.Equal(t, zapcore.Level(0), logger.Level) // Zero value is DebugLevel
	})

	t.Run("sets stats defaults", func(t *testing.T) {
		cfg := &Config{}

		result := setDefaults(cfg)

		assert.NotNil(t, result.Server.Stats)
		assert.Equal(t, "admiral", result.Server.Stats.Prefix)
		assert.Equal(t, ReporterTypeNull, result.Server.Stats.ReporterType)
		assert.Equal(t, time.Second, result.Server.Stats.FlushInterval)
	})

	t.Run("sets temporal port to 7233 when unspecified", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Temporal: &Temporal{
					Host: "localhost",
					Port: 0,
				},
			},
		}

		result := setDefaults(cfg)

		assert.Equal(t, 7233, result.Services.Temporal.Port)
	})

	t.Run("preserves existing temporal port", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Temporal: &Temporal{
					Host: "localhost",
					Port: 8233,
				},
			},
		}

		result := setDefaults(cfg)

		assert.Equal(t, 8233, result.Services.Temporal.Port)
	})

	t.Run("handles nil temporal config gracefully", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Temporal: nil,
			},
		}

		// Should not panic
		result := setDefaults(cfg)

		assert.Nil(t, result.Services.Temporal)
	})

	t.Run("sets S3 storage SSL to true when unspecified", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				ObjectStorage: &ObjectStorage{
					Type: ObjectStorageTypeS3,
					S3: &S3StorageConfig{
						Region: "us-east-1",
						UseSSL: nil,
					},
				},
			},
		}

		result := setDefaults(cfg)

		assert.NotNil(t, result.Services.ObjectStorage.S3.UseSSL)
		assert.True(t, *result.Services.ObjectStorage.S3.UseSSL)
	})

	t.Run("preserves existing S3 storage SSL setting", func(t *testing.T) {
		useSSL := false
		cfg := &Config{
			Services: Services{
				ObjectStorage: &ObjectStorage{
					Type: ObjectStorageTypeS3,
					S3: &S3StorageConfig{
						Region: "us-east-1",
						UseSSL: &useSSL,
					},
				},
			},
		}

		result := setDefaults(cfg)

		assert.NotNil(t, result.Services.ObjectStorage.S3.UseSSL)
		assert.False(t, *result.Services.ObjectStorage.S3.UseSSL)
	})

	t.Run("handles nil S3 config gracefully", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				ObjectStorage: &ObjectStorage{
					Type: ObjectStorageTypeS3,
					S3:   nil,
				},
			},
		}

		// Should not panic
		result := setDefaults(cfg)

		assert.Nil(t, result.Services.ObjectStorage.S3)
	})

	t.Run("ignores GCS storage type", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				ObjectStorage: &ObjectStorage{
					Type: ObjectStorageTypeGCS,
					GCS: &GCSStorageConfig{
						ProjectID: "test-project",
					},
				},
			},
		}

		result := setDefaults(cfg)

		// Should not add S3 config for GCS type
		assert.Nil(t, result.Services.ObjectStorage.S3)
	})
}

func TestConfig_LoggerLevelEnvironmentVariable(t *testing.T) {
	// Create a temporary config file with LOGGER_LEVEL environment variable
	configContent := `
server:
  listener:
    address: 0.0.0.0
    port: 8080
  logger:
    level: ${LOGGER_LEVEL}
services:
  database:
    host: localhost
    port: 5432
  object_storage:
    type: s3
    s3:
      region: us-east-1
  temporal:
    host: localhost
    port: 7233
`

	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "config.yaml")
	err := os.WriteFile(configFile, []byte(configContent), 0600)
	require.NoError(t, err)

	tests := []struct {
		name          string
		envValue      string
		expectedLevel string
	}{
		{
			name:          "debug level from env",
			envValue:      "debug",
			expectedLevel: "debug",
		},
		{
			name:          "info level from env",
			envValue:      "info",
			expectedLevel: "info",
		},
		{
			name:          "empty env defaults to error",
			envValue:      "",
			expectedLevel: "error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set the environment variable
			err := os.Setenv("LOGGER_LEVEL", tt.envValue)
			require.NoError(t, err)
			defer func() {
				_ = os.Unsetenv("LOGGER_LEVEL")
			}()

			// Parse the config
			cfg, err := parseConfig(configFile, false)
			require.NoError(t, err)
			require.NotNil(t, cfg)
			require.NotNil(t, cfg.Server.Logger)

			assert.Equal(t, tt.expectedLevel, cfg.Server.Logger.Level.String())
		})
	}
}

func TestConfig_LoggerLevelNotSet(t *testing.T) {
	// Ensure LOGGER_LEVEL is not set
	_ = os.Unsetenv("LOGGER_LEVEL")

	// Create a config without logger section
	configContent := `
server:
  listener:
    address: 0.0.0.0
    port: 8080
services:
  database:
    host: localhost
    port: 5432
  object_storage:
    type: s3
    s3:
      region: us-east-1
  temporal:
    host: localhost
    port: 7233
`

	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "config.yaml")
	err := os.WriteFile(configFile, []byte(configContent), 0600)
	require.NoError(t, err)

	// Parse the config
	cfg, err := parseConfig(configFile, false)
	require.NoError(t, err)
	require.NotNil(t, cfg)

	// setDefaults should create a logger with error level
	require.NotNil(t, cfg.Server.Logger)
	assert.Equal(t, zap.ErrorLevel, cfg.Server.Logger.Level)
}

func TestConfig_OAuth2ScopesEnvironmentVariable(t *testing.T) {
	// Create a temporary config file with OAUTH2_SCOPES environment variable
	configContent := `
server:
  listener:
    address: 0.0.0.0
    port: 8080
services:
  authn:
    name: ${OAUTH2_NAME}
    issuer: ${OAUTH2_ISSUER}
    scopes: ${OAUTH2_SCOPES}
  database:
    host: localhost
    port: 5432
  object_storage:
    type: s3
    s3:
      region: us-east-1
  temporal:
    host: localhost
    port: 7233
`

	tmpDir := t.TempDir()
	configFile := filepath.Join(tmpDir, "config.yaml")
	err := os.WriteFile(configFile, []byte(configContent), 0600)
	require.NoError(t, err)

	tests := []struct {
		name           string
		envScopes      string
		envName        string
		envIssuer      string
		expectedScopes []string
	}{
		{
			name:           "comma-separated scopes",
			envScopes:      "openid,offline_access,email,profile",
			envName:        "keycloak",
			envIssuer:      "http://localhost:9090",
			expectedScopes: []string{"openid", "offline_access", "email", "profile"},
		},
		{
			name:           "comma-separated scopes with spaces",
			envScopes:      "read, write, admin",
			envName:        "custom",
			envIssuer:      "http://custom.example.com",
			expectedScopes: []string{"read", "write", "admin"},
		},
		{
			name:           "single scope",
			envScopes:      "openid",
			envName:        "minimal",
			envIssuer:      "http://minimal.example.com",
			expectedScopes: []string{"openid"},
		},
		{
			name:           "empty scopes uses defaults",
			envScopes:      "",
			envName:        "default",
			envIssuer:      "http://default.example.com",
			expectedScopes: []string{"openid", "offline_access", "email", "profile"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Set the environment variables
			err := os.Setenv("OAUTH2_SCOPES", tt.envScopes)
			require.NoError(t, err)
			err = os.Setenv("OAUTH2_NAME", tt.envName)
			require.NoError(t, err)
			err = os.Setenv("OAUTH2_ISSUER", tt.envIssuer)
			require.NoError(t, err)

			defer func() {
				_ = os.Unsetenv("OAUTH2_SCOPES")
				_ = os.Unsetenv("OAUTH2_NAME")
				_ = os.Unsetenv("OAUTH2_ISSUER")
			}()

			// Parse the config
			cfg, err := parseConfig(configFile, false)
			require.NoError(t, err)
			require.NotNil(t, cfg)
			require.NotNil(t, cfg.Services.Authn)

			assert.Equal(t, tt.expectedScopes, cfg.Services.Authn.Scopes)
			assert.Equal(t, tt.envName, cfg.Services.Authn.Name)
			assert.Equal(t, tt.envIssuer, cfg.Services.Authn.Issuer)
		})
	}
}
