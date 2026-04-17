package com.school.erp.platform.port;

/**
 * Outbound port for fee reminders, payroll notices, etc. Default: transactional SQL outbox.
 * Swap the bean for Kafka / Redis Streams without changing fee or payroll modules.
 */
public interface NotificationDispatchPort {

    void enqueue(String tenantId, String eventType, String channel, Long recipientUserId, String phoneE164,
                 String subject, String body, String dedupeKey, String correlationId);
}
