package config

import (
	"fmt"
	"strings"
)

type Temporal struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

func (t *Temporal) Validate() error {
	if t == nil {
		return fmt.Errorf("temporal config is nil")
	}
	if strings.TrimSpace(t.Host) == "" {
		return fmt.Errorf("temporal host is required")
	}
	if t.Port < 1 || t.Port > 65535 {
		return fmt.Errorf("temporal port must be between 1 and 65535, got %d", t.Port)
	}
	return nil
}
