CREATE TABLE canonical_export_jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT(1) DEFAULT b'1',
    is_deleted BIT(1) DEFAULT b'0',
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    export_type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    requested_by_user_id BIGINT NULL,
    file_name VARCHAR(200) NULL,
    content_type VARCHAR(100) NULL,
    content_size_bytes BIGINT NULL,
    row_count INT NULL,
    file_content LONGBLOB NULL,
    error_message VARCHAR(500) NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NULL
);

CREATE INDEX idx_canonical_export_jobs_tenant_status
    ON canonical_export_jobs (tenant_id, status, is_deleted);

CREATE INDEX idx_canonical_export_jobs_tenant_type_created
    ON canonical_export_jobs (tenant_id, export_type, created_at, is_deleted);
