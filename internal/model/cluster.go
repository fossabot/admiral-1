package model

import (
	"time"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	clusterv1 "go.admiral.io/admiral/api/cluster/v1"
)

type Cluster struct {
	Id                uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name              string
	TokenId           *uuid.UUID `gorm:"column:authn_token_id"`
	ClusterIdentifier *uuid.UUID
	Metadata          datatypes.JSONMap
	CreatedAt         time.Time
	UpdatedAt         time.Time
	DeletedAt         gorm.DeletedAt `gorm:"index"`
}

func ConvertClusterToProto(c *Cluster) *clusterv1.Cluster {
	return &clusterv1.Cluster{
		Id:        c.Id.String(),
		Name:      c.Name,
		CreatedAt: timestamppb.New(c.CreatedAt),
		UpdatedAt: timestamppb.New(c.UpdatedAt),
	}
}
