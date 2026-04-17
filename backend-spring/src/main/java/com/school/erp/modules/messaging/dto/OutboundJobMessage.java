package com.school.erp.modules.messaging.dto;

import java.util.List;
import java.util.Map;

/**
 * Async fan-out job (email/SMS/push) published after durable domain writes (e.g. bulk notifications).
 * Consumers live in worker processes; the API thread only enqueues.
 */
public class OutboundJobMessage {
    private String jobType;
    private String correlationId;
    private List<String> tenantIds;
    private String title;
    private String body;
    /** e.g. IN_APP, EMAIL, SMS — transport hints for downstream adapters */
    private List<String> channels;
    private Map<String, Object> metadata;

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }

    public List<String> getTenantIds() {
        return tenantIds;
    }

    public void setTenantIds(List<String> tenantIds) {
        this.tenantIds = tenantIds;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public List<String> getChannels() {
        return channels;
    }

    public void setChannels(List<String> channels) {
        this.channels = channels;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }
}
