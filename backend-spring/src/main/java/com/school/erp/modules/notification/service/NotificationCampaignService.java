package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.notification.config.NotificationDeliveryProperties;
import com.school.erp.modules.communication.dto.CampaignDTOs;
import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.modules.notification.entity.NotificationCampaign;
import com.school.erp.modules.notification.repository.NotificationCampaignRepository;
import com.school.erp.modules.notification.repository.NotificationOutboxRepository;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.platform.port.NotificationDispatchAttributes;
import com.school.erp.tenant.TenantContext;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationCampaignService {
    private static final int RECIPIENT_CAP = 50000;
    private final AnnouncementAudienceResolver audienceResolver;
    private final NotificationDispatchPort dispatchPort;
    private final NotificationCampaignTemplateService templateService;
    private final NotificationCampaignRepository campaignRepository;
    private final NotificationOutboxRepository outboxRepository;
    private final NotificationDeliveryProperties deliveryProperties;

    public NotificationCampaignService(
            AnnouncementAudienceResolver audienceResolver,
            NotificationDispatchPort dispatchPort,
            NotificationCampaignTemplateService templateService,
            NotificationCampaignRepository campaignRepository,
            NotificationOutboxRepository outboxRepository,
            NotificationDeliveryProperties deliveryProperties) {
        this.audienceResolver = audienceResolver;
        this.dispatchPort = dispatchPort;
        this.templateService = templateService;
        this.campaignRepository = campaignRepository;
        this.outboxRepository = outboxRepository;
        this.deliveryProperties = deliveryProperties;
    }

    @Transactional(readOnly = true)
    public CampaignDTOs.CampaignPreviewResponse preview(CampaignDTOs.CampaignRequest req) {
        ValidatedCampaign validated = validate(req);
        List<AnnouncementAudienceResolver.AudienceMember> recipients = resolveRecipients(validated);
        CampaignDTOs.CampaignPreviewResponse out = new CampaignDTOs.CampaignPreviewResponse();
        out.setEstimatedRecipients(recipients.size());
        out.setRecipientCountsByRole(groupByRole(recipients));
        out.setChannelRecipientCounts(channelCounts(validated.channels(), recipients.size()));
        out.setEstimatedCostMinor(estimateCostMinor(validated.channels(), recipients.size()));
        List<String> warnings = new ArrayList<>();
        if (recipients.size() >= RECIPIENT_CAP) {
            warnings.add("Audience capped at " + RECIPIENT_CAP + " recipients for safety.");
        }
        if (validated.scheduledAt() != null && validated.scheduledAt().isAfter(LocalDateTime.now().plusDays(30))) {
            warnings.add("Scheduled time is over 30 days ahead; verify campaign timing.");
        }
        out.setWarnings(warnings);
        return out;
    }

    /**
     * Validation failures throw {@link BusinessException} before any enqueue or campaign row is written.
     * {@code noRollbackFor} keeps participating outer transactions (e.g. batch schedulers that catch and log)
     * from being marked rollback-only — otherwise Spring throws {@code UnexpectedRollbackException} on commit.
     */
    @Transactional(noRollbackFor = BusinessException.class)
    public CampaignDTOs.CampaignSendResponse send(CampaignDTOs.CampaignRequest req) {
        ValidatedCampaign validated = validate(req);
        List<AnnouncementAudienceResolver.AudienceMember> recipients = resolveRecipients(validated);
        String tenantId = TenantContext.getTenantId();
        String campaignId = "cmp-" + UUID.randomUUID().toString().replace("-", "");
        int queued = 0;
        for (AnnouncementAudienceResolver.AudienceMember member : recipients) {
            for (String channel : validated.channels()) {
                String correlationId = campaignId + "-" + channel.toLowerCase(Locale.ROOT) + "-" + member.userId();
                String dedupe = campaignId + ":" + channel + ":" + member.userId();
                String body = templateService.render(
                        channel,
                        validated.eventType(),
                        validated.locale(),
                        buildTemplateVars(validated, member),
                        validated.message());
                if (validated.scheduledAt() != null) {
                    dispatchPort.enqueueScheduled(
                            tenantId,
                            validated.eventType(),
                            channel,
                            member.userId(),
                            member.phone(),
                            validated.title(),
                            body,
                            dedupe,
                            correlationId,
                            validated.scheduledAt(),
                            NotificationDispatchAttributes.inheritFromThread());
                } else {
                    dispatchPort.enqueue(
                            tenantId,
                            validated.eventType(),
                            channel,
                            member.userId(),
                            member.phone(),
                            validated.title(),
                            body,
                            dedupe,
                            correlationId,
                            NotificationDispatchAttributes.inheritFromThread());
                }
                queued++;
            }
        }
        NotificationCampaign campaign = new NotificationCampaign();
        campaign.setTenantId(tenantId);
        campaign.setCampaignId(campaignId);
        campaign.setTitle(validated.title());
        campaign.setEventType(validated.eventType());
        campaign.setTargetAudience(validated.targetAudience().name());
        campaign.setTargetClassId(validated.targetClassId());
        campaign.setTargetSectionId(validated.targetSectionId());
        campaign.setChannelsCsv(String.join(",", validated.channels()));
        campaign.setLocaleCode(validated.locale());
        campaign.setStatus(validated.scheduledAt() != null ? "SCHEDULED" : "QUEUED");
        campaign.setRecipientCount(recipients.size());
        campaign.setQueuedCount(queued);
        campaign.setScheduledAt(validated.scheduledAt());
        campaignRepository.save(campaign);

        CampaignDTOs.CampaignSendResponse out = new CampaignDTOs.CampaignSendResponse();
        out.setCampaignId(campaignId);
        out.setRecipientCount(recipients.size());
        out.setQueuedCount(queued);
        out.setScheduled(validated.scheduledAt() != null);
        out.setScheduledAt(validated.scheduledAt() != null ? validated.scheduledAt().toString() : null);
        return out;
    }

    @Transactional(readOnly = true)
    public PageResponse<CampaignDTOs.CampaignHistoryItem> history(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        Page<NotificationCampaign> rows = campaignRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(
                tenantId,
                PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100))));
        Page<CampaignDTOs.CampaignHistoryItem> mapped = rows.map(this::toHistoryItem);
        return PageResponse.fromSpringPage(mapped);
    }

    @Transactional(readOnly = true)
    public CampaignDTOs.CampaignAnalyticsResponse analytics(String campaignId) {
        if (campaignId == null || campaignId.isBlank()) {
            throw new BusinessException("campaignId is required.");
        }
        String tenantId = TenantContext.getTenantId();
        campaignRepository.findByTenantIdAndCampaignIdAndIsDeletedFalse(tenantId, campaignId)
                .orElseThrow(() -> new BusinessException("Campaign not found."));
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : outboxRepository.aggregateStatusCountsByCampaign(tenantId, campaignId)) {
            String status = row[0] == null ? "UNKNOWN" : String.valueOf(row[0]).toUpperCase(Locale.ROOT);
            long count = row[1] instanceof Number n ? n.longValue() : 0L;
            counts.put(status, count);
        }
        CampaignDTOs.CampaignAnalyticsResponse out = new CampaignDTOs.CampaignAnalyticsResponse();
        out.setCampaignId(campaignId);
        out.setStatusCounts(counts);
        out.setTotal(counts.values().stream().mapToLong(Long::longValue).sum());
        out.setSent(counts.getOrDefault("SENT", 0L));
        out.setRetry(counts.getOrDefault("RETRY", 0L) + counts.getOrDefault("PROCESSING", 0L));
        out.setDeadLetter(counts.getOrDefault("DEAD_LETTER", 0L));
        return out;
    }

    @Transactional(readOnly = true)
    public List<CampaignDTOs.CampaignTemplateResponse> listTemplates() {
        return templateService.listTemplates();
    }

    @Transactional
    public CampaignDTOs.CampaignTemplateResponse upsertTemplate(Long id, CampaignDTOs.CampaignTemplateUpsertRequest req) {
        return templateService.upsertTemplate(id, req);
    }

    private Map<String, String> buildTemplateVars(
            ValidatedCampaign validated,
            AnnouncementAudienceResolver.AudienceMember member) {
        Map<String, String> vars = new LinkedHashMap<>();
        vars.put("title", validated.title());
        vars.put("message", validated.message());
        vars.put("eventType", validated.eventType());
        vars.put("recipientRole", member.role());
        if (validated.templateVariables() != null) {
            vars.putAll(validated.templateVariables());
        }
        return vars;
    }

    private Map<String, Integer> groupByRole(List<AnnouncementAudienceResolver.AudienceMember> recipients) {
        Map<String, Integer> out = new LinkedHashMap<>();
        for (AnnouncementAudienceResolver.AudienceMember member : recipients) {
            String role = member.role() == null || member.role().isBlank() ? "UNKNOWN" : member.role().toUpperCase(Locale.ROOT);
            out.put(role, out.getOrDefault(role, 0) + 1);
        }
        return out;
    }

    private Map<String, Integer> channelCounts(Set<String> channels, int recipients) {
        Map<String, Integer> out = new LinkedHashMap<>();
        for (String channel : channels) {
            out.put(channel, recipients);
        }
        return out;
    }

    private long estimateCostMinor(Set<String> channels, int recipients) {
        long total = 0;
        for (String channel : channels) {
            if ("SMS".equals(channel)) {
                total += (long) recipients * 25L;
            } else if ("WHATSAPP".equals(channel)) {
                total += (long) recipients * 35L;
            } else if ("EMAIL".equals(channel)) {
                total += (long) recipients * 5L;
            }
        }
        return total;
    }

    private List<AnnouncementAudienceResolver.AudienceMember> resolveRecipients(ValidatedCampaign validated) {
        Announcement pseudo = new Announcement();
        pseudo.setTenantId(TenantContext.getTenantId());
        pseudo.setTargetAudience(validated.targetAudience());
        pseudo.setTargetClassId(validated.targetClassId());
        pseudo.setTargetSectionId(validated.targetSectionId());
        List<AnnouncementAudienceResolver.AudienceMember> all = audienceResolver.resolve(pseudo);
        if (all.size() <= RECIPIENT_CAP) {
            return all;
        }
        return all.subList(0, RECIPIENT_CAP);
    }

    private ValidatedCampaign validate(CampaignDTOs.CampaignRequest req) {
        if (req == null) {
            throw new BusinessException("Campaign request is required.");
        }
        String title = req.getTitle() != null ? req.getTitle().trim() : "";
        String message = req.getMessage() != null ? req.getMessage().trim() : "";
        if (title.isEmpty() || message.isEmpty()) {
            throw new BusinessException("Campaign title and message are required.");
        }
        if (req.getTargetAudience() == null) {
            throw new BusinessException("Target audience is required.");
        }
        Set<String> channels = new LinkedHashSet<>();
        for (String c : req.getChannels()) {
            if (c == null || c.isBlank()) {
                continue;
            }
            String cc = c.trim().toUpperCase(Locale.ROOT);
            if (!Set.of("SMS", "WHATSAPP", "EMAIL", "IN_APP").contains(cc)) {
                throw new BusinessException("Unsupported channel: " + cc);
            }
            channels.add(cc);
        }
        if (channels.isEmpty()) {
            throw new BusinessException("At least one channel is required.");
        }
        Enums.TargetAudience aud = req.getTargetAudience();
        if ((aud == Enums.TargetAudience.CLASS || aud == Enums.TargetAudience.SECTION) && req.getTargetClassId() == null) {
            throw new BusinessException("Class is required for class/section audience.");
        }
        if (aud == Enums.TargetAudience.SECTION && req.getTargetSectionId() == null) {
            throw new BusinessException("Section is required for section audience.");
        }
        LocalDateTime scheduledAt = parseScheduledAt(req.getScheduledAt());
        if (scheduledAt != null && scheduledAt.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new BusinessException("Scheduled time must be in the future.");
        }
        if (scheduledAt == null && isWithinQuietHours(LocalDateTime.now())) {
            throw new BusinessException("Campaign send is blocked during quiet hours. Please schedule for later.");
        }
        if (scheduledAt != null && isWithinQuietHours(scheduledAt)) {
            throw new BusinessException("Scheduled time falls in quiet hours window.");
        }
        if (channels.contains("SMS") && deliveryProperties.isEnforceDltTemplateForSms()
                && !templateService.hasActiveSmsTemplateWithDlt(templateService.normalizeEventType(req.getEventType()),
                req.getLocale() == null ? "en" : req.getLocale().trim().toLowerCase(Locale.ROOT))) {
            throw new BusinessException("Active SMS template with DLT id is required for this event type.");
        }
        return new ValidatedCampaign(
                title,
                message,
                templateService.normalizeEventType(req.getEventType()),
                aud,
                req.getTargetClassId(),
                req.getTargetSectionId(),
                channels,
                req.getLocale() == null ? "en" : req.getLocale().trim().toLowerCase(Locale.ROOT),
                req.getTemplateVariables(),
                scheduledAt);
    }

    private LocalDateTime parseScheduledAt(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw.trim());
        } catch (DateTimeParseException ex) {
            throw new BusinessException("scheduledAt must be ISO local datetime, e.g. 2026-04-25T09:30:00");
        }
    }

    private CampaignDTOs.CampaignHistoryItem toHistoryItem(NotificationCampaign row) {
        CampaignDTOs.CampaignHistoryItem out = new CampaignDTOs.CampaignHistoryItem();
        out.setCampaignId(row.getCampaignId());
        out.setTitle(row.getTitle());
        out.setEventType(row.getEventType());
        out.setTargetAudience(row.getTargetAudience());
        out.setRecipientCount(row.getRecipientCount());
        out.setQueuedCount(row.getQueuedCount());
        out.setStatus(row.getStatus());
        out.setScheduledAt(row.getScheduledAt() != null ? row.getScheduledAt().toString() : null);
        out.setCreatedAt(row.getCreatedAt() != null ? row.getCreatedAt().toString() : null);
        return out;
    }

    /**
     * For batch jobs (e.g. communication lifecycle): pick the earliest time at or after {@code minDesired} that is
     * not blocked by quiet-hours rules, using the same wall-clock interpretation as campaign {@code send} validation.
     */
    public LocalDateTime resolveSendSlotSkirtingQuietHours(LocalDateTime minDesired) {
        LocalDateTime floor = LocalDateTime.now().plusMinutes(1);
        LocalDateTime t = minDesired.isBefore(floor) ? floor.plusMinutes(1) : minDesired;
        int guard = 0;
        while (isWithinQuietHours(t) && guard++ < 192) {
            t = t.plusMinutes(15);
        }
        return t;
    }

    private boolean isWithinQuietHours(LocalDateTime localDateTime) {
        ZoneId zone;
        try {
            zone = ZoneId.of(deliveryProperties.getQuietHoursTimezone());
        } catch (Exception ex) {
            zone = ZoneId.of("Asia/Kolkata");
        }
        LocalTime start = parseTimeSafe(deliveryProperties.getQuietHoursStart(), LocalTime.of(22, 0));
        LocalTime end = parseTimeSafe(deliveryProperties.getQuietHoursEnd(), LocalTime.of(7, 0));
        LocalTime now = localDateTime.atZone(zone).toLocalTime();
        if (start.equals(end)) {
            return false;
        }
        if (start.isBefore(end)) {
            return !now.isBefore(start) && now.isBefore(end);
        }
        return !now.isBefore(start) || now.isBefore(end);
    }

    private LocalTime parseTimeSafe(String raw, LocalTime fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        try {
            return LocalTime.parse(raw.trim());
        } catch (Exception ex) {
            return fallback;
        }
    }

    private record ValidatedCampaign(
            String title,
            String message,
            String eventType,
            Enums.TargetAudience targetAudience,
            Long targetClassId,
            Long targetSectionId,
            Set<String> channels,
            String locale,
            Map<String, String> templateVariables,
            LocalDateTime scheduledAt) {}
}
