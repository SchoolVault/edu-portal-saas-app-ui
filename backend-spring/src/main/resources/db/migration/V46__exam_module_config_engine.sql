CREATE TABLE exam_module_configs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT(1) DEFAULT b'1',
    is_deleted BIT(1) DEFAULT b'0',
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    academic_year_id BIGINT NOT NULL,
    config_key VARCHAR(60) NOT NULL,
    config_json JSON NOT NULL,
    version_no INT NOT NULL DEFAULT 1,
    note VARCHAR(500) NULL,
    UNIQUE KEY uk_exam_module_cfg (tenant_id, academic_year_id, config_key, is_deleted),
    KEY idx_exam_module_cfg_lookup (tenant_id, academic_year_id, config_key, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exam_module_config_history (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT(1) DEFAULT b'1',
    is_deleted BIT(1) DEFAULT b'0',
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    academic_year_id BIGINT NOT NULL,
    config_key VARCHAR(60) NOT NULL,
    config_json JSON NOT NULL,
    version_no INT NOT NULL,
    change_note VARCHAR(500) NULL,
    KEY idx_exam_module_cfg_hist_lookup (tenant_id, academic_year_id, config_key, version_no, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
