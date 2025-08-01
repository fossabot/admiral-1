CREATE TYPE reference_kind AS ENUM ('user', 'cluster');

CREATE TABLE IF NOT EXISTS authn_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id TEXT REFERENCES authn_tokens(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider <> ''),
    reference_kind reference_kind NOT NULL,
    reference_id UUID NOT NULL,
    access_token BYTEA NOT NULL,
    refresh_token BYTEA,
    id_token BYTEA,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_authn_tokens_provider ON authn_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_authn_tokens_reference_kind ON authn_tokens(reference_kind);
CREATE INDEX IF NOT EXISTS idx_authn_tokens_reference_id ON authn_tokens(reference_id);
CREATE INDEX IF NOT EXISTS idx_authn_tokens_parent_id ON authn_tokens(parent_id);
CREATE INDEX IF NOT EXISTS idx_authn_tokens_expires_at ON authn_tokens(expires_at);
