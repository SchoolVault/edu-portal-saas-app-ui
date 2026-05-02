-- Persist academic-year scope on notification outbox so async workers can deliver IN_APP rows
-- without relying solely on "current" year at delivery time.

ALTER TABLE notification_outbox
    ADD COLUMN academic_year_id BIGINT NULL COMMENT 'Scope for academic-year-bound delivery (IN_APP); optional for SMS-only rows' AFTER tenant_id;

CREATE INDEX idx_no_tenant_ay_status_created
    ON notification_outbox (tenant_id, academic_year_id, status, created_at);
