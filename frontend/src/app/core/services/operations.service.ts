import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_OPERATIONS_INVENTORY_SEED, MOCK_OPERATIONS_STAFF_SEED, mockPayrollAccrualSummary } from '../mocks/operations.mock-data';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import {
  AttendanceCoverRow,
  FeeReminderRow,
  GatePassRow,
  InventoryRow,
  OperationalStaffRow,
  PayrollAccrualSummary,
  VisitorLogRow,
} from '../models/operations.models';

@Injectable({ providedIn: 'root' })
export class OperationsService {
  private mockStaff: OperationalStaffRow[] = MOCK_OPERATIONS_STAFF_SEED.map(s => ({ ...s }));
  private mockVisitors: VisitorLogRow[] = [];
  private mockGate: GatePassRow[] = [];
  private mockInv: InventoryRow[] = MOCK_OPERATIONS_INVENTORY_SEED.map(r => ({ ...r }));
  private mockRem: FeeReminderRow[] = [];
  private mockCovers: AttendanceCoverRow[] = [];
  private nextId = 100;

  constructor(private api: ApiService) {}

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

  createAttendanceCover(body: {
    coverDate: string;
    classId: number;
    sectionId?: number;
    regularTeacherId?: number;
    coveringTeacherId: number;
    reason?: string;
    periodNumber?: number;
  }): Observable<AttendanceCoverRow> {
    if (runtimeConfig.useMocks) {
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
      return of(row).pipe(delay(200));
    }
    return this.api.post<AttendanceCoverRow>('/attendance/covers', {
      coverDate: body.coverDate,
      classId: body.classId,
      sectionId: body.sectionId ?? null,
      regularTeacherId: body.regularTeacherId ?? null,
      coveringTeacherId: body.coveringTeacherId,
      reason: body.reason,
      periodNumber: body.periodNumber ?? null,
    });
  }

  cancelAttendanceCover(id: number): Observable<void> {
    if (runtimeConfig.useMocks) {
      this.mockCovers = this.mockCovers.map(c => (c.id === id ? { ...c, status: 'CANCELLED' } : c));
      return of(undefined).pipe(delay(120));
    }
    return this.api.post<void>(`/attendance/covers/${id}/cancel`, {});
  }
}
