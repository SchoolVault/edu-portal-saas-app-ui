import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

export interface CreatePaymentOrderRequest {
  purpose: string;
  feePaymentId?: string;
  studentId?: string;
  payeeUserId?: string;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'STRIPE' | 'MOCK';
  returnUrl?: string;
}

export interface CreatePaymentOrderResponse {
  attemptId: string;
  providerOrderId: string;
  publicKeyId: string;
  amount: number;
  currency: string;
  clientOptionsJson: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentCheckoutService {
  constructor(private api: ApiService) {}

  createOrder(body: CreatePaymentOrderRequest): Observable<CreatePaymentOrderResponse> {
    if (runtimeConfig.useMocks) {
      const res: CreatePaymentOrderResponse = {
        attemptId: 'mock-att-' + Date.now(),
        providerOrderId: 'ord_mock_' + Date.now(),
        publicKeyId: 'rzp_test_mock',
        amount: body.amount,
        currency: body.currency,
        clientOptionsJson: JSON.stringify({
          key: 'rzp_test_mock',
          amount: Math.round(body.amount * 100),
          currency: body.currency,
          order_id: 'ord_mock_' + Date.now(),
          name: 'SchoolVault (demo)',
          description: body.purpose,
        }),
        status: 'CREATED',
      };
      return of(res).pipe(delay(200));
    }
    return this.api
      .post<any>('/payments/checkout/orders', {
        purpose: body.purpose,
        feePaymentId: body.feePaymentId ? Number(body.feePaymentId) : undefined,
        studentId: body.studentId ? Number(body.studentId) : undefined,
        payeeUserId: body.payeeUserId ? Number(body.payeeUserId) : undefined,
        amount: body.amount,
        currency: body.currency,
        provider: body.provider,
        returnUrl: body.returnUrl,
      })
      .pipe(
        map((r: any) => ({
          attemptId: String(r.attemptId),
          providerOrderId: String(r.providerOrderId),
          publicKeyId: String(r.publicKeyId),
          amount: Number(r.amount),
          currency: String(r.currency),
          clientOptionsJson: String(r.clientOptionsJson ?? '{}'),
          status: String(r.status ?? 'CREATED'),
        }))
      );
  }
}
