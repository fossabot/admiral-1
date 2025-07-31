package server

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewStartCmd(t *testing.T) {
	t.Run("creates command with correct properties", func(t *testing.T) {
		startCmd := newStartCmd()

		require.NotNil(t, startCmd)
		require.NotNil(t, startCmd.Cmd)

		// Test command properties
		assert.Equal(t, "start", startCmd.Cmd.Use)
		assert.Equal(t, "Start the Admiral server process", startCmd.Cmd.Short)
		assert.Equal(t, "Start the Admiral server process with the specified configuration.", startCmd.Cmd.Long)
		assert.Contains(t, startCmd.Cmd.Example, "admiral-server start")
		assert.Contains(t, startCmd.Cmd.Example, "--config")
		assert.Contains(t, startCmd.Cmd.Example, "--debug")
		assert.Contains(t, startCmd.Cmd.Example, "--env")
	})

	t.Run("has correct aliases", func(t *testing.T) {
		startCmd := newStartCmd()

		expectedAliases := []string{"s", "serve", "run"}
		assert.Equal(t, expectedAliases, startCmd.Cmd.Aliases)
	})

	t.Run("has correct argument validation", func(t *testing.T) {
		startCmd := newStartCmd()

		// Should accept no arguments
		err := startCmd.Cmd.Args(startCmd.Cmd, []string{})
		assert.NoError(t, err)

		// Should reject arguments
		err = startCmd.Cmd.Args(startCmd.Cmd, []string{"arg1"})
		assert.Error(t, err)

		// Test ValidArgsFunction
		completions, directive := startCmd.Cmd.ValidArgsFunction(startCmd.Cmd, []string{}, "")
		assert.Empty(t, completions)
		assert.Equal(t, cobra.ShellCompDirectiveNoFileComp, directive)
	})
}

func TestStartCmd_PreRunE(t *testing.T) {
	// Save original global variables
	originalConfigFile := configFile
	defer func() { configFile = originalConfigFile }()

	testCases := []struct {
		name          string
		setupConfig   func() (cleanup func())
		expectError   bool
		expectedError string
		expectedCode  int
	}{
		{
			name: "empty config file",
			setupConfig: func() func() {
				configFile = ""
				return func() {}
			},
			expectError:   true,
			expectedError: "configuration file is required",
			expectedCode:  1,
		},
		{
			name: "non-existent config file",
			setupConfig: func() func() {
				configFile = "/non/existent/config.yaml"
				return func() {}
			},
			expectError:   true,
			expectedError: "no such file or directory",
			expectedCode:  1,
		},
		{
			name: "valid config file",
			setupConfig: func() func() {
				// Create a temporary config file
				tempFile, err := os.CreateTemp("", "test-config-*.yaml")
				if err != nil {
					return func() {}
				}
				_ = tempFile.Close()

				configFile = tempFile.Name()
				return func() {
					_ = os.Remove(tempFile.Name())
				}
			},
			expectError: false,
		},
		{
			name: "directory instead of file",
			setupConfig: func() func() {
				// Create a temporary directory
				tempDir, err := os.MkdirTemp("", "test-config-dir")
				if err != nil {
					return func() {}
				}

				configFile = tempDir
				return func() {
					_ = os.RemoveAll(tempDir)
				}
			},
			expectError: false, // os.Stat succeeds for directories
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cleanup := tc.setupConfig()
			defer cleanup()

			startCmd := newStartCmd()
			err := startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})

			if tc.expectError {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tc.expectedError)

				// Check if it's an exitError with correct code
				var exitErr *exitError
				if errors.As(err, &exitErr) {
					assert.Equal(t, tc.expectedCode, exitErr.code)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestStartCmd_PreRunE_FilePermissions(t *testing.T) {
	// Save original global variable
	originalConfigFile := configFile
	defer func() { configFile = originalConfigFile }()

	t.Run("unreadable config file", func(t *testing.T) {
		// Create a temporary config file
		tempFile, err := os.CreateTemp("", "test-config-*.yaml")
		require.NoError(t, err)
		_ = tempFile.Close()
		defer func() { _ = os.Remove(tempFile.Name()) }()

		// Make file unreadable (this might not work on all systems)
		err = os.Chmod(tempFile.Name(), 0000)
		if err != nil {
			t.Skip("Cannot modify file permissions on this system")
		}
		defer func() { _ = os.Chmod(tempFile.Name(), 0600) }() // Restore permissions for cleanup

		configFile = tempFile.Name()

		startCmd := newStartCmd()
		err = startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})

		// File exists, so PreRunE should pass (it only checks existence)
		assert.NoError(t, err)
	})
}

