-- SHA-256 hex of raw uploaded bytes (idempotent submit / audit).
ALTER TABLE import_jobs
    ADD COLUMN payload_hash VARCHAR(64) NULL COMMENT 'SHA-256 hex of upload bytes';

CREATE INDEX idx_import_jobs_tenant_type_hash_status
    ON import_jobs (tenant_id, job_type, payload_hash, status);
