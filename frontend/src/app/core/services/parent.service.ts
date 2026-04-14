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
  mockParentExamMarks,
  mockParentExamsForStudent,
  mockParentExamSchedule,
  mockParentPublishedMarks,
  mockParentTimetableForChild,
} from '../mocks/parent.mock-data';
import { ApiService } from './api.service';
import { TimetableService } from './timetable.service';
import {
  AttendanceRecord,
  AttendanceStats,
  CheckoutSession,
  CheckoutSessionRequest,
  ExamScheduleSlot,
  FeePayment,
  MarkRecord,
  ParentExamSummary,
  ParentFeeObligation,
  PaymentReceipt,
  Student,
  TimetableEntry,
  TimetableGrid,
} from '../models/models';
import { runtimeConfig } from '../config/runtime-config';
import { PAYMENT_PROVIDER_IDS, normalizePaymentProviderId } from '../payment/payment-provider-ids';

@Injectable({ providedIn: 'root' })
export class ParentService {
  /** Checkout tokens for in-browser demo completion (see {@link #useLocalPortalFeeCheckout}). */
  private static readonly LOCAL_DEMO_TOKEN_PREFIX = 'local-demo-token-';

  private mockReceipts: PaymentReceipt[] = [];
  private mockObligationsMutable: ParentFeeObligation[] | null = null;
  private mockFeePaymentsMutable: FeePayment[] | null = null;
  /** Last amounts for local demo checkout/confirm (mock JWT cannot call {@code /parent/payments/*}). */
  private localDemoCheckout: { paymentId: number; studentId: number; amount: number } | null = null;

  constructor(
    private api: ApiService,
    private timetableService: TimetableService
  ) {
    this.bootstrapMockReceiptLedger();
  }

  getChildTimetableEntries(studentId: number): Observable<TimetableEntry[]> {
    if (runtimeConfig.useMocks) {
      return of(mockParentTimetableForChild(studentId).map(e => ({ ...e }))).pipe(delay(200));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/timetable`).pipe(
      map(rows => (rows ?? []).map(e => this.normalizeTimetableEntry(e)))
    );
  }

  getChildTimetableGrid(studentId: number): Observable<TimetableGrid> {
    if (runtimeConfig.useMocks) {
      return this.getChildTimetableEntries(studentId).pipe(
        map(entries => this.timetableService.toGridFromEntries(entries)),
        delay(120)
      );
    }
    return this.api.get<any>(`/parent/children/${studentId}/timetable/grid`).pipe(
      map(grid => ({
        classId: Number(grid.classId ?? 0),
        sectionId: grid.sectionId != null ? Number(grid.sectionId) : 0,
        days: (grid.days ?? []).map((day: string) => day.charAt(0) + day.slice(1).toLowerCase()),
        periods: grid.periods ?? [],
        grid: grid.grid ?? {}
      }))
    );
  }

  private normalizeTimetableEntry(entry: any): TimetableEntry {
    const dayRaw = entry.day ?? '';
    const dayNorm = dayRaw ? dayRaw.charAt(0) + dayRaw.slice(1).toLowerCase() : '';
    return {
      ...entry,
      id: Number(entry.id),
      classId: Number(entry.classId ?? 0),
      sectionId: entry.sectionId != null && entry.sectionId !== '' ? Number(entry.sectionId) : 0,
      teacherId: entry.teacherId != null && entry.teacherId !== '' ? Number(entry.teacherId) : 0,
      day: dayNorm,
      period: Number(entry.period ?? 0),
      tenantId: entry.tenantId ?? '',
      scheduleSource:
        entry.scheduleSource === 'COVER' ? 'COVER' : entry.scheduleSource === 'RECURRING' ? 'RECURRING' : undefined,
      coverForDate: entry.coverForDate ?? undefined
    };
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
      homeroomTeacherUserId:
        child.homeroomTeacherUserId != null ? Number(child.homeroomTeacherUserId) : undefined,
      homeroomTeacherName: child.homeroomTeacherName ?? undefined,
    };
  }

  getChildMarks(studentId: number): Observable<MarkRecord[]> {
    if (runtimeConfig.useMocks) {
      return of(mockParentPublishedMarks(studentId).map(m => ({ ...m }))).pipe(delay(150));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/marks`).pipe(map(marks => marks.map(m => this.normalizeMarkRecord(m))));
  }

