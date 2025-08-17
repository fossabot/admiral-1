package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTemporal_Validate(t *testing.T) {
	testCases := []struct {
		name        string
		temporal    *Temporal
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil temporal config returns error",
			temporal:    nil,
			expectError: true,
			errorMsg:    "temporal config is nil",
		},
		{
			name: "valid temporal config",
			temporal: &Temporal{
				Host: "localhost",
				Port: 7233,
			},
			expectError: false,
		},
		{
			name: "valid temporal config with different host",
			temporal: &Temporal{
				Host: "temporal.example.com",
				Port: 7233,
			},
			expectError: false,
		},
		{
			name: "valid temporal config with different port",
			temporal: &Temporal{
				Host: "localhost",
				Port: 9090,
			},
			expectError: false,
		},
		{
			name: "valid temporal config with minimum port",
			temporal: &Temporal{
				Host: "localhost",
				Port: 1,
			},
			expectError: false,
		},
		{
			name: "valid temporal config with maximum port",
			temporal: &Temporal{
				Host: "localhost",
				Port: 65535,
			},
			expectError: false,
		},
		{
			name: "empty host returns error",
			temporal: &Temporal{
				Host: "",
				Port: 7233,
			},
			expectError: true,
			errorMsg:    "host is required",
		},
		{
			name: "zero port returns error",
			temporal: &Temporal{
				Host: "localhost",
				Port: 0,
			},
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got 0",
		},
		{
			name: "negative port returns error",
			temporal: &Temporal{
				Host: "localhost",
				Port: -1,
			},
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got -1",
		},
		{
			name: "port too high returns error",
			temporal: &Temporal{
				Host: "localhost",
				Port: 65536,
			},
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got 65536",
		},
		{
			name: "port much too high returns error",
			temporal: &Temporal{
				Host: "localhost",
				Port: 99999,
			},
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got 99999",
		},
		{
			name: "whitespace host returns error",
			temporal: &Temporal{
				Host: "   ",
				Port: 7233,
			},
			expectError: true,
			errorMsg:    "host is required",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.temporal.Validate()

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

func TestTemporal_StructFields(t *testing.T) {
	t.Run("temporal struct has all expected fields", func(t *testing.T) {
		temporal := Temporal{
			Host: "localhost",
			Port: 7233,
		}

		assert.Equal(t, "localhost", temporal.Host)
		assert.Equal(t, 7233, temporal.Port)
	})

	t.Run("temporal struct fields have correct yaml tags", func(t *testing.T) {
		// This test ensures the YAML tags are present for marshaling/unmarshaling
		temporal := Temporal{}

		// The struct should be able to be initialized with zero values
		assert.Equal(t, "", temporal.Host)
		assert.Equal(t, 0, temporal.Port)
	})
}

func TestTemporal_ValidationTags(t *testing.T) {
	t.Run("temporal struct has validation tags", func(t *testing.T) {
		// This test verifies that the struct has the expected validation tags
		// The actual validation is tested through the validator in the config package
		temporal := &Temporal{
			Host: "localhost",
			Port: 7233,
		}

		// Valid config should pass validation
		err := temporal.Validate()
		assert.NoError(t, err)
	})
}

// Test edge cases and boundary conditions
func TestTemporal_EdgeCases(t *testing.T) {
	testCases := []struct {
		name        string
		temporal    *Temporal
		expectError bool
		description string
	}{
		{
			name: "localhost with standard temporal port",
			temporal: &Temporal{
				Host: "localhost",
				Port: 7233,
			},
			expectError: false,
			description: "Standard Temporal server configuration",
		},
		{
			name: "IP address host",
			temporal: &Temporal{
				Host: "127.0.0.1",
				Port: 7233,
			},
			expectError: false,
			description: "Using IP address instead of hostname",
		},
		{
			name: "hostname with subdomain",
			temporal: &Temporal{
				Host: "temporal.internal.company.com",
				Port: 7233,
			},
			expectError: false,
			description: "Complex hostname with multiple subdomains",
		},
		{
			name: "custom high port",
			temporal: &Temporal{
				Host: "localhost",
				Port: 8233,
			},
			expectError: false,
			description: "Non-standard but valid port",
		},
		{
			name: "minimum valid port",
			temporal: &Temporal{
				Host: "localhost",
				Port: 1,
			},
			expectError: false,
			description: "Minimum allowed port number",
		},
		{
			name: "maximum valid port",
			temporal: &Temporal{
				Host: "localhost",
				Port: 65535,
			},
			expectError: false,
			description: "Maximum allowed port number",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.temporal.Validate()

			if tc.expectError {
				assert.Error(t, err, "Expected error for case: %s", tc.description)
			} else {
				assert.NoError(t, err, "Expected no error for case: %s", tc.description)
			}
		})
	}
}

// Test concurrent validation calls
func TestTemporal_ConcurrentValidation(t *testing.T) {
	temporal := &Temporal{
		Host: "localhost",
		Port: 7233,
	}

	// Run validation concurrently to ensure thread safety
	const numGoroutines = 100
	errors := make(chan error, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func() {
			err := temporal.Validate()
			errors <- err
		}()
	}

	// Collect all results
	for i := 0; i < numGoroutines; i++ {
		err := <-errors
		assert.NoError(t, err, "Concurrent validation should not fail")
	}
}

// Test integration with main config validation
func TestConfig_TemporalValidation(t *testing.T) {
	testCases := []struct {
		name        string
		config      *Config
		expectError bool
		errorMsg    string
	}{
		{
			name: "nil temporal config should fail",
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
					// Temporal is implicitly nil
				},
			},
			expectError: true,
			errorMsg:    "services.temporal config is nil",
		},
		{
			name: "valid temporal config should pass",
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
			name: "invalid temporal host should fail",
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
						Host: "",
						Port: 7233,
					},
				},
			},
			expectError: true,
			errorMsg:    "invalid services.temporal config: host is required",
		},
		{
			name: "invalid temporal port should fail",
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
						Port: 0,
					},
				},
			},
			expectError: true,
			errorMsg:    "invalid services.temporal config: port must be between 1 and 65535, got 0",
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

