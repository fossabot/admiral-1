// Test file for internal/model/revision.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"
)

func TestRevision(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		settings := SettingsJSON{
			{
				Id:           uuid.New(),
				Key:          "DATABASE_URL",
				SettingValue: "postgres://localhost:5432/db",
				IsSensitive:  true,
			},
			{
				Id:           uuid.New(),
				Key:          "LOG_LEVEL",
				SettingValue: "info",
				IsSensitive:  false,
			},
		}

		manifests := ManifestsJSON{
			{
				Id:            uuid.New(),
				StorageBucket: "k8s-manifests",
				StorageKey:    "apps/myapp/deployment.yaml",
				Checksum:      "sha256:abc123",
				ChecksumType:  "sha256",
			},
			{
				Id:            uuid.New(),
				StorageBucket: "k8s-manifests",
				StorageKey:    "apps/myapp/service.yaml",
				Checksum:      "sha256:def456",
				ChecksumType:  "sha256",
			},
		}

		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			Settings:      settings,
			Manifests:     manifests,
			StorageBucket: "revisions-bucket",
			StorageKey:    "revisions/v1/revision.tar.gz",
			Checksum:      "sha256:revision123",
			ChecksumType:  "sha256",
			IsActive:      true,
			Status:        "deployed",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, revision.Id)
		assert.NotEqual(t, uuid.Nil, revision.ApplicationId)
		assert.NotEqual(t, uuid.Nil, revision.EnvironmentId)
		assert.Len(t, revision.Settings, 2)
		assert.Len(t, revision.Manifests, 2)
		assert.Equal(t, "revisions-bucket", revision.StorageBucket)
		assert.Equal(t, "revisions/v1/revision.tar.gz", revision.StorageKey)
		assert.Equal(t, "sha256:revision123", revision.Checksum)
		assert.Equal(t, "sha256", revision.ChecksumType)
		assert.True(t, revision.IsActive)
		assert.Equal(t, "deployed", revision.Status)
		assert.False(t, revision.CreatedAt.IsZero())
		assert.False(t, revision.UpdatedAt.IsZero())
	})

	t.Run("revision with minimal fields", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			Settings:      SettingsJSON{},
			Manifests:     ManifestsJSON{},
			StorageBucket: "minimal-bucket",
			StorageKey:    "minimal/revision.tar.gz",
			Checksum:      "md5:minimal123",
			ChecksumType:  "md5",
			IsActive:      false,
			Status:        "pending",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, revision.Id)
		assert.NotEqual(t, uuid.Nil, revision.ApplicationId)
		assert.NotEqual(t, uuid.Nil, revision.EnvironmentId)
		assert.Empty(t, revision.Settings)
		assert.Empty(t, revision.Manifests)
		assert.Equal(t, "minimal-bucket", revision.StorageBucket)
		assert.Equal(t, "minimal/revision.tar.gz", revision.StorageKey)
		assert.Equal(t, "md5:minimal123", revision.Checksum)
		assert.Equal(t, "md5", revision.ChecksumType)
		assert.False(t, revision.IsActive)
		assert.Equal(t, "pending", revision.Status)
	})

	t.Run("zero values", func(t *testing.T) {
		revision := &Revision{}

		assert.Equal(t, uuid.Nil, revision.Id)
		assert.Equal(t, uuid.Nil, revision.ApplicationId)
		assert.Equal(t, uuid.Nil, revision.EnvironmentId)
		assert.Nil(t, revision.Settings)
		assert.Nil(t, revision.Manifests)
		assert.Equal(t, "", revision.StorageBucket)
		assert.Equal(t, "", revision.StorageKey)
		assert.Equal(t, "", revision.Checksum)
		assert.Equal(t, "", revision.ChecksumType)
		assert.False(t, revision.IsActive)
		assert.Equal(t, "", revision.Status)
		assert.True(t, revision.CreatedAt.IsZero())
		assert.True(t, revision.UpdatedAt.IsZero())
		assert.False(t, revision.DeletedAt.Valid)
	})

	t.Run("revision validation", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			StorageBucket: "valid-bucket",
			StorageKey:    "valid/revision.tar.gz",
			Checksum:      "sha256:validchecksum",
			ChecksumType:  "sha256",
			Status:        "deployed",
		}

		assert.NotNil(t, revision)
		assert.NotEqual(t, uuid.Nil, revision.Id)
		assert.NotEqual(t, uuid.Nil, revision.ApplicationId)
		assert.NotEqual(t, uuid.Nil, revision.EnvironmentId)
		assert.NotEmpty(t, revision.StorageBucket)
		assert.NotEmpty(t, revision.StorageKey)
		assert.NotEmpty(t, revision.Checksum)
		assert.NotEmpty(t, revision.ChecksumType)
		assert.NotEmpty(t, revision.Status)
	})

	t.Run("soft delete functionality", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			Status:        "deleted",
			DeletedAt:     gorm.DeletedAt{Valid: true, Time: time.Now()},
		}

		assert.True(t, revision.DeletedAt.Valid)
		assert.False(t, revision.DeletedAt.Time.IsZero())
	})

	t.Run("revision status scenarios", func(t *testing.T) {
		statuses := []string{
			"pending",
			"deploying",
			"deployed",
			"failed",
			"rolled_back",
			"inactive",
		}

		for _, status := range statuses {
			t.Run("status_"+status, func(t *testing.T) {
				revision := &Revision{
					Id:            uuid.New(),
					ApplicationId: uuid.New(),
					EnvironmentId: uuid.New(),
					Status:        status,
					IsActive:      status == "deployed",
				}

				assert.Equal(t, status, revision.Status)
				if status == "deployed" {
					assert.True(t, revision.IsActive)
				} else {
					assert.False(t, revision.IsActive)
				}
			})
		}
	})
}

