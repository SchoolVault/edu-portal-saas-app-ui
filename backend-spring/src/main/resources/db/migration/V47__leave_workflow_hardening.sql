ALTER TABLE leave_entitlement_ledger
    ADD COLUMN academic_year_id BIGINT NULL AFTER reference_id;

CREATE INDEX idx_leave_ledger_tenant_year_user
    ON leave_entitlement_ledger (tenant_id, academic_year_id, user_id, is_deleted);

CREATE INDEX idx_leave_ledger_idempotency
    ON leave_entitlement_ledger (tenant_id, user_id, leave_type, entry_type, reference_type, reference_id, is_deleted);
