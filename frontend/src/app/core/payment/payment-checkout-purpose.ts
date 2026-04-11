/**
 * {@code purpose} field for generic checkout orders — mirror of
 * {@code com.school.erp.modules.payment.domain.PaymentCheckoutPurpose}.
 */
export const PAYMENT_CHECKOUT_PURPOSE = {
  GENERIC: 'GENERIC',
  SCHOOL_FEE: 'SCHOOL_FEE',
  PAYROLL_COLLECTION: 'PAYROLL_COLLECTION',
  DONATION: 'DONATION',
} as const;

export type PaymentCheckoutPurpose = (typeof PAYMENT_CHECKOUT_PURPOSE)[keyof typeof PAYMENT_CHECKOUT_PURPOSE];
