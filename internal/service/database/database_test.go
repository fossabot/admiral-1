package database

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/uber-go/tally/v4"
	"go.uber.org/zap/zaptest"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/service"
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
			name: "invalid host with space",
			cfg:  &config.Database{Host: "invalid host", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass"},
			err:  "invalid host: invalid host",
		},
		{
			name: "invalid host with injection chars",
			cfg:  &config.Database{Host: "host'=1", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass"},
			err:  "invalid host: host'=1",
		},
		{
			name: "empty host",
			cfg:  &config.Database{Host: "", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass"},
			err:  "invalid host: ",
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
			name:     "allow SSL",
			cfg:      &config.Database{Host: "localhost", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLModeAllow},
			expected: "host=localhost port=5432 dbname=admiral user=user password=pass connect_timeout=10 application_name=admiral sslmode=allow",
		},
		{
			name:     "prefer SSL",
			cfg:      &config.Database{Host: "localhost", Port: 5432, DatabaseName: "admiral", User: "user", Password: "pass", SSLMode: config.SSLModePrefer},
			expected: "host=localhost port=5432 dbname=admiral user=user password=pass connect_timeout=10 application_name=admiral sslmode=prefer",
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

func TestNew(t *testing.T) {
	t.Run("successful connection with defaults", func(t *testing.T) {
		// Create mock database
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		// Mock successful ping
		mock.ExpectPing()

		cfg := &config.Config{
			Services: config.Services{
				Database: &config.Database{
					Host:         "localhost",
					Port:         5432,
					DatabaseName: "testdb",
					User:         "testuser",
					Password:     "testpass",
					SSLMode:      config.SSLModeDisable,
				},
			},
		}

		// We can't easily mock sql.Open, so we'll test the connection string generation
		connStr, err := connString(cfg.Services.Database)
		require.NoError(t, err)
		expected := "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=disable"
		assert.Equal(t, expected, connStr)
	})

	t.Run("with custom connection pool settings", func(t *testing.T) {
		cfg := &config.Config{
			Services: config.Services{
				Database: &config.Database{
					Host:              "localhost",
					Port:              5432,
					DatabaseName:      "testdb",
					User:              "testuser",
					Password:          "testpass",
					SSLMode:           config.SSLModeDisable,
					MaxOpenConns:      50,
					MaxIdleConns:      5,
					ConnMaxLifetime:   15 * time.Minute,
					ConnMaxIdleTime:   2 * time.Minute,
					ConnectionTimeout: 10 * time.Second,
				},
			},
		}

		connStr, err := connString(cfg.Services.Database)
		require.NoError(t, err)
		expected := "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=disable"
		assert.Equal(t, expected, connStr)
	})

	t.Run("nil database config", func(t *testing.T) {
		cfg := &config.Config{
			Services: config.Services{
				Database: nil,
			},
		}

		_, err := connString(cfg.Services.Database)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "no connection information")
	})
}

func TestService_Interface(t *testing.T) {
	// Create mock database
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	// Create GORM database from the mock
	gormDB, err := gorm.Open(postgres.New(postgres.Config{Conn: db}), &gorm.Config{})
	require.NoError(t, err)

	logger := zaptest.NewLogger(t)
	scope := tally.NoopScope

	// Create service instance
	svc := &srv{
		sqlDB:  db,
		gormDB: gormDB,
		logger: logger,
		scope:  scope,
	}

	t.Run("implements Service interface", func(t *testing.T) {
		var _ service.Service = svc
		var _ Service = svc
	})

	t.Run("DB() returns sql.DB", func(t *testing.T) {
		result := svc.DB()
		assert.Equal(t, db, result)
		assert.NotNil(t, result)
	})

	t.Run("GormDB() returns gorm.DB", func(t *testing.T) {
		result := svc.GormDB()
		assert.Equal(t, gormDB, result)
		assert.NotNil(t, result)
	})

	// Clean up mock expectations
	mock.ExpectClose()
}

func TestConnString_EdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		cfg         *config.Database
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil config",
			cfg:         nil,
			expectError: true,
			errorMsg:    "no connection information",
		},
		{
			name: "empty host",
			cfg: &config.Database{
				Host:         "",
				Port:         5432,
				DatabaseName: "testdb",
				User:         "testuser",
				Password:     "testpass",
				SSLMode:      config.SSLModeDisable,
			},
			expectError: true,
			errorMsg:    "invalid host",
		},
		{
			name: "empty database name",
			cfg: &config.Database{
				Host:         "localhost",
				Port:         5432,
				DatabaseName: "",
				User:         "testuser",
				Password:     "testpass",
				SSLMode:      config.SSLModeDisable,
			},
			expectError: true,
			errorMsg:    "database name is required",
		},
		{
			name: "host with injection characters",
			cfg: &config.Database{
				Host:         "host'injection=attack",
				Port:         5432,
				DatabaseName: "testdb",
				User:         "testuser",
				Password:     "testpass",
				SSLMode:      config.SSLModeDisable,
			},
			expectError: true,
			errorMsg:    "invalid host",
		},
		{
			name: "host with newline",
			cfg: &config.Database{
				Host:         "host\ninjection",
				Port:         5432,
				DatabaseName: "testdb",
				User:         "testuser",
				Password:     "testpass",
				SSLMode:      config.SSLModeDisable,
			},
			expectError: true,
			errorMsg:    "invalid host",
		},
		{
			name: "host with quote",
			cfg: &config.Database{
				Host:         "host\"injection",
				Port:         5432,
				DatabaseName: "testdb",
				User:         "testuser",
				Password:     "testpass",
				SSLMode:      config.SSLModeDisable,
			},
			expectError: true,
			errorMsg:    "invalid host",
		},
		{
			name: "invalid SSL mode",
			cfg: &config.Database{
				Host:         "localhost",
				Port:         5432,
				DatabaseName: "testdb",
				User:         "testuser",
				Password:     "testpass",
				SSLMode:      config.SSLMode(999),
			},
			expectError: true,
			errorMsg:    "invalid SSLMode",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := connString(tt.cfg)
			if tt.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.errorMsg)
				assert.Empty(t, result)
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, result)
			}
		})
	}
}

