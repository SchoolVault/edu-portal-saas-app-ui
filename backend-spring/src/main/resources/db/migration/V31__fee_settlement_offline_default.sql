-- Default new finance rows to offline-first (school counter); existing tenants unchanged.
-- Parent online checkout default 0 aligns with OFFLINE; PLATFORM/ROUTE upserts set enabled=true in application logic.

ALTER TABLE tenant_finance_profiles
    MODIFY COLUMN fee_settlement_mode VARCHAR(40) NOT NULL DEFAULT 'OFFLINE_SCHOOL_COLLECTION';

ALTER TABLE tenant_finance_profiles
    MODIFY COLUMN parent_online_fee_checkout_enabled TINYINT(1) NOT NULL DEFAULT 0;
