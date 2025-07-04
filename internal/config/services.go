package config

import (
	"fmt"
	"strings"
	"time"
)

type Services struct {
	Authn    *Authn    `yaml:"authn"`
	Database *Database `yaml:"postgres"`
	Storage  *Storage  `yaml:"storage"`
}

type Authn struct {
	Name         string   `yaml:"name"`
	Issuer       string   `yaml:"issuer"`
	ClientID     string   `yaml:"client_id"`
	ClientSecret string   `yaml:"client_secret"`
	Scopes       []string `yaml:"scopes"`
	RedirectURL  string   `yaml:"redirect_url"`
	NonceSecret  string   `yaml:"nonce_secret"`

	SkipTLSVerify bool `yaml:"skip_tls_verify"`
}

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

type Storage struct {
	Type StorageType       `yaml:"type"`
	S3   *S3StorageConfig  `yaml:"s3,omitempty"`
	GCS  *GCSStorageConfig `yaml:"gcs,omitempty"`
}

func (s *Storage) Validate() error {
	switch s.Type {
	case StorageTypeS3:
		if s.S3 == nil {
			return fmt.Errorf("S3 config is required for type %q", s.Type)
		}
	case StorageTypeGCS:
		if s.GCS == nil {
			return fmt.Errorf("GCS config is required for type %q", s.Type)
		}
	default:
		return fmt.Errorf("unsupported storage type: %q", s.Type)
	}
	return nil
}

type StorageType string

const (
	StorageTypeS3  StorageType = "s3"
	StorageTypeGCS StorageType = "gcs"
)

func (s *StorageType) String() string {
	if s == nil {
		return "unspecified"
	}
	return string(*s)
}

func (s *StorageType) Validate() error {
	switch *s {
	case StorageTypeS3, StorageTypeGCS:
		return nil
	default:
		return fmt.Errorf("invalid storage type: %q", *s)
	}
}

type S3StorageConfig struct {
	Endpoint     string `yaml:"endpoint"`
	Region       string `yaml:"region"`
	Bucket       string `yaml:"bucket"`
	UseSSL       bool   `yaml:"use_ssl"`
	AccessKey    string `yaml:"access_key"`
	SecretKey    string `yaml:"secret_key"`
	RoleARN      string `yaml:"role_arn"`
	SessionToken string `yaml:"session_token"`
}

type GCSStorageConfig struct {
	Bucket          string `yaml:"bucket"`
	ProjectID       string `yaml:"project_id"`
	CredentialsFile string `yaml:"credentials_file"`
	CredentialsJSON string `yaml:"credentials_json"`
	UseADC          bool   `yaml:"use_adc"`
}