  getChildExams(studentId: number): Observable<ParentExamSummary[]> {
    if (runtimeConfig.useMocks) {
      return of(mockParentExamsForStudent(studentId).map(e => ({ ...e }))).pipe(delay(120));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/exams`).pipe(
      map(rows =>
        (rows ?? []).map(r => ({
          id: Number(r.id),
          name: r.name ?? '',
          academicYearId: r.academicYearId != null ? Number(r.academicYearId) : undefined,
          startDate: r.startDate ?? undefined,
          endDate: r.endDate ?? undefined,
          status: (r.status ?? 'upcoming').toLowerCase(),
          resultsPublished: !!r.resultsPublished,
        }))
      )
    );
  }

  getChildExamSchedule(studentId: number, examId: number): Observable<ExamScheduleSlot[]> {
    if (runtimeConfig.useMocks) {
      return of(mockParentExamSchedule(studentId, examId).map(s => ({ ...s }))).pipe(delay(120));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/exams/${examId}/schedule`).pipe(
      map(rows => (rows ?? []).map(s => this.normalizeExamScheduleSlot(s, examId)))
    );
  }

  getChildExamMarks(studentId: number, examId: number): Observable<MarkRecord[]> {
    if (runtimeConfig.useMocks) {
      return of(mockParentExamMarks(studentId, examId).map(m => ({ ...m }))).pipe(delay(120));
    }
    return this.api.get<any[]>(`/parent/children/${studentId}/exams/${examId}/marks`).pipe(
      map(marks => marks.map(m => this.normalizeMarkRecord(m)))
    );
  }

  private normalizeMarkRecord(mark: any): MarkRecord {
    return {
      id: Number(mark.id),
      examId: Number(mark.examId),
      studentId: Number(mark.studentId),
      studentName: mark.studentName ?? '',
      subjectName: mark.subjectName ?? '',
      marksObtained: Number(mark.marksObtained ?? 0),
      maxMarks: Number(mark.maxMarks ?? 0),
      grade: mark.grade ?? '',
      classId: mark.classId != null ? Number(mark.classId) : 0,
      tenantId: mark.tenantId ?? '',
    };
  }

