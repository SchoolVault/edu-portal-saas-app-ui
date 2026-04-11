/**
 * Shared payment contracts for fees, generic checkout, and future payroll/donations.
 * Import from {@code app/core/payment} instead of scattering provider strings.
 */
export { PAYMENT_PROVIDER_IDS, normalizePaymentProviderId, type PaymentProviderId } from './payment-provider-ids';
export { PAYMENT_CHECKOUT_PURPOSE, type PaymentCheckoutPurpose } from './payment-checkout-purpose';
export * from './payment.dto';
export { loadRazorpayScript, openRazorpaySchoolFeeCheckout, type RazorpayHandlerResponse } from './razorpay-checkout';
