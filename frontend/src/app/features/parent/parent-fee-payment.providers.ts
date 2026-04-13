import { PAYMENT_PROVIDER_IDS } from '../../core/payment/payment-provider-ids';

/**
 * Parent fee payment methods shown in the portal. Labels resolve via ngx-translate keys under
 * {@code parentPortal.payMethod.*}. Add entries when the backend enables new ids in
 * {@code app.payments.parent.enabled-providers} (see {@link PAYMENT_PROVIDER_IDS}).
 */
export interface ParentFeePaymentMethodOption {
  id: string;
  labelKey: string;
  hintKey: string;
}

const RAZORPAY: ParentFeePaymentMethodOption = {
  id: PAYMENT_PROVIDER_IDS.RAZORPAY,
  labelKey: 'parentPortal.payMethod.razorpay.label',
  hintKey: 'parentPortal.payMethod.razorpay.hint',
};

const MOCK_INSTANT: ParentFeePaymentMethodOption = {
  id: PAYMENT_PROVIDER_IDS.MOCKPAY,
  labelKey: 'parentPortal.payMethod.mockpay.label',
  hintKey: 'parentPortal.payMethod.mockpay.hint',
};

/** Production / real JWT: Razorpay only. */
export function parentFeePaymentMethodOptions(useMocks: boolean): ReadonlyArray<ParentFeePaymentMethodOption> {
  return useMocks
    ? [MOCK_INSTANT, { ...RAZORPAY, hintKey: 'parentPortal.payMethod.razorpay.hintMock' }]
    : [RAZORPAY];
}
