package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_generation_jobs", indexes = {
        @Index(name = "idx_report_job_lookup", columnList = "tenant_id, report_type, created_at, is_deleted"),
        @Index(name = "idx_report_job_status", columnList = "tenant_id, status, is_deleted")
})
public class ReportGenerationJob extends BaseEntity {
    @Column(name = "request_id", nullable = false, length = 120)
    private String requestId;
    @Column(name = "template_id")
    private Long templateId;
    @Column(name = "report_type", nullable = false, length = 60)
    private String reportType;
    @Column(nullable = false, length = 20)
    private String format;
    @Column(name = "filter_json", columnDefinition = "json")
    private String filterJson;
    @Column(nullable = false, length = 20)
    private String status = "COMPLETED";
    @Column(name = "workflow_state", nullable = false, length = 30)
    private String workflowState = "DRAFT";
    @Column(name = "workflow_note", length = 500)
    private String workflowNote;
    @Column(name = "creator_user_id")
    private Long creatorUserId;
    @Column(name = "approver_user_id")
    private Long approverUserId;
    @Column(name = "publisher_user_id")
    private Long publisherUserId;
    @Column(name = "last_approve_idempotency_key", length = 120)
    private String lastApproveIdempotencyKey;
    @Column(name = "last_publish_idempotency_key", length = 120)
    private String lastPublishIdempotencyKey;
    @Column(name = "file_name", length = 180)
    private String fileName;
    @Column(name = "content_type", length = 100)
    private String contentType;
    @Column(name = "content_size_bytes")
    private Long contentSizeBytes;
    @Column(name = "storage_provider", length = 40)
    private String storageProvider;
    @Column(name = "file_storage_path", length = 500)
    private String fileStoragePath;
    @Lob
    @Column(name = "file_content", columnDefinition = "LONGBLOB")
    private byte[] fileContent;
    @Column(name = "last_error", length = 500)
    private String lastError;
    @Column(nullable = false)
    private Integer attempts = 0;
    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 3;
    @Column(name = "schedule_at")
    private LocalDateTime scheduleAt;
    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;
    @Column(name = "share_config_json", columnDefinition = "json")
    private String shareConfigJson;
    @Column(name = "generated_at")
    private LocalDateTime generatedAt;
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getFilterJson() {
        return filterJson;
    }

    public void setFilterJson(String filterJson) {
        this.filterJson = filterJson;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getWorkflowState() {
        return workflowState;
    }

    public void setWorkflowState(String workflowState) {
        this.workflowState = workflowState;
    }

    public String getWorkflowNote() {
        return workflowNote;
    }

    public void setWorkflowNote(String workflowNote) {
        this.workflowNote = workflowNote;
    }

    public Long getCreatorUserId() {
        return creatorUserId;
    }

    public void setCreatorUserId(Long creatorUserId) {
        this.creatorUserId = creatorUserId;
    }

    public Long getApproverUserId() {
        return approverUserId;
    }

    public void setApproverUserId(Long approverUserId) {
        this.approverUserId = approverUserId;
    }

    public Long getPublisherUserId() {
        return publisherUserId;
    }

    public void setPublisherUserId(Long publisherUserId) {
        this.publisherUserId = publisherUserId;
    }

    public String getLastApproveIdempotencyKey() {
        return lastApproveIdempotencyKey;
    }

    public void setLastApproveIdempotencyKey(String lastApproveIdempotencyKey) {
        this.lastApproveIdempotencyKey = lastApproveIdempotencyKey;
    }

    public String getLastPublishIdempotencyKey() {
        return lastPublishIdempotencyKey;
    }

    public void setLastPublishIdempotencyKey(String lastPublishIdempotencyKey) {
        this.lastPublishIdempotencyKey = lastPublishIdempotencyKey;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getContentSizeBytes() {
        return contentSizeBytes;
    }

    public void setContentSizeBytes(Long contentSizeBytes) {
        this.contentSizeBytes = contentSizeBytes;
    }

    public byte[] getFileContent() {
        return fileContent;
    }

    public void setFileContent(byte[] fileContent) {
        this.fileContent = fileContent;
    }

    public String getStorageProvider() {
        return storageProvider;
    }

    public void setStorageProvider(String storageProvider) {
        this.storageProvider = storageProvider;
    }

    public String getFileStoragePath() {
        return fileStoragePath;
    }

    public void setFileStoragePath(String fileStoragePath) {
        this.fileStoragePath = fileStoragePath;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public LocalDateTime getScheduleAt() {
        return scheduleAt;
    }

    public void setScheduleAt(LocalDateTime scheduleAt) {
        this.scheduleAt = scheduleAt;
    }

    public LocalDateTime getNextRetryAt() {
        return nextRetryAt;
    }

    public void setNextRetryAt(LocalDateTime nextRetryAt) {
        this.nextRetryAt = nextRetryAt;
    }

    public String getShareConfigJson() {
        return shareConfigJson;
    }

    public void setShareConfigJson(String shareConfigJson) {
        this.shareConfigJson = shareConfigJson;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }
}
