package com.school.erp.modules.leave.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(
        name = "leave_entitlement_ledger",
        indexes = {
                @Index(name = "idx_leave_ledger_tenant_user_type_year", columnList = "tenant_id, user_id, leave_type, policy_year_label, is_deleted"),
                @Index(name = "idx_leave_ledger_tenant_reference", columnList = "tenant_id, reference_type, reference_id, is_deleted"),
                @Index(name = "idx_leave_ledger_tenant_created", columnList = "tenant_id, created_at, is_deleted")
        }
)
public class LeaveEntitlementLedgerEntry extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "leave_type", nullable = false, length = 32)
    private String leaveType;

    @Column(name = "policy_year_label", length = 120)
    private String policyYearLabel;

    @Column(name = "entry_type", nullable = false, length = 32)
    private String entryType;

    @Column(name = "signed_units", nullable = false)
    private Integer signedUnits;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "reference_type", length = 64)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(String leaveType) {
        this.leaveType = leaveType;
    }

    public String getPolicyYearLabel() {
        return policyYearLabel;
    }

    public void setPolicyYearLabel(String policyYearLabel) {
        this.policyYearLabel = policyYearLabel;
    }

    public String getEntryType() {
        return entryType;
    }

    public void setEntryType(String entryType) {
        this.entryType = entryType;
    }

    public Integer getSignedUnits() {
        return signedUnits;
    }

    public void setSignedUnits(Integer signedUnits) {
        this.signedUnits = signedUnits;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }
}
