-- Phone-first identity: teacher email optional (no synthetic placeholder).
ALTER TABLE teachers
    MODIFY COLUMN email VARCHAR(150) NULL;

-- Import job execution strategy: BEST_EFFORT (default) vs ALL_OR_NOTHING (single transaction).
ALTER TABLE import_jobs
    ADD COLUMN execution_mode VARCHAR(32) NOT NULL DEFAULT 'BEST_EFFORT';
