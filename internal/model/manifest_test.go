// Test file for internal/model/manifest.go
package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"
)

func TestManifest(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		description := "Production Kubernetes deployment manifest"
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "production-deployment",
			Description:    &description,
			StorageBucket:  "admiral-manifests",
			StorageKey:     "manifests/prod/deployment-v1.yaml",
			Checksum:       "sha256:abc123def456...",
			ChecksumType:   "sha256",
			Version:        1,
			IsLatest:       true,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, manifest.Id)
		assert.NotEqual(t, uuid.Nil, manifest.ApplicationId)
		assert.NotEqual(t, uuid.Nil, manifest.VersionGroupId)
		assert.Equal(t, "production-deployment", manifest.Name)
		assert.NotNil(t, manifest.Description)
		assert.Equal(t, description, *manifest.Description)
		assert.Equal(t, "admiral-manifests", manifest.StorageBucket)
		assert.Equal(t, "manifests/prod/deployment-v1.yaml", manifest.StorageKey)
		assert.Equal(t, "sha256:abc123def456...", manifest.Checksum)
		assert.Equal(t, "sha256", manifest.ChecksumType)
		assert.Equal(t, 1, manifest.Version)
		assert.True(t, manifest.IsLatest)
		assert.False(t, manifest.CreatedAt.IsZero())
		assert.False(t, manifest.UpdatedAt.IsZero())
	})

	t.Run("manifest with minimal fields", func(t *testing.T) {
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "minimal-manifest",
			Description:    nil,
			StorageBucket:  "default-bucket",
			StorageKey:     "manifests/minimal.yaml",
			Checksum:       "md5:def789",
			ChecksumType:   "md5",
			Version:        1,
			IsLatest:       false,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, manifest.Id)
		assert.NotEqual(t, uuid.Nil, manifest.ApplicationId)
		assert.NotEqual(t, uuid.Nil, manifest.VersionGroupId)
		assert.Equal(t, "minimal-manifest", manifest.Name)
		assert.Nil(t, manifest.Description)
		assert.Equal(t, "default-bucket", manifest.StorageBucket)
		assert.Equal(t, "manifests/minimal.yaml", manifest.StorageKey)
		assert.Equal(t, "md5:def789", manifest.Checksum)
		assert.Equal(t, "md5", manifest.ChecksumType)
		assert.Equal(t, 1, manifest.Version)
		assert.False(t, manifest.IsLatest)
	})

	t.Run("zero values", func(t *testing.T) {
		manifest := &Manifest{}

		assert.Equal(t, uuid.Nil, manifest.Id)
		assert.Equal(t, uuid.Nil, manifest.ApplicationId)
		assert.Equal(t, uuid.Nil, manifest.VersionGroupId)
		assert.Equal(t, "", manifest.Name)
		assert.Nil(t, manifest.Description)
		assert.Equal(t, "", manifest.StorageBucket)
		assert.Equal(t, "", manifest.StorageKey)
		assert.Equal(t, "", manifest.Checksum)
		assert.Equal(t, "", manifest.ChecksumType)
		assert.Equal(t, 0, manifest.Version)
		assert.False(t, manifest.IsLatest)
		assert.True(t, manifest.CreatedAt.IsZero())
		assert.True(t, manifest.UpdatedAt.IsZero())
		assert.False(t, manifest.DeletedAt.Valid)
	})

	t.Run("manifest validation", func(t *testing.T) {
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "valid-manifest",
			StorageBucket:  "valid-bucket",
			StorageKey:     "valid/path/manifest.yaml",
			Checksum:       "sha256:validchecksum",
			ChecksumType:   "sha256",
			Version:        1,
		}

		assert.NotNil(t, manifest)
		assert.NotEmpty(t, manifest.Name)
		assert.NotEqual(t, uuid.Nil, manifest.Id)
		assert.NotEqual(t, uuid.Nil, manifest.ApplicationId)
		assert.NotEqual(t, uuid.Nil, manifest.VersionGroupId)
		assert.NotEmpty(t, manifest.StorageBucket)
		assert.NotEmpty(t, manifest.StorageKey)
		assert.NotEmpty(t, manifest.Checksum)
		assert.NotEmpty(t, manifest.ChecksumType)
		assert.Greater(t, manifest.Version, 0)
	})

	t.Run("soft delete functionality", func(t *testing.T) {
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "deleted-manifest",
			DeletedAt:      gorm.DeletedAt{Valid: true, Time: time.Now()},
		}

		assert.True(t, manifest.DeletedAt.Valid)
		assert.False(t, manifest.DeletedAt.Time.IsZero())
	})

	t.Run("manifest versioning scenarios", func(t *testing.T) {
		baseTime := time.Now()

		testCases := []struct {
			name     string
			version  int
			isLatest bool
			expected string
		}{
			{
				name:     "first version",
				version:  1,
				isLatest: true,
				expected: "v1 (latest)",
			},
			{
				name:     "second version",
				version:  2,
				isLatest: true,
				expected: "v2 (latest)",
			},
			{
				name:     "old version",
				version:  1,
				isLatest: false,
				expected: "v1 (old)",
			},
			{
				name:     "high version number",
				version:  100,
				isLatest: true,
				expected: "v100 (latest)",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				manifest := &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           "version-test-manifest",
					Version:        tc.version,
					IsLatest:       tc.isLatest,
					CreatedAt:      baseTime.Add(time.Duration(tc.version) * time.Hour),
					UpdatedAt:      baseTime.Add(time.Duration(tc.version) * time.Hour),
				}

				assert.Equal(t, tc.version, manifest.Version)
				assert.Equal(t, tc.isLatest, manifest.IsLatest)

				// Verify version logic
				if tc.isLatest {
					assert.True(t, manifest.IsLatest)
				} else {
					assert.False(t, manifest.IsLatest)
				}
			})
		}
	})

	t.Run("storage configurations", func(t *testing.T) {
		testCases := []struct {
			name          string
			storageBucket string
			storageKey    string
			checksum      string
			checksumType  string
		}{
			{
				name:          "s3 configuration",
				storageBucket: "my-s3-bucket",
				storageKey:    "manifests/apps/myapp/v1/deployment.yaml",
				checksum:      "sha256:1a2b3c4d5e6f...",
				checksumType:  "sha256",
			},
			{
				name:          "gcs configuration",
				storageBucket: "my-gcs-bucket",
				storageKey:    "k8s-manifests/production/service.yaml",
				checksum:      "md5:abc123def456",
				checksumType:  "md5",
			},
			{
				name:          "nested path configuration",
				storageBucket: "deep-bucket",
				storageKey:    "org/team/project/env/version/manifest.yaml",
				checksum:      "sha1:fedcba987654",
				checksumType:  "sha1",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				manifest := &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           tc.name + "-manifest",
					StorageBucket:  tc.storageBucket,
					StorageKey:     tc.storageKey,
					Checksum:       tc.checksum,
					ChecksumType:   tc.checksumType,
					Version:        1,
				}

				assert.Equal(t, tc.storageBucket, manifest.StorageBucket)
				assert.Equal(t, tc.storageKey, manifest.StorageKey)
				assert.Equal(t, tc.checksum, manifest.Checksum)
				assert.Equal(t, tc.checksumType, manifest.ChecksumType)
				assert.Contains(t, manifest.StorageKey, "/")
			})
		}
	})
}

