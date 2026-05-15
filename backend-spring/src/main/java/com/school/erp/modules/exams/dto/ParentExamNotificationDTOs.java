package com.school.erp.modules.exams.dto;

import java.util.List;

public class ParentExamNotificationDTOs {
    public static class NotificationStateResponse {
        private Long examId;
        private String eventType;
        private String lastNotifiedAt;
        private String lastReadAt;
        private boolean unread;
        public Long getExamId() { return examId; }
        public void setExamId(Long examId) { this.examId = examId; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getLastNotifiedAt() { return lastNotifiedAt; }
        public void setLastNotifiedAt(String lastNotifiedAt) { this.lastNotifiedAt = lastNotifiedAt; }
        public String getLastReadAt() { return lastReadAt; }
        public void setLastReadAt(String lastReadAt) { this.lastReadAt = lastReadAt; }
        public boolean isUnread() { return unread; }
        public void setUnread(boolean unread) { this.unread = unread; }
    }

    public static class NotificationPreferenceResponse {
        private boolean inAppEnabled;
        private boolean smsEnabled;
        private boolean emailEnabled;
        private boolean digestEnabled;
        private String quietHoursStart;
        private String quietHoursEnd;
        public boolean isInAppEnabled() { return inAppEnabled; }
        public void setInAppEnabled(boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
        public boolean isSmsEnabled() { return smsEnabled; }
        public void setSmsEnabled(boolean smsEnabled) { this.smsEnabled = smsEnabled; }
        public boolean isEmailEnabled() { return emailEnabled; }
        public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }
        public boolean isDigestEnabled() { return digestEnabled; }
        public void setDigestEnabled(boolean digestEnabled) { this.digestEnabled = digestEnabled; }
        public String getQuietHoursStart() { return quietHoursStart; }
        public void setQuietHoursStart(String quietHoursStart) { this.quietHoursStart = quietHoursStart; }
        public String getQuietHoursEnd() { return quietHoursEnd; }
        public void setQuietHoursEnd(String quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }
    }

    public static class UpdateNotificationPreferenceRequest {
        private Boolean inAppEnabled;
        private Boolean smsEnabled;
        private Boolean emailEnabled;
        private Boolean digestEnabled;
        private String quietHoursStart;
        private String quietHoursEnd;
        public Boolean getInAppEnabled() { return inAppEnabled; }
        public void setInAppEnabled(Boolean inAppEnabled) { this.inAppEnabled = inAppEnabled; }
        public Boolean getSmsEnabled() { return smsEnabled; }
        public void setSmsEnabled(Boolean smsEnabled) { this.smsEnabled = smsEnabled; }
        public Boolean getEmailEnabled() { return emailEnabled; }
        public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }
        public Boolean getDigestEnabled() { return digestEnabled; }
        public void setDigestEnabled(Boolean digestEnabled) { this.digestEnabled = digestEnabled; }
        public String getQuietHoursStart() { return quietHoursStart; }
        public void setQuietHoursStart(String quietHoursStart) { this.quietHoursStart = quietHoursStart; }
        public String getQuietHoursEnd() { return quietHoursEnd; }
        public void setQuietHoursEnd(String quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }
    }

    public static class BulkAcknowledgeRequest {
        private Long examId;
        private List<String> eventTypes;
        public Long getExamId() { return examId; }
        public void setExamId(Long examId) { this.examId = examId; }
        public List<String> getEventTypes() { return eventTypes; }
        public void setEventTypes(List<String> eventTypes) { this.eventTypes = eventTypes; }
    }
}
