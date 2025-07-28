package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestEnvironment(t *testing.T) {
	t.Run("struct fields with cluster", func(t *testing.T) {
		clusterId := uuid.New()
		namespace := "test-namespace"
		env := &Environment{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			ClusterId:     &clusterId,
			Name:          "production",
			Namespace:     &namespace,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, env.Id)
		assert.NotEqual(t, uuid.Nil, env.ApplicationId)
		assert.NotNil(t, env.ClusterId)
		assert.Equal(t, clusterId, *env.ClusterId)
		assert.Equal(t, "production", env.Name)
		assert.NotNil(t, env.Namespace)
		assert.Equal(t, namespace, *env.Namespace)
	})

	t.Run("struct fields without cluster", func(t *testing.T) {
		env := &Environment{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			ClusterId:     nil,
			Name:          "development",
			Namespace:     nil,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, env.Id)
		assert.NotEqual(t, uuid.Nil, env.ApplicationId)
		assert.Nil(t, env.ClusterId)
		assert.Equal(t, "development", env.Name)
		assert.Nil(t, env.Namespace)
	})

	t.Run("zero values", func(t *testing.T) {
		env := &Environment{}

		assert.Equal(t, uuid.Nil, env.Id)
		assert.Equal(t, uuid.Nil, env.ApplicationId)
		assert.Nil(t, env.ClusterId)
		assert.Equal(t, "", env.Name)
		assert.Nil(t, env.Namespace)
		assert.True(t, env.CreatedAt.IsZero())
		assert.True(t, env.UpdatedAt.IsZero())
	})

	t.Run("environment validation", func(t *testing.T) {
		env := &Environment{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			Name:          "valid-env-name",
		}
		assert.NotNil(t, env)
		assert.NotEmpty(t, env.Name)
		assert.NotEqual(t, uuid.Nil, env.Id)
		assert.NotEqual(t, uuid.Nil, env.ApplicationId)
	})

	t.Run("environment references application", func(t *testing.T) {
		appId := uuid.New()
		env := &Environment{
			ApplicationId: appId,
			Name:          "test-env",
		}

		assert.Equal(t, appId, env.ApplicationId)
		assert.NotEqual(t, uuid.Nil, env.ApplicationId)
	})
}

func TestConvertEnvironmentToProto(t *testing.T) {
	t.Run("environment with cluster and namespace", func(t *testing.T) {
		clusterId := uuid.New()
		namespace := "test-namespace"
		env := &Environment{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			ClusterId:     &clusterId,
			Name:          "production",
			Namespace:     &namespace,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		proto := ConvertEnvironmentToProto(env)

		require.NotNil(t, proto)
		assert.Equal(t, env.Id.String(), proto.Id)
		assert.Equal(t, env.ApplicationId.String(), proto.ApplicationId)
		assert.NotNil(t, proto.ClusterId)
		assert.Equal(t, clusterId.String(), *proto.ClusterId)
		assert.Equal(t, env.Name, proto.Name)
		assert.Equal(t, env.Namespace, proto.Namespace)
		assert.Equal(t, timestamppb.New(env.CreatedAt), proto.CreatedAt)
		assert.Equal(t, timestamppb.New(env.UpdatedAt), proto.UpdatedAt)
	})

	t.Run("environment without cluster and namespace", func(t *testing.T) {
		env := &Environment{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			ClusterId:     nil,
			Name:          "development",
			Namespace:     nil,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		proto := ConvertEnvironmentToProto(env)

		require.NotNil(t, proto)
		assert.Equal(t, env.Id.String(), proto.Id)
		assert.Equal(t, env.ApplicationId.String(), proto.ApplicationId)
		assert.Nil(t, proto.ClusterId)
		assert.Equal(t, env.Name, proto.Name)
		assert.Nil(t, proto.Namespace)
	})

	t.Run("empty environment name", func(t *testing.T) {
		env := &Environment{
			Id:            uuid.New(),
			ApplicationId: uuid.New(),
			Name:          "",
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		proto := ConvertEnvironmentToProto(env)

		require.NotNil(t, proto)
		assert.Equal(t, env.Id.String(), proto.Id)
		assert.Equal(t, env.ApplicationId.String(), proto.ApplicationId)
		assert.Equal(t, "", proto.Name)
		assert.Nil(t, proto.ClusterId)
		assert.Nil(t, proto.Namespace)
	})

	t.Run("nil environment", func(t *testing.T) {
		assert.Panics(t, func() {
			ConvertEnvironmentToProto(nil)
		})
	})
}

// Benchmark tests for performance
func BenchmarkConvertEnvironmentToProto(b *testing.B) {
	clusterId := uuid.New()
	namespace := "benchmark-namespace"
	env := &Environment{
		Id:            uuid.New(),
		ApplicationId: uuid.New(),
		ClusterId:     &clusterId,
		Name:          "benchmark-env",
		Namespace:     &namespace,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertEnvironmentToProto(env)
	}
}
