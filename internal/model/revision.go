package model

import (
	"errors"
	"time"

	"database/sql/driver"
	"encoding/json"
	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	revisionv1 "go.admiral.io/admiral/api/revision/v1"
)

type Revision struct {
	Id            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ApplicationId uuid.UUID
	EnvironmentId uuid.UUID
	Settings      SettingsJSON  `gorm:"type:jsonb"` // consider moving to datatypes.JSONMap
	Manifests     ManifestsJSON `gorm:"type:jsonb"`
	StorageBucket string
	StorageKey    string
	Checksum      string
	ChecksumType  string
	IsActive      bool
	Status        string
	CreatedAt     time.Time
	UpdatedAt     time.Time
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

type SettingSummary struct {
	Id           uuid.UUID `json:"id"`
	Key          string    `json:"key"`
	SettingValue string    `json:"value"`
	IsSensitive  bool      `json:"is_sensitive"`
}

type SettingsJSON []SettingSummary

func (s SettingsJSON) Value() (driver.Value, error) {
	if len(s) == 0 {
		return []byte("[]"), nil
	}
	return json.Marshal(s)
}

func (s *SettingsJSON) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, s)
}

type ManifestSummary struct {
	Id            uuid.UUID `json:"id"`
	StorageBucket string    `json:"storage_bucket"`
	StorageKey    string    `json:"storage_key"`
	Checksum      string    `json:"checksum"`
	ChecksumType  string    `json:"checksum_type"`
}

type ManifestsJSON []ManifestSummary

func (m ManifestsJSON) Value() (driver.Value, error) {
	if len(m) == 0 {
		return []byte("[]"), nil
	}
	return json.Marshal(m)
}

func (m *ManifestsJSON) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, m)
}

func ConvertRevisionToProto(r *Revision) *revisionv1.Revision {
	return &revisionv1.Revision{
		Id:            r.Id.String(),
		ApplicationId: r.ApplicationId.String(),
		EnvironmentId: r.EnvironmentId.String(),
		CreatedAt:     timestamppb.New(r.CreatedAt),
		UpdatedAt:     timestamppb.New(r.UpdatedAt),
	}
}
