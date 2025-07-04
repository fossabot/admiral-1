-- CREATE TABLE IF NOT EXISTS sessions (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     session_token UUID NOT NULL UNIQUE,
--     subject TEXT NOT NULL CHECK (length(subject) > 0),
--     attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
--     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
--     expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
--     deleted_at TIMESTAMP WITH TIME ZONE
-- );
--
-- CREATE INDEX IF NOT EXISTS idx_sessions_expiration ON sessions (expires_at);
-- CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (session_token);


CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    data BYTEA NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX sessions_expiry_idx ON sessions (expiry);