CREATE TYPE revision_status AS ENUM ('pending', 'processing', 'active', 'failed', 'inactive');

CREATE TABLE IF NOT EXISTS revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    settings JSONB,
    manifests JSONB,
    storage_bucket VARCHAR(255) NOT NULL,
    storage_key VARCHAR(1024) NOT NULL,
    checksum VARCHAR(255),
    checksum_type VARCHAR(50) DEFAULT 'sha256' CHECK (checksum_type IN ('sha256') OR checksum_type IS NULL),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    status revision_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_revisions_active_per_environment ON revisions (environment_id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_revisions_environment_id ON revisions (environment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_revisions_status ON revisions (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_revisions_active ON revisions (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_revisions_jsonb_settings ON revisions USING GIN (settings jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_revisions_jsonb_manifests ON revisions USING GIN (manifests jsonb_path_ops);
