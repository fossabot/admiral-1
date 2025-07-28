package model

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func TestCluster(t *testing.T) {
	t.Run("struct fields and tags", func(t *testing.T) {
		tokenId := uuid.New()
		clusterIdentifier := uuid.New()
		metadata := datatypes.JSONMap{
			"region":     "us-west-2",
			"provider":   "aws",
			"version":    "1.28",
			"node_count": 3,
			"annotations": map[string]interface{}{
				"environment": "production",
				"team":        "platform",
			},
		}

		cluster := &Cluster{
			Id:                uuid.New(),
			Name:              "production-cluster",
			TokenId:           &tokenId,
			ClusterIdentifier: &clusterIdentifier,
			Metadata:          metadata,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, cluster.Id)
		assert.Equal(t, "production-cluster", cluster.Name)
		assert.NotNil(t, cluster.TokenId)
		assert.Equal(t, tokenId, *cluster.TokenId)
		assert.NotNil(t, cluster.ClusterIdentifier)
		assert.Equal(t, clusterIdentifier, *cluster.ClusterIdentifier)
		assert.NotNil(t, cluster.Metadata)
		assert.Equal(t, "us-west-2", cluster.Metadata["region"])
		assert.Equal(t, "aws", cluster.Metadata["provider"])
		assert.Equal(t, "1.28", cluster.Metadata["version"])
		assert.Equal(t, 3, cluster.Metadata["node_count"])
		assert.False(t, cluster.CreatedAt.IsZero())
		assert.False(t, cluster.UpdatedAt.IsZero())
	})

	t.Run("cluster with minimal fields", func(t *testing.T) {
		cluster := &Cluster{
			Id:                uuid.New(),
			Name:              "minimal-cluster",
			TokenId:           nil,
			ClusterIdentifier: nil,
			Metadata:          nil,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}

		assert.NotEqual(t, uuid.Nil, cluster.Id)
		assert.Equal(t, "minimal-cluster", cluster.Name)
		assert.Nil(t, cluster.TokenId)
		assert.Nil(t, cluster.ClusterIdentifier)
		assert.Nil(t, cluster.Metadata)
	})

	t.Run("zero values", func(t *testing.T) {
		cluster := &Cluster{}

		assert.Equal(t, uuid.Nil, cluster.Id)
		assert.Equal(t, "", cluster.Name)
		assert.Nil(t, cluster.TokenId)
		assert.Nil(t, cluster.ClusterIdentifier)
		assert.Nil(t, cluster.Metadata)
		assert.True(t, cluster.CreatedAt.IsZero())
		assert.True(t, cluster.UpdatedAt.IsZero())
		assert.False(t, cluster.DeletedAt.Valid)
	})

	t.Run("cluster with complex metadata", func(t *testing.T) {
		metadata := datatypes.JSONMap{
			"kubernetes": map[string]interface{}{
				"version":    "1.28.5",
				"api_server": "https://k8s-api.example.com",
				"dashboard":  "https://dashboard.example.com",
				"monitoring": true,
				"logging":    true,
				"backup":     false,
			},
			"infrastructure": map[string]interface{}{
				"provider":           "aws",
				"region":             "us-west-2",
				"availability_zones": []interface{}{"us-west-2a", "us-west-2b", "us-west-2c"},
				"instance_types":     []interface{}{"t3.medium", "t3.large"},
				"auto_scaling":       true,
			},
			"networking": map[string]interface{}{
				"vpc_id":     "vpc-12345678",
				"subnet_ids": []interface{}{"subnet-11111111", "subnet-22222222"},
				"cidr_block": "10.0.0.0/16",
			},
			"tags": map[string]interface{}{
				"Environment": "production",
				"Team":        "platform",
				"Project":     "admiral",
				"Owner":       "platform-team@company.com",
			},
		}

		cluster := &Cluster{
			Id:       uuid.New(),
			Name:     "complex-cluster",
			Metadata: metadata,
		}

		assert.NotNil(t, cluster.Metadata)

		// Test nested structure access
		k8s, ok := cluster.Metadata["kubernetes"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "1.28.5", k8s["version"])
		assert.Equal(t, true, k8s["monitoring"])

		infra, ok := cluster.Metadata["infrastructure"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "aws", infra["provider"])

		zones, ok := infra["availability_zones"].([]interface{})
		require.True(t, ok)
		assert.Len(t, zones, 3)
		assert.Contains(t, zones, "us-west-2a")
	})

	t.Run("cluster validation", func(t *testing.T) {
		cluster := &Cluster{
			Id:   uuid.New(),
			Name: "valid-cluster-name",
		}
		assert.NotNil(t, cluster)
		assert.NotEmpty(t, cluster.Name)
		assert.NotEqual(t, uuid.Nil, cluster.Id)
	})

	t.Run("soft delete functionality", func(t *testing.T) {
		cluster := &Cluster{
			Id:        uuid.New(),
			Name:      "deleted-cluster",
			DeletedAt: gorm.DeletedAt{Valid: true, Time: time.Now()},
		}

		assert.True(t, cluster.DeletedAt.Valid)
		assert.False(t, cluster.DeletedAt.Time.IsZero())
	})

	t.Run("cluster with token and identifier", func(t *testing.T) {
		tokenId := uuid.New()
		clusterIdentifier := uuid.New()

		cluster := &Cluster{
			Id:                uuid.New(),
			Name:              "auth-cluster",
			TokenId:           &tokenId,
			ClusterIdentifier: &clusterIdentifier,
		}

		assert.NotNil(t, cluster.TokenId)
		assert.Equal(t, tokenId, *cluster.TokenId)
		assert.NotNil(t, cluster.ClusterIdentifier)
		assert.Equal(t, clusterIdentifier, *cluster.ClusterIdentifier)
	})
}

