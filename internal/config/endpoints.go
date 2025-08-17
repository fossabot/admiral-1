package config

import "fmt"

type Endpoints struct {
	Manifest Manifest
	Revision Revision
}

func (e *Endpoints) SetDefaults() {
	if e == nil {
		return
	}
	e.Manifest.SetDefaults()
	e.Revision.SetDefaults()
}

func (e *Endpoints) Validate() error {
	if e == nil {
		return nil
	}
	if err := e.Manifest.Validate(); err != nil {
		return fmt.Errorf("manifest: %w", err)
	}
	if err := e.Revision.Validate(); err != nil {
		return fmt.Errorf("revision: %w", err)
	}
	return nil
}

type Manifest struct {
	BucketName string `yaml:"bucket_name"`
}

func (m *Manifest) SetDefaults() {
	// No defaults currently
}

func (m *Manifest) Validate() error {
	if m.BucketName == "" {
		return fmt.Errorf("manifest bucket_name is required")
	}
	return nil
}

type Revision struct {
	BucketName string `yaml:"bucket_name"`
}

func (r *Revision) SetDefaults() {
	// No defaults currently
}

func (r *Revision) Validate() error {
	if r.BucketName == "" {
		return fmt.Errorf("revision bucket_name is required")
	}
	return nil
}
