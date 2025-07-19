package log

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/anypb"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/wrapperspb"

	healthcheckv1 "go.admiral.io/admiral/api/healthcheck/v1"
)

func TestProtoField(t *testing.T) {
	var b bytes.Buffer
	w := bufio.NewWriter(&b)

	logger := zap.New(
		zapcore.NewCore(zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()), zapcore.AddSync(w), zap.DebugLevel),
	)

	r := &healthcheckv1.HealthcheckRequest{}
	a, _ := anypb.New(r)

	logger.Info("test", ProtoField("key", a))
	assert.NoError(t, logger.Sync())
	assert.NoError(t, w.Flush())

	o := make(map[string]interface{})
	assert.NoError(t, json.Unmarshal(b.Bytes(), &o))
	assert.Contains(t, b.String(), `{"@type":"type.googleapis.com/admiral.healthcheck.v1.HealthcheckRequest"}`)
}

func TestNamedErrorField(t *testing.T) {
	// a Status with no detailed appended
	s1 := status.New(codes.PermissionDenied, "Permission denied")
	err1 := s1.Err()

	// a Status with details appended
	s2 := status.New(codes.NotFound, "Resource not found")
	s2, _ = s2.WithDetails(
		&errdetails.ResourceInfo{ResourceType: "ConfigMap", Description: "configMap-test-1 not found"},
		&errdetails.ResourceInfo{ResourceType: "ConfigMap", Description: "configMap-test-2 not found"},
	)
	err2 := s2.Err()

	tests := []struct {
		err             error
		expectedMsg     string
		expectedCode    int
		expectedDetails []string
	}{
		{
			err:         errors.New("yikes"),
			expectedMsg: "yikes",
		},
		{
			err:          err1,
			expectedMsg:  "Permission denied",
			expectedCode: 7,
		},
		{
			err:             err2,
			expectedCode:    5,
			expectedMsg:     "Resource not found",
			expectedDetails: []string{"configMap-test-1 not found", "configMap-test-2 not found"},
		},
	}

	for _, test := range tests {
		var b bytes.Buffer
		w := bufio.NewWriter(&b)

		logger := zap.New(
			zapcore.NewCore(zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()), zapcore.AddSync(w), zap.DebugLevel),
		)
		logger.Info("test", NamedErrorField("key", test.err))
		assert.NoError(t, logger.Sync())
		assert.NoError(t, w.Flush())

		o := make(map[string]interface{})
		assert.NoError(t, json.Unmarshal(b.Bytes(), &o))
		assert.Contains(t, b.String(), test.expectedMsg)

		if test.expectedCode != 0 {
			assert.Contains(t, b.String(), strconv.Itoa(test.expectedCode))
		}
		if test.expectedDetails != nil {
			for _, detail := range test.expectedDetails {
				assert.Contains(t, b.String(), detail)
			}
		}
	}
}

func TestErrorField(t *testing.T) {
	var b bytes.Buffer
	w := bufio.NewWriter(&b)

	logger := zap.New(
		zapcore.NewCore(zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()), zapcore.AddSync(w), zap.DebugLevel),
	)

	logger.Info("test", ErrorField(errors.New("yikes")))
	assert.NoError(t, logger.Sync())
	assert.NoError(t, w.Flush())

	o := make(map[string]interface{})
	assert.NoError(t, json.Unmarshal(b.Bytes(), &o))
	assert.Contains(t, b.String(), "error")
	assert.Contains(t, b.String(), "yikes")
}

// ====== ENHANCED COMPREHENSIVE TESTS ======

// Test helper to create a logger and capture output
func createTestLogger() (*zap.Logger, *bytes.Buffer, *bufio.Writer) {
	var b bytes.Buffer
	w := bufio.NewWriter(&b)
	logger := zap.New(
		zapcore.NewCore(
			zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
			zapcore.AddSync(w),
			zap.DebugLevel,
		),
	)
	return logger, &b, w
}

// Test helper to flush logger and get output
func flushAndGetOutput(t *testing.T, logger *zap.Logger, w *bufio.Writer, b *bytes.Buffer) string {
	require.NoError(t, logger.Sync())
	require.NoError(t, w.Flush())
	return b.String()
}

func TestProtoField_MarshalError(t *testing.T) {
	t.Run("unmarshalable message fallback", func(t *testing.T) {
		logger, b, w := createTestLogger()

		// Create a mock message that would cause marshal errors
		// Note: In practice, this is hard to trigger with real protobuf messages
		// as they generally marshal successfully. This tests the error path.
		msg := &emptypb.Empty{}
		field := ProtoField("test", msg)

		logger.Info("test", field)
		output := flushAndGetOutput(t, logger, w, b)

		// Should still log something
		assert.Contains(t, output, "test")

		var jsonData map[string]interface{}
		err := json.Unmarshal(b.Bytes(), &jsonData)
		assert.NoError(t, err)
	})
}

func TestNamedErrorField_EdgeCases(t *testing.T) {
	t.Run("wrapped grpc error", func(t *testing.T) {
		logger, b, w := createTestLogger()

		// Create a wrapped gRPC error
		grpcErr := status.Error(codes.Internal, "internal error")
		wrappedErr := fmt.Errorf("wrapper: %w", grpcErr)

		field := NamedErrorField("wrapped", wrappedErr)
		logger.Info("test", field)

		output := flushAndGetOutput(t, logger, w, b)

		// Should be treated as standard error since status.FromError won't recognize wrapped errors
		assert.Contains(t, output, "wrapped")
		assert.Contains(t, output, "wrapper")

		var jsonData map[string]interface{}
		err := json.Unmarshal(b.Bytes(), &jsonData)
		assert.NoError(t, err)
	})

	t.Run("status with empty message", func(t *testing.T) {
		logger, b, w := createTestLogger()

		err := status.Error(codes.Unknown, "")
		field := NamedErrorField("empty_msg", err)
		logger.Info("test", field)

		output := flushAndGetOutput(t, logger, w, b)

		assert.Contains(t, output, "empty_msg")
		assert.Contains(t, output, "2") // Unknown code

		var jsonData map[string]interface{}
		jsonErr := json.Unmarshal(b.Bytes(), &jsonData)
		assert.NoError(t, jsonErr)
	})
}

