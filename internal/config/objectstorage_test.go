package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_StorageValidation(t *testing.T) {
	testCases := []struct {
		name        string
		config      *Config
		expectError bool
		errorMsg    string
	}{
		{
			name: "nil storage config should fail",
			config: &Config{
				Services: Services{
					Database: &Database{
						Host:         "localhost",
						Port:         5432,
						DatabaseName: "test",
						User:         "test",
						Password:     "test",
						SSLMode:      SSLModeDisable,
					},
					ObjectStorage: nil, // This should cause validation to fail
				},
			},
			expectError: true,
			errorMsg:    "services.object_storage config is nil",
		},
		{
			name: "valid S3 storage config should pass",
			config: &Config{
				Services: Services{
					Database: &Database{
						Host:         "localhost",
						Port:         5432,
						DatabaseName: "test",
						User:         "test",
						Password:     "test",
						SSLMode:      SSLModeDisable,
					},
					ObjectStorage: &ObjectStorage{
						Type: ObjectStorageTypeS3,
						S3: &S3StorageConfig{
							Region: "us-east-1",
						},
					},
					Temporal: &Temporal{
						Host: "localhost",
						Port: 7233,
					},
				},
			},
			expectError: false,
		},
		{
			name: "valid GCS storage config should pass",
			config: &Config{
				Services: Services{
					Database: &Database{
						Host:         "localhost",
						Port:         5432,
						DatabaseName: "test",
						User:         "test",
						Password:     "test",
						SSLMode:      SSLModeDisable,
					},
					ObjectStorage: &ObjectStorage{
						Type: ObjectStorageTypeGCS,
						GCS: &GCSStorageConfig{
							ProjectID: "test-project",
							UseADC:    true,
						},
					},
					Temporal: &Temporal{
						Host: "localhost",
						Port: 7233,
					},
				},
			},
			expectError: false,
		},
		{
			name: "S3 storage without S3 config should fail",
			config: &Config{
				Services: Services{
					Database: &Database{
						Host:         "localhost",
						Port:         5432,
						DatabaseName: "test",
						User:         "test",
						Password:     "test",
						SSLMode:      SSLModeDisable,
					},
					ObjectStorage: &ObjectStorage{
						Type: ObjectStorageTypeS3,
						S3:   nil, // Missing S3 config
					},
				},
			},
			expectError: true,
			errorMsg:    "S3 config is required for type \"s3\"",
		},
		{
			name: "GCS storage without GCS config should fail",
			config: &Config{
				Services: Services{
					Database: &Database{
						Host:         "localhost",
						Port:         5432,
						DatabaseName: "test",
						User:         "test",
						Password:     "test",
						SSLMode:      SSLModeDisable,
					},
					ObjectStorage: &ObjectStorage{
						Type: ObjectStorageTypeGCS,
						GCS:  nil, // Missing GCS config
					},
				},
			},
			expectError: true,
			errorMsg:    "GCS config is required for type \"gcs\"",
		},
		{
			name: "unsupported storage type should fail",
			config: &Config{
				Services: Services{
					Database: &Database{
						Host:         "localhost",
						Port:         5432,
						DatabaseName: "test",
						User:         "test",
						Password:     "test",
						SSLMode:      SSLModeDisable,
					},
					ObjectStorage: &ObjectStorage{
						Type: ObjectStorageType("invalid"), // Invalid storage type
					},
				},
			},
			expectError: true,
			errorMsg:    "unsupported storage type: \"invalid\"",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.config.validate()
			if tc.expectError {
				assert.Error(t, err)
				if tc.errorMsg != "" {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestConfig_StorageValidation_EdgeCases(t *testing.T) {
	t.Run("config with services but no storage should fail", func(t *testing.T) {
		cfg := &Config{
			Services: Services{
				Database: &Database{
					Host:         "localhost",
					Port:         5432,
					DatabaseName: "test",
					User:         "test",
					Password:     "test",
					SSLMode:      SSLModeDisable,
				},
				// Storage is implicitly nil
			},
		}

		err := cfg.validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "services.object_storage config is nil")
	})

	t.Run("storage validation called during config loading", func(t *testing.T) {
		// This test ensures that storage validation is integrated into the main validation flow
		cfg := &Config{
			Services: Services{
				Database: &Database{
					Host:         "localhost",
					Port:         5432,
					DatabaseName: "test",
					User:         "test",
					Password:     "test",
					SSLMode:      SSLModeDisable,
				},
				ObjectStorage: &ObjectStorage{
					Type: ObjectStorageTypeS3,
					S3: &S3StorageConfig{
						Region: "us-east-1",
					},
				},
				Temporal: &Temporal{
					Host: "localhost",
					Port: 7233,
				},
			},
		}

		err := cfg.validate()
		assert.NoError(t, err, "Valid storage configuration should pass validation")
	})
}
