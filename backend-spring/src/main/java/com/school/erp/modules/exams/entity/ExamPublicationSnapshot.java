package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_publication_snapshots", indexes = {
        @Index(name = "idx_exam_snapshot_lookup", columnList = "tenant_id, exam_id, published_at, is_deleted")
})
public class ExamPublicationSnapshot extends BaseEntity {
    @Column(name = "exam_id", nullable = false)
    private Long examId;
    @Column(name = "version_no", nullable = false)
    private Integer versionNo;
    @Column(name = "snapshot_type", nullable = false, length = 40)
    private String snapshotType;
    @Column(name = "snapshot_json", nullable = false, columnDefinition = "json")
    private String snapshotJson;
    @Column(length = 500)
    private String note;
    @Column(name = "published_by_user_id")
    private Long publishedByUserId;
    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }
    public Integer getVersionNo() { return versionNo; }
    public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
    public String getSnapshotType() { return snapshotType; }
    public void setSnapshotType(String snapshotType) { this.snapshotType = snapshotType; }
    public String getSnapshotJson() { return snapshotJson; }
    public void setSnapshotJson(String snapshotJson) { this.snapshotJson = snapshotJson; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Long getPublishedByUserId() { return publishedByUserId; }
    public void setPublishedByUserId(Long publishedByUserId) { this.publishedByUserId = publishedByUserId; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
}