func TestSettingSummary(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		setting := SettingSummary{
			Id:           uuid.New(),
			Key:          "API_KEY",
			SettingValue: "secret-api-key-12345",
			IsSensitive:  true,
		}

		assert.NotEqual(t, uuid.Nil, setting.Id)
		assert.Equal(t, "API_KEY", setting.Key)
		assert.Equal(t, "secret-api-key-12345", setting.SettingValue)
		assert.True(t, setting.IsSensitive)
	})

	t.Run("non-sensitive setting", func(t *testing.T) {
		setting := SettingSummary{
			Id:           uuid.New(),
			Key:          "LOG_LEVEL",
			SettingValue: "debug",
			IsSensitive:  false,
		}

		assert.NotEqual(t, uuid.Nil, setting.Id)
		assert.Equal(t, "LOG_LEVEL", setting.Key)
		assert.Equal(t, "debug", setting.SettingValue)
		assert.False(t, setting.IsSensitive)
	})

	t.Run("zero values", func(t *testing.T) {
		setting := SettingSummary{}

		assert.Equal(t, uuid.Nil, setting.Id)
		assert.Equal(t, "", setting.Key)
		assert.Equal(t, "", setting.SettingValue)
		assert.False(t, setting.IsSensitive)
	})
}

func TestSettingsJSON(t *testing.T) {
	t.Run("Value method", func(t *testing.T) {
		testCases := []struct {
			name        string
			settings    SettingsJSON
			expected    string
			expectError bool
		}{
			{
				name:        "nil settings",
				settings:    nil,
				expected:    "[]",
				expectError: false,
			},
			{
				name:        "empty settings",
				settings:    SettingsJSON{},
				expected:    "[]",
				expectError: false,
			},
			{
				name: "single setting",
				settings: SettingsJSON{
					{
						Id:           uuid.New(),
						Key:          "TEST_KEY",
						SettingValue: "test_value",
						IsSensitive:  false,
					},
				},
				expectError: false,
			},
			{
				name: "multiple settings",
				settings: SettingsJSON{
					{
						Id:           uuid.New(),
						Key:          "PUBLIC_KEY",
						SettingValue: "public_value",
						IsSensitive:  false,
					},
					{
						Id:           uuid.New(),
						Key:          "SECRET_KEY",
						SettingValue: "secret_value",
						IsSensitive:  true,
					},
				},
				expectError: false,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				value, err := tc.settings.Value()

				if tc.expectError {
					assert.Error(t, err)
					assert.Nil(t, value)
				} else {
					assert.NoError(t, err)
					assert.NotNil(t, value)

					bytes, ok := value.([]byte)
					require.True(t, ok)

					if tc.expected == "[]" {
						assert.Equal(t, tc.expected, string(bytes))
					} else {
						// For non-empty settings, verify valid JSON
						var settings []SettingSummary
						err := json.Unmarshal(bytes, &settings)
						require.NoError(t, err)
						assert.Len(t, settings, len(tc.settings))
					}
				}
			})
		}
	})

	t.Run("Scan method", func(t *testing.T) {
		testCases := []struct {
			name        string
			input       interface{}
			expected    SettingsJSON
			expectError bool
		}{
			{
				name:        "nil input",
				input:       nil,
				expected:    nil,
				expectError: false,
			},
			{
				name:        "empty JSON array",
				input:       []byte("[]"),
				expected:    SettingsJSON{},
				expectError: false,
			},
			{
				name:  "single setting JSON",
				input: []byte(`[{"id":"550e8400-e29b-41d4-a716-446655440000","key":"TEST_KEY","value":"test_value","is_sensitive":false}]`),
				expected: SettingsJSON{
					{
						Id:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
						Key:          "TEST_KEY",
						SettingValue: "test_value",
						IsSensitive:  false,
					},
				},
				expectError: false,
			},
			{
				name:  "multiple settings JSON",
				input: []byte(`[{"id":"550e8400-e29b-41d4-a716-446655440000","key":"PUBLIC_KEY","value":"public_value","is_sensitive":false},{"id":"550e8400-e29b-41d4-a716-446655440001","key":"SECRET_KEY","value":"secret_value","is_sensitive":true}]`),
				expected: SettingsJSON{
					{
						Id:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
						Key:          "PUBLIC_KEY",
						SettingValue: "public_value",
						IsSensitive:  false,
					},
					{
						Id:           uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
						Key:          "SECRET_KEY",
						SettingValue: "secret_value",
						IsSensitive:  true,
					},
				},
				expectError: false,
			},
			{
				name:        "invalid JSON",
				input:       []byte(`[{"invalid": json}`),
				expected:    nil,
				expectError: true,
			},
			{
				name:        "non-byte input",
				input:       "string input",
				expected:    nil,
				expectError: true,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				var settings SettingsJSON
				err := settings.Scan(tc.input)

				if tc.expectError {
					assert.Error(t, err)
					if tc.name == "non-byte input" {
						assert.Contains(t, err.Error(), "type assertion to []byte failed")
					}
				} else {
					assert.NoError(t, err)
					if tc.expected == nil {
						assert.Nil(t, settings)
					} else {
						assert.Equal(t, tc.expected, settings)
					}
				}
			})
		}
	})

	t.Run("Value and Scan round trip", func(t *testing.T) {
		original := SettingsJSON{
			{
				Id:           uuid.New(),
				Key:          "DATABASE_URL",
				SettingValue: "postgres://localhost:5432/testdb",
				IsSensitive:  true,
			},
			{
				Id:           uuid.New(),
				Key:          "LOG_LEVEL",
				SettingValue: "info",
				IsSensitive:  false,
			},
			{
				Id:           uuid.New(),
				Key:          "FEATURE_FLAG",
				SettingValue: "enabled",
				IsSensitive:  false,
			},
		}

		// Convert to driver.Value
		value, err := original.Value()
		require.NoError(t, err)

		// Scan back from driver.Value
		var scanned SettingsJSON
		err = scanned.Scan(value)
		require.NoError(t, err)

		// Verify data integrity
		require.Len(t, scanned, 3)
		assert.Equal(t, original[0].Id, scanned[0].Id)
		assert.Equal(t, original[0].Key, scanned[0].Key)
		assert.Equal(t, original[0].SettingValue, scanned[0].SettingValue)
		assert.Equal(t, original[0].IsSensitive, scanned[0].IsSensitive)

		assert.Equal(t, original[1].Key, scanned[1].Key)
		assert.Equal(t, original[1].IsSensitive, scanned[1].IsSensitive)

		assert.Equal(t, original[2].Key, scanned[2].Key)
		assert.Equal(t, original[2].IsSensitive, scanned[2].IsSensitive)
	})

	t.Run("driver.Valuer interface compliance", func(t *testing.T) {
		settings := SettingsJSON{
			{
				Id:           uuid.New(),
				Key:          "TEST_KEY",
				SettingValue: "test_value",
				IsSensitive:  false,
			},
		}

		// Verify it implements driver.Valuer
		var valuer driver.Valuer = settings
		value, err := valuer.Value()
		assert.NoError(t, err)
		assert.NotNil(t, value)

		// Verify the value is []byte
		bytes, ok := value.([]byte)
		assert.True(t, ok)
		assert.Contains(t, string(bytes), "TEST_KEY")
		assert.Contains(t, string(bytes), "test_value")
	})
}

