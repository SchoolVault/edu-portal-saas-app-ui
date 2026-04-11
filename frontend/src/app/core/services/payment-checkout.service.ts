import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { PaymentDtos } from '../payment/payment.dto';
import { buildMockPaymentCheckoutOrderResponse } from '../mocks/payment.mock-data';

/** Alias for {@link PaymentDtos.CreateOrderRequest} (backward compatible imports). */
export type CreatePaymentOrderRequest = PaymentDtos.CreateOrderRequest;
/** Alias for {@link PaymentDtos.CreateOrderResponse}. */
export type CreatePaymentOrderResponse = PaymentDtos.CreateOrderResponse;

@Injectable({ providedIn: 'root' })
export class PaymentCheckoutService {
  constructor(private api: ApiService) {}

  createOrder(body: PaymentDtos.CreateOrderRequest): Observable<PaymentDtos.CreateOrderResponse> {
    if (runtimeConfig.useMocks) {
      return of(
        buildMockPaymentCheckoutOrderResponse({
          amount: body.amount,
          currency: body.currency,
          purpose: body.purpose,
        })
      ).pipe(delay(200));
    }
    return this.api
      .post<PaymentDtos.CreateOrderResponse>('/payments/checkout/orders', {
        purpose: body.purpose,
        feePaymentId: body.feePaymentId,
        studentId: body.studentId,
        payeeUserId: body.payeeUserId,
        amount: body.amount,
        currency: body.currency,
        provider: body.provider,
        returnUrl: body.returnUrl,
      })
      .pipe(
        map(
          (r): PaymentDtos.CreateOrderResponse => ({
            attemptId: String(r.attemptId),
            providerOrderId: String(r.providerOrderId),
            publicKeyId: String(r.publicKeyId),
            amount: Number(r.amount),
            currency: String(r.currency),
            clientOptionsJson: String(r.clientOptionsJson ?? '{}'),
            status: String(r.status ?? 'CREATED'),
          })
        )
      );
  }
}