func TestConnString_AllSSLModes(t *testing.T) {
	baseConfig := &config.Database{
		Host:         "localhost",
		Port:         5432,
		DatabaseName: "testdb",
		User:         "testuser",
		Password:     "testpass",
	}

	tests := []struct {
		name     string
		sslMode  config.SSLMode
		expected string
	}{
		{
			name:     "unspecified SSL mode",
			sslMode:  config.SSLModeUnspecified,
			expected: "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=disable",
		},
		{
			name:     "disable SSL mode",
			sslMode:  config.SSLModeDisable,
			expected: "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=disable",
		},
		{
			name:     "allow SSL mode",
			sslMode:  config.SSLModeAllow,
			expected: "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=allow",
		},
		{
			name:     "prefer SSL mode",
			sslMode:  config.SSLModePrefer,
			expected: "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=prefer",
		},
		{
			name:     "require SSL mode",
			sslMode:  config.SSLModeRequire,
			expected: "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=require",
		},
		{
			name:     "verify-ca SSL mode",
			sslMode:  config.SSLModeVerifyCA,
			expected: "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=verify-ca",
		},
		{
			name:     "verify-full SSL mode",
			sslMode:  config.SSLModeVerifyFull,
			expected: "host=localhost port=5432 dbname=testdb user=testuser password=testpass connect_timeout=10 application_name=admiral sslmode=verify-full",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := *baseConfig
			cfg.SSLMode = tt.sslMode

			result, err := connString(&cfg)
			require.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestService_Name(t *testing.T) {
	assert.Equal(t, "service.database", Name)
}

// Benchmark tests for performance
func BenchmarkConnString(b *testing.B) {
	cfg := &config.Database{
		Host:         "localhost",
		Port:         5432,
		DatabaseName: "testdb",
		User:         "testuser",
		Password:     "testpass",
		SSLMode:      config.SSLModeRequire,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = connString(cfg)
	}
}
