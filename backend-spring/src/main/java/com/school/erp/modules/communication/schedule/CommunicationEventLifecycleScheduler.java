package com.school.erp.modules.communication.schedule;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.communication.dto.CampaignDTOs;
import com.school.erp.modules.communication.entity.CommunicationEvent;
import com.school.erp.modules.communication.repository.CommunicationEventRepository;
import com.school.erp.modules.notification.service.NotificationCampaignService;
import com.school.erp.tenant.TenantScopedExecution;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.communication.events.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class CommunicationEventLifecycleScheduler {
    private static final Logger log = LoggerFactory.getLogger(CommunicationEventLifecycleScheduler.class);
    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    private final CommunicationEventRepository eventRepository;
    private final NotificationCampaignService campaignService;

    @Value("${app.communication.events.scheduler.tenant-limit:100}")
    private int tenantLimit;

    @Value("${app.communication.events.scheduler.batch-size:100}")
    private int batchSize;

    public CommunicationEventLifecycleScheduler(
            CommunicationEventRepository eventRepository,
            NotificationCampaignService campaignService) {
        this.eventRepository = eventRepository;
        this.campaignService = campaignService;
    }

    /**
     * Intentionally not transactional as a whole: Spring Data and {@code NotificationCampaignService} already define
     * transaction boundaries per call. A single outer transaction here caused {@code UnexpectedRollbackException} when
     * {@code send} threw a caught business rule error (e.g. quiet hours) after marking the shared transaction
     * rollback-only.
     */
    @Scheduled(fixedDelayString = "${app.communication.events.scheduler.poll-ms:60000}")
    public void runLifecycleTick() {
        List<String> tenantIds = eventRepository.findDistinctTenantIds();
        LocalDateTime now = LocalDateTime.now();
        int safeTenantLimit = Math.max(1, tenantLimit);
        int safeBatchSize = Math.max(1, batchSize);
        for (String tenantId : tenantIds.stream().limit(safeTenantLimit).toList()) {
            TenantScopedExecution.execute(tenantId, null, "ADMIN", () -> {
                markCompleted(tenantId, now);
                publishDue(tenantId, now, safeBatchSize);
                sendReminders(tenantId, now, safeBatchSize);
                return 0;
            });
        }
    }

    private void markCompleted(String tenantId, LocalDateTime now) {
        int changed = eventRepository.markCompletedPastEvents(tenantId, now);
        if (changed > 0) {
            log.info("communication-events completed tenantId={} changed={}", tenantId, changed);
        }
    }

    private void publishDue(String tenantId, LocalDateTime now, int batchSize) {
        List<CommunicationEvent> due = eventRepository.findReadyToPublish(tenantId, now, PageRequest.of(0, batchSize));
        for (CommunicationEvent event : due) {
            try {
                String campaignId = dispatchCampaign(event, "EVENT_PUBLISHED", "Event published: " + event.getTitle(), event.getDescription(), now);
                event.setStatus(com.school.erp.modules.communication.domain.CommunicationEventStatus.PUBLISHED);
                event.setPublishedAt(now);
                event.setPublishedCampaignId(campaignId);
                eventRepository.save(event);
            } catch (Exception ex) {
                log.warn("Failed publishing scheduled event id={} tenantId={} err={}", event.getId(), tenantId, ex.getMessage());
            }
        }
    }

    private void sendReminders(String tenantId, LocalDateTime now, int batchSize) {
        List<CommunicationEvent> oneDay = eventRepository.findDueForOneDayReminder(
                tenantId,
                now.plusHours(23),
                now.plusHours(25),
                PageRequest.of(0, batchSize));
        for (CommunicationEvent event : oneDay) {
            try {
                String campaignId = dispatchCampaign(
                        event,
                        "EVENT_REMINDER_1D",
                        "Reminder: " + event.getTitle() + " is tomorrow",
                        composeReminderMessage(event, "tomorrow"),
                        now);
                event.setReminder1dSentAt(now);
                event.setReminder1dCampaignId(campaignId);
                eventRepository.save(event);
            } catch (Exception ex) {
                log.warn("Failed 1d reminder id={} tenantId={} err={}", event.getId(), tenantId, ex.getMessage());
            }
        }

        List<CommunicationEvent> oneHour = eventRepository.findDueForOneHourReminder(
                tenantId,
                now.plusMinutes(50),
                now.plusMinutes(70),
                PageRequest.of(0, batchSize));
        for (CommunicationEvent event : oneHour) {
            try {
                String campaignId = dispatchCampaign(
                        event,
                        "EVENT_REMINDER_1H",
                        "Reminder: " + event.getTitle() + " starts soon",
                        composeReminderMessage(event, "in about 1 hour"),
                        now);
                event.setReminder1hSentAt(now);
                event.setReminder1hCampaignId(campaignId);
                eventRepository.save(event);
            } catch (Exception ex) {
                log.warn("Failed 1h reminder id={} tenantId={} err={}", event.getId(), tenantId, ex.getMessage());
            }
        }
    }

    private String dispatchCampaign(
            CommunicationEvent event,
            String eventType,
            String title,
            String message,
            LocalDateTime now) {
        CampaignDTOs.CampaignRequest req = new CampaignDTOs.CampaignRequest();
        req.setTitle(title);
        req.setMessage(message);
        req.setEventType(eventType);
        req.setTargetAudience(event.getAudienceScope() != null ? event.getAudienceScope() : Enums.TargetAudience.ALL);
        req.setTargetClassId(event.getTargetClassId());
        req.setTargetSectionId(event.getTargetSectionId());
        req.setLocale(event.getLocaleCode() == null || event.getLocaleCode().isBlank() ? "en" : event.getLocaleCode());
        req.setChannels(List.of("SMS", "IN_APP"));
        req.setScheduledAt(campaignService.resolveSendSlotSkirtingQuietHours(now.plusMinutes(2)).toString());
        return campaignService.send(req).getCampaignId();
    }

    private String composeReminderMessage(CommunicationEvent event, String relativeTime) {
        String when = event.getEventStartAt() != null ? event.getEventStartAt().format(TS_FORMAT) : "scheduled time";
        String where = (event.getLocation() != null && !event.getLocation().isBlank()) ? (" at " + event.getLocation()) : "";
        String desc = (event.getDescription() != null && !event.getDescription().isBlank()) ? (" - " + event.getDescription()) : "";
        return event.getTitle() + " is scheduled " + relativeTime + " (" + when + ")" + where + desc;
    }
}
