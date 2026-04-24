package com.school.erp.modules.fees.domain;

public enum FeeAttemptStatus {
    /** Attempt row persisted; Razorpay order not created yet (same DB transaction as order create). */
    ORDER_CREATING,
    ORDER_CREATED,
    ATTEMPTED,
    CAPTURED,
    RECONCILED,
    REFUNDED,
    FAILED
}
