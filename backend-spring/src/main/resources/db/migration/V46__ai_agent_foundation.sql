CREATE TABLE IF NOT EXISTS ai_conversations (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    conversation_key VARCHAR(64) NOT NULL,
    started_by_user_id BIGINT NOT NULL,
    started_by_role VARCHAR(64) NOT NULL,
    module_key VARCHAR(100) NULL,
    title VARCHAR(255) NULL,
    is_active BIT(1) DEFAULT b'1',
    is_deleted BIT(1) DEFAULT b'0',
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    UNIQUE KEY uk_ai_conversation_key (conversation_key),
    KEY idx_ai_conversations_tenant_created (tenant_id, created_at),
    KEY idx_ai_conversations_tenant_user (tenant_id, started_by_user_id)
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    conversation_key VARCHAR(64) NOT NULL,
    sender_role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    token_count INT NULL,
    metadata_json TEXT NULL,
    is_active BIT(1) DEFAULT b'1',
    is_deleted BIT(1) DEFAULT b'0',
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    KEY idx_ai_messages_tenant_conv (tenant_id, conversation_key, id),
    KEY idx_ai_messages_tenant_created (tenant_id, created_at)
);

CREATE TABLE IF NOT EXISTS ai_tool_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    conversation_key VARCHAR(64) NOT NULL,
    message_key VARCHAR(64) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    status VARCHAR(32) NOT NULL,
    latency_ms BIGINT NULL,
    request_json TEXT NULL,
    response_json TEXT NULL,
    is_active BIT(1) DEFAULT b'1',
    is_deleted BIT(1) DEFAULT b'0',
    deleted_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    KEY idx_ai_tool_logs_tenant_conv (tenant_id, conversation_key, created_at),
    KEY idx_ai_tool_logs_tenant_tool (tenant_id, tool_name, created_at)
);

CREATE TABLE IF NOT EXISTS ai_audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    actor_user_id BIGINT NULL,
    actor_role VARCHAR(64) NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NULL,
    target_id VARCHAR(100) NULL,
    severity VARCHAR(32) NULL,
    metadata_json TEXT NULL,
    created_at DATETIME NULL,
    KEY idx_ai_audit_tenant_created (tenant_id, created_at),
    KEY idx_ai_audit_tenant_action (tenant_id, action, created_at)
);

CREATE TABLE IF NOT EXISTS ai_context_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    conversation_key VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    summary_text TEXT NULL,
    context_json TEXT NULL,
    token_budget INT NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    KEY idx_ai_context_tenant_conv (tenant_id, conversation_key),
    KEY idx_ai_context_tenant_expires (tenant_id, expires_at)
);

CREATE TABLE IF NOT EXISTS ai_usage_metrics (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    metric_date DATE NOT NULL,
    model_key VARCHAR(64) NOT NULL,
    total_requests BIGINT DEFAULT 0,
    total_input_tokens BIGINT DEFAULT 0,
    total_output_tokens BIGINT DEFAULT 0,
    total_tool_calls BIGINT DEFAULT 0,
    p95_latency_ms BIGINT DEFAULT 0,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    UNIQUE KEY uk_ai_usage_daily (tenant_id, metric_date, model_key),
    KEY idx_ai_usage_tenant_date (tenant_id, metric_date)
);

CREATE TABLE IF NOT EXISTS ai_prompt_templates (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    locale VARCHAR(16) NOT NULL,
    template_text TEXT NOT NULL,
    version INT DEFAULT 1,
    is_active BIT(1) DEFAULT b'1',
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    UNIQUE KEY uk_ai_template_tenant_key_locale (tenant_id, template_key, locale)
);
