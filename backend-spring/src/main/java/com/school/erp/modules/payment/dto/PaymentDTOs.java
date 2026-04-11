package com.school.erp.modules.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Request/response contracts for hosted checkout (Razorpay, Stripe, …).
 * Provider ids: {@link com.school.erp.modules.payment.domain.PaymentProviderIds}.
 * Purpose strings: {@link com.school.erp.modules.payment.domain.PaymentCheckoutPurpose}.
 * Frontend mirror: {@code frontend/src/app/core/payment/payment.dto.ts} ({@code PaymentDtos}).
 */
public final class PaymentDTOs {

    private PaymentDTOs() {
    }

    public static class CreateOrderRequest {
        @NotBlank
        private String purpose;
        private Long feePaymentId;
        private Long studentId;
        private Long payeeUserId;
        @NotNull
        @DecimalMin("0.01")
        private BigDecimal amount;
        @NotBlank
        private String currency;
        @NotBlank
        private String provider;
        private String returnUrl;

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }

        public Long getFeePaymentId() {
            return feePaymentId;
        }

        public void setFeePaymentId(Long feePaymentId) {
            this.feePaymentId = feePaymentId;
        }

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public Long getPayeeUserId() {
            return payeeUserId;
        }

        public void setPayeeUserId(Long payeeUserId) {
            this.payeeUserId = payeeUserId;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getCurrency() {
            return currency;
        }

        public void setCurrency(String currency) {
            this.currency = currency;
        }

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public String getReturnUrl() {
            return returnUrl;
        }

        public void setReturnUrl(String returnUrl) {
            this.returnUrl = returnUrl;
        }
    }

    public static class CreateOrderResponse {
        private String attemptId;
        private String providerOrderId;
        private String publicKeyId;
        private BigDecimal amount;
        private String currency;
        /** JSON string passed to Razorpay Checkout or Stripe.js */
        private String clientOptionsJson;
        private String status;

        public String getAttemptId() {
            return attemptId;
        }

        public void setAttemptId(String attemptId) {
            this.attemptId = attemptId;
        }

        public String getProviderOrderId() {
            return providerOrderId;
        }

        public void setProviderOrderId(String providerOrderId) {
            this.providerOrderId = providerOrderId;
        }

        public String getPublicKeyId() {
            return publicKeyId;
        }

        public void setPublicKeyId(String publicKeyId) {
            this.publicKeyId = publicKeyId;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getCurrency() {
            return currency;
        }

        public void setCurrency(String currency) {
            this.currency = currency;
        }

        public String getClientOptionsJson() {
            return clientOptionsJson;
        }

        public void setClientOptionsJson(String clientOptionsJson) {
            this.clientOptionsJson = clientOptionsJson;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
