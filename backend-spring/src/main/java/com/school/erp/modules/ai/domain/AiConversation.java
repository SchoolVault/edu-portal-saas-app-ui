package com.school.erp.modules.ai.domain;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_conversations")
public class AiConversation extends BaseEntity {
    @Column(name = "conversation_key", nullable = false, length = 64, unique = true)
    private String conversationKey;
    @Column(name = "started_by_user_id", nullable = false)
    private Long startedByUserId;
    @Column(name = "started_by_role", nullable = false, length = 64)
    private String startedByRole;
    @Column(name = "module_key", length = 100)
    private String moduleKey;
    @Column(name = "title", length = 255)
    private String title;

    public String getConversationKey() { return conversationKey; }
    public void setConversationKey(String conversationKey) { this.conversationKey = conversationKey; }
    public Long getStartedByUserId() { return startedByUserId; }
    public void setStartedByUserId(Long startedByUserId) { this.startedByUserId = startedByUserId; }
    public String getStartedByRole() { return startedByRole; }
    public void setStartedByRole(String startedByRole) { this.startedByRole = startedByRole; }
    public String getModuleKey() { return moduleKey; }
    public void setModuleKey(String moduleKey) { this.moduleKey = moduleKey; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
