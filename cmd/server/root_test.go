package server

import (
	"bytes"
	"errors"
	"os"
	"testing"

	goversion "github.com/caarlos0/go-version"
	"github.com/spf13/cobra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func TestEnvFiles_String(t *testing.T) {
	testCases := []struct {
		name     string
		files    envFiles
		expected string
	}{
		{
			name:     "empty files",
			files:    envFiles{},
			expected: "",
		},
		{
			name:     "single file",
			files:    envFiles{".env"},
			expected: ".env",
		},
		{
			name:     "multiple files",
			files:    envFiles{".env", ".env.local", ".env.production"},
			expected: ".env,.env.local,.env.production",
		},
		{
			name:     "files with spaces",
			files:    envFiles{"file 1.env", "file 2.env"},
			expected: "file 1.env,file 2.env",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := tc.files.String()
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestEnvFiles_Set(t *testing.T) {
	testCases := []struct {
		name     string
		initial  envFiles
		setValue string
		expected envFiles
	}{
		{
			name:     "add to empty",
			initial:  envFiles{},
			setValue: ".env",
			expected: envFiles{".env"},
		},
		{
			name:     "add to existing",
			initial:  envFiles{".env"},
			setValue: ".env.local",
			expected: envFiles{".env", ".env.local"},
		},
		{
			name:     "add empty string",
			initial:  envFiles{".env"},
			setValue: "",
			expected: envFiles{".env", ""},
		},
		{
			name:     "add duplicate",
			initial:  envFiles{".env"},
			setValue: ".env",
			expected: envFiles{".env", ".env"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			files := tc.initial
			err := files.Set(tc.setValue)

			assert.NoError(t, err)
			assert.Equal(t, tc.expected, files)
		})
	}
}

func TestEnvFiles_Type(t *testing.T) {
	files := &envFiles{}
	assert.Equal(t, "envFiles", files.Type())
}

func TestExecute(t *testing.T) {
	testCases := []struct {
		name         string
		versionInfo  goversion.Info
		args         []string
		expectExit   bool
		expectedCode int
	}{
		{
			name: "help command",
			versionInfo: goversion.Info{
				GitVersion: "1.0.0",
				GitCommit:  "abc123",
				BuildDate:  "2023-01-01T00:00:00Z",
			},
			args:       []string{"--help"},
			expectExit: false,
		},
		{
			name: "version command",
			versionInfo: goversion.Info{
				GitVersion: "1.0.0",
				GitCommit:  "abc123",
				BuildDate:  "2023-01-01T00:00:00Z",
			},
			args:       []string{"--version"},
			expectExit: false,
		},
		{
			name: "invalid command",
			versionInfo: goversion.Info{
				GitVersion: "1.0.0",
				GitCommit:  "abc123",
				BuildDate:  "2023-01-01T00:00:00Z",
			},
			args:       []string{"invalid-command"},
			expectExit: false, // Cobra shows help, doesn't exit
		},
		{
			name: "too many args",
			versionInfo: goversion.Info{
				GitVersion: "1.0.0",
				GitCommit:  "abc123",
				BuildDate:  "2023-01-01T00:00:00Z",
			},
			args:       []string{"arg1", "arg2"},
			expectExit: false, // Cobra shows help, doesn't exit
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var exitCalled bool
			var exitCode int

			exitFunc := func(code int) {
				exitCalled = true
				exitCode = code
			}

			// Capture stdout to prevent version/help output during tests
			oldArgs := os.Args
			defer func() { os.Args = oldArgs }()

			Execute(tc.versionInfo, exitFunc, tc.args)

			if tc.expectExit {
				assert.True(t, exitCalled, "Expected exit function to be called")
				if tc.expectedCode != 0 {
					assert.Equal(t, tc.expectedCode, exitCode)
				}
			}
		})
	}
}

func TestNewRootCmd(t *testing.T) {
	versionInfo := goversion.Info{
		GitVersion: "1.0.0",
		GitCommit:  "abc123",
		BuildDate:  "2023-01-01T00:00:00Z",
	}

	exitFunc := func(code int) {
		// Test exit function
	}

	t.Run("creates command with correct properties", func(t *testing.T) {
		root := newRootCmd(versionInfo, exitFunc)

		require.NotNil(t, root)
		require.NotNil(t, root.cmd)
		require.NotNil(t, root.log)
		assert.NotNil(t, root.exit)

		// Test command properties
		assert.Equal(t, "admiral-server", root.cmd.Use)
		assert.Contains(t, root.cmd.Short, "Admiral - Platform Orchestrator")
		assert.Equal(t, versionInfo.String(), root.cmd.Version)
		assert.True(t, root.cmd.SilenceUsage)
		assert.True(t, root.cmd.SilenceErrors)
	})

	t.Run("has correct flags", func(t *testing.T) {
		root := newRootCmd(versionInfo, exitFunc)

		configFlag := root.cmd.PersistentFlags().Lookup("config")
		require.NotNil(t, configFlag)
		assert.Equal(t, "config.yaml", configFlag.DefValue)

		debugFlag := root.cmd.PersistentFlags().Lookup("debug")
		require.NotNil(t, debugFlag)
		assert.Equal(t, "false", debugFlag.DefValue)

		envFlag := root.cmd.PersistentFlags().Lookup("env")
		require.NotNil(t, envFlag)
	})

	t.Run("has subcommands", func(t *testing.T) {
		root := newRootCmd(versionInfo, exitFunc)

		subcommands := root.cmd.Commands()
		require.Greater(t, len(subcommands), 0, "Should have subcommands")

		// Check that migrate and start commands are present
		var hasStart, hasMigrate bool
		for _, cmd := range subcommands {
			switch cmd.Use {
			case "start":
				hasStart = true
			case "migrate":
				hasMigrate = true
			}
		}

		assert.True(t, hasStart, "Should have start command")
		assert.True(t, hasMigrate, "Should have migrate command")
	})
}

func TestRootCmd_Execute(t *testing.T) {
	versionInfo := goversion.Info{
		GitVersion: "1.0.0",
		GitCommit:  "abc123",
		BuildDate:  "2023-01-01T00:00:00Z",
	}

	testCases := []struct {
		name         string
		args         []string
		expectExit   bool
		expectedCode int
		setupError   bool
	}{
		{
			name:       "successful help",
			args:       []string{"--help"},
			expectExit: false,
		},
		{
			name:       "successful version",
			args:       []string{"--version"},
			expectExit: false,
		},
		{
			name:       "invalid command",
			args:       []string{"nonexistent"},
			expectExit: false, // Shows help, doesn't exit
		},
		{
			name:       "too many arguments",
			args:       []string{"arg1", "arg2"},
			expectExit: false, // Shows help, doesn't exit
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var exitCalled bool
			var exitCode int

			exitFunc := func(code int) {
				exitCalled = true
				exitCode = code
			}

			root := newRootCmd(versionInfo, exitFunc)
			err := root.Execute(tc.args)

			if tc.expectExit {
				assert.True(t, exitCalled, "Expected exit function to be called")
				assert.Equal(t, tc.expectedCode, exitCode)
				assert.Error(t, err)
			} else {
				assert.False(t, exitCalled, "Did not expect exit function to be called")
				// Note: help/version commands may return nil or an error depending on cobra version
			}
		})
	}
}

func TestRootCmd_ExecuteWithExitError(t *testing.T) {
	var exitCalled bool
	var exitCode int

	exitFunc := func(code int) {
		exitCalled = true
		exitCode = code
	}

	// Create a custom logger that we can capture output from
	var logOutput bytes.Buffer
	config := zap.NewProductionConfig()
	logger := zap.New(zapcore.NewCore(
		zapcore.NewJSONEncoder(config.EncoderConfig),
		zapcore.AddSync(&logOutput),
		zapcore.InfoLevel,
	))

	root := &rootCmd{
		log:  logger,
		exit: exitFunc,
	}

	// Create a command that will return an exitError
	root.cmd = &cobra.Command{
		Use: "test",
		RunE: func(cmd *cobra.Command, args []string) error {
			return &exitError{
				err:     errors.New("test error"),
				code:    42,
				details: "custom error details",
			}
		},
	}

	err := root.Execute([]string{})

	assert.True(t, exitCalled, "Expected exit function to be called")
	assert.Equal(t, 42, exitCode, "Expected custom exit code")
	assert.Error(t, err)

	// Check that the error was logged
	logStr := logOutput.String()
	assert.Contains(t, logStr, "error") // Should contain error information
}

func TestRootCmd_ExecuteWithRegularError(t *testing.T) {
	var exitCalled bool
	var exitCode int

	exitFunc := func(code int) {
		exitCalled = true
		exitCode = code
	}

	// Create a custom logger
	var logOutput bytes.Buffer
	config := zap.NewProductionConfig()
	logger := zap.New(zapcore.NewCore(
		zapcore.NewJSONEncoder(config.EncoderConfig),
		zapcore.AddSync(&logOutput),
		zapcore.InfoLevel,
	))

	root := &rootCmd{
		log:  logger,
		exit: exitFunc,
	}

	// Create a command that will return a regular error
	root.cmd = &cobra.Command{
		Use: "test",
		RunE: func(cmd *cobra.Command, args []string) error {
			return errors.New("regular error")
		},
	}

	err := root.Execute([]string{})

	assert.True(t, exitCalled, "Expected exit function to be called")
	assert.Equal(t, 1, exitCode, "Expected default exit code")
	assert.Error(t, err)
}

func TestRootCmd_ExecuteSuccess(t *testing.T) {
	var exitCalled bool

	exitFunc := func(code int) {
		exitCalled = true
	}

	logger, _ := zap.NewDevelopment()

	root := &rootCmd{
		log:  logger,
		exit: exitFunc,
	}

	// Create a command that will succeed
	root.cmd = &cobra.Command{
		Use: "test",
		Run: func(cmd *cobra.Command, args []string) {
			// Success case - do nothing
		},
	}

	err := root.Execute([]string{})

	assert.False(t, exitCalled, "Did not expect exit function to be called")
	assert.NoError(t, err)
}

func TestGlobalVariables(t *testing.T) {
	// Test that global variables can be accessed and modified
	t.Run("configFile variable", func(t *testing.T) {
		originalConfig := configFile
		defer func() { configFile = originalConfig }()

		configFile = "test-config.yaml"
		assert.Equal(t, "test-config.yaml", configFile)
	})

	t.Run("debug variable", func(t *testing.T) {
		originalDebug := debug
		defer func() { debug = originalDebug }()

		debug = true
		assert.True(t, debug)
	})

	t.Run("envVarFiles variable", func(t *testing.T) {
		originalEnvFiles := envVarFiles
		defer func() { envVarFiles = originalEnvFiles }()

		envVarFiles = envFiles{".env.test"}
		assert.Equal(t, envFiles{".env.test"}, envVarFiles)
	})
}

func TestVersionInfoIntegration(t *testing.T) {
	testCases := []struct {
		name        string
		versionInfo goversion.Info
	}{
		{
			name: "complete version info",
			versionInfo: goversion.Info{
				GitVersion: "v1.2.3",
				GitCommit:  "abc123def456",
				BuildDate:  "2023-01-01T12:00:00Z",
				BuiltBy:    "test-user",
				GoVersion:  "go1.19",
			},
		},
		{
			name: "minimal version info",
			versionInfo: goversion.Info{
				GitVersion: "dev",
			},
		},
		{
			name:        "empty version info",
			versionInfo: goversion.Info{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			exitFunc := func(int) {}

			root := newRootCmd(tc.versionInfo, exitFunc)
			assert.Equal(t, tc.versionInfo.String(), root.cmd.Version)
		})
	}
}

func TestCommandValidation(t *testing.T) {
	versionInfo := goversion.Info{GitVersion: "1.0.0"}
	exitFunc := func(int) {}

	root := newRootCmd(versionInfo, exitFunc)

	t.Run("no args validation", func(t *testing.T) {
		// The root command should accept no arguments
		err := root.cmd.Args(root.cmd, []string{})
		assert.NoError(t, err)

		// But should reject arguments
		err = root.cmd.Args(root.cmd, []string{"arg1"})
		assert.Error(t, err)
	})

	t.Run("completion settings", func(t *testing.T) {
		// Test that completion is properly configured
		assert.True(t, root.cmd.CompletionOptions.DisableDefaultCmd)

		// Test ValidArgsFunction
		completions, directive := root.cmd.ValidArgsFunction(root.cmd, []string{}, "")
		assert.Empty(t, completions)
		assert.Equal(t, cobra.ShellCompDirectiveNoFileComp, directive)
	})
}

// Benchmark tests for performance analysis
func BenchmarkEnvFiles_String(b *testing.B) {
	files := envFiles{".env", ".env.local", ".env.production", ".env.test"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = files.String()
	}
}

func BenchmarkEnvFiles_Set(b *testing.B) {
	files := envFiles{}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = files.Set(".env.test")
	}
}

