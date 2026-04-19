package com.school.erp.modules.leave.dto;

import com.school.erp.common.enums.Enums;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * REST contract for {@code /api/v1/leave/**}. Use stable enum names in JSON for status, dayUnit, and leaveType;
 * localized strings belong in the client only.
 */
public final class LeaveDTOs {

    private LeaveDTOs() {
    }

    public static class CreateLeaveRequest {
        @NotBlank
        @Schema(
                description = "Stable leave type code (uppercase).",
                allowableValues = {"ANNUAL", "SICK", "CASUAL", "EMERGENCY", "OTHER"},
                example = "ANNUAL")
        private String leaveType;
        @NotNull
        private LocalDate startDate;
        @NotNull
        private LocalDate endDate;
        @Schema(description = "Required detail when leaveType is OTHER; optional otherwise.")
        private String reason;
        private Long studentId;
        private Long teacherId;
        private String balanceSnapshotJson;
        @Schema(description = "Session coverage for this request")
        private Enums.LeaveDayUnit dayUnit;

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

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
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

        public String getBalanceSnapshotJson() {
            return balanceSnapshotJson;
        }

        public void setBalanceSnapshotJson(String balanceSnapshotJson) {
            this.balanceSnapshotJson = balanceSnapshotJson;
        }

        public Enums.LeaveDayUnit getDayUnit() {
            return dayUnit;
        }

        public void setDayUnit(Enums.LeaveDayUnit dayUnit) {
            this.dayUnit = dayUnit;
        }
    }

    public static class ApproveLeaveRequest {
        private boolean approve;
        private String approverRemarks;

        public boolean isApprove() {
            return approve;
        }

        public void setApprove(boolean approve) {
            this.approve = approve;
        }

        public String getApproverRemarks() {
            return approverRemarks;
        }

        public void setApproverRemarks(String approverRemarks) {
            this.approverRemarks = approverRemarks;
        }
    }

    public static class LeaveResponse {
        private Long id;
        private Long applicantUserId;
        private String applicantRole;
        @Schema(description = "Resolved directory name for the applicant user (tenant-scoped).")
        private String applicantDisplayName;
        private Long studentId;
        private Long teacherId;
        @Schema(
                description = "Stable leave type code as stored in the tenant DB.",
                allowableValues = {"ANNUAL", "SICK", "CASUAL", "EMERGENCY", "OTHER"})
        private String leaveType;
        private LocalDate startDate;
        private LocalDate endDate;
        private String reason;
        @Schema(description = "Workflow status", implementation = Enums.LeaveStatus.class)
        private Enums.LeaveStatus status;
        private Long approverUserId;
        private String approverRemarks;
        @Schema(implementation = Enums.LeaveDayUnit.class)
        private Enums.LeaveDayUnit dayUnit;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

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

        public String getApplicantDisplayName() {
            return applicantDisplayName;
        }

        public void setApplicantDisplayName(String applicantDisplayName) {
            this.applicantDisplayName = applicantDisplayName;
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

        public Enums.LeaveDayUnit getDayUnit() {
            return dayUnit;
        }

        public void setDayUnit(Enums.LeaveDayUnit dayUnit) {
            this.dayUnit = dayUnit;
        }
    }

    /** Policy buckets for UI; values can later be driven by tenant HR rules. */
    public static class LeaveBalanceSummary {
        private int annualEntitled = 24;
        private int annualUsed = 0;
        private int sickEntitled = 12;
        private int sickUsed = 0;
        private int casualEntitled = 12;
        private int casualUsed = 0;

        public int getAnnualEntitled() {
            return annualEntitled;
        }

        public void setAnnualEntitled(int annualEntitled) {
            this.annualEntitled = annualEntitled;
        }

        public int getAnnualUsed() {
            return annualUsed;
        }

        public void setAnnualUsed(int annualUsed) {
            this.annualUsed = annualUsed;
        }

        public int getSickEntitled() {
            return sickEntitled;
        }

        public void setSickEntitled(int sickEntitled) {
            this.sickEntitled = sickEntitled;
        }

        public int getSickUsed() {
            return sickUsed;
        }

        public void setSickUsed(int sickUsed) {
            this.sickUsed = sickUsed;
        }

        public int getCasualEntitled() {
            return casualEntitled;
        }

        public void setCasualEntitled(int casualEntitled) {
            this.casualEntitled = casualEntitled;
        }

        public int getCasualUsed() {
            return casualUsed;
        }

        public void setCasualUsed(int casualUsed) {
            this.casualUsed = casualUsed;
        }
    }

    /**
     * Tenant leave policy — same JSON shape as Angular {@code LeaveEntitlementPolicy} ({@code annualEntitled}, etc.).
     */
    public static class LeaveEntitlementPolicy {
        @Min(0)
        @Max(366)
        @Schema(description = "Annual leave days per policy cycle", example = "24")
        private int annualEntitled = 24;
        @Min(0)
        @Max(366)
        @Schema(description = "Sick leave days per policy cycle", example = "12")
        private int sickEntitled = 12;
        @Min(0)
        @Max(366)
        @Schema(description = "Casual leave days per policy cycle", example = "12")
        private int casualEntitled = 12;
        @Size(max = 120)
        @Schema(description = "Display label only, e.g. academic year", example = "2025–2026")
        private String policyYearLabel;

        public int getAnnualEntitled() {
            return annualEntitled;
        }

        public void setAnnualEntitled(int annualEntitled) {
            this.annualEntitled = annualEntitled;
        }

        public int getSickEntitled() {
            return sickEntitled;
        }

        public void setSickEntitled(int sickEntitled) {
            this.sickEntitled = sickEntitled;
        }

        public int getCasualEntitled() {
            return casualEntitled;
        }

        public void setCasualEntitled(int casualEntitled) {
            this.casualEntitled = casualEntitled;
        }

        public String getPolicyYearLabel() {
            return policyYearLabel;
        }

        public void setPolicyYearLabel(String policyYearLabel) {
            this.policyYearLabel = policyYearLabel;
        }
    }
}
