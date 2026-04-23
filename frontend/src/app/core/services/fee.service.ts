import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_FEE_PAYMENTS_SEED, MOCK_FEE_STRUCTURES_SEED } from '../mocks/fee.mock-data';
import { MOCK_STUDENTS } from '../mocks/students.mock-data';
import {
  BulkAssignFeesRequest,
  BulkAssignFeesResponse,
  FeeCollectionSummary,
  FeePayment,
  FeeRefundDecisionRequest,
  FeeRefundExecuteRequest,
  FeeRefundRequest,
  FeeStructure,
  FeeTransaction,
} from '../models/models';
import { ApiService, PageResp } from './api.service';
import { AuthService } from './auth.service';
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
    private auth: AuthService
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
  getPaymentsPage(opts: { page?: number; size?: number; status?: string; q?: string }): Observable<PageResp<FeePayment>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    const q = opts.q?.trim().toLowerCase() || '';
    const status = opts.status?.trim() || '';

    if (!runtimeConfig.useMocks) {
      const statusParam = status ? status.toUpperCase() : undefined;
      return this.api
        .getPageParams<FeePayment>('/fees/payments/paged', {
          page,
          size,
          status: statusParam,
          q: opts.q?.trim() || undefined,
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
    rows.sort((a, b) => b.id - a.id);
    return of(sliceToPage(rows, page, size)).pipe(delay(250));
  }

  getStudentPayments(studentId: number): Observable<FeePayment[]> {
    if (this.auth.getNormalizedRole() !== 'admin') {
      return of([]).pipe(delay(0));
    }
    if (!runtimeConfig.useMocks) {
      return this.api.get<any[]>(`/fees/payments/student/${studentId}`).pipe(map(payments => payments.map(item => this.normalizePayment(item))));
    }
    return of(this.payments.filter(p => p.studentId === studentId)).pipe(delay(300));
  }

  getCollectionSummary(): Observable<FeeCollectionSummary> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<FeeCollectionSummary>('/fees/collection-summary').pipe(
        map((s: any) => ({
          totalCollected: Number(s.totalCollected ?? 0),
          totalPending: Number(s.totalPending ?? 0),
          totalStudents: Number(s.totalStudents ?? 0),
          overdueCount: Number(s.overdueCount ?? 0),
          collectionRate: Number(s.collectionRate ?? 0),
        }))
      );
    }
    const totalCollected = this.payments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const totalPending = this.payments.reduce((sum, p) => sum + (Number(p.dueAmount) || 0), 0);
    const overdueCount = this.payments.filter(p => p.status === 'overdue').length;
    const uniqueStudents = new Set(this.payments.map(p => p.studentId)).size;
    const billed = this.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
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
