package com.school.erp.modules.notification.service;

import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.entity.NotificationOutbox;
import com.school.erp.modules.notification.repository.NotificationOutboxRepository;
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
public class NotificationOutboxService {
    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxService.class);
    private final NotificationOutboxRepository repo;
    private final UserRepository userRepository;

    public NotificationOutboxService(NotificationOutboxRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    @Transactional
    public void enqueue(String tenantId, String eventType, String channel, Long recipientUserId, String phoneE164,
                        String subject, String body, String dedupeKey, String correlationId) {
        String phone = phoneE164;
        if ((phone == null || phone.isBlank()) && recipientUserId != null) {
            phone = userRepository.findByIdAndTenantIdAndIsDeletedFalse(recipientUserId, tenantId)
                    .map(u -> u.getPhone() != null ? u.getPhone().trim() : "")
                    .orElse("");
        }
        if (phone == null || phone.isBlank()) {
            log.debug("Skip outbox enqueue (no phone) event={} userId={}", eventType, recipientUserId);
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
        row.setRecipientPhoneE164(phone.trim());
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
