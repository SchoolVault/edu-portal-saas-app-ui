package com.school.erp.modules.reports.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public class ReportModuleDTOs {
    public static class UpsertTemplateRequest {
        private Long id;
        @NotBlank
        private String templateCode;
        @NotBlank
        private String name;
        @NotBlank
        private String reportType;
        private String defaultFormat;
        private String packCode;
        private Map<String, Object> layoutConfig;
        private Map<String, Object> filterSchema;
        private List<Map<String, Object>> boardSections;
        private Map<String, Object> remarksConfig;
        private Map<String, Object> promotionConfig;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTemplateCode() { return templateCode; }
        public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getReportType() { return reportType; }
        public void setReportType(String reportType) { this.reportType = reportType; }
        public String getDefaultFormat() { return defaultFormat; }
        public void setDefaultFormat(String defaultFormat) { this.defaultFormat = defaultFormat; }
        public String getPackCode() { return packCode; }
        public void setPackCode(String packCode) { this.packCode = packCode; }
        public Map<String, Object> getLayoutConfig() { return layoutConfig; }
        public void setLayoutConfig(Map<String, Object> layoutConfig) { this.layoutConfig = layoutConfig; }
        public Map<String, Object> getFilterSchema() { return filterSchema; }
        public void setFilterSchema(Map<String, Object> filterSchema) { this.filterSchema = filterSchema; }
        public List<Map<String, Object>> getBoardSections() { return boardSections; }
        public void setBoardSections(List<Map<String, Object>> boardSections) { this.boardSections = boardSections; }
        public Map<String, Object> getRemarksConfig() { return remarksConfig; }
        public void setRemarksConfig(Map<String, Object> remarksConfig) { this.remarksConfig = remarksConfig; }
        public Map<String, Object> getPromotionConfig() { return promotionConfig; }
        public void setPromotionConfig(Map<String, Object> promotionConfig) { this.promotionConfig = promotionConfig; }
    }

    public static class TemplateResponse {
        private Long id;
        private String templateCode;
        private String name;
        private String reportType;
        private String defaultFormat;
        private String packCode;
        private Map<String, Object> layoutConfig;
        private Map<String, Object> filterSchema;
        private List<Map<String, Object>> boardSections;
        private Map<String, Object> remarksConfig;
        private Map<String, Object> promotionConfig;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTemplateCode() { return templateCode; }
        public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getReportType() { return reportType; }
        public void setReportType(String reportType) { this.reportType = reportType; }
        public String getDefaultFormat() { return defaultFormat; }
        public void setDefaultFormat(String defaultFormat) { this.defaultFormat = defaultFormat; }
        public String getPackCode() { return packCode; }
        public void setPackCode(String packCode) { this.packCode = packCode; }
        public Map<String, Object> getLayoutConfig() { return layoutConfig; }
        public void setLayoutConfig(Map<String, Object> layoutConfig) { this.layoutConfig = layoutConfig; }
        public Map<String, Object> getFilterSchema() { return filterSchema; }
        public void setFilterSchema(Map<String, Object> filterSchema) { this.filterSchema = filterSchema; }
        public List<Map<String, Object>> getBoardSections() { return boardSections; }
        public void setBoardSections(List<Map<String, Object>> boardSections) { this.boardSections = boardSections; }
        public Map<String, Object> getRemarksConfig() { return remarksConfig; }
        public void setRemarksConfig(Map<String, Object> remarksConfig) { this.remarksConfig = remarksConfig; }
        public Map<String, Object> getPromotionConfig() { return promotionConfig; }
        public void setPromotionConfig(Map<String, Object> promotionConfig) { this.promotionConfig = promotionConfig; }
    }

    public static class GenerateReportRequest {
        private Long templateId;
        @NotBlank
        private String reportType;
        @NotBlank
        private String format;
        private String requestId;
        private String scheduleAt;
        private Boolean async;
        private ShareDispatchConfig shareConfig;
        @NotNull
        private Map<String, Object> filters;
        public Long getTemplateId() { return templateId; }
        public void setTemplateId(Long templateId) { this.templateId = templateId; }
        public String getReportType() { return reportType; }
        public void setReportType(String reportType) { this.reportType = reportType; }
        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        public String getScheduleAt() { return scheduleAt; }
        public void setScheduleAt(String scheduleAt) { this.scheduleAt = scheduleAt; }
        public Boolean getAsync() { return async; }
        public void setAsync(Boolean async) { this.async = async; }
        public ShareDispatchConfig getShareConfig() { return shareConfig; }
        public void setShareConfig(ShareDispatchConfig shareConfig) { this.shareConfig = shareConfig; }
        public Map<String, Object> getFilters() { return filters; }
        public void setFilters(Map<String, Object> filters) { this.filters = filters; }
    }

    public static class ShareDispatchConfig {
        private List<String> channels;
        private List<String> targetRoles;
        private List<String> locales;
        private String templateCode;
        public List<String> getChannels() { return channels; }
        public void setChannels(List<String> channels) { this.channels = channels; }
        public List<String> getTargetRoles() { return targetRoles; }
        public void setTargetRoles(List<String> targetRoles) { this.targetRoles = targetRoles; }
        public List<String> getLocales() { return locales; }
        public void setLocales(List<String> locales) { this.locales = locales; }
        public String getTemplateCode() { return templateCode; }
        public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }
    }

    public static class ReportJobResponse {
        private Long id;
        private String requestId;
        private String reportType;
        private String format;
        private String status;
        private String fileName;
        private String contentType;
        private Long contentSizeBytes;
        private String generatedAt;
        private String createdAt;
        private String scheduleAt;
        private String nextRetryAt;
        private Integer attempts;
        private Integer maxAttempts;
        private String workflowState;
        private String workflowNote;
        private String approvedAt;
        private String publishedAt;
        private Long creatorUserId;
        private Long approverUserId;
        private Long publisherUserId;
        private String updatedAt;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        public String getReportType() { return reportType; }
        public void setReportType(String reportType) { this.reportType = reportType; }
        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        public Long getContentSizeBytes() { return contentSizeBytes; }
        public void setContentSizeBytes(Long contentSizeBytes) { this.contentSizeBytes = contentSizeBytes; }
        public String getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        public String getScheduleAt() { return scheduleAt; }
        public void setScheduleAt(String scheduleAt) { this.scheduleAt = scheduleAt; }
        public String getNextRetryAt() { return nextRetryAt; }
        public void setNextRetryAt(String nextRetryAt) { this.nextRetryAt = nextRetryAt; }
        public Integer getAttempts() { return attempts; }
        public void setAttempts(Integer attempts) { this.attempts = attempts; }
        public Integer getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
        public String getWorkflowState() { return workflowState; }
        public void setWorkflowState(String workflowState) { this.workflowState = workflowState; }
        public String getWorkflowNote() { return workflowNote; }
        public void setWorkflowNote(String workflowNote) { this.workflowNote = workflowNote; }
        public String getApprovedAt() { return approvedAt; }
        public void setApprovedAt(String approvedAt) { this.approvedAt = approvedAt; }
        public String getPublishedAt() { return publishedAt; }
        public void setPublishedAt(String publishedAt) { this.publishedAt = publishedAt; }
        public Long getCreatorUserId() { return creatorUserId; }
        public void setCreatorUserId(Long creatorUserId) { this.creatorUserId = creatorUserId; }
        public Long getApproverUserId() { return approverUserId; }
        public void setApproverUserId(Long approverUserId) { this.approverUserId = approverUserId; }
        public Long getPublisherUserId() { return publisherUserId; }
        public void setPublisherUserId(Long publisherUserId) { this.publisherUserId = publisherUserId; }
        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class WorkflowActionRequest {
        private String note;
        private String idempotencyKey;
        private String expectedUpdatedAt;
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
        public String getExpectedUpdatedAt() { return expectedUpdatedAt; }
        public void setExpectedUpdatedAt(String expectedUpdatedAt) { this.expectedUpdatedAt = expectedUpdatedAt; }
    }

    public static class PublicationSnapshotResponse {
        private Long id;
        private Integer versionNo;
        private String snapshotType;
        private String note;
        private String publishedAt;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Integer getVersionNo() { return versionNo; }
        public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
        public String getSnapshotType() { return snapshotType; }
        public void setSnapshotType(String snapshotType) { this.snapshotType = snapshotType; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getPublishedAt() { return publishedAt; }
        public void setPublishedAt(String publishedAt) { this.publishedAt = publishedAt; }
    }

    public static class RollbackSnapshotRequest {
        @NotNull
        private Integer versionNo;
        private String note;
        public Integer getVersionNo() { return versionNo; }
        public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class AnalyticsPackResponse {
        private String packCode;
        private List<Map<String, Object>> trendBands;
        private List<Map<String, Object>> laggingStudents;
        private List<Map<String, Object>> promotionEligibility;
        private Map<String, Object> guardrails;
        public String getPackCode() { return packCode; }
        public void setPackCode(String packCode) { this.packCode = packCode; }
        public List<Map<String, Object>> getTrendBands() { return trendBands; }
        public void setTrendBands(List<Map<String, Object>> trendBands) { this.trendBands = trendBands; }
        public List<Map<String, Object>> getLaggingStudents() { return laggingStudents; }
        public void setLaggingStudents(List<Map<String, Object>> laggingStudents) { this.laggingStudents = laggingStudents; }
        public List<Map<String, Object>> getPromotionEligibility() { return promotionEligibility; }
        public void setPromotionEligibility(List<Map<String, Object>> promotionEligibility) { this.promotionEligibility = promotionEligibility; }
        public Map<String, Object> getGuardrails() { return guardrails; }
        public void setGuardrails(Map<String, Object> guardrails) { this.guardrails = guardrails; }
    }

    public static class AnalyticsPackConfigRequest {
        @NotBlank
        private String packCode;
        @NotNull
        private Map<String, Object> config;
        @NotNull
        private Map<String, Object> formulas;
        public String getPackCode() { return packCode; }
        public void setPackCode(String packCode) { this.packCode = packCode; }
        public Map<String, Object> getConfig() { return config; }
        public void setConfig(Map<String, Object> config) { this.config = config; }
        public Map<String, Object> getFormulas() { return formulas; }
        public void setFormulas(Map<String, Object> formulas) { this.formulas = formulas; }
    }

    public static class AnalyticsPackConfigResponse {
        private Long id;
        private String packCode;
        private Map<String, Object> config;
        private Map<String, Object> formulas;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getPackCode() { return packCode; }
        public void setPackCode(String packCode) { this.packCode = packCode; }
        public Map<String, Object> getConfig() { return config; }
        public void setConfig(Map<String, Object> config) { this.config = config; }
        public Map<String, Object> getFormulas() { return formulas; }
        public void setFormulas(Map<String, Object> formulas) { this.formulas = formulas; }
    }

    public static class WorkflowEventLogResponse {
        private Long id;
        private String eventCode;
        private String fromState;
        private String toState;
        private Long actorUserId;
        private String actorRole;
        private String note;
        private String occurredAt;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getEventCode() { return eventCode; }
        public void setEventCode(String eventCode) { this.eventCode = eventCode; }
        public String getFromState() { return fromState; }
        public void setFromState(String fromState) { this.fromState = fromState; }
        public String getToState() { return toState; }
        public void setToState(String toState) { this.toState = toState; }
        public Long getActorUserId() { return actorUserId; }
        public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
        public String getActorRole() { return actorRole; }
        public void setActorRole(String actorRole) { this.actorRole = actorRole; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getOccurredAt() { return occurredAt; }
        public void setOccurredAt(String occurredAt) { this.occurredAt = occurredAt; }
    }

    public static class ShareDispatchResponse {
        private Long id;
        private String channel;
        private String targetRole;
        private String localeCode;
        private String status;
        private Integer attempts;
        private Integer deliveredCount;
        private String nextRetryAt;
        private String lastError;
        private String createdAt;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getLocaleCode() { return localeCode; }
        public void setLocaleCode(String localeCode) { this.localeCode = localeCode; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Integer getAttempts() { return attempts; }
        public void setAttempts(Integer attempts) { this.attempts = attempts; }
        public Integer getDeliveredCount() { return deliveredCount; }
        public void setDeliveredCount(Integer deliveredCount) { this.deliveredCount = deliveredCount; }
        public String getNextRetryAt() { return nextRetryAt; }
        public void setNextRetryAt(String nextRetryAt) { this.nextRetryAt = nextRetryAt; }
        public String getLastError() { return lastError; }
        public void setLastError(String lastError) { this.lastError = lastError; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }
}
