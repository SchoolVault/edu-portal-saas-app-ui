package com.school.erp.modules.payment.domain;

import java.util.Locale;

/**
 * Canonical <strong>lowercase</strong> gateway ids for school payment rails (parent fee checkout,
 * future payroll collection, donations). Align with {@code app.payments.parent.enabled-providers}
 * and the Angular {@code payment-provider-ids} module.
 *
 * <p>Generic {@code POST /api/v1/payments/checkout/orders} may still accept uppercase
 * ({@code RAZORPAY}) for legacy clients — normalize at the boundary.
 */
public final class PaymentProviderIds {

    public static final String RAZORPAY = "razorpay";
    public static final String MOCKPAY = "mockpay";
    public static final String STRIPE = "stripe";

    private PaymentProviderIds() {
    }

    public static String normalize(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
    }
}
