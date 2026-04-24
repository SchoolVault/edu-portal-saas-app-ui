package com.school.erp.modules.payroll.domain;

/**
 * How a paid payslip was settled: recorded outside the app vs completed via the digital payout rail.
 * Extensible for future channels (e.g. partner bank file) without changing the payslip aggregate root.
 */
public enum SalarySettlementMode {
    /** Staff used "Mark paid" after paying via school bank, cash, or any process outside the payout API. */
    OFFLINE_RECORDED,
    /** Payslip reached PAID through the configured {@code PayrollPayoutGatewayClient} (e.g. RazorpayX). */
    DIGITAL_PAYOUT
}
