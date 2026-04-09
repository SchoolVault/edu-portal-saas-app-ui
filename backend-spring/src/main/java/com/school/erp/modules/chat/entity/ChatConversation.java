package com.school.erp.modules.chat.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "chat_conversations",
        indexes = {
                @Index(name = "idx_chat_conv_last", columnList = "tenant_id, last_message_at"),
                @Index(name = "idx_chat_conv_ctx", columnList = "tenant_id, context_type, context_id")
        }
)
public class ChatConversation extends BaseEntity {
    @Column(name = "type", nullable = false, length = 30)
    private String type; // direct | group | system

    @Column(name = "subject", length = 250)
    private String subject;

    @Column(name = "context_type", length = 40)
    private String contextType; // class | section | student | ticket | null

    @Column(name = "context_id")
    private Long contextId;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "last_message_preview", length = 400)
    private String lastMessagePreview;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getContextType() { return contextType; }
    public void setContextType(String contextType) { this.contextType = contextType; }
    public Long getContextId() { return contextId; }
    public void setContextId(Long contextId) { this.contextId = contextId; }
    public LocalDateTime getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(LocalDateTime lastMessageAt) { this.lastMessageAt = lastMessageAt; }
    public String getLastMessagePreview() { return lastMessagePreview; }
    public void setLastMessagePreview(String lastMessagePreview) { this.lastMessagePreview = lastMessagePreview; }
}

