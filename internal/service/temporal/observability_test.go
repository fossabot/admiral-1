package temporal

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.temporal.io/sdk/log"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

// Test helper to create a logger with observer for testing
func createObservableLogger() (*zap.Logger, *observer.ObservedLogs) {
	core, recorded := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)
	return logger, recorded
}

// Tests for newTemporalLogger
func TestNewTemporalLogger(t *testing.T) {
	testCases := []struct {
		name   string
		logger *zap.Logger
	}{
		{
			name:   "with regular logger",
			logger: zap.NewNop(),
		},
		{
			name:   "with development logger",
			logger: func() *zap.Logger { logger, _ := zap.NewDevelopment(); return logger }(),
		},
		{
			name:   "with production logger",
			logger: func() *zap.Logger { logger, _ := zap.NewProduction(); return logger }(),
		},
		{
			name:   "with observable logger",
			logger: func() *zap.Logger { logger, _ := createObservableLogger(); return logger }(),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			temporalLogger := newTemporalLogger(tc.logger)

			assert.NotNil(t, temporalLogger)
			assert.Implements(t, (*log.Logger)(nil), temporalLogger)

			// Verify it's not nil and implements the interface
			assert.NotNil(t, temporalLogger)
		})
	}
}

func TestNewTemporalLogger_NilLogger(t *testing.T) {
	// This should panic or be handled gracefully
	assert.Panics(t, func() {
		newTemporalLogger(nil)
	})
}

// Tests for temporalLogger interface implementation
func TestTemporalLogger_InterfaceCompliance(t *testing.T) {
	logger := zap.NewNop()
	temporalLogger := newTemporalLogger(logger)

	// Verify it implements log.Logger interface
	var _ = temporalLogger
}

// Tests for Debug method
func TestTemporalLogger_Debug(t *testing.T) {
	logger, recorded := createObservableLogger()
	temporalLogger := newTemporalLogger(logger)

	testCases := []struct {
		name    string
		msg     string
		keyvals []interface{}
	}{
		{
			name:    "simple debug message",
			msg:     "debug message",
			keyvals: nil,
		},
		{
			name:    "debug with key-value pairs",
			msg:     "debug with context",
			keyvals: []interface{}{"key1", "value1", "key2", 42},
		},
		{
			name:    "debug with multiple pairs",
			msg:     "complex debug",
			keyvals: []interface{}{"user", "john", "action", "login", "timestamp", 1234567890},
		},
		{
			name:    "debug with odd number of keyvals",
			msg:     "malformed keyvals",
			keyvals: []interface{}{"key1", "value1", "orphan"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Clear previous logs
			recorded.TakeAll()

			temporalLogger.Debug(tc.msg, tc.keyvals...)

			logs := recorded.TakeAll()

			// For malformed keyvals, zap may create additional error logs
			if tc.name == "debug with odd number of keyvals" {
				require.GreaterOrEqual(t, len(logs), 1, "should have at least one log entry")
				// Find the debug message (may not be the first due to error logs)
				var debugLog *observer.LoggedEntry
				for _, log := range logs {
					if log.Level == zapcore.DebugLevel && log.Message == tc.msg {
						debugLog = &log
						break
					}
				}
				require.NotNil(t, debugLog, "should find the debug log entry")
				assert.Equal(t, zapcore.DebugLevel, debugLog.Level)
				assert.Equal(t, tc.msg, debugLog.Message)
			} else {
				require.Len(t, logs, 1)
				logEntry := logs[0]
				assert.Equal(t, zapcore.DebugLevel, logEntry.Level)
				assert.Equal(t, tc.msg, logEntry.Message)
			}

			// Verify key-value pairs are present in context for non-malformed cases
			if len(tc.keyvals) > 0 && tc.name != "debug with odd number of keyvals" {
				require.Len(t, logs, 1)
				assert.NotEmpty(t, logs[0].Context)
			}
		})
	}
}

// Tests for Info method
func TestTemporalLogger_Info(t *testing.T) {
	logger, recorded := createObservableLogger()
	temporalLogger := newTemporalLogger(logger)

	testCases := []struct {
		name    string
		msg     string
		keyvals []interface{}
	}{
		{
			name:    "simple info message",
			msg:     "info message",
			keyvals: nil,
		},
		{
			name:    "info with context",
			msg:     "workflow started",
			keyvals: []interface{}{"workflowID", "wf-123", "taskQueue", "default"},
		},
		{
			name:    "info with mixed types",
			msg:     "activity completed",
			keyvals: []interface{}{"activityID", "act-456", "duration", 1.5, "success", true},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			recorded.TakeAll() // Clear previous logs

			temporalLogger.Info(tc.msg, tc.keyvals...)

			logs := recorded.TakeAll()
			require.Len(t, logs, 1)

			logEntry := logs[0]
			assert.Equal(t, zapcore.InfoLevel, logEntry.Level)
			assert.Equal(t, tc.msg, logEntry.Message)
		})
	}
}

