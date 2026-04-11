import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  buildParentMockInitialReceipts,
  MOCK_PARENT_CHILDREN,
  MOCK_PARENT_SEED_FEE_OBLIGATIONS,
  MOCK_PARENT_SEED_FEE_PAYMENTS,
  mockParentAttendanceRecords,
  mockParentAttendanceStats,
  mockParentMarkRows,
} from '../mocks/parent.mock-data';
import { ApiService } from './api.service';
import { AttendanceRecord, AttendanceStats, CheckoutSession, CheckoutSessionRequest, FeePayment, MarkRecord, ParentFeeObligation, PaymentReceipt, Student } from '../models/models';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private mockReceipts: PaymentReceipt[] = [];
  private mockObligationsMutable: ParentFeeObligation[] | null = null;
  private mockFeePaymentsMutable: FeePayment[] | null = null;
  private pendingCheckout: { paymentId: number; studentId: number; amount: number } | null = null;

  constructor(private api: ApiService) {
    this.bootstrapMockReceiptLedger();
  }

  getChildren(): Observable<Student[]> {
    if (runtimeConfig.useMocks) {
      return of(MOCK_PARENT_CHILDREN.map(c => ({ ...c }))).pipe(delay(150));
    }
    return this.api.get<any[]>('/parent/children').pipe(
      map(children => children.map(child => this.normalizeStudent(child)))
    );
  }

  private normalizeStudent(child: any): Student {
    return {
      ...child,
      id: Number(child.id),
      classId: child.classId != null ? Number(child.classId) : 0,
      sectionId: child.sectionId != null ? Number(child.sectionId) : 0,
      parentId: child.parentId != null ? Number(child.parentId) : 0,
      parentUserId: child.parentUserId != null ? Number(child.parentUserId) : undefined,
      tenantId: child.tenantId ?? '',
      status: (child.status?.toLowerCase?.() ?? 'active') as Student['status'],
      firstName: child.firstName ?? '',
      lastName: child.lastName ?? '',
      email: child.email ?? '',
      phone: child.phone ?? '',
      dateOfBirth: child.dateOfBirth ?? '',
      gender: child.gender ?? '',
      className: child.className ?? '',
      sectionName: child.sectionName ?? '',
      rollNumber: child.rollNumber ?? '',
      admissionNumber: child.admissionNumber ?? '',
      admissionDate: child.admissionDate ?? '',
      parentName: child.parentName ?? '',
      address: child.address ?? '',
      bloodGroup: child.bloodGroup ?? '',
    };
  }

  getChildMarks(studentId: number): Observable<MarkRecord[]> {
    if (runtimeConfig.useMocks) {
      const child = MOCK_PARENT_CHILDREN.find(c => c.id === studentId);
      const name = child ? `${child.firstName} ${child.lastName}` : 'Student';
      return of(mockParentMarkRows(studentId, name).map(m => ({ ...m }))).pipe(delay(150));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/marks`).pipe(
      map(marks =>
        marks.map(mark => ({
          ...mark,
          id: Number(mark.id),
          examId: Number(mark.examId),
          studentId: Number(mark.studentId),
          classId: mark.classId != null ? Number(mark.classId) : 0,
          tenantId: mark.tenantId ?? ''
        }))
      )
    );
  }

  getChildFees(studentId: number): Observable<FeePayment[]> {
    if (runtimeConfig.useMocks) {
      this.ensureMockFeeState();
      return of(this.mockFeePaymentsMutable!.filter(payment => payment.studentId === studentId)).pipe(delay(150));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/fees`).pipe(
      map(payments =>
        payments.map(payment => ({
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
          status: payment.status
        }))
      )
    );
  }

  getChildAttendance(studentId: number, from: string, to: string): Observable<AttendanceStats> {
    if (runtimeConfig.useMocks) {
      return of({ ...mockParentAttendanceStats(studentId) }).pipe(delay(150));
    }
    return this.api.get<any>(`/parent/children/${studentId}/attendance?from=${from}&to=${to}`).pipe(
      map(stats => ({
        studentId: stats.studentId != null ? Number(stats.studentId) : undefined,
        totalDays: stats.totalDays,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        excused: stats.excused,
        attendancePercentage: stats.attendancePercentage
      }))
    );
  }

  getChildAttendanceRecords(studentId: number, from: string, to: string): Observable<AttendanceRecord[]> {
    if (runtimeConfig.useMocks) {
      return of(mockParentAttendanceRecords(studentId, from, to).map(r => ({ ...r }))).pipe(delay(150));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/attendance-records?from=${from}&to=${to}`).pipe(
      map(records =>
        records.map(record => ({
          ...record,
          id: Number(record.id),
          studentId: Number(record.studentId),
          classId: Number(record.classId),
          sectionId: Number(record.sectionId),
          markedBy: record.markedBy != null ? Number(record.markedBy) : 0,
          tenantId: record.tenantId ?? '',
          status: record.status
        }))
      )
    );
  }

  getChildOverview(studentId: number, from: string, to: string) {
    return forkJoin({
      marks: this.getChildMarks(studentId),
      fees: this.getChildFees(studentId),
      attendance: this.getChildAttendance(studentId, from, to),
      attendanceRecords: this.getChildAttendanceRecords(studentId, from, to)
    });
  }

  getChildFeeObligations(studentId: number): Observable<ParentFeeObligation[]> {
    if (runtimeConfig.useMocks) {
      this.ensureMockFeeState();
      return of(this.mockObligationsMutable!.filter(item => item.studentId === studentId)).pipe(delay(150));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/fee-obligations`).pipe(
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
        attemptId: Date.now(),
        provider: request.provider,
        providerOrderId: 'MOCK-ORDER-' + Date.now(),
        checkoutToken: 'mock-token-' + Date.now(),
        currency: 'INR',
        amount: request.amount,
        checkoutUrl: (request.returnUrl || '/app/parent') + '?mockPayment=1',
        status: 'initiated'
      }).pipe(delay(300));
    }
    return this.api
      .post<any>('/parent/payments/checkout-session', {
        paymentId: request.paymentId,
        studentId: request.studentId,
        amount: request.amount,
        provider: request.provider,
        returnUrl: request.returnUrl,
      })
      .pipe(
        map(
          (session): CheckoutSession => ({
            attemptId: Number(session.attemptId),
            provider: String(session.provider ?? ''),
            providerOrderId: String(session.providerOrderId ?? ''),
            checkoutToken: String(session.checkoutToken ?? ''),
            currency: String(session.currency ?? 'INR'),
            amount: Number(session.amount ?? 0),
            checkoutUrl: String(session.checkoutUrl ?? ''),
            status: String(session.status ?? ''),
          })
        )
      );
  }

  confirmCheckout(attemptId: string | number, checkoutToken: string, providerPaymentId?: string): Observable<PaymentReceipt> {
    if (runtimeConfig.useMocks) {
      this.ensureMockFeeState();
      const receipt = this.buildMockReceipt(attemptId, providerPaymentId);
      this.applyMockPaymentToState(receipt);
      this.pendingCheckout = null;
      this.mockReceipts = [receipt, ...this.mockReceipts.filter(item => item.receiptNumber !== receipt.receiptNumber)];
      return of(receipt).pipe(delay(500));
    }
    const aid = Number(attemptId);
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

  listChildReceipts(studentId: number, from: string, to: string): Observable<PaymentReceipt[]> {
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
    return this.api
      .get<any[]>(`/parent/children/${studentId}/receipts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .pipe(map(list => (list || []).map(item => this.normalizeReceipt(item))));
  }

  private normalizeObligation(item: any): ParentFeeObligation {
    return {
      paymentId: Number(item.paymentId),
      studentId: Number(item.studentId),
      studentName: item.studentName,
      feeStructureId: Number(item.feeStructureId ?? 0),
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
      paymentId: Number(item.paymentId),
      studentId: Number(item.studentId),
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
    this.mockReceipts = buildParentMockInitialReceipts().map(r => ({
      ...r,
      lineItems: r.lineItems.map(li => ({ ...li })),
    }));
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
    return MOCK_PARENT_SEED_FEE_PAYMENTS.map(p => ({ ...p }));
  }

  private seedMockFeeObligations(): ParentFeeObligation[] {
    return MOCK_PARENT_SEED_FEE_OBLIGATIONS.map(o => ({
      ...o,
      lineItems: o.lineItems.map(li => ({ ...li })),
    }));
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

  private buildMockReceipt(attemptId: string | number, providerPaymentId?: string): PaymentReceipt {
    const pend = this.pendingCheckout;
    const paymentId = pend?.paymentId ?? 8;
    const studentId = pend?.studentId ?? 12;
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
      providerPaymentId: providerPaymentId || 'MOCK-PAY-' + String(attemptId),
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
