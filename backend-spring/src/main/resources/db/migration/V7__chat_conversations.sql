CREATE TABLE chat_conversations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    type VARCHAR(30) NOT NULL,
    subject VARCHAR(250) NULL,
    context_type VARCHAR(40) NULL,
    context_id BIGINT NULL,
    last_message_at DATETIME NULL,
    last_message_preview VARCHAR(400) NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_chat_conv_last ON chat_conversations (tenant_id, last_message_at);
CREATE INDEX idx_chat_conv_ctx ON chat_conversations (tenant_id, context_type, context_id);

CREATE TABLE chat_participants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    display_name VARCHAR(200) NULL,
    last_read_message_id BIGINT NULL,
    last_read_at DATETIME NULL,
    muted BIT DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uq_chat_participant ON chat_participants (tenant_id, conversation_id, user_id);
CREATE INDEX idx_chat_participant_user ON chat_participants (tenant_id, user_id);

CREATE TABLE chat_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    conversation_id BIGINT NOT NULL,
    sender_user_id BIGINT NOT NULL,
    sender_role VARCHAR(20) NOT NULL,
    sender_name VARCHAR(200) NULL,
    body TEXT NOT NULL,
    body_type VARCHAR(30) NOT NULL,
    client_message_id VARCHAR(80) NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_chat_msg_conv ON chat_messages (tenant_id, conversation_id, id);
CREATE INDEX idx_chat_msg_sender ON chat_messages (tenant_id, sender_user_id);