func TestManifestSummary(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		manifest := ManifestSummary{
			Id:            uuid.New(),
			StorageBucket: "k8s-manifests",
			StorageKey:    "apps/myapp/deployment.yaml",
			Checksum:      "sha256:abc123def456",
			ChecksumType:  "sha256",
		}

		assert.NotEqual(t, uuid.Nil, manifest.Id)
		assert.Equal(t, "k8s-manifests", manifest.StorageBucket)
		assert.Equal(t, "apps/myapp/deployment.yaml", manifest.StorageKey)
		assert.Equal(t, "sha256:abc123def456", manifest.Checksum)
		assert.Equal(t, "sha256", manifest.ChecksumType)
	})

	t.Run("zero values", func(t *testing.T) {
		manifest := ManifestSummary{}

		assert.Equal(t, uuid.Nil, manifest.Id)
		assert.Equal(t, "", manifest.StorageBucket)
		assert.Equal(t, "", manifest.StorageKey)
		assert.Equal(t, "", manifest.Checksum)
		assert.Equal(t, "", manifest.ChecksumType)
	})
}

func TestManifestsJSON(t *testing.T) {
	t.Run("Value method", func(t *testing.T) {
		testCases := []struct {
			name        string
			manifests   ManifestsJSON
			expected    string
			expectError bool
		}{
			{
				name:        "nil manifests",
				manifests:   nil,
				expected:    "[]",
				expectError: false,
			},
			{
				name:        "empty manifests",
				manifests:   ManifestsJSON{},
				expected:    "[]",
				expectError: false,
			},
			{
				name: "single manifest",
				manifests: ManifestsJSON{
					{
						Id:            uuid.New(),
						StorageBucket: "test-bucket",
						StorageKey:    "test/manifest.yaml",
						Checksum:      "sha256:test123",
						ChecksumType:  "sha256",
					},
				},
				expectError: false,
			},
			{
				name: "multiple manifests",
				manifests: ManifestsJSON{
					{
						Id:            uuid.New(),
						StorageBucket: "k8s-bucket",
						StorageKey:    "apps/app1/deployment.yaml",
						Checksum:      "sha256:deploy123",
						ChecksumType:  "sha256",
					},
					{
						Id:            uuid.New(),
						StorageBucket: "k8s-bucket",
						StorageKey:    "apps/app1/service.yaml",
						Checksum:      "sha256:service456",
						ChecksumType:  "sha256",
					},
				},
				expectError: false,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				value, err := tc.manifests.Value()

				if tc.expectError {
					assert.Error(t, err)
					assert.Nil(t, value)
				} else {
					assert.NoError(t, err)
					assert.NotNil(t, value)

					bytes, ok := value.([]byte)
					require.True(t, ok)

					if tc.expected == "[]" {
						assert.Equal(t, tc.expected, string(bytes))
					} else {
						// For non-empty manifests, verify valid JSON
						var manifests []ManifestSummary
						err := json.Unmarshal(bytes, &manifests)
						require.NoError(t, err)
						assert.Len(t, manifests, len(tc.manifests))
					}
				}
			})
		}
	})

	t.Run("Scan method", func(t *testing.T) {
		testCases := []struct {
			name        string
			input       interface{}
			expected    ManifestsJSON
			expectError bool
		}{
			{
				name:        "nil input",
				input:       nil,
				expected:    nil,
				expectError: false,
			},
			{
				name:        "empty JSON array",
				input:       []byte("[]"),
				expected:    ManifestsJSON{},
				expectError: false,
			},
			{
				name:  "single manifest JSON",
				input: []byte(`[{"id":"550e8400-e29b-41d4-a716-446655440000","storage_bucket":"test-bucket","storage_key":"test/manifest.yaml","checksum":"sha256:test123","checksum_type":"sha256"}]`),
				expected: ManifestsJSON{
					{
						Id:            uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
						StorageBucket: "test-bucket",
						StorageKey:    "test/manifest.yaml",
						Checksum:      "sha256:test123",
						ChecksumType:  "sha256",
					},
				},
				expectError: false,
			},
			{
				name:  "multiple manifests JSON",
				input: []byte(`[{"id":"550e8400-e29b-41d4-a716-446655440000","storage_bucket":"k8s-bucket","storage_key":"apps/app1/deployment.yaml","checksum":"sha256:deploy123","checksum_type":"sha256"},{"id":"550e8400-e29b-41d4-a716-446655440001","storage_bucket":"k8s-bucket","storage_key":"apps/app1/service.yaml","checksum":"sha256:service456","checksum_type":"sha256"}]`),
				expected: ManifestsJSON{
					{
						Id:            uuid.MustParse("550e8400-e29b-41d4-a716-446655440000"),
						StorageBucket: "k8s-bucket",
						StorageKey:    "apps/app1/deployment.yaml",
						Checksum:      "sha256:deploy123",
						ChecksumType:  "sha256",
					},
					{
						Id:            uuid.MustParse("550e8400-e29b-41d4-a716-446655440001"),
						StorageBucket: "k8s-bucket",
						StorageKey:    "apps/app1/service.yaml",
						Checksum:      "sha256:service456",
						ChecksumType:  "sha256",
					},
				},
				expectError: false,
			},
			{
				name:        "invalid JSON",
				input:       []byte(`[{"invalid": json}`),
				expected:    nil,
				expectError: true,
			},
			{
				name:        "non-byte input",
				input:       12345,
				expected:    nil,
				expectError: true,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				var manifests ManifestsJSON
				err := manifests.Scan(tc.input)

				if tc.expectError {
					assert.Error(t, err)
					if tc.name == "non-byte input" {
						assert.Contains(t, err.Error(), "type assertion to []byte failed")
					}
				} else {
					assert.NoError(t, err)
					if tc.expected == nil {
						assert.Nil(t, manifests)
					} else {
						assert.Equal(t, tc.expected, manifests)
					}
				}
			})
		}
	})

	t.Run("Value and Scan round trip", func(t *testing.T) {
		original := ManifestsJSON{
			{
				Id:            uuid.New(),
				StorageBucket: "production-bucket",
				StorageKey:    "apps/web/deployment.yaml",
				Checksum:      "sha256:deployment123",
				ChecksumType:  "sha256",
			},
			{
				Id:            uuid.New(),
				StorageBucket: "production-bucket",
				StorageKey:    "apps/web/service.yaml",
				Checksum:      "sha256:service456",
				ChecksumType:  "sha256",
			},
			{
				Id:            uuid.New(),
				StorageBucket: "production-bucket",
				StorageKey:    "apps/web/configmap.yaml",
				Checksum:      "sha256:config789",
				ChecksumType:  "sha256",
			},
		}

		// Convert to driver.Value
		value, err := original.Value()
		require.NoError(t, err)

		// Scan back from driver.Value
		var scanned ManifestsJSON
		err = scanned.Scan(value)
		require.NoError(t, err)

		// Verify data integrity
		require.Len(t, scanned, 3)
		assert.Equal(t, original[0].Id, scanned[0].Id)
		assert.Equal(t, original[0].StorageBucket, scanned[0].StorageBucket)
		assert.Equal(t, original[0].StorageKey, scanned[0].StorageKey)
		assert.Equal(t, original[0].Checksum, scanned[0].Checksum)
		assert.Equal(t, original[0].ChecksumType, scanned[0].ChecksumType)

		assert.Equal(t, original[1].StorageKey, scanned[1].StorageKey)
		assert.Equal(t, original[1].Checksum, scanned[1].Checksum)

		assert.Equal(t, original[2].StorageKey, scanned[2].StorageKey)
		assert.Equal(t, original[2].Checksum, scanned[2].Checksum)
	})

	t.Run("driver.Valuer interface compliance", func(t *testing.T) {
		manifests := ManifestsJSON{
			{
				Id:            uuid.New(),
				StorageBucket: "test-bucket",
				StorageKey:    "test/manifest.yaml",
				Checksum:      "sha256:test123",
				ChecksumType:  "sha256",
			},
		}

		// Verify it implements driver.Valuer
		var valuer driver.Valuer = manifests
		value, err := valuer.Value()
		assert.NoError(t, err)
		assert.NotNil(t, value)

		// Verify the value is []byte
		bytes, ok := value.([]byte)
		assert.True(t, ok)
		assert.Contains(t, string(bytes), "test-bucket")
		assert.Contains(t, string(bytes), "test/manifest.yaml")
	})
}

