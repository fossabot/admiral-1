package database

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.admiral.io/admiral/internal/config"
)

func TestConnString(t *testing.T) {
	tests := []struct {
		name     string
		cfg      *config.Database
		expected string
		err      string
	}{
		{
			name: "nil config",
			cfg:  nil,
			err:  "no connection information",
		},
		{
			name: "invalid host",
			cfg:  &config.Database{Host: "invalid host", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass"},
			err:  "invalid host: invalid host",
		},
		{
			name: "empty database name",
			cfg:  &config.Database{Host: "localhost", Port: 5432, DatabaseName: "", User: "user", Password: "pass"},
			err:  "database name is required",
		},
		{
			name: "invalid SSLMode",
			cfg:  &config.Database{Host: "localhost", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLMode(999)},
			err:  "invalid SSLMode: 999",
		},
		{
			name:     "disable SSL",
			cfg:      &config.Database{Host: "localhost", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLModeDisable},
			expected: "host=localhost port=5432 dbname=admiral user=user password=pass connect_timeout=10 application_name=admiral sslmode=disable",
		},
		{
			name:     "require SSL",
			cfg:      &config.Database{Host: "db.example.com", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLModeRequire},
			expected: "host=db.example.com port=5432 dbname=admiral user=user password=pass connect_timeout=10 application_name=admiral sslmode=require",
		},
		{
			name:     "verify-ca SSL",
			cfg:      &config.Database{Host: "db.example.com", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLModeVerifyCA},
			expected: "host=db.example.com port=5432 dbname=admiral user=user password=pass connect_timeout=10 application_name=admiral sslmode=verify-ca",
		},
		{
			name:     "verify-full SSL",
			cfg:      &config.Database{Host: "db.example.com", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLModeVerifyFull},
			expected: "host=db.example.com port=5432 dbname=admiral user=user password=pass connect_timeout=10 application_name=admiral sslmode=verify-full",
		},
		{
			name:     "unspecified SSL",
			cfg:      &config.Database{Host: "localhost", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLModeUnspecified},
			expected: "host=localhost port=5432 dbname=admiral user=user password=pass connect_timeout=10 application_name=admiral sslmode=disable",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := connString(tt.cfg)
			if tt.err != "" {
				assert.ErrorContains(t, err, tt.err)
				assert.Empty(t, got)
				return
			}
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, got)
		})
	}
}
