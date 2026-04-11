import { PAYMENT_PROVIDER_IDS } from '../../core/payment/payment-provider-ids';

/**
 * Parent fee payment methods shown in the portal. Add entries when the backend enables new ids
 * in {@code app.payments.parent.enabled-providers} (see {@link PAYMENT_PROVIDER_IDS}).
 */
export interface ParentFeePaymentMethodOption {
  id: string;
  label: string;
  hint: string;
}

const RAZORPAY: ParentFeePaymentMethodOption = {
  id: PAYMENT_PROVIDER_IDS.RAZORPAY,
  label: 'Razorpay',
  hint: 'UPI, cards & netbanking in a secure window (production)',
};

const MOCK_INSTANT: ParentFeePaymentMethodOption = {
  id: PAYMENT_PROVIDER_IDS.MOCKPAY,
  label: 'Instant (demo)',
  hint: 'Completes in-browser — no school API (mock portal only)',
};

/** Production / real JWT: Razorpay only. */
export function parentFeePaymentMethodOptions(useMocks: boolean): ReadonlyArray<ParentFeePaymentMethodOption> {
  return useMocks ? [MOCK_INSTANT, { ...RAZORPAY, hint: 'Preview tile — use real login (useMocks: false) to pay' }] : [RAZORPAY];
}
