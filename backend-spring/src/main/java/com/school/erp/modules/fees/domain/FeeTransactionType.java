package com.school.erp.modules.fees.domain;

public final class FeeTransactionType {
    private FeeTransactionType() {}

    public static final String OBLIGATION_CREATED = "OBLIGATION_CREATED";
    public static final String PAYMENT_CAPTURED = "PAYMENT_CAPTURED";
    public static final String PAYMENT_MANUAL_POSTED = "PAYMENT_MANUAL_POSTED";
    public static final String WAIVER_GRANTED = "WAIVER_GRANTED";
    public static final String REFUND_REQUESTED = "REFUND_REQUESTED";
    public static final String REFUND_APPROVED = "REFUND_APPROVED";
    public static final String REFUND_EXECUTED = "REFUND_EXECUTED";
    /** Provider-side refund settled (dashboard or API) when no prior ERP refund approval row exists. */
    public static final String PROVIDER_REFUND_SETTLED = "PROVIDER_REFUND_SETTLED";
}
