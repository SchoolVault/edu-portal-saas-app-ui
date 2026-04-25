package com.school.erp.modules.communication.dto;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.communication.domain.CommunicationEventStatus;
import com.school.erp.modules.communication.domain.CommunicationEventType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class CommunicationEventDTOs {
    public static class CreateEventRequest {
        @NotBlank
        @Size(max = 200)
        private String title;
        @Size(max = 5000)
        private String description;
        @NotNull
        private CommunicationEventType eventType;
        @NotNull
        private Enums.TargetAudience audienceScope;
        private Long targetClassId;
        private Long targetSectionId;
        @Future
        private LocalDateTime publishAt;
        @NotNull
        private LocalDateTime eventStartAt;
        private LocalDateTime eventEndAt;
        @NotBlank
        @Size(max = 60)
        private String timezone;
        @Size(max = 10)
        private String locale;
        @Size(max = 200)
        private String location;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public CommunicationEventType getEventType() {
            return eventType;
        }

        public void setEventType(CommunicationEventType eventType) {
            this.eventType = eventType;
        }

        public Enums.TargetAudience getAudienceScope() {
            return audienceScope;
        }

        public void setAudienceScope(Enums.TargetAudience audienceScope) {
            this.audienceScope = audienceScope;
        }

        public Long getTargetClassId() {
            return targetClassId;
        }

        public void setTargetClassId(Long targetClassId) {
            this.targetClassId = targetClassId;
        }

        public Long getTargetSectionId() {
            return targetSectionId;
        }

        public void setTargetSectionId(Long targetSectionId) {
            this.targetSectionId = targetSectionId;
        }

        public LocalDateTime getPublishAt() {
            return publishAt;
        }

        public void setPublishAt(LocalDateTime publishAt) {
            this.publishAt = publishAt;
        }

        public LocalDateTime getEventStartAt() {
            return eventStartAt;
        }

        public void setEventStartAt(LocalDateTime eventStartAt) {
            this.eventStartAt = eventStartAt;
        }

        public LocalDateTime getEventEndAt() {
            return eventEndAt;
        }

        public void setEventEndAt(LocalDateTime eventEndAt) {
            this.eventEndAt = eventEndAt;
        }

        public String getTimezone() {
            return timezone;
        }

        public void setTimezone(String timezone) {
            this.timezone = timezone;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getLocale() {
            return locale;
        }

        public void setLocale(String locale) {
            this.locale = locale;
        }
    }

    public static class EventResponse {
        private Long id;
        private String title;
        private String description;
        private CommunicationEventType eventType;
        private Enums.TargetAudience audienceScope;
        private Long targetClassId;
        private Long targetSectionId;
        private LocalDateTime publishAt;
        private LocalDateTime eventStartAt;
        private LocalDateTime eventEndAt;
        private String timezone;
        private String locale;
        private String location;
        private CommunicationEventStatus status;
        private LocalDateTime createdAt;
        private String publishedCampaignId;
        private String reminder1dCampaignId;
        private String reminder1hCampaignId;

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

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public CommunicationEventType getEventType() {
            return eventType;
        }

        public void setEventType(CommunicationEventType eventType) {
            this.eventType = eventType;
        }

        public Enums.TargetAudience getAudienceScope() {
            return audienceScope;
        }

        public void setAudienceScope(Enums.TargetAudience audienceScope) {
            this.audienceScope = audienceScope;
        }

        public Long getTargetClassId() {
            return targetClassId;
        }

        public void setTargetClassId(Long targetClassId) {
            this.targetClassId = targetClassId;
        }

        public Long getTargetSectionId() {
            return targetSectionId;
        }

        public void setTargetSectionId(Long targetSectionId) {
            this.targetSectionId = targetSectionId;
        }

        public LocalDateTime getPublishAt() {
            return publishAt;
        }

        public void setPublishAt(LocalDateTime publishAt) {
            this.publishAt = publishAt;
        }

        public LocalDateTime getEventStartAt() {
            return eventStartAt;
        }

        public void setEventStartAt(LocalDateTime eventStartAt) {
            this.eventStartAt = eventStartAt;
        }

        public LocalDateTime getEventEndAt() {
            return eventEndAt;
        }

        public void setEventEndAt(LocalDateTime eventEndAt) {
            this.eventEndAt = eventEndAt;
        }

        public String getTimezone() {
            return timezone;
        }

        public void setTimezone(String timezone) {
            this.timezone = timezone;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getLocale() {
            return locale;
        }

        public void setLocale(String locale) {
            this.locale = locale;
        }

        public CommunicationEventStatus getStatus() {
            return status;
        }

        public void setStatus(CommunicationEventStatus status) {
            this.status = status;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public String getPublishedCampaignId() {
            return publishedCampaignId;
        }

        public void setPublishedCampaignId(String publishedCampaignId) {
            this.publishedCampaignId = publishedCampaignId;
        }

        public String getReminder1dCampaignId() {
            return reminder1dCampaignId;
        }

        public void setReminder1dCampaignId(String reminder1dCampaignId) {
            this.reminder1dCampaignId = reminder1dCampaignId;
        }

        public String getReminder1hCampaignId() {
            return reminder1hCampaignId;
        }

        public void setReminder1hCampaignId(String reminder1hCampaignId) {
            this.reminder1hCampaignId = reminder1hCampaignId;
        }
    }
}
