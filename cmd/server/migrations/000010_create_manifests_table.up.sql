CREATE TABLE IF NOT EXISTS manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL,
    version_group_id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    storage_bucket VARCHAR(255) NOT NULL CHECK (storage_bucket <> ''),
    storage_key VARCHAR(1024) NOT NULL CHECK (storage_key <> ''),
    checksum VARCHAR(255),
    checksum_type VARCHAR(50) DEFAULT 'sha256' CHECK (checksum_type IN ('sha256') OR checksum_type IS NULL),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 0),
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT manifests_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT manifests_unique_version_group_version UNIQUE (version_group_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS manifests_unique_application_name ON manifests(application_id, name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_manifests_version_group_id ON manifests(version_group_id);
CREATE INDEX IF NOT EXISTS idx_manifests_is_latest ON manifests(version_group_id, is_latest) WHERE is_latest = TRUE;
CREATE INDEX IF NOT EXISTS idx_manifests_application_id ON manifests(application_id) WHERE deleted_at IS NULL;
