package model

import (
	"time"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	variablev1 "go.admiral.io/admiral/api/variable/v1"
)

type Variable struct {
	Id            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ApplicationId *uuid.UUID
	EnvironmentId *uuid.UUID
	Key           string
	Value         string
	Description   *string
	IsSensitive   bool
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

func ConvertVariableToProto(v *Variable) *variablev1.Variable {
	var applicationId, environmentId *string

	if v.ApplicationId != nil {
		appId := v.ApplicationId.String()
		applicationId = &appId
	}

	if v.EnvironmentId != nil {
		envId := v.EnvironmentId.String()
		environmentId = &envId
	}

	value := v.Value
	if v.IsSensitive {
		value = "*****"
	}

	return &variablev1.Variable{
		Id:            v.Id.String(),
		ApplicationId: applicationId,
		EnvironmentId: environmentId,
		Key:           v.Key,
		Value:         value,
		Description:   v.Description,
		IsSensitive:   v.IsSensitive,
		CreatedAt:     timestamppb.New(v.CreatedAt),
		UpdatedAt:     timestamppb.New(v.UpdatedAt),
	}
}
