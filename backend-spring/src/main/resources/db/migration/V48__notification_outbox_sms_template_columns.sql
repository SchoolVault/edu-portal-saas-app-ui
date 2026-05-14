ALTER TABLE notification_outbox
    ADD COLUMN sms_template_id VARCHAR(64) NULL AFTER body_html,
    ADD COLUMN sms_template_variables_json TEXT NULL AFTER sms_template_id;
