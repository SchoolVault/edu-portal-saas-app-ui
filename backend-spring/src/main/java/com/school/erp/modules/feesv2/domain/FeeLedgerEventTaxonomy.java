package com.school.erp.modules.feesv2.domain;

import java.util.Set;

public final class FeeLedgerEventTaxonomy {
    private FeeLedgerEventTaxonomy() {}

    public static final String DEMAND_POSTED = "DEMAND_POSTED";
    public static final String PAYMENT_RECEIVED = "PAYMENT_RECEIVED";
    public static final String REFUND_POSTED = "REFUND_POSTED";
    public static final String ADJUSTMENT_POSTED = "ADJUSTMENT_POSTED";
    public static final String ADVANCE_BALANCE_CREDIT = "ADVANCE_BALANCE_CREDIT";
    public static final String LATE_FEE_POSTED = "LATE_FEE_POSTED";

    public static final Set<String> ALL = Set.of(
            DEMAND_POSTED,
            PAYMENT_RECEIVED,
            REFUND_POSTED,
            ADJUSTMENT_POSTED,
            ADVANCE_BALANCE_CREDIT,
            LATE_FEE_POSTED
    );
}