func TestStartCmd_Run(t *testing.T) {
	// Save original global variables
	originalConfigFile := configFile
	originalEnvVarFiles := envVarFiles
	originalDebug := debug

	defer func() {
		configFile = originalConfigFile
		envVarFiles = originalEnvVarFiles
		debug = originalDebug
	}()

	t.Run("run function is properly configured", func(t *testing.T) {
		startCmd := newStartCmd()

		// Verify Run function is set
		assert.NotNil(t, startCmd.Cmd.Run)

		// We can't easily test the Run function execution without mocking
		// the config.Build and gateway.Run functions, but we can verify
		// the function is properly assigned
	})
}

func TestStartCmd_Integration(t *testing.T) {
	// Save original global variables
	originalConfigFile := configFile
	originalEnvVarFiles := envVarFiles
	originalDebug := debug

	defer func() {
		configFile = originalConfigFile
		envVarFiles = originalEnvVarFiles
		debug = originalDebug
	}()

	t.Run("complete command workflow", func(t *testing.T) {
		// Create a temporary config file
		tempFile, err := os.CreateTemp("", "test-config-*.yaml")
		require.NoError(t, err)
		defer func() { _ = os.Remove(tempFile.Name()) }()

		// Write minimal config content
		_, err = tempFile.WriteString("# Test configuration\n")
		require.NoError(t, err)
		_ = tempFile.Close()

		// Set up global variables
		configFile = tempFile.Name()
		envVarFiles = envFiles{".env.test"}
		debug = true

		startCmd := newStartCmd()

		// Test PreRunE passes with valid config
		err = startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})
		assert.NoError(t, err)

		// We cannot test Run function without mocking external dependencies
		// but we verified PreRunE validation works correctly
	})
}

func TestStartCmd_CommandStructure(t *testing.T) {
	t.Run("command hierarchy", func(t *testing.T) {
		startCmd := newStartCmd()

		// Test that the command can be added to a parent
		parentCmd := &cobra.Command{Use: "parent"}
		parentCmd.AddCommand(startCmd.Cmd)

		// Verify command was added
		childCmds := parentCmd.Commands()
		require.Len(t, childCmds, 1)
		assert.Equal(t, "start", childCmds[0].Use)
	})

	t.Run("help text generation", func(t *testing.T) {
		startCmd := newStartCmd()

		// Test that help can be generated without panic
		assert.NotPanics(t, func() {
			_ = startCmd.Cmd.Help()
		})

		// Test usage string
		usage := startCmd.Cmd.UsageString()
		assert.Contains(t, usage, "start")
		assert.Contains(t, usage, "Aliases")
		assert.Contains(t, usage, "Examples")
	})
}

func TestStartCmd_ErrorWrapping(t *testing.T) {
	// Save original global variable
	originalConfigFile := configFile
	defer func() { configFile = originalConfigFile }()

	t.Run("error wrapping for missing config", func(t *testing.T) {
		configFile = ""

		startCmd := newStartCmd()
		err := startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})

		require.Error(t, err)

		var exitErr *exitError
		require.True(t, errors.As(err, &exitErr))
		assert.Equal(t, 1, exitErr.code)
		assert.Equal(t, "missing configuration file", exitErr.details)
	})

	t.Run("error wrapping for non-existent config", func(t *testing.T) {
		configFile = "/absolutely/non/existent/path/config.yaml"

		startCmd := newStartCmd()
		err := startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})

		require.Error(t, err)

		var exitErr *exitError
		require.True(t, errors.As(err, &exitErr))
		assert.Equal(t, 1, exitErr.code)
		assert.Contains(t, exitErr.details, "configuration file does not exist")
		assert.Contains(t, exitErr.details, configFile)
	})
}

