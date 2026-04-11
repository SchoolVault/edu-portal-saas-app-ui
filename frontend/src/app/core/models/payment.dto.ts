/**
 * Mirrors {@code com.school.erp.modules.payment.dto.PaymentDTOs}
 * (POST /api/v1/payments/checkout/orders body + {@link ApiResp} data).
 * Amount is {@code BigDecimal} on the server → JSON number.
 */
export namespace PaymentDtos {
  export interface CreateOrderRequest {
    purpose: string;
    feePaymentId?: number;
    studentId?: number;
    payeeUserId?: number;
    amount: number;
    currency: string;
    /** Uppercase: RAZORPAY | STRIPE | MOCK (see server validation). */
    provider: string;
    returnUrl?: string;
  }

  export interface CreateOrderResponse {
    attemptId: string;
    providerOrderId: string;
    publicKeyId: string;
    amount: number;
    currency: string;
    /** JSON string for Razorpay Checkout / Stripe.js */
    clientOptionsJson: string;
    status: string;
  }
}
