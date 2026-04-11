import type { PaymentDtos } from '../models/payment.dto';

/**
 * Mock aligned with {@link PaymentDtos.CreateOrderResponse} (POST /api/v1/payments/checkout/orders).
 * One timestamp keeps providerOrderId and clientOptionsJson.order_id in sync.
 */
export function buildMockPaymentCheckoutOrderResponse(input: {
  amount: number;
  currency: string;
  purpose: string;
}): PaymentDtos.CreateOrderResponse {
  const ts = Date.now();
  const orderId = 'ord_mock_' + ts;
  return {
    attemptId: 'mock-att-' + ts,
    providerOrderId: orderId,
    publicKeyId: 'rzp_test_mock',
    amount: input.amount,
    currency: input.currency,
    clientOptionsJson: JSON.stringify({
      key: 'rzp_test_mock',
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      order_id: orderId,
      name: 'SchoolVault (demo)',
      description: input.purpose,
    }),
    status: 'CREATED',
  };
}
