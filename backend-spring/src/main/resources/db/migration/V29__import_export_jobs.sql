-- Async bulk import jobs (ZIP/CSV) with per-row outcomes for admin retry and auditing.

CREATE TABLE IF NOT EXISTS import_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    created_by_user_id BIGINT,
    job_type VARCHAR(40) NOT NULL,
    status VARCHAR(24) NOT NULL,
    original_filename VARCHAR(512),
    total_rows INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    summary_message VARCHAR(4000),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_import_jobs_tenant_created (tenant_id, created_at DESC),
    INDEX idx_import_jobs_status (tenant_id, status)
);

CREATE TABLE IF NOT EXISTS import_job_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    job_id BIGINT NOT NULL,
    line_index INT NOT NULL,
    status VARCHAR(24) NOT NULL,
    payload_json MEDIUMTEXT,
    error_message VARCHAR(4000),
    entity_type VARCHAR(40),
    entity_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT fk_import_job_lines_job FOREIGN KEY (job_id) REFERENCES import_jobs (id) ON DELETE CASCADE,
    INDEX idx_import_job_lines_job (job_id, line_index)
);
