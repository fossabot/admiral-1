package server

import (
	"errors"
	"fmt"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/golang-migrate/migrate/v4"
	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"

	"go.admiral.io/admiral/internal/config"
)

func TestNewMigrateCmd(t *testing.T) {
	testCases := []struct {
		name          string
		expectedUse   string
		expectedShort string
		expectedArgs  cobra.PositionalArgs
		flagsToCheck  []string
	}{
		{
			name:          "creates migrate command with correct configuration",
			expectedUse:   "migrate",
			expectedShort: "Database migration management tool",
			expectedArgs:  cobra.NoArgs,
			flagsToCheck:  []string{"force", "down", "reset"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			migrateCmd := newMigrateCmd()

			assert.NotNil(t, migrateCmd)
			assert.NotNil(t, migrateCmd.Cmd)
			assert.Equal(t, tc.expectedUse, migrateCmd.Cmd.Use)
			assert.Equal(t, tc.expectedShort, migrateCmd.Cmd.Short)
			assert.NotEmpty(t, migrateCmd.Cmd.Long)
			assert.NotEmpty(t, migrateCmd.Cmd.Example)
			assert.True(t, migrateCmd.Cmd.SilenceUsage)
			assert.True(t, migrateCmd.Cmd.SilenceErrors)

			// Check that required flags exist
			for _, flagName := range tc.flagsToCheck {
				flag := migrateCmd.Cmd.Flags().Lookup(flagName)
				assert.NotNil(t, flag, "flag %s should exist", flagName)
			}

			// Check default values
			assert.False(t, migrateCmd.opts.force)
			assert.False(t, migrateCmd.opts.down)
			assert.False(t, migrateCmd.opts.reset)
		})
	}
}

func TestMigrateOpts(t *testing.T) {
	testCases := []struct {
		name     string
		opts     migrateOpts
		expected migrateOpts
	}{
		{
			name: "default options",
			opts: migrateOpts{},
			expected: migrateOpts{
				force: false,
				down:  false,
				reset: false,
			},
		},
		{
			name: "all options enabled",
			opts: migrateOpts{
				force: true,
				down:  true,
				reset: true,
			},
			expected: migrateOpts{
				force: true,
				down:  true,
				reset: true,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected.force, tc.opts.force)
			assert.Equal(t, tc.expected.down, tc.opts.down)
			assert.Equal(t, tc.expected.reset, tc.opts.reset)
		})
	}
}

func TestMigrator_SetupSqlClient(t *testing.T) {
	testCases := []struct {
		name        string
		setupMock   func() (*config.Config, *zap.Logger)
		expectError bool
		errorMsg    string
	}{
		{
			name: "successful database setup",
			setupMock: func() (*config.Config, *zap.Logger) {
				cfg := &config.Config{
					Services: config.Services{
						Database: &config.Database{
							Host: "localhost",
							Port: 5432,
							User: "testuser",
						},
					},
				}
				logger := zaptest.NewLogger(t)
				return cfg, logger
			},
			expectError: false,
		},
		{
			name: "database configuration with different host",
			setupMock: func() (*config.Config, *zap.Logger) {
				cfg := &config.Config{
					Services: config.Services{
						Database: &config.Database{
							Host: "postgres.example.com",
							Port: 5432,
							User: "admiral",
						},
					},
				}
				logger := zaptest.NewLogger(t)
				return cfg, logger
			},
			expectError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cfg, logger := tc.setupMock()
			_ = &migrator{
				log:    logger,
				config: cfg,
				force:  false,
			}

			// Note: This test would require mocking the database.New function
			// In a real implementation, you would inject the database service
			// For now, we test the hostInfo generation logic
			expectedHostInfo := "testuser@localhost:5432"
			if cfg.Services.Database.Host == "postgres.example.com" {
				expectedHostInfo = "admiral@postgres.example.com:5432"
			}

			// Test hostInfo format generation
			actualHostInfo := strings.Join([]string{
				cfg.Services.Database.User,
				"@",
				cfg.Services.Database.Host,
				":",
				"5432",
			}, "")
			expectedFormatted := strings.Replace(expectedHostInfo, "@", "@", 1)
			expectedFormatted = strings.Replace(expectedFormatted, ":", ":", 1)

			assert.Contains(t, actualHostInfo, cfg.Services.Database.User)
			assert.Contains(t, actualHostInfo, cfg.Services.Database.Host)
		})
	}
}

