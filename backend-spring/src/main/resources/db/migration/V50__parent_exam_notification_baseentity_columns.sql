ALTER TABLE parent_exam_notification_state
    ADD COLUMN is_active BIT(1) NOT NULL DEFAULT b'1' AFTER tenant_id,
    ADD COLUMN deleted_at DATETIME NULL AFTER is_deleted,
    ADD COLUMN created_by VARCHAR(100) NULL AFTER updated_at,
    ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by;

ALTER TABLE parent_exam_notification_preference
    ADD COLUMN is_active BIT(1) NOT NULL DEFAULT b'1' AFTER tenant_id,
    ADD COLUMN deleted_at DATETIME NULL AFTER is_deleted,
    ADD COLUMN created_by VARCHAR(100) NULL AFTER updated_at,
    ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by;
