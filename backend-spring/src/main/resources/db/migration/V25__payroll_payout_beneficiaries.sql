-- Consolidated payroll payout migrations (previously V25-V29) for fresh DB setup.
CREATE TABLE IF NOT EXISTS payroll_payout_beneficiaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    teacher_id BIGINT NOT NULL,
    provider VARCHAR(32) NOT NULL,
    contact_id VARCHAR(80) NOT NULL,
    fund_account_id VARCHAR(80) NOT NULL,
    bank_fingerprint VARCHAR(64) NOT NULL,
    account_masked VARCHAR(24) NULL,
    ifsc_code VARCHAR(32) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    CONSTRAINT uk_ppb_tenant_teacher_provider_fingerprint
        UNIQUE (tenant_id, teacher_id, provider, bank_fingerprint, is_deleted)
);

CREATE INDEX idx_ppb_tenant_teacher ON payroll_payout_beneficiaries (tenant_id, teacher_id);
CREATE INDEX idx_ppb_tenant_provider ON payroll_payout_beneficiaries (tenant_id, provider);

CREATE TABLE IF NOT EXISTS payroll_payout_webhook_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    provider VARCHAR(32) NOT NULL,
    payload_sha256 VARCHAR(64) NOT NULL,
    external_event_id VARCHAR(128) NULL,
    reference_id VARCHAR(120) NULL,
    status VARCHAR(32) NOT NULL,
    detail VARCHAR(512) NULL,
    raw_body MEDIUMTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    CONSTRAINT uk_payroll_webhook_provider_hash UNIQUE (provider, payload_sha256),
    CONSTRAINT uk_payroll_webhook_provider_event UNIQUE (provider, external_event_id)
);

CREATE INDEX idx_payroll_webhook_provider_ref
    ON payroll_payout_webhook_events (provider, reference_id);
