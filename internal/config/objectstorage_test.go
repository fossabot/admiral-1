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

func TestObjectStorage_SetDefaults(t *testing.T) {
	tests := []struct {
		name    string
		storage ObjectStorage
		check   func(t *testing.T, storage *ObjectStorage)
	}{
		{
			name: "S3 storage with nil S3 config",
			storage: ObjectStorage{
				Type: ObjectStorageTypeS3,
				S3:   nil,
			},
			check: func(t *testing.T, storage *ObjectStorage) {
				// Should not panic or change anything
				assert.Nil(t, storage.S3)
			},
		},
		{
			name: "S3 storage with valid S3 config gets SSL default",
			storage: ObjectStorage{
				Type: ObjectStorageTypeS3,
				S3: &S3StorageConfig{
					Region: "us-east-1",
					UseSSL: nil,
				},
			},
			check: func(t *testing.T, storage *ObjectStorage) {
				assert.NotNil(t, storage.S3.UseSSL)
				assert.True(t, *storage.S3.UseSSL)
			},
		},
		{
			name: "S3 storage with existing SSL setting preserved",
			storage: ObjectStorage{
				Type: ObjectStorageTypeS3,
				S3: &S3StorageConfig{
					Region: "us-east-1",
					UseSSL: &[]bool{false}[0],
				},
			},
			check: func(t *testing.T, storage *ObjectStorage) {
				assert.NotNil(t, storage.S3.UseSSL)
				assert.False(t, *storage.S3.UseSSL)
			},
		},
		{
			name: "GCS storage has no defaults",
			storage: ObjectStorage{
				Type: ObjectStorageTypeGCS,
				GCS: &GCSStorageConfig{
					ProjectID: "test-project",
				},
			},
			check: func(t *testing.T, storage *ObjectStorage) {
				assert.Equal(t, "test-project", storage.GCS.ProjectID)
				assert.False(t, storage.GCS.UseADC)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.storage.SetDefaults()
			tt.check(t, &tt.storage)
		})
	}
}

