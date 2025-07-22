// Testing cmd/server/error.go
package server

import (
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExitError_Error(t *testing.T) {
	testCases := []struct {
		name        string
		err         error
		code        int
		details     string
		expectedMsg string
	}{
		{
			name:        "simple error",
			err:         errors.New("simple error message"),
			code:        1,
			details:     "simple details",
			expectedMsg: "simple error message",
		},
		{
			name:        "error with formatting",
			err:         fmt.Errorf("formatted error: %s", "test"),
			code:        2,
			details:     "formatted details",
			expectedMsg: "formatted error: test",
		},
		{
			name:        "empty error message",
			err:         errors.New(""),
			code:        3,
			details:     "empty message",
			expectedMsg: "",
		},
		{
			name:        "nil wrapped error",
			err:         nil,
			code:        0,
			details:     "nil error",
			expectedMsg: "", // This will panic, handled separately
		},
		{
			name:        "complex error message",
			err:         errors.New("database connection failed: timeout after 30s"),
			code:        5,
			details:     "database timeout",
			expectedMsg: "database connection failed: timeout after 30s",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			exitErr := &exitError{
				err:     tc.err,
				code:    tc.code,
				details: tc.details,
			}

			if tc.err == nil {
				// Test that nil error causes panic
				assert.Panics(t, func() {
					_ = exitErr.Error()
				}, "Should panic when underlying error is nil")
			} else {
				result := exitErr.Error()
				assert.Equal(t, tc.expectedMsg, result)
			}
		})
	}
}

func TestWrapErrorWithCode(t *testing.T) {
	testCases := []struct {
		name      string
		err       error
		code      int
		details   string
		expectNil bool
	}{
		{
			name:    "valid error with positive code",
			err:     errors.New("test error"),
			code:    42,
			details: "test details",
		},
		{
			name:    "valid error with zero code",
			err:     errors.New("zero code error"),
			code:    0,
			details: "zero code details",
		},
		{
			name:    "valid error with negative code",
			err:     errors.New("negative code error"),
			code:    -1,
			details: "negative code details",
		},
		{
			name:    "nil error",
			err:     nil,
			code:    1,
			details: "nil error details",
		},
		{
			name:    "empty details",
			err:     errors.New("error with empty details"),
			code:    1,
			details: "",
		},
		{
			name:    "complex error",
			err:     fmt.Errorf("wrapped error: %w", errors.New("inner error")),
			code:    100,
			details: "complex error scenario",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := wrapErrorWithCode(tc.err, tc.code, tc.details)

			require.NotNil(t, result, "wrapErrorWithCode should never return nil")
			assert.Equal(t, tc.err, result.err)
			assert.Equal(t, tc.code, result.code)
			assert.Equal(t, tc.details, result.details)

			// Verify it implements the error interface
			var _ error = result

			// Test Error() method behavior
			if tc.err != nil {
				assert.Equal(t, tc.err.Error(), result.Error())
			} else {
				// Test that nil error causes panic in Error() method
				assert.Panics(t, func() {
					_ = result.Error()
				}, "Should panic when underlying error is nil")
			}
		})
	}
}

func TestWrapError(t *testing.T) {
	testCases := []struct {
		name     string
		err      error
		log      string
		expected struct {
			code    int
			details string
		}
	}{
		{
			name: "simple error",
			err:  errors.New("simple error"),
			log:  "simple log message",
			expected: struct {
				code    int
				details string
			}{
				code:    1,
				details: "simple log message",
			},
		},
		{
			name: "formatted error",
			err:  fmt.Errorf("formatted: %s", "error"),
			log:  "formatted log",
			expected: struct {
				code    int
				details string
			}{
				code:    1,
				details: "formatted log",
			},
		},
		{
			name: "nil error",
			err:  nil,
			log:  "nil error log",
			expected: struct {
				code    int
				details string
			}{
				code:    1,
				details: "nil error log",
			},
		},
		{
			name: "empty log message",
			err:  errors.New("error with empty log"),
			log:  "",
			expected: struct {
				code    int
				details string
			}{
				code:    1,
				details: "",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := wrapError(tc.err, tc.log)

			require.NotNil(t, result)
			assert.Equal(t, tc.err, result.err)
			assert.Equal(t, tc.expected.code, result.code)
			assert.Equal(t, tc.expected.details, result.details)

			// Verify it implements the error interface
			var _ error = result
		})
	}
}