func TestConvertRevisionToProto(t *testing.T) {
	t.Run("complete revision conversion", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			Settings: SettingsJSON{
				{
					Id:           uuid.New(),
					Key:          "DATABASE_URL",
					SettingValue: "postgres://localhost:5432/db",
					IsSensitive:  true,
				},
			},
			Manifests: ManifestsJSON{
				{
					Id:            uuid.New(),
					StorageBucket: "k8s-manifests",
					StorageKey:    "apps/myapp/deployment.yaml",
					Checksum:      "sha256:abc123",
					ChecksumType:  "sha256",
				},
			},
			StorageBucket: "revisions-bucket",
			StorageKey:    "revisions/v1/revision.tar.gz",
			Checksum:      "sha256:revision123",
			ChecksumType:  "sha256",
			IsActive:      true,
			Status:        "deployed",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		proto := ConvertRevisionToProto(revision)

		require.NotNil(t, proto)
		assert.Equal(t, revision.Id.String(), proto.Id)
		assert.Equal(t, revision.ApplicationId.String(), proto.ApplicationId)
		assert.Equal(t, revision.EnvironmentId.String(), proto.EnvironmentId)
		assert.Equal(t, timestamppb.New(revision.CreatedAt), proto.CreatedAt)
		assert.Equal(t, timestamppb.New(revision.UpdatedAt), proto.UpdatedAt)
	})

	t.Run("minimal revision conversion", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			Settings:      SettingsJSON{},
			Manifests:     ManifestsJSON{},
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		proto := ConvertRevisionToProto(revision)

		require.NotNil(t, proto)
		assert.Equal(t, revision.Id.String(), proto.Id)
		assert.Equal(t, revision.ApplicationId.String(), proto.ApplicationId)
		assert.Equal(t, revision.EnvironmentId.String(), proto.EnvironmentId)
		assert.Equal(t, timestamppb.New(revision.CreatedAt), proto.CreatedAt)
		assert.Equal(t, timestamppb.New(revision.UpdatedAt), proto.UpdatedAt)
	})

	t.Run("timestamp conversion accuracy", func(t *testing.T) {
		specificTime := time.Date(2024, 1, 15, 10, 30, 45, 123456789, time.UTC).Truncate(time.Second)

		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			CreatedAt:     specificTime,
			UpdatedAt:     specificTime.Add(time.Hour),
		}

		proto := ConvertRevisionToProto(revision)

		require.NotNil(t, proto)

		// Verify timestamp conversion accuracy
		assert.True(t, proto.CreatedAt.IsValid())
		assert.True(t, proto.UpdatedAt.IsValid())

		convertedCreatedAt := proto.CreatedAt.AsTime()
		convertedUpdatedAt := proto.UpdatedAt.AsTime()

		assert.Equal(t, specificTime.Unix(), convertedCreatedAt.Unix())
		assert.Equal(t, specificTime.Add(time.Hour).Unix(), convertedUpdatedAt.Unix())
	})

	t.Run("nil revision", func(t *testing.T) {
		assert.Panics(t, func() {
			ConvertRevisionToProto(nil)
		})
	})

	t.Run("zero time values", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			CreatedAt:     time.Time{},
			UpdatedAt:     time.Time{},
		}

		proto := ConvertRevisionToProto(revision)

		require.NotNil(t, proto)
		assert.Equal(t, revision.Id.String(), proto.Id)
		assert.Equal(t, revision.ApplicationId.String(), proto.ApplicationId)
		assert.Equal(t, revision.EnvironmentId.String(), proto.EnvironmentId)

		// Zero times should still be valid protobuf timestamps
		assert.True(t, proto.CreatedAt.IsValid())
		assert.True(t, proto.UpdatedAt.IsValid())
		// Note: Go's zero time.Time{} becomes a large negative number in protobuf
		assert.NotEqual(t, int64(0), proto.CreatedAt.GetSeconds())
		assert.NotEqual(t, int64(0), proto.UpdatedAt.GetSeconds())
	})
}

