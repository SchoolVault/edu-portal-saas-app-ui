package com.school.erp.modules.notification.sms;

public final class BulkSmsResponse {
    private final int totalSent;
    private final int successCount;
    private final int failedCount;
    private final SmsResponse[] responses;

    private BulkSmsResponse(Builder b) {
        this.totalSent = b.totalSent;
        this.successCount = b.successCount;
        this.failedCount = b.failedCount;
        this.responses = b.responses;
    }

    public int getTotalSent() {
        return totalSent;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public int getFailedCount() {
        return failedCount;
    }

    public SmsResponse[] getResponses() {
        return responses;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private int totalSent;
        private int successCount;
        private int failedCount;
        private SmsResponse[] responses;

        public Builder totalSent(int totalSent) {
            this.totalSent = totalSent;
            return this;
        }

        public Builder successCount(int successCount) {
            this.successCount = successCount;
            return this;
        }

        public Builder failedCount(int failedCount) {
            this.failedCount = failedCount;
            return this;
        }

        public Builder responses(SmsResponse[] responses) {
            this.responses = responses;
            return this;
        }

        public BulkSmsResponse build() {
            return new BulkSmsResponse(this);
        }
    }
}
