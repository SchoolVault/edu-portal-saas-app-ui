package com.school.erp.modules.communication.service;

import com.school.erp.modules.communication.repository.AnnouncementRepository;
import com.school.erp.modules.communication.repository.CommunicationEventRepository;
import com.school.erp.modules.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Soft-deletes aged announcements and tenant notifications to cap table growth (driven by {@code app.communication.retention.*}).
 */
@Service
public class CommunicationRetentionService {
    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final CommunicationEventRepository communicationEventRepository;

    public CommunicationRetentionService(
            final AnnouncementRepository announcementRepository,
            final NotificationRepository notificationRepository,
            final CommunicationEventRepository communicationEventRepository) {
        this.announcementRepository = announcementRepository;
        this.notificationRepository = notificationRepository;
        this.communicationEventRepository = communicationEventRepository;
    }

    public record RetentionSweepResult(int announcementsSoftDeleted, int notificationsSoftDeleted, int eventsSoftDeleted) {
    }

    @Transactional
    public RetentionSweepResult softDeleteOlderThanForTenant(final String tenantId, final LocalDateTime cutoff) {
        LocalDateTime now = LocalDateTime.now();
        int a = announcementRepository.softDeleteTenantAnnouncementsOlderThan(tenantId, cutoff, now);
        int n = notificationRepository.softDeleteTenantNotificationsOlderThan(tenantId, cutoff, now);
        int e = communicationEventRepository.softDeleteTenantEventsOlderThan(tenantId, cutoff, now);
        return new RetentionSweepResult(a, n, e);
    }
}
