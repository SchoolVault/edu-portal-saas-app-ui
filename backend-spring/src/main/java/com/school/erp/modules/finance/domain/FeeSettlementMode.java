package com.school.erp.modules.finance.domain;

/**
 * How fee collection is configured for the tenant (parent portal + settlement intent).
 * <ul>
 *   <li>{@link #OFFLINE_SCHOOL_COLLECTION} — parents pay at school; staff records fees; no gateway checkout.</li>
 *   <li>{@link #PLATFORM_MERCHANT} — online parent checkout when platform + env allow; funds on platform merchant.</li>
 *   <li>{@link #ROUTE_LINKED_ACCOUNT} — Razorpay Route: settlement split via linked account id on the order.</li>
 * </ul>
 */
public enum FeeSettlementMode {
    OFFLINE_SCHOOL_COLLECTION,
    PLATFORM_MERCHANT,
    ROUTE_LINKED_ACCOUNT;

    public static FeeSettlementMode fromDb(String raw) {
        if (raw == null || raw.isBlank()) {
            return OFFLINE_SCHOOL_COLLECTION;
        }
        try {
            return valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return OFFLINE_SCHOOL_COLLECTION;
        }
    }
}
