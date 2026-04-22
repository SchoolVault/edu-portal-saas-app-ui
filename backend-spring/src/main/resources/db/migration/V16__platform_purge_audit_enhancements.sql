ALTER TABLE platform_tenant_purge_jobs
    ADD COLUMN requested_by_user_id BIGINT NULL AFTER school_code,
    ADD COLUMN requested_by_role VARCHAR(64) NULL AFTER requested_by_user_id,
    ADD COLUMN requested_by_principal VARCHAR(191) NULL AFTER requested_by_role,
    ADD COLUMN requested_by_display_name VARCHAR(191) NULL AFTER requested_by_principal,
    ADD COLUMN affected_students BIGINT NULL AFTER rows_deleted_estimate,
    ADD COLUMN affected_teachers BIGINT NULL AFTER affected_students,
    ADD COLUMN affected_admins BIGINT NULL AFTER affected_teachers,
    ADD COLUMN affected_parent_accounts BIGINT NULL AFTER affected_admins,
    ADD COLUMN execution_duration_ms BIGINT NULL AFTER completed_at;
