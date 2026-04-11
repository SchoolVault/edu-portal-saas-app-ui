/**
 * Mirrors {@code com.school.erp.modules.payment.dto.PaymentDTOs}
 * (POST /api/v1/payments/checkout/orders body + ApiResponse data).
 * For {@code purpose}, prefer constants from {@link ./payment-checkout-purpose}.
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
    /** Legacy generic checkout: uppercase RAZORPAY | STRIPE | MOCK. Parent fee API uses lowercase (see payment-provider-ids). */
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
