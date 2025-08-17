package config

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
)

func TestLogger_UnmarshalYAML(t *testing.T) {
	tests := []struct {
		name           string
		yaml           string
		expectedLevel  string
		expectedPretty bool
	}{
		{
			name:           "valid debug level",
			yaml:           "level: debug\npretty: true",
			expectedLevel:  "debug",
			expectedPretty: true,
		},
		{
			name:           "valid info level",
			yaml:           "level: info",
			expectedLevel:  "info",
			expectedPretty: false,
		},
		{
			name:           "empty level defaults to error",
			yaml:           "level: \npretty: false",
			expectedLevel:  "error",
			expectedPretty: false,
		},
		{
			name:           "missing level defaults to error",
			yaml:           "pretty: true",
			expectedLevel:  "error",
			expectedPretty: true,
		},
		{
			name:           "valid error level",
			yaml:           "level: error",
			expectedLevel:  "error",
			expectedPretty: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logger Logger
			err := yaml.Unmarshal([]byte(tt.yaml), &logger)

			assert.NoError(t, err)
			assert.Equal(t, tt.expectedLevel, logger.Level.String())
			assert.Equal(t, tt.expectedPretty, logger.Pretty)
		})
	}
}

func TestLogger_UnmarshalYAML_InvalidLevel(t *testing.T) {
	// Test that invalid level causes an error
	yamlData := "level: invalid-level"
	var logger Logger
	err := yaml.Unmarshal([]byte(yamlData), &logger)

	// The custom UnmarshalYAML will try to unmarshal, but zapcore.Level
	// should reject invalid levels
	assert.Error(t, err)
}

func TestServer_SetDefaults(t *testing.T) {
	tests := []struct {
		name     string
		server   Server
		expected Server
	}{
		{
			name:   "empty server gets all defaults",
			server: Server{},
			expected: Server{
				Listener: Listener{
					Address: "0.0.0.0",
					Port:    8080,
				},
				Logger: &Logger{
					Level: zap.ErrorLevel,
				},
				Stats: &Stats{
					FlushInterval: time.Second,
					Prefix:        "admiral",
					ReporterType:  ReporterTypeNull,
				},
			},
		},
		{
			name: "existing values preserved",
			server: Server{
				Listener: Listener{
					Address: "127.0.0.1",
					Port:    9090,
				},
				Logger: &Logger{
					Level: zap.InfoLevel,
				},
				Stats: &Stats{
					FlushInterval: 5 * time.Second,
					Prefix:        "custom",
					ReporterType:  ReporterTypeLog,
				},
				EnablePprof:          true,
				MaxResponseSizeBytes: 1024,
			},
			expected: Server{
				Listener: Listener{
					Address: "127.0.0.1",
					Port:    9090,
				},
				Logger: &Logger{
					Level: zap.InfoLevel,
				},
				Stats: &Stats{
					FlushInterval: 5 * time.Second,
					Prefix:        "custom",
					ReporterType:  ReporterTypeLog,
				},
				EnablePprof:          true,
				MaxResponseSizeBytes: 1024,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.server.SetDefaults()
			assert.Equal(t, tt.expected.Listener, tt.server.Listener)
			assert.Equal(t, tt.expected.Logger.Level, tt.server.Logger.Level)
			assert.Equal(t, tt.expected.Stats.FlushInterval, tt.server.Stats.FlushInterval)
			assert.Equal(t, tt.expected.Stats.Prefix, tt.server.Stats.Prefix)
			assert.Equal(t, tt.expected.Stats.ReporterType, tt.server.Stats.ReporterType)
			assert.Equal(t, tt.expected.EnablePprof, tt.server.EnablePprof)
			assert.Equal(t, tt.expected.MaxResponseSizeBytes, tt.server.MaxResponseSizeBytes)
		})
	}
}