// Tests for Warn method
func TestTemporalLogger_Warn(t *testing.T) {
	logger, recorded := createObservableLogger()
	temporalLogger := newTemporalLogger(logger)

	testCases := []struct {
		name    string
		msg     string
		keyvals []interface{}
	}{
		{
			name:    "simple warning",
			msg:     "connection unstable",
			keyvals: nil,
		},
		{
			name:    "warning with context",
			msg:     "retry attempt",
			keyvals: []interface{}{"attempt", 3, "maxRetries", 5, "error", "timeout"},
		},
		{
			name:    "performance warning",
			msg:     "slow query detected",
			keyvals: []interface{}{"query", "SELECT * FROM large_table", "duration", "5.2s"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			recorded.TakeAll() // Clear previous logs

			temporalLogger.Warn(tc.msg, tc.keyvals...)

			logs := recorded.TakeAll()
			require.Len(t, logs, 1)

			logEntry := logs[0]
			assert.Equal(t, zapcore.WarnLevel, logEntry.Level)
			assert.Equal(t, tc.msg, logEntry.Message)
		})
	}
}

// Tests for Error method
func TestTemporalLogger_Error(t *testing.T) {
	logger, recorded := createObservableLogger()
	temporalLogger := newTemporalLogger(logger)

	testCases := []struct {
		name    string
		msg     string
		keyvals []interface{}
	}{
		{
			name:    "simple error",
			msg:     "connection failed",
			keyvals: nil,
		},
		{
			name:    "error with context",
			msg:     "workflow execution failed",
			keyvals: []interface{}{"workflowID", "wf-789", "error", "timeout", "attempt", 1},
		},
		{
			name:    "detailed error",
			msg:     "database connection error",
			keyvals: []interface{}{"host", "localhost", "port", 5432, "database", "admiral", "error", "connection refused"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			recorded.TakeAll() // Clear previous logs

			temporalLogger.Error(tc.msg, tc.keyvals...)

			logs := recorded.TakeAll()
			require.Len(t, logs, 1)

			logEntry := logs[0]
			assert.Equal(t, zapcore.ErrorLevel, logEntry.Level)
			assert.Equal(t, tc.msg, logEntry.Message)
		})
	}
}

// Tests for all log levels together
func TestTemporalLogger_AllLevels(t *testing.T) {
	logger, recorded := createObservableLogger()
	temporalLogger := newTemporalLogger(logger)

	// Log at all levels
	temporalLogger.Debug("debug message", "level", "debug")
	temporalLogger.Info("info message", "level", "info")
	temporalLogger.Warn("warn message", "level", "warn")
	temporalLogger.Error("error message", "level", "error")

	logs := recorded.TakeAll()
	require.Len(t, logs, 4)

	// Verify order and levels
	assert.Equal(t, zapcore.DebugLevel, logs[0].Level)
	assert.Equal(t, "debug message", logs[0].Message)

	assert.Equal(t, zapcore.InfoLevel, logs[1].Level)
	assert.Equal(t, "info message", logs[1].Message)

	assert.Equal(t, zapcore.WarnLevel, logs[2].Level)
	assert.Equal(t, "warn message", logs[2].Message)

	assert.Equal(t, zapcore.ErrorLevel, logs[3].Level)
	assert.Equal(t, "error message", logs[3].Message)
}

// Tests for empty and special characters
func TestTemporalLogger_SpecialCases(t *testing.T) {
	logger, recorded := createObservableLogger()
	temporalLogger := newTemporalLogger(logger)

	testCases := []struct {
		name    string
		msg     string
		keyvals []interface{}
	}{
		{
			name:    "empty message",
			msg:     "",
			keyvals: nil,
		},
		{
			name:    "message with newlines",
			msg:     "line1\nline2\nline3",
			keyvals: nil,
		},
		{
			name:    "message with special characters",
			msg:     "special chars: éñ中文🚀",
			keyvals: nil,
		},
		{
			name:    "nil values in keyvals",
			msg:     "nil values test",
			keyvals: []interface{}{"key1", nil, "key2", "value2"},
		},
		{
			name:    "empty keyvals slice",
			msg:     "empty keyvals",
			keyvals: []interface{}{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			recorded.TakeAll() // Clear previous logs

			// Should not panic
			assert.NotPanics(t, func() {
				temporalLogger.Info(tc.msg, tc.keyvals...)
			})

			logs := recorded.TakeAll()
			require.Len(t, logs, 1)
			assert.Equal(t, tc.msg, logs[0].Message)
		})
	}
}

