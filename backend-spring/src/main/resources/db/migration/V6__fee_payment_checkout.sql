CREATE TABLE fee_payment_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    fee_payment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    parent_user_id BIGINT NOT NULL,
    provider VARCHAR(40) NOT NULL,
    provider_order_id VARCHAR(100) NOT NULL,
    provider_payment_id VARCHAR(100) NULL,
    checkout_token VARCHAR(120) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    return_url VARCHAR(300) NULL,
    gateway_payload TEXT NULL,
    initiated_at DATETIME NULL,
    completed_at DATETIME NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_fpa_payment ON fee_payment_attempts (tenant_id, fee_payment_id);
CREATE INDEX idx_fpa_student ON fee_payment_attempts (tenant_id, student_id);
CREATE INDEX idx_fpa_status ON fee_payment_attempts (tenant_id, status);