func TestServer_Validate(t *testing.T) {
	tests := []struct {
		name        string
		server      Server
		expectError bool
		errorMsg    string
	}{
		{
			name: "valid server config",
			server: Server{
				Stats: &Stats{
					ReporterType: ReporterTypeNull,
				},
			},
			expectError: false,
		},
		{
			name: "server with nil stats is valid",
			server: Server{
				Stats: nil,
			},
			expectError: false,
		},
		{
			name: "invalid stats reporter type",
			server: Server{
				Stats: &Stats{
					ReporterType: ReporterType("invalid"),
				},
			},
			expectError: true,
			errorMsg:    "invalid stats.reporter_type",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.server.Validate()
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestListener_SetDefaults(t *testing.T) {
	tests := []struct {
		name     string
		listener Listener
		expected Listener
	}{
		{
			name:     "empty listener gets defaults",
			listener: Listener{},
			expected: Listener{
				Address: "0.0.0.0",
				Port:    8080,
			},
		},
		{
			name: "existing values preserved",
			listener: Listener{
				Address: "127.0.0.1",
				Port:    9090,
			},
			expected: Listener{
				Address: "127.0.0.1",
				Port:    9090,
			},
		},
		{
			name: "partial config gets missing defaults",
			listener: Listener{
				Address: "192.168.1.1",
				// Port is 0, should get default
			},
			expected: Listener{
				Address: "192.168.1.1",
				Port:    8080,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.listener.SetDefaults()
			assert.Equal(t, tt.expected, tt.listener)
		})
	}
}

func TestReporterType_Validate(t *testing.T) {
	tests := []struct {
		name        string
		reporter    ReporterType
		expectError bool
		errorMsg    string
	}{
		{
			name:        "valid null reporter",
			reporter:    ReporterTypeNull,
			expectError: false,
		},
		{
			name:        "valid log reporter",
			reporter:    ReporterTypeLog,
			expectError: false,
		},
		{
			name:        "valid prometheus reporter",
			reporter:    ReporterTypePrometheus,
			expectError: false,
		},
		{
			name:        "invalid reporter type",
			reporter:    ReporterType("invalid"),
			expectError: true,
			errorMsg:    "invalid reporter type: \"invalid\"",
		},
		{
			name:        "empty reporter type",
			reporter:    ReporterType(""),
			expectError: true,
			errorMsg:    "invalid reporter type: \"\"",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.reporter.Validate()
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestServer_StructFields(t *testing.T) {
	t.Run("Server struct has all expected fields", func(t *testing.T) {
		server := Server{
			Listener: Listener{
				Address: "0.0.0.0",
				Port:    8080,
			},
			Timeouts: Timeouts{
				Default: 30 * time.Second,
			},
			Logger: &Logger{
				Level:     zap.InfoLevel,
				Namespace: "test",
				Pretty:    true,
			},
			AccessLog: &AccessLog{
				StatusCodeFilters: []uint32{404, 500},
			},
			Stats: &Stats{
				FlushInterval: time.Second,
				Prefix:        "admiral",
				ReporterType:  ReporterTypePrometheus,
			},
			EnablePprof:          true,
			MaxResponseSizeBytes: 2048,
		}

		assert.Equal(t, "0.0.0.0", server.Listener.Address)
		assert.Equal(t, 8080, server.Listener.Port)
		assert.Equal(t, 30*time.Second, server.Timeouts.Default)
		assert.Equal(t, zap.InfoLevel, server.Logger.Level)
		assert.Equal(t, "test", server.Logger.Namespace)
		assert.True(t, server.Logger.Pretty)
		assert.Equal(t, []uint32{404, 500}, server.AccessLog.StatusCodeFilters)
		assert.Equal(t, time.Second, server.Stats.FlushInterval)
		assert.Equal(t, "admiral", server.Stats.Prefix)
		assert.Equal(t, ReporterTypePrometheus, server.Stats.ReporterType)
		assert.True(t, server.EnablePprof)
		assert.Equal(t, 2048, server.MaxResponseSizeBytes)
	})
}

func TestTimeouts_Struct(t *testing.T) {
	t.Run("Timeouts struct has all expected fields", func(t *testing.T) {
		timeouts := Timeouts{
			Default: 30 * time.Second,
			Overrides: []TimeoutsEntry{
				{
					Service: "auth",
					Method:  "login",
					Timeout: 10 * time.Second,
				},
				{
					Service: "database",
					Method:  "query",
					Timeout: 5 * time.Second,
				},
			},
		}

		assert.Equal(t, 30*time.Second, timeouts.Default)
		assert.Len(t, timeouts.Overrides, 2)
		assert.Equal(t, "auth", timeouts.Overrides[0].Service)
		assert.Equal(t, "login", timeouts.Overrides[0].Method)
		assert.Equal(t, 10*time.Second, timeouts.Overrides[0].Timeout)
		assert.Equal(t, "database", timeouts.Overrides[1].Service)
		assert.Equal(t, "query", timeouts.Overrides[1].Method)
		assert.Equal(t, 5*time.Second, timeouts.Overrides[1].Timeout)
	})
}

func TestReporterType_Constants(t *testing.T) {
	t.Run("reporter type constants are correct", func(t *testing.T) {
		assert.Equal(t, ReporterType("null"), ReporterTypeNull)
		assert.Equal(t, ReporterType("log"), ReporterTypeLog)
		assert.Equal(t, ReporterType("prometheus"), ReporterTypePrometheus)
	})
}
