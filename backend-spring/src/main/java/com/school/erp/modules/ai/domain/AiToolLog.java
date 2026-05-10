package com.school.erp.modules.ai.domain;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_tool_logs")
public class AiToolLog extends BaseEntity {
    @Column(name = "conversation_key", nullable = false, length = 64)
    private String conversationKey;
    @Column(name = "message_key", nullable = false, length = 64)
    private String messageKey;
    @Column(name = "tool_name", nullable = false, length = 100)
    private String toolName;
    @Column(name = "status", nullable = false, length = 32)
    private String status;
    @Column(name = "latency_ms")
    private Long latencyMs;
    @Column(name = "request_json", columnDefinition = "text")
    private String requestJson;
    @Column(name = "response_json", columnDefinition = "text")
    private String responseJson;

    public String getConversationKey() { return conversationKey; }
    public void setConversationKey(String conversationKey) { this.conversationKey = conversationKey; }
    public String getMessageKey() { return messageKey; }
    public void setMessageKey(String messageKey) { this.messageKey = messageKey; }
    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
    public String getRequestJson() { return requestJson; }
    public void setRequestJson(String requestJson) { this.requestJson = requestJson; }
    public String getResponseJson() { return responseJson; }
    public void setResponseJson(String responseJson) { this.responseJson = responseJson; }
}
