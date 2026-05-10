package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "hostel_booking_requests", indexes = {
        @Index(name = "idx_hbq_tenant_status", columnList = "tenant_id, status"),
        @Index(name = "idx_hbq_tenant_student", columnList = "tenant_id, student_id"),
        @Index(name = "idx_hbq_tenant_parent", columnList = "tenant_id, parent_user_id")
})
public class HostelBookingRequest extends BaseEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "parent_user_id")
    private Long parentUserId;
    @Column(name = "preferred_hostel_id")
    private Long preferredHostelId;
    @Column(name = "preferred_room_type", length = 40)
    private String preferredRoomType;
    @Column(name = "status", length = 20)
    private String status;
    @Column(name = "request_note", length = 400)
    private String requestNote;
    @Column(name = "decision_note", length = 400)
    private String decisionNote;
    @Column(name = "approved_allocation_id")
    private Long approvedAllocationId;

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public Long getParentUserId() { return parentUserId; }
    public void setParentUserId(Long parentUserId) { this.parentUserId = parentUserId; }
    public Long getPreferredHostelId() { return preferredHostelId; }
    public void setPreferredHostelId(Long preferredHostelId) { this.preferredHostelId = preferredHostelId; }
    public String getPreferredRoomType() { return preferredRoomType; }
    public void setPreferredRoomType(String preferredRoomType) { this.preferredRoomType = preferredRoomType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRequestNote() { return requestNote; }
    public void setRequestNote(String requestNote) { this.requestNote = requestNote; }
    public String getDecisionNote() { return decisionNote; }
    public void setDecisionNote(String decisionNote) { this.decisionNote = decisionNote; }
    public Long getApprovedAllocationId() { return approvedAllocationId; }
    public void setApprovedAllocationId(Long approvedAllocationId) { this.approvedAllocationId = approvedAllocationId; }
}
