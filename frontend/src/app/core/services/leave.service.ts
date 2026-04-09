import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { AuthService } from './auth.service';

export type LeaveDayUnit = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';

export interface LeaveRequestRow {
  id: number;
  applicantUserId: number;
  applicantRole: string;
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

let MOCK_SEQ = 100;
let MOCK_REQUESTS: LeaveRequestRow[] = [
  {
    id: 1,
    applicantUserId: 2,
    applicantRole: 'TEACHER',
    leaveType: 'Casual',
    startDate: '2026-03-10',
    endDate: '2026-03-10',
    reason: 'Personal work',
    status: 'APPROVED',
    dayUnit: 'FULL_DAY',
    approverRemarks: 'Approved'
  },
  {
    id: 2,
    applicantUserId: 2,
    applicantRole: 'TEACHER',
    leaveType: 'Sick',
    startDate: '2026-04-02',
    endDate: '2026-04-02',
    reason: 'Fever',
    status: 'PENDING',
    dayUnit: 'FIRST_HALF'
  }
];

@Injectable({ providedIn: 'root' })
export class LeaveService {
  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  private mockUserNumId(): number {
    const u = this.auth.getCurrentUser();
    if (!u) return 1;
    const n = Number(u.id);
    if (Number.isFinite(n)) return n;
    const map: Record<string, number> = { u1: 1, u2: 2, u3: 3, sa1: 99, u_new: 10 };
    return map[u.id] ?? Math.abs([...u.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 100000);
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
      return this.api.post<LeaveRequestRow>('/leave/requests', {
        ...body,
        dayUnit: body.dayUnit ?? 'FULL_DAY'
      });
    }
    const row: LeaveRequestRow = {
      id: ++MOCK_SEQ,
      applicantUserId: this.mockUserNumId(),
      applicantRole: this.mockRoleUpper(),
      leaveType: body.leaveType,
      startDate: body.startDate,
      endDate: body.endDate,
      reason: body.reason,
      status: 'PENDING',
      dayUnit: body.dayUnit ?? 'FULL_DAY',
      studentId: body.studentId,
      teacherId: body.teacherId
    };
    MOCK_REQUESTS = [row, ...MOCK_REQUESTS];
    return of(row).pipe(delay(400));
  }

  listMine(): Observable<LeaveRequestRow[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<LeaveRequestRow[]>('/leave/requests/mine');
    }
    const uid = this.mockUserNumId();
    return of(MOCK_REQUESTS.filter(r => r.applicantUserId === uid)).pipe(delay(200));
  }

  listAll(): Observable<LeaveRequestRow[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<LeaveRequestRow[]>('/leave/requests');
    }
    return of([...MOCK_REQUESTS]).pipe(delay(200));
  }

  decide(id: number, approve: boolean, approverRemarks?: string): Observable<LeaveRequestRow> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<LeaveRequestRow>(`/leave/requests/${id}/decision`, { approve, approverRemarks });
    }
    const row = MOCK_REQUESTS.find(r => r.id === id);
    if (row) {
      row.status = approve ? 'APPROVED' : 'REJECTED';
      row.approverRemarks = approverRemarks ?? null;
      row.approverUserId = this.mockUserNumId();
    }
    return of(row ?? ({} as LeaveRequestRow)).pipe(delay(300));
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
    return of({
      annualEntitled: 24,
      annualUsed: sum('annual'),
      sickEntitled: 12,
      sickUsed: sum('sick'),
      casualEntitled: 12,
      casualUsed: sum('casual')
    }).pipe(delay(180));
  }
}

function countMockUnits(r: LeaveRequestRow): number {
  const start = new Date(r.startDate).getTime();
  const end = new Date(r.endDate).getTime();
  const span = Math.max(1, Math.round((end - start) / 86400000) + 1);
  if (r.dayUnit && r.dayUnit !== 'FULL_DAY' && span <= 1) return 1;
  return span;
}
