package com.school.erp.modules.communication.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CampaignDTOs {

    public static class CampaignRequest {
        @NotBlank
        @Size(max = 200)
        private String title;
        @NotBlank
        @Size(max = 5000)
        private String message;
        @NotBlank
        @Size(max = 80)
        private String eventType;
        @NotNull
        private Enums.TargetAudience targetAudience;
        private Long targetClassId;
        private Long targetSectionId;
        @NotEmpty
        private List<String> channels;
        @Size(max = 10)
        private String locale;
        /** ISO local date-time. */
        private String scheduledAt;
        private Map<String, String> templateVariables;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Enums.TargetAudience getTargetAudience() { return targetAudience; }
        public void setTargetAudience(Enums.TargetAudience targetAudience) { this.targetAudience = targetAudience; }
        public Long getTargetClassId() { return targetClassId; }
        public void setTargetClassId(Long targetClassId) { this.targetClassId = targetClassId; }
        public Long getTargetSectionId() { return targetSectionId; }
        public void setTargetSectionId(Long targetSectionId) { this.targetSectionId = targetSectionId; }
        public List<String> getChannels() { return channels; }
        public void setChannels(List<String> channels) { this.channels = channels; }
        public String getLocale() { return locale; }
        public void setLocale(String locale) { this.locale = locale; }
        public String getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }
        public Map<String, String> getTemplateVariables() { return templateVariables; }
        public void setTemplateVariables(Map<String, String> templateVariables) { this.templateVariables = templateVariables; }
    }

    public static class CampaignPreviewResponse {
        private int estimatedRecipients;
        private Map<String, Integer> recipientCountsByRole;
        private Map<String, Integer> channelRecipientCounts;
        private long estimatedCostMinor;
        private List<String> warnings;

        public int getEstimatedRecipients() { return estimatedRecipients; }
        public void setEstimatedRecipients(int estimatedRecipients) { this.estimatedRecipients = estimatedRecipients; }
        public Map<String, Integer> getRecipientCountsByRole() { return recipientCountsByRole; }
        public void setRecipientCountsByRole(Map<String, Integer> recipientCountsByRole) { this.recipientCountsByRole = recipientCountsByRole; }
        public Map<String, Integer> getChannelRecipientCounts() { return channelRecipientCounts; }
        public void setChannelRecipientCounts(Map<String, Integer> channelRecipientCounts) { this.channelRecipientCounts = channelRecipientCounts; }
        public long getEstimatedCostMinor() { return estimatedCostMinor; }
        public void setEstimatedCostMinor(long estimatedCostMinor) { this.estimatedCostMinor = estimatedCostMinor; }
        public List<String> getWarnings() { return warnings; }
        public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    }

    public static class CampaignSendResponse {
        private String campaignId;
        private int recipientCount;
        private int queuedCount;
        private boolean scheduled;
        private String scheduledAt;

        public String getCampaignId() { return campaignId; }
        public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
        public int getRecipientCount() { return recipientCount; }
        public void setRecipientCount(int recipientCount) { this.recipientCount = recipientCount; }
        public int getQueuedCount() { return queuedCount; }
        public void setQueuedCount(int queuedCount) { this.queuedCount = queuedCount; }
        public boolean isScheduled() { return scheduled; }
        public void setScheduled(boolean scheduled) { this.scheduled = scheduled; }
        public String getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }
    }

    public static class CampaignHistoryItem {
        private String campaignId;
        private String title;
        private String eventType;
        private String targetAudience;
        private int recipientCount;
        private int queuedCount;
        private String status;
        private String scheduledAt;
        private String createdAt;

        public String getCampaignId() { return campaignId; }
        public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getTargetAudience() { return targetAudience; }
        public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }
        public int getRecipientCount() { return recipientCount; }
        public void setRecipientCount(int recipientCount) { this.recipientCount = recipientCount; }
        public int getQueuedCount() { return queuedCount; }
        public void setQueuedCount(int queuedCount) { this.queuedCount = queuedCount; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }

    public static class CampaignAnalyticsResponse {
        private String campaignId;
        private Map<String, Long> statusCounts;
        private long total;
        private long sent;
        private long retry;
        private long deadLetter;

        public String getCampaignId() { return campaignId; }
        public void setCampaignId(String campaignId) { this.campaignId = campaignId; }
        public Map<String, Long> getStatusCounts() { return statusCounts; }
        public void setStatusCounts(Map<String, Long> statusCounts) { this.statusCounts = statusCounts; }
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
        public long getSent() { return sent; }
        public void setSent(long sent) { this.sent = sent; }
        public long getRetry() { return retry; }
        public void setRetry(long retry) { this.retry = retry; }
        public long getDeadLetter() { return deadLetter; }
        public void setDeadLetter(long deadLetter) { this.deadLetter = deadLetter; }
    }

    public static class CampaignTemplateUpsertRequest {
        @NotBlank
        @Size(max = 80)
        private String eventType;
        @NotBlank
        @Size(max = 20)
        private String channel;
        @NotBlank
        @Size(max = 10)
        private String locale;
        @NotBlank
        @Size(max = 2000)
        private String templateBody;
        @Size(max = 120)
        private String dltTemplateId;
        @Size(max = 20)
        private String status;

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public String getLocale() { return locale; }
        public void setLocale(String locale) { this.locale = locale; }
        public String getTemplateBody() { return templateBody; }
        public void setTemplateBody(String templateBody) { this.templateBody = templateBody; }
        public String getDltTemplateId() { return dltTemplateId; }
        public void setDltTemplateId(String dltTemplateId) { this.dltTemplateId = dltTemplateId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class CampaignTemplateResponse {
        private Long id;
        private String eventType;
        private String channel;
        private String locale;
        private String templateBody;
        private String dltTemplateId;
        private String status;
        private String updatedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public String getLocale() { return locale; }
        public void setLocale(String locale) { this.locale = locale; }
        public String getTemplateBody() { return templateBody; }
        public void setTemplateBody(String templateBody) { this.templateBody = templateBody; }
        public String getDltTemplateId() { return dltTemplateId; }
        public void setDltTemplateId(String dltTemplateId) { this.dltTemplateId = dltTemplateId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class CampaignAnalyticsBatchRequest {
        @NotEmpty
        @Size(max = 200)
        private Set<String> campaignIds;

        public Set<String> getCampaignIds() { return campaignIds; }
        public void setCampaignIds(Set<String> campaignIds) { this.campaignIds = campaignIds; }
    }
}
