-- Ensure pgcrypto extension exists for UUID generation (id generation)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ontology_versions table used to track ontology evolution
CREATE TABLE IF NOT EXISTS ontology_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  previous_version VARCHAR(50),
  changes JSONB,
  current BOOLEAN DEFAULT TRUE,
  CONSTRAINT uq_ontology_versions_version UNIQUE (version)
);

-- Seed initial version if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM ontology_versions WHERE version = 'v1.0.0') THEN
    INSERT INTO ontology_versions (version, applied_at, changes, current)
    VALUES ('v1.0.0', NOW(), '{}'::jsonb, TRUE);
  END IF;
END $$;