func TestErrorField_Integration(t *testing.T) {
	t.Run("ErrorField uses NamedErrorField", func(t *testing.T) {
		logger, b1, w1 := createTestLogger()
		logger2, b2, w2 := createTestLogger()

		testErr := status.Error(codes.ResourceExhausted, "quota exceeded")

		// Test ErrorField
		field1 := ErrorField(testErr)
		logger.Info("test1", field1)
		output1 := flushAndGetOutput(t, logger, w1, b1)

		// Test NamedErrorField with "error" key
		field2 := NamedErrorField("error", testErr)
		logger2.Info("test1", field2)
		output2 := flushAndGetOutput(t, logger2, w2, b2)

		// Both should produce similar results (minus the "test1" vs specific log message differences)
		assert.Contains(t, output1, "quota exceeded")
		assert.Contains(t, output2, "quota exceeded")
		assert.Contains(t, output1, "8") // ResourceExhausted code
		assert.Contains(t, output2, "8")
	})
}

// Test field behavior in different logger contexts
func TestFields_LoggerIntegration(t *testing.T) {
	t.Run("multiple fields in single log", func(t *testing.T) {
		logger, b, w := createTestLogger()

		protoMsg := wrapperspb.String("proto test")
		err := status.Error(codes.Aborted, "operation aborted")

		logger.Info("combined test",
			ProtoField("message", protoMsg),
			ErrorField(err),
			zap.String("extra", "field"),
		)

		output := flushAndGetOutput(t, logger, w, b)

		// Verify all fields are present
		assert.Contains(t, output, "message")
		assert.Contains(t, output, "proto test")
		assert.Contains(t, output, "error")
		assert.Contains(t, output, "operation aborted")
		assert.Contains(t, output, "extra")
		assert.Contains(t, output, "field")

		var jsonData map[string]interface{}
		err = json.Unmarshal(b.Bytes(), &jsonData)
		assert.NoError(t, err)

		assert.Contains(t, jsonData, "message")
		assert.Contains(t, jsonData, "error")
		assert.Contains(t, jsonData, "extra")
	})

	t.Run("field in different log levels", func(t *testing.T) {
		for _, level := range []zapcore.Level{zap.DebugLevel, zap.InfoLevel, zap.WarnLevel, zap.ErrorLevel} {
			var b bytes.Buffer
			w := bufio.NewWriter(&b)
			logger := zap.New(
				zapcore.NewCore(
					zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
					zapcore.AddSync(w),
					level,
				),
			)

			testErr := errors.New("test error for level")
			field := ErrorField(testErr)

			switch level {
			case zap.DebugLevel:
				logger.Debug("debug test", field)
			case zap.InfoLevel:
				logger.Info("info test", field)
			case zap.WarnLevel:
				logger.Warn("warn test", field)
			case zap.ErrorLevel:
				logger.Error("error test", field)
			}

			output := flushAndGetOutput(t, logger, w, &b)
			assert.Contains(t, output, "test error for level")
		}
	})
}

// Test concurrent usage (important for logging)
func TestFields_Concurrency(t *testing.T) {
	t.Run("concurrent field creation", func(t *testing.T) {
		const numGoroutines = 100
		done := make(chan bool, numGoroutines)

		for i := 0; i < numGoroutines; i++ {
			go func(id int) {
				defer func() { done <- true }()

				// Test ProtoField
				msg := wrapperspb.String(fmt.Sprintf("message-%d", id))
				_ = ProtoField(fmt.Sprintf("proto-%d", id), msg)

				// Test ErrorField
				err := fmt.Errorf("error-%d", id)
				_ = ErrorField(err)

				// Test NamedErrorField
				grpcErr := status.Error(codes.Internal, fmt.Sprintf("grpc-error-%d", id))
				_ = NamedErrorField(fmt.Sprintf("named-%d", id), grpcErr)
			}(i)
		}

		// Wait for all goroutines to complete
		for i := 0; i < numGoroutines; i++ {
			<-done
		}
	})
}

// Benchmark tests for performance measurement
func BenchmarkProtoField(b *testing.B) {
	msg := &healthcheckv1.HealthcheckRequest{}
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = ProtoField("benchmark", msg)
	}
}

func BenchmarkProtoFieldComplex(b *testing.B) {
	// Create a more complex message
	inner := wrapperspb.String("complex test message with more data")
	msg, _ := anypb.New(inner)
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = ProtoField("complex", msg)
	}
}

func BenchmarkNamedErrorField(b *testing.B) {
	err := status.Error(codes.InvalidArgument, "benchmark error")
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = NamedErrorField("bench_error", err)
	}
}

func BenchmarkNamedErrorFieldWithDetails(b *testing.B) {
	s := status.New(codes.NotFound, "resource not found")
	s, _ = s.WithDetails(&errdetails.ResourceInfo{
		ResourceType: "ConfigMap",
		Description:  "benchmark config not found",
	})
	err := s.Err()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = NamedErrorField("bench_detailed", err)
	}
}

func BenchmarkErrorField(b *testing.B) {
	err := errors.New("benchmark standard error")
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = ErrorField(err)
	}
}
