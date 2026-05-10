package com.school.erp.modules.leave.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.Filter;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "leave_requests", indexes = {@Index(name = "idx_leave_tenant_status", columnList = "tenant_id, status"), @Index(name = "idx_leave_applicant", columnList = "tenant_id, applicant_user_id")})
public class LeaveRequest extends BaseEntity implements AcademicYearScopedEntity {

    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Override
    public Long getAcademicYearId() {
        return academicYearId;
    }

    @Override
    public void setAcademicYearId(Long academicYearId) {
        this.academicYearId = academicYearId;
    }


    @Column(name = "applicant_user_id", nullable = false)
    private Long applicantUserId;

    @Column(name = "applicant_role", nullable = false, length = 20)
    private String applicantRole;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "teacher_id")
    private Long teacherId;

    @Column(name = "leave_type", nullable = false, length = 50)
    private String leaveType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "day_unit", nullable = false, length = 20)
    private Enums.LeaveDayUnit dayUnit = Enums.LeaveDayUnit.FULL_DAY;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Enums.LeaveStatus status = Enums.LeaveStatus.PENDING;

    @Column(name = "approver_user_id")
    private Long approverUserId;

    @Column(name = "approver_remarks", length = 500)
    private String approverRemarks;

    @Column(name = "approval_step", nullable = false)
    private Integer approvalStep = 1;

    @Column(name = "approval_step_total", nullable = false)
    private Integer approvalStepTotal = 1;

    @Column(name = "approval_sla_due_at")
    private LocalDateTime approvalSlaDueAt;

    @Column(name = "approval_escalation_count", nullable = false)
    private Integer approvalEscalationCount = 0;

    @Column(name = "balance_snapshot_json", columnDefinition = "json")
    private String balanceSnapshotJson;

    public Long getApplicantUserId() {
        return applicantUserId;
    }

    public void setApplicantUserId(Long applicantUserId) {
        this.applicantUserId = applicantUserId;
    }

    public String getApplicantRole() {
        return applicantRole;
    }

    public void setApplicantRole(String applicantRole) {
        this.applicantRole = applicantRole;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Enums.LeaveDayUnit getDayUnit() {
        return dayUnit;
    }

    public void setDayUnit(Enums.LeaveDayUnit dayUnit) {
        this.dayUnit = dayUnit != null ? dayUnit : Enums.LeaveDayUnit.FULL_DAY;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Enums.LeaveStatus getStatus() {
        return status;
    }

    public void setStatus(Enums.LeaveStatus status) {
        this.status = status;
    }

    public Long getApproverUserId() {
        return approverUserId;
    }

    public void setApproverUserId(Long approverUserId) {
        this.approverUserId = approverUserId;
    }

    public String getApproverRemarks() {
        return approverRemarks;
    }

    public void setApproverRemarks(String approverRemarks) {
        this.approverRemarks = approverRemarks;
    }

    public String getBalanceSnapshotJson() {
        return balanceSnapshotJson;
    }

    public void setBalanceSnapshotJson(String balanceSnapshotJson) {
        this.balanceSnapshotJson = balanceSnapshotJson;
    }

    public Integer getApprovalStep() {
        return approvalStep;
    }

    public void setApprovalStep(Integer approvalStep) {
        this.approvalStep = approvalStep;
    }

    public Integer getApprovalStepTotal() {
        return approvalStepTotal;
    }

    public void setApprovalStepTotal(Integer approvalStepTotal) {
        this.approvalStepTotal = approvalStepTotal;
    }

    public LocalDateTime getApprovalSlaDueAt() {
        return approvalSlaDueAt;
    }

    public void setApprovalSlaDueAt(LocalDateTime approvalSlaDueAt) {
        this.approvalSlaDueAt = approvalSlaDueAt;
    }

    public Integer getApprovalEscalationCount() {
        return approvalEscalationCount;
    }

    public void setApprovalEscalationCount(Integer approvalEscalationCount) {
        this.approvalEscalationCount = approvalEscalationCount;
    }
}
