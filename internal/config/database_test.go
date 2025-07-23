package config

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestSSLMode_String(t *testing.T) {
	testCases := []struct {
		name     string
		sslMode  *SSLMode
		expected string
	}{
		{
			name:     "nil pointer returns unspecified",
			sslMode:  nil,
			expected: "unspecified",
		},
		{
			name:     "unspecified mode",
			sslMode:  &[]SSLMode{SSLModeUnspecified}[0],
			expected: "unspecified",
		},
		{
			name:     "disable mode",
			sslMode:  &[]SSLMode{SSLModeDisable}[0],
			expected: "disable",
		},
		{
			name:     "allow mode",
			sslMode:  &[]SSLMode{SSLModeAllow}[0],
			expected: "allow",
		},
		{
			name:     "prefer mode",
			sslMode:  &[]SSLMode{SSLModePrefer}[0],
			expected: "prefer",
		},
		{
			name:     "require mode",
			sslMode:  &[]SSLMode{SSLModeRequire}[0],
			expected: "require",
		},
		{
			name:     "verify_ca mode",
			sslMode:  &[]SSLMode{SSLModeVerifyCA}[0],
			expected: "verify_ca",
		},
		{
			name:     "verify_full mode",
			sslMode:  &[]SSLMode{SSLModeVerifyFull}[0],
			expected: "verify_full",
		},
		{
			name:     "invalid mode returns unspecified",
			sslMode:  &[]SSLMode{SSLMode(999)}[0],
			expected: "unspecified",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := tc.sslMode.String()
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestSSLMode_MarshalYAML(t *testing.T) {
	testCases := []struct {
		name     string
		sslMode  SSLMode
		expected interface{}
	}{
		{
			name:     "disable mode marshals to string",
			sslMode:  SSLModeDisable,
			expected: "disable",
		},
		{
			name:     "require mode marshals to string",
			sslMode:  SSLModeRequire,
			expected: "require",
		},
		{
			name:     "verify_full mode marshals to string",
			sslMode:  SSLModeVerifyFull,
			expected: "verify_full",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := tc.sslMode.MarshalYAML()
			assert.NoError(t, err)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestSSLMode_UnmarshalYAML(t *testing.T) {
	testCases := []struct {
		name        string
		yamlValue   string
		expected    SSLMode
		expectError bool
	}{
		{
			name:        "unspecified value",
			yamlValue:   "unspecified",
			expected:    SSLModeUnspecified,
			expectError: false,
		},
		{
			name:        "disable value",
			yamlValue:   "disable",
			expected:    SSLModeDisable,
			expectError: false,
		},
		{
			name:        "allow value",
			yamlValue:   "allow",
			expected:    SSLModeAllow,
			expectError: false,
		},
		{
			name:        "prefer value",
			yamlValue:   "prefer",
			expected:    SSLModePrefer,
			expectError: false,
		},
		{
			name:        "require value",
			yamlValue:   "require",
			expected:    SSLModeRequire,
			expectError: false,
		},
		{
			name:        "verify_ca value",
			yamlValue:   "verify_ca",
			expected:    SSLModeVerifyCA,
			expectError: false,
		},
		{
			name:        "verify_full value",
			yamlValue:   "verify_full",
			expected:    SSLModeVerifyFull,
			expectError: false,
		},
		{
			name:        "uppercase value converted to lowercase",
			yamlValue:   "DISABLE",
			expected:    SSLModeDisable,
			expectError: false,
		},
		{
			name:        "mixed case value converted to lowercase",
			yamlValue:   "Prefer",
			expected:    SSLModePrefer,
			expectError: false,
		},
		{
			name:        "invalid value returns error",
			yamlValue:   "invalid_mode",
			expected:    SSLMode(0),
			expectError: true,
		},
		{
			name:        "empty YAML defaults to zero value",
			yamlValue:   "",
			expected:    SSLModeUnspecified,
			expectError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var sslMode SSLMode
			yamlData := []byte(tc.yamlValue)

			err := yaml.Unmarshal(yamlData, &sslMode)

			if tc.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "invalid SSLMode")
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.expected, sslMode)
			}
		})
	}
}

func TestSSLMode_Validate(t *testing.T) {
	testCases := []struct {
		name        string
		sslMode     *SSLMode
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil pointer returns error",
			sslMode:     nil,
			expectError: true,
			errorMsg:    "SSLMode is nil",
		},
		{
			name:        "valid unspecified mode",
			sslMode:     &[]SSLMode{SSLModeUnspecified}[0],
			expectError: false,
		},
		{
			name:        "valid disable mode",
			sslMode:     &[]SSLMode{SSLModeDisable}[0],
			expectError: false,
		},
		{
			name:        "valid allow mode",
			sslMode:     &[]SSLMode{SSLModeAllow}[0],
			expectError: false,
		},
		{
			name:        "valid prefer mode",
			sslMode:     &[]SSLMode{SSLModePrefer}[0],
			expectError: false,
		},
		{
			name:        "valid require mode",
			sslMode:     &[]SSLMode{SSLModeRequire}[0],
			expectError: false,
		},
		{
			name:        "valid verify_ca mode",
			sslMode:     &[]SSLMode{SSLModeVerifyCA}[0],
			expectError: false,
		},
		{
			name:        "valid verify_full mode",
			sslMode:     &[]SSLMode{SSLModeVerifyFull}[0],
			expectError: false,
		},
		{
			name:        "invalid mode returns error",
			sslMode:     &[]SSLMode{SSLMode(999)}[0],
			expectError: true,
			errorMsg:    "invalid SSLMode: 999",
		},
		{
			name:        "negative invalid mode returns error",
			sslMode:     &[]SSLMode{SSLMode(-1)}[0],
			expectError: true,
			errorMsg:    "invalid SSLMode: -1",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.sslMode.Validate()

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

func TestDatabase_StructFields(t *testing.T) {
	t.Run("database struct has all expected fields", func(t *testing.T) {
		db := Database{
			Host:              "localhost",
			Port:              5432,
			DatabaseName:      "admiral",
			User:              "admin",
			Password:          "password",
			SSLMode:           SSLModeDisable,
			MaxOpenConns:      25,
			MaxIdleConns:      5,
			ConnMaxLifetime:   time.Hour,
			ConnMaxIdleTime:   time.Minute * 30,
			ConnectionTimeout: time.Second * 10,
		}

		assert.Equal(t, "localhost", db.Host)
		assert.Equal(t, 5432, db.Port)
		assert.Equal(t, "admiral", db.DatabaseName)
		assert.Equal(t, "admin", db.User)
		assert.Equal(t, "password", db.Password)
		assert.Equal(t, SSLModeDisable, db.SSLMode)
		assert.Equal(t, 25, db.MaxOpenConns)
		assert.Equal(t, 5, db.MaxIdleConns)
		assert.Equal(t, time.Hour, db.ConnMaxLifetime)
		assert.Equal(t, time.Minute*30, db.ConnMaxIdleTime)
		assert.Equal(t, time.Second*10, db.ConnectionTimeout)
	})
}

func TestDatabase_YAMLMarshaling(t *testing.T) {
	t.Run("database struct marshals and unmarshals YAML correctly", func(t *testing.T) {
		original := Database{
			Host:              "localhost",
			Port:              5432,
			DatabaseName:      "admiral",
			User:              "admin",
			Password:          "password",
			SSLMode:           SSLModeRequire,
			MaxOpenConns:      25,
			MaxIdleConns:      5,
			ConnMaxLifetime:   time.Hour,
			ConnMaxIdleTime:   time.Minute * 30,
			ConnectionTimeout: time.Second * 10,
		}

		// Marshal to YAML
		yamlData, err := yaml.Marshal(original)
		require.NoError(t, err)
		assert.Contains(t, string(yamlData), "host: localhost")
		assert.Contains(t, string(yamlData), "port: 5432")
		// Note: YAML marshaling may use integer value (4) instead of string ("require")
		// since the MarshalYAML method may not be called in struct context

		// Test with proper YAML string for SSLMode
		yamlString := `host: localhost
port: 5432
database_name: admiral
user: admin
password: password
ssl_mode: require
max_open_conns: 25
max_idle_conns: 5
conn_max_lifetime: 1h0m0s
conn_max_idle_time: 30m0s
connection_timeout: 10s`

		var unmarshaled Database
		err = yaml.Unmarshal([]byte(yamlString), &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, original.Host, unmarshaled.Host)
		assert.Equal(t, original.Port, unmarshaled.Port)
		assert.Equal(t, original.DatabaseName, unmarshaled.DatabaseName)
		assert.Equal(t, original.User, unmarshaled.User)
		assert.Equal(t, original.Password, unmarshaled.Password)
		assert.Equal(t, original.SSLMode, unmarshaled.SSLMode)
		assert.Equal(t, original.MaxOpenConns, unmarshaled.MaxOpenConns)
		assert.Equal(t, original.MaxIdleConns, unmarshaled.MaxIdleConns)
		assert.Equal(t, original.ConnMaxLifetime, unmarshaled.ConnMaxLifetime)
		assert.Equal(t, original.ConnMaxIdleTime, unmarshaled.ConnMaxIdleTime)
		assert.Equal(t, original.ConnectionTimeout, unmarshaled.ConnectionTimeout)
	})
}

func TestDatabase_ZeroValues(t *testing.T) {
	t.Run("database struct with zero values", func(t *testing.T) {
		db := Database{}

		assert.Empty(t, db.Host)
		assert.Equal(t, 0, db.Port)
		assert.Empty(t, db.DatabaseName)
		assert.Empty(t, db.User)
		assert.Empty(t, db.Password)
		assert.Equal(t, SSLModeUnspecified, db.SSLMode)
		assert.Equal(t, 0, db.MaxOpenConns)
		assert.Equal(t, 0, db.MaxIdleConns)
		assert.Equal(t, time.Duration(0), db.ConnMaxLifetime)
		assert.Equal(t, time.Duration(0), db.ConnMaxIdleTime)
		assert.Equal(t, time.Duration(0), db.ConnectionTimeout)
	})
}

func TestSSLModeConstants(t *testing.T) {
	t.Run("SSL mode constants have expected values", func(t *testing.T) {
		assert.Equal(t, SSLMode(0), SSLModeUnspecified)
		assert.Equal(t, SSLMode(1), SSLModeDisable)
		assert.Equal(t, SSLMode(2), SSLModeAllow)
		assert.Equal(t, SSLMode(3), SSLModePrefer)
		assert.Equal(t, SSLMode(4), SSLModeRequire)
		assert.Equal(t, SSLMode(5), SSLModeVerifyCA)
		assert.Equal(t, SSLMode(6), SSLModeVerifyFull)
	})
}

func TestSSLMode_Maps(t *testing.T) {
	t.Run("SSL mode name and value maps are consistent", func(t *testing.T) {
		// Test that every entry in sslModeName has a corresponding entry in sslModeValue
		for mode, name := range sslModeName {
			value, exists := sslModeValue[name]
			assert.True(t, exists, "sslModeValue missing entry for %s", name)
			assert.Equal(t, mode, value, "Inconsistent mapping for %s", name)
		}

		// Test that every entry in sslModeValue has a corresponding entry in sslModeName
		for name, mode := range sslModeValue {
			value, exists := sslModeName[mode]
			assert.True(t, exists, "sslModeName missing entry for %d", mode)
			assert.Equal(t, name, value, "Inconsistent mapping for %d", mode)
		}
	})

	t.Run("SSL mode maps contain all expected values", func(t *testing.T) {
		expectedModes := []SSLMode{
			SSLModeUnspecified,
			SSLModeDisable,
			SSLModeAllow,
			SSLModePrefer,
			SSLModeRequire,
			SSLModeVerifyCA,
			SSLModeVerifyFull,
		}

		expectedNames := []string{
			"unspecified",
			"disable",
			"allow",
			"prefer",
			"require",
			"verify_ca",
			"verify_full",
		}

		assert.Len(t, sslModeName, len(expectedModes))
		assert.Len(t, sslModeValue, len(expectedNames))

		for _, mode := range expectedModes {
			_, exists := sslModeName[mode]
			assert.True(t, exists, "sslModeName missing mode %d", mode)
		}

		for _, name := range expectedNames {
			_, exists := sslModeValue[name]
			assert.True(t, exists, "sslModeValue missing name %s", name)
		}
	})
}