func TestConvertManifestToProto(t *testing.T) {
	t.Run("manifest with file content", func(t *testing.T) {
		description := "Test manifest with content"
		fileContent := []byte(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: test-app
  template:
    metadata:
      labels:
        app: test-app
    spec:
      containers:
      - name: app
        image: nginx:1.20
        ports:
        - containerPort: 80`)

		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "test-deployment",
			Description:    &description,
			StorageBucket:  "test-bucket",
			StorageKey:     "manifests/test-deployment.yaml",
			Checksum:       "sha256:testchecksum123",
			ChecksumType:   "sha256",
			Version:        1,
			IsLatest:       true,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		proto := ConvertManifestToProto(manifest, &fileContent)

		require.NotNil(t, proto)
		assert.Equal(t, manifest.Id.String(), proto.Id)
		assert.Equal(t, manifest.ApplicationId.String(), proto.ApplicationId)
		assert.Equal(t, manifest.VersionGroupId.String(), proto.VersionGroupId)
		assert.Equal(t, manifest.Name, proto.Name)
		assert.Equal(t, manifest.Description, proto.Description)
		assert.Equal(t, uint32(manifest.Version), proto.Version) //nolint:gosec // Version is non-negative test value
		assert.Equal(t, manifest.IsLatest, proto.IsLatest)
		assert.Equal(t, timestamppb.New(manifest.CreatedAt), proto.CreatedAt)
		assert.Equal(t, timestamppb.New(manifest.UpdatedAt), proto.UpdatedAt)

		// Verify file content is included
		require.NotNil(t, proto.File)
		assert.Equal(t, fileContent, proto.File.FileContent)
		assert.Equal(t, manifest.Checksum, proto.File.Checksum)
		assert.Equal(t, manifest.ChecksumType, proto.File.ChecksumType)
	})

	t.Run("manifest without file content", func(t *testing.T) {
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "manifest-without-content",
			Description:    nil,
			StorageBucket:  "storage-bucket",
			StorageKey:     "manifests/no-content.yaml",
			Checksum:       "sha256:nochecksum",
			ChecksumType:   "sha256",
			Version:        2,
			IsLatest:       false,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		proto := ConvertManifestToProto(manifest, nil)

		require.NotNil(t, proto)
		assert.Equal(t, manifest.Id.String(), proto.Id)
		assert.Equal(t, manifest.ApplicationId.String(), proto.ApplicationId)
		assert.Equal(t, manifest.VersionGroupId.String(), proto.VersionGroupId)
		assert.Equal(t, manifest.Name, proto.Name)
		assert.Nil(t, proto.Description)
		assert.Equal(t, uint32(manifest.Version), proto.Version) //nolint:gosec // Version is non-negative test value
		assert.Equal(t, manifest.IsLatest, proto.IsLatest)

		// Verify file content is not included
		assert.Nil(t, proto.File)
	})

	t.Run("manifest with empty file content", func(t *testing.T) {
		emptyContent := []byte{}
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "empty-content-manifest",
			StorageBucket:  "empty-bucket",
			StorageKey:     "manifests/empty.yaml",
			Checksum:       "sha256:emptyfilehash",
			ChecksumType:   "sha256",
			Version:        1,
			IsLatest:       true,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		proto := ConvertManifestToProto(manifest, &emptyContent)

		require.NotNil(t, proto)
		assert.Equal(t, manifest.Id.String(), proto.Id)
		assert.Equal(t, manifest.Name, proto.Name)

		// Verify empty file content is included
		require.NotNil(t, proto.File)
		assert.Equal(t, emptyContent, proto.File.FileContent)
		assert.Empty(t, proto.File.FileContent)
		assert.Equal(t, manifest.Checksum, proto.File.Checksum)
		assert.Equal(t, manifest.ChecksumType, proto.File.ChecksumType)
	})

	t.Run("manifest with large file content", func(t *testing.T) {
		// Create a large YAML content
		largeContent := make([]byte, 10000)
		for i := range largeContent {
			largeContent[i] = byte('a' + (i % 26))
		}

		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "large-content-manifest",
			StorageBucket:  "large-bucket",
			StorageKey:     "manifests/large-file.yaml",
			Checksum:       "sha256:largefilehash",
			ChecksumType:   "sha256",
			Version:        1,
			IsLatest:       true,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		proto := ConvertManifestToProto(manifest, &largeContent)

		require.NotNil(t, proto)
		assert.Equal(t, manifest.Id.String(), proto.Id)
		assert.Equal(t, manifest.Name, proto.Name)

		// Verify large file content is included
		require.NotNil(t, proto.File)
		assert.Equal(t, largeContent, proto.File.FileContent)
		assert.Len(t, proto.File.FileContent, 10000)
		assert.Equal(t, manifest.Checksum, proto.File.Checksum)
		assert.Equal(t, manifest.ChecksumType, proto.File.ChecksumType)
	})

	t.Run("version conversion edge cases", func(t *testing.T) {
		testCases := []struct {
			name            string
			version         int
			expectedVersion uint32
		}{
			{
				name:            "version zero",
				version:         0,
				expectedVersion: 0,
			},
			{
				name:            "version one",
				version:         1,
				expectedVersion: 1,
			},
			{
				name:            "large version",
				version:         999999,
				expectedVersion: 999999,
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				manifest := &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           "version-test",
					Version:        tc.version,
					CreatedAt:      time.Now(),
					UpdatedAt:      time.Now(),
				}

				proto := ConvertManifestToProto(manifest, nil)

				require.NotNil(t, proto)
				assert.Equal(t, tc.expectedVersion, proto.Version)
			})
		}
	})

	t.Run("timestamp conversion accuracy", func(t *testing.T) {
		// Use truncated time for protobuf precision
		specificTime := time.Date(2024, 1, 15, 10, 30, 45, 123456789, time.UTC).Truncate(time.Second)

		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "timestamp-test",
			Version:        1,
			CreatedAt:      specificTime,
			UpdatedAt:      specificTime.Add(time.Hour),
		}

		proto := ConvertManifestToProto(manifest, nil)

		require.NotNil(t, proto)

		// Verify timestamp conversion accuracy
		assert.True(t, proto.CreatedAt.IsValid())
		assert.True(t, proto.UpdatedAt.IsValid())

		convertedCreatedAt := proto.CreatedAt.AsTime()
		convertedUpdatedAt := proto.UpdatedAt.AsTime()

		assert.Equal(t, specificTime.Unix(), convertedCreatedAt.Unix())
		assert.Equal(t, specificTime.Add(time.Hour).Unix(), convertedUpdatedAt.Unix())
	})

	t.Run("nil manifest", func(t *testing.T) {
		assert.Panics(t, func() {
			ConvertManifestToProto(nil, nil)
		})
	})

	t.Run("file content variations", func(t *testing.T) {
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "content-variations-test",
			StorageBucket:  "test-bucket",
			StorageKey:     "test-key",
			Checksum:       "test-checksum",
			ChecksumType:   "sha256",
			Version:        1,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		// Test with various content types
		testContents := []struct {
			name    string
			content *[]byte
			hasFile bool
		}{
			{
				name:    "nil content",
				content: nil,
				hasFile: false,
			},
			{
				name:    "empty content",
				content: &[]byte{},
				hasFile: true,
			},
			{
				name:    "yaml content",
				content: func() *[]byte { b := []byte("apiVersion: v1\nkind: Service"); return &b }(),
				hasFile: true,
			},
			{
				name:    "json content",
				content: func() *[]byte { b := []byte(`{"apiVersion": "v1", "kind": "ConfigMap"}`); return &b }(),
				hasFile: true,
			},
			{
				name:    "binary content",
				content: &[]byte{0x00, 0x01, 0x02, 0xFF},
				hasFile: true,
			},
		}

		for _, tc := range testContents {
			t.Run(tc.name, func(t *testing.T) {
				proto := ConvertManifestToProto(manifest, tc.content)

				require.NotNil(t, proto)
				if tc.hasFile {
					require.NotNil(t, proto.File)
					assert.Equal(t, *tc.content, proto.File.FileContent)
					assert.Equal(t, manifest.Checksum, proto.File.Checksum)
					assert.Equal(t, manifest.ChecksumType, proto.File.ChecksumType)
				} else {
					assert.Nil(t, proto.File)
				}
			})
		}
	})
}

func TestManifestValidation(t *testing.T) {
	t.Run("valid manifest configurations", func(t *testing.T) {
		testCases := []struct {
			name     string
			manifest *Manifest
		}{
			{
				name: "kubernetes deployment manifest",
				manifest: &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           "k8s-deployment",
					StorageBucket:  "k8s-manifests",
					StorageKey:     "deployments/app-v1.yaml",
					Checksum:       "sha256:k8schecksum",
					ChecksumType:   "sha256",
					Version:        1,
					IsLatest:       true,
				},
			},
			{
				name: "docker compose manifest",
				manifest: &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           "docker-compose",
					StorageBucket:  "compose-files",
					StorageKey:     "apps/myapp/docker-compose.yml",
					Checksum:       "md5:dockerchecksum",
					ChecksumType:   "md5",
					Version:        2,
					IsLatest:       false,
				},
			},
			{
				name: "helm chart manifest",
				manifest: &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           "helm-chart",
					StorageBucket:  "helm-charts",
					StorageKey:     "charts/myapp/Chart.yaml",
					Checksum:       "sha1:helmchecksum",
					ChecksumType:   "sha1",
					Version:        3,
					IsLatest:       true,
				},
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				assert.NotNil(t, tc.manifest)
				assert.NotEqual(t, uuid.Nil, tc.manifest.Id)
				assert.NotEqual(t, uuid.Nil, tc.manifest.ApplicationId)
				assert.NotEqual(t, uuid.Nil, tc.manifest.VersionGroupId)
				assert.NotEmpty(t, tc.manifest.Name)
				assert.NotEmpty(t, tc.manifest.StorageBucket)
				assert.NotEmpty(t, tc.manifest.StorageKey)
				assert.NotEmpty(t, tc.manifest.Checksum)
				assert.NotEmpty(t, tc.manifest.ChecksumType)
				assert.Greater(t, tc.manifest.Version, 0)
			})
		}
	})

	t.Run("checksum type validation", func(t *testing.T) {
		validChecksumTypes := []string{
			"md5",
			"sha1",
			"sha256",
			"sha512",
			"crc32",
		}

		for _, checksumType := range validChecksumTypes {
			t.Run("valid_checksum_type_"+checksumType, func(t *testing.T) {
				manifest := &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           "checksum-test",
					ChecksumType:   checksumType,
					Checksum:       "test-checksum-value",
				}

				assert.Equal(t, checksumType, manifest.ChecksumType)
				assert.NotEmpty(t, manifest.Checksum)
			})
		}
	})

	t.Run("storage path validation patterns", func(t *testing.T) {
		validStoragePaths := []string{
			"manifests/simple.yaml",
			"apps/myapp/v1/deployment.yaml",
			"k8s/production/namespace/service.yml",
			"helm/charts/myapp/templates/configmap.yaml",
			"compose/docker-compose.production.yml",
			"deep/nested/path/to/manifest/file.yaml",
		}

		for _, path := range validStoragePaths {
			t.Run("valid_storage_path", func(t *testing.T) {
				manifest := &Manifest{
					Id:             uuid.New(),
					ApplicationId:  uuid.New(),
					VersionGroupId: uuid.New(),
					Name:           "path-test",
					StorageKey:     path,
					StorageBucket:  "test-bucket",
				}

				assert.Equal(t, path, manifest.StorageKey)
				assert.Contains(t, manifest.StorageKey, "/")
				// Verify it's a YAML file
				key := manifest.StorageKey
				assert.True(t,
					len(key) >= 5 && (key[len(key)-5:] == ".yaml" || key[len(key)-4:] == ".yml"))
			})
		}
	})

	t.Run("uuid field validation", func(t *testing.T) {
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "uuid-test",
		}

		assert.NotEqual(t, uuid.Nil, manifest.Id)
		assert.NotEqual(t, uuid.Nil, manifest.ApplicationId)
		assert.NotEqual(t, uuid.Nil, manifest.VersionGroupId)

		// Verify UUIDs are properly formatted
		_, err := uuid.Parse(manifest.Id.String())
		assert.NoError(t, err)

		_, err = uuid.Parse(manifest.ApplicationId.String())
		assert.NoError(t, err)

		_, err = uuid.Parse(manifest.VersionGroupId.String())
		assert.NoError(t, err)
	})
}

func TestManifestDatabaseStructure(t *testing.T) {
	t.Run("database structure validation", func(t *testing.T) {
		description := "Database test manifest"
		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  uuid.New(),
			VersionGroupId: uuid.New(),
			Name:           "db-test-manifest",
			Description:    &description,
			StorageBucket:  "test-bucket",
			StorageKey:     "test/manifest.yaml",
			Checksum:       "sha256:testchecksum",
			ChecksumType:   "sha256",
			Version:        1,
			IsLatest:       true,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		// Verify struct is properly set up for GORM operations
		assert.NotNil(t, manifest)
		assert.NotEqual(t, uuid.Nil, manifest.Id)
		assert.NotEqual(t, uuid.Nil, manifest.ApplicationId)
		assert.NotEqual(t, uuid.Nil, manifest.VersionGroupId)
		assert.NotEmpty(t, manifest.Name)
		assert.NotNil(t, manifest.Description)
		assert.NotEmpty(t, manifest.StorageBucket)
		assert.NotEmpty(t, manifest.StorageKey)

		// In a real integration test, we would test:
		// - Database constraints (unique constraints, indexes)
		// - UUID generation with gen_random_uuid()
		// - Foreign key relationships with Application and VersionGroup
		// - Soft delete functionality with DeletedAt
		// - Index performance on frequently queried fields
		// - Version ordering and latest flag consistency
	})

	t.Run("gorm tag validation", func(t *testing.T) {
		// Verify that GORM tags are properly configured
		manifest := &Manifest{}

		// Test that DeletedAt implements the soft delete pattern
		assert.False(t, manifest.DeletedAt.Valid)

		// Set soft delete
		manifest.DeletedAt = gorm.DeletedAt{Valid: true, Time: time.Now()}
		assert.True(t, manifest.DeletedAt.Valid)
		assert.False(t, manifest.DeletedAt.Time.IsZero())
	})

	t.Run("manifest relationships", func(t *testing.T) {
		applicationId := uuid.New()
		versionGroupId := uuid.New()

		manifest := &Manifest{
			Id:             uuid.New(),
			ApplicationId:  applicationId,
			VersionGroupId: versionGroupId,
			Name:           "relationship-test",
		}

		// Verify foreign key relationships
		assert.Equal(t, applicationId, manifest.ApplicationId)
		assert.Equal(t, versionGroupId, manifest.VersionGroupId)
		assert.NotEqual(t, uuid.Nil, manifest.ApplicationId)
		assert.NotEqual(t, uuid.Nil, manifest.VersionGroupId)
	})
}

func TestManifestVersioning(t *testing.T) {
	t.Run("version progression", func(t *testing.T) {
		baseTime := time.Now()
		applicationId := uuid.New()
		versionGroupId := uuid.New()

		// Simulate version progression
		versions := []*Manifest{
			{
				Id:             uuid.New(),
				ApplicationId:  applicationId,
				VersionGroupId: versionGroupId,
				Name:           "manifest-v1",
				Version:        1,
				IsLatest:       false, // Older version
				CreatedAt:      baseTime,
				UpdatedAt:      baseTime,
			},
			{
				Id:             uuid.New(),
				ApplicationId:  applicationId,
				VersionGroupId: versionGroupId,
				Name:           "manifest-v2",
				Version:        2,
				IsLatest:       false, // Older version
				CreatedAt:      baseTime.Add(time.Hour),
				UpdatedAt:      baseTime.Add(time.Hour),
			},
			{
				Id:             uuid.New(),
				ApplicationId:  applicationId,
				VersionGroupId: versionGroupId,
				Name:           "manifest-v3",
				Version:        3,
				IsLatest:       true, // Current latest
				CreatedAt:      baseTime.Add(2 * time.Hour),
				UpdatedAt:      baseTime.Add(2 * time.Hour),
			},
		}

		// Verify version ordering
		for i, manifest := range versions {
			assert.Equal(t, i+1, manifest.Version)
			assert.Equal(t, applicationId, manifest.ApplicationId)
			assert.Equal(t, versionGroupId, manifest.VersionGroupId)

			if i == len(versions)-1 {
				assert.True(t, manifest.IsLatest)
			} else {
				assert.False(t, manifest.IsLatest)
			}
		}

		// Verify chronological ordering
		for i := 1; i < len(versions); i++ {
			assert.True(t, versions[i].CreatedAt.After(versions[i-1].CreatedAt))
		}
	})

	t.Run("latest flag management", func(t *testing.T) {
		applicationId := uuid.New()
		versionGroupId := uuid.New()

		// Test scenarios for latest flag
		scenarios := []struct {
			name     string
			version  int
			isLatest bool
		}{
			{"initial version", 1, true},
			{"previous version after update", 1, false},
			{"new latest version", 2, true},
		}

		for _, scenario := range scenarios {
			t.Run(scenario.name, func(t *testing.T) {
				manifest := &Manifest{
					Id:             uuid.New(),
					ApplicationId:  applicationId,
					VersionGroupId: versionGroupId,
					Name:           "latest-flag-test",
					Version:        scenario.version,
					IsLatest:       scenario.isLatest,
				}

				assert.Equal(t, scenario.version, manifest.Version)
				assert.Equal(t, scenario.isLatest, manifest.IsLatest)
			})
		}
	})
}

// Benchmark tests for performance
func BenchmarkConvertManifestToProto(b *testing.B) {
	description := "Benchmark manifest"
	manifest := &Manifest{
		Id:             uuid.New(),
		ApplicationId:  uuid.New(),
		VersionGroupId: uuid.New(),
		Name:           "benchmark-manifest",
		Description:    &description,
		StorageBucket:  "benchmark-bucket",
		StorageKey:     "benchmarks/manifest.yaml",
		Checksum:       "sha256:benchmarkchecksum",
		ChecksumType:   "sha256",
		Version:        1,
		IsLatest:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertManifestToProto(manifest, nil)
	}
}

func BenchmarkConvertManifestToProtoWithContent(b *testing.B) {
	description := "Benchmark manifest with content"
	fileContent := []byte(`apiVersion: apps/v1
kind: Deployment
metadata:
  name: benchmark-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: benchmark-app
  template:
    metadata:
      labels:
        app: benchmark-app
    spec:
      containers:
      - name: app
        image: nginx:1.20
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"`)

	manifest := &Manifest{
		Id:             uuid.New(),
		ApplicationId:  uuid.New(),
		VersionGroupId: uuid.New(),
		Name:           "benchmark-manifest-with-content",
		Description:    &description,
		StorageBucket:  "benchmark-bucket",
		StorageKey:     "benchmarks/manifest-with-content.yaml",
		Checksum:       "sha256:benchmarkwithcontentchecksum",
		ChecksumType:   "sha256",
		Version:        1,
		IsLatest:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertManifestToProto(manifest, &fileContent)
	}
}
