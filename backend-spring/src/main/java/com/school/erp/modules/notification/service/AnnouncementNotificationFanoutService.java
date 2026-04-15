package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.platform.port.NotificationDispatchPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * After an announcement is persisted: per-user in-app notifications + outbox rows for SMS/WhatsApp (mock send).
 */
@Service
public class AnnouncementNotificationFanoutService {
    private static final Logger log = LoggerFactory.getLogger(AnnouncementNotificationFanoutService.class);
    private final AnnouncementAudienceResolver audienceResolver;
    private final NotificationService notificationService;
    private final NotificationDispatchPort notificationDispatchPort;

    public AnnouncementNotificationFanoutService(
            AnnouncementAudienceResolver audienceResolver,
            NotificationService notificationService,
            NotificationDispatchPort notificationDispatchPort) {
        this.audienceResolver = audienceResolver;
        this.notificationService = notificationService;
        this.notificationDispatchPort = notificationDispatchPort;
    }

    @Transactional
    public void onAnnouncementCreated(Announcement ann) {
        String tenantId = ann.getTenantId();
        String title = ann.getTitle() != null ? ann.getTitle() : "Announcement";
        String snippet = truncate(ann.getContent(), 280);
        String link = "/app/communication";
        var members = audienceResolver.resolve(ann);
        log.info("Announcement fan-out audienceSize={} announcementId={} tenant={}", members.size(), ann.getId(), tenantId);
        for (AnnouncementAudienceResolver.AudienceMember m : members) {
            notificationService.createNotification(
                    tenantId,
                    m.userId(),
                    title,
                    snippet,
                    Enums.NotificationType.INFO,
                    link);
            String dedupeSms = "ANN:" + ann.getId() + ":SMS:" + m.userId();
            notificationDispatchPort.enqueue(
                    tenantId,
                    "ANNOUNCEMENT_SMS",
                    "SMS",
                    m.userId(),
                    m.phone(),
                    title,
                    snippet,
                    dedupeSms,
                    "ann-" + ann.getId());
            String dedupeWa = "ANN:" + ann.getId() + ":WA:" + m.userId();
            notificationDispatchPort.enqueue(
                    tenantId,
                    "ANNOUNCEMENT_WHATSAPP",
                    "WHATSAPP",
                    m.userId(),
                    m.phone(),
                    title,
                    snippet,
                    dedupeWa,
                    "ann-" + ann.getId());
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        String t = s.replaceAll("\\s+", " ").trim();
        if (t.length() <= max) {
            return t;
        }
        return t.substring(0, max - 3) + "...";
    }
}
