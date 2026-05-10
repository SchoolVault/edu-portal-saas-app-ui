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
  }

  export interface ConfirmCheckoutRequest {
    checkoutToken: string;
    providerPaymentId?: string;
    providerSignature?: string;
  }

  export interface PaymentReceiptResponse {
    receiptNumber: string;
    schoolName?: string;
    schoolCode?: string;
    schoolAddress?: string;
    schoolPhone?: string;
    schoolEmail?: string;
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
  }
}