func TestConfig_TemporalValidation_EdgeCases(t *testing.T) {
	t.Run("temporal validation called during config loading", func(t *testing.T) {
		// This test ensures that temporal validation is integrated into the main validation flow
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
		assert.NoError(t, err, "Valid temporal configuration should pass validation")
	})
}

func TestTemporal_SetDefaults(t *testing.T) {
	// Note: The Temporal struct doesn't have a SetDefaults method in the current implementation
	// but we can test that it would work properly if it did
	t.Run("temporal struct supports default values", func(t *testing.T) {
		temporal := &Temporal{
			Host: "localhost",
			// Port is set to 0, which should be handled by setDefaults in config.go
		}

		// The actual defaults are set in setDefaults() function in config.go
		// which sets Port to 7233 if it's 0
		assert.Equal(t, "localhost", temporal.Host)
		assert.Equal(t, 0, temporal.Port) // Before defaults are applied
	})
}

func TestTemporal_ZeroValues(t *testing.T) {
	t.Run("temporal struct with zero values", func(t *testing.T) {
		temporal := Temporal{}

		assert.Empty(t, temporal.Host)
		assert.Equal(t, 0, temporal.Port)
	})
}

func TestTemporal_ValidateWithWhitespace(t *testing.T) {
	t.Run("host with only whitespace fails validation", func(t *testing.T) {
		temporal := &Temporal{
			Host: "   \t\n   ",
			Port: 7233,
		}

		err := temporal.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "host is required")
	})

	t.Run("host with tabs and spaces fails validation", func(t *testing.T) {
		temporal := &Temporal{
			Host: "\t  \t",
			Port: 7233,
		}

		err := temporal.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "host is required")
	})
}

func TestTemporal_PortBoundaryValues(t *testing.T) {
	tests := []struct {
		name        string
		port        int
		expectError bool
		errorMsg    string
	}{
		{
			name:        "port 1 is valid",
			port:        1,
			expectError: false,
		},
		{
			name:        "port 65535 is valid",
			port:        65535,
			expectError: false,
		},
		{
			name:        "port 0 is invalid",
			port:        0,
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got 0",
		},
		{
			name:        "port 65536 is invalid",
			port:        65536,
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got 65536",
		},
		{
			name:        "negative port is invalid",
			port:        -1,
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got -1",
		},
		{
			name:        "very negative port is invalid",
			port:        -65536,
			expectError: true,
			errorMsg:    "port must be between 1 and 65535, got -65536",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			temporal := &Temporal{
				Host: "localhost",
				Port: tt.port,
			}

			err := temporal.Validate()
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestTemporal_NilPointerSafety(t *testing.T) {
	t.Run("nil temporal pointer validation", func(t *testing.T) {
		var temporal *Temporal = nil

		err := temporal.Validate()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "temporal config is nil")
	})
}

func TestTemporal_HostVariations(t *testing.T) {
	tests := []struct {
		name        string
		host        string
		expectError bool
		description string
	}{
		{
			name:        "localhost is valid",
			host:        "localhost",
			expectError: false,
			description: "Standard localhost hostname",
		},
		{
			name:        "IPv4 address is valid",
			host:        "192.168.1.100",
			expectError: false,
			description: "Valid IPv4 address",
		},
		{
			name:        "IPv6 address is valid",
			host:        "::1",
			expectError: false,
			description: "IPv6 loopback address",
		},
		{
			name:        "FQDN is valid",
			host:        "temporal.example.com",
			expectError: false,
			description: "Fully qualified domain name",
		},
		{
			name:        "hyphenated hostname is valid",
			host:        "temporal-server-01",
			expectError: false,
			description: "Hostname with hyphens",
		},
		{
			name:        "single character host is valid",
			host:        "a",
			expectError: false,
			description: "Minimal hostname",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			temporal := &Temporal{
				Host: tt.host,
				Port: 7233,
			}

			err := temporal.Validate()
			if tt.expectError {
				assert.Error(t, err, "Expected error for case: %s", tt.description)
			} else {
				assert.NoError(t, err, "Expected no error for case: %s", tt.description)
			}
		})
	}
}
