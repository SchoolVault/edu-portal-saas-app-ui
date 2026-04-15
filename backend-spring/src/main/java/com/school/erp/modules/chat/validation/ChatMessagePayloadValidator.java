package com.school.erp.modules.chat.validation;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.chat.entity.ChatMessage;
import org.springframework.util.StringUtils;

/**
 * Shared validation for persisted chat payloads (Mongo or JPA).
 */
public final class ChatMessagePayloadValidator {

    public static final int MAX_BODY_CHARS = 32_000;
    public static final int MAX_CLIENT_MESSAGE_ID_LEN = 80;
    public static final int MAX_SENDER_ROLE_LEN = 20;
    public static final int MAX_BODY_TYPE_LEN = 30;

    private ChatMessagePayloadValidator() {
    }

    public static void validateForSave(ChatMessage msg) {
        if (msg == null) {
            throw new BusinessException("Message is required");
        }
        if (!StringUtils.hasText(msg.getTenantId())) {
            throw new BusinessException("tenantId is required");
        }
        if (msg.getConversationId() == null || msg.getConversationId() <= 0) {
            throw new BusinessException("conversationId is required");
        }
        if (msg.getSenderUserId() == null || msg.getSenderUserId() <= 0) {
            throw new BusinessException("senderUserId is required");
        }
        if (!StringUtils.hasText(msg.getBody())) {
            throw new BusinessException("Message body is required");
        }
        if (msg.getBody().length() > MAX_BODY_CHARS) {
            throw new BusinessException("Message body exceeds maximum length (" + MAX_BODY_CHARS + " characters)");
        }
        if (msg.getSenderRole() != null && msg.getSenderRole().length() > MAX_SENDER_ROLE_LEN) {
            throw new BusinessException("senderRole is too long");
        }
        if (msg.getBodyType() != null && msg.getBodyType().length() > MAX_BODY_TYPE_LEN) {
            throw new BusinessException("bodyType is too long");
        }
        if (msg.getClientMessageId() != null && msg.getClientMessageId().length() > MAX_CLIENT_MESSAGE_ID_LEN) {
            throw new BusinessException("clientMessageId is too long");
        }
    }
}
