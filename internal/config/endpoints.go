package config

type Endpoints struct {
	Manifest Manifest
	Revision Revision
}

type Manifest struct {
	BucketName string `yaml:"bucket_name"`
}

type Revision struct {
	BucketName string `yaml:"bucket_name"`
}
