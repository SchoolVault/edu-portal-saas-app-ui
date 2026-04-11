-- Transactional outbox for SMS/WhatsApp (mock worker marks SENT) + salary disbursement audit rows.

CREATE TABLE notification_outbox (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    recipient_user_id BIGINT NULL,
    recipient_phone_e164 VARCHAR(24) NULL,
    subject VARCHAR(200) NULL,
    body_text TEXT NOT NULL,
    dedupe_key VARCHAR(200) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INT NOT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    correlation_id VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_no_tenant_status_created (tenant_id, status, created_at),
    INDEX idx_no_tenant_event (tenant_id, event_type),
    UNIQUE KEY uq_no_dedupe (tenant_id, dedupe_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE salary_disbursement_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    payslip_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    reference_id VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    gateway_payload TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sda_tenant_teacher (tenant_id, teacher_id),
    INDEX idx_sda_payslip (tenant_id, payslip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Demo rows for QA tenant t1 (processed = mock history + one pending for worker smoke test)
SET @demo_tenant := 't1';
INSERT INTO notification_outbox (
    tenant_id, event_type, channel, recipient_user_id, recipient_phone_e164, subject, body_text, dedupe_key, status, attempts, processed_at, is_deleted
)
SELECT @demo_tenant, 'ANNOUNCEMENT_SMS', 'SMS', u.id, u.phone, 'Demo seed',
       'School ERP demo: outbox row (already sent).', CONCAT('seed:sms:', u.id), 'SENT', 1, NOW(), FALSE
FROM users u
WHERE u.tenant_id = @demo_tenant AND u.email = 'parent@school.com' AND u.phone IS NOT NULL AND u.phone <> ''
LIMIT 1;

INSERT INTO notification_outbox (
    tenant_id, event_type, channel, recipient_user_id, recipient_phone_e164, subject, body_text, dedupe_key, status, attempts, is_deleted
)
SELECT @demo_tenant, 'FEE_REMINDER', 'WHATSAPP', u.id, u.phone, 'Fee reminder (demo)',
       'Demo pending WhatsApp fee reminder — mock worker will mark SENT.', 'seed:fee:wa:pending', 'PENDING', 0, FALSE
FROM users u
WHERE u.tenant_id = @demo_tenant AND u.email = 'parent@school.com' AND u.phone IS NOT NULL AND u.phone <> ''
LIMIT 1;
