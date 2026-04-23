package com.school.erp.modules.fees.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "fee_payment_attempts",
        indexes = {
                @Index(name = "idx_fpa_payment", columnList = "tenant_id, fee_payment_id"),
                @Index(name = "idx_fpa_student", columnList = "tenant_id, student_id"),
                @Index(name = "idx_fpa_status", columnList = "tenant_id, status")
        }
)
public class FeePaymentAttempt extends BaseEntity {
    @Column(name = "fee_payment_id", nullable = false)
    private Long feePaymentId;
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "parent_user_id", nullable = false)
    private Long parentUserId;
    @Column(name = "provider", nullable = false, length = 40)
    private String provider;
    @Column(name = "provider_order_id", nullable = false, length = 100)
    private String providerOrderId;
    @Column(name = "provider_payment_id", length = 100)
    private String providerPaymentId;
    @Column(name = "operation_key", length = 120)
    private String operationKey;
    @Column(name = "checkout_token", nullable = false, length = 120)
    private String checkoutToken;
    @Column(name = "currency", nullable = false, length = 10)
    private String currency;
    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "status", nullable = false, length = 20)
    private String status;
    @Column(name = "return_url", length = 300)
    private String returnUrl;
    @Column(name = "gateway_payload", columnDefinition = "TEXT")
    private String gatewayPayload;
    @Column(name = "initiated_at")
    private LocalDateTime initiatedAt;
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public Long getFeePaymentId() { return feePaymentId; }
    public void setFeePaymentId(Long feePaymentId) { this.feePaymentId = feePaymentId; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public Long getParentUserId() { return parentUserId; }
    public void setParentUserId(Long parentUserId) { this.parentUserId = parentUserId; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProviderOrderId() { return providerOrderId; }
    public void setProviderOrderId(String providerOrderId) { this.providerOrderId = providerOrderId; }
    public String getProviderPaymentId() { return providerPaymentId; }
    public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }
    public String getOperationKey() { return operationKey; }
    public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    public String getCheckoutToken() { return checkoutToken; }
    public void setCheckoutToken(String checkoutToken) { this.checkoutToken = checkoutToken; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReturnUrl() { return returnUrl; }
    public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }
    public String getGatewayPayload() { return gatewayPayload; }
    public void setGatewayPayload(String gatewayPayload) { this.gatewayPayload = gatewayPayload; }
    public LocalDateTime getInitiatedAt() { return initiatedAt; }
    public void setInitiatedAt(LocalDateTime initiatedAt) { this.initiatedAt = initiatedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
