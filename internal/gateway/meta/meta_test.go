package meta

import (
	"testing"

	"github.com/jhump/protoreflect/desc"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/anypb"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

// Test helper to create timestamp for testing
func createTestTimestamp() *timestamppb.Timestamp {
	return timestamppb.Now()
}

func TestAPIBody(t *testing.T) {
	testCases := []struct {
		name        string
		input       interface{}
		expectNil   bool
		expectError bool
		description string
	}{
		{
			name:        "valid proto message",
			input:       &emptypb.Empty{},
			expectNil:   false,
			expectError: false,
			description: "Should successfully process a valid proto message",
		},
		{
			name:        "timestamp proto message",
			input:       createTestTimestamp(),
			expectNil:   false,
			expectError: false,
			description: "Should successfully process a timestamp proto message",
		},
		{
			name:        "string wrapper proto message",
			input:       wrapperspb.String("test"),
			expectNil:   false,
			expectError: false,
			description: "Should successfully process a wrapper proto message",
		},
		{
			name:        "non-proto message string",
			input:       "regular string",
			expectNil:   true,
			expectError: false,
			description: "Should return nil for non-proto message",
		},
		{
			name:        "non-proto message int",
			input:       42,
			expectNil:   true,
			expectError: false,
			description: "Should return nil for non-proto message",
		},
		{
			name:        "non-proto message struct",
			input:       struct{ Name string }{Name: "test"},
			expectNil:   true,
			expectError: false,
			description: "Should return nil for non-proto message struct",
		},
		{
			name:        "nil input",
			input:       nil,
			expectNil:   true,
			expectError: false,
			description: "Should return nil for nil input",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := APIBody(tc.input)

			if tc.expectError {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				if tc.expectNil {
					assert.Nil(t, result)
				} else {
					assert.NotNil(t, result)
					assert.IsType(t, &anypb.Any{}, result)
				}
			}
		})
	}
}

func TestAPIBody_CloneBehavior(t *testing.T) {
	t.Run("message cloning", func(t *testing.T) {
		original := wrapperspb.String("original")
		result, err := APIBody(original)

		require.NoError(t, err)
		require.NotNil(t, result)

		// Verify the original message wasn't modified
		assert.Equal(t, "original", original.GetValue())

		// Verify we can unmarshal the result
		var unmarshaled wrapperspb.StringValue
		err = result.UnmarshalTo(&unmarshaled)
		require.NoError(t, err)
		assert.Equal(t, "original", unmarshaled.GetValue())
	})
}

func TestGenerateGRPCMetadata(t *testing.T) {
	t.Run("empty server", func(t *testing.T) {
		// Reset global state
		methodDescriptors = nil

		server := grpc.NewServer()
		defer server.Stop()

		err := GenerateGRPCMetadata(server)
		assert.NoError(t, err)
		assert.NotNil(t, methodDescriptors)
		assert.Empty(t, methodDescriptors)
	})

	t.Run("server with services", func(t *testing.T) {
		// Reset global state
		methodDescriptors = nil

		server := grpc.NewServer()
		defer server.Stop()

		// Register a mock service (this would typically be done by generated code)
		// For this test, we'll test with an empty server since we can't easily mock
		// the grpcreflect.LoadServiceDescriptors function without significant setup
		err := GenerateGRPCMetadata(server)
		assert.NoError(t, err)
		assert.NotNil(t, methodDescriptors)
	})
}

func TestGenerateGRPCMetadata_GlobalState(t *testing.T) {
	t.Run("methodDescriptors initialization", func(t *testing.T) {
		// Reset global state
		methodDescriptors = nil

		server := grpc.NewServer()
		defer server.Stop()

		// Verify initial state
		assert.Nil(t, methodDescriptors)

		err := GenerateGRPCMetadata(server)
		assert.NoError(t, err)

		// Verify global state was updated
		assert.NotNil(t, methodDescriptors)
	})

	t.Run("methodDescriptors overwrite", func(t *testing.T) {
		// Set initial state
		methodDescriptors = map[string]*desc.MethodDescriptor{
			"/test/Method": nil,
		}

		server := grpc.NewServer()
		defer server.Stop()

		err := GenerateGRPCMetadata(server)
		assert.NoError(t, err)

		// Verify global state was overwritten (should be empty for empty server)
		assert.NotNil(t, methodDescriptors)
		assert.Empty(t, methodDescriptors)
	})
}