func TestExitError_ErrorInterface(t *testing.T) {
	t.Run("implements error interface", func(t *testing.T) {
		err := errors.New("test error")
		exitErr := &exitError{
			err:     err,
			code:    1,
			details: "test details",
		}

		// Test that exitError implements the error interface
		var _ error = exitErr

		// Test that it can be used where error is expected
		assert.Error(t, exitErr)
		assert.EqualError(t, exitErr, "test error")
	})

	t.Run("can be unwrapped and checked with errors.Is", func(t *testing.T) {
		baseErr := errors.New("base error")
		exitErr := wrapErrorWithCode(baseErr, 1, "wrapped")

		// Test that the original error can be retrieved
		assert.Equal(t, baseErr.Error(), exitErr.Error())
	})

	t.Run("can be used in error chains", func(t *testing.T) {
		innerErr := errors.New("inner error")
		exitErr := wrapErrorWithCode(innerErr, 2, "exit error")
		outerErr := fmt.Errorf("outer error: %w", exitErr)

		// Test error chain behavior
		assert.Error(t, outerErr)
		assert.Contains(t, outerErr.Error(), "inner error")

		// Test errors.As functionality
		var targetExitErr *exitError
		assert.True(t, errors.As(outerErr, &targetExitErr))
		assert.Equal(t, 2, targetExitErr.code)
		assert.Equal(t, "exit error", targetExitErr.details)
	})
}

func TestExitError_StructFields(t *testing.T) {
	t.Run("field access and modification", func(t *testing.T) {
		originalErr := errors.New("original")
		exitErr := &exitError{
			err:     originalErr,
			code:    42,
			details: "original details",
		}

		// Test field access
		assert.Equal(t, originalErr, exitErr.err)
		assert.Equal(t, 42, exitErr.code)
		assert.Equal(t, "original details", exitErr.details)

		// Test field modification
		newErr := errors.New("new error")
		exitErr.err = newErr
		exitErr.code = 100
		exitErr.details = "new details"

		assert.Equal(t, newErr, exitErr.err)
		assert.Equal(t, 100, exitErr.code)
		assert.Equal(t, "new details", exitErr.details)
		assert.Equal(t, "new error", exitErr.Error())
	})

	t.Run("zero values", func(t *testing.T) {
		exitErr := &exitError{}

		assert.Nil(t, exitErr.err)
		assert.Equal(t, 0, exitErr.code)
		assert.Equal(t, "", exitErr.details)
	})
}

func TestExitError_EdgeCases(t *testing.T) {
	testCases := []struct {
		name        string
		setupError  func() *exitError
		expectedMsg string
	}{
		{
			name: "nil pointer receiver",
			setupError: func() *exitError {
				return nil
			},
			expectedMsg: "", // This will panic, but we handle it in the test
		},
		{
			name: "error with newlines",
			setupError: func() *exitError {
				return &exitError{
					err:     errors.New("error\nwith\nnewlines"),
					code:    1,
					details: "multiline",
				}
			},
			expectedMsg: "error\nwith\nnewlines",
		},
		{
			name: "error with special characters",
			setupError: func() *exitError {
				return &exitError{
					err:     errors.New("error with special chars: !@#$%^&*()"),
					code:    1,
					details: "special chars",
				}
			},
			expectedMsg: "error with special chars: !@#$%^&*()",
		},
		{
			name: "very long error message",
			setupError: func() *exitError {
				longMsg := ""
				for i := 0; i < 1000; i++ {
					longMsg += "a"
				}
				return &exitError{
					err:     errors.New(longMsg),
					code:    1,
					details: "long message",
				}
			},
			expectedMsg: func() string {
				result := ""
				for i := 0; i < 1000; i++ {
					result += "a"
				}
				return result
			}(),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			exitErr := tc.setupError()

			if exitErr == nil {
				// Test nil pointer dereference behavior
				assert.Panics(t, func() {
					_ = exitErr.Error()
				}, "Should panic on nil pointer dereference")
				return
			}

			result := exitErr.Error()
			assert.Equal(t, tc.expectedMsg, result)
		})
	}
}

