package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "hostel_gate_pass_requests", indexes = {
        @Index(name = "idx_hgpr_tenant_status", columnList = "tenant_id, status"),
        @Index(name = "idx_hgpr_tenant_student", columnList = "tenant_id, student_id")
})
public class HostelGatePassRequest extends BaseEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    /** LEAVE_OUT, GATE_PASS */
    @Column(name = "request_type", length = 30)
    private String requestType;
    @Column(name = "status", length = 20)
    private String status;
    @Column(length = 400)
    private String reason;
    @Column(name = "out_at")
    private LocalDateTime outAt;
    @Column(name = "expected_in_at")
    private LocalDateTime expectedInAt;
    @Column(name = "actual_in_at")
    private LocalDateTime actualInAt;
    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    @Column(name = "approval_note", length = 300)
    private String approvalNote;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getOutAt() {
        return outAt;
    }

    public void setOutAt(LocalDateTime outAt) {
        this.outAt = outAt;
    }

    public LocalDateTime getExpectedInAt() {
        return expectedInAt;
    }

    public void setExpectedInAt(LocalDateTime expectedInAt) {
        this.expectedInAt = expectedInAt;
    }

    public LocalDateTime getActualInAt() {
        return actualInAt;
    }

    public void setActualInAt(LocalDateTime actualInAt) {
        this.actualInAt = actualInAt;
    }

    public Long getApprovedByUserId() {
        return approvedByUserId;
    }

    public void setApprovedByUserId(Long approvedByUserId) {
        this.approvedByUserId = approvedByUserId;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getApprovalNote() {
        return approvalNote;
    }

    public void setApprovalNote(String approvalNote) {
        this.approvalNote = approvalNote;
    }
}
