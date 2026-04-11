import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_FEE_PAYMENTS_SEED, MOCK_FEE_STRUCTURES_SEED } from '../mocks/fee.mock-data';
import { FeeStructure, FeePayment } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

let MOCK_FEE_STRUCTURES: FeeStructure[] = MOCK_FEE_STRUCTURES_SEED.map(s => ({
  ...s,
  components: s.components.map(c => ({ ...c })),
}));

function sumComponents(components: { amount: number }[]): number {
  return components.reduce((s, c) => s + Number(c.amount ?? 0), 0);
}

@Injectable({ providedIn: 'root' })
export class FeeService {
  private payments: FeePayment[] = MOCK_FEE_PAYMENTS_SEED.map(p => ({ ...p }));

  constructor(private api: ApiService) {}

  getFeeStructures(): Observable<FeeStructure[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>('/fees/structures').pipe(map(structures => structures.map(item => this.normalizeStructure(item))));
    }
    return of(MOCK_FEE_STRUCTURES.map(s => ({ ...s, components: s.components.map(c => ({ ...c })) }))).pipe(delay(400));
  }

  getPayments(): Observable<FeePayment[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>('/fees/payments').pipe(map(payments => payments.map(item => this.normalizePayment(item))));
    }
    return of([...this.payments]).pipe(delay(400));
  }

  getStudentPayments(studentId: number): Observable<FeePayment[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/fees/payments/student/${studentId}`).pipe(map(payments => payments.map(item => this.normalizePayment(item))));
    }
    return of(this.payments.filter(p => p.studentId === studentId)).pipe(delay(300));
  }

  recordPayment(payment: FeePayment): Observable<FeePayment> {
    if (!runtimeConfig.useMocks) {
      const body: Record<string, unknown> = {
        studentId: payment.studentId,
        studentName: payment.studentName,
        totalAmount: payment.amount,
        paymentAmount: payment.paidAmount,
        dueDate: payment.dueDate,
        discount: payment.discount,
        paymentMethod: 'CASH'
      };
      if (payment.id) {
        body['paymentId'] = payment.id;
      }
      if (payment.feeStructureId) {
        body['feeStructureId'] = payment.feeStructureId;
      }
      return this.api.post<FeePayment>('/fees/payments', body).pipe(map(item => this.normalizePayment(item)));
    }
    const idx = this.payments.findIndex(p => p.id === payment.id);
    if (idx !== -1) {
      this.payments[idx] = payment;
    } else {
      this.payments.push(payment);
    }
    return of(payment).pipe(delay(500));
  }

  addFeeStructure(fs: Omit<FeeStructure, 'id' | 'totalAmount' | 'tenantId'> & { id?: number }): Observable<FeeStructure> {
    const total = sumComponents(fs.components);
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any>('/fees/structures', {
          name: fs.name,
          classId: fs.classId,
          className: fs.className,
          academicYearId: fs.academicYearId ?? null,
          components: fs.components.map(component => ({
            name: component.name,
            amount: component.amount,
            type: component.type?.toUpperCase()
          }))
        })
        .pipe(map(item => this.normalizeStructure(item)));
    }
    const nextId = Math.max(0, ...MOCK_FEE_STRUCTURES.map(s => s.id)) + 1;
    const row: FeeStructure = {
      id: fs.id && fs.id > 0 ? fs.id : nextId,
      name: fs.name,
      classId: fs.classId,
      className: fs.className,
      academicYearId: fs.academicYearId || 1,
      components: fs.components.map(c => ({ ...c })),
      totalAmount: total,
      tenantId: 't1'
    };
    MOCK_FEE_STRUCTURES = [...MOCK_FEE_STRUCTURES, row];
    return of({ ...row }).pipe(delay(400));
  }

  updateFeeStructure(
    id: number,
    fs: Omit<FeeStructure, 'id' | 'totalAmount' | 'tenantId'> & { components: FeeStructure['components'] }
  ): Observable<FeeStructure> {
    const total = sumComponents(fs.components);
    if (!runtimeConfig.useMocks) {
      return this.api
        .put<any>(`/fees/structures/${id}`, {
          name: fs.name,
          classId: fs.classId,
          className: fs.className,
          academicYearId: fs.academicYearId ?? null,
          components: fs.components.map(component => ({
            name: component.name,
            amount: component.amount,
            type: component.type?.toUpperCase()
          }))
        })
        .pipe(map(item => this.normalizeStructure(item)));
    }
    const prev = MOCK_FEE_STRUCTURES.find(x => x.id === id);
    const row: FeeStructure = {
      ...fs,
      id,
      totalAmount: total,
      tenantId: prev?.tenantId ?? 't1',
      academicYearId: fs.academicYearId || prev?.academicYearId || 1
    };
    MOCK_FEE_STRUCTURES = MOCK_FEE_STRUCTURES.map(x => (x.id === id ? row : x));
    return of({ ...row, components: row.components.map(c => ({ ...c })) }).pipe(delay(400));
  }

  deleteFeeStructure(id: number): Observable<void> {
    if (!runtimeConfig.useMocks) {
      return this.api.delete<void>(`/fees/structures/${id}`);
    }
    MOCK_FEE_STRUCTURES = MOCK_FEE_STRUCTURES.filter(x => x.id !== id);
    return of(undefined).pipe(delay(300));
  }

  private normalizeStructure(structure: any): FeeStructure {
    return {
      ...structure,
      id: Number(structure.id),
      classId: structure.classId != null ? Number(structure.classId) : 0,
      academicYearId: structure.academicYearId != null ? Number(structure.academicYearId) : 0,
      tenantId: structure.tenantId ?? '',
      components: (structure.components ?? []).map((component: any) => ({
        name: component.name,
        amount: Number(component.amount ?? 0),
        type: (component.type ?? '').toLowerCase()
      })),
      totalAmount: Number(structure.totalAmount ?? 0)
    };
  }

  private normalizePayment(payment: any): FeePayment {
    const lineItems = payment.lineItems ?? payment.line_items;
    return {
      ...payment,
      id: Number(payment.id),
      studentId: Number(payment.studentId),
      feeStructureId: payment.feeStructureId != null ? Number(payment.feeStructureId) : 0,
      amount: Number(payment.amount ?? 0),
      paidAmount: Number(payment.paidAmount ?? 0),
      dueAmount: Number(payment.dueAmount ?? 0),
      discount: Number(payment.discount ?? 0),
      lateFee: Number(payment.lateFee ?? 0),
      tenantId: payment.tenantId ?? '',
      status: payment.status,
      lineItems: Array.isArray(lineItems)
        ? lineItems.map((line: any) => ({
            name: line.name,
            amount: Number(line.amount ?? 0),
            type: (line.type ?? 'misc').toString().toLowerCase()
          }))
        : undefined
    };
  }
}
