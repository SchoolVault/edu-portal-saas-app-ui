import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, delay, map, switchMap } from 'rxjs/operators';
import { MOCK_OPERATIONS_INVENTORY_SEED, MOCK_OPERATIONS_STAFF_SEED, mockPayrollAccrualSummary } from '../mocks/operations.mock-data';
import { ApiResp, ApiService, PageResp } from './api.service';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';
import { runtimeConfig } from '../config/runtime-config';
import {
  AttendanceCoverConflictPayload,
  AttendanceCoverRow,
  AttendanceProxyAuditRow,
  CreateAttendanceCoverRequest,
  FeeReminderRow,
  GatePassRow,
  InventoryRow,
  OperationalStaffRow,
  PayrollAccrualSummary,
  VisitorLogRow,
} from '../models/operations.models';
import { SchedulingConflictError } from '../errors/scheduling-conflict.error';
import { UserFacingHttpError } from '../http/user-facing-http-error';

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private mockStaff: OperationalStaffRow[] = MOCK_OPERATIONS_STAFF_SEED.map(s => ({ ...s }));
  private mockVisitors: VisitorLogRow[] = [];
  private mockGate: GatePassRow[] = [];
  private mockInv: InventoryRow[] = MOCK_OPERATIONS_INVENTORY_SEED.map(r => ({ ...r }));
  private mockRem: FeeReminderRow[] = [];
  private mockCovers: AttendanceCoverRow[] = [];
  private mockAttendanceProxyAudit: AttendanceProxyAuditRow[] = [];
  private nextId = 100;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  /** Align API numeric ids with UI string ids (strict templates). */
  private normalizeStaffRow(raw: OperationalStaffRow): OperationalStaffRow {
    return {
      ...raw,
      id: String(raw.id),
      userId: raw.userId != null ? String(raw.userId) : undefined,
      transportRouteId: raw.transportRouteId != null ? String(raw.transportRouteId) : undefined,
    };
  }

  private normalizeInventoryRow(raw: InventoryRow): InventoryRow {
    return {
      ...raw,
      id: String(raw.id),
      quantityOnHand: Number(raw.quantityOnHand ?? 0),
      reorderLevel: Number(raw.reorderLevel ?? 0),
    };
  }

  listStaff(): Observable<OperationalStaffRow[]> {
    if (runtimeConfig.useMocks) return of([...this.mockStaff]).pipe(delay(200));
    return this.api
      .get<OperationalStaffRow[]>('/operations/staff')
      .pipe(map(rows => (rows ?? []).map(r => this.normalizeStaffRow(r))));
  }

  listStaffPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<OperationalStaffRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<OperationalStaffRow>('/operations/staff/paged', { page, size })
        .pipe(map(p => ({ ...p, content: p.content.map(r => this.normalizeStaffRow(r)) })));
    }
    return this.listStaff().pipe(map(all => sliceToPage(all, page, size)));
  }

  deleteStaff(id: string, permanent = false): Observable<void> {
    if (runtimeConfig.useMocks) {
      const row = this.mockStaff.find(s => s.id === id);
      if (!row) {
        return of(undefined).pipe(delay(80));
      }
      if (permanent && (row.userId || row.transportRouteId)) {
        return throwError(() => new Error('Permanent delete blocked: unlink user and transport first.'));
      }
      this.mockStaff = this.mockStaff.filter(s => s.id !== id);
      return of(undefined).pipe(delay(180));
    }
    return this.api.delete<void>(`/operations/staff/${id}?permanent=${permanent ? 'true' : 'false'}`);
  }

  createStaff(body: Partial<OperationalStaffRow>): Observable<OperationalStaffRow> {
    if (runtimeConfig.useMocks) {
      const row: OperationalStaffRow = {
        id: String(this.nextId++),
        staffRole: body.staffRole || 'OTHER',
        fullName: body.fullName || '',
        phone: body.phone,
        email: body.email,
        employeeCode: body.employeeCode,
        userId: body.userId,
        transportRouteId: body.transportRouteId,
        notes: body.notes,
      };
      this.mockStaff = [...this.mockStaff, row];
      return of(row).pipe(delay(200));
    }
    return this.api.post<OperationalStaffRow>('/operations/staff', body).pipe(map(r => this.normalizeStaffRow(r)));
  }

  listVisitors(): Observable<VisitorLogRow[]> {
    if (runtimeConfig.useMocks) return of([...this.mockVisitors]).pipe(delay(150));
    return this.api.get<VisitorLogRow[]>('/operations/visitors');
  }

  listVisitorsPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<VisitorLogRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<VisitorLogRow>('/operations/visitors/paged', { page, size });
    }
    return this.listVisitors().pipe(map(all => sliceToPage(all, page, size)));
  }

  checkInVisitor(body: { visitorName: string; phone?: string; purpose?: string; hostName?: string }): Observable<VisitorLogRow> {
    if (runtimeConfig.useMocks) {
      const row: VisitorLogRow = {
        id: String(this.nextId++),
        visitorName: body.visitorName,
        phone: body.phone,
        purpose: body.purpose,
        hostName: body.hostName,
        badgeNo: 'V-MOCK-' + Date.now(),
        checkInAt: new Date().toISOString(),
        status: 'ON_PREMISES',
      };
      this.mockVisitors = [row, ...this.mockVisitors];
      return of(row).pipe(delay(200));
    }
    return this.api.post<VisitorLogRow>('/operations/visitors/check-in', body);
  }

  checkOutVisitor(id: string): Observable<VisitorLogRow> {
    if (runtimeConfig.useMocks) {
      this.mockVisitors = this.mockVisitors.map(v =>
        v.id === id ? { ...v, checkOutAt: new Date().toISOString(), status: 'CHECKED_OUT' } : v
      );
      const v = this.mockVisitors.find(x => x.id === id)!;
      return of(v).pipe(delay(150));
    }
    return this.api.post<VisitorLogRow>(`/operations/visitors/${id}/check-out`, {});
  }

  listGatePasses(): Observable<GatePassRow[]> {
    if (runtimeConfig.useMocks) return of([...this.mockGate]).pipe(delay(150));
    return this.api.get<GatePassRow[]>('/operations/gate-passes');
  }

  listGatePassesPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<GatePassRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<GatePassRow>('/operations/gate-passes/paged', { page, size });
    }
    return this.listGatePasses().pipe(map(all => sliceToPage(all, page, size)));
  }

  createGatePass(body: Partial<GatePassRow> & { validFrom: string; validTo: string; issuedToName: string }): Observable<GatePassRow> {
    if (runtimeConfig.useMocks) {
      const row: GatePassRow = {
        id: String(this.nextId++),
        studentId: body.studentId,
        issuedToName: body.issuedToName,
        validFrom: body.validFrom,
        validTo: body.validTo,
        purpose: body.purpose,
        status: 'ACTIVE',
      };
      this.mockGate = [row, ...this.mockGate];
      return of(row).pipe(delay(200));
    }
    return this.api.post<GatePassRow>('/operations/gate-passes', body);
  }

  revokeGatePass(id: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      this.mockGate = this.mockGate.map(g => (g.id === id ? { ...g, status: 'REVOKED' } : g));
      return of(undefined).pipe(delay(120));
    }
    return this.api.post<void>(`/operations/gate-passes/${id}/revoke`, {});
  }

  listInventory(): Observable<InventoryRow[]> {
    if (runtimeConfig.useMocks) return of([...this.mockInv]).pipe(delay(150));
    return this.api
      .get<InventoryRow[]>('/operations/inventory')
      .pipe(map(rows => (rows ?? []).map(r => this.normalizeInventoryRow(r))));
  }

  listInventoryPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<InventoryRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<InventoryRow>('/operations/inventory/paged', { page, size }).pipe(
        map(p => ({ ...p, content: p.content.map(r => this.normalizeInventoryRow(r)) }))
      );
    }
    return this.listInventory().pipe(map(all => sliceToPage(all, page, size)));
  }

  upsertInventory(body: Partial<InventoryRow> & { sku: string; name: string }): Observable<InventoryRow> {
    if (runtimeConfig.useMocks) {
      const i = this.mockInv.findIndex(x => x.sku === body.sku);
      const row: InventoryRow = {
        id: i >= 0 ? this.mockInv[i].id : String(this.nextId++),
        sku: body.sku,
        name: body.name,
        category: body.category,
        quantityOnHand: body.quantityOnHand ?? 0,
        reorderLevel: body.reorderLevel ?? 0,
        location: body.location,
      };
      if (i >= 0) this.mockInv = [...this.mockInv.slice(0, i), row, ...this.mockInv.slice(i + 1)];
      else this.mockInv = [...this.mockInv, row];
      return of(row).pipe(delay(200));
    }
    return this.api.post<InventoryRow>('/operations/inventory', body).pipe(map(r => this.normalizeInventoryRow(r)));
  }

  deleteInventory(id: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      this.mockInv = this.mockInv.filter(x => String(x.id) !== String(id));
      return of(undefined).pipe(delay(150));
    }
    return this.api.delete<void>(`/operations/inventory/${encodeURIComponent(id)}`);
  }

  listFeeReminders(status?: string): Observable<FeeReminderRow[]> {
    if (runtimeConfig.useMocks) return of([...this.mockRem]).pipe(delay(150));
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.api.get<FeeReminderRow[]>(`/operations/fee-reminders${q}`);
  }

  listFeeRemindersPage(
    page = 0,
    size = DEFAULT_ERP_PAGE_SIZE,
    status?: string
  ): Observable<PageResp<FeeReminderRow>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<FeeReminderRow>('/operations/fee-reminders/paged', {
        page,
        size,
        status: status?.trim() || undefined,
      });
    }
    return this.listFeeReminders(status).pipe(map(all => sliceToPage(all, page, size)));
  }

  enqueueFeeReminder(body: { studentId: number; feePaymentId?: number; dueDate?: string; channel?: string }): Observable<FeeReminderRow> {
    if (runtimeConfig.useMocks) {
      const row: FeeReminderRow = {
        id: String(this.nextId++),
        studentId: body.studentId,
        feePaymentId: body.feePaymentId,
        dueDate: body.dueDate,
        channel: body.channel || 'EMAIL',
        status: 'PENDING',
        scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
      };
      this.mockRem = [...this.mockRem, row];
      return of(row).pipe(delay(200));
    }
    return this.api.post<FeeReminderRow>('/operations/fee-reminders', {
      studentId: body.studentId,
      feePaymentId: body.feePaymentId,
      dueDate: body.dueDate,
      channel: body.channel,
    });
  }

  /**
   * Mock / dev: schedule reminder queue rows for outstanding fee balances whose due date is overdue or within `withinDays`.
   * Production: no-op (returns 0); a real job would call the messaging provider from the server.
   */
  syncAutoRemindersForOutstandingFees(
    payments: Array<{ id: number; studentId: number; dueDate?: string; dueAmount: number }>,
    withinDays = 14
  ): Observable<number> {
    if (!runtimeConfig.useMocks) {
      return of(0).pipe(delay(50));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + withinDays);
    let added = 0;
    for (const p of payments) {
      if (!p.dueDate || p.dueAmount <= 0) continue;
      const due = new Date(p.dueDate + 'T12:00:00');
      due.setHours(0, 0, 0, 0);
      if (due > horizon) continue;
      const dup = this.mockRem.some(r => r.feePaymentId === p.id && r.status === 'PENDING');
      if (dup) continue;
      const row: FeeReminderRow = {
        id: String(this.nextId++),
        studentId: p.studentId,
        feePaymentId: p.id,
        dueDate: p.dueDate,
        channel: 'SMS',
        status: 'PENDING',
        scheduledAt: new Date().toISOString(),
      };
      this.mockRem = [...this.mockRem, row];
      added++;
    }
    return of(added).pipe(delay(120));
  }

  payrollAccrualSummary(period?: string): Observable<PayrollAccrualSummary> {
    if (runtimeConfig.useMocks) {
      return of(mockPayrollAccrualSummary(period)).pipe(delay(200));
    }
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.api.get<PayrollAccrualSummary>(`/operations/payroll-accrual/summary${q}`);
  }

  listAttendanceCovers(date: string): Observable<AttendanceCoverRow[]> {
    if (runtimeConfig.useMocks) return of(this.mockCovers.filter(c => c.coverDate === date)).pipe(delay(150));
    return this.api.get<AttendanceCoverRow[]>(`/attendance/covers?date=${encodeURIComponent(date)}`);
  }

  listAttendanceCoversAdmin(date: string): Observable<AttendanceCoverRow[]> {
    if (runtimeConfig.useMocks) {
      return of(this.mockCovers.filter(c => c.coverDate === date)).pipe(delay(150));
    }
    return this.api.get<AttendanceCoverRow[]>(`/attendance/covers/all-active?date=${encodeURIComponent(date)}`);
  }

  createAttendanceCover(body: CreateAttendanceCoverRequest): Observable<AttendanceCoverRow> {
    if (runtimeConfig.useMocks) {
      return timer(200).pipe(
        switchMap(() => {
          const sameDayClass = this.mockCovers.filter(
            c => c.coverDate === body.coverDate && c.classId === body.classId && c.status === 'ACTIVE'
          );
          const identical = sameDayClass.find(
            c =>
              this.slotEquals(c.sectionId, body.sectionId) &&
              this.slotEquals(c.periodNumber, body.periodNumber) &&
              c.coveringTeacherId === body.coveringTeacherId
          );
          if (identical) {
            return of({ ...identical });
          }
          const blocking = sameDayClass.find(
            c =>
              this.sectionsOverlap(c.sectionId, body.sectionId) &&
              this.periodsOverlap(c.periodNumber, body.periodNumber) &&
              c.coveringTeacherId !== body.coveringTeacherId
          );
          if (blocking) {
            if (body.replaceCoverAssignmentId == null) {
              const t = this.teachersNameFromMock(blocking.coveringTeacherId);
              return throwError(
                () =>
                  new SchedulingConflictError(
                    'Another teacher is already assigned as cover for this slot.',
                    this.toMockConflictPayload(blocking, body.coverDate, t)
                  )
              );
            }
            if (body.replaceCoverAssignmentId !== blocking.id) {
              return throwError(() => new Error('Replace id does not match the active conflicting cover.'));
            }
            this.mockCovers = this.mockCovers.map(c => (c.id === blocking.id ? { ...c, status: 'CANCELLED' } : c));
          } else if (body.replaceCoverAssignmentId != null) {
            return throwError(() => new Error('No active conflicting cover to replace.'));
          }
          const row: AttendanceCoverRow = {
            id: this.nextId++,
            coverDate: body.coverDate,
            periodNumber: body.periodNumber,
            classId: body.classId,
            sectionId: body.sectionId,
            regularTeacherId: body.regularTeacherId,
            coveringTeacherId: body.coveringTeacherId,
            reason: body.reason,
            status: 'ACTIVE',
          };
          this.mockCovers = [...this.mockCovers, row];
          return of(row);
        })
      );
    }
    const payload = {
      coverDate: body.coverDate,
      classId: body.classId,
      sectionId: body.sectionId ?? null,
      regularTeacherId: body.regularTeacherId ?? null,
      coveringTeacherId: body.coveringTeacherId,
      reason: body.reason,
      periodNumber: body.periodNumber ?? null,
      replaceCoverAssignmentId: body.replaceCoverAssignmentId ?? null,
    };
    return this.http.post<ApiResp<AttendanceCoverRow>>(`${this.api.getBaseUrl()}/attendance/covers`, payload).pipe(
      map(res => {
        if (res.success && res.data != null) {
          return res.data;
        }
        throw new Error(res.message || 'Request failed');
      }),
      catchError((err: unknown) => {
        if (
          err instanceof UserFacingHttpError &&
          err.httpStatus === 409 &&
          err.apiErrorCode === 'SCHEDULING_CONFLICT' &&
          err.apiData &&
          typeof err.apiData === 'object'
        ) {
          return throwError(
            () => new SchedulingConflictError(err.message || 'Scheduling conflict', err.apiData as AttendanceCoverConflictPayload)
          );
        }
        return throwError(() => (err instanceof Error ? err : new Error(String(err))));
      })
    );
  }

  private toMockConflictPayload(row: AttendanceCoverRow, coverDate: string, nameHint: string): AttendanceCoverConflictPayload {
    return {
      existingCoverAssignmentId: row.id,
      existingCoveringTeacherId: row.coveringTeacherId,
      existingCoveringTeacherName: nameHint,
      coverDate,
      classId: row.classId,
      sectionId: row.sectionId,
      periodNumber: row.periodNumber,
    };
  }

  /** Mock-only: resolve teacher display name from id when mock teacher list is not wired here. */
  private teachersNameFromMock(teacherId: number): string {
    return `Teacher #${teacherId}`;
  }

  private slotEquals(a: number | null | undefined, b: number | null | undefined): boolean {
    return (a ?? null) === (b ?? null);
  }

  private sectionsOverlap(existing?: number | null, requested?: number | null): boolean {
    if (existing == null || requested == null) {
      return true;
    }
    return existing === requested;
  }

  private periodsOverlap(existing?: number | null, requested?: number | null): boolean {
    if (existing == null || requested == null) {
      return true;
    }
    return existing === requested;
  }

  cancelAttendanceCover(id: number): Observable<void> {
    if (runtimeConfig.useMocks) {
      this.mockCovers = this.mockCovers.map(c => (c.id === id ? { ...c, status: 'CANCELLED' } : c));
      return of(undefined).pipe(delay(120));
    }
    return this.api.post<void>(`/attendance/covers/${id}/cancel`, {});
  }

  /**
   * Records a proxy/substitute attendance submission for admin audit (mock store or POST /operations/audit/attendance-proxy).
   */
  recordAttendanceProxyAudit(row: Omit<AttendanceProxyAuditRow, 'id' | 'at'>): Observable<void> {
    const entry: AttendanceProxyAuditRow = {
      ...row,
      id: `aa-${++this.nextId}`,
      at: new Date().toISOString(),
    };
    if (runtimeConfig.useMocks) {
      this.mockAttendanceProxyAudit = [entry, ...this.mockAttendanceProxyAudit].slice(0, 200);
      return of(undefined).pipe(delay(60));
    }
    return this.api.post<void>('/operations/audit/attendance-proxy', entry);
  }
}
