import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AttendanceRecord, AttendanceStats, CheckoutSession, CheckoutSessionRequest, FeePayment, MarkRecord, ParentFeeObligation, PaymentReceipt, Student } from '../models/models';
import { runtimeConfig } from '../config/runtime-config';
import { coerceApiLongId } from '../utils/coerce-api-long-id';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private mockReceipts: PaymentReceipt[] = [];

  constructor(private api: ApiService) {}

  getChildren(): Observable<Student[]> {
    if (runtimeConfig.useMocks) {
      return of([
        {
          id: 's12',
          firstName: 'Emma',
          lastName: 'Chen',
          email: 'emma.c@school.com',
          phone: '+1-555-0212',
          dateOfBirth: '2009-02-14',
          gender: 'female',
          classId: 'c8',
          className: 'Class 8',
          sectionId: 'sec8a',
          sectionName: 'A',
          rollNumber: '805',
          admissionNumber: 'ADM2022080',
          admissionDate: '2022-06-08',
          parentId: 'u3',
          parentName: 'Michael Chen',
          address: '963 Willow Street',
          bloodGroup: 'A+',
          status: 'active' as const,
          tenantId: 't1'
        }
      ]).pipe(delay(150));
    }
    return this.api.get<any[]>('/parent/children').pipe(
      map(children => children.map(child => ({
        ...child,
        id: String(child.id),
        classId: child.classId != null ? String(child.classId) : '',
        sectionId: child.sectionId != null ? String(child.sectionId) : '',
        parentId: child.parentId != null ? String(child.parentId) : '',
        tenantId: child.tenantId ?? '',
        status: child.status?.toLowerCase?.() ?? 'active'
      })))
    );
  }

  getChildMarks(studentId: string): Observable<MarkRecord[]> {
    if (runtimeConfig.useMocks) {
      return of([
        { id: 'm1', examId: 'e2', studentId, studentName: 'Emma Chen', subjectName: 'Mathematics', marksObtained: 92, maxMarks: 100, grade: 'A+', classId: 'c8', tenantId: 't1' },
        { id: 'm2', examId: 'e2', studentId, studentName: 'Emma Chen', subjectName: 'Science', marksObtained: 85, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' },
        { id: 'm3', examId: 'e2', studentId, studentName: 'Emma Chen', subjectName: 'English', marksObtained: 88, maxMarks: 100, grade: 'A', classId: 'c8', tenantId: 't1' }
      ]).pipe(delay(150));
    }
    const sid = coerceApiLongId(studentId, 'student');
    return this.api.get<any[]>(`/parent/children/${sid}/marks`).pipe(
      map(marks => marks.map(mark => ({
        ...mark,
        id: String(mark.id),
        examId: String(mark.examId),
        studentId: String(mark.studentId),
        classId: mark.classId != null ? String(mark.classId) : '',
        tenantId: mark.tenantId ?? ''
      })))
    );
  }

  getChildFees(studentId: string): Observable<FeePayment[]> {
    if (runtimeConfig.useMocks) {
      return of(this.mockFeePayments().filter(payment => payment.studentId === studentId)).pipe(delay(150));
    }
    const sid = coerceApiLongId(studentId, 'student');
    return this.api.get<any[]>(`/parent/children/${sid}/fees`).pipe(
      map(payments => payments.map(payment => ({
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
        status: payment.status
      })))
    );
  }

  getChildAttendance(studentId: string, from: string, to: string): Observable<AttendanceStats> {
    if (runtimeConfig.useMocks) {
      return of({
        studentId,
        totalDays: 22,
        present: 20,
        absent: 1,
        late: 1,
        excused: 0,
        attendancePercentage: 95.5
      }).pipe(delay(150));
    }
    const sid = coerceApiLongId(studentId, 'student');
    return this.api.get<any>(`/parent/children/${sid}/attendance?from=${from}&to=${to}`).pipe(
      map(stats => ({
        studentId: stats.studentId != null ? String(stats.studentId) : undefined,
        totalDays: stats.totalDays,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        excused: stats.excused,
        attendancePercentage: stats.attendancePercentage
      }))
    );
  }

  getChildAttendanceRecords(studentId: string, from: string, to: string): Observable<AttendanceRecord[]> {
    if (runtimeConfig.useMocks) {
      return of([
        { id: 'ar1', studentId, studentName: 'Emma Chen', classId: 'c8', sectionId: 'sec8a', date: from, status: 'present' as const, markedBy: 'u2', tenantId: 't1' },
        { id: 'ar2', studentId, studentName: 'Emma Chen', classId: 'c8', sectionId: 'sec8a', date: to, status: 'late' as const, markedBy: 'u2', tenantId: 't1' }
      ]).pipe(delay(150));
    }
    const sid = coerceApiLongId(studentId, 'student');
    return this.api.get<any[]>(`/parent/children/${sid}/attendance-records?from=${from}&to=${to}`).pipe(
      map(records => records.map(record => ({
        ...record,
        id: String(record.id),
        studentId: String(record.studentId),
        classId: String(record.classId),
        sectionId: String(record.sectionId),
        markedBy: record.markedBy != null ? String(record.markedBy) : '',
        tenantId: record.tenantId ?? '',
        status: record.status
      })))
    );
  }

  getChildOverview(studentId: string, from: string, to: string) {
    return forkJoin({
      marks: this.getChildMarks(studentId),
      fees: this.getChildFees(studentId),
      attendance: this.getChildAttendance(studentId, from, to),
      attendanceRecords: this.getChildAttendanceRecords(studentId, from, to)
    });
  }

  getChildFeeObligations(studentId: string): Observable<ParentFeeObligation[]> {
    if (runtimeConfig.useMocks) {
      return of(this.mockFeeObligations().filter(item => item.studentId === studentId)).pipe(delay(150));
    }
    const sid = coerceApiLongId(studentId, 'student');
    return this.api.get<any[]>(`/parent/children/${sid}/fee-obligations`).pipe(
      map(items => items.map(item => this.normalizeObligation(item)))
    );
  }

  createCheckoutSession(request: CheckoutSessionRequest): Observable<CheckoutSession> {
    if (runtimeConfig.useMocks) {
      return of({
        attemptId: 'attempt-' + Date.now(),
        provider: request.provider,
        providerOrderId: 'MOCK-ORDER-' + Date.now(),
        checkoutToken: 'mock-token-' + Date.now(),
        currency: 'INR',
        amount: request.amount,
        checkoutUrl: (request.returnUrl || '/app/parent') + '?mockPayment=1',
        status: 'initiated'
      }).pipe(delay(300));
    }
    return this.api.post<any>('/parent/payments/checkout-session', {
      paymentId: coerceApiLongId(request.paymentId, 'payment'),
      studentId: coerceApiLongId(request.studentId, 'student'),
      amount: request.amount,
      provider: request.provider,
      returnUrl: request.returnUrl
    }).pipe(
      map(session => ({
        ...session,
        attemptId: String(session.attemptId),
        amount: Number(session.amount ?? 0)
      }))
    );
  }

  confirmCheckout(attemptId: string, checkoutToken: string, providerPaymentId?: string): Observable<PaymentReceipt> {
    if (runtimeConfig.useMocks) {
      const receipt = this.buildMockReceipt(attemptId, providerPaymentId);
      this.mockReceipts = [receipt, ...this.mockReceipts.filter(item => item.receiptNumber !== receipt.receiptNumber)];
      return of(receipt).pipe(delay(500));
    }
    const aid = coerceApiLongId(attemptId, 'checkout attempt');
    return this.api.post<any>(`/parent/payments/checkout-session/${aid}/confirm`, {
      checkoutToken,
      providerPaymentId
    }).pipe(map(item => this.normalizeReceipt(item)));
  }

  getReceipt(receiptNumber: string): Observable<PaymentReceipt> {
    if (runtimeConfig.useMocks) {
      const receipt = this.mockReceipts.find(item => item.receiptNumber === receiptNumber) ?? this.buildMockReceipt('attempt-existing');
      return of(receipt).pipe(delay(150));
    }
    return this.api.get<any>(`/parent/payments/receipts/${receiptNumber}`).pipe(map(item => this.normalizeReceipt(item)));
  }

  private normalizeObligation(item: any): ParentFeeObligation {
    return {
      paymentId: String(item.paymentId),
      studentId: String(item.studentId),
      studentName: item.studentName,
      feeStructureId: item.feeStructureId != null ? String(item.feeStructureId) : '',
      feeStructureName: item.feeStructureName,
      className: item.className,
      dueDate: item.dueDate,
      status: item.status,
      currency: item.currency ?? 'INR',
      totalAmount: Number(item.totalAmount ?? 0),
      paidAmount: Number(item.paidAmount ?? 0),
      dueAmount: Number(item.dueAmount ?? 0),
      discount: Number(item.discount ?? 0),
      lateFee: Number(item.lateFee ?? 0),
      payableNow: Number(item.payableNow ?? 0),
      lineItems: (item.lineItems ?? item.line_items ?? []).map((line: any) => ({
        name: line.name,
        amount: Number(line.amount ?? 0),
        type: (line.type ?? 'misc').toString().toLowerCase()
      }))
    };
  }

  private normalizeReceipt(item: any): PaymentReceipt {
    return {
      receiptNumber: item.receiptNumber,
      paymentId: String(item.paymentId),
      studentId: String(item.studentId),
      studentName: item.studentName,
      feeStructureName: item.feeStructureName,
      className: item.className,
      provider: item.provider,
      providerPaymentId: item.providerPaymentId,
      paymentMethod: item.paymentMethod,
      paymentDate: item.paymentDate,
      dueDate: item.dueDate,
      currency: item.currency ?? 'INR',
      amountPaid: Number(item.amountPaid ?? 0),
      totalAmount: Number(item.totalAmount ?? 0),
      paidAmount: Number(item.paidAmount ?? 0),
      dueAmount: Number(item.dueAmount ?? 0),
      discount: Number(item.discount ?? 0),
      lateFee: Number(item.lateFee ?? 0),
      lineItems: (item.lineItems ?? item.line_items ?? []).map((line: any) => ({
        name: line.name,
        amount: Number(line.amount ?? 0),
        type: (line.type ?? 'misc').toString().toLowerCase()
      }))
    };
  }

  private mockFeePayments(): FeePayment[] {
    return [
      { id: 'fp8', studentId: 's12', studentName: 'Emma Chen', feeStructureId: 'fs2', amount: 6200, paidAmount: 4800, dueAmount: 1400, status: 'partial', paymentDate: '2026-03-10', dueDate: '2026-03-31', discount: 0, lateFee: 50, receiptNumber: 'REC-2026-101', tenantId: 't1' },
      { id: 'fp9', studentId: 's18', studentName: 'Lily Chen', feeStructureId: 'fs1', amount: 3500, paidAmount: 3500, dueAmount: 0, status: 'paid', paymentDate: '2026-03-02', dueDate: '2026-03-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-102', tenantId: 't1' }
    ];
  }

  private mockFeeObligations(): ParentFeeObligation[] {
    return [
      {
        paymentId: 'fp8',
        studentId: 's12',
        studentName: 'Emma Chen',
        feeStructureId: 'fs2',
        feeStructureName: 'Standard Fee - Class 6-8',
        className: 'Class 8',
        dueDate: '2026-03-31',
        status: 'partial',
        currency: 'INR',
        totalAmount: 6200,
        paidAmount: 4800,
        dueAmount: 1400,
        discount: 0,
        lateFee: 50,
        payableNow: 1450,
        lineItems: [
          { name: 'Tuition', amount: 3200, type: 'tuition' },
          { name: 'Transport', amount: 600, type: 'transport' },
          { name: 'Hostel', amount: 800, type: 'hostel' },
          { name: 'Uniform', amount: 400, type: 'uniform' },
          { name: 'Library', amount: 300, type: 'library' },
          { name: 'Lab Fee', amount: 500, type: 'lab' },
          { name: 'Computer Fee', amount: 400, type: 'misc' }
        ]
      }
    ];
  }

  private buildMockReceipt(attemptId: string, providerPaymentId?: string): PaymentReceipt {
    return {
      receiptNumber: 'REC-MOCK-' + Date.now(),
      paymentId: 'fp8',
      studentId: 's12',
      studentName: 'Emma Chen',
      feeStructureName: 'Standard Fee - Class 6-8',
      className: 'Class 8',
      provider: 'mockpay',
      providerPaymentId: providerPaymentId || 'MOCK-PAY-' + attemptId,
      paymentMethod: 'MOCKPAY',
      paymentDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-03-31',
      currency: 'INR',
      amountPaid: 1450,
      totalAmount: 6200,
      paidAmount: 6250,
      dueAmount: 0,
      discount: 0,
      lateFee: 0,
      lineItems: [
        { name: 'Tuition', amount: 3200, type: 'tuition' },
        { name: 'Transport', amount: 600, type: 'transport' },
        { name: 'Hostel', amount: 800, type: 'hostel' },
        { name: 'Uniform', amount: 400, type: 'uniform' },
        { name: 'Library', amount: 300, type: 'library' },
        { name: 'Lab Fee', amount: 500, type: 'lab' },
        { name: 'Computer Fee', amount: 400, type: 'misc' }
      ]
    };
  }
}