  private normalizeExamScheduleSlot(s: any, examId: number): ExamScheduleSlot {
    return {
      id: s.id != null ? Number(s.id) : undefined,
      examId,
      classId: Number(s.classId),
      sectionId: s.sectionId != null ? Number(s.sectionId) : null,
      className: s.className ?? undefined,
      sectionName: s.sectionName ?? undefined,
      subjectName: s.subjectName ?? '',
      examDate: s.examDate ?? '',
      startTime: s.startTime ?? '',
      endTime: s.endTime ?? '',
      room: s.room ?? undefined,
      notes: s.notes ?? undefined,
    };
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
      return of({ ...mockParentAttendanceStats(studentId, from, to) }).pipe(delay(150));
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
      const child = MOCK_PARENT_CHILDREN.find(c => c.id === studentId);
      const name = child ? `${child.firstName} ${child.lastName}` : 'Student';
      return of(mockParentAttendanceRecords(studentId, name, from, to).map(r => ({ ...r }))).pipe(delay(150));
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

  /**
   * Portal bundle: marks and fees are per child; attendance stats and daily rows use inclusive
   * {@code from}/{@code to} (typically one calendar month). The UI may page rows client-side;
   * a future API can add {@code page}/{@code size} on attendance-records while keeping this contract.
   */
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

  /**
   * Mock portal ({@code useMocks}): only {@code mockpay} settles in-browser (no JWT on parent payment API).
   * Real JWT: always false — checkout uses the school API (e.g. Razorpay).
   */
  static usesLocalPortalFeeSimulation(provider: string | undefined): boolean {
    return runtimeConfig.useMocks && normalizePaymentProviderId(provider) === PAYMENT_PROVIDER_IDS.MOCKPAY;
  }

  createCheckoutSession(request: CheckoutSessionRequest): Observable<CheckoutSession> {
    if (ParentService.usesLocalPortalFeeSimulation(request.provider)) {
      this.localDemoCheckout = {
        paymentId: request.paymentId,
        studentId: request.studentId,
        amount: request.amount,
      };
      const ts = Date.now();
      return of({
        attemptId: ts,
        provider: request.provider,
        providerOrderId: 'LOCAL-DEMO-ORDER-' + ts,
        checkoutToken: ParentService.LOCAL_DEMO_TOKEN_PREFIX + ts,
        currency: 'INR',
        amount: request.amount,
        checkoutUrl: (request.returnUrl || '/app/parent/children') + '?localDemoPayment=1',
        status: 'initiated',
      }).pipe(delay(200));
    }
    return this.api
      .post<any>('/parent/payments/checkout-session', {
        paymentId: request.paymentId,
        studentId: request.studentId,
        amount: request.amount,
        provider: request.provider,
        returnUrl: request.returnUrl,
      })
      .pipe(map(session => this.normalizeCheckoutSession(session)));
  }

  confirmCheckout(
    attemptId: string | number,
    checkoutToken: string,
    providerPaymentId?: string,
    providerSignature?: string
  ): Observable<PaymentReceipt> {
    if (ParentService.isLocalDemoCheckoutToken(checkoutToken)) {
      this.ensureMockFeeState();
      const receipt = this.completeLocalMockpayCheckout(attemptId, providerPaymentId);
      this.localDemoCheckout = null;
      this.mockReceipts = [receipt, ...this.mockReceipts.filter(item => item.receiptNumber !== receipt.receiptNumber)];
      return of(receipt).pipe(delay(400));
    }
    const aid = Number(attemptId);
    return this.api
      .post<any>(`/parent/payments/checkout-session/${aid}/confirm`, {
        checkoutToken,
        providerPaymentId,
        ...(providerSignature != null && providerSignature !== '' ? { providerSignature } : {}),
      })
      .pipe(map(item => this.normalizeReceipt(item)));
  }

  getReceipt(receiptNumber: string): Observable<PaymentReceipt> {
    if (runtimeConfig.useMocks) {
      this.bootstrapMockReceiptLedger();
      const receipt = this.mockReceipts.find(item => item.receiptNumber === receiptNumber);
      if (receipt) {
        return of(receipt).pipe(delay(150));
      }
      const seed = buildParentMockInitialReceipts()[0];
      return of({
        ...seed,
        lineItems: seed.lineItems.map(li => ({ ...li })),
      }).pipe(delay(150));
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

  private normalizeCheckoutSession(session: any): CheckoutSession {
    return {
      attemptId: Number(session.attemptId),
      provider: String(session.provider ?? ''),
      providerOrderId: String(session.providerOrderId ?? ''),
      checkoutToken: String(session.checkoutToken ?? ''),
      currency: String(session.currency ?? 'INR'),
      amount: Number(session.amount ?? 0),
      checkoutUrl: String(session.checkoutUrl ?? ''),
      status: String(session.status ?? ''),
      publicKeyId: session.publicKeyId != null ? String(session.publicKeyId) : undefined,
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

  private static isLocalDemoCheckoutToken(token: string | undefined | null): boolean {
    return String(token ?? '').startsWith(ParentService.LOCAL_DEMO_TOKEN_PREFIX);
  }

  /** Builds receipt and mutates in-memory fee rows (mock portal {@code mockpay} only). */
  private completeLocalMockpayCheckout(attemptId: string | number, providerPaymentId?: string): PaymentReceipt {
    const pend = this.localDemoCheckout;
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
    const receipt: PaymentReceipt = {
      receiptNumber: 'REC-MOCKPORTAL-' + Date.now(),
      paymentId,
      studentId,
      studentName: ob.studentName,
      feeStructureName: ob.feeStructureName,
      className: ob.className,
      provider: 'mockpay',
      providerPaymentId: providerPaymentId || 'MOCKPORTAL-' + String(attemptId),
      paymentMethod: 'MOCKPORTAL',
      paymentDate: new Date().toISOString().slice(0, 10),
      dueDate: ob.dueDate,
      currency: ob.currency,
      amountPaid,
      totalAmount: ob.totalAmount,
      paidAmount: newPaid,
      dueAmount: newDue,
      discount: ob.discount,
      lateFee: newDue <= 0 ? 0 : ob.lateFee,
      lineItems: ob.lineItems.map(li => ({ ...li })),
    };
    if (this.mockObligationsMutable && this.mockFeePaymentsMutable) {
      const o = this.mockObligationsMutable.find(x => x.paymentId === paymentId && x.studentId === studentId);
      if (o) {
        const nd = Math.max(0, o.totalAmount - (o.discount || 0));
        o.paidAmount = Math.min(nd, o.paidAmount + amountPaid);
        o.dueAmount = Math.max(0, nd - o.paidAmount);
        if (o.dueAmount <= 0) {
          o.lateFee = 0;
          o.payableNow = 0;
          o.status = 'paid';
        } else {
          o.payableNow = o.dueAmount + (o.lateFee || 0);
          o.status = 'partial';
        }
      }
      const row = this.mockFeePaymentsMutable.find(x => x.id === paymentId && x.studentId === studentId);
      if (row) {
        const net = Math.max(0, row.amount - (row.discount || 0));
        row.paidAmount = Math.min(net, row.paidAmount + amountPaid);
        row.dueAmount = Math.max(0, net - row.paidAmount);
        row.status = row.dueAmount <= 0 ? 'paid' : 'partial';
        if (row.dueAmount <= 0) {
          row.lateFee = 0;
        }
      }
    }
    return receipt;
  }
}
