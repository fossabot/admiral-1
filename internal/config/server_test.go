package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
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
