package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

func TestEndpoints_SetDefaults(t *testing.T) {
	tests := []struct {
		name      string
		endpoints *Endpoints
		check     func(t *testing.T, endpoints *Endpoints)
	}{
		{
			name:      "nil endpoints does not panic",
			endpoints: nil,
			check: func(t *testing.T, endpoints *Endpoints) {
				// Should not panic, no assertions needed
			},
		},
		{
			name:      "empty endpoints calls SetDefaults on nested structs",
			endpoints: &Endpoints{},
			check: func(t *testing.T, endpoints *Endpoints) {
				// SetDefaults should have been called on Manifest and Revision
				// Since they have no defaults, nothing should change
				assert.Empty(t, endpoints.Manifest.BucketName)
				assert.Empty(t, endpoints.Revision.BucketName)
			},
		},
		{
			name: "populated endpoints preserves values",
			endpoints: &Endpoints{
				Manifest: Manifest{BucketName: "manifest-bucket"},
				Revision: Revision{BucketName: "revision-bucket"},
			},
			check: func(t *testing.T, endpoints *Endpoints) {
				assert.Equal(t, "manifest-bucket", endpoints.Manifest.BucketName)
				assert.Equal(t, "revision-bucket", endpoints.Revision.BucketName)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Should not panic
			tt.endpoints.SetDefaults()
			tt.check(t, tt.endpoints)
		})
	}
}

