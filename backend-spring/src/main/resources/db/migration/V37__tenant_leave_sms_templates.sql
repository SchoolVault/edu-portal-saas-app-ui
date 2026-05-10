ALTER TABLE tenant_configs
    ADD COLUMN leave_sms_apply_template VARCHAR(1000) NULL AFTER features_json,
    ADD COLUMN leave_sms_decision_template VARCHAR(1000) NULL AFTER leave_sms_apply_template;

CREATE TABLE leave_entitlement_ledger (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT(1) NOT NULL DEFAULT b'1',
    is_deleted BIT(1) NOT NULL DEFAULT b'0',
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    user_id BIGINT NOT NULL,
    leave_type VARCHAR(32) NOT NULL,
    policy_year_label VARCHAR(120) NULL,
    entry_type VARCHAR(32) NOT NULL,
    signed_units INT NOT NULL,
    notes VARCHAR(500) NULL,
    reference_type VARCHAR(64) NULL,
    reference_id BIGINT NULL,
    effective_date DATE NULL,
    CONSTRAINT chk_leave_entitlement_signed_nonzero CHECK (signed_units <> 0)
);

CREATE INDEX idx_leave_ledger_tenant_user_type_year
    ON leave_entitlement_ledger (tenant_id, user_id, leave_type, policy_year_label, is_deleted);

CREATE INDEX idx_leave_ledger_tenant_reference
    ON leave_entitlement_ledger (tenant_id, reference_type, reference_id, is_deleted);

CREATE INDEX idx_leave_ledger_tenant_created
    ON leave_entitlement_ledger (tenant_id, created_at, is_deleted);
