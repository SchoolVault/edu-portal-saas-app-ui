package com.school.erp.modules.finance.domain;

/**
 * Gate for Razorpay Route (linked account) before parent fee checkout is allowed.
 * Platform merchant mode uses {@link #NOT_REQUIRED} only.
 */
public enum PaymentRoutingOnboardingStatus {
    /** Fee settlement is platform merchant — parent checkout does not need Route onboarding. */
    NOT_REQUIRED,
    /** School is editing Route settings; checkout blocked for Route until submitted and approved. */
    DRAFT,
    /** School submitted for platform review — checkout blocked. */
    SUBMITTED,
    /** Platform approved — parent Route checkout allowed. */
    LIVE,
    /** LIVE config was changed — must re-submit for review before checkout. */
    PENDING_CHANGES
}