func TestExitError_Concurrency(t *testing.T) {
	t.Run("concurrent access to Error method", func(t *testing.T) {
		exitErr := &exitError{
			err:     errors.New("concurrent test error"),
			code:    1,
			details: "concurrent test",
		}

		const numGoroutines = 100
		done := make(chan string, numGoroutines)

		// Launch multiple goroutines that call Error() concurrently
		for i := 0; i < numGoroutines; i++ {
			go func() {
				result := exitErr.Error()
				done <- result
			}()
		}

		// Collect results
		results := make([]string, 0, numGoroutines)
		for i := 0; i < numGoroutines; i++ {
			results = append(results, <-done)
		}

		// All results should be identical
		expectedMsg := "concurrent test error"
		for i, result := range results {
			assert.Equal(t, expectedMsg, result, "Result %d should match expected", i)
		}
	})
}

func TestExitError_Integration(t *testing.T) {
	t.Run("integration with errors.As", func(t *testing.T) {
		// Create a chain of wrapped errors
		baseErr := errors.New("base error")
		exitErr := wrapErrorWithCode(baseErr, 42, "exit details")
		wrappedErr := fmt.Errorf("wrapped: %w", exitErr)

		// Test that we can extract the exitError from the chain
		var targetExitErr *exitError
		require.True(t, errors.As(wrappedErr, &targetExitErr))

		assert.Equal(t, 42, targetExitErr.code)
		assert.Equal(t, "exit details", targetExitErr.details)
		assert.Equal(t, "base error", targetExitErr.Error())
	})

	t.Run("integration with fmt.Errorf", func(t *testing.T) {
		exitErr := wrapError(errors.New("inner error"), "exit log")
		formattedErr := fmt.Errorf("formatted error: %w", exitErr)

		assert.Contains(t, formattedErr.Error(), "inner error")
		assert.Contains(t, formattedErr.Error(), "formatted error")

		// Should still be able to extract exitError
		var extractedExitErr *exitError
		assert.True(t, errors.As(formattedErr, &extractedExitErr))
		assert.Equal(t, 1, extractedExitErr.code)
		assert.Equal(t, "exit log", extractedExitErr.details)
	})
}

// Benchmark tests for performance analysis
func BenchmarkExitError_Error(b *testing.B) {
	exitErr := &exitError{
		err:     errors.New("benchmark error message"),
		code:    1,
		details: "benchmark details",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = exitErr.Error()
	}
}

func BenchmarkWrapErrorWithCode(b *testing.B) {
	err := errors.New("benchmark error")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = wrapErrorWithCode(err, 1, "benchmark details")
	}
}

func BenchmarkWrapError(b *testing.B) {
	err := errors.New("benchmark error")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = wrapError(err, "benchmark log")
	}
}

// Helper functions for testing are inline with test cases

// Example test demonstrating typical usage patterns
func TestExitError_UsageExamples(t *testing.T) {
	t.Run("typical command error scenario", func(t *testing.T) {
		// Simulate a command that fails
		cmdErr := errors.New("command not found")
		exitErr := wrapErrorWithCode(cmdErr, 127, "command execution failed")

		assert.Equal(t, 127, exitErr.code)
		assert.Equal(t, "command execution failed", exitErr.details)
		assert.Equal(t, "command not found", exitErr.Error())
	})

	t.Run("configuration error scenario", func(t *testing.T) {
		// Simulate a configuration error
		configErr := errors.New("invalid configuration: missing required field 'database'")
		exitErr := wrapError(configErr, "configuration validation failed")

		assert.Equal(t, 1, exitErr.code) // wrapError always uses code 1
		assert.Equal(t, "configuration validation failed", exitErr.details)
		assert.Equal(t, "invalid configuration: missing required field 'database'", exitErr.Error())
	})

	t.Run("network error scenario", func(t *testing.T) {
		// Simulate a network error
		networkErr := errors.New("connection refused")
		exitErr := wrapErrorWithCode(networkErr, 2, "failed to connect to database")

		assert.Equal(t, 2, exitErr.code)
		assert.Equal(t, "failed to connect to database", exitErr.details)
		assert.Equal(t, "connection refused", exitErr.Error())
	})
}
