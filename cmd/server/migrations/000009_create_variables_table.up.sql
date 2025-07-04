CREATE TABLE IF NOT EXISTS variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID,
    environment_id UUID,
    key VARCHAR(255) NOT NULL CHECK (key ~ '^[a-zA-Z0-9_]([-a-zA-Z0-9_]*[a-zA-Z0-9_])?$'),
    value TEXT NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT variables_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT variables_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE,
    CONSTRAINT variables_valid_level CHECK (
        (application_id IS NULL AND environment_id IS NULL) OR
        (application_id IS NOT NULL AND environment_id IS NULL) OR
        (application_id IS NOT NULL AND environment_id IS NOT NULL)
        ),
    CONSTRAINT variables_unique_key_per_scope UNIQUE (application_id, environment_id, key, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_variables_application_id ON variables (application_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_variables_environment_id ON variables (environment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_variables_key ON variables (key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_variables_active ON variables (id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_variables_composite ON variables (application_id, environment_id) WHERE deleted_at IS NULL;
