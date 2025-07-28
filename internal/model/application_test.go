package model

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestApplication(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		description := "Test application description"
		app := &Application{
			Id:          uuid.New(),
			Name:        "test-app",
			Description: &description,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, app.Id)
		assert.Equal(t, "test-app", app.Name)
		assert.NotNil(t, app.Description)
		assert.Equal(t, description, *app.Description)
		assert.False(t, app.CreatedAt.IsZero())
		assert.False(t, app.UpdatedAt.IsZero())
	})

	t.Run("nil description", func(t *testing.T) {
		app := &Application{
			Id:          uuid.New(),
			Name:        "test-app",
			Description: nil,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, app.Id)
		assert.Equal(t, "test-app", app.Name)
		assert.Nil(t, app.Description)
	})

	t.Run("zero values", func(t *testing.T) {
		app := &Application{}

		assert.Equal(t, uuid.Nil, app.Id)
		assert.Equal(t, "", app.Name)
		assert.Nil(t, app.Description)
		assert.True(t, app.CreatedAt.IsZero())
		assert.True(t, app.UpdatedAt.IsZero())
	})

	t.Run("application validation", func(t *testing.T) {
		app := &Application{
			Id:   uuid.New(),
			Name: "valid-app-name",
		}
		assert.NotNil(t, app)
		assert.NotEmpty(t, app.Name)
		assert.NotEqual(t, uuid.Nil, app.Id)
	})
}

func TestConvertApplicationToProto(t *testing.T) {
	t.Run("application with description", func(t *testing.T) {
		description := "Test description"
		app := &Application{
			Id:          uuid.New(),
			Name:        "test-app",
			Description: &description,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		proto := ConvertApplicationToProto(app)

		require.NotNil(t, proto)
		assert.Equal(t, app.Id.String(), proto.Id)
		assert.Equal(t, app.Name, proto.Name)
		assert.Equal(t, app.Description, proto.Description)
		assert.Equal(t, timestamppb.New(app.CreatedAt), proto.CreatedAt)
		assert.Equal(t, timestamppb.New(app.UpdatedAt), proto.UpdatedAt)
	})

	t.Run("application without description", func(t *testing.T) {
		app := &Application{
			Id:          uuid.New(),
			Name:        "test-app",
			Description: nil,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		proto := ConvertApplicationToProto(app)

		require.NotNil(t, proto)
		assert.Equal(t, app.Id.String(), proto.Id)
		assert.Equal(t, app.Name, proto.Name)
		assert.Nil(t, proto.Description)
	})

	t.Run("empty application name", func(t *testing.T) {
		app := &Application{
			Id:        uuid.New(),
			Name:      "",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		proto := ConvertApplicationToProto(app)

		require.NotNil(t, proto)
		assert.Equal(t, app.Id.String(), proto.Id)
		assert.Equal(t, "", proto.Name)
		assert.Nil(t, proto.Description)
	})

	t.Run("nil application", func(t *testing.T) {
		assert.Panics(t, func() {
			ConvertApplicationToProto(nil)
		})
	})
}

// Benchmark tests for performance
func BenchmarkConvertApplicationToProto(b *testing.B) {
	description := "Benchmark test application"
	app := &Application{
		Id:          uuid.New(),
		Name:        "benchmark-app",
		Description: &description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertApplicationToProto(app)
	}
}
