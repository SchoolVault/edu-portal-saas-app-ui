package com.school.erp.modules.payment.domain;

/**
 * {@code purpose} values for {@link com.school.erp.modules.payment.dto.PaymentDTOs.CreateOrderRequest}
 * and similar flows. Keeps fees, payroll, and other products from inventing divergent strings.
 */
public final class PaymentCheckoutPurpose {

    /** Generic hosted order (legacy / operations demos). */
    public static final String GENERIC = "GENERIC";

    /** Parent or admin-initiated school fee payment. */
    public static final String SCHOOL_FEE = "SCHOOL_FEE";

    /** Future: salary advance / collection (not implemented). */
    public static final String PAYROLL_COLLECTION = "PAYROLL_COLLECTION";

    /** Future: one-off or recurring donation checkout. */
    public static final String DONATION = "DONATION";

    private PaymentCheckoutPurpose() {
    }
}
