import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { FeeStructure, FeePayment } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { coerceApiLongId } from '../utils/coerce-api-long-id';

let MOCK_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: 'fs1',
    name: 'Standard Fee - Class 1-5',
    classId: 'c5',
    className: 'Class 5',
    academicYearId: 'ay1',
    components: [
      { name: 'Tuition', amount: 2400, type: 'tuition' },
      { name: 'Transport', amount: 600, type: 'transport' },
      { name: 'Hostel', amount: 0, type: 'hostel' },
      { name: 'Uniform', amount: 350, type: 'uniform' },
      { name: 'Library', amount: 200, type: 'library' },
      { name: 'Lab Fee', amount: 300, type: 'lab' }
    ],
    totalAmount: 3850,
    tenantId: 't1'
  },
  {
    id: 'fs2',
    name: 'Standard Fee - Class 6-8',
    classId: 'c8',
    className: 'Class 8',
    academicYearId: 'ay1',
    components: [
      { name: 'Tuition', amount: 3200, type: 'tuition' },
      { name: 'Transport', amount: 600, type: 'transport' },
      { name: 'Hostel', amount: 800, type: 'hostel' },
      { name: 'Uniform', amount: 400, type: 'uniform' },
      { name: 'Library', amount: 300, type: 'library' },
      { name: 'Lab Fee', amount: 500, type: 'lab' },
      { name: 'Computer Fee', amount: 400, type: 'misc' }
    ],
    totalAmount: 6200,
    tenantId: 't1'
  },
  {
    id: 'fs3',
    name: 'Standard Fee - Class 9-12',
    classId: 'c10',
    className: 'Class 10',
    academicYearId: 'ay1',
    components: [
      { name: 'Tuition', amount: 4000, type: 'tuition' },
      { name: 'Transport', amount: 600, type: 'transport' },
      { name: 'Hostel', amount: 1200, type: 'hostel' },
      { name: 'Uniform', amount: 500, type: 'uniform' },
      { name: 'Library', amount: 400, type: 'library' },
      { name: 'Lab Fee', amount: 800, type: 'lab' },
      { name: 'Computer Fee', amount: 500, type: 'misc' },
      { name: 'Sports Fee', amount: 200, type: 'sports' }
    ],
    totalAmount: 8200,
    tenantId: 't1'
  }
];

function sumComponents(components: { amount: number }[]): number {
  return components.reduce((s, c) => s + Number(c.amount ?? 0), 0);
}