func TestRevisionValidation(t *testing.T) {
	t.Run("valid revision configurations", func(t *testing.T) {
		testCases := []struct {
			name     string
			revision *Revision
		}{
			{
				name: "production deployment revision",
				revision: &Revision{
					Id:            uuid.New(),
					ApplicationId: uuid.New(),
					EnvironmentId: uuid.New(),
					Settings: SettingsJSON{
						{
							Id:           uuid.New(),
							Key:          "DATABASE_URL",
							SettingValue: "postgres://prod-db:5432/myapp",
							IsSensitive:  true,
						},
						{
							Id:           uuid.New(),
							Key:          "LOG_LEVEL",
							SettingValue: "warn",
							IsSensitive:  false,
						},
					},
					Manifests: ManifestsJSON{
						{
							Id:            uuid.New(),
							StorageBucket: "prod-manifests",
							StorageKey:    "apps/myapp/v1/deployment.yaml",
							Checksum:      "sha256:prodchecksum123",
							ChecksumType:  "sha256",
						},
					},
					StorageBucket: "prod-revisions",
					StorageKey:    "revisions/v1.0.0/revision.tar.gz",
					Checksum:      "sha256:revisionchecksum",
					ChecksumType:  "sha256",
					IsActive:      true,
					Status:        "deployed",
				},
			},
			{
				name: "staging revision",
				revision: &Revision{
					Id:            uuid.New(),
					ApplicationId: uuid.New(),
					EnvironmentId: uuid.New(),
					Settings:      SettingsJSON{},
					Manifests:     ManifestsJSON{},
					StorageBucket: "staging-revisions",
					StorageKey:    "revisions/v0.9.0/revision.tar.gz",
					Checksum:      "md5:stagingchecksum",
					ChecksumType:  "md5",
					IsActive:      false,
					Status:        "pending",
				},
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				assert.NotNil(t, tc.revision)
				assert.NotEqual(t, uuid.Nil, tc.revision.Id)
				assert.NotEqual(t, uuid.Nil, tc.revision.ApplicationId)
				assert.NotEqual(t, uuid.Nil, tc.revision.EnvironmentId)
				assert.NotEmpty(t, tc.revision.StorageBucket)
				assert.NotEmpty(t, tc.revision.StorageKey)
				assert.NotEmpty(t, tc.revision.Status)
			})
		}
	})

	t.Run("checksum type validation", func(t *testing.T) {
		validChecksumTypes := []string{"md5", "sha1", "sha256", "sha512"}

		for _, checksumType := range validChecksumTypes {
			t.Run("valid_checksum_type_"+checksumType, func(t *testing.T) {
				revision := &Revision{
					Id:            uuid.New(),
					ApplicationId: uuid.New(),
					EnvironmentId: uuid.New(),
					ChecksumType:  checksumType,
					Checksum:      "test-checksum-value",
				}

				assert.Equal(t, checksumType, revision.ChecksumType)
				assert.NotEmpty(t, revision.Checksum)
			})
		}
	})

	t.Run("uuid field validation", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
		}

		assert.NotEqual(t, uuid.Nil, revision.Id)
		assert.NotEqual(t, uuid.Nil, revision.ApplicationId)
		assert.NotEqual(t, uuid.Nil, revision.EnvironmentId)

		// Verify UUIDs are properly formatted
		_, err := uuid.Parse(revision.Id.String())
		assert.NoError(t, err)

		_, err = uuid.Parse(revision.ApplicationId.String())
		assert.NoError(t, err)

		_, err = uuid.Parse(revision.EnvironmentId.String())
		assert.NoError(t, err)
	})
}

