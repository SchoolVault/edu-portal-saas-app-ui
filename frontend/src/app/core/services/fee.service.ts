import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { FeeStructure, FeePayment } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeeService {
  private structures: FeeStructure[] = [
    { id: 'fs1', name: 'Standard Fee - Class 1-5', classId: 'c5', className: 'Class 1-5', academicYearId: 'ay1', components: [{ name: 'Tuition', amount: 2400, type: 'tuition' }, { name: 'Transport', amount: 600, type: 'transport' }, { name: 'Library', amount: 200, type: 'library' }, { name: 'Lab Fee', amount: 300, type: 'lab' }], totalAmount: 3500, tenantId: 't1' },
    { id: 'fs2', name: 'Standard Fee - Class 6-8', classId: 'c8', className: 'Class 6-8', academicYearId: 'ay1', components: [{ name: 'Tuition', amount: 3200, type: 'tuition' }, { name: 'Transport', amount: 600, type: 'transport' }, { name: 'Library', amount: 300, type: 'library' }, { name: 'Lab Fee', amount: 500, type: 'lab' }, { name: 'Computer Fee', amount: 400, type: 'misc' }], totalAmount: 5000, tenantId: 't1' },
    { id: 'fs3', name: 'Standard Fee - Class 9-12', classId: 'c10', className: 'Class 9-12', academicYearId: 'ay1', components: [{ name: 'Tuition', amount: 4000, type: 'tuition' }, { name: 'Transport', amount: 600, type: 'transport' }, { name: 'Library', amount: 400, type: 'library' }, { name: 'Lab Fee', amount: 800, type: 'lab' }, { name: 'Computer Fee', amount: 500, type: 'misc' }, { name: 'Sports Fee', amount: 200, type: 'misc' }], totalAmount: 6500, tenantId: 't1' },
  ];

  private payments: FeePayment[] = [
    { id: 'fp1', studentId: 's1', studentName: 'Arjun Patel', feeStructureId: 'fs1', amount: 3500, paidAmount: 3500, dueAmount: 0, status: 'paid', paymentDate: '2025-07-15', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-001', tenantId: 't1' },
    { id: 'fp2', studentId: 's2', studentName: 'Emily Watson', feeStructureId: 'fs2', amount: 5000, paidAmount: 2500, dueAmount: 2500, status: 'partial', paymentDate: '2025-07-20', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-002', tenantId: 't1' },
    { id: 'fp3', studentId: 's3', studentName: 'Liam Chen', feeStructureId: 'fs2', amount: 5000, paidAmount: 0, dueAmount: 5000, status: 'overdue', dueDate: '2025-07-31', discount: 0, lateFee: 250, tenantId: 't1' },
    { id: 'fp4', studentId: 's4', studentName: 'Sofia Martinez', feeStructureId: 'fs2', amount: 5000, paidAmount: 5000, dueAmount: 0, status: 'paid', paymentDate: '2025-07-10', dueDate: '2025-07-31', discount: 500, lateFee: 0, receiptNumber: 'REC-2025-003', tenantId: 't1' },
    { id: 'fp5', studentId: 's9', studentName: 'Mason Davis', feeStructureId: 'fs3', amount: 6500, paidAmount: 0, dueAmount: 6500, status: 'unpaid', dueDate: '2026-01-31', discount: 0, lateFee: 0, tenantId: 't1' },
    { id: 'fp6', studentId: 's10', studentName: 'Charlotte Wilson', feeStructureId: 'fs3', amount: 6500, paidAmount: 6500, dueAmount: 0, status: 'paid', paymentDate: '2026-01-05', dueDate: '2026-01-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-001', tenantId: 't1' },
    { id: 'fp7', studentId: 's11', studentName: 'Oliver Taylor', feeStructureId: 'fs3', amount: 6500, paidAmount: 3000, dueAmount: 3500, status: 'partial', paymentDate: '2026-01-10', dueDate: '2026-01-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-002', tenantId: 't1' },
    { id: 'fp8', studentId: 's12', studentName: 'Emma Chen', feeStructureId: 'fs2', amount: 5000, paidAmount: 3800, dueAmount: 1200, status: 'partial', paymentDate: '2025-08-01', dueDate: '2025-07-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2025-004', tenantId: 't1' },
  ];

  getFeeStructures(): Observable<FeeStructure[]> {
    if (!environment.useMocks) { return this.api.get<FeeStructure[]>('/fees/structures'); }
    return of([...this.structures]).pipe(delay(400));
  }
  getPayments(): Observable<FeePayment[]> {
    if (!environment.useMocks) { return this.api.get<FeePayment[]>('/fees/payments'); }
    return of([...this.payments]).pipe(delay(400));
  }

  constructor(private api: ApiService) {}

  recordPayment(payment: FeePayment): Observable<FeePayment> {
    if (!environment.useMocks) { return this.api.post<FeePayment>('/fees/payments', payment); }
    const idx = this.payments.findIndex(p => p.id === payment.id);
    if (idx !== -1) { this.payments[idx] = payment; }
    else { this.payments.push(payment); }
    return of(payment).pipe(delay(500));
  }

  addFeeStructure(fs: FeeStructure): Observable<FeeStructure> {
    if (!environment.useMocks) { return this.api.post<FeeStructure>('/fees/structures', fs); }
    this.structures.push(fs);
    return of(fs).pipe(delay(400));
  }
}
