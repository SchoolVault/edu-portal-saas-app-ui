package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hostel_billing_run_ledger", indexes = {
        @Index(name = "idx_hbrl_tenant_key", columnList = "tenant_id, idempotency_key"),
        @Index(name = "idx_hbrl_tenant_due", columnList = "tenant_id, due_date")
})
public class HostelBillingRunLedger extends BaseEntity {
    @Column(name = "idempotency_key", length = 120)
    private String idempotencyKey;
    @Column(name = "run_ref", length = 120)
    private String runRef;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(name = "status", length = 20)
    private String status;
    @Column(name = "queued_profiles")
    private Integer queuedProfiles;
    @Column(name = "note", length = 300)
    private String note;
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
    public String getRunRef() { return runRef; }
    public void setRunRef(String runRef) { this.runRef = runRef; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getQueuedProfiles() { return queuedProfiles; }
    public void setQueuedProfiles(Integer queuedProfiles) { this.queuedProfiles = queuedProfiles; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
