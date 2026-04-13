package com.school.erp.events.domain;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Published after a fee payment row is persisted (cash desk or partial top-up).
 * Side effects belong in {@code @TransactionalEventListener(AFTER_COMMIT)} consumers.
 */
public record FeePaymentRecordedEvent(
        String tenantId,
        Long paymentId,
        Long studentId,
        String studentName,
        BigDecimal amountApplied,
        String feeStatus,
        String receiptNumber,
        Instant occurredAt
) {
}
