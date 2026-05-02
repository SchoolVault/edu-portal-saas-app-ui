-- Rule-driven fee structure assignment runs (idempotent execute).

CREATE TABLE fee_assignment_run_v2 (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    cohort_class_id BIGINT NULL,
    cohort_section_id BIGINT NULL,
    student_ids_json JSON NULL,
    maps_applied INT NOT NULL DEFAULT 0,
    students_skipped INT NOT NULL DEFAULT 0,
    run_metadata_json JSON NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    UNIQUE KEY uq_fee_assignment_run_idem (tenant_id, academic_year_id, idempotency_key),
    KEY idx_fee_assignment_run_tenant_year (tenant_id, academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
