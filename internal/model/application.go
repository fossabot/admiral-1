package model

import (
	"time"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	applicationv1 "go.admiral.io/admiral/api/application/v1"
)

type Application struct {
	Id          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name        string
	Description *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

func ConvertApplicationToProto(a *Application) *applicationv1.Application {
	return &applicationv1.Application{
		Id:          a.Id.String(),
		Name:        a.Name,
		Description: a.Description,
		CreatedAt:   timestamppb.New(a.CreatedAt),
		UpdatedAt:   timestamppb.New(a.UpdatedAt),
	}
}
