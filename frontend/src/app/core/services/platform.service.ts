import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  MOCK_PLATFORM_ADMINS_SEED,
  MOCK_PLATFORM_DASHBOARD_BASE,
  MOCK_PLATFORM_SCHOOLS_SEED,
  MOCK_PLATFORM_SUBSCRIPTION_PLANS_SEED,
} from '../mocks/platform.mock-data';
import { runtimeConfig } from '../config/runtime-config';
import { ApiService, PageResp } from './api.service';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

const DEFAULT_MOCK_TENANT_FEATURES: Record<string, boolean> = {
  chat: true,
  transport: true,
  hostel: true,
  library: true,
  audit: true,
  operationsHub: true,
  importExport: true,
  directory: true,
};
import {
  PlatformBroadcastResult,
  PlatformDashboardData,
  PlatformPurgeJob,
  PlatformSchoolAdmin,
  PlatformSchoolAdminChatHit,
  PlatformSchoolDetail,
  PlatformSchoolSummary,
  PlatformSubscriptionPlan,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private mockSchools: PlatformSchoolSummary[];
  private mockAdmins: Record<string, PlatformSchoolAdmin[]>;
  private mockPurgeJobs: Record<string, PlatformPurgeJob[]> = {};
  private purgeJobSeq = 1;
  private mockPlans: PlatformSubscriptionPlan[];
  private readonly mockTenantFeatures: Record<string, Record<string, boolean>> = {};

  constructor(private api: ApiService) {
    this.mockSchools = MOCK_PLATFORM_SCHOOLS_SEED.map(s => ({ ...s }));
    this.mockAdmins = Object.fromEntries(
      Object.entries(MOCK_PLATFORM_ADMINS_SEED).map(([k, v]) => [k, v.map(a => ({ ...a }))])
    ) as Record<string, PlatformSchoolAdmin[]>;
    this.mockPlans = MOCK_PLATFORM_SUBSCRIPTION_PLANS_SEED.map(p => ({
      ...p,
      highlights: [...p.highlights],
      modules: [...(p.modules || [])],
    }));
    for (const s of this.mockSchools) {
      this.mockTenantFeatures[s.tenantId] = { ...DEFAULT_MOCK_TENANT_FEATURES };
    }
  }

  /** Super-admin: read merged tenant feature flags (same contract as GET /platform/schools/{tenantId}/features). */
  getSchoolTenantFeatures(tenantId: string): Observable<Record<string, boolean>> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<Record<string, boolean>>(`/platform/schools/${encodeURIComponent(tenantId)}/features`);
    }
    return of({ ...(this.mockTenantFeatures[tenantId] ?? { ...DEFAULT_MOCK_TENANT_FEATURES }) }).pipe(delay(100));
  }

  /** Super-admin: merge feature flags for one school workspace. */
  patchSchoolTenantFeatures(tenantId: string, patch: Record<string, boolean>): Observable<Record<string, boolean>> {
    if (!runtimeConfig.useMocks) {
      return this.api.put<Record<string, boolean>>(
        `/platform/schools/${encodeURIComponent(tenantId)}/features`,
        patch
      );
    }
    const prev = { ...(this.mockTenantFeatures[tenantId] ?? { ...DEFAULT_MOCK_TENANT_FEATURES }) };
    const merged = { ...prev, ...patch };
    this.mockTenantFeatures[tenantId] = merged;
    return of({ ...merged }).pipe(delay(150));
  }

  getDashboard(): Observable<PlatformDashboardData> {
    if (runtimeConfig.useMocks) {
      return of({
        ...MOCK_PLATFORM_DASHBOARD_BASE,
        topSchools: [...this.mockSchools].sort((a, b) => b.studentCount - a.studentCount).slice(0, 4).map(s => ({ ...s })),
      }).pipe(delay(200));
    }
    return this.api.get<PlatformDashboardData>('/platform/dashboard');
  }

  getSchools(): Observable<PlatformSchoolSummary[]> {
    if (runtimeConfig.useMocks) {
      return of(this.mockSchools.map(school => ({ ...school }))).pipe(delay(200));
    }
    return this.api.get<PlatformSchoolSummary[]>('/platform/schools');
  }

  getSchoolsPage(
    page = 0,
    size = DEFAULT_ERP_PAGE_SIZE,
    q?: string
  ): Observable<PageResp<PlatformSchoolSummary>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<PlatformSchoolSummary>('/platform/schools/paged', {
        page,
        size,
        q: q?.trim() || undefined,
      });
    }
    return this.getSchools().pipe(
      map(all => {
        let rows = [...all];
        const qq = q?.trim().toLowerCase();
        if (qq) {
          rows = rows.filter(
            s =>
              (s.schoolName || '').toLowerCase().includes(qq) ||
              (s.schoolCode || '').toLowerCase().includes(qq)
          );
        }
        return sliceToPage(rows, page, size);
      })
    );
  }

  /** Super-admin inbox: search campus admins with school context (same contract as backend). */
  searchSchoolAdminsForChat(q: string): Observable<PlatformSchoolAdminChatHit[]> {
    const needle = (q || '').trim().toLowerCase();
    if (runtimeConfig.useMocks) {
      const rows: PlatformSchoolAdminChatHit[] = [];
      for (const s of this.mockSchools) {
        for (const a of this.mockAdmins[s.tenantId] ?? []) {
          if (!a.active) continue;
          rows.push({
            userId: Number(a.id),
            name: a.name,
            email: a.email,
            phone: a.phone,
            schoolName: s.schoolName,
            schoolCode: s.schoolCode,
            tenantId: s.tenantId,
          });
        }
      }
      const filtered =
        needle.length < 2
          ? []
          : rows.filter(r =>
              `${r.name} ${r.email} ${r.schoolName} ${r.schoolCode} ${r.tenantId}`.toLowerCase().includes(needle)
            );
      return of(filtered).pipe(delay(100));
    }
    return this.api.get<any[]>(`/platform/school-admins/chat-search?q=${encodeURIComponent(q)}`).pipe(
      map(list =>
        (list || []).map((x: any) => ({
          userId: Number(x.userId),
          name: x.name,
          email: x.email ?? '',
          phone: x.phone,
          schoolName: x.schoolName ?? '',
          schoolCode: x.schoolCode ?? '',
          tenantId: x.tenantId ?? '',
        }))
      )
    );
  }

  getSchoolDetail(tenantId: string): Observable<PlatformSchoolDetail> {
    if (runtimeConfig.useMocks) {
      const school = this.mockSchools.find(s => s.tenantId === tenantId);
      if (!school) {
        return throwError(() => new Error('School not found'));
      }
      const admins = (this.mockAdmins[tenantId] ?? []).map(a => ({ ...a }));
      const parentUserCount = Math.round(school.studentCount * 0.85);
      return of({
        school: { ...school },
        admins,
        parentUserCount,
        subscriptionPlanCode: 'STANDARD',
        subscriptionStatus: school.active ? 'ACTIVE' : 'SUSPENDED'
      }).pipe(delay(180));
    }
    return this.api.get<PlatformSchoolDetail>(`/platform/schools/${tenantId}/detail`);
  }

  suspendSchoolWorkspace(tenantId: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      const school = this.mockSchools.find(s => s.tenantId === tenantId);
      if (school) {
        school.active = false;
      }
      (this.mockAdmins[tenantId] ?? []).forEach(a => { a.active = false; });
      return of(undefined).pipe(delay(200));
    }
    return this.api.post<void>(`/platform/schools/${tenantId}/suspend`, {});
  }

  activateSchoolWorkspace(tenantId: string): Observable<void> {
    if (runtimeConfig.useMocks) {
      const school = this.mockSchools.find(s => s.tenantId === tenantId);
      if (school) {
        school.active = true;
      }
      return of(undefined).pipe(delay(200));
    }
    return this.api.post<void>(`/platform/schools/${tenantId}/activate`, {});
  }

  requestTenantDataPurge(tenantId: string, confirmSchoolCode: string): Observable<PlatformPurgeJob> {
    if (runtimeConfig.useMocks) {
      const school = this.mockSchools.find(s => s.tenantId === tenantId);
      if (!school) {
        return throwError(() => new Error('School not found'));
      }
      if (school.active) {
        return throwError(() => new Error('Suspend the school workspace before purge.'));
      }
      if (school.schoolCode.toUpperCase() !== confirmSchoolCode.trim().toUpperCase()) {
        return throwError(() => new Error('School code confirmation does not match.'));
      }
      const job: PlatformPurgeJob = {
        id: String(this.purgeJobSeq++),
        tenantId,
        schoolCode: school.schoolCode,
        status: 'QUEUED',
        createdAt: new Date().toISOString()
      };
      if (!this.mockPurgeJobs[tenantId]) {
        this.mockPurgeJobs[tenantId] = [];
      }
      this.mockPurgeJobs[tenantId].unshift(job);
      setTimeout(() => {
        job.status = 'RUNNING';
        job.startedAt = new Date().toISOString();
      }, 400);
      setTimeout(() => {
        job.status = 'COMPLETED';
        job.completedAt = new Date().toISOString();
        job.rowsDeletedEstimate = 12400 + Math.floor(Math.random() * 2000);
      }, 1600);
      return of({ ...job }).pipe(delay(250));
    }
    return this.api.post<PlatformPurgeJob>(`/platform/schools/${tenantId}/purge-data`, { confirmSchoolCode });
  }

  listPurgeJobs(tenantId: string): Observable<PlatformPurgeJob[]> {
    if (runtimeConfig.useMocks) {
      const list = (this.mockPurgeJobs[tenantId] ?? []).map(j => ({ ...j }));
      return of(list).pipe(delay(120));
    }
    return this.api.get<PlatformPurgeJob[]>(`/platform/schools/${tenantId}/purge-jobs`).pipe(
      map(jobs => jobs.map(j => ({
        ...j,
        id: String(j.id)
      })))
    );
  }

  listSubscriptionPlans(): Observable<PlatformSubscriptionPlan[]> {
    if (runtimeConfig.useMocks) {
      return of(this.mockPlans.map(p => ({
        ...p,
        highlights: [...p.highlights],
        modules: [...(p.modules || [])]
      }))).pipe(delay(150));
    }
    return this.api.get<PlatformSubscriptionPlan[]>('/platform/subscription-plans');
  }

  /** Super-admin catalog edit; same contract as PUT /api/v1/platform/subscription-plans/{code}. */
  updateSubscriptionPlan(code: string, body: PlatformSubscriptionPlan): Observable<PlatformSubscriptionPlan> {
    if (runtimeConfig.useMocks) {
      const idx = this.mockPlans.findIndex(p => p.code.toUpperCase() === code.toUpperCase());
      if (idx < 0) {
        return throwError(() => new Error('Plan not found'));
      }
      const merged: PlatformSubscriptionPlan = {
        ...this.mockPlans[idx],
        ...body,
        code: this.mockPlans[idx].code,
        highlights: [...(body.highlights ?? this.mockPlans[idx].highlights)],
        modules: [...(body.modules ?? this.mockPlans[idx].modules ?? [])]
      };
      this.mockPlans[idx] = merged;
      return of({ ...merged, highlights: [...merged.highlights], modules: [...(merged.modules || [])] }).pipe(delay(200));
    }
    return this.api.put<PlatformSubscriptionPlan>(`/platform/subscription-plans/${encodeURIComponent(code)}`, body);
  }

  broadcastToAdmins(payload: { targetTenantId?: string | null; title: string; message: string; notificationType?: string }): Observable<PlatformBroadcastResult> {
    if (runtimeConfig.useMocks) {
      const tenants = payload.targetTenantId
        ? [payload.targetTenantId]
        : this.mockSchools.map(s => s.tenantId);
      let rows = 0;
      for (const tid of tenants) {
        rows += (this.mockAdmins[tid] ?? []).length;
      }
      return of({ notificationRowsCreated: rows, tenantWorkspacesReached: tenants.length }).pipe(delay(220));
    }
    return this.api.post<PlatformBroadcastResult>('/platform/broadcasts', payload);
  }

  getSchoolAdmins(tenantId: string): Observable<PlatformSchoolAdmin[]> {
    if (runtimeConfig.useMocks) {
      return of((this.mockAdmins[tenantId] ?? []).map(admin => ({ ...admin }))).pipe(delay(150));
    }
    return this.api.get<any[]>(`/platform/schools/${tenantId}/admins`).pipe(
      map(admins => admins.map(admin => ({
        ...admin,
        id: String(admin.id)
      })))
    );
  }

  toggleSchoolAdminStatus(tenantId: string, adminId: string, active: boolean): Observable<PlatformSchoolAdmin> {
    if (runtimeConfig.useMocks) {
      const admins = this.mockAdmins[tenantId] ?? [];
      const match = admins.find(admin => admin.id === adminId);
      if (match) {
        match.active = active;
      }
      return of({ ...(match ?? { id: adminId, name: '', email: '', schoolCode: '', active }) }).pipe(delay(150));
    }
    return this.api.put<any>(`/platform/schools/${tenantId}/admins/${adminId}/status`, { active }).pipe(
      map(admin => ({
        ...admin,
        id: String(admin.id)
      }))
    );
  }
}
