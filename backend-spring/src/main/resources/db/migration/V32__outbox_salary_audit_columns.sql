-- Align notification_outbox and salary_disbursement_attempts with BaseEntity (created_by, updated_by).
-- V28 created these tables without audit user columns; Hibernate schema validation in prod requires them.

ALTER TABLE notification_outbox
    ADD COLUMN created_by VARCHAR(100) NULL AFTER updated_at,
    ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by;

ALTER TABLE salary_disbursement_attempts
    ADD COLUMN created_by VARCHAR(100) NULL AFTER updated_at,
    ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by;