func TestStartCmd_EdgeCases(t *testing.T) {
	// Save original global variable
	originalConfigFile := configFile
	defer func() { configFile = originalConfigFile }()

	testCases := []struct {
		name        string
		setupConfig func() (cleanup func())
		expectError bool
	}{
		{
			name: "empty string config file",
			setupConfig: func() func() {
				configFile = ""
				return func() {}
			},
			expectError: true,
		},
		{
			name: "whitespace only config file",
			setupConfig: func() func() {
				configFile = "   "
				return func() {}
			},
			expectError: true, // File doesn't exist
		},
		{
			name: "relative path config file that exists",
			setupConfig: func() func() {
				// Create temp file in current directory
				tempFile, err := os.CreateTemp(".", "test-config-*.yaml")
				if err != nil {
					return func() {}
				}
				_ = tempFile.Close()

				// Use just the filename (relative path)
				configFile = filepath.Base(tempFile.Name())
				return func() {
					_ = os.Remove(tempFile.Name())
				}
			},
			expectError: false,
		},
		{
			name: "config file with unicode characters",
			setupConfig: func() func() {
				tempFile, err := os.CreateTemp("", "test-配置-*.yaml")
				if err != nil {
					return func() {}
				}
				_ = tempFile.Close()

				configFile = tempFile.Name()
				return func() {
					_ = os.Remove(tempFile.Name())
				}
			},
			expectError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cleanup := tc.setupConfig()
			defer cleanup()

			startCmd := newStartCmd()
			err := startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})

			if tc.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestStartCmd_Concurrency(t *testing.T) {
	t.Run("concurrent command creation", func(t *testing.T) {
		const numGoroutines = 10
		done := make(chan *startCmd, numGoroutines)

		// Create commands concurrently
		for i := 0; i < numGoroutines; i++ {
			go func() {
				cmd := newStartCmd()
				done <- cmd
			}()
		}

		// Collect results
		commands := make([]*startCmd, 0, numGoroutines)
		for i := 0; i < numGoroutines; i++ {
			cmd := <-done
			commands = append(commands, cmd)
		}

		// Verify all commands were created successfully
		for i, cmd := range commands {
			assert.NotNil(t, cmd, "Command %d should not be nil", i)
			assert.NotNil(t, cmd.Cmd, "Command.Cmd %d should not be nil", i)
			assert.Equal(t, "start", cmd.Cmd.Use, "Command %d should have correct Use", i)
		}
	})
}

func TestStartCmd_MemoryUsage(t *testing.T) {
	t.Run("no memory leaks in command creation", func(t *testing.T) {
		// Create and discard many commands to check for obvious memory leaks
		for i := 0; i < 100; i++ {
			cmd := newStartCmd()
			// Use the command to prevent optimization
			_ = cmd.Cmd.Use
		}

		// If we get here without running out of memory, test passes
		// This is a basic check - more sophisticated memory profiling
		// would require runtime.MemStats or pprof
	})
}

// Benchmark tests
func BenchmarkNewStartCmd(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = newStartCmd()
	}
}

func BenchmarkStartCmd_PreRunE_ValidConfig(b *testing.B) {
	// Save original global variable
	originalConfigFile := configFile
	defer func() { configFile = originalConfigFile }()

	// Create a temporary config file
	tempFile, err := os.CreateTemp("", "benchmark-config-*.yaml")
	if err != nil {
		b.Fatal(err)
	}
	defer func() { _ = os.Remove(tempFile.Name()) }()
	_ = tempFile.Close()

	configFile = tempFile.Name()
	startCmd := newStartCmd()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})
	}
}

func BenchmarkStartCmd_PreRunE_InvalidConfig(b *testing.B) {
	// Save original global variable
	originalConfigFile := configFile
	defer func() { configFile = originalConfigFile }()

	configFile = "/non/existent/config.yaml"
	startCmd := newStartCmd()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})
	}
}

// Helper functions for testing
func createTempConfigFile(t *testing.T, content string) (string, func()) {
	tempFile, err := os.CreateTemp("", "test-config-*.yaml")
	require.NoError(t, err)

	if content != "" {
		_, err = tempFile.WriteString(content)
		require.NoError(t, err)
	}

	_ = tempFile.Close()

	return tempFile.Name(), func() {
		_ = os.Remove(tempFile.Name())
	}
}

// Integration test demonstrating typical usage
func TestStartCmd_TypicalUsage(t *testing.T) {
	// Save original global variables
	originalConfigFile := configFile
	originalEnvVarFiles := envVarFiles
	originalDebug := debug

	defer func() {
		configFile = originalConfigFile
		envVarFiles = originalEnvVarFiles
		debug = originalDebug
	}()

	t.Run("typical server start scenario", func(t *testing.T) {
		// Create a realistic config file
		configPath, cleanup := createTempConfigFile(t, `
# Admiral Server Configuration
server:
  port: 8080
  host: localhost
database:
  driver: postgres
  dsn: "postgres://localhost/admiral"
`)
		defer cleanup()

		// Set up typical configuration
		configFile = configPath
		envVarFiles = envFiles{".env", ".env.local"}
		debug = false

		startCmd := newStartCmd()

		// Test that PreRunE validation passes
		err := startCmd.Cmd.PreRunE(startCmd.Cmd, []string{})
		assert.NoError(t, err)

		// Verify command structure
		assert.Equal(t, "start", startCmd.Cmd.Use)
		assert.Contains(t, startCmd.Cmd.Aliases, "s")
		assert.NotNil(t, startCmd.Cmd.Run)
	})
}
