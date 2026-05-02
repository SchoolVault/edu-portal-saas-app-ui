-- Receipt sequencing, refund approval workflow support.

CREATE TABLE fee_receipt_counter_v2 (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    academic_year_id BIGINT NOT NULL,
    next_seq BIGINT NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_fee_receipt_ctr (tenant_id, academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE fee_refund_v2
    ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED' AFTER refund_status;
