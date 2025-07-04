package model

import (
	"errors"
	"fmt"
	"time"

	"database/sql/driver"
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
	}
	return nil, errors.New("invalid reference_kind value")
}

func (rk *ReferenceKind) Scan(value interface{}) error {
	switch v := value.(type) {
	case []byte:
		*rk = ReferenceKind(v)
	case string:
		*rk = ReferenceKind(v)
	default:
		return fmt.Errorf("cannot scan %T into ReferenceKind", value)
	}
	return nil
}

var referenceKindLookup = map[string]ReferenceKind{
	"user":    ReferenceKindUser,
	"cluster": ReferenceKindCluster,
}

func ParseReferenceKind(s string) (ReferenceKind, error) {
	if k, ok := referenceKindLookup[s]; ok {
		return k, nil
	}
	return "", fmt.Errorf("invalid reference kind %q", s)
}

func (rk ReferenceKind) String() string {
	switch rk {
	case ReferenceKindUser, ReferenceKindCluster:
		return string(rk)
	default:
		return ""
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