@Injectable({ providedIn: 'root' })
export class FeeService {
  private payments: FeePayment[] = [
    { id: 'fp1', studentId: 's1', studentName: 'Arjun Patel', feeStructureId: 'fs1', amount: 3850, paidAmount: 3850, dueAmount: 0, status: 'paid', paymentDate: '2025-07-15', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-001', tenantId: 't1' },
    { id: 'fp2', studentId: 's2', studentName: 'Emily Watson', feeStructureId: 'fs2', amount: 6200, paidAmount: 3100, dueAmount: 3100, status: 'partial', paymentDate: '2025-07-20', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-002', tenantId: 't1' },
    { id: 'fp3', studentId: 's3', studentName: 'Liam Chen', feeStructureId: 'fs2', amount: 6200, paidAmount: 0, dueAmount: 6200, status: 'overdue', dueDate: '2025-07-31', discount: 0, lateFee: 250, tenantId: 't1' },
    { id: 'fp4', studentId: 's4', studentName: 'Sofia Martinez', feeStructureId: 'fs2', amount: 6200, paidAmount: 6200, dueAmount: 0, status: 'paid', paymentDate: '2025-07-10', dueDate: '2025-07-31', discount: 500, lateFee: 0, receiptNumber: 'REC-2025-003', tenantId: 't1' },
    { id: 'fp5', studentId: 's9', studentName: 'Mason Davis', feeStructureId: 'fs3', amount: 8200, paidAmount: 0, dueAmount: 8200, status: 'unpaid', dueDate: '2026-01-31', discount: 0, lateFee: 0, tenantId: 't1' },
    { id: 'fp6', studentId: 's10', studentName: 'Charlotte Wilson', feeStructureId: 'fs3', amount: 8200, paidAmount: 8200, dueAmount: 0, status: 'paid', paymentDate: '2026-01-05', dueDate: '2026-01-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-001', tenantId: 't1' },
    { id: 'fp7', studentId: 's11', studentName: 'Oliver Taylor', feeStructureId: 'fs3', amount: 8200, paidAmount: 4000, dueAmount: 4200, status: 'partial', paymentDate: '2026-01-10', dueDate: '2026-01-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-002', tenantId: 't1' },
    { id: 'fp8', studentId: 's12', studentName: 'Emma Chen', feeStructureId: 'fs2', amount: 6200, paidAmount: 4800, dueAmount: 1400, status: 'partial', paymentDate: '2025-08-01', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-004', tenantId: 't1' }
  ];

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

  getStudentPayments(studentId: string): Observable<FeePayment[]> {
    if (!runtimeConfig.useMocks) {
      const sid = coerceApiLongId(studentId, 'student');
      return this.api.get<any[]>(`/fees/payments/student/${sid}`).pipe(map(payments => payments.map(item => this.normalizePayment(item))));
    }
    return of(this.payments.filter(p => p.studentId === studentId)).pipe(delay(300));
  }

  recordPayment(payment: FeePayment): Observable<FeePayment> {
    if (!runtimeConfig.useMocks) {
      const body: Record<string, unknown> = {
        studentId: coerceApiLongId(payment.studentId, 'student'),
        studentName: payment.studentName,
        totalAmount: payment.amount,
        paymentAmount: payment.paidAmount,
        dueDate: payment.dueDate,
        discount: payment.discount,
        paymentMethod: 'CASH'
      };
      if (payment.id) {
        body['paymentId'] = coerceApiLongId(payment.id, 'payment');
      }
      if (payment.feeStructureId) {
        body['feeStructureId'] = coerceApiLongId(payment.feeStructureId, 'fee structure');
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

  addFeeStructure(fs: Omit<FeeStructure, 'id' | 'totalAmount' | 'tenantId'> & { id?: string }): Observable<FeeStructure> {
    const total = sumComponents(fs.components);
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<any>('/fees/structures', {
          name: fs.name,
          classId: coerceApiLongId(fs.classId, 'class'),
          className: fs.className,
          academicYearId: fs.academicYearId ? coerceApiLongId(fs.academicYearId, 'academic year') : null,
          components: fs.components.map(component => ({
            name: component.name,
            amount: component.amount,
            type: component.type?.toUpperCase()
          }))
        })
        .pipe(map(item => this.normalizeStructure(item)));
    }
    const row: FeeStructure = {
      id: fs.id && fs.id.length ? fs.id : 'fs' + Date.now(),
      name: fs.name,
      classId: fs.classId,
      className: fs.className,
      academicYearId: fs.academicYearId || 'ay1',
      components: fs.components.map(c => ({ ...c })),
      totalAmount: total,
      tenantId: 't1'
    };
    MOCK_FEE_STRUCTURES = [...MOCK_FEE_STRUCTURES, row];
    return of({ ...row }).pipe(delay(400));
  }

  updateFeeStructure(
    id: string,
    fs: Omit<FeeStructure, 'id' | 'totalAmount' | 'tenantId'> & { components: FeeStructure['components'] }
  ): Observable<FeeStructure> {
    const total = sumComponents(fs.components);
    if (!runtimeConfig.useMocks) {
      return this.api
        .put<any>(`/fees/structures/${coerceApiLongId(id, 'fee structure')}`, {
          name: fs.name,
          classId: coerceApiLongId(fs.classId, 'class'),
          className: fs.className,
          academicYearId: fs.academicYearId ? coerceApiLongId(fs.academicYearId, 'academic year') : null,
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
      academicYearId: fs.academicYearId || prev?.academicYearId || 'ay1'
    };
    MOCK_FEE_STRUCTURES = MOCK_FEE_STRUCTURES.map(x => (x.id === id ? row : x));
    return of({ ...row, components: row.components.map(c => ({ ...c })) }).pipe(delay(400));
  }

  deleteFeeStructure(id: string): Observable<void> {
    if (!runtimeConfig.useMocks) {
      return this.api.delete<void>(`/fees/structures/${coerceApiLongId(id, 'fee structure')}`);
    }
    MOCK_FEE_STRUCTURES = MOCK_FEE_STRUCTURES.filter(x => x.id !== id);
    return of(undefined).pipe(delay(300));
  }

  private normalizeStructure(structure: any): FeeStructure {
    return {
      ...structure,
      id: String(structure.id),
      classId: structure.classId != null ? String(structure.classId) : '',
      academicYearId: structure.academicYearId != null ? String(structure.academicYearId) : '',
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
      id: String(payment.id),
      studentId: String(payment.studentId),
      feeStructureId: payment.feeStructureId != null ? String(payment.feeStructureId) : '',
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
