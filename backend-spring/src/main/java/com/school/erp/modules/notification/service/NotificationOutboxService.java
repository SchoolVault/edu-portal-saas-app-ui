package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.entity.NotificationOutbox;
import com.school.erp.modules.notification.repository.NotificationOutboxRepository;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.platform.port.NotificationDispatchPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Transactional outbox for SMS/WhatsApp (and similar). A scheduled worker marks rows SENT in mock mode.
 */
@Service
public class NotificationOutboxService implements NotificationDispatchPort {
    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxService.class);
    private final NotificationOutboxRepository repo;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public NotificationOutboxService(
            NotificationOutboxRepository repo,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional
    public void enqueue(String tenantId, String eventType, String channel, Long recipientUserId, String phoneE164,
                        String subject, String body, String dedupeKey, String correlationId) {
        String phone = phoneE164;
        if ((phone == null || phone.isBlank()) && recipientUserId != null) {
            phone = userRepository.findByIdAndTenantIdAndIsDeletedFalse(recipientUserId, tenantId)
                    .map(u -> u.getPhone() != null ? u.getPhone().trim() : "")
                    .orElse("");
        }
        boolean inApp = channel != null && "IN_APP".equalsIgnoreCase(channel.trim());
        if ((phone == null || phone.isBlank()) && !inApp) {
            log.debug("Skip outbox enqueue (no phone) event={} userId={}", eventType, recipientUserId);
            return;
        }
        if (inApp && recipientUserId == null) {
            log.debug("Skip IN_APP outbox (no user) event={}", eventType);
            return;
        }
        if (dedupeKey != null && !dedupeKey.isBlank() && repo.existsByTenantIdAndDedupeKeyAndIsDeletedFalse(tenantId, dedupeKey)) {
            log.debug("Skip duplicate outbox dedupeKey={}", dedupeKey);
            return;
        }
        NotificationOutbox row = new NotificationOutbox();
        row.setTenantId(tenantId);
        row.setEventType(eventType);
        row.setChannel(channel);
        row.setRecipientUserId(recipientUserId);
        row.setRecipientPhoneE164(phone != null && !phone.isBlank() ? phone.trim() : null);
        row.setSubject(subject);
        row.setBodyText(body);
        row.setDedupeKey(dedupeKey);
        row.setStatus("PENDING");
        row.setCorrelationId(correlationId);
        try {
            repo.save(row);
        } catch (DataIntegrityViolationException ex) {
            log.debug("Outbox dedupe race for key={}: {}", dedupeKey, ex.getMessage());
        }
    }

    @Transactional
    public int processPendingBatchMock(int maxRows) {
        var batch = repo.findTop100ByStatusAndIsDeletedFalseOrderByCreatedAtAsc("PENDING");
        int n = 0;
        for (NotificationOutbox row : batch) {
            if (n >= maxRows) {
                break;
            }
            if (row.getChannel() != null && "IN_APP".equalsIgnoreCase(row.getChannel().trim())
                    && row.getRecipientUserId() != null) {
                Enums.NotificationType t = "FEE_REMINDER".equals(row.getEventType())
                        ? Enums.NotificationType.WARNING
                        : Enums.NotificationType.INFO;
                String link = ("FEE_REMINDER".equals(row.getEventType()) || "FEE_ASSIGNED".equals(row.getEventType()))
                        ? "/app/parent/children"
                        : "/app/inbox";
                Notification inApp = Notification.builder()
                        .title(row.getSubject() != null ? row.getSubject() : "Notice")
                        .message(row.getBodyText())
                        .type(t)
                        .userId(row.getRecipientUserId())
                        .isRead(false)
                        .link(link)
                        .build();
                inApp.setTenantId(row.getTenantId());
                notificationRepository.save(inApp);
            }
            row.setStatus("SENT");
            row.setProcessedAt(LocalDateTime.now());
            row.setAttempts(row.getAttempts() + 1);
            repo.save(row);
            log.info("MOCK outbox delivery channel={} event={} tenant={} userId={} phone={}",
                    row.getChannel(), row.getEventType(), row.getTenantId(), row.getRecipientUserId(), row.getRecipientPhoneE164());
            n++;
        }
        return n;
    }
}
