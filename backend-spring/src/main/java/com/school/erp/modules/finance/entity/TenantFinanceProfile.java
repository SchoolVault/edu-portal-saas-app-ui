package com.school.erp.modules.finance.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import com.school.erp.modules.finance.domain.PaymentRoutingOnboardingStatus;

@Entity
@Table(
        name = "tenant_finance_profiles",
        uniqueConstraints = @UniqueConstraint(name = "uq_tenant_finance_profiles_tenant", columnNames = "tenant_id"),
        indexes = @Index(name = "idx_tfp_tenant_active", columnList = "tenant_id, is_deleted"))
public class TenantFinanceProfile extends BaseEntity {

    /**
     * Tenant-level product switch for parent-facing gateway checkout (e.g. Razorpay).
     * Independent of {@link #feeSettlementMode}: a school may use platform merchant settlement later but
     * keep parents on counter-only until bank/Route readiness — flip this flag when they go live online.
     * Future: may fold into a richer {@code PaymentCapability} matrix alongside payroll rails.
     */
    @Column(name = "parent_online_fee_checkout_enabled", nullable = false)
    private boolean parentOnlineFeeCheckoutEnabled = false;

    /**
     * In-app "initiate salary" via payout API (RazorpayX, etc.). Independent of
     * {@link #parentOnlineFeeCheckoutEnabled} — a school can collect parent fees online while paying staff offline.
     */
    @Column(name = "payroll_digital_payout_enabled", nullable = false)
    private boolean payrollDigitalPayoutEnabled = false;

    @Column(name = "fee_settlement_mode", nullable = false, length = 40)
    private String feeSettlementMode = "OFFLINE_SCHOOL_COLLECTION";

    @Column(name = "razorpay_route_linked_account_id", length = 64)
    private String razorpayRouteLinkedAccountId;

    @Column(name = "platform_commission_bps", nullable = false)
    private int platformCommissionBps;

    @Column(name = "finance_notes", length = 500)
    private String financeNotes;

    @Column(name = "payment_routing_onboarding_status", nullable = false, length = 40)
    private String paymentRoutingOnboardingStatus = PaymentRoutingOnboardingStatus.NOT_REQUIRED.name();

    @Column(name = "payment_routing_submitted_at")
    private java.time.LocalDateTime paymentRoutingSubmittedAt;

    @Column(name = "payment_routing_live_at")
    private java.time.LocalDateTime paymentRoutingLiveAt;

    @Column(name = "payment_routing_live_by_user_id")
    private Long paymentRoutingLiveByUserId;

    @Column(name = "payment_routing_onboarding_declaration", length = 2000)
    private String paymentRoutingOnboardingDeclaration;

    public boolean isParentOnlineFeeCheckoutEnabled() {
        return parentOnlineFeeCheckoutEnabled;
    }

    public void setParentOnlineFeeCheckoutEnabled(boolean parentOnlineFeeCheckoutEnabled) {
        this.parentOnlineFeeCheckoutEnabled = parentOnlineFeeCheckoutEnabled;
    }

    public boolean isPayrollDigitalPayoutEnabled() {
        return payrollDigitalPayoutEnabled;
    }

    public void setPayrollDigitalPayoutEnabled(boolean payrollDigitalPayoutEnabled) {
        this.payrollDigitalPayoutEnabled = payrollDigitalPayoutEnabled;
    }

    public String getFeeSettlementMode() {
        return feeSettlementMode;
    }

    public void setFeeSettlementMode(String feeSettlementMode) {
        this.feeSettlementMode = feeSettlementMode;
    }

    public String getRazorpayRouteLinkedAccountId() {
        return razorpayRouteLinkedAccountId;
    }

    public void setRazorpayRouteLinkedAccountId(String razorpayRouteLinkedAccountId) {
        this.razorpayRouteLinkedAccountId = razorpayRouteLinkedAccountId;
    }

    public int getPlatformCommissionBps() {
        return platformCommissionBps;
    }

    public void setPlatformCommissionBps(int platformCommissionBps) {
        this.platformCommissionBps = platformCommissionBps;
    }

    public String getFinanceNotes() {
        return financeNotes;
    }

    public void setFinanceNotes(String financeNotes) {
        this.financeNotes = financeNotes;
    }

    public String getPaymentRoutingOnboardingStatus() {
        return paymentRoutingOnboardingStatus;
    }

    public void setPaymentRoutingOnboardingStatus(String paymentRoutingOnboardingStatus) {
        this.paymentRoutingOnboardingStatus = paymentRoutingOnboardingStatus;
    }

    public java.time.LocalDateTime getPaymentRoutingSubmittedAt() {
        return paymentRoutingSubmittedAt;
    }

    public void setPaymentRoutingSubmittedAt(java.time.LocalDateTime paymentRoutingSubmittedAt) {
        this.paymentRoutingSubmittedAt = paymentRoutingSubmittedAt;
    }

    public java.time.LocalDateTime getPaymentRoutingLiveAt() {
        return paymentRoutingLiveAt;
    }

    public void setPaymentRoutingLiveAt(java.time.LocalDateTime paymentRoutingLiveAt) {
        this.paymentRoutingLiveAt = paymentRoutingLiveAt;
    }

    public Long getPaymentRoutingLiveByUserId() {
        return paymentRoutingLiveByUserId;
    }

    public void setPaymentRoutingLiveByUserId(Long paymentRoutingLiveByUserId) {
        this.paymentRoutingLiveByUserId = paymentRoutingLiveByUserId;
    }

    public String getPaymentRoutingOnboardingDeclaration() {
        return paymentRoutingOnboardingDeclaration;
    }

    public void setPaymentRoutingOnboardingDeclaration(String paymentRoutingOnboardingDeclaration) {
        this.paymentRoutingOnboardingDeclaration = paymentRoutingOnboardingDeclaration;
    }
}
