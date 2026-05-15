CREATE TABLE IF NOT EXISTS exam_school_runtime_policy (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    result_visibility_policy VARCHAR(40) NOT NULL DEFAULT 'STRICT_PUBLISH',
    board_pack_code VARCHAR(80) NULL,
    region_pack_code VARCHAR(80) NULL,
    school_type_pack_code VARCHAR(80) NULL,
    is_active BIT(1) NOT NULL DEFAULT b'1',
    is_deleted BIT(1) NOT NULL DEFAULT b'0',
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    UNIQUE KEY uk_exam_runtime_policy_tenant (tenant_id),
    KEY idx_exam_runtime_policy_tenant (tenant_id, is_deleted, is_active)
);

CREATE TABLE IF NOT EXISTS exam_profile_pack_catalog (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NULL,
    pack_type VARCHAR(40) NOT NULL,
    pack_code VARCHAR(80) NOT NULL,
    config_json JSON NULL,
    enabled BIT(1) NOT NULL DEFAULT b'1',
    is_active BIT(1) NOT NULL DEFAULT b'1',
    is_deleted BIT(1) NOT NULL DEFAULT b'0',
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    UNIQUE KEY uk_exam_pack_catalog (tenant_id, pack_type, pack_code),
    KEY idx_exam_pack_catalog_lookup (pack_type, pack_code, enabled, is_deleted)
);

CREATE TABLE IF NOT EXISTS exam_archive_restore_request (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    request_notes VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',
    requested_by_user_id BIGINT NULL,
    approved_by_user_id BIGINT NULL,
    rejected_by_user_id BIGINT NULL,
    approved_at DATETIME NULL,
    rejected_at DATETIME NULL,
    dry_run BIT(1) NOT NULL DEFAULT b'1',
    restore_result_json JSON NULL,
    is_active BIT(1) NOT NULL DEFAULT b'1',
    is_deleted BIT(1) NOT NULL DEFAULT b'0',
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    KEY idx_exam_restore_request_lookup (tenant_id, academic_year_id, status, created_at),
    KEY idx_exam_restore_request_status (status, created_at)
);
