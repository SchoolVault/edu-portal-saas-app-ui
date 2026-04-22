ALTER TABLE platform_tenant_purge_jobs
    ADD COLUMN executed_by_user_id BIGINT NULL AFTER requested_by_display_name,
    ADD COLUMN executed_by_role VARCHAR(64) NULL AFTER executed_by_user_id,
    ADD COLUMN executed_by_principal VARCHAR(191) NULL AFTER executed_by_role,
    ADD COLUMN executed_by_display_name VARCHAR(191) NULL AFTER executed_by_principal;
