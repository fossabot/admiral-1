package model

import (
	"errors"
	"time"

	"database/sql/driver"
	"encoding/json"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Session struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	SessionToken string
	Subject      string
	Attributes   AttributesJSON `gorm:"type:jsonb"`
	CreatedAt    time.Time
	ExpiresAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

type AttributesJSON map[string]any

func (a AttributesJSON) Value() (driver.Value, error) {
	if a == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(a)
}

func (a *AttributesJSON) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, a)
}
