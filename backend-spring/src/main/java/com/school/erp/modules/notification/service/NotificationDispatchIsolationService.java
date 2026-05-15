package com.school.erp.modules.notification.service;

import com.school.erp.platform.port.NotificationDispatchAttributes;
import com.school.erp.platform.port.NotificationDispatchPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Isolates notification outbox enqueue from caller transactions.
 * Prevents a failed outbox insert from poisoning the caller persistence context.
 */
@Service
public class NotificationDispatchIsolationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationDispatchIsolationService.class);
    private final NotificationDispatchPort notificationDispatchPort;

    public NotificationDispatchIsolationService(NotificationDispatchPort notificationDispatchPort) {
        this.notificationDispatchPort = notificationDispatchPort;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueueIsolated(
            String tenantId,
            String eventType,
            String channel,
            Long recipientUserId,
            String target,
            String subject,
            String body,
            String dedupeKey,
            String correlationId,
            NotificationDispatchAttributes attrs
    ) {
        try {
            notificationDispatchPort.enqueue(
                    tenantId,
                    eventType,
                    channel,
                    recipientUserId,
                    target,
                    subject,
                    body,
                    dedupeKey,
                    correlationId,
                    attrs);
        } catch (RuntimeException ex) {
            log.warn(
                    "Isolated outbox enqueue failed tenant={} event={} channel={} userId={} corr={} reason={}",
                    tenantId,
                    eventType,
                    channel,
                    recipientUserId,
                    correlationId,
                    ex.toString());
        }
    }
}
