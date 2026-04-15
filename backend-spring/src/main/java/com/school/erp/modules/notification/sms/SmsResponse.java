package com.school.erp.modules.notification.sms;

public final class SmsResponse {
    private final boolean success;
    private final String messageId;
    private final String providerStatus;
    private final String errorMessage;
    private final String providerName;
    private final Long estimatedCostCents;

    private SmsResponse(Builder b) {
        this.success = b.success;
        this.messageId = b.messageId;
        this.providerStatus = b.providerStatus;
        this.errorMessage = b.errorMessage;
        this.providerName = b.providerName;
        this.estimatedCostCents = b.estimatedCostCents;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessageId() {
        return messageId;
    }

    public String getProviderStatus() {
        return providerStatus;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getProviderName() {
        return providerName;
    }

    public Long getEstimatedCostCents() {
        return estimatedCostCents;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private boolean success;
        private String messageId;
        private String providerStatus;
        private String errorMessage;
        private String providerName;
        private Long estimatedCostCents;

        public Builder success(boolean success) {
            this.success = success;
            return this;
        }

        public Builder messageId(String messageId) {
            this.messageId = messageId;
            return this;
        }

        public Builder providerStatus(String providerStatus) {
            this.providerStatus = providerStatus;
            return this;
        }

        public Builder errorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }

        public Builder providerName(String providerName) {
            this.providerName = providerName;
            return this;
        }

        public Builder estimatedCostCents(Long estimatedCostCents) {
            this.estimatedCostCents = estimatedCostCents;
            return this;
        }

        public SmsResponse build() {
            return new SmsResponse(this);
        }
    }
}
