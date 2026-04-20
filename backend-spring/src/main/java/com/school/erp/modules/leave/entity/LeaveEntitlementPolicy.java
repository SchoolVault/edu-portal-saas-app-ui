package com.school.erp.modules.leave.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Per-tenant leave bucket entitlements (annual / sick / casual). One active row per tenant.
 */
@Entity
@Table(name = "leave_entitlement_policies")
public class LeaveEntitlementPolicy extends BaseEntity {

    @Column(name = "annual_entitled", nullable = false)
    private int annualEntitled = 24;

    @Column(name = "sick_entitled", nullable = false)
    private int sickEntitled = 12;

    @Column(name = "casual_entitled", nullable = false)
    private int casualEntitled = 12;

    @Column(name = "policy_year_label", length = 120)
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
