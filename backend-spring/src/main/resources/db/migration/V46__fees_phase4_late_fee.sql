-- Phase 4 (fees-v2): configurable late-fee policies and idempotent application runs.

CREATE TABLE fee_late_fee_policy_v2 (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    policy_code VARCHAR(60) NOT NULL,
    policy_name VARCHAR(160) NOT NULL,
    grace_days INT NOT NULL DEFAULT 0,
    calculation_mode VARCHAR(30) NOT NULL,
    flat_amount DECIMAL(14,2) NULL,
    rate_percent DECIMAL(7,4) NULL,
    max_late_amount DECIMAL(14,2) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    UNIQUE KEY uq_late_fee_policy_code (tenant_id, academic_year_id, policy_code),
    KEY idx_late_fee_policy_tenant_year (tenant_id, academic_year_id, is_deleted, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fee_late_fee_run_v2 (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    fee_late_fee_policy_id BIGINT NOT NULL,
    as_of_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    demands_updated INT NOT NULL DEFAULT 0,
    run_metadata_json JSON NULL,
    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    finished_at DATETIME(6) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    UNIQUE KEY uq_late_fee_run_idem (tenant_id, academic_year_id, idempotency_key),
    KEY idx_late_fee_run_policy (tenant_id, academic_year_id, fee_late_fee_policy_id),
    CONSTRAINT fk_late_fee_run_policy FOREIGN KEY (fee_late_fee_policy_id) REFERENCES fee_late_fee_policy_v2(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
