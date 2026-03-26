-- Adds URL source support for bill analysis records.
ALTER TABLE bill_analyses
ADD COLUMN IF NOT EXISTS source_url VARCHAR(2000);
