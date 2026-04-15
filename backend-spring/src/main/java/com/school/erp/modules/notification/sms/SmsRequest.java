package com.school.erp.modules.notification.sms;

/** Outbound SMS request (plain POJO — avoids Lombok on nested/interface edge cases). */
public final class SmsRequest {
    private final String to;
    private final String message;
    private final String from;
    private final String tenantId;
    private final String correlationId;
    private final SmsTemplate template;

    private SmsRequest(Builder b) {
        this.to = b.to;
        this.message = b.message;
        this.from = b.from;
        this.tenantId = b.tenantId;
        this.correlationId = b.correlationId;
        this.template = b.template;
    }

    public String getTo() {
        return to;
    }

    public String getMessage() {
        return message;
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

    public SmsTemplate getTemplate() {
        return template;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String to;
        private String message;
        private String from;
        private String tenantId;
        private String correlationId;
        private SmsTemplate template;

        public Builder to(String to) {
            this.to = to;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
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

        public Builder template(SmsTemplate template) {
            this.template = template;
            return this;
        }

        public SmsRequest build() {
            return new SmsRequest(this);
        }
    }
}
