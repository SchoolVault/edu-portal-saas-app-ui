ALTER TABLE leave_requests
    ADD COLUMN approval_step INT NOT NULL DEFAULT 1 AFTER approver_remarks,
    ADD COLUMN approval_step_total INT NOT NULL DEFAULT 1 AFTER approval_step,
    ADD COLUMN approval_sla_due_at DATETIME NULL AFTER approval_step_total,
    ADD COLUMN approval_escalation_count INT NOT NULL DEFAULT 0 AFTER approval_sla_due_at;

CREATE INDEX idx_leave_workflow_sla_due
    ON leave_requests (tenant_id, status, approval_sla_due_at, is_deleted);
