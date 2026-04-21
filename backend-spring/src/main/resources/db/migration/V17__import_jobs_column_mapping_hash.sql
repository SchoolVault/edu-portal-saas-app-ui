-- Distinguishes the same file bytes submitted with different column mappings (idempotent submit).
ALTER TABLE import_jobs
    ADD COLUMN column_mapping_hash VARCHAR(64) NOT NULL DEFAULT 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        COMMENT 'SHA-256 hex of normalized column mapping (empty map = SHA-256 of empty string)';

CREATE INDEX idx_import_jobs_idem_mapping
    ON import_jobs (tenant_id, job_type, payload_hash, column_mapping_hash, status);