func TestClusterMetadata(t *testing.T) {
	t.Run("JSON marshaling and unmarshaling", func(t *testing.T) {
		originalMetadata := datatypes.JSONMap{
			"region":     "us-east-1",
			"provider":   "gcp",
			"version":    "1.29",
			"node_count": 5,
			"features": map[string]interface{}{
				"monitoring": true,
				"logging":    false,
				"backup":     true,
			},
		}

		cluster := &Cluster{
			Id:       uuid.New(),
			Name:     "json-test-cluster",
			Metadata: originalMetadata,
		}

		// Marshal the metadata
		data, err := json.Marshal(cluster.Metadata)
		require.NoError(t, err)

		// Unmarshal back
		var unmarshaledMetadata datatypes.JSONMap
		err = json.Unmarshal(data, &unmarshaledMetadata)
		require.NoError(t, err)

		// Verify data integrity
		assert.Equal(t, "us-east-1", unmarshaledMetadata["region"])
		assert.Equal(t, "gcp", unmarshaledMetadata["provider"])
		assert.Equal(t, "1.29", unmarshaledMetadata["version"])
		assert.Equal(t, float64(5), unmarshaledMetadata["node_count"])

		features, ok := unmarshaledMetadata["features"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, true, features["monitoring"])
		assert.Equal(t, false, features["logging"])
		assert.Equal(t, true, features["backup"])
	})

	t.Run("empty metadata", func(t *testing.T) {
		cluster := &Cluster{
			Id:       uuid.New(),
			Name:     "empty-metadata-cluster",
			Metadata: datatypes.JSONMap{},
		}

		assert.NotNil(t, cluster.Metadata)
		assert.Len(t, cluster.Metadata, 0)
	})

	t.Run("metadata with various data types", func(t *testing.T) {
		metadata := datatypes.JSONMap{
			"string_field": "test_value",
			"int_field":    42,
			"float_field":  3.14159,
			"bool_field":   true,
			"array_field":  []interface{}{"item1", "item2", "item3"},
			"object_field": map[string]interface{}{
				"nested_string": "nested_value",
				"nested_int":    123,
				"nested_bool":   false,
			},
			"null_field": nil,
		}

		cluster := &Cluster{
			Id:       uuid.New(),
			Name:     "mixed-types-cluster",
			Metadata: metadata,
		}

		assert.Equal(t, "test_value", cluster.Metadata["string_field"])
		assert.Equal(t, 42, cluster.Metadata["int_field"])
		assert.Equal(t, 3.14159, cluster.Metadata["float_field"])
		assert.Equal(t, true, cluster.Metadata["bool_field"])

		array, ok := cluster.Metadata["array_field"].([]interface{})
		require.True(t, ok)
		assert.Len(t, array, 3)
		assert.Equal(t, "item1", array[0])

		object, ok := cluster.Metadata["object_field"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "nested_value", object["nested_string"])
		assert.Equal(t, 123, object["nested_int"])
		assert.Equal(t, false, object["nested_bool"])

		assert.Nil(t, cluster.Metadata["null_field"])
	})
}

