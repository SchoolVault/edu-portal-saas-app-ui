CREATE TABLE platform_tenant_purge_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    school_code VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    error_message TEXT,
    rows_deleted_estimate INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    INDEX idx_ptpj_tenant (tenant_id),
    INDEX idx_ptpj_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
