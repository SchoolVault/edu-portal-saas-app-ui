package com.school.erp.modules.communication.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AnnouncementDTOs {
    public static class CreateAnnouncementRequest {
        @NotBlank
        @Size(max = 200)
        private String title;
        @NotBlank
        @Size(max = 5000)
        private String content;
        @NotNull
        private Enums.TargetAudience targetAudience;
        private Long targetClassId;
        private Long targetSectionId;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public Enums.TargetAudience getTargetAudience() { return targetAudience; }
        public void setTargetAudience(Enums.TargetAudience targetAudience) { this.targetAudience = targetAudience; }
        public Long getTargetClassId() { return targetClassId; }
        public void setTargetClassId(Long targetClassId) { this.targetClassId = targetClassId; }
        public Long getTargetSectionId() { return targetSectionId; }
        public void setTargetSectionId(Long targetSectionId) { this.targetSectionId = targetSectionId; }
    }

    /** Safe for headers / notification strip (no full body). */
    public static class AnnouncementPreviewResponse {
        private Long id;
        private String title;
        private String preview;
        private String createdAt;
        /** {@link com.school.erp.common.enums.Enums.TargetAudience} name — drives shell split (school-wide vs personal). */
        private String targetAudience;
        private Long targetClassId;
        private Long targetSectionId;
        private String targetClassName;
        private String targetSectionName;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getPreview() {
            return preview;
        }

        public void setPreview(String preview) {
            this.preview = preview;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public String getTargetAudience() {
            return targetAudience;
        }

        public void setTargetAudience(String targetAudience) {
            this.targetAudience = targetAudience;
        }

        public Long getTargetClassId() {
            return targetClassId;
        }

        public void setTargetClassId(final Long targetClassId) {
            this.targetClassId = targetClassId;
        }

        public Long getTargetSectionId() {
            return targetSectionId;
        }

        public void setTargetSectionId(final Long targetSectionId) {
            this.targetSectionId = targetSectionId;
        }

        public String getTargetClassName() {
            return targetClassName;
        }

        public void setTargetClassName(final String targetClassName) {
            this.targetClassName = targetClassName;
        }

        public String getTargetSectionName() {
            return targetSectionName;
        }

        public void setTargetSectionName(final String targetSectionName) {
            this.targetSectionName = targetSectionName;
        }
    }
}

