package config

import (
	"fmt"
	"time"

	"go.uber.org/zap/zapcore"
)

type Server struct {
	Listener             Listener   `yaml:"listener"`
	Timeouts             Timeouts   `yaml:"timeouts"`
	Logger               *Logger    `yaml:"logger"`
	AccessLog            *AccessLog `yaml:"access_log"`
	Stats                *Stats     `yaml:"stats"`
	EnablePprof          bool       `yaml:"enable_pprof"`
	MaxResponseSizeBytes int        `yaml:"max_response_size_bytes"`
	Cookies              *Cookies   `yaml:"cookies"`
}

type Listener struct {
	Address string `yaml:"address" validate:"ip"`
	Port    int    `yaml:"port" validate:"required,min=1,max=65535"`
}

type Timeouts struct {
	Default   time.Duration   `yaml:"default"`
	Overrides []TimeoutsEntry `yaml:"overrides"`
}

type TimeoutsEntry struct {
	Service string        `yaml:"service"`
	Method  string        `yaml:"method"`
	Timeout time.Duration `yaml:"timeout"`
}

type Logger struct {
	Level     zapcore.Level `yaml:"level"`
	Namespace string        `yaml:"namespace"`
	Pretty    bool          `yaml:"pretty"`
}

type AccessLog struct {
	StatusCodeFilters []uint32 `yaml:"status_code_filters"`
}

type Stats struct {
	FlushInterval  time.Duration   `yaml:"flush_interval"`
	GoRuntimeStats *GoRuntimeStats `yaml:"go_runtime_stats"`
	Prefix         string          `yaml:"prefix"`
	ReporterType   ReporterType    `yaml:"reporter_type"`
}

type GoRuntimeStats struct {
	CollectionInterval *time.Duration `yaml:"collection_interval" validate:"required,min=1s"`
}

type ReporterType string

const (
	ReporterTypeNull       ReporterType = "null"
	ReporterTypeLog        ReporterType = "log"
	ReporterTypePrometheus ReporterType = "prometheus"
)

func (r *ReporterType) String() string {
	return string(*r)
}

func (r *ReporterType) MarshalYAML() (interface{}, error) {
	return r.String(), nil
}

func (r *ReporterType) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var str string
	if err := unmarshal(&str); err != nil {
		return err
	}

	switch str {
	case string(ReporterTypeNull):
		*r = ReporterTypeNull
	case string(ReporterTypeLog):
		*r = ReporterTypeLog
	case string(ReporterTypePrometheus):
		*r = ReporterTypePrometheus
	default:
		return fmt.Errorf("invalid reporter model: %q", str)
	}

	return nil
}

func (r *ReporterType) Validate() error {
	switch *r {
	case ReporterTypeNull, ReporterTypeLog, ReporterTypePrometheus:
		return nil
	default:
		return fmt.Errorf("invalid reporter model: %s", *r)
	}
}

type Cookies struct {
	Secure   bool     `yaml:"secure"`
	SameSite SameSite `yaml:"same_site"`
}

type SameSite string

const (
	SameSiteLax    SameSite = "lax"
	SameSiteStrict SameSite = "strict"
	SameSiteNone   SameSite = "none"
)

func (s *SameSite) String() string {
	if s == nil {
		return "none"
	}
	return string(*s)
}

func (s *SameSite) Validate() error {
	switch *s {
	case SameSiteLax, SameSiteStrict, SameSiteNone:
		return nil
	default:
		return fmt.Errorf("invalid same_site setting: %q", *s)
	}
}
