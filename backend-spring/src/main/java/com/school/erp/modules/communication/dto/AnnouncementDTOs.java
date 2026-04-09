package com.school.erp.modules.communication.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AnnouncementDTOs {
    public static class CreateAnnouncementRequest {
        @NotBlank
        private String title;
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
}

