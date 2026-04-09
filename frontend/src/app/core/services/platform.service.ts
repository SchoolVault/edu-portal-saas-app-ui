import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { runtimeConfig } from '../config/runtime-config';
import { ApiService } from './api.service';
import {
  PlatformBroadcastResult,
  PlatformDashboardData,
  PlatformPurgeJob,
  PlatformSchoolAdmin,
  PlatformSchoolDetail,
  PlatformSchoolSummary,
  PlatformSubscriptionPlan,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private mockSchools: PlatformSchoolSummary[] = [
    { tenantId: 'tenant_crescent_1021', schoolName: 'Crescent Heights Academy', schoolCode: 'SCH001', email: 'ops@crescentheights.edu', phone: '+1-555-1000', address: 'Austin, TX', active: true, studentCount: 2847, teacherCount: 124, adminCount: 3, primaryColor: '#1B3A30', secondaryColor: '#C05C3D' },
    { tenantId: 'tenant_riverdale_9012', schoolName: 'Riverdale Public School', schoolCode: 'RPS101', email: 'admin@riverdale.edu', phone: '+1-555-2040', address: 'Dallas, TX', active: true, studentCount: 1930, teacherCount: 87, adminCount: 2, primaryColor: '#0F766E', secondaryColor: '#F59E0B' },
    { tenantId: 'tenant_maple_7731', schoolName: 'Maple Leaf International', schoolCode: 'MLI220', email: 'team@mapleleaf.edu', phone: '+1-555-3099', address: 'Houston, TX', active: true, studentCount: 3210, teacherCount: 168, adminCount: 4, primaryColor: '#1E3A8A', secondaryColor: '#D97706' },
    { tenantId: 'tenant_sunrise_4450', schoolName: 'Sunrise Preparatory', schoolCode: 'SUN555', email: 'hello@sunriseprep.edu', phone: '+1-555-4400', address: 'San Antonio, TX', active: false, studentCount: 1150, teacherCount: 54, adminCount: 2, primaryColor: '#7C2D12', secondaryColor: '#EA580C' }
  ];

  private mockAdmins: Record<string, PlatformSchoolAdmin[]> = {
    tenant_crescent_1021: [
      { id: '101', name: 'John Anderson', email: 'admin@school.com', phone: '+1-555-0101', schoolCode: 'SCH001', active: true, createdAt: '2026-01-05T08:00:00Z' },
      { id: '102', name: 'Nadia Brooks', email: 'ops@crescentheights.edu', phone: '+1-555-0106', schoolCode: 'SCH001', active: true, createdAt: '2026-02-08T08:00:00Z' }
    ],
    tenant_riverdale_9012: [
      { id: '103', name: 'Rohan Mehta', email: 'admin@riverdale.edu', phone: '+1-555-0201', schoolCode: 'RPS101', active: true, createdAt: '2026-01-18T08:00:00Z' }
    ],
    tenant_maple_7731: [
      { id: '104', name: 'Leah Simmons', email: 'principal@mapleleaf.edu', phone: '+1-555-0301', schoolCode: 'MLI220', active: true, createdAt: '2025-12-19T08:00:00Z' },
      { id: '105', name: 'Harsh Patel', email: 'finance@mapleleaf.edu', phone: '+1-555-0302', schoolCode: 'MLI220', active: false, createdAt: '2026-02-11T08:00:00Z' }
    ],
    tenant_sunrise_4450: [
      { id: '106', name: 'Emily Grant', email: 'head@sunriseprep.edu', phone: '+1-555-0401', schoolCode: 'SUN555', active: false, createdAt: '2025-11-10T08:00:00Z' }
    ]
  };

  private mockPurgeJobs: Record<string, PlatformPurgeJob[]> = {};
  private purgeJobSeq = 1;

  private readonly mockPlans: PlatformSubscriptionPlan[] = [
    {
      code: 'STARTER',
      name: 'Starter',
      description: 'Ideal for a single campus validating digital attendance, fees, and parent engagement.',
      monthlyPriceMinorUnits: 4900,
      currency: 'USD',
      highlights: ['Guided onboarding checklist', 'Standard uptime targets', 'Community knowledge base'],
      maxStudentsLabel: 'Up to 300 active students',
      supportTier: 'Email & chat (business hours)',
      billingCadence: 'Billed monthly per active workspace',
      modules: ['Students & classes', 'Attendance', 'Timetable (read)', 'Fees (core)', 'Parent portal (read)', 'Announcements', 'Basic reports'],
      recommended: false
    },
    {
      code: 'STANDARD',
      name: 'Standard',
      description: 'The default production tier for schools running academics, finance, and operations in one place.',
      monthlyPriceMinorUnits: 12900,
      currency: 'USD',
      highlights: ['Quarterly success review', 'Data export APIs', 'Optional SSO add-on'],
      maxStudentsLabel: 'Up to 2,000 active students',
      supportTier: 'Priority support (12×5)',
      billingCadence: 'Billed monthly per active workspace',
      modules: ['Everything in Starter', 'Exams & gradebook', 'Library', 'Transport & routes', 'Hostel', 'Payroll (standard)', 'Documents', 'Audit trail (90 days)', 'Chat'],
      recommended: true
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'Regional groups, compliance-heavy boards, and multi-branch governance with custom limits.',
      monthlyPriceMinorUnits: 0,
      currency: 'USD',
      highlights: ['Custom MSA & DPA', 'Dedicated technical account lead', 'Optional on-prem / VPC'],
      maxStudentsLabel: 'Custom (unlimited branches)',
      supportTier: 'Named CSM + 24×7 hotline',
      billingCadence: 'Billed monthly per active workspace',
      modules: ['Everything in Standard', 'Multi-branch roll-up', 'Advanced audit (retention policies)', 'Custom integrations', 'Sandbox tenant', 'DR runbooks'],
      recommended: false
    }
  ];

  constructor(private api: ApiService) {}

  getDashboard(): Observable<PlatformDashboardData> {
    if (runtimeConfig.useMocks) {
      return of({
        totalSchools: 24,
        activeSchools: 21,
        totalStudents: 18420,
        totalTeachers: 1260,
        totalAdmins: 62,
        schoolGrowth: [
          { label: 'Nov', value: 4 },
          { label: 'Dec', value: 6 },
          { label: 'Jan', value: 8 },
          { label: 'Feb', value: 10 },
          { label: 'Mar', value: 12 },
          { label: 'Apr', value: 14 }
        ],
        revenueTrend: [
          { label: 'Nov', value: 18000 },
          { label: 'Dec', value: 22500 },
          { label: 'Jan', value: 26400 },
          { label: 'Feb', value: 30100 },
          { label: 'Mar', value: 34800 },
          { label: 'Apr', value: 39200 }
        ],
        recentActivities: [
          { title: '3 new schools completed onboarding', description: 'Operations team provisioned campuses in Texas and Arizona.', tone: 'success', timestamp: '2 hours ago' },
          { title: 'Billing reconciliation queued', description: 'Monthly subscription sync is prepared for all active tenants.', tone: 'info', timestamp: 'Today' },
          { title: 'Admin policy cleanup', description: 'Inactive school admins were flagged for review in two tenants.', tone: 'warning', timestamp: 'Today' }
        ],
        topSchools: [...this.mockSchools].sort((a, b) => b.studentCount - a.studentCount).slice(0, 4)
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