func TestObjectStorageType_String(t *testing.T) {
	tests := []struct {
		name     string
		storage  *ObjectStorageType
		expected string
	}{
		{
			name:     "nil pointer returns unspecified",
			storage:  nil,
			expected: "unspecified",
		},
		{
			name:     "S3 storage type",
			storage:  &[]ObjectStorageType{ObjectStorageTypeS3}[0],
			expected: "s3",
		},
		{
			name:     "GCS storage type",
			storage:  &[]ObjectStorageType{ObjectStorageTypeGCS}[0],
			expected: "gcs",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.storage.String()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestObjectStorageType_Validate(t *testing.T) {
	tests := []struct {
		name        string
		storage     ObjectStorageType
		expectError bool
		errorMsg    string
	}{
		{
			name:        "valid S3 type",
			storage:     ObjectStorageTypeS3,
			expectError: false,
		},
		{
			name:        "valid GCS type",
			storage:     ObjectStorageTypeGCS,
			expectError: false,
		},
		{
			name:        "invalid storage type",
			storage:     ObjectStorageType("invalid"),
			expectError: true,
			errorMsg:    "invalid object storage type: \"invalid\"",
		},
		{
			name:        "empty storage type",
			storage:     ObjectStorageType(""),
			expectError: true,
			errorMsg:    "invalid object storage type: \"\"",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.storage.Validate()
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestS3StorageConfig_SetDefaults(t *testing.T) {
	tests := []struct {
		name     string
		s3       S3StorageConfig
		expected *bool
	}{
		{
			name:     "nil UseSSL gets default true",
			s3:       S3StorageConfig{UseSSL: nil},
			expected: &[]bool{true}[0],
		},
		{
			name:     "existing UseSSL false preserved",
			s3:       S3StorageConfig{UseSSL: &[]bool{false}[0]},
			expected: &[]bool{false}[0],
		},
		{
			name:     "existing UseSSL true preserved",
			s3:       S3StorageConfig{UseSSL: &[]bool{true}[0]},
			expected: &[]bool{true}[0],
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.s3.SetDefaults()
			assert.NotNil(t, tt.s3.UseSSL)
			assert.Equal(t, *tt.expected, *tt.s3.UseSSL)
		})
	}
}

func TestS3StorageConfig_Validate(t *testing.T) {
	// Currently S3StorageConfig.Validate() always returns nil
	// but we test to ensure it doesn't panic and behaves consistently
	s3 := &S3StorageConfig{
		Region:    "us-east-1",
		AccessKey: "test-key",
		SecretKey: "test-secret",
	}
	err := s3.Validate()
	assert.NoError(t, err)
}

func TestGCSStorageConfig_Validate(t *testing.T) {
	// Currently GCSStorageConfig.Validate() always returns nil
	// but we test to ensure it doesn't panic and behaves consistently
	gcs := &GCSStorageConfig{
		ProjectID: "test-project",
		UseADC:    true,
	}
	err := gcs.Validate()
	assert.NoError(t, err)
}

func TestObjectStorage_StructFields(t *testing.T) {
	t.Run("ObjectStorage struct has all expected fields", func(t *testing.T) {
		storage := ObjectStorage{
			Type: ObjectStorageTypeS3,
			S3: &S3StorageConfig{
				Region: "us-east-1",
			},
			GCS: &GCSStorageConfig{
				ProjectID: "test-project",
			},
		}

		assert.Equal(t, ObjectStorageTypeS3, storage.Type)
		assert.NotNil(t, storage.S3)
		assert.NotNil(t, storage.GCS)
		assert.Equal(t, "us-east-1", storage.S3.Region)
		assert.Equal(t, "test-project", storage.GCS.ProjectID)
	})

	t.Run("S3StorageConfig struct has all expected fields", func(t *testing.T) {
		s3 := S3StorageConfig{
			Endpoint:     "s3.amazonaws.com",
			Region:       "us-east-1",
			UseSSL:       &[]bool{true}[0],
			AccessKey:    "access-key",
			SecretKey:    "secret-key",
			RoleARN:      "arn:aws:iam::123456789012:role/S3Role",
			SessionToken: "session-token",
		}

		assert.Equal(t, "s3.amazonaws.com", s3.Endpoint)
		assert.Equal(t, "us-east-1", s3.Region)
		assert.NotNil(t, s3.UseSSL)
		assert.True(t, *s3.UseSSL)
		assert.Equal(t, "access-key", s3.AccessKey)
		assert.Equal(t, "secret-key", s3.SecretKey)
		assert.Equal(t, "arn:aws:iam::123456789012:role/S3Role", s3.RoleARN)
		assert.Equal(t, "session-token", s3.SessionToken)
	})

	t.Run("GCSStorageConfig struct has all expected fields", func(t *testing.T) {
		gcs := GCSStorageConfig{
			ProjectID:       "test-project",
			CredentialsFile: "/path/to/credentials.json",
			CredentialsJSON: "{\"type\": \"service_account\"}",
			UseADC:          true,
		}

		assert.Equal(t, "test-project", gcs.ProjectID)
		assert.Equal(t, "/path/to/credentials.json", gcs.CredentialsFile)
		assert.Equal(t, "{\"type\": \"service_account\"}", gcs.CredentialsJSON)
		assert.True(t, gcs.UseADC)
	})
}

func TestObjectStorage_EdgeCases(t *testing.T) {
	t.Run("empty type validation fails", func(t *testing.T) {
		storage := &ObjectStorage{
			Type: "",
		}
		err := storage.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "type is required")
	})

	t.Run("S3 type with missing S3 config fails", func(t *testing.T) {
		storage := &ObjectStorage{
			Type: ObjectStorageTypeS3,
			S3:   nil,
		}
		err := storage.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "S3 config is required for type \"s3\"")
	})

	t.Run("GCS type with missing GCS config fails", func(t *testing.T) {
		storage := &ObjectStorage{
			Type: ObjectStorageTypeGCS,
			GCS:  nil,
		}
		err := storage.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "GCS config is required for type \"gcs\"")
	})

	t.Run("unsupported type fails", func(t *testing.T) {
		storage := &ObjectStorage{
			Type: ObjectStorageType("azure"),
		}
		err := storage.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "unsupported storage type: \"azure\"")
	})

	t.Run("S3 SetDefaults with nil S3 config is safe", func(t *testing.T) {
		storage := &ObjectStorage{
			Type: ObjectStorageTypeS3,
			S3:   nil,
		}
		// Should not panic
		assert.NotPanics(t, func() {
			storage.SetDefaults()
		})
		assert.Nil(t, storage.S3)
	})

	t.Run("GCS SetDefaults with nil GCS config is safe", func(t *testing.T) {
		storage := &ObjectStorage{
			Type: ObjectStorageTypeGCS,
			GCS:  nil,
		}
		// Should not panic
		assert.NotPanics(t, func() {
			storage.SetDefaults()
		})
		assert.Nil(t, storage.GCS)
	})
}
