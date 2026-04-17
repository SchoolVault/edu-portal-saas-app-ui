package com.school.erp.modules.communication.dto;

/**
 * Unified inbox row: school announcements and user notifications in one timeline (API contract for {@code GET /communication/inbox/timeline}).
 */
public class InboxTimelineDTOs {

    public static final String KIND_ANNOUNCEMENT = "ANNOUNCEMENT";
    public static final String KIND_NOTIFICATION = "NOTIFICATION";

    public static class InboxItemResponse {
        /** {@value KIND_ANNOUNCEMENT} or {@value KIND_NOTIFICATION}. */
        private String kind;
        private String id;
        private String title;
        private String preview;
        private String createdAt;
        /** Announcement: {@link com.school.erp.common.enums.Enums.TargetAudience} name (e.g. ALL). */
        private String audienceKey;
        private String authorLine;
        /** Notification: INFO, WARNING, … */
        private String notificationType;
        private Boolean read;

        public String getKind() {
            return kind;
        }

        public void setKind(final String kind) {
            this.kind = kind;
        }

        public String getId() {
            return id;
        }

        public void setId(final String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(final String title) {
            this.title = title;
        }

        public String getPreview() {
            return preview;
        }

        public void setPreview(final String preview) {
            this.preview = preview;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(final String createdAt) {
            this.createdAt = createdAt;
        }

        public String getAudienceKey() {
            return audienceKey;
        }

        public void setAudienceKey(final String audienceKey) {
            this.audienceKey = audienceKey;
        }

        public String getAuthorLine() {
            return authorLine;
        }

        public void setAuthorLine(final String authorLine) {
            this.authorLine = authorLine;
        }

        public String getNotificationType() {
            return notificationType;
        }

        public void setNotificationType(final String notificationType) {
            this.notificationType = notificationType;
        }

        public Boolean getRead() {
            return read;
        }

        public void setRead(final Boolean read) {
            this.read = read;
        }
    }
}
