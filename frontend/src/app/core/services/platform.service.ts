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
import { TenantFinanceProfile } from './settings.service';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

const DEFAULT_MOCK_TENANT_FEATURES: Record<string, boolean> = {
  chat: false,
  transport: false,
  hostel: false,
  library: false,
  audit: true,
  operationsHub: false,
  importExport: false,
  exams: false,
  documents: false,
  directory: true,
  fees: true,
  payroll: true,
  communication: true,
  reports: false,
  student: true,
  teacher: true,
  attendance: true,
  leave: false,
};
import {
  PlatformBroadcastResult,
  PlatformDashboardData,
  PlatformPurgeJob,
  PlatformLifecycleSummary,
  PlatformLifecycleObservability,
  PlatformSchoolAdmin,
  PlatformSchoolAdminChatHit,
  PlatformSchoolDetail,
  PlatformSchoolSummary,
  PlatformStorageReconciliation,
  PlatformSubscriptionPlan,
  PlatformOnboardSchoolResponse,
  CacheClearResponse,
  CacheClearRequest,
  CacheRegionOption,
  OnboardSchoolRequest,
  UpdateSchoolAdminRequest,
  UpdateSchoolWorkspaceRequest,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private mockSchools: PlatformSchoolSummary[];
  private mockAdmins: Record<string, PlatformSchoolAdmin[]>;
  private mockPurgeJobs: Record<string, PlatformPurgeJob[]> = {};
  private purgeJobSeq = 1;
  private mockPlans: PlatformSubscriptionPlan[];
  private readonly mockTenantFeatures: Record<string, Record<string, boolean>> = {};
  private readonly mockSchoolFinanceProfiles: Record<string, TenantFinanceProfile> = {};

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

  getLifecycleSummary(): Observable<PlatformLifecycleSummary> {
    if (runtimeConfig.useMocks) {
      return of({
        archivedRecordCount: 12450,
        latestArchivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        reportStorageTrackedRows: 220,
        reportStorageMissingFiles: 2,
      }).pipe(delay(180));
    }
    return this.api.get<PlatformLifecycleSummary>('/platform/lifecycle/summary');
  }

  reconcileReportStorage(dryRun = true, deleteOrphans = false): Observable<PlatformStorageReconciliation> {
    if (runtimeConfig.useMocks) {
      return of({
        dryRun,
        scannedFiles: 240,
        referencedFiles: 220,
        missingFiles: 2,
        orphanFiles: 20,
        deletedOrphanFiles: dryRun || !deleteOrphans ? 0 : 10,
        sampleMissingFiles: ['/tmp/report-binaries/tenant_a/2026/04/190_report.pdf'],
        sampleOrphanFiles: ['/tmp/report-binaries/tenant_a/2026/04/orphan_legacy.csv'],
      }).pipe(delay(300));
    }
    return this.api.post<PlatformStorageReconciliation>(
      `/platform/storage/reconcile?dryRun=${encodeURIComponent(String(dryRun))}&deleteOrphans=${encodeURIComponent(String(deleteOrphans))}`,
      {}
    );
  }

  getLifecycleObservability(): Observable<PlatformLifecycleObservability> {
    if (runtimeConfig.useMocks) {
      return of({
        totalArchivedRecords: 12450,
        latestArchivedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        archiveLagDays: 0,
        sourceStats: [
          { sourceTable: 'attendance_records', recordCount: 8200, latestArchivedAt: new Date().toISOString() },
          { sourceTable: 'audit_logs', recordCount: 2600, latestArchivedAt: new Date().toISOString() },
          { sourceTable: 'notifications', recordCount: 1650, latestArchivedAt: new Date().toISOString() },
        ],
        dailyTrend: [
          { day: '2026-04-16', archivedCount: 920 },
          { day: '2026-04-17', archivedCount: 1010 },
          { day: '2026-04-18', archivedCount: 980 },
          { day: '2026-04-19', archivedCount: 1110 },
          { day: '2026-04-20', archivedCount: 970 },
          { day: '2026-04-21', archivedCount: 1200 },
          { day: '2026-04-22', archivedCount: 840 },
        ],
      }).pipe(delay(220));
    }
    return this.api.get<PlatformLifecycleObservability>('/platform/lifecycle/observability');
  }

  onboardSchoolWorkspace(body: OnboardSchoolRequest): Observable<PlatformOnboardSchoolResponse> {
    if (runtimeConfig.useMocks) {
      const tenantId = `tenant_${(body.schoolCode || 'new').toLowerCase()}_${Math.random().toString(36).slice(2, 8)}`;
      return of({
        tenantId,
        schoolCode: (body.schoolCode || '').trim().toUpperCase(),
        adminUserId: 900000 + Math.floor(Math.random() * 999),
        adminEmail: body.adminEmail || `${(body.schoolCode || '').toLowerCase()}@school.local`,
        adminPhone: body.phone,
        academicYearId: 1,
      }).pipe(delay(250));
    }
    return this.api.post<PlatformOnboardSchoolResponse>('/platform/schools/onboard', body);
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

  updateSchoolWorkspaceProfile(
    tenantId: string,
    body: UpdateSchoolWorkspaceRequest
  ): Observable<PlatformSchoolSummary> {
    if (runtimeConfig.useMocks) {
      const idx = this.mockSchools.findIndex(s => s.tenantId === tenantId);
      if (idx < 0) {
        return throwError(() => new Error('School not found'));
      }
      const cur: PlatformSchoolSummary = { ...this.mockSchools[idx] };
      if (body.schoolName != null && body.schoolName.trim() !== '') {
        cur.schoolName = body.schoolName.trim();
      }
      if (body.schoolCode != null && body.schoolCode.trim() !== '') {
        cur.schoolCode = body.schoolCode.trim().toUpperCase();
      }
      if (body.email !== undefined) {
        cur.email = body.email.trim() || undefined;
      }
      if (body.phone !== undefined) {
        cur.phone = body.phone.trim() || undefined;
      }
      if (body.address !== undefined) {
        cur.address = body.address.trim() || undefined;
      }
      if (body.primaryColor != null && body.primaryColor.trim() !== '') {
        cur.primaryColor = body.primaryColor.trim();
      }
      if (body.secondaryColor != null && body.secondaryColor.trim() !== '') {
        cur.secondaryColor = body.secondaryColor.trim();
      }
      this.mockSchools = [...this.mockSchools.slice(0, idx), cur, ...this.mockSchools.slice(idx + 1)];
      return of({ ...cur }).pipe(delay(140));
    }
    return this.api.put<PlatformSchoolSummary>(
      `/platform/schools/${encodeURIComponent(tenantId)}/profile`,
      body
    );
  }

  updateSchoolAdminProfile(
    tenantId: string,
    userId: number,
    body: UpdateSchoolAdminRequest
  ): Observable<PlatformSchoolAdmin> {
    if (runtimeConfig.useMocks) {
      const list = this.mockAdmins[tenantId];
      if (!list?.length) {
        return throwError(() => new Error('No admins for workspace'));
      }
      const idx = list.findIndex(a => String(a.id) === String(userId));
      if (idx < 0) {
        return throwError(() => new Error('Admin not found'));
      }
      const next = { ...list[idx] };
      if (body.name != null && body.name.trim() !== '') {
        next.name = body.name.trim();
      }
      if (body.email != null && body.email.trim() !== '') {
        next.email = body.email.trim();
      }
      if (body.phone !== undefined) {
        next.phone = body.phone.trim() || undefined;
      }
      const admins = [...list.slice(0, idx), next, ...list.slice(idx + 1)];
      this.mockAdmins = { ...this.mockAdmins, [tenantId]: admins };
      return of({ ...next }).pipe(delay(120));
    }
    return this.api.put<PlatformSchoolAdmin>(
      `/platform/schools/${encodeURIComponent(tenantId)}/admins/${userId}`,
      body
    );
  }

  getSchoolFinanceProfile(tenantId: string): Observable<TenantFinanceProfile> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<TenantFinanceProfile>(`/platform/schools/${encodeURIComponent(tenantId)}/finance-profile`);
    }
    this.seedMockSchoolFinanceProfileIfNeeded(tenantId);
    const row = this.mockSchoolFinanceProfiles[tenantId];
    if (!row) {
      return throwError(() => new Error('School not found'));
    }
    return of({ ...row }).pipe(delay(90));
  }

  approveSchoolFinanceProfileLive(tenantId: string): Observable<TenantFinanceProfile> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<TenantFinanceProfile>(
        `/platform/schools/${encodeURIComponent(tenantId)}/finance-profile/approve-live`,
        {}
      );
    }
    this.seedMockSchoolFinanceProfileIfNeeded(tenantId);
    const cur = this.mockSchoolFinanceProfiles[tenantId];
    if (!cur || cur.paymentRoutingOnboardingStatus !== 'SUBMITTED') {
      return throwError(() => new Error('Can only approve LIVE when Route onboarding is SUBMITTED.'));
    }
    const next: TenantFinanceProfile = {
      ...cur,
      paymentRoutingOnboardingStatus: 'LIVE',
      paymentRoutingLiveAt: new Date().toISOString(),
      paymentRoutingLiveByUserId: 999001,
    };
    this.mockSchoolFinanceProfiles[tenantId] = next;
    return of({ ...next }).pipe(delay(140));
  }

  private seedMockSchoolFinanceProfileIfNeeded(tenantId: string): void {
    if (this.mockSchoolFinanceProfiles[tenantId]) {
      return;
    }
    const school = this.mockSchools.find(s => s.tenantId === tenantId);
    if (!school) {
      return;
    }
    const idx = this.mockSchools.findIndex(s => s.tenantId === tenantId);
    if (idx === 0) {
      this.mockSchoolFinanceProfiles[tenantId] = {
        tenantId,
        feeSettlementMode: 'ROUTE_LINKED_ACCOUNT',
        razorpayRouteLinkedAccountId: 'acc_mock_route_demo_001',
        razorpayRouteLinkedAccountMasked: 'acc_moc…0001',
        platformCommissionBps: 150,
        financeNotes: 'Demo: KYC pack received (mock)',
        paymentRoutingOnboardingStatus: 'SUBMITTED',
        paymentRoutingSubmittedAt: new Date(Date.now() - 86400000).toISOString(),
        paymentRoutingLiveAt: null,
        paymentRoutingLiveByUserId: null,
        paymentRoutingOnboardingDeclaration:
          'We confirm that this linked account belongs to our institution and we are authorized to receive parent fee settlements here.',
        parentOnlineFeeCheckoutEnabled: true,
        payrollDigitalPayoutEnabled: false,
      };
    } else {
      this.mockSchoolFinanceProfiles[tenantId] = {
        tenantId,
        feeSettlementMode: 'OFFLINE_SCHOOL_COLLECTION',
        razorpayRouteLinkedAccountId: null,
        razorpayRouteLinkedAccountMasked: null,
        platformCommissionBps: 0,
        financeNotes: null,
        paymentRoutingOnboardingStatus: 'NOT_REQUIRED',
        paymentRoutingSubmittedAt: null,
        paymentRoutingLiveAt: null,
        paymentRoutingLiveByUserId: null,
        paymentRoutingOnboardingDeclaration: null,
        parentOnlineFeeCheckoutEnabled: false,
        payrollDigitalPayoutEnabled: false,
      };
    }
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
        schoolName: school.schoolName,
        status: 'QUEUED',
        requestedByRole: 'ADMIN',
        requestedByDisplayName: `${school.schoolName} Principal`,
        requestedByPrincipal: (school.email || `${school.schoolCode.toLowerCase()}-admin@school.local`),
        executedByRole: 'SUPER_ADMIN',
        executedByDisplayName: 'Platform Super Admin',
        executedByPrincipal: 'super-admin@mock.school',
        affectedStudents: school.studentCount,
        affectedTeachers: school.teacherCount,
        affectedAdmins: school.adminCount,
        affectedParentAccounts: Math.round(school.studentCount * 0.85),
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
        if (job.startedAt && job.completedAt) {
          job.executionDurationMs = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
        }
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

  listGlobalPurgeJobs(
    page = 0,
    size = DEFAULT_ERP_PAGE_SIZE,
    q?: string,
    status?: string
  ): Observable<PageResp<PlatformPurgeJob>> {
    if (runtimeConfig.useMocks) {
      const allRows: PlatformPurgeJob[] = Object.entries(this.mockPurgeJobs).flatMap(([tenantId, rows]) => {
        const school = this.mockSchools.find(s => s.tenantId === tenantId);
        return (rows ?? []).map(row => ({
          ...row,
          schoolName: row.schoolName ?? school?.schoolName ?? null,
          schoolCode: row.schoolCode ?? school?.schoolCode ?? '',
          tenantId
        }));
      });
      const query = (q || '').trim().toLowerCase();
      const desiredStatus = (status || '').trim().toUpperCase();
      let filtered = [...allRows];
      if (query) {
        filtered = filtered.filter(row =>
          `${row.schoolName || ''} ${row.schoolCode || ''} ${row.tenantId || ''}`
            .toLowerCase()
            .includes(query)
        );
      }
      if (desiredStatus) {
        filtered = filtered.filter(row => (row.status || '').toUpperCase() === desiredStatus);
      }
      filtered.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      return of(sliceToPage(filtered, page, size)).pipe(delay(120));
    }
    return this.api.getPageParams<PlatformPurgeJob>('/platform/purge-jobs', {
      page,
      size,
      q: q?.trim() || undefined,
      status: status?.trim() || undefined
    }).pipe(
      map(p => ({
        ...p,
        content: p.content.map(row => ({ ...row, id: String(row.id) }))
      }))
    );
  }

  exportPurgeJobCsv(tenantId: string, jobId: string): Observable<Blob> {
    if (runtimeConfig.useMocks) {
      const list = this.mockPurgeJobs[tenantId] ?? [];
      const job = list.find(j => j.id === String(jobId));
      if (!job) {
        return throwError(() => new Error('Purge job not found'));
      }
      const header = [
        'job_id', 'tenant_id', 'school_code', 'status', 'error_message', 'rows_deleted_estimate', 'execution_duration_ms',
        'requested_by_user_id', 'requested_by_role', 'requested_by_principal', 'requested_by_display_name',
        'affected_students', 'affected_teachers', 'affected_admins', 'affected_parent_accounts',
        'created_at', 'started_at', 'completed_at'
      ];
      const row = [
        job.id, job.tenantId, job.schoolCode, job.status, job.errorMessage ?? '', job.rowsDeletedEstimate ?? '', job.executionDurationMs ?? '',
        job.requestedByUserId ?? '', job.requestedByRole ?? '', job.requestedByPrincipal ?? '', job.requestedByDisplayName ?? '',
        job.affectedStudents ?? '', job.affectedTeachers ?? '', job.affectedAdmins ?? '', job.affectedParentAccounts ?? '',
        job.createdAt ?? '', job.startedAt ?? '', job.completedAt ?? ''
      ];
      const escapeCell = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csv = `${header.join(',')}\n${row.map(escapeCell).join(',')}\n`;
      return of(new Blob([csv], { type: 'text/csv;charset=utf-8' })).pipe(delay(120));
    }
    return this.api.getBlob(`/platform/schools/${encodeURIComponent(tenantId)}/purge-jobs/${encodeURIComponent(jobId)}/export.csv`);
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

  /** Clear cache - supports tenant-scoped and region-filtered clearing. */
  clearCache(request: CacheClearRequest): Observable<CacheClearResponse> {
    if (runtimeConfig.useMocks) {
      const isTenantScoped = !!request.tenantId;
      const isRegionFiltered = request.regions && request.regions.length > 0;

      const allRegions = [
        'transportRoutes', 'announcementPreviews', 'payrollStructures',
        'referenceData', 'permissions', 'tenantConfig', 'reportResults',
        'dashboardSnapshots', 'studentDirectory', 'teacherDirectory',
        'academicCatalog', 'settingsSnapshot', 'libraryCatalog',
        'libraryIssues', 'feesCatalog', 'timetableGrid', 'tenantFeatureFlags'
      ];

      const targetRegions = isRegionFiltered ? request.regions! : allRegions;
      const school = isTenantScoped ? this.mockSchools.find(s => s.tenantId === request.tenantId) : null;
      const includesDashboardSnapshots = targetRegions.some(r => r.toLowerCase() === 'dashboardsnapshots');
      const dashRows = includesDashboardSnapshots ? (isTenantScoped ? 6 : 180) : null;

      const mockResponse: CacheClearResponse = {
        success: true,
        message: isTenantScoped
          ? `Successfully cleared ${targetRegions.length} cache regions for selected school`
          : `Successfully cleared ${targetRegions.length} cache regions globally`,
        statistics: {
          regionsCleared: targetRegions.length,
          clearedRegions: targetRegions,
          failedRegions: [],
          clearedAt: new Date().toISOString(),
          clearedBy: 'SUPER_ADMIN (Mock)',
          targetTenantId: request.tenantId || null,
          targetSchoolName: school?.schoolName || null,
          keysEvicted: isTenantScoped ? Math.floor(12 + targetRegions.length * 7 + Math.random() * 20) : null,
          dashboardSnapshotRowsMarked: dashRows
        }
      };
      return of(mockResponse).pipe(delay(800));
    }
    return this.api.post<CacheClearResponse>('/platform/cache/clear', request);
  }

  /** Get available cache regions with metadata for UI. */
  getCacheRegions(): CacheRegionOption[] {
    return [
      { name: 'referenceData', label: 'Reference Data', description: 'Countries, static lookups, master data', category: 'core' },
      { name: 'permissions', label: 'Permissions', description: 'Role matrices and access control', category: 'core' },
      { name: 'tenantConfig', label: 'Tenant Config', description: 'School settings and branding', category: 'core' },
      { name: 'settingsSnapshot', label: 'Settings Snapshot', description: 'Cached configuration snapshots', category: 'core' },
      { name: 'tenantFeatureFlags', label: 'Feature Flags', description: 'Module toggles cache (per school)', category: 'core' },

      { name: 'academicCatalog', label: 'Academic Catalog', description: 'Subjects, classes, academic year data', category: 'academic' },
      { name: 'studentDirectory', label: 'Student Directory', description: 'Student roster and profiles', category: 'academic' },
      { name: 'teacherDirectory', label: 'Teacher Directory', description: 'Teacher roster and profiles', category: 'academic' },
      { name: 'timetableGrid', label: 'Timetable', description: 'Class schedules and periods', category: 'academic' },

      { name: 'transportRoutes', label: 'Transport Routes', description: 'Bus routes and live tracking', category: 'operations' },
      { name: 'announcementPreviews', label: 'Announcements', description: 'Announcement headers and previews', category: 'operations' },
      { name: 'libraryCatalog', label: 'Library Catalog', description: 'Book inventory and metadata', category: 'operations' },
      { name: 'libraryIssues', label: 'Library Issues', description: 'Book issue/return records', category: 'operations' },
      { name: 'feesCatalog', label: 'Fees Catalog', description: 'Fee structures and categories', category: 'operations' },

      { name: 'reportResults', label: 'Report Results', description: 'Heavy report snapshots', category: 'reports' },
      { name: 'dashboardSnapshots', label: 'Dashboard Snapshots', description: 'KPI and dashboard data', category: 'reports' },
      { name: 'payrollStructures', label: 'Payroll Structures', description: 'Salary grids and structures', category: 'reports' },
    ];
  }

  /** Legacy method - use clearCache() instead. */
  clearAllCaches(): Observable<CacheClearResponse> {
    return this.clearCache({ tenantId: null, regions: null });
  }
}
