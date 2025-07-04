package model

import (
	"time"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	environmentv1 "go.admiral.io/admiral/api/environment/v1"
)

type Environment struct {
	Id            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ApplicationId uuid.UUID
	ClusterId     *uuid.UUID
	Name          string
	Namespace     *string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

func ConvertEnvironmentToProto(e *Environment) *environmentv1.Environment {
	var clusterId *string
	if e.ClusterId != nil {
		c := e.ClusterId.String()
		clusterId = &c
	}

	return &environmentv1.Environment{
		Id:            e.Id.String(),
		ApplicationId: e.ApplicationId.String(),
		ClusterId:     clusterId,
		Name:          e.Name,
		Namespace:     e.Namespace,
		CreatedAt:     timestamppb.New(e.CreatedAt),
		UpdatedAt:     timestamppb.New(e.UpdatedAt),
	}
}
