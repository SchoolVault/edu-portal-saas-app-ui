package com.school.erp.modules.notification.sms;

public final class BulkSmsRequest {
    private final String message;
    private final String[] recipients;
    private final String from;
    private final String tenantId;
    private final String correlationId;

    private BulkSmsRequest(Builder b) {
        this.message = b.message;
        this.recipients = b.recipients;
        this.from = b.from;
        this.tenantId = b.tenantId;
        this.correlationId = b.correlationId;
    }

    public String getMessage() {
        return message;
    }

    public String[] getRecipients() {
        return recipients;
    }

    public String getFrom() {
        return from;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String message;
        private String[] recipients;
        private String from;
        private String tenantId;
        private String correlationId;

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder recipients(String[] recipients) {
            this.recipients = recipients;
            return this;
        }

        public Builder from(String from) {
            this.from = from;
            return this;
        }

        public Builder tenantId(String tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public Builder correlationId(String correlationId) {
            this.correlationId = correlationId;
            return this;
        }

        public BulkSmsRequest build() {
            return new BulkSmsRequest(this);
        }
    }
}