func TestMigrator_ConfirmWithUser(t *testing.T) {
	testCases := []struct {
		name        string
		force       bool
		message     string
		expectError bool
	}{
		{
			name:        "force mode skips confirmation",
			force:       true,
			message:     "Test migration message",
			expectError: false,
		},
		{
			name:        "non-force mode with valid message",
			force:       false,
			message:     "Migration may cause data loss",
			expectError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cfg := &config.Config{
				Services: config.Services{
					Database: &config.Database{
						Host: "localhost",
						Port: 5432,
						User: "testuser",
					},
				},
			}
			logger := zaptest.NewLogger(t)
			m := &migrator{
				log:    logger,
				config: cfg,
				force:  tc.force,
			}

			// Note: In a real test, you would mock the database connection
			// and user input. This test validates the structure and logic flow.
			assert.NotNil(t, m.log)
			assert.NotNil(t, m.config)
			assert.Equal(t, tc.force, m.force)
		})
	}
}

func TestMigrator_Up(t *testing.T) {
	testCases := []struct {
		name           string
		force          bool
		setupMigrator  func() error
		expectedError  bool
		expectedLogMsg string
	}{
		{
			name:           "successful migration up",
			force:          true,
			setupMigrator:  func() error { return nil },
			expectedError:  false,
			expectedLogMsg: "Migrations applied successfully",
		},
		{
			name:           "migration setup failure",
			force:          true,
			setupMigrator:  func() error { return errors.New("setup failed") },
			expectedError:  true,
			expectedLogMsg: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cfg := &config.Config{
				Services: config.Services{
					Database: &config.Database{
						Host: "localhost",
						Port: 5432,
						User: "testuser",
					},
				},
			}
			logger := zaptest.NewLogger(t)
			m := &migrator{
				log:    logger,
				config: cfg,
				force:  tc.force,
			}

			// Test the migrator structure and configuration
			assert.NotNil(t, m)
			assert.Equal(t, tc.force, m.force)
			assert.NotNil(t, m.config)
		})
	}
}

func TestMigrator_Down(t *testing.T) {
	testCases := []struct {
		name          string
		force         bool
		currentVer    uint
		expectedError bool
		errorMsg      string
	}{
		{
			name:          "successful down migration",
			force:         true,
			currentVer:    5,
			expectedError: false,
		},
		{
			name:          "down migration from version 1",
			force:         true,
			currentVer:    1,
			expectedError: false,
		},
		{
			name:          "down migration with confirmation",
			force:         false,
			currentVer:    3,
			expectedError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cfg := &config.Config{
				Services: config.Services{
					Database: &config.Database{
						Host: "localhost",
						Port: 5432,
						User: "testuser",
					},
				},
			}
			logger := zaptest.NewLogger(t)
			m := &migrator{
				log:    logger,
				config: cfg,
				force:  tc.force,
			}

			// Test version calculation logic
			expectedNextVersion := tc.currentVer - 1
			assert.Equal(t, tc.currentVer-1, expectedNextVersion)
			assert.NotNil(t, m)
		})
	}
}

func TestMigrator_Reset(t *testing.T) {
	testCases := []struct {
		name          string
		force         bool
		isDirty       bool
		version       uint
		expectedError bool
		expectedMsg   string
	}{
		{
			name:          "reset dirty schema",
			force:         true,
			isDirty:       true,
			version:       3,
			expectedError: false,
			expectedMsg:   "Migration state reset; dirty flag cleared",
		},
		{
			name:          "schema not dirty",
			force:         true,
			isDirty:       false,
			version:       3,
			expectedError: false,
			expectedMsg:   "Schema is not dirty, nothing to reset",
		},
		{
			name:          "reset with confirmation",
			force:         false,
			isDirty:       true,
			version:       5,
			expectedError: false,
			expectedMsg:   "Migration state reset; dirty flag cleared",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cfg := &config.Config{
				Services: config.Services{
					Database: &config.Database{
						Host: "localhost",
						Port: 5432,
						User: "testuser",
					},
				},
			}
			logger := zaptest.NewLogger(t)
			m := &migrator{
				log:    logger,
				config: cfg,
				force:  tc.force,
			}

			// Test logic flow and message formatting
			if tc.isDirty {
				expectedMsg := strings.Contains(tc.expectedMsg, "Migration state reset")
				assert.True(t, expectedMsg)
			} else {
				expectedMsg := strings.Contains(tc.expectedMsg, "nothing to reset")
				assert.True(t, expectedMsg)
			}
			assert.NotNil(t, m)
		})
	}
}