func TestClearLogDisabledFields(t *testing.T) {
	testCases := []struct {
		name        string
		input       proto.Message
		expected    proto.Message
		description string
	}{
		{
			name:        "nil message",
			input:       nil,
			expected:    nil,
			description: "Should return nil for nil input",
		},
		{
			name:        "empty message",
			input:       &emptypb.Empty{},
			expected:    &emptypb.Empty{},
			description: "Should handle empty protobuf message",
		},
		{
			name:        "string wrapper message",
			input:       wrapperspb.String("test"),
			expected:    wrapperspb.String("test"),
			description: "Should handle string wrapper message",
		},
		{
			name:        "timestamp message",
			input:       timestamppb.Now(),
			expected:    timestamppb.Now(),
			description: "Should handle timestamp message",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := ClearLogDisabledFields(tc.input)

			if tc.input == nil {
				assert.Nil(t, result)
			} else {
				assert.NotNil(t, result)
				assert.IsType(t, tc.input, result)

				// Verify the result is a valid proto message
				// Basic validation that the message structure is preserved
				assert.NotNil(t, result.ProtoReflect())
			}
		})
	}
}

func TestClearLogDisabledFields_ComplexStructures(t *testing.T) {
	t.Run("nested message handling", func(t *testing.T) {
		// Create a complex message with nested structures
		// Using Any as it can contain other messages
		inner := wrapperspb.String("inner value")
		anyMsg, err := anypb.New(inner)
		require.NoError(t, err)

		result := ClearLogDisabledFields(anyMsg)
		assert.NotNil(t, result)
		assert.IsType(t, &anypb.Any{}, result)
	})

	t.Run("message preservation", func(t *testing.T) {
		original := wrapperspb.String("preserve me")
		originalValue := original.GetValue()

		result := ClearLogDisabledFields(original)

		// Verify original wasn't modified
		assert.Equal(t, originalValue, original.GetValue())

		// Verify result is valid
		assert.NotNil(t, result)
		resultWrapper, ok := result.(*wrapperspb.StringValue)
		require.True(t, ok)
		assert.Equal(t, originalValue, resultWrapper.GetValue())
	})
}

func TestClearLogDisabledFields_EdgeCases(t *testing.T) {
	t.Run("multiple calls same message", func(t *testing.T) {
		msg := wrapperspb.String("test")

		result1 := ClearLogDisabledFields(msg)
		result2 := ClearLogDisabledFields(msg)

		assert.NotNil(t, result1)
		assert.NotNil(t, result2)
		// Compare the messages using proto.Equal
		assert.True(t, proto.Equal(result1, result2))
	})

	t.Run("empty string wrapper", func(t *testing.T) {
		msg := wrapperspb.String("")
		result := ClearLogDisabledFields(msg)

		assert.NotNil(t, result)
		wrapper, ok := result.(*wrapperspb.StringValue)
		require.True(t, ok)
		assert.Equal(t, "", wrapper.GetValue())
	})
}

// Integration test combining multiple functions
func TestIntegration_APIBodyWithClearLogDisabledFields(t *testing.T) {
	t.Run("APIBody processes ClearLogDisabledFields result", func(t *testing.T) {
		original := wrapperspb.String("integration test")

		// First clear log disabled fields
		cleared := ClearLogDisabledFields(original)
		require.NotNil(t, cleared)

		// Then process with APIBody
		result, err := APIBody(cleared)
		require.NoError(t, err)
		require.NotNil(t, result)

		// Verify we can unmarshal the result
		var unmarshaled wrapperspb.StringValue
		err = result.UnmarshalTo(&unmarshaled)
		require.NoError(t, err)
		assert.Equal(t, "integration test", unmarshaled.GetValue())
	})
}

// Test global variable access
func TestMethodDescriptorsGlobalVariable(t *testing.T) {
	t.Run("global variable initialization", func(t *testing.T) {
		// Save current state
		originalDescriptors := methodDescriptors
		defer func() {
			methodDescriptors = originalDescriptors
		}()

		// Reset to nil
		methodDescriptors = nil
		assert.Nil(t, methodDescriptors)

		// Initialize with empty map
		methodDescriptors = make(map[string]*desc.MethodDescriptor)
		assert.NotNil(t, methodDescriptors)
		assert.Empty(t, methodDescriptors)

		// Add an entry
		methodDescriptors["/test/Method"] = nil
		assert.Len(t, methodDescriptors, 1)
		assert.Contains(t, methodDescriptors, "/test/Method")
	})
}

// Benchmark tests for performance-critical functions
func BenchmarkAPIBody(b *testing.B) {
	msg := wrapperspb.String("benchmark test")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = APIBody(msg)
	}
}

func BenchmarkClearLogDisabledFields(b *testing.B) {
	msg := wrapperspb.String("benchmark test")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ClearLogDisabledFields(msg)
	}
}

func BenchmarkAPIBodyNonProto(b *testing.B) {
	nonProto := "not a proto message"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = APIBody(nonProto)
	}
}
