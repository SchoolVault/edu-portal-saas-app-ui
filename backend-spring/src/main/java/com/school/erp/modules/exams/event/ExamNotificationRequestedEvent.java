package com.school.erp.modules.exams.event;

/**
 * Published when an exam lifecycle action should trigger user notifications.
 * Consumed after transaction commit to keep request-path writes lean and safe.
 */
public record ExamNotificationRequestedEvent(
        String tenantId,
        Long examId,
        String eventType
) {}
