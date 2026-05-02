/**
 * Mirrors parent-facing fee contracts in {@code com.school.erp.modules.fees.dto.FeeDTOs}
 * (GET/POST under {@code /api/v1/parent/...}). BigDecimal → number; Long → number in JSON.
 */
export namespace ParentFeeDtos {
  export interface ParentFeeLineItem {
    name: string;
    amount: number;
    type: string;
  }

  /** Same JSON as {@code FeeDTOs.ParentFeeObligationResponse}. */
  export interface ParentFeeObligationResponse {
    paymentId: number;
    studentId: number;
    studentName: string;
    feeStructureId: number;
    feeStructureName: string;
    className?: string;
    dueDate?: string;
    /** Days until due (negative if overdue). Omitted when paid or no due date. */
    daysUntilDue?: number | null;
    /** Server sends lowercase fee status (e.g. partial, paid). */
    status: string;
    currency: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    discount: number;
    lateFee: number;
    payableNow: number;
    lineItems: ParentFeeLineItem[];
    /** Tenant capability: false = pay at school only (no gateway checkout). */
    parentOnlineFeeCheckoutEnabled?: boolean;
    /** True when obligations are built from fees v2 demands (not legacy fee_payment). */
    feesV2?: boolean;
  }

  export interface CreateCheckoutSessionRequest {
    paymentId: number;
    studentId: number;
    amount: number;
    provider: string;
    returnUrl?: string;
  }

  export interface CheckoutSessionResponse {
    attemptId: number;
    provider: string;
    providerOrderId: string;
    checkoutToken: string;
    currency: string;
    amount: number;
    checkoutUrl: string;
    status: string;
    /** Razorpay Checkout key_id when provider is razorpay. */
    publicKeyId?: string;
    /**
     * When true, payment is captured via Razorpay webhook into {@code payment_v2}; do not call confirm API.
     */
    feesV2?: boolean;
  }

  export interface ConfirmCheckoutRequest {
    checkoutToken: string;
    providerPaymentId?: string;
    providerSignature?: string;
  }

  export interface PaymentReceiptResponse {
    receiptNumber: string;
    paymentId: number;
    studentId: number;
    studentName: string;
    feeStructureName: string;
    className?: string;
    provider?: string;
    providerPaymentId?: string;
    paymentMethod?: string;
    paymentDate?: string;
    dueDate?: string;
    currency: string;
    amountPaid: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    discount: number;
    lateFee: number;
    lineItems: ParentFeeLineItem[];
    /** Synthetic obligation paymentIds for fees-v2 receipt → card linking. */
    parentObligationPaymentIds?: number[];
  }
}
