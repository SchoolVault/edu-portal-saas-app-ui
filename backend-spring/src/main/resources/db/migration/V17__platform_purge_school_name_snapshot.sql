ALTER TABLE platform_tenant_purge_jobs
    ADD COLUMN school_name VARCHAR(191) NULL AFTER school_code;
