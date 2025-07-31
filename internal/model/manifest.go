package model

import (
	"time"

	"github.com/google/uuid"
	"google.golang.org/protobuf/types/known/timestamppb"
	"gorm.io/gorm"

	manifestv1 "go.admiral.io/admiral/api/manifest/v1"
)

type Manifest struct {
	Id             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ApplicationId  uuid.UUID
	VersionGroupId uuid.UUID
	Name           string
	Description    *string
	StorageBucket  string
	StorageKey     string
	Checksum       string
	ChecksumType   string
	Version        int
	IsLatest       bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

func ConvertManifestToProto(m *Manifest, c *[]byte) *manifestv1.Manifest {
	manifest := &manifestv1.Manifest{
		Id:             m.Id.String(),
		ApplicationId:  m.ApplicationId.String(),
		VersionGroupId: m.VersionGroupId.String(),
		Name:           m.Name,
		Description:    m.Description,
		Version:        uint32(m.Version), //nolint:gosec // Version is non-negative integer from database
		IsLatest:       m.IsLatest,
		CreatedAt:      timestamppb.New(m.CreatedAt),
		UpdatedAt:      timestamppb.New(m.UpdatedAt),
	}

	if c != nil {
		manifest.File = &manifestv1.ManifestFile{
			FileContent:  *c,
			Checksum:     m.Checksum,
			ChecksumType: m.ChecksumType,
		}
	}

	return manifest
}
