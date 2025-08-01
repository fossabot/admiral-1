package model

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type ReferenceKind string

const (
	ReferenceKindUser    ReferenceKind = "user"
	ReferenceKindCluster ReferenceKind = "cluster"
)

func (rk ReferenceKind) Value() (driver.Value, error) {
	switch rk {
	case ReferenceKindUser, ReferenceKindCluster:
		return string(rk), nil
	default:
		return nil, fmt.Errorf("invalid reference_kind value")
	}
}

func (rk *ReferenceKind) Scan(value interface{}) error {
	if value == nil {
		*rk = ""
		return nil
	}

	switch v := value.(type) {
	case string:
		*rk = ReferenceKind(v)
	case []byte:
		*rk = ReferenceKind(v)
	default:
		return fmt.Errorf("cannot scan %T into ReferenceKind", value)
	}

	return nil
}

func (rk ReferenceKind) String() string {
	switch rk {
	case ReferenceKindUser, ReferenceKindCluster:
		return string(rk)
	default:
		return ""
	}
}

func ParseReferenceKind(s string) (ReferenceKind, error) {
	switch s {
	case "user":
		return ReferenceKindUser, nil
	case "cluster":
		return ReferenceKindCluster, nil
	default:
		return "", fmt.Errorf("invalid reference kind %q", s)
	}
}

type AuthnToken struct {
	Id            string `gorm:"type:uuid;primaryKey"`
	ParentID      *string
	Provider      string
	ReferenceKind ReferenceKind
	ReferenceId   uuid.UUID
	AccessToken   []byte
	RefreshToken  []byte
	IdToken       []byte
	CreatedAt     time.Time
	UpdatedAt     time.Time
	ExpiresAt     time.Time
}
