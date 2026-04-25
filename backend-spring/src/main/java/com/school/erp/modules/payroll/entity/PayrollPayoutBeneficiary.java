package com.school.erp.modules.payroll.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "payroll_payout_beneficiaries",
        indexes = {
                @Index(name = "idx_ppb_tenant_teacher", columnList = "tenant_id, teacher_id"),
                @Index(name = "idx_ppb_tenant_provider", columnList = "tenant_id, provider")
        })
public class PayrollPayoutBeneficiary extends BaseEntity {

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(name = "contact_id", nullable = false, length = 80)
    private String contactId;

    @Column(name = "fund_account_id", nullable = false, length = 80)
    private String fundAccountId;

    @Column(name = "bank_fingerprint", nullable = false, length = 64)
    private String bankFingerprint;

    @Column(name = "account_masked", length = 24)
    private String accountMasked;

    @Column(name = "ifsc_code", length = 32)
    private String ifscCode;

    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }
    public String getFundAccountId() { return fundAccountId; }
    public void setFundAccountId(String fundAccountId) { this.fundAccountId = fundAccountId; }
    public String getBankFingerprint() { return bankFingerprint; }
    public void setBankFingerprint(String bankFingerprint) { this.bankFingerprint = bankFingerprint; }
    public String getAccountMasked() { return accountMasked; }
    public void setAccountMasked(String accountMasked) { this.accountMasked = accountMasked; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
}
