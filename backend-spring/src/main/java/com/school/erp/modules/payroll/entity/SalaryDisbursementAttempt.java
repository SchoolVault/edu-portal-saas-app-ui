package com.school.erp.modules.payroll.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "salary_disbursement_attempts",
        indexes = {
                @Index(name = "idx_sda_tenant_teacher", columnList = "tenant_id, teacher_id"),
                @Index(name = "idx_sda_payslip", columnList = "tenant_id, payslip_id")
        })
public class SalaryDisbursementAttempt extends BaseEntity {

    @Column(name = "payslip_id", nullable = false)
    private Long payslipId;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 32)
    private String paymentMethod;

    @Column(name = "reference_id", nullable = false, length = 80)
    private String referenceId;

    @Column(nullable = false, length = 20)
    private String status = "SUBMITTED";

    @Column(name = "gateway_payload", columnDefinition = "TEXT")
    private String gatewayPayload;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public Long getPayslipId() {
        return payslipId;
    }

    public void setPayslipId(Long payslipId) {
        this.payslipId = payslipId;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGatewayPayload() {
        return gatewayPayload;
    }

    public void setGatewayPayload(String gatewayPayload) {
        this.gatewayPayload = gatewayPayload;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