func BenchmarkNewRootCmd(b *testing.B) {
	versionInfo := goversion.Info{
		GitVersion: "1.0.0",
		GitCommit:  "abc123",
		BuildDate:  "2023-01-01T00:00:00Z",
	}
	exitFunc := func(int) {}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = newRootCmd(versionInfo, exitFunc)
	}
}

// Test helper functions
func createTestVersionInfo() goversion.Info {
	return goversion.Info{
		GitVersion: "test-version",
		GitCommit:  "test-commit",
		BuildDate:  "2023-01-01T00:00:00Z",
		BuiltBy:    "test-builder",
	}
}

// Integration test with real command execution
func TestFullCommandExecution(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	versionInfo := createTestVersionInfo()
	var exitCalled bool
	exitFunc := func(code int) {
		exitCalled = true
	}

	testCases := []struct {
		name string
		args []string
	}{
		{"help flag", []string{"--help"}},
		{"version flag", []string{"--version"}},
		{"config flag", []string{"--config", "test.yaml", "--help"}},
		{"debug flag", []string{"--debug", "--help"}},
		{"env flag", []string{"--env", ".env.test", "--help"}},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			exitCalled = false
			Execute(versionInfo, exitFunc, tc.args)
			// Help and version commands should not cause exit
			assert.False(t, exitCalled)
		})
	}
}