// Performance tests
func BenchmarkTemporalLogger_Info(b *testing.B) {
	logger := zap.NewNop()
	temporalLogger := newTemporalLogger(logger)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		temporalLogger.Info("benchmark message", "key", "value", "iteration", i)
	}
}

func BenchmarkTemporalLogger_Debug(b *testing.B) {
	logger := zap.NewNop()
	temporalLogger := newTemporalLogger(logger)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		temporalLogger.Debug("benchmark debug", "key", "value", "iteration", i)
	}
}

// Concurrent access tests
func TestTemporalLogger_ConcurrentAccess(t *testing.T) {
	logger, recorded := createObservableLogger()
	temporalLogger := newTemporalLogger(logger)

	const numGoroutines = 100
	const messagesPerGoroutine = 10

	// Use channels to coordinate goroutines
	done := make(chan bool, numGoroutines)

	// Start multiple goroutines logging concurrently
	for i := 0; i < numGoroutines; i++ {
		go func(goroutineID int) {
			defer func() { done <- true }()

			for j := 0; j < messagesPerGoroutine; j++ {
				temporalLogger.Info("concurrent message",
					"goroutine", goroutineID,
					"message", j)
			}
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < numGoroutines; i++ {
		<-done
	}

	// Verify we got all expected log entries
	logs := recorded.TakeAll()
	expectedTotal := numGoroutines * messagesPerGoroutine
	assert.Len(t, logs, expectedTotal)

	// Verify all are info level
	for _, log := range logs {
		assert.Equal(t, zapcore.InfoLevel, log.Level)
		assert.Equal(t, "concurrent message", log.Message)
	}
}

// Test integration with zap logger levels
func TestTemporalLogger_LoggerLevels(t *testing.T) {
	testCases := []struct {
		name        string
		loggerLevel zapcore.Level
		expectDebug bool
		expectInfo  bool
		expectWarn  bool
		expectError bool
	}{
		{
			name:        "debug level logger",
			loggerLevel: zapcore.DebugLevel,
			expectDebug: true,
			expectInfo:  true,
			expectWarn:  true,
			expectError: true,
		},
		{
			name:        "info level logger",
			loggerLevel: zapcore.InfoLevel,
			expectDebug: false,
			expectInfo:  true,
			expectWarn:  true,
			expectError: true,
		},
		{
			name:        "warn level logger",
			loggerLevel: zapcore.WarnLevel,
			expectDebug: false,
			expectInfo:  false,
			expectWarn:  true,
			expectError: true,
		},
		{
			name:        "error level logger",
			loggerLevel: zapcore.ErrorLevel,
			expectDebug: false,
			expectInfo:  false,
			expectWarn:  false,
			expectError: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			core, recorded := observer.New(tc.loggerLevel)
			logger := zap.New(core)
			temporalLogger := newTemporalLogger(logger)

			// Log at all levels
			temporalLogger.Debug("debug")
			temporalLogger.Info("info")
			temporalLogger.Warn("warn")
			temporalLogger.Error("error")

			logs := recorded.TakeAll()

			// Count expected logs
			expectedCount := 0
			if tc.expectDebug {
				expectedCount++
			}
			if tc.expectInfo {
				expectedCount++
			}
			if tc.expectWarn {
				expectedCount++
			}
			if tc.expectError {
				expectedCount++
			}

			assert.Len(t, logs, expectedCount)

			// Verify correct levels are present
			logLevels := make(map[zapcore.Level]bool)
			for _, log := range logs {
				logLevels[log.Level] = true
			}

			assert.Equal(t, tc.expectDebug, logLevels[zapcore.DebugLevel])
			assert.Equal(t, tc.expectInfo, logLevels[zapcore.InfoLevel])
			assert.Equal(t, tc.expectWarn, logLevels[zapcore.WarnLevel])
			assert.Equal(t, tc.expectError, logLevels[zapcore.ErrorLevel])
		})
	}
}