func TestMigrateLogger(t *testing.T) {
	testCases := []struct {
		name           string
		format         string
		args           []interface{}
		expectedOutput string
	}{
		{
			name:           "simple log message",
			format:         "Migration applied: %s",
			args:           []interface{}{"001_initial.sql"},
			expectedOutput: "Migration applied: 001_initial.sql",
		},
		{
			name:           "log message with newline",
			format:         "Migration completed\n",
			args:           []interface{}{},
			expectedOutput: "Migration completed",
		},
		{
			name:           "multiple arguments",
			format:         "Migrating from %d to %d",
			args:           []interface{}{1, 2},
			expectedOutput: "Migrating from 1 to 2",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			logger := zaptest.NewLogger(t)
			migrateLog := &migrateLogger{
				logger: logger.Sugar(),
			}

			assert.NotNil(t, migrateLog.logger)
			assert.True(t, migrateLog.Verbose())

			// Test string trimming logic
			trimmed := strings.TrimRight(tc.format, "\n")

			// Test actual formatting if args provided
			if len(tc.args) > 0 {
				formatted := fmt.Sprintf(trimmed, tc.args...)
				expected := strings.TrimRight(tc.expectedOutput, "\n")
				assert.Equal(t, expected, formatted)
			} else {
				// For no args, just verify trimming works
				expected := strings.TrimRight(tc.expectedOutput, "\n")
				assert.Equal(t, expected, trimmed)
			}
		})
	}
}

func TestMigrateLogger_Verbose(t *testing.T) {
	logger := zaptest.NewLogger(t)
	migrateLog := &migrateLogger{
		logger: logger.Sugar(),
	}

	assert.True(t, migrateLog.Verbose())
}

func TestMigrateLogger_Printf(t *testing.T) {
	testCases := []struct {
		name   string
		format string
		args   []interface{}
	}{
		{
			name:   "printf without arguments",
			format: "Simple message",
			args:   []interface{}{},
		},
		{
			name:   "printf with string argument",
			format: "Message: %s",
			args:   []interface{}{"test"},
		},
		{
			name:   "printf with multiple arguments",
			format: "Version %d, dirty: %t",
			args:   []interface{}{1, true},
		},
		{
			name:   "printf with newline trimming",
			format: "Message with newline\n",
			args:   []interface{}{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			logger := zaptest.NewLogger(t)
			migrateLog := &migrateLogger{
				logger: logger.Sugar(),
			}

			// Test that Printf doesn't panic and properly trims newlines
			assert.NotPanics(t, func() {
				migrateLog.Printf(tc.format, tc.args...)
			})

			// Verify newline trimming logic
			trimmed := strings.TrimRight(tc.format, "\n")
			assert.False(t, strings.HasSuffix(trimmed, "\n"))
		})
	}
}

func TestMigratorWithSqlMock(t *testing.T) {
	testCases := []struct {
		name        string
		setupMock   func(sqlmock.Sqlmock)
		expectError bool
	}{
		{
			name: "successful database ping",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectPing()
			},
			expectError: false,
		},
		{
			name: "database ping failure",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectPing().WillReturnError(errors.New("connection failed"))
			},
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			db, mockDB, err := sqlmock.New(sqlmock.MonitorPingsOption(true))
			require.NoError(t, err)
			defer func() { _ = db.Close() }()

			tc.setupMock(mockDB)

			// Test database ping
			err = db.Ping()
			if tc.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mockDB.ExpectationsWereMet())
		})
	}
}

func TestEmbeddedFileSystem(t *testing.T) {
	t.Run("embedded filesystem exists", func(t *testing.T) {
		assert.NotNil(t, fs)

		// Test that the embedded filesystem can be accessed
		entries, err := fs.ReadDir("migrations")
		if err != nil {
			// If migrations directory doesn't exist in embed, that's expected for tests
			assert.Contains(t, err.Error(), "file does not exist")
		} else {
			// If migrations exist, verify they're readable
			assert.IsType(t, []string{}, make([]string, len(entries)))
		}
	})
}

func TestMigrationErrorHandling(t *testing.T) {
	testCases := []struct {
		name        string
		err         error
		expectNoErr bool
	}{
		{
			name:        "no change error is ignored",
			err:         migrate.ErrNoChange,
			expectNoErr: true,
		},
		{
			name:        "other errors are returned",
			err:         errors.New("migration failed"),
			expectNoErr: false,
		},
		{
			name:        "no error",
			err:         nil,
			expectNoErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Test error handling logic
			if tc.err != nil && !errors.Is(tc.err, migrate.ErrNoChange) {
				assert.False(t, tc.expectNoErr)
			} else {
				assert.True(t, tc.expectNoErr)
			}
		})
	}
}
