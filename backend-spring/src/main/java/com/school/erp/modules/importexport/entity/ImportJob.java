package com.school.erp.modules.importexport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "import_jobs", indexes = {
        @Index(name = "idx_import_jobs_tenant_created", columnList = "tenant_id, created_at"),
        @Index(name = "idx_import_jobs_status", columnList = "tenant_id, status")
})
public class ImportJob extends BaseEntity {

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "job_type", nullable = false, length = 40)
    private String jobType;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "original_filename", length = 512)
    private String originalFilename;

    @Column(name = "total_rows", nullable = false)
    private Integer totalRows = 0;

    @Column(name = "success_count", nullable = false)
    private Integer successCount = 0;

    @Column(name = "fail_count", nullable = false)
    private Integer failCount = 0;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "summary_message", length = 4000)
    private String summaryMessage;

    /** SHA-256 hex of raw uploaded file bytes (idempotent submit). */
    @Column(name = "payload_hash", length = 64)
    private String payloadHash;

    /** SHA-256 hex of normalized column mapping JSON; empty mapping uses hash of empty string. */
    @Column(name = "column_mapping_hash", nullable = false, length = 64)
    private String columnMappingHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    /** {@link com.school.erp.modules.importexport.ImportExecutionMode} name. */
    @Column(name = "execution_mode", nullable = false, length = 32)
    private String executionMode = "BEST_EFFORT";

    /** True when submit explicitly requested same-file reprocess (idempotent replay bypass). */
    @Column(name = "reprocess_requested", nullable = false)
    private Boolean reprocessRequested = false;

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getJobType() {
        return jobType;
    }

    public void setJobType(String jobType) {
        this.jobType = jobType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public Integer getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(Integer totalRows) {
        this.totalRows = totalRows;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getFailCount() {
        return failCount;
    }

    public void setFailCount(Integer failCount) {
        this.failCount = failCount;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(LocalDateTime finishedAt) {
        this.finishedAt = finishedAt;
    }

    public String getSummaryMessage() {
        return summaryMessage;
    }

    public void setSummaryMessage(String summaryMessage) {
        this.summaryMessage = summaryMessage;
    }

    public String getPayloadHash() {
        return payloadHash;
    }

    public void setPayloadHash(String payloadHash) {
        this.payloadHash = payloadHash;
    }

    public String getColumnMappingHash() {
        return columnMappingHash;
    }

    public void setColumnMappingHash(String columnMappingHash) {
        this.columnMappingHash = columnMappingHash;
    }

    public String getExecutionMode() {
        return executionMode;
    }

    public void setExecutionMode(String executionMode) {
        this.executionMode = executionMode;
    }

    public Boolean getReprocessRequested() {
        return reprocessRequested;
    }

    public void setReprocessRequested(Boolean reprocessRequested) {
        this.reprocessRequested = reprocessRequested;
    }
}