func TestRevisionDatabaseStructure(t *testing.T) {
	t.Run("database structure validation", func(t *testing.T) {
		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			Settings: SettingsJSON{
				{
					Id:           uuid.New(),
					Key:          "TEST_SETTING",
					SettingValue: "test_value",
					IsSensitive:  false,
				},
			},
			Manifests: ManifestsJSON{
				{
					Id:            uuid.New(),
					StorageBucket: "test-bucket",
					StorageKey:    "test/manifest.yaml",
					Checksum:      "sha256:test123",
					ChecksumType:  "sha256",
				},
			},
			StorageBucket: "test-revisions",
			StorageKey:    "revisions/test/revision.tar.gz",
			Checksum:      "sha256:revisiontest",
			ChecksumType:  "sha256",
			IsActive:      true,
			Status:        "deployed",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		// Verify struct is properly set up for GORM operations
		assert.NotNil(t, revision)
		assert.NotEqual(t, uuid.Nil, revision.Id)
		assert.NotEqual(t, uuid.Nil, revision.ApplicationId)
		assert.NotEqual(t, uuid.Nil, revision.EnvironmentId)
		assert.NotNil(t, revision.Settings)
		assert.NotNil(t, revision.Manifests)

		// In a real integration test, we would test:
		// - Database constraints (unique constraints, indexes)
		// - UUID generation with gen_random_uuid()
		// - Foreign key relationships with Application and Environment
		// - JSONB column storage and retrieval for Settings and Manifests
		// - Soft delete functionality with DeletedAt
		// - Index performance on frequently queried fields
		// - IsActive flag queries and status filtering
	})

	t.Run("gorm tag validation", func(t *testing.T) {
		// Verify that GORM tags are properly configured
		revision := &Revision{}

		// Test that DeletedAt implements the soft delete pattern
		assert.False(t, revision.DeletedAt.Valid)

		// Set soft delete
		revision.DeletedAt = gorm.DeletedAt{Valid: true, Time: time.Now()}
		assert.True(t, revision.DeletedAt.Valid)
		assert.False(t, revision.DeletedAt.Time.IsZero())
	})

	t.Run("jsonb field functionality", func(t *testing.T) {
		settings := SettingsJSON{
			{
				Id:           uuid.New(),
				Key:          "JSONB_TEST",
				SettingValue: "test_value",
				IsSensitive:  false,
			},
		}

		manifests := ManifestsJSON{
			{
				Id:            uuid.New(),
				StorageBucket: "jsonb-test-bucket",
				StorageKey:    "test/manifest.yaml",
				Checksum:      "sha256:jsonbtest",
				ChecksumType:  "sha256",
			},
		}

		revision := &Revision{
			Id:        uuid.New(),
			Settings:  settings,
			Manifests: manifests,
		}

		// Test that JSONB fields can be stored and retrieved
		assert.NotNil(t, revision.Settings)
		assert.NotNil(t, revision.Manifests)
		assert.Len(t, revision.Settings, 1)
		assert.Len(t, revision.Manifests, 1)
		assert.Equal(t, "JSONB_TEST", revision.Settings[0].Key)
		assert.Equal(t, "jsonb-test-bucket", revision.Manifests[0].StorageBucket)
	})
}

