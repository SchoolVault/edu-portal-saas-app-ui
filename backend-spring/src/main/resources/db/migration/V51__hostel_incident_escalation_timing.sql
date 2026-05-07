-- Hostel Phase C hardening:
-- Policy-driven repeated escalation timing support.

ALTER TABLE hostel_incident_logs
    ADD COLUMN escalation_count INT NULL DEFAULT 0 AFTER escalation_level,
    ADD COLUMN next_escalation_at DATETIME NULL AFTER escalation_count;

CREATE INDEX idx_hil_tenant_next_escalation
    ON hostel_incident_logs (tenant_id, status, next_escalation_at, is_deleted);
