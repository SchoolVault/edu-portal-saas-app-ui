import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService, PageResp } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';
import { AuthService } from './auth.service';
import { UiAccessService } from './ui-access.service';
import { MOCK_LEAVE_REQUESTS_SEED, MOCK_LEAVE_SEQ_START } from '../mocks/leave.mock-data';
import { LEAVE_OTHER_REASON_MIN_LEN, normalizeLeaveRequestRow } from '../leave/leave-api.contract';
import { readLeaveEntitlementPolicy, writeLeaveEntitlementPolicy, type LeaveEntitlementPolicy } from '../leave/leave-policy.storage';

export type { LeaveEntitlementPolicy };

export type LeaveDayUnit = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';

export interface LeaveRequestRow {
  id: number;
  applicantUserId: number;
  applicantRole: string;
  /** Directory name for approvals (API + mocks). */
  applicantDisplayName?: string | null;
  studentId?: number | null;
  teacherId?: number | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  approverUserId?: number | null;
  approverRemarks?: string | null;
  dayUnit?: LeaveDayUnit;
}

export interface LeaveBalanceSummary {
  annualEntitled: number;
  annualUsed: number;
  sickEntitled: number;
  sickUsed: number;
  casualEntitled: number;
  casualUsed: number;
}

let MOCK_SEQ = MOCK_LEAVE_SEQ_START;
let MOCK_REQUESTS: LeaveRequestRow[] = MOCK_LEAVE_REQUESTS_SEED.map(r => normalizeLeaveRequestRow({ ...r }));

@Injectable({ providedIn: 'root' })
export class LeaveService {
  constructor(
    private api: ApiService,
    private auth: AuthService,
    private uiAccess: UiAccessService
  ) {}

  private mockUserNumId(): number {
    const u = this.auth.getCurrentUser();
    if (!u) return 1;
    const n = Number(u.id);
    return Number.isFinite(n) ? n : 1;
  }

  private mockRoleUpper(): string {
    return (this.auth.getRole() ?? 'USER').toUpperCase();
  }

