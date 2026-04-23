CREATE TABLE communication_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(40) NOT NULL,
    audience_scope VARCHAR(20) NOT NULL,
    target_class_id BIGINT,
    target_section_id BIGINT,
    publish_at DATETIME(6),
    published_at DATETIME(6),
    event_start_at DATETIME(6) NOT NULL,
    event_end_at DATETIME(6),
    timezone VARCHAR(60) NOT NULL,
    location VARCHAR(200),
    locale_code VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(20) NOT NULL,
    completed_at DATETIME(6),
    cancelled_at DATETIME(6),
    reminder_1d_sent_at DATETIME(6),
    reminder_1h_sent_at DATETIME(6),
    published_campaign_id VARCHAR(80),
    reminder_1d_campaign_id VARCHAR(80),
    reminder_1h_campaign_id VARCHAR(80)
);

CREATE INDEX idx_comm_evt_tenant_status_start
    ON communication_events (tenant_id, status, event_start_at);

CREATE INDEX idx_comm_evt_tenant_aud_start
    ON communication_events (tenant_id, audience_scope, event_start_at);

CREATE INDEX idx_comm_evt_tenant_publish_status
    ON communication_events (tenant_id, publish_at, status);
