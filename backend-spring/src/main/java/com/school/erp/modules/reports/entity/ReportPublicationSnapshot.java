package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_publication_snapshots", indexes = {
        @Index(name = "idx_report_snapshot_job", columnList = "tenant_id, report_job_id, version_no, is_deleted")
})
public class ReportPublicationSnapshot extends BaseEntity {
    @Column(name = "report_job_id", nullable = false)
    private Long reportJobId;
    @Column(name = "version_no", nullable = false)
    private Integer versionNo;
    @Column(name = "snapshot_type", nullable = false, length = 30)
    private String snapshotType;
    @Column(name = "snapshot_json", nullable = false, columnDefinition = "json")
    private String snapshotJson;
    @Column(length = 500)
    private String note;
    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    public Long getReportJobId() { return reportJobId; }
    public void setReportJobId(Long reportJobId) { this.reportJobId = reportJobId; }
    public Integer getVersionNo() { return versionNo; }
    public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
    public String getSnapshotType() { return snapshotType; }
    public void setSnapshotType(String snapshotType) { this.snapshotType = snapshotType; }
    public String getSnapshotJson() { return snapshotJson; }
    public void setSnapshotJson(String snapshotJson) { this.snapshotJson = snapshotJson; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
}