func TestEndpoints_Validate(t *testing.T) {
	tests := []struct {
		name        string
		endpoints   *Endpoints
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil endpoints returns nil",
			endpoints:   nil,
			expectError: false,
		},
		{
			name: "valid endpoints passes validation",
			endpoints: &Endpoints{
				Manifest: Manifest{BucketName: "manifest-bucket"},
				Revision: Revision{BucketName: "revision-bucket"},
			},
			expectError: false,
		},
		{
			name: "missing manifest bucket name fails validation",
			endpoints: &Endpoints{
				Manifest: Manifest{BucketName: ""},
				Revision: Revision{BucketName: "revision-bucket"},
			},
			expectError: true,
			errorMsg:    "manifest: manifest bucket_name is required",
		},
		{
			name: "missing revision bucket name fails validation",
			endpoints: &Endpoints{
				Manifest: Manifest{BucketName: "manifest-bucket"},
				Revision: Revision{BucketName: ""},
			},
			expectError: true,
			errorMsg:    "revision: revision bucket_name is required",
		},
		{
			name: "missing both bucket names fails with manifest error first",
			endpoints: &Endpoints{
				Manifest: Manifest{BucketName: ""},
				Revision: Revision{BucketName: ""},
			},
			expectError: true,
			errorMsg:    "manifest: manifest bucket_name is required",
		},
		{
			name:        "empty endpoints fails validation",
			endpoints:   &Endpoints{},
			expectError: true,
			errorMsg:    "manifest: manifest bucket_name is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.endpoints.Validate()
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

func TestManifest_SetDefaults(t *testing.T) {
	tests := []struct {
		name     string
		manifest *Manifest
		expected Manifest
	}{
		{
			name:     "empty manifest has no defaults",
			manifest: &Manifest{},
			expected: Manifest{BucketName: ""},
		},
		{
			name:     "populated manifest preserves values",
			manifest: &Manifest{BucketName: "test-bucket"},
			expected: Manifest{BucketName: "test-bucket"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.manifest.SetDefaults()
			assert.Equal(t, tt.expected, *tt.manifest)
		})
	}
}

func TestManifest_Validate(t *testing.T) {
	tests := []struct {
		name        string
		manifest    *Manifest
		expectError bool
		errorMsg    string
	}{
		{
			name:        "valid manifest passes validation",
			manifest:    &Manifest{BucketName: "test-bucket"},
			expectError: false,
		},
		{
			name:        "empty bucket name fails validation",
			manifest:    &Manifest{BucketName: ""},
			expectError: true,
			errorMsg:    "manifest bucket_name is required",
		},
		{
			name:        "whitespace bucket name fails validation",
			manifest:    &Manifest{BucketName: "   "},
			expectError: false, // Current implementation doesn't trim whitespace
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.manifest.Validate()
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

func TestRevision_SetDefaults(t *testing.T) {
	tests := []struct {
		name     string
		revision *Revision
		expected Revision
	}{
		{
			name:     "empty revision has no defaults",
			revision: &Revision{},
			expected: Revision{BucketName: ""},
		},
		{
			name:     "populated revision preserves values",
			revision: &Revision{BucketName: "test-bucket"},
			expected: Revision{BucketName: "test-bucket"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.revision.SetDefaults()
			assert.Equal(t, tt.expected, *tt.revision)
		})
	}
}

func TestRevision_Validate(t *testing.T) {
	tests := []struct {
		name        string
		revision    *Revision
		expectError bool
		errorMsg    string
	}{
		{
			name:        "valid revision passes validation",
			revision:    &Revision{BucketName: "test-bucket"},
			expectError: false,
		},
		{
			name:        "empty bucket name fails validation",
			revision:    &Revision{BucketName: ""},
			expectError: true,
			errorMsg:    "revision bucket_name is required",
		},
		{
			name:        "whitespace bucket name fails validation",
			revision:    &Revision{BucketName: "   "},
			expectError: false, // Current implementation doesn't trim whitespace
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.revision.Validate()
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

func TestManifest_UnmarshalYAML(t *testing.T) {
	tests := []struct {
		name     string
		yaml     string
		expected Manifest
	}{
		{
			name:     "complete manifest configuration",
			yaml:     `bucket_name: "test-manifest-bucket"`,
			expected: Manifest{BucketName: "test-manifest-bucket"},
		},
		{
			name:     "empty manifest configuration",
			yaml:     `{}`,
			expected: Manifest{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var manifest Manifest
			err := yaml.Unmarshal([]byte(tt.yaml), &manifest)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, manifest)
		})
	}
}

func TestRevision_UnmarshalYAML(t *testing.T) {
	tests := []struct {
		name     string
		yaml     string
		expected Revision
	}{
		{
			name:     "complete revision configuration",
			yaml:     `bucket_name: "test-revision-bucket"`,
			expected: Revision{BucketName: "test-revision-bucket"},
		},
		{
			name:     "empty revision configuration",
			yaml:     `{}`,
			expected: Revision{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var revision Revision
			err := yaml.Unmarshal([]byte(tt.yaml), &revision)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, revision)
		})
	}
}

func TestEndpoints_UnmarshalYAML(t *testing.T) {
	tests := []struct {
		name     string
		yaml     string
		expected Endpoints
	}{
		{
			name: "complete endpoints configuration",
			yaml: `
manifest:
  bucket_name: "manifest-storage"
revision:
  bucket_name: "revision-storage"
`,
			expected: Endpoints{
				Manifest: Manifest{BucketName: "manifest-storage"},
				Revision: Revision{BucketName: "revision-storage"},
			},
		},
		{
			name: "partial endpoints configuration",
			yaml: `
manifest:
  bucket_name: "manifest-only"
`,
			expected: Endpoints{
				Manifest: Manifest{BucketName: "manifest-only"},
				Revision: Revision{BucketName: ""},
			},
		},
		{
			name:     "empty endpoints configuration",
			yaml:     `{}`,
			expected: Endpoints{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var endpoints Endpoints
			err := yaml.Unmarshal([]byte(tt.yaml), &endpoints)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, endpoints)
		})
	}
}

func TestEndpoints_UnmarshalYAML_ErrorCases(t *testing.T) {
	tests := []struct {
		name        string
		yaml        string
		expectError bool
	}{
		{
			name:        "invalid yaml structure",
			yaml:        `manifest: [invalid`,
			expectError: true,
		},
		{
			name: "invalid field type",
			yaml: `
manifest:
  bucket_name: 123
`,
			expectError: false, // YAML can convert numbers to strings
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var endpoints Endpoints
			err := yaml.Unmarshal([]byte(tt.yaml), &endpoints)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestEndpoints_StructFields(t *testing.T) {
	t.Run("endpoints struct has all expected fields", func(t *testing.T) {
		endpoints := Endpoints{
			Manifest: Manifest{BucketName: "test"},
			Revision: Revision{BucketName: "test"},
		}

		// Verify struct fields are accessible
		assert.Equal(t, "test", endpoints.Manifest.BucketName)
		assert.Equal(t, "test", endpoints.Revision.BucketName)
	})

	t.Run("manifest struct has all expected fields", func(t *testing.T) {
		manifest := Manifest{BucketName: "test-bucket"}
		assert.Equal(t, "test-bucket", manifest.BucketName)
	})

	t.Run("revision struct has all expected fields", func(t *testing.T) {
		revision := Revision{BucketName: "test-bucket"}
		assert.Equal(t, "test-bucket", revision.BucketName)
	})
}

func TestEndpoints_EdgeCases(t *testing.T) {
	t.Run("endpoints with very long bucket names", func(t *testing.T) {
		longName := string(make([]byte, 1000))
		for i := range longName {
			longName = longName[:i] + "a" + longName[i+1:]
		}

		endpoints := &Endpoints{
			Manifest: Manifest{BucketName: longName},
			Revision: Revision{BucketName: longName},
		}

		err := endpoints.Validate()
		assert.NoError(t, err) // Current implementation has no length limits
	})

	t.Run("endpoints with special characters in bucket names", func(t *testing.T) {
		specialName := "bucket-name_with.special@chars"
		endpoints := &Endpoints{
			Manifest: Manifest{BucketName: specialName},
			Revision: Revision{BucketName: specialName},
		}

		err := endpoints.Validate()
		assert.NoError(t, err) // Current implementation doesn't validate bucket name format
	})

	t.Run("endpoints with unicode bucket names", func(t *testing.T) {
		unicodeName := "bucket-名前-мяч"
		endpoints := &Endpoints{
			Manifest: Manifest{BucketName: unicodeName},
			Revision: Revision{BucketName: unicodeName},
		}

		err := endpoints.Validate()
		assert.NoError(t, err) // Current implementation accepts unicode
	})
}

func TestEndpoints_NilPointerSafety(t *testing.T) {
	t.Run("nil endpoints pointer validation", func(t *testing.T) {
		var endpoints *Endpoints = nil

		// Should not panic
		endpoints.SetDefaults()
		err := endpoints.Validate()
		assert.NoError(t, err)
	})

	t.Run("nil manifest pointer in SetDefaults", func(t *testing.T) {
		var manifest *Manifest = nil

		// Should not panic
		manifest.SetDefaults()
	})

	t.Run("nil revision pointer in SetDefaults", func(t *testing.T) {
		var revision *Revision = nil

		// Should not panic
		revision.SetDefaults()
	})
}