  submit(body: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
    studentId?: number;
    teacherId?: number;
    dayUnit?: LeaveDayUnit;
  }): Observable<LeaveRequestRow> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .post<LeaveRequestRow>('/leave/requests', {
          ...body,
          dayUnit: body.dayUnit ?? 'FULL_DAY'
        })
        .pipe(map(normalizeLeaveRequestRow));
    }
    if (body.leaveType === 'OTHER' && (body.reason?.trim().length ?? 0) < LEAVE_OTHER_REASON_MIN_LEN) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            url: '/leave/requests',
            error: {
              success: false,
              message: 'LEAVE_OTHER_REASON_REQUIRED',
              errorCode: 'LEAVE_OTHER_REASON_REQUIRED',
            },
          })
      ).pipe(delay(200));
    }
    const me = this.auth.getCurrentUser();
    const row: LeaveRequestRow = normalizeLeaveRequestRow({
      id: ++MOCK_SEQ,
      applicantUserId: this.mockUserNumId(),
      applicantRole: this.mockRoleUpper(),
      applicantDisplayName: me?.name?.trim() || undefined,
      leaveType: body.leaveType,
      startDate: body.startDate,
      endDate: body.endDate,
      reason: body.reason,
      status: 'PENDING',
      dayUnit: body.dayUnit ?? 'FULL_DAY',
      studentId: body.studentId,
      teacherId: body.teacherId
    });
    MOCK_REQUESTS = [row, ...MOCK_REQUESTS];
    return of(row).pipe(delay(400));
  }

  listMine(): Observable<LeaveRequestRow[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<LeaveRequestRow[]>('/leave/requests/mine').pipe(map(rows => (rows || []).map(normalizeLeaveRequestRow)));
    }
    const uid = this.mockUserNumId();
    return of(MOCK_REQUESTS.filter(r => r.applicantUserId === uid).map(normalizeLeaveRequestRow)).pipe(delay(200));
  }

  listAll(): Observable<LeaveRequestRow[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<LeaveRequestRow[]>('/leave/requests').pipe(map(rows => (rows || []).map(normalizeLeaveRequestRow)));
    }
    if (!this.uiAccess.hasAcademicDeskAdminAccess()) {
      return of([]).pipe(delay(120));
    }
    return of([...MOCK_REQUESTS].map(normalizeLeaveRequestRow)).pipe(delay(200));
  }

  /** Paged list; mock mirrors {@link PageResp} shape. */
  listMinePaged(opts: { page?: number; size?: number; q?: string }): Observable<PageResp<LeaveRequestRow>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    const q = (opts.q ?? '').trim().toLowerCase();
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<LeaveRequestRow>('/leave/requests/mine/paged', { page, size, q: opts.q?.trim() || undefined })
        .pipe(map(p => ({ ...p, content: p.content.map(normalizeLeaveRequestRow) })));
    }
    const uid = this.mockUserNumId();
    let rows = MOCK_REQUESTS.filter(r => r.applicantUserId === uid).map(normalizeLeaveRequestRow);
    if (q) {
      rows = rows.filter(r =>
        [r.leaveType, r.reason, r.startDate, r.endDate, r.status].filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return of(sliceToPage(rows, page, size)).pipe(delay(200));
  }

  listAllPaged(opts: { page?: number; size?: number; q?: string }): Observable<PageResp<LeaveRequestRow>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    const q = (opts.q ?? '').trim().toLowerCase();
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<LeaveRequestRow>('/leave/requests/paged', { page, size, q: opts.q?.trim() || undefined })
        .pipe(map(p => ({ ...p, content: p.content.map(normalizeLeaveRequestRow) })));
    }
    if (!this.uiAccess.hasAcademicDeskAdminAccess()) {
      return of({
        content: [],
        page,
        size,
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true,
      }).pipe(delay(120));
    }
    let rows = [...MOCK_REQUESTS].map(normalizeLeaveRequestRow);
    if (q) {
      rows = rows.filter(r =>
        [r.leaveType, r.reason, r.startDate, r.endDate, r.status, String(r.applicantUserId), r.applicantRole, r.applicantDisplayName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    return of(sliceToPage(rows, page, size)).pipe(delay(200));
  }

  decide(id: number, approve: boolean, approverRemarks?: string): Observable<LeaveRequestRow> {
    if (!runtimeConfig.useMocks) {
      return this.api
        .put<LeaveRequestRow>(`/leave/requests/${id}/decision`, { approve, approverRemarks })
        .pipe(map(normalizeLeaveRequestRow));
    }
    const row = MOCK_REQUESTS.find(r => r.id === id);
    if (row) {
      row.status = approve ? 'APPROVED' : 'REJECTED';
      row.approverRemarks = approverRemarks ?? null;
      row.approverUserId = this.mockUserNumId();
    }
    return of(row ? normalizeLeaveRequestRow(row) : ({} as LeaveRequestRow)).pipe(delay(300));
  }

  /** Tenant policy (same shape as localStorage mock); teachers and admins may GET. */
  getEntitlementPolicy(): Observable<LeaveEntitlementPolicy> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<LeaveEntitlementPolicy>('/leave/policy').pipe(map(normalizeEntitlementPolicy));
    }
    return of(readLeaveEntitlementPolicy()).pipe(delay(120));
  }

  /** School admin updates tenant entitlements (persisted server-side when not in mock mode). */
  updateEntitlementPolicy(p: LeaveEntitlementPolicy): Observable<LeaveEntitlementPolicy> {
    const body = normalizeEntitlementPolicy(p);
    if (!runtimeConfig.useMocks) {
      return this.api.put<LeaveEntitlementPolicy>('/leave/policy', body).pipe(map(normalizeEntitlementPolicy));
    }
    writeLeaveEntitlementPolicy(body);
    return of(readLeaveEntitlementPolicy()).pipe(delay(200));
  }

  getBalance(): Observable<LeaveBalanceSummary> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<LeaveBalanceSummary>('/leave/balance').pipe(
        map(b => ({
          annualEntitled: b.annualEntitled ?? 24,
          annualUsed: b.annualUsed ?? 0,
          sickEntitled: b.sickEntitled ?? 12,
          sickUsed: b.sickUsed ?? 0,
          casualEntitled: b.casualEntitled ?? 12,
          casualUsed: b.casualUsed ?? 0
        }))
      );
    }
    const uid = this.mockUserNumId();
    const mine = MOCK_REQUESTS.filter(r => r.applicantUserId === uid && r.status === 'APPROVED');
    const sum = (kw: string) =>
      mine.filter(r => r.leaveType.toLowerCase().includes(kw)).reduce((s, r) => s + countMockUnits(r), 0);
    const policy = readLeaveEntitlementPolicy();
    return of({
      annualEntitled: policy.annualEntitled,
      annualUsed: sum('annual'),
      sickEntitled: policy.sickEntitled,
      sickUsed: sum('sick'),
      casualEntitled: policy.casualEntitled,
      casualUsed: sum('casual'),
    }).pipe(delay(180));
  }
}

function normalizeEntitlementPolicy(p: LeaveEntitlementPolicy): LeaveEntitlementPolicy {
  const y = p.policyYearLabel?.trim();
  return {
    annualEntitled: Math.max(0, Math.min(366, Math.floor(Number(p.annualEntitled) || 0))),
    sickEntitled: Math.max(0, Math.min(366, Math.floor(Number(p.sickEntitled) || 0))),
    casualEntitled: Math.max(0, Math.min(366, Math.floor(Number(p.casualEntitled) || 0))),
    policyYearLabel: y || undefined,
  };
}

function countMockUnits(r: LeaveRequestRow): number {
  const start = new Date(r.startDate).getTime();
  const end = new Date(r.endDate).getTime();
  const span = Math.max(1, Math.round((end - start) / 86400000) + 1);
  if (r.dayUnit && r.dayUnit !== 'FULL_DAY' && span <= 1) return 1;
  return span;
}
