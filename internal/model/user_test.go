package model

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestUser(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		user := &User{
			Id:              uuid.New(),
			ProviderSubject: "provider-123",
			Email:           "test@example.com",
			EmailVerified:   true,
			Name:            "John Doe",
			GivenName:       "John",
			FamilyName:      "Doe",
			PictureUrl:      "https://example.com/avatar.jpg",
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, user.Id)
		assert.Equal(t, "provider-123", user.ProviderSubject)
		assert.Equal(t, "test@example.com", user.Email)
		assert.True(t, user.EmailVerified)
		assert.Equal(t, "John Doe", user.Name)
		assert.Equal(t, "John", user.GivenName)
		assert.Equal(t, "Doe", user.FamilyName)
		assert.Equal(t, "https://example.com/avatar.jpg", user.PictureUrl)
		assert.False(t, user.CreatedAt.IsZero())
		assert.False(t, user.UpdatedAt.IsZero())
	})

	t.Run("JSON marshaling and unmarshaling", func(t *testing.T) {
		original := &User{
			Id:              uuid.New(),
			ProviderSubject: "provider-123",
			Email:           "test@example.com",
			EmailVerified:   true,
			Name:            "John Doe",
			GivenName:       "John",
			FamilyName:      "Doe",
			PictureUrl:      "https://example.com/avatar.jpg",
			CreatedAt:       time.Now().Truncate(time.Second), // Truncate for JSON precision
			UpdatedAt:       time.Now().Truncate(time.Second),
		}

		data, err := json.Marshal(original)
		require.NoError(t, err)

		var unmarshaled User
		err = json.Unmarshal(data, &unmarshaled)
		require.NoError(t, err)

		assert.Equal(t, original.Id, unmarshaled.Id)
		assert.Equal(t, original.Email, unmarshaled.Email)
		assert.Equal(t, original.EmailVerified, unmarshaled.EmailVerified)
		assert.Equal(t, original.Name, unmarshaled.Name)
	})

	t.Run("zero values", func(t *testing.T) {
		user := &User{}

		assert.Equal(t, uuid.Nil, user.Id)
		assert.Equal(t, "", user.ProviderSubject)
		assert.Equal(t, "", user.Email)
		assert.False(t, user.EmailVerified)
		assert.Equal(t, "", user.Name)
		assert.True(t, user.CreatedAt.IsZero())
		assert.True(t, user.UpdatedAt.IsZero())
	})

	t.Run("database structure validation", func(t *testing.T) {
		// Test that the struct can be used with GORM
		// In a real test environment, this would connect to a test database
		user := &User{
			Id:              uuid.New(),
			ProviderSubject: "provider-123",
			Email:           "test@example.com",
			EmailVerified:   true,
			Name:            "John Doe",
			GivenName:       "John",
			FamilyName:      "Doe",
			PictureUrl:      "https://example.com/avatar.jpg",
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		// Verify struct is properly set up for GORM operations
		assert.NotNil(t, user)
		assert.NotEqual(t, uuid.Nil, user.Id)
		assert.NotEmpty(t, user.Email)

		// In a real integration test, we would test:
		// - Database constraints (email uniqueness, etc.)
		// - Foreign key relationships
		// - GORM hooks (BeforeCreate, BeforeUpdate, etc.)
		// - Soft delete functionality with DeletedAt
	})

	t.Run("user validation", func(t *testing.T) {
		// Test various field constraints
		user := &User{
			Id:    uuid.New(),
			Email: "test@example.com", // Should be valid email format in real app
		}
		assert.NotNil(t, user)
		assert.NotEqual(t, uuid.Nil, user.Id)
		assert.Contains(t, user.Email, "@")
	})
}

func TestConvertUserToProto(t *testing.T) {
	testCases := []struct {
		name string
		user *User
	}{
		{
			name: "complete user",
			user: &User{
				Id:            uuid.New(),
				Email:         "test@example.com",
				EmailVerified: true,
				Name:          "John Doe",
				GivenName:     "John",
				FamilyName:    "Doe",
				PictureUrl:    "https://example.com/avatar.jpg",
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			},
		},
		{
			name: "minimal user",
			user: &User{
				Id:        uuid.New(),
				Email:     "minimal@example.com",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		},
		{
			name: "user with empty optional fields",
			user: &User{
				Id:            uuid.New(),
				Email:         "empty@example.com",
				EmailVerified: false,
				Name:          "",
				GivenName:     "",
				FamilyName:    "",
				PictureUrl:    "",
				CreatedAt:     time.Now(),
				UpdatedAt:     time.Now(),
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			proto := ConvertUserToProto(tc.user)

			require.NotNil(t, proto)
			assert.Equal(t, tc.user.Id.String(), proto.Id)
			assert.Equal(t, tc.user.Email, proto.Email)
			assert.Equal(t, tc.user.EmailVerified, proto.EmailVerified)
			assert.Equal(t, tc.user.Name, proto.Name)
			assert.Equal(t, tc.user.GivenName, proto.GivenName)
			assert.Equal(t, tc.user.FamilyName, proto.FamilyName)
			assert.Equal(t, tc.user.PictureUrl, proto.PictureUrl)
			assert.Equal(t, timestamppb.New(tc.user.CreatedAt), proto.CreatedAt)
			assert.Equal(t, timestamppb.New(tc.user.UpdatedAt), proto.UpdatedAt)
		})
	}

	t.Run("nil user", func(t *testing.T) {
		// This should panic, but let's test it gracefully
		assert.Panics(t, func() {
			ConvertUserToProto(nil)
		})
	})
}

// Benchmark tests for performance
func BenchmarkConvertUserToProto(b *testing.B) {
	user := &User{
		Id:              uuid.New(),
		ProviderSubject: "provider-123",
		Email:           "test@example.com",
		EmailVerified:   true,
		Name:            "John Doe",
		GivenName:       "John",
		FamilyName:      "Doe",
		PictureUrl:      "https://example.com/avatar.jpg",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertUserToProto(user)
	}
}
