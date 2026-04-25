-- Per-tenant fee settlement routing (e.g. Razorpay Route linked accounts) and commission metadata.
-- Keeps platform keys in env; stores only non-secret routing identifiers.

CREATE TABLE IF NOT EXISTS tenant_finance_profiles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    deleted_at DATETIME(6) NULL,
    fee_settlement_mode VARCHAR(40) NOT NULL DEFAULT 'PLATFORM_MERCHANT',
    razorpay_route_linked_account_id VARCHAR(64) NULL,
    platform_commission_bps INT NOT NULL DEFAULT 0,
    finance_notes VARCHAR(500) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_tenant_finance_profiles_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_tfp_tenant_active ON tenant_finance_profiles (tenant_id, is_deleted);
