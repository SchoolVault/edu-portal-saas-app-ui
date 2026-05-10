-- Phone-first identity: teacher email optional (no synthetic placeholder).
ALTER TABLE teachers
    MODIFY COLUMN email VARCHAR(150) NULL;

-- Import job execution strategy: BEST_EFFORT (default) vs ALL_OR_NOTHING (single transaction).
ALTER TABLE import_jobs
    ADD COLUMN execution_mode VARCHAR(32) NOT NULL DEFAULT 'BEST_EFFORT';

-- Import observability: explicit replay intent for bypassing completed-job idempotent checks.
ALTER TABLE import_jobs
    ADD COLUMN reprocess_requested TINYINT(1) NOT NULL DEFAULT 0 AFTER execution_mode;
