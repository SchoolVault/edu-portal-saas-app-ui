package com.school.erp.modules.importexport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "canonical_export_jobs", indexes = {
        @Index(name = "idx_canonical_export_jobs_tenant_status", columnList = "tenant_id, status, is_deleted"),
        @Index(name = "idx_canonical_export_jobs_tenant_type_created", columnList = "tenant_id, export_type, created_at, is_deleted")
})
public class CanonicalExportJob extends BaseEntity {
    @Column(name = "export_type", nullable = false, length = 40)
    private String exportType;
    @Column(name = "status", nullable = false, length = 20)
    private String status = "QUEUED";
    @Column(name = "requested_by_user_id")
    private Long requestedByUserId;
    @Column(name = "file_name", length = 200)
    private String fileName;
    @Column(name = "content_type", length = 100)
    private String contentType;
    @Column(name = "content_size_bytes")
    private Long contentSizeBytes;
    @Column(name = "row_count")
    private Integer rowCount;
    @Lob
    @Column(name = "file_content", columnDefinition = "LONGBLOB")
    private byte[] fileContent;
    @Column(name = "error_message", length = 500)
    private String errorMessage;
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    public String getExportType() { return exportType; }
    public void setExportType(String exportType) { this.exportType = exportType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getRequestedByUserId() { return requestedByUserId; }
    public void setRequestedByUserId(Long requestedByUserId) { this.requestedByUserId = requestedByUserId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getContentSizeBytes() { return contentSizeBytes; }
    public void setContentSizeBytes(Long contentSizeBytes) { this.contentSizeBytes = contentSizeBytes; }
    public Integer getRowCount() { return rowCount; }
    public void setRowCount(Integer rowCount) { this.rowCount = rowCount; }
    public byte[] getFileContent() { return fileContent; }
    public void setFileContent(byte[] fileContent) { this.fileContent = fileContent; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }
}
