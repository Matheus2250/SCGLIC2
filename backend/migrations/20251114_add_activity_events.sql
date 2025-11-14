-- Create table to record aggregated activity events (e.g., PCA imports)
-- Postgres dialect
CREATE TABLE IF NOT EXISTS activity_events (
    id uuid PRIMARY KEY,
    module varchar(50) NOT NULL,
    action varchar(50) NOT NULL DEFAULT 'import',
    title text NOT NULL,
    details jsonb,
    at timestamptz NOT NULL DEFAULT now(),
    user_id uuid NOT NULL REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_events_at ON activity_events (at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_module ON activity_events (module);