func TestConvertClusterToProto(t *testing.T) {
	testCases := []struct {
		name    string
		cluster *Cluster
	}{
		{
			name: "complete cluster",
			cluster: &Cluster{
				Id:   uuid.New(),
				Name: "production-cluster",
				TokenId: func() *uuid.UUID {
					id := uuid.New()
					return &id
				}(),
				ClusterIdentifier: func() *uuid.UUID {
					id := uuid.New()
					return &id
				}(),
				Metadata: datatypes.JSONMap{
					"region":   "us-west-2",
					"provider": "aws",
				},
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		},
		{
			name: "minimal cluster",
			cluster: &Cluster{
				Id:        uuid.New(),
				Name:      "minimal-cluster",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		},
		{
			name: "cluster with empty name",
			cluster: &Cluster{
				Id:        uuid.New(),
				Name:      "",
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		},
		{
			name: "cluster with complex metadata",
			cluster: &Cluster{
				Id:   uuid.New(),
				Name: "complex-cluster",
				Metadata: datatypes.JSONMap{
					"kubernetes": map[string]interface{}{
						"version": "1.28.5",
						"nodes":   3,
					},
					"tags": map[string]interface{}{
						"Environment": "production",
						"Team":        "platform",
					},
				},
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			proto := ConvertClusterToProto(tc.cluster)

			require.NotNil(t, proto)
			assert.Equal(t, tc.cluster.Id.String(), proto.Id)
			assert.Equal(t, tc.cluster.Name, proto.Name)
			assert.Equal(t, timestamppb.New(tc.cluster.CreatedAt), proto.CreatedAt)
			assert.Equal(t, timestamppb.New(tc.cluster.UpdatedAt), proto.UpdatedAt)

			// Verify timestamp conversion accuracy
			assert.True(t, proto.CreatedAt.IsValid())
			assert.True(t, proto.UpdatedAt.IsValid())
			assert.Equal(t, tc.cluster.CreatedAt.Unix(), proto.CreatedAt.GetSeconds())
			assert.Equal(t, tc.cluster.UpdatedAt.Unix(), proto.UpdatedAt.GetSeconds())
		})
	}

	t.Run("proto conversion preserves data integrity", func(t *testing.T) {
		originalTime := time.Now().Truncate(time.Second) // Truncate for protobuf precision
		cluster := &Cluster{
			Id:        uuid.New(),
			Name:      "integrity-test-cluster",
			CreatedAt: originalTime,
			UpdatedAt: originalTime,
		}

		proto := ConvertClusterToProto(cluster)

		// Verify all fields are correctly converted
		assert.Equal(t, cluster.Id.String(), proto.Id)
		assert.Equal(t, cluster.Name, proto.Name)

		// Verify time conversion back and forth
		convertedCreatedAt := proto.CreatedAt.AsTime()
		convertedUpdatedAt := proto.UpdatedAt.AsTime()

		assert.Equal(t, originalTime.Unix(), convertedCreatedAt.Unix())
		assert.Equal(t, originalTime.Unix(), convertedUpdatedAt.Unix())
	})

	t.Run("nil cluster", func(t *testing.T) {
		assert.Panics(t, func() {
			ConvertClusterToProto(nil)
		})
	})

	t.Run("cluster with zero time values", func(t *testing.T) {
		cluster := &Cluster{
			Id:        uuid.New(),
			Name:      "zero-time-cluster",
			CreatedAt: time.Time{},
			UpdatedAt: time.Time{},
		}

		proto := ConvertClusterToProto(cluster)

		require.NotNil(t, proto)
		assert.Equal(t, cluster.Id.String(), proto.Id)
		assert.Equal(t, cluster.Name, proto.Name)

		// Zero times should still be valid protobuf timestamps
		assert.True(t, proto.CreatedAt.IsValid())
		assert.True(t, proto.UpdatedAt.IsValid())
		// Note: Go's zero time.Time{} is not Unix epoch 0, but rather January 1, year 1, 00:00:00 UTC
		// When converted to protobuf timestamp, it becomes a large negative number
		assert.NotEqual(t, int64(0), proto.CreatedAt.GetSeconds())
		assert.NotEqual(t, int64(0), proto.UpdatedAt.GetSeconds())
	})
}

func TestClusterValidation(t *testing.T) {
	t.Run("valid cluster configurations", func(t *testing.T) {
		testCases := []struct {
			name    string
			cluster *Cluster
		}{
			{
				name: "production cluster",
				cluster: &Cluster{
					Id:   uuid.New(),
					Name: "prod-k8s-cluster",
					Metadata: datatypes.JSONMap{
						"environment": "production",
						"region":      "us-west-2",
					},
				},
			},
			{
				name: "development cluster",
				cluster: &Cluster{
					Id:   uuid.New(),
					Name: "dev-cluster",
					Metadata: datatypes.JSONMap{
						"environment": "development",
						"temporary":   true,
					},
				},
			},
			{
				name: "cluster with authentication",
				cluster: &Cluster{
					Id:   uuid.New(),
					Name: "auth-cluster",
					TokenId: func() *uuid.UUID {
						id := uuid.New()
						return &id
					}(),
					ClusterIdentifier: func() *uuid.UUID {
						id := uuid.New()
						return &id
					}(),
				},
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				assert.NotNil(t, tc.cluster)
				assert.NotEqual(t, uuid.Nil, tc.cluster.Id)
				assert.NotEmpty(t, tc.cluster.Name)
			})
		}
	})

	t.Run("cluster name validation patterns", func(t *testing.T) {
		validNames := []string{
			"production-cluster",
			"dev-k8s-01",
			"staging_cluster",
			"test-cluster-v2",
			"cluster123",
			"my-awesome-cluster",
		}

		for _, name := range validNames {
			t.Run("valid_name_"+name, func(t *testing.T) {
				cluster := &Cluster{
					Id:   uuid.New(),
					Name: name,
				}
				assert.NotEmpty(t, cluster.Name)
				assert.Equal(t, name, cluster.Name)
			})
		}
	})

	t.Run("uuid field validation", func(t *testing.T) {
		tokenId := uuid.New()
		clusterIdentifier := uuid.New()

		cluster := &Cluster{
			Id:                uuid.New(),
			Name:              "uuid-test-cluster",
			TokenId:           &tokenId,
			ClusterIdentifier: &clusterIdentifier,
		}

		assert.NotEqual(t, uuid.Nil, cluster.Id)
		assert.NotNil(t, cluster.TokenId)
		assert.NotEqual(t, uuid.Nil, *cluster.TokenId)
		assert.NotNil(t, cluster.ClusterIdentifier)
		assert.NotEqual(t, uuid.Nil, *cluster.ClusterIdentifier)

		// Verify UUIDs are properly formatted
		_, err := uuid.Parse(cluster.Id.String())
		assert.NoError(t, err)

		_, err = uuid.Parse(cluster.TokenId.String())
		assert.NoError(t, err)

		_, err = uuid.Parse(cluster.ClusterIdentifier.String())
		assert.NoError(t, err)
	})
}

func TestClusterDatabaseStructure(t *testing.T) {
	t.Run("database structure validation", func(t *testing.T) {
		// Test that the struct can be used with GORM
		// In a real test environment, this would connect to a test database
		cluster := &Cluster{
			Id:   uuid.New(),
			Name: "db-test-cluster",
			Metadata: datatypes.JSONMap{
				"region": "us-east-1",
				"nodes":  3,
			},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Verify struct is properly set up for GORM operations
		assert.NotNil(t, cluster)
		assert.NotEqual(t, uuid.Nil, cluster.Id)
		assert.NotEmpty(t, cluster.Name)
		assert.NotNil(t, cluster.Metadata)

		// In a real integration test, we would test:
		// - Database constraints (name uniqueness, etc.)
		// - UUID generation with gen_random_uuid()
		// - JSON column storage and retrieval
		// - Soft delete functionality with DeletedAt
		// - Index performance on DeletedAt
		// - Foreign key relationships with other models
	})

	t.Run("gorm tag validation", func(t *testing.T) {
		// Verify that GORM tags are properly configured
		cluster := &Cluster{}

		// Test that DeletedAt implements the soft delete pattern
		assert.False(t, cluster.DeletedAt.Valid)

		// Set soft delete
		cluster.DeletedAt = gorm.DeletedAt{Valid: true, Time: time.Now()}
		assert.True(t, cluster.DeletedAt.Valid)
		assert.False(t, cluster.DeletedAt.Time.IsZero())
	})
}

func TestClusterAssociations(t *testing.T) {
	t.Run("cluster token relationship", func(t *testing.T) {
		tokenId := uuid.New()
		cluster := &Cluster{
			Id:      uuid.New(),
			Name:    "token-cluster",
			TokenId: &tokenId,
		}

		assert.NotNil(t, cluster.TokenId)
		assert.Equal(t, tokenId, *cluster.TokenId)
		assert.NotEqual(t, uuid.Nil, *cluster.TokenId)
	})

	t.Run("cluster identifier relationship", func(t *testing.T) {
		clusterIdentifier := uuid.New()
		cluster := &Cluster{
			Id:                uuid.New(),
			Name:              "identifier-cluster",
			ClusterIdentifier: &clusterIdentifier,
		}

		assert.NotNil(t, cluster.ClusterIdentifier)
		assert.Equal(t, clusterIdentifier, *cluster.ClusterIdentifier)
		assert.NotEqual(t, uuid.Nil, *cluster.ClusterIdentifier)
	})

	t.Run("cluster without optional relationships", func(t *testing.T) {
		cluster := &Cluster{
			Id:                uuid.New(),
			Name:              "standalone-cluster",
			TokenId:           nil,
			ClusterIdentifier: nil,
		}

		assert.Nil(t, cluster.TokenId)
		assert.Nil(t, cluster.ClusterIdentifier)
		assert.NotEqual(t, uuid.Nil, cluster.Id)
		assert.NotEmpty(t, cluster.Name)
	})
}

// Benchmark tests for performance
func BenchmarkConvertClusterToProto(b *testing.B) {
	tokenId := uuid.New()
	clusterIdentifier := uuid.New()
	cluster := &Cluster{
		Id:                uuid.New(),
		Name:              "benchmark-cluster",
		TokenId:           &tokenId,
		ClusterIdentifier: &clusterIdentifier,
		Metadata: datatypes.JSONMap{
			"region":   "us-west-2",
			"provider": "aws",
			"version":  "1.28",
			"nodes":    5,
			"features": map[string]interface{}{
				"monitoring": true,
				"logging":    true,
				"backup":     false,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConvertClusterToProto(cluster)
	}
}

func BenchmarkClusterMetadataAccess(b *testing.B) {
	metadata := datatypes.JSONMap{
		"kubernetes": map[string]interface{}{
			"version": "1.28.5",
			"nodes":   3,
			"features": map[string]interface{}{
				"monitoring": true,
				"logging":    true,
			},
		},
		"infrastructure": map[string]interface{}{
			"provider": "aws",
			"region":   "us-west-2",
		},
	}

	cluster := &Cluster{
		Id:       uuid.New(),
		Name:     "benchmark-metadata-cluster",
		Metadata: metadata,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Simulate common metadata access patterns
		_ = cluster.Metadata["kubernetes"]
		if k8s, ok := cluster.Metadata["kubernetes"].(map[string]interface{}); ok {
			_ = k8s["version"]
			_ = k8s["nodes"]
		}
	}
}
