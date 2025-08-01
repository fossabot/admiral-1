package config

import (
	"fmt"
	"strings"
)

type Temporal struct {
	Host      string `yaml:"host"`
	Port      int    `yaml:"port"`
	Namespace string `yaml:"namespace"`
}

func (t *Temporal) SetDefaults() {
	if t == nil {
		return
	}
	if t.Port == 0 {
		t.Port = 7233
	}
	if t.Namespace == "" {
		t.Namespace = "admiral"
	}
}

func (t *Temporal) Validate() error {
	if t == nil {
		return fmt.Errorf("temporal config is nil")
	}
	if strings.TrimSpace(t.Host) == "" {
		return fmt.Errorf("host is required")
	}
	if t.Port < 1 || t.Port > 65535 {
		return fmt.Errorf("port must be between 1 and 65535, got %d", t.Port)
	}
	return nil
}
