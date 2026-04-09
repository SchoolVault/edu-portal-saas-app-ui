package com.school.erp.modules.chat.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "chat_messages",
        indexes = {
                @Index(name = "idx_chat_msg_conv", columnList = "tenant_id, conversation_id, id"),
                @Index(name = "idx_chat_msg_sender", columnList = "tenant_id, sender_user_id")
        }
)
public class ChatMessage extends BaseEntity {
    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_user_id", nullable = false)
    private Long senderUserId;

    @Column(name = "sender_role", nullable = false, length = 20)
    private String senderRole;

    @Column(name = "sender_name", length = 200)
    private String senderName;

    @Column(name = "body", columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(name = "body_type", nullable = false, length = 30)
    private String bodyType; // text | system | attachment

    @Column(name = "client_message_id", length = 80)
    private String clientMessageId;

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }
    public Long getSenderUserId() { return senderUserId; }
    public void setSenderUserId(Long senderUserId) { this.senderUserId = senderUserId; }
    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }
    public String getClientMessageId() { return clientMessageId; }
    public void setClientMessageId(String clientMessageId) { this.clientMessageId = clientMessageId; }
}

