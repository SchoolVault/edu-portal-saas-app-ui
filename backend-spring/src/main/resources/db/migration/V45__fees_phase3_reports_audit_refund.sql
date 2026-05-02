-- Phase 3 (fees-v2): read-side reporting support, immutable audit trail, refund postings.

CREATE TABLE fee_v2_audit_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    actor_user_id BIGINT NULL,
    action_code VARCHAR(80) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id BIGINT NULL,
    correlation_id VARCHAR(80) NULL,
    detail_json JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_fee_v2_audit_tenant_year_created (tenant_id, academic_year_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fee_refund_v2 (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    refund_no VARCHAR(80) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    refund_status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    idempotency_key VARCHAR(120) NOT NULL,
    reason VARCHAR(255) NULL,
    related_payment_id BIGINT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    UNIQUE KEY uq_fee_refund_v2_idem (tenant_id, academic_year_id, idempotency_key),
    KEY idx_fee_refund_v2_student (tenant_id, academic_year_id, student_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
