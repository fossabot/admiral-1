package config

import (
	"fmt"
	"strings"
	"time"
)

type Database struct {
	Host              string        `yaml:"host"`
	Port              int           `yaml:"port"`
	DatabaseName      string        `yaml:"database_name"`
	User              string        `yaml:"user"`
	Password          string        `yaml:"password"`
	SSLMode           SSLMode       `yaml:"ssl_mode"`
	MaxOpenConns      int           `yaml:"max_open_conns"`
	MaxIdleConns      int           `yaml:"max_idle_conns"`
	ConnMaxLifetime   time.Duration `yaml:"conn_max_lifetime"`
	ConnMaxIdleTime   time.Duration `yaml:"conn_max_idle_time"`
	ConnectionTimeout time.Duration `yaml:"connection_timeout"`
}

type SSLMode int

const (
	SSLModeUnspecified SSLMode = iota
	SSLModeDisable
	SSLModeAllow
	SSLModePrefer
	SSLModeRequire
	SSLModeVerifyCA
	SSLModeVerifyFull
)

var sslModeName = map[SSLMode]string{
	SSLModeUnspecified: "unspecified",
	SSLModeDisable:     "disable",
	SSLModeAllow:       "allow",
	SSLModePrefer:      "prefer",
	SSLModeRequire:     "require",
	SSLModeVerifyCA:    "verify_ca",
	SSLModeVerifyFull:  "verify_full",
}

var sslModeValue = map[string]SSLMode{
	"unspecified": SSLModeUnspecified,
	"disable":     SSLModeDisable,
	"allow":       SSLModeAllow,
	"prefer":      SSLModePrefer,
	"require":     SSLModeRequire,
	"verify_ca":   SSLModeVerifyCA,
	"verify_full": SSLModeVerifyFull,
}

func (s *SSLMode) String() string {
	if s == nil {
		return sslModeName[SSLModeUnspecified]
	}
	if name, ok := sslModeName[*s]; ok {
		return name
	}
	return sslModeName[SSLModeUnspecified]
}

func (s *SSLMode) MarshalYAML() (interface{}, error) {
	return s.String(), nil
}

func (s *SSLMode) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var str string
	if err := unmarshal(&str); err != nil {
		return err
	}
	str = strings.ToLower(str)
	if val, ok := sslModeValue[str]; ok {
		*s = val
		return nil
	}
	return fmt.Errorf("invalid SSLMode: %q", str)
}

func (s *SSLMode) Validate() error {
	if s == nil {
		return fmt.Errorf("SSLMode is nil")
	}
	if _, ok := sslModeName[*s]; !ok {
		return fmt.Errorf("invalid SSLMode: %d", *s)
	}
	return nil
}
