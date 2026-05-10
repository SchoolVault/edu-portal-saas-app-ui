package com.school.erp.modules.finance.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class TenantFinanceProfileDTOs {
    private TenantFinanceProfileDTOs() {}

    @Schema(description = "Read model for tenant fee routing (no secrets).")
    public static class FinanceProfileResponse {
        private String tenantId;
        private String feeSettlementMode;
        private String razorpayRouteLinkedAccountId;
        private int platformCommissionBps;
        private String financeNotes;
        private String paymentRoutingOnboardingStatus;
        private String paymentRoutingSubmittedAt;
        private String paymentRoutingLiveAt;
        private Long paymentRoutingLiveByUserId;
        private String paymentRoutingOnboardingDeclaration;
        /** Masked linked account for support / read-only views (e.g. {@code acc_****1234}). */
        private String razorpayRouteLinkedAccountMasked;

        /**
         * When {@code false}, parent portal must not offer gateway checkout; staff record fees offline.
         * Still independent of env-level provider list — both must allow checkout for Razorpay to work.
         */
        private boolean parentOnlineFeeCheckoutEnabled = true;

        /**
         * When {@code false} (default), Payroll must not call the payout provider; use external transfer + mark paid.
         */
        private boolean payrollDigitalPayoutEnabled;

        public String getTenantId() {
            return tenantId;
        }

        public void setTenantId(String tenantId) {
            this.tenantId = tenantId;
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

        public String getPaymentRoutingSubmittedAt() {
            return paymentRoutingSubmittedAt;
        }

        public void setPaymentRoutingSubmittedAt(String paymentRoutingSubmittedAt) {
            this.paymentRoutingSubmittedAt = paymentRoutingSubmittedAt;
        }

        public String getPaymentRoutingLiveAt() {
            return paymentRoutingLiveAt;
        }

        public void setPaymentRoutingLiveAt(String paymentRoutingLiveAt) {
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

        public String getRazorpayRouteLinkedAccountMasked() {
            return razorpayRouteLinkedAccountMasked;
        }

        public void setRazorpayRouteLinkedAccountMasked(String razorpayRouteLinkedAccountMasked) {
            this.razorpayRouteLinkedAccountMasked = razorpayRouteLinkedAccountMasked;
        }

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
    }

    @Schema(description = "Admin update for fee routing; partial fields supported.")
    public static class FinanceProfileUpdateRequest {
        private String feeSettlementMode;
        private String razorpayRouteLinkedAccountId;
        private Integer platformCommissionBps;
        private String financeNotes;
        /** Optional: omit to leave unchanged. */
        private Boolean parentOnlineFeeCheckoutEnabled;
        /** Optional: omit to leave unchanged. */
        private Boolean payrollDigitalPayoutEnabled;

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

        public Integer getPlatformCommissionBps() {
            return platformCommissionBps;
        }

        public void setPlatformCommissionBps(Integer platformCommissionBps) {
            this.platformCommissionBps = platformCommissionBps;
        }

        public String getFinanceNotes() {
            return financeNotes;
        }

        public void setFinanceNotes(String financeNotes) {
            this.financeNotes = financeNotes;
        }

        public Boolean getParentOnlineFeeCheckoutEnabled() {
            return parentOnlineFeeCheckoutEnabled;
        }

        public void setParentOnlineFeeCheckoutEnabled(Boolean parentOnlineFeeCheckoutEnabled) {
            this.parentOnlineFeeCheckoutEnabled = parentOnlineFeeCheckoutEnabled;
        }

        public Boolean getPayrollDigitalPayoutEnabled() {
            return payrollDigitalPayoutEnabled;
        }

        public void setPayrollDigitalPayoutEnabled(Boolean payrollDigitalPayoutEnabled) {
            this.payrollDigitalPayoutEnabled = payrollDigitalPayoutEnabled;
        }
    }

    @Schema(description = "School attestation when submitting Route settlement for platform review.")
    public static class FinanceProfileSubmitRequest {
        @NotBlank
        @Size(min = 30, max = 2000)
        private String declaration;

        public String getDeclaration() {
            return declaration;
        }

        public void setDeclaration(String declaration) {
            this.declaration = declaration;
        }
    }
}