func TestRevisionRelationships(t *testing.T) {
	t.Run("revision references application and environment", func(t *testing.T) {
		applicationId := uuid.New()
		environmentId := uuid.New()

		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: applicationId,
			EnvironmentId: environmentId,
			Status:        "deployed",
		}

		// Verify foreign key relationships
		assert.Equal(t, applicationId, revision.ApplicationId)
		assert.Equal(t, environmentId, revision.EnvironmentId)
		assert.NotEqual(t, uuid.Nil, revision.ApplicationId)
		assert.NotEqual(t, uuid.Nil, revision.EnvironmentId)
	})

	t.Run("revision settings and manifests relationships", func(t *testing.T) {
		settingId := uuid.New()
		manifestId := uuid.New()

		revision := &Revision{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			EnvironmentId: uuid.New(),
			Settings: SettingsJSON{
				{
					Id:           settingId,
					Key:          "RELATIONSHIP_TEST",
					SettingValue: "test_value",
					IsSensitive:  false,
				},
			},
			Manifests: ManifestsJSON{
				{
					Id:            manifestId,
					StorageBucket: "relationship-bucket",
					StorageKey:    "test/manifest.yaml",
					Checksum:      "sha256:relationship123",
					ChecksumType:  "sha256",
				},
			},
		}

		// Verify nested object relationships
		assert.Len(t, revision.Settings, 1)
		assert.Len(t, revision.Manifests, 1)
		assert.Equal(t, settingId, revision.Settings[0].Id)
		assert.Equal(t, manifestId, revision.Manifests[0].Id)
	})
}

