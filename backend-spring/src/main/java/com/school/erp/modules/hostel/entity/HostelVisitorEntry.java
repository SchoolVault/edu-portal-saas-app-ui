package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "hostel_visitor_entries", indexes = {
        @Index(name = "idx_hve_tenant_status", columnList = "tenant_id, status"),
        @Index(name = "idx_hve_tenant_student", columnList = "tenant_id, student_id")
})
public class HostelVisitorEntry extends BaseEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "visitor_name", length = 200)
    private String visitorName;
    @Column(name = "relation_label", length = 80)
    private String relationLabel;
    @Column(name = "visitor_phone", length = 30)
    private String visitorPhone;
    @Column(length = 250)
    private String purpose;
    /** PENDING, APPROVED, REJECTED, CHECKED_OUT */
    @Column(length = 20)
    private String status;
    @Column(name = "check_in_at")
    private LocalDateTime checkInAt;
    @Column(name = "check_out_at")
    private LocalDateTime checkOutAt;
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

    public String getVisitorName() {
        return visitorName;
    }

    public void setVisitorName(String visitorName) {
        this.visitorName = visitorName;
    }

    public String getRelationLabel() {
        return relationLabel;
    }

    public void setRelationLabel(String relationLabel) {
        this.relationLabel = relationLabel;
    }

    public String getVisitorPhone() {
        return visitorPhone;
    }

    public void setVisitorPhone(String visitorPhone) {
        this.visitorPhone = visitorPhone;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCheckInAt() {
        return checkInAt;
    }

    public void setCheckInAt(LocalDateTime checkInAt) {
        this.checkInAt = checkInAt;
    }

    public LocalDateTime getCheckOutAt() {
        return checkOutAt;
    }

    public void setCheckOutAt(LocalDateTime checkOutAt) {
        this.checkOutAt = checkOutAt;
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
