package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestVariable(t *testing.T) {
	t.Run("application-scoped variable", func(t *testing.T) {
		appId := uuid.New()
		description := "Test variable description"
		variable := &Variable{
			Id:            uuid.New(),
			ApplicationId: &appId,
			EnvironmentId: nil,
			Key:           "DATABASE_URL",
			Value:         "postgres://localhost:5432/db",
			Description:   &description,
			IsSensitive:   true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, variable.Id)
		assert.NotNil(t, variable.ApplicationId)
		assert.Equal(t, appId, *variable.ApplicationId)
		assert.Nil(t, variable.EnvironmentId)
		assert.Equal(t, "DATABASE_URL", variable.Key)
		assert.Equal(t, "postgres://localhost:5432/db", variable.Value)
		assert.NotNil(t, variable.Description)
		assert.Equal(t, description, *variable.Description)
		assert.True(t, variable.IsSensitive)
	})

	t.Run("environment-scoped variable", func(t *testing.T) {
		appId := uuid.New()
		envId := uuid.New()
		variable := &Variable{
			Id:            uuid.New(),
			ApplicationId: &appId,
			EnvironmentId: &envId,
			Key:           "API_KEY",
			Value:         "secret-api-key",
			Description:   nil,
			IsSensitive:   true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		assert.NotNil(t, variable.ApplicationId)
		assert.NotNil(t, variable.EnvironmentId)
		assert.Equal(t, envId, *variable.EnvironmentId)
		assert.Nil(t, variable.Description)
		assert.True(t, variable.IsSensitive)
	})

	t.Run("non-sensitive variable", func(t *testing.T) {
		variable := &Variable{
			Id:            uuid.New(),
			ApplicationId: nil,
			EnvironmentId: nil,
			Key:           "LOG_LEVEL",
			Value:         "info",
			Description:   nil,
			IsSensitive:   false,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		assert.Nil(t, variable.ApplicationId)
		assert.Nil(t, variable.EnvironmentId)
		assert.Equal(t, "LOG_LEVEL", variable.Key)
		assert.Equal(t, "info", variable.Value)
		assert.False(t, variable.IsSensitive)
	})

	t.Run("zero values", func(t *testing.T) {
		variable := &Variable{}

		assert.Equal(t, uuid.Nil, variable.Id)
		assert.Nil(t, variable.ApplicationId)
		assert.Nil(t, variable.EnvironmentId)
		assert.Equal(t, "", variable.Key)
		assert.Equal(t, "", variable.Value)
		assert.Nil(t, variable.Description)
		assert.False(t, variable.IsSensitive)
		assert.True(t, variable.CreatedAt.IsZero())
		assert.True(t, variable.UpdatedAt.IsZero())
	})

	t.Run("variable validation", func(t *testing.T) {
		variable := &Variable{
			Id:    uuid.New(),
			Key:   "VALID_KEY",
			Value: "some-value",
		}
		assert.NotNil(t, variable)
		assert.NotEmpty(t, variable.Key)
		assert.NotEmpty(t, variable.Value)
	})

	t.Run("variable references application and environment", func(t *testing.T) {
		appId := uuid.New()
		envId := uuid.New()
		variable := &Variable{
			ApplicationId: &appId,
			EnvironmentId: &envId,
			Key:           "TEST_KEY",
			Value:         "test-value",
		}

		assert.Equal(t, appId, *variable.ApplicationId)
		assert.Equal(t, envId, *variable.EnvironmentId)
	})
}

func TestConvertVariableToProto(t *testing.T) {
	t.Run("sensitive variable masks value", func(t *testing.T) {
		appId := uuid.New()
		envId := uuid.New()
		description := "Sensitive variable"
		variable := &Variable{
			Id:            uuid.New(),
			ApplicationId: &appId,
			EnvironmentId: &envId,
			Key:           "SECRET_KEY",
			Value:         "super-secret-value",
			Description:   &description,
			IsSensitive:   true,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		proto := ConvertVariableToProto(variable)

		require.NotNil(t, proto)
		assert.Equal(t, variable.Id.String(), proto.Id)
		assert.NotNil(t, proto.ApplicationId)
		assert.Equal(t, appId.String(), *proto.ApplicationId)
		assert.NotNil(t, proto.EnvironmentId)
		assert.Equal(t, envId.String(), *proto.EnvironmentId)
		assert.Equal(t, variable.Key, proto.Key)
		assert.Equal(t, "*****", proto.Value) // Value should be masked
		assert.Equal(t, variable.Description, proto.Description)
		assert.True(t, proto.IsSensitive)
		assert.Equal(t, timestamppb.New(variable.CreatedAt), proto.CreatedAt)
		assert.Equal(t, timestamppb.New(variable.UpdatedAt), proto.UpdatedAt)
	})

	t.Run("non-sensitive variable shows value", func(t *testing.T) {
		variable := &Variable{
			Id:            uuid.New(),
			ApplicationId: nil,
			EnvironmentId: nil,
			Key:           "LOG_LEVEL",
			Value:         "debug",
			Description:   nil,
			IsSensitive:   false,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		proto := ConvertVariableToProto(variable)

		require.NotNil(t, proto)
		assert.Equal(t, variable.Id.String(), proto.Id)
		assert.Nil(t, proto.ApplicationId)
		assert.Nil(t, proto.EnvironmentId)
		assert.Equal(t, variable.Key, proto.Key)
		assert.Equal(t, "debug", proto.Value) // Value should not be masked
		assert.Nil(t, proto.Description)
		assert.False(t, proto.IsSensitive)
	})

	t.Run("variable with empty key and value", func(t *testing.T) {
		variable := &Variable{
			Id:          uuid.New(),
			Key:         "",
			Value:       "",
			IsSensitive: false,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		proto := ConvertVariableToProto(variable)

		require.NotNil(t, proto)
		assert.Equal(t, variable.Id.String(), proto.Id)
		assert.Equal(t, "", proto.Key)
		assert.Equal(t, "", proto.Value)
		assert.False(t, proto.IsSensitive)
	})

	t.Run("nil variable", func(t *testing.T) {
		assert.Panics(t, func() {
			ConvertVariableToProto(nil)
		})
	})
}

// Benchmark tests for performance
func BenchmarkConvertVariableToProto(b *testing.B) {
	appId := uuid.New()
	envId := uuid.New()
	description := "Benchmark variable"
	variable := &Variable{
		Id:            uuid.New(),
		ApplicationId: &appId,
		EnvironmentId: &envId,
		Key:           "BENCHMARK_KEY",
		Value:         "benchmark-value",
		Description:   &description,
		IsSensitive:   false,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertVariableToProto(variable)
	}
}