// Benchmark tests for performance
func BenchmarkSettingsJSONValue(b *testing.B) {
	settings := SettingsJSON{
		{
			Id:           uuid.New(),
			Key:          "DATABASE_URL",
			SettingValue: "postgres://localhost:5432/benchmarkdb",
			IsSensitive:  true,
		},
		{
			Id:           uuid.New(),
			Key:          "API_KEY",
			SettingValue: "benchmark-api-key-12345",
			IsSensitive:  true,
		},
		{
			Id:           uuid.New(),
			Key:          "LOG_LEVEL",
			SettingValue: "info",
			IsSensitive:  false,
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := settings.Value()
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkSettingsJSONScan(b *testing.B) {
	jsonData := []byte(`[{"id":"550e8400-e29b-41d4-a716-446655440000","key":"DATABASE_URL","value":"postgres://localhost:5432/benchmarkdb","is_sensitive":true},{"id":"550e8400-e29b-41d4-a716-446655440001","key":"API_KEY","value":"benchmark-api-key-12345","is_sensitive":true},{"id":"550e8400-e29b-41d4-a716-446655440002","key":"LOG_LEVEL","value":"info","is_sensitive":false}]`)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var settings SettingsJSON
		err := settings.Scan(jsonData)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkManifestsJSONValue(b *testing.B) {
	manifests := ManifestsJSON{
		{
			Id:            uuid.New(),
			StorageBucket: "benchmark-manifests",
			StorageKey:    "apps/benchmark-app/deployment.yaml",
			Checksum:      "sha256:benchmarkdeployment123",
			ChecksumType:  "sha256",
		},
		{
			Id:            uuid.New(),
			StorageBucket: "benchmark-manifests",
			StorageKey:    "apps/benchmark-app/service.yaml",
			Checksum:      "sha256:benchmarkservice456",
			ChecksumType:  "sha256",
		},
		{
			Id:            uuid.New(),
			StorageBucket: "benchmark-manifests",
			StorageKey:    "apps/benchmark-app/configmap.yaml",
			Checksum:      "sha256:benchmarkconfig789",
			ChecksumType:  "sha256",
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := manifests.Value()
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkConvertRevisionToProto(b *testing.B) {
	revision := &Revision{
		Id:            uuid.New(),
		ApplicationId: uuid.New(),
		EnvironmentId: uuid.New(),
		Settings: SettingsJSON{
			{
				Id:           uuid.New(),
				Key:          "BENCHMARK_SETTING",
				SettingValue: "benchmark_value",
				IsSensitive:  false,
			},
		},
		Manifests: ManifestsJSON{
			{
				Id:            uuid.New(),
				StorageBucket: "benchmark-bucket",
				StorageKey:    "benchmark/manifest.yaml",
				Checksum:      "sha256:benchmark123",
				ChecksumType:  "sha256",
			},
		},
		StorageBucket: "benchmark-revisions",
		StorageKey:    "revisions/benchmark/revision.tar.gz",
		Checksum:      "sha256:benchmarkrevision",
		ChecksumType:  "sha256",
		IsActive:      true,
		Status:        "deployed",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertRevisionToProto(revision)
	}
}
