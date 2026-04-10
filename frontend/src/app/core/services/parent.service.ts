import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AttendanceRecord, AttendanceStats, CheckoutSession, CheckoutSessionRequest, FeePayment, MarkRecord, ParentFeeLineItem, ParentFeeObligation, PaymentReceipt, Student } from '../models/models';
import { runtimeConfig } from '../config/runtime-config';
import { coerceApiLongId } from '../utils/coerce-api-long-id';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private mockReceipts: PaymentReceipt[] = [];
  /** Mutable mock fee state (obligations + ledger rows) updated after mock checkout confirm. */
  private mockObligationsMutable: ParentFeeObligation[] | null = null;
  private mockFeePaymentsMutable: FeePayment[] | null = null;
  private pendingCheckout: { paymentId: string; studentId: string; amount: number } | null = null;

  private static readonly MOCK_RECEIPT_LINES: ParentFeeLineItem[] = [
    { name: 'Tuition', amount: 3200, type: 'tuition' },
    { name: 'Transport', amount: 600, type: 'transport' },
    { name: 'Hostel', amount: 800, type: 'hostel' },
    { name: 'Uniform', amount: 400, type: 'uniform' },
    { name: 'Library', amount: 300, type: 'library' },
    { name: 'Lab Fee', amount: 500, type: 'lab' },
    { name: 'Computer Fee', amount: 400, type: 'misc' }
  ];

  constructor(private api: ApiService) {
    this.bootstrapMockReceiptLedger();
  }

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
      this.ensureMockFeeState();
      return of(this.mockFeePaymentsMutable!.filter(payment => payment.studentId === studentId)).pipe(delay(150));
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
      this.ensureMockFeeState();
      return of(this.mockObligationsMutable!.filter(item => item.studentId === studentId)).pipe(delay(150));
    }
    const sid = coerceApiLongId(studentId, 'student');
    return this.api.get<any[]>(`/parent/children/${sid}/fee-obligations`).pipe(
      map(items => items.map(item => this.normalizeObligation(item)))
    );
  }

  createCheckoutSession(request: CheckoutSessionRequest): Observable<CheckoutSession> {
    if (runtimeConfig.useMocks) {
      this.pendingCheckout = {
        paymentId: request.paymentId,
        studentId: request.studentId,
        amount: request.amount
      };
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
      this.ensureMockFeeState();
      const receipt = this.buildMockReceipt(attemptId, providerPaymentId);
      this.applyMockPaymentToState(receipt);
      this.pendingCheckout = null;
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
      this.bootstrapMockReceiptLedger();
      const receipt = this.mockReceipts.find(item => item.receiptNumber === receiptNumber) ?? this.buildMockReceipt('attempt-existing');
      return of(receipt).pipe(delay(150));
    }
    return this.api.get<any>(`/parent/payments/receipts/${receiptNumber}`).pipe(map(item => this.normalizeReceipt(item)));
  }

  /** Receipts for payment activity (date range inclusive, ISO yyyy-MM-dd). */
  listChildReceipts(studentId: string, from: string, to: string): Observable<PaymentReceipt[]> {
    if (runtimeConfig.useMocks) {
      this.bootstrapMockReceiptLedger();
      const start = ParentService.parseYmd(from);
      const end = ParentService.parseYmd(to);
      if (start.getTime() > end.getTime()) {
        return of([]).pipe(delay(80));
      }
      const rows = this.mockReceipts.filter(r => {
        if (r.studentId !== studentId) {
          return false;
        }
        const raw = (r.paymentDate || '').slice(0, 10);
        const d = ParentService.parseYmd(raw);
        return !Number.isNaN(d.getTime()) && d >= start && d <= end;
      });
      rows.sort(
        (a, b) =>
          ParentService.parseYmd((b.paymentDate || '').slice(0, 10)).getTime() -
          ParentService.parseYmd((a.paymentDate || '').slice(0, 10)).getTime()
      );
      return of(rows).pipe(delay(120));
    }
    const sid = coerceApiLongId(studentId, 'student');
    return this.api
      .get<any[]>(`/parent/children/${sid}/receipts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .pipe(map(list => (list || []).map(item => this.normalizeReceipt(item))));
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

  private bootstrapMockReceiptLedger(): void {
    if (this.mockReceipts.length > 0) {
      return;
    }
    const lines = ParentService.MOCK_RECEIPT_LINES.map(l => ({ ...l }));
    this.mockReceipts = [
      {
        receiptNumber: 'REC-2026-101',
        paymentId: 'fp8',
        studentId: 's12',
        studentName: 'Emma Chen',
        feeStructureName: 'Standard Fee - Class 6-8',
        className: 'Class 8',
        provider: 'upi',
        providerPaymentId: 'UPI-778821',
        paymentMethod: 'UPI',
        paymentDate: '2026-03-10',
        dueDate: '2026-03-31',
        currency: 'INR',
        amountPaid: 4800,
        totalAmount: 6200,
        paidAmount: 4800,
        dueAmount: 1400,
        discount: 0,
        lateFee: 50,
        lineItems: lines.map(l => ({ ...l }))
      },
      {
        receiptNumber: 'REC-DEMO-20260214',
        paymentId: 'fp8',
        studentId: 's12',
        studentName: 'Emma Chen',
        feeStructureName: 'Standard Fee - Class 6-8',
        className: 'Class 8',
        provider: 'mockpay',
        providerPaymentId: 'MOCK-PARTIAL-1',
        paymentMethod: 'MOCKPAY',
        paymentDate: '2026-02-14',
        dueDate: '2026-03-31',
        currency: 'INR',
        amountPaid: 1200,
        totalAmount: 6200,
        paidAmount: 3600,
        dueAmount: 2600,
        discount: 0,
        lateFee: 0,
        lineItems: lines.map(l => ({ ...l }))
      },
      {
        receiptNumber: 'REC-DEMO-20260120',
        paymentId: 'fp8',
        studentId: 's12',
        studentName: 'Emma Chen',
        feeStructureName: 'Standard Fee - Class 6-8',
        className: 'Class 8',
        provider: 'card',
        providerPaymentId: 'CARD-99102',
        paymentMethod: 'CARD',
        paymentDate: '2026-01-20',
        dueDate: '2026-03-31',
        currency: 'INR',
        amountPaid: 2400,
        totalAmount: 6200,
        paidAmount: 2400,
        dueAmount: 3800,
        discount: 0,
        lateFee: 0,
        lineItems: lines.map(l => ({ ...l }))
      }
    ];
  }

  private static parseYmd(iso: string): Date {
    const p = iso.split('-').map(Number);
    if (p.length < 3 || p.some(n => Number.isNaN(n))) {
      return new Date(NaN);
    }
    return new Date(p[0], p[1] - 1, p[2]);
  }

  private ensureMockFeeState(): void {
    if (this.mockObligationsMutable && this.mockFeePaymentsMutable) {
      return;
    }
    this.mockObligationsMutable = JSON.parse(JSON.stringify(this.seedMockFeeObligations())) as ParentFeeObligation[];
    this.mockFeePaymentsMutable = this.seedMockFeePayments().map(p => ({ ...p }));
  }

  private seedMockFeePayments(): FeePayment[] {
    return [
      { id: 'fp8', studentId: 's12', studentName: 'Emma Chen', feeStructureId: 'fs2', amount: 6200, paidAmount: 4800, dueAmount: 1400, status: 'partial', paymentDate: '2026-03-10', dueDate: '2026-03-31', discount: 0, lateFee: 50, receiptNumber: 'REC-2026-101', tenantId: 't1' },
      { id: 'fp9', studentId: 's18', studentName: 'Lily Chen', feeStructureId: 'fs1', amount: 3500, paidAmount: 3500, dueAmount: 0, status: 'paid', paymentDate: '2026-03-02', dueDate: '2026-03-31', discount: 0, lateFee: 0, receiptNumber: 'REC-2026-102', tenantId: 't1' }
    ];
  }

  private seedMockFeeObligations(): ParentFeeObligation[] {
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

  private applyMockPaymentToState(receipt: PaymentReceipt): void {
    if (!this.mockObligationsMutable || !this.mockFeePaymentsMutable) return;
    const amountPaid = receipt.amountPaid;
    const pid = receipt.paymentId;
    const sid = receipt.studentId;

    const ob = this.mockObligationsMutable.find(o => o.paymentId === pid && o.studentId === sid);
    if (ob) {
      const netDue = Math.max(0, ob.totalAmount - (ob.discount || 0));
      ob.paidAmount = Math.min(netDue, ob.paidAmount + amountPaid);
      ob.dueAmount = Math.max(0, netDue - ob.paidAmount);
      if (ob.dueAmount <= 0) {
        ob.lateFee = 0;
        ob.payableNow = 0;
        ob.status = 'paid';
      } else {
        ob.payableNow = ob.dueAmount + (ob.lateFee || 0);
        ob.status = 'partial';
      }
    }

    const fp = this.mockFeePaymentsMutable.find(p => p.id === pid && p.studentId === sid);
    if (fp) {
      const net = Math.max(0, fp.amount - (fp.discount || 0));
      fp.paidAmount = Math.min(net, fp.paidAmount + amountPaid);
      fp.dueAmount = Math.max(0, net - fp.paidAmount);
      fp.status = fp.dueAmount <= 0 ? 'paid' : 'partial';
      if (fp.dueAmount <= 0) {
        fp.lateFee = 0;
      }
    }
  }

  private buildMockReceipt(attemptId: string, providerPaymentId?: string): PaymentReceipt {
    const pend = this.pendingCheckout;
    const paymentId = pend?.paymentId ?? 'fp8';
    const studentId = pend?.studentId ?? 's12';
    const amountPaid = pend?.amount ?? 1450;
    const seedObs = this.seedMockFeeObligations();
    const ob =
      this.mockObligationsMutable?.find(o => o.paymentId === paymentId && o.studentId === studentId) ??
      seedObs.find(o => o.paymentId === paymentId && o.studentId === studentId) ??
      seedObs[0];
    const netDue = Math.max(0, ob.totalAmount - (ob.discount || 0));
    const newPaid = Math.min(netDue, ob.paidAmount + amountPaid);
    const newDue = Math.max(0, netDue - newPaid);
    return {
      receiptNumber: 'REC-MOCK-' + Date.now(),
      paymentId,
      studentId,
      studentName: ob.studentName,
      feeStructureName: ob.feeStructureName,
      className: ob.className,
      provider: 'mockpay',
      providerPaymentId: providerPaymentId || 'MOCK-PAY-' + attemptId,
      paymentMethod: 'MOCKPAY',
      paymentDate: new Date().toISOString().slice(0, 10),
      dueDate: ob.dueDate,
      currency: ob.currency,
      amountPaid,
      totalAmount: ob.totalAmount,
      paidAmount: newPaid,
      dueAmount: newDue,
      discount: ob.discount,
      lateFee: newDue <= 0 ? 0 : ob.lateFee,
      lineItems: ob.lineItems.map(li => ({ ...li }))
    };
  }
}
