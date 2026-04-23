package com.school.erp.modules.notification.dto;

import java.util.Map;

public class NotificationOpsDTOs {
    public static class DeadLetterItem {
        private Long id;
        private String eventType;
        private String channel;
        private String correlationId;
        private String lastError;
        private int attempts;
        private String deadLetteredAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public String getCorrelationId() { return correlationId; }
        public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
        public String getLastError() { return lastError; }
        public void setLastError(String lastError) { this.lastError = lastError; }
        public int getAttempts() { return attempts; }
        public void setAttempts(int attempts) { this.attempts = attempts; }
        public String getDeadLetteredAt() { return deadLetteredAt; }
        public void setDeadLetteredAt(String deadLetteredAt) { this.deadLetteredAt = deadLetteredAt; }
    }

    public static class ReplayResult {
        private int replayed;
        private int skipped;

        public int getReplayed() { return replayed; }
        public void setReplayed(int replayed) { this.replayed = replayed; }
        public int getSkipped() { return skipped; }
        public void setSkipped(int skipped) { this.skipped = skipped; }
    }

    public static class ProviderHealthResponse {
        private Map<String, Boolean> providers;

        public Map<String, Boolean> getProviders() { return providers; }
        public void setProviders(Map<String, Boolean> providers) { this.providers = providers; }
    }
}
