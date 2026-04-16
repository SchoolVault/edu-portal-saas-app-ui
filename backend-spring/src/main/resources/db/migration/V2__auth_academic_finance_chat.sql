-- =============================================================================
-- Flyway V2 — Auth extensions, exams, fees, and chat foundations
--
-- Expands users/roles, exam lifecycle, fee structures/payments, chat rooms/messages.
-- =============================================================================

-- -------------------------------------------------------------------------
-- Legacy source: V2__auth_exams_fees_chat.sql
-- Auth, exams, fees, chat (old V2).
-- -------------------------------------------------------------------------

-- >>> Legacy V5: V5__exam_class_scope.sql
CREATE TABLE IF NOT EXISTS exam_classes (
    exam_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    PRIMARY KEY (exam_id, class_id),
    CONSTRAINT fk_exam_classes_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- >>> Legacy V6: V6__fee_payment_checkout.sql
CREATE TABLE fee_payment_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    fee_payment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    parent_user_id BIGINT NOT NULL,
    provider VARCHAR(40) NOT NULL,
    provider_order_id VARCHAR(100) NOT NULL,
    provider_payment_id VARCHAR(100) NULL,
    checkout_token VARCHAR(120) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    return_url VARCHAR(300) NULL,
    gateway_payload TEXT NULL,
    initiated_at DATETIME NULL,
    completed_at DATETIME NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_fpa_payment ON fee_payment_attempts (tenant_id, fee_payment_id);
CREATE INDEX idx_fpa_student ON fee_payment_attempts (tenant_id, student_id);
CREATE INDEX idx_fpa_status ON fee_payment_attempts (tenant_id, status);

-- >>> Legacy V7: V7__chat_conversations.sql
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

-- >>> Legacy V8: V8__announcement_target_section.sql
ALTER TABLE announcements
    ADD COLUMN target_section_id BIGINT NULL AFTER target_class_id;

CREATE INDEX idx_ann_target ON announcements (tenant_id, target_audience, target_class_id, target_section_id);
