import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_FEE_PAYMENTS_SEED, MOCK_FEE_STRUCTURES_SEED } from '../mocks/fee.mock-data';
import { MOCK_STUDENTS } from '../mocks/students.mock-data';
import {
  BulkAssignFeesRequest,
  BulkAssignFeesResponse,
  FeeDefaulter,
  FeeCollectionSummary,
  FeeReminderOpsSnapshot,
  FeePayment,
  FeeRefundDecisionRequest,
  FeeRefundExecuteRequest,
  FeeRefundRequest,
  FeeStructure,
  FeeTransaction,
} from '../models/models';
import { ApiService, PageResp } from './api.service';
import { AuthService } from './auth.service';
import { UiAccessService } from './ui-access.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

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

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private uiAccess: UiAccessService
  ) {}

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

  /**
   * Paged payments for admin UI. Mock path mirrors backend {@code GET /fees/payments/paged} (PageResponse shape).
   */
  getPaymentsPage(opts: {
    page?: number;
    size?: number;
    status?: string;
    q?: string;
    classId?: number;
    sectionId?: number;
    academicYearId?: number;
    month?: string;
  }): Observable<PageResp<FeePayment>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    const q = opts.q?.trim().toLowerCase() || '';
    const status = opts.status?.trim() || '';
    const classId = opts.classId;
    const sectionId = opts.sectionId;
    const academicYearId = opts.academicYearId;

    if (!runtimeConfig.useMocks) {
      const statusParam = status ? status.toUpperCase() : undefined;
      return this.api
        .getPageParams<FeePayment>('/fees/payments/paged', {
          page,
          size,
          status: statusParam,
          q: opts.q?.trim() || undefined,
          classId: classId ?? undefined,
          sectionId: sectionId ?? undefined,
          academicYearId: academicYearId ?? undefined,
          month: opts.month?.trim() || undefined,
        })
        .pipe(map(pr => ({ ...pr, content: pr.content.map(item => this.normalizePayment(item as any)) })));
    }
    let rows = [...this.payments];
    if (status) {
      rows = rows.filter(p => p.status === status);
    }
    if (q) {
      rows = rows.filter(p => (p.studentName || '').toLowerCase().includes(q));
    }
    if (classId != null) {
      rows = rows.filter(p => {
        const student = MOCK_STUDENTS.find(s => s.id === p.studentId);
        return student?.classId === classId;
      });
    }
    if (sectionId != null) {
      rows = rows.filter(p => {
        const student = MOCK_STUDENTS.find(s => s.id === p.studentId);
        return student?.sectionId === sectionId;
      });
    }
    if (opts.month && /^\d{4}-\d{2}$/.test(opts.month)) {
      const [year, month] = opts.month.split('-').map(Number);
      rows = rows.filter(p => {
        const referenceDate = p.paymentDate || p.dueDate;
        if (!referenceDate) {
          return false;
        }
        const dt = new Date(`${referenceDate}T00:00:00`);
        return dt.getFullYear() === year && dt.getMonth() + 1 === month;
      });
    }
    rows.sort((a, b) => b.id - a.id);
    return of(sliceToPage(rows, page, size)).pipe(delay(250));
  }

  getStudentPayments(studentId: number): Observable<FeePayment[]> {
    if (!this.uiAccess.hasSchoolFeeOfficeDesk()) {
      return of([]).pipe(delay(0));
    }
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/fees/payments/student/${studentId}`).pipe(map(payments => payments.map(item => this.normalizePayment(item))));
    }
    return of(this.payments.filter(p => p.studentId === studentId)).pipe(delay(300));
  }

  getStudentPaymentsPage(studentId: number, opts: { page?: number; size?: number; academicYearId?: number }): Observable<PageResp<FeePayment>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<FeePayment>(`/fees/payments/student/${studentId}/paged`, {
        page,
        size,
        academicYearId: opts.academicYearId ?? undefined,
      }).pipe(map(pr => ({ ...pr, content: pr.content.map(item => this.normalizePayment(item as any)) })));
    }
    return this.getStudentPayments(studentId).pipe(map(rows => sliceToPage(rows, page, size)));
  }

  getDefaultersPage(opts: {
    page?: number;
    size?: number;
    window?: 'all' | 'upcoming' | 'overdue';
    band?: 'all' | 'upcoming' | 'soft' | 'medium' | 'critical';
    classId?: number;
    sectionId?: number;
    academicYearId?: number;
  }): Observable<PageResp<FeeDefaulter>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<FeeDefaulter>('/fees/defaulters/paged', {
        page,
        size,
        window: opts.window ?? 'all',
        band: opts.band ?? 'all',
        classId: opts.classId ?? undefined,
        sectionId: opts.sectionId ?? undefined,
        academicYearId: opts.academicYearId ?? undefined,
      }).pipe(map(pr => ({
        ...pr,
        content: (pr.content ?? []).map((row: any) => ({
          paymentId: Number(row.paymentId),
          studentId: Number(row.studentId),
          studentName: row.studentName ?? '',
          dueAmount: Number(row.dueAmount ?? 0),
          dueDate: row.dueDate ?? '',
          daysOverdue: Number(row.daysOverdue ?? 0),
          escalationBand: row.escalationBand ?? 'soft',
          status: row.status ?? 'unpaid',
          academicYearId: row.academicYearId != null ? Number(row.academicYearId) : undefined,
        })),
      })));
    }
    return this.getPaymentsPage({
      page,
      size,
      classId: opts.classId,
      sectionId: opts.sectionId,
      academicYearId: opts.academicYearId,
    }).pipe(map(pr => {
      const rows: FeeDefaulter[] = pr.content
        .filter(p => Number(p.dueAmount) > 0)
        .map(p => {
          const daysOverdue = p.dueDate ? Math.floor((Date.now() - Date.parse(p.dueDate)) / 86400000) : 0;
          const escalationBand: FeeDefaulter['escalationBand'] =
            daysOverdue <= 0 ? 'upcoming' : daysOverdue <= 7 ? 'soft' : daysOverdue <= 30 ? 'medium' : 'critical';
          return {
            paymentId: p.id,
            studentId: p.studentId,
            studentName: p.studentName,
            dueAmount: p.dueAmount,
            dueDate: p.dueDate,
            daysOverdue,
            escalationBand,
            status: p.status,
          };
        });
      return { ...pr, content: rows };
    }));
  }

  getReminderOpsSnapshot(roleView: 'fee_desk' | 'admin' | 'principal'): Observable<FeeReminderOpsSnapshot> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any>(`/fees/reminders/ops-snapshot?roleView=${encodeURIComponent(roleView)}`).pipe(
        map(raw => ({
          upcomingDueCount: Number(raw.upcomingDueCount ?? 0),
          overdueCount: Number(raw.overdueCount ?? 0),
          criticalCount: Number(raw.criticalCount ?? 0),
          workingHoursStart: Number(raw.workingHoursStart ?? 9),
          workingHoursEnd: Number(raw.workingHoursEnd ?? 18),
          cronExpression: String(raw.cronExpression ?? ''),
          inWorkingWindowNow: Boolean(raw.inWorkingWindowNow),
          roleHint: String(raw.roleHint ?? roleView),
        }))
      );
    }
    return of({
      upcomingDueCount: 0,
      overdueCount: 0,
      criticalCount: 0,
      workingHoursStart: 9,
      workingHoursEnd: 18,
      cronExpression: '0 15 8 * * *',
      inWorkingWindowNow: true,
      roleHint: roleView,
    });
  }

  downloadPaymentsCsv(query: {
    status?: string;
    q?: string;
    classId?: number;
    sectionId?: number;
    academicYearId?: number;
  }): Observable<Blob> {
    return this.api.getBlobParams('/fees/payments/export.csv', {
      status: query.status ? query.status.toUpperCase() : undefined,
      q: query.q?.trim() || undefined,
      classId: query.classId ?? undefined,
      sectionId: query.sectionId ?? undefined,
      academicYearId: query.academicYearId ?? undefined,
    });
  }

  getCollectionSummary(opts?: { classId?: number; sectionId?: number; month?: string }): Observable<FeeCollectionSummary> {
    if (!runtimeConfig.useMocks) {
      return this.api.getParams<FeeCollectionSummary>('/fees/collection-summary', {
        classId: opts?.classId ?? undefined,
        sectionId: opts?.sectionId ?? undefined,
        month: opts?.month?.trim() || undefined,
      }).pipe(
        map((s: any) => ({
          totalCollected: Number(s.totalCollected ?? 0),
          totalPending: Number(s.totalPending ?? 0),
          totalStudents: Number(s.totalStudents ?? 0),
          overdueCount: Number(s.overdueCount ?? 0),
          collectionRate: Number(s.collectionRate ?? 0),
        }))
      );
    }
    let rows = [...this.payments];
    if (opts?.month && /^\d{4}-\d{2}$/.test(opts.month)) {
      const [year, month] = opts.month.split('-').map(Number);
      rows = rows.filter(p => {
        const referenceDate = p.paymentDate || p.dueDate;
        if (!referenceDate) {
          return false;
        }
        const dt = new Date(`${referenceDate}T00:00:00`);
        return dt.getFullYear() === year && dt.getMonth() + 1 === month;
      });
    }
    if (opts?.classId != null) {
      rows = rows.filter(p => {
        const student = MOCK_STUDENTS.find(s => s.id === p.studentId);
        return student?.classId === opts.classId;
      });
    }
    if (opts?.sectionId != null) {
      rows = rows.filter(p => {
        const student = MOCK_STUDENTS.find(s => s.id === p.studentId);
        return student?.sectionId === opts.sectionId;
      });
    }
    const totalCollected = rows.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const totalPending = rows.reduce((sum, p) => sum + (Number(p.dueAmount) || 0), 0);
    const overdueCount = rows.filter(p => p.status === 'overdue').length;
    const uniqueStudents = new Set(rows.map(p => p.studentId)).size;
    const billed = rows.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return of({
      totalCollected,
      totalPending,
      totalStudents: uniqueStudents,
      overdueCount,
      collectionRate: billed > 0 ? totalCollected / billed : 0,
    }).pipe(delay(220));
  }

  bulkAssignFees(req: BulkAssignFeesRequest): Observable<BulkAssignFeesResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<BulkAssignFeesResponse>('/fees/payments/bulk-assign', {
        feeStructureId: req.feeStructureId,
        classId: req.classId,
        sectionId: req.sectionId ?? null,
        dueDate: req.dueDate,
        discount: req.discount ?? 0,
        skipIfDuplicate: req.skipIfDuplicate !== false,
        correlationId: req.correlationId ?? null,
      }).pipe(map(r => this.normalizeBulkAssignResponse(r)));
    }
    const fs = MOCK_FEE_STRUCTURES.find(s => s.id === req.feeStructureId);
    if (!fs || fs.classId !== req.classId) {
      return throwError(() => new Error('Selected fee structure does not match the class.'));
    }
    const skipDup = req.skipIfDuplicate !== false;
    const discount = Number(req.discount ?? 0) || 0;
    const due = req.dueDate;
    const inScope = MOCK_STUDENTS.filter(
      s => s.classId === req.classId && (req.sectionId == null || s.sectionId === req.sectionId)
    );
    const skipped: BulkAssignFeesResponse['skipped'] = [];
    const created: FeePayment[] = [];
    const stamp = Date.now();
    let nextId = Math.max(0, ...this.payments.map(p => p.id)) + 1;
    for (const st of inScope) {
      if (st.status !== 'active') {
        if (skipped.length < 100) {
          skipped.push({
            studentId: st.id,
            code: 'STUDENT_INACTIVE',
            detail: 'Student is not active',
          });
        }
        continue;
      }
      const dup = this.payments.some(
        p => p.studentId === st.id && p.feeStructureId === fs.id && p.dueDate === due
      );
      if (dup) {
        if (skipDup) {
          if (skipped.length < 100) {
            skipped.push({
              studentId: st.id,
              code: 'DUPLICATE_OBLIGATION',
              detail: 'Same structure and due date already assigned',
            });
          }
          continue;
        }
        return throwError(() => new Error(`Student ${st.id} already has this fee for the chosen due date.`));
      }
      const name = `${st.firstName} ${st.lastName}`.trim();
      const row: FeePayment = {
        id: nextId++,
        studentId: st.id,
        studentName: name,
        feeStructureId: fs.id,
        amount: fs.totalAmount,
        paidAmount: 0,
        dueAmount: fs.totalAmount,
        status: 'unpaid',
        paymentDate: new Date().toISOString().slice(0, 10),
        dueDate: due,
        discount,
        lateFee: 0,
        receiptNumber: `REC-MOCK-${stamp}-${st.id}`,
        tenantId: 't1',
      };
      if (new Date(due) < new Date(new Date().toISOString().slice(0, 10))) {
        row.status = 'overdue';
        row.lateFee = 50;
      }
      this.payments.push(row);
      created.push({ ...row });
    }
    const inactiveN = inScope.filter(s => s.status !== 'active').length;
    const activeN = inScope.filter(s => s.status === 'active').length;
    const skippedTotal = inactiveN + (activeN - created.length);
    const resp: BulkAssignFeesResponse = {
      createdCount: created.length,
      skippedCount: skippedTotal,
      skipped,
      createdSample: created.slice(0, 25).map(p => ({ ...p })),
    };
    return of(resp).pipe(delay(450));
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

  enqueueFeeReminder(req: { studentId: number; feePaymentId: number; dueDate?: string; channel?: 'SMS' | 'IN_APP' }): Observable<void> {
    if (runtimeConfig.useMocks) {
      return of(undefined).pipe(delay(180));
    }
    return this.api.post<void>('/fees/payments/reminders', {
      studentId: req.studentId,
      feePaymentId: req.feePaymentId,
      dueDate: req.dueDate ?? null,
      channel: req.channel ?? 'SMS',
    });
  }

  getSchoolReceiptPdf(receiptNumber: string): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      return of(this.mockFeeReceiptPdfBlob()).pipe(delay(100));
    }
    return this.api.getBlob(`/fees/payments/receipts/${encodeURIComponent(receiptNumber)}/pdf`);
  }

  private mockFeeReceiptPdfBlob(): Blob {
    const b64 =
      'JVBERi0xLjEKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDQgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjE4NgolJUVPRgo=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'application/pdf' });
  }

  getPaymentTransactions(paymentId: number): Observable<FeeTransaction[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/fees/payments/${paymentId}/transactions`).pipe(
        map(rows => (rows ?? []).map(item => this.normalizeTransaction(item)))
      );
    }
    return of([]).pipe(delay(180));
  }

  requestRefund(paymentId: number, req: FeeRefundRequest): Observable<FeeTransaction> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<any>(`/fees/payments/${paymentId}/refunds/request`, req).pipe(
        map(item => this.normalizeTransaction(item))
      );
    }
    return of({
      id: Date.now(),
      feePaymentId: paymentId,
      eventType: 'REFUND_REQUESTED',
      eventStatus: 'REQUESTED',
      amount: Number(req.amount ?? 0),
      currency: 'INR',
      note: req.reason ?? '',
      occurredAt: new Date().toISOString(),
    }).pipe(delay(250));
  }

  approveRefund(transactionId: number, req: FeeRefundDecisionRequest): Observable<FeeTransaction> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<any>(`/fees/payments/refunds/${transactionId}/approve`, req).pipe(
        map(item => this.normalizeTransaction(item))
      );
    }
    return of({
      id: Date.now(),
      feePaymentId: 0,
      eventType: 'REFUND_APPROVED',
      eventStatus: 'APPROVED',
      amount: 0,
      currency: 'INR',
      note: req.note ?? '',
      occurredAt: new Date().toISOString(),
    }).pipe(delay(250));
  }

  executeRefund(transactionId: number, req: FeeRefundExecuteRequest): Observable<FeeTransaction> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<any>(`/fees/payments/refunds/${transactionId}/execute`, req).pipe(
        map(item => this.normalizeTransaction(item))
      );
    }
    return of({
      id: Date.now(),
      feePaymentId: 0,
      eventType: 'REFUND_EXECUTED',
      eventStatus: 'RECONCILED',
      amount: 0,
      currency: 'INR',
      providerPaymentId: req.providerRefundId ?? '',
      note: req.note ?? '',
      occurredAt: new Date().toISOString(),
    }).pipe(delay(250));
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

  private normalizeBulkAssignResponse(raw: any): BulkAssignFeesResponse {
    const skipped = (raw?.skipped ?? []).map((x: any) => ({
      studentId: Number(x.studentId),
      code: String(x.code ?? ''),
      detail: x.detail != null ? String(x.detail) : undefined,
    }));
    const createdSample = (raw?.createdSample ?? []).map((p: any) => this.normalizePayment(p));
    return {
      createdCount: Number(raw?.createdCount ?? 0),
      skippedCount: Number(raw?.skippedCount ?? 0),
      skipped,
      createdSample,
    };
  }

  private normalizePayment(payment: any): FeePayment {
    const lineItems = payment.lineItems ?? payment.line_items;
    const payDateRaw = payment.paymentDate ?? payment.payment_date;
    const paymentDate =
      payDateRaw != null && String(payDateRaw).trim() !== ''
        ? String(payDateRaw).slice(0, 10)
        : undefined;
    return {
      ...payment,
      id: Number(payment.id),
      studentId: Number(payment.studentId),
      classId: payment.classId != null ? Number(payment.classId) : undefined,
      sectionId: payment.sectionId != null ? Number(payment.sectionId) : undefined,
      feeStructureId: payment.feeStructureId != null ? Number(payment.feeStructureId) : 0,
      amount: Number(payment.amount ?? 0),
      paidAmount: Number(payment.paidAmount ?? 0),
      dueAmount: Number(payment.dueAmount ?? 0),
      discount: Number(payment.discount ?? 0),
      lateFee: Number(payment.lateFee ?? 0),
      paymentDate,
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

  private normalizeTransaction(row: any): FeeTransaction {
    return {
      id: Number(row.id),
      feePaymentId: Number(row.feePaymentId),
      attemptId: row.attemptId != null ? Number(row.attemptId) : undefined,
      eventType: String(row.eventType ?? ''),
      eventStatus: row.eventStatus != null ? String(row.eventStatus) : undefined,
      amount: Number(row.amount ?? 0),
      currency: row.currency != null ? String(row.currency) : undefined,
      provider: row.provider != null ? String(row.provider) : undefined,
      providerPaymentId: row.providerPaymentId != null ? String(row.providerPaymentId) : undefined,
      referenceId: row.referenceId != null ? String(row.referenceId) : undefined,
      operationKey: row.operationKey != null ? String(row.operationKey) : undefined,
      note: row.note != null ? String(row.note) : undefined,
      occurredAt: row.occurredAt != null ? String(row.occurredAt) : undefined,
    };
  }
}
