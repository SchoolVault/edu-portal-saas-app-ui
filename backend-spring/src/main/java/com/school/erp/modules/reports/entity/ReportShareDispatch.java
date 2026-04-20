package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_share_dispatches", indexes = {
        @Index(name = "idx_report_share_dispatch", columnList = "tenant_id, status, next_retry_at, is_deleted"),
        @Index(name = "idx_report_share_job", columnList = "tenant_id, report_job_id, is_deleted")
})
public class ReportShareDispatch extends BaseEntity {
    @Column(name = "report_job_id", nullable = false)
    private Long reportJobId;
    @Column(nullable = false, length = 20)
    private String channel;
    @Column(name = "target_role", nullable = false, length = 40)
    private String targetRole;
    @Column(name = "locale_code", nullable = false, length = 10)
    private String localeCode;
    @Column(name = "template_code", length = 80)
    private String templateCode;
    @Column(nullable = false, length = 20)
    private String status = "PENDING";
    @Column(nullable = false)
    private Integer attempts = 0;
    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 5;
    @Column(name = "next_retry_at")
    private LocalDateTime nextRetryAt;
    @Column(name = "delivered_count")
    private Integer deliveredCount = 0;
    @Column(name = "last_error", length = 500)
    private String lastError;

    public Long getReportJobId() { return reportJobId; }
    public void setReportJobId(Long reportJobId) { this.reportJobId = reportJobId; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public String getLocaleCode() { return localeCode; }
    public void setLocaleCode(String localeCode) { this.localeCode = localeCode; }
    public String getTemplateCode() { return templateCode; }
    public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getAttempts() { return attempts; }
    public void setAttempts(Integer attempts) { this.attempts = attempts; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public LocalDateTime getNextRetryAt() { return nextRetryAt; }
    public void setNextRetryAt(LocalDateTime nextRetryAt) { this.nextRetryAt = nextRetryAt; }
    public Integer getDeliveredCount() { return deliveredCount; }
    public void setDeliveredCount(Integer deliveredCount) { this.deliveredCount = deliveredCount; }
    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }
}
