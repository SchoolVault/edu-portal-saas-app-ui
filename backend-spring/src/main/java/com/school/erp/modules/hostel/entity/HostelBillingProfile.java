package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "hostel_billing_profiles", indexes = {
        @Index(name = "idx_hbp_tenant_student", columnList = "tenant_id, student_id"),
        @Index(name = "idx_hbp_tenant_due", columnList = "tenant_id, next_due_date")
})
public class HostelBillingProfile extends BaseEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "fee_structure_id", nullable = false)
    private Long feeStructureId;
    /** MONTHLY, TERM, ANNUAL */
    @Column(name = "billing_cadence", length = 20)
    private String billingCadence;
    @Column(name = "deposit_amount", precision = 12, scale = 2)
    private BigDecimal depositAmount;
    @Column(name = "mess_charge_amount", precision = 12, scale = 2)
    private BigDecimal messChargeAmount;
    @Column(name = "auto_invoice_enabled")
    private Boolean autoInvoiceEnabled = Boolean.TRUE;
    @Column(name = "last_invoice_date")
    private LocalDate lastInvoiceDate;
    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

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

    public Long getFeeStructureId() {
        return feeStructureId;
    }

    public void setFeeStructureId(Long feeStructureId) {
        this.feeStructureId = feeStructureId;
    }

    public String getBillingCadence() {
        return billingCadence;
    }

    public void setBillingCadence(String billingCadence) {
        this.billingCadence = billingCadence;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public BigDecimal getMessChargeAmount() {
        return messChargeAmount;
    }

    public void setMessChargeAmount(BigDecimal messChargeAmount) {
        this.messChargeAmount = messChargeAmount;
    }

    public Boolean getAutoInvoiceEnabled() {
        return autoInvoiceEnabled;
    }

    public void setAutoInvoiceEnabled(Boolean autoInvoiceEnabled) {
        this.autoInvoiceEnabled = autoInvoiceEnabled;
    }

    public LocalDate getLastInvoiceDate() {
        return lastInvoiceDate;
    }

    public void setLastInvoiceDate(LocalDate lastInvoiceDate) {
        this.lastInvoiceDate = lastInvoiceDate;
    }

    public LocalDate getNextDueDate() {
        return nextDueDate;
    }

    public void setNextDueDate(LocalDate nextDueDate) {
        this.nextDueDate = nextDueDate;
    }
}
