package com.school.erp.modules.ai.domain;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_messages")
public class AiMessage extends BaseEntity {
    @Column(name = "conversation_key", nullable = false, length = 64)
    private String conversationKey;
    @Column(name = "sender_role", nullable = false, length = 16)
    private String senderRole;
    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;
    @Column(name = "token_count")
    private Integer tokenCount;
    @Column(name = "metadata_json", columnDefinition = "text")
    private String metadataJson;

    public String getConversationKey() { return conversationKey; }
    public void setConversationKey(String conversationKey) { this.conversationKey = conversationKey; }
    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Integer getTokenCount() { return tokenCount; }
    public void setTokenCount(Integer tokenCount) { this.tokenCount = tokenCount; }
    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }
}
