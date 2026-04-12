-- Idempotent storage for payment provider webhooks (Razorpay, etc.)

CREATE TABLE payment_webhook_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64),
    provider VARCHAR(32) NOT NULL,
    payload_sha256 CHAR(64) NOT NULL,
    external_event_id VARCHAR(255),
    status VARCHAR(32) NOT NULL,
    http_status SMALLINT,
    detail VARCHAR(512),
    raw_body MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    UNIQUE KEY uk_provider_payload_hash (provider, payload_sha256),
    INDEX idx_pwe_tenant_created (tenant_id, created_at),
    INDEX idx_pwe_provider_event (provider, external_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
