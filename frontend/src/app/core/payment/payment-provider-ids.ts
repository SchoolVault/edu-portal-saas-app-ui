/**
 * Canonical lowercase gateway ids — keep in sync with
 * {@code com.school.erp.modules.payment.domain.PaymentProviderIds} and
 * {@code app.payments.parent.enabled-providers}.
 */
export const PAYMENT_PROVIDER_IDS = {
  RAZORPAY: 'razorpay',
  MOCKPAY: 'mockpay',
  STRIPE: 'stripe',
} as const;

export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[keyof typeof PAYMENT_PROVIDER_IDS];

export function normalizePaymentProviderId(raw: string | undefined | null): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase();
}
