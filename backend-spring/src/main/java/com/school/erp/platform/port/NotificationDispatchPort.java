package com.school.erp.platform.port;

import java.time.LocalDateTime;

/**
 * Outbound port for fee reminders, payroll notices, etc. Default: transactional SQL outbox.
 * Swap the bean for Kafka / Redis Streams without changing fee or payroll modules.
 */
public interface NotificationDispatchPort {

    void enqueue(String tenantId, String eventType, String channel, Long recipientUserId, String phoneE164,
                 String subject, String body, String dedupeKey, String correlationId);

    default void enqueueScheduled(
            String tenantId,
            String eventType,
            String channel,
            Long recipientUserId,
            String phoneE164,
            String subject,
            String body,
            String dedupeKey,
            String correlationId,
            LocalDateTime scheduledAt) {
        enqueue(tenantId, eventType, channel, recipientUserId, phoneE164, subject, body, dedupeKey, correlationId);
    }
}
