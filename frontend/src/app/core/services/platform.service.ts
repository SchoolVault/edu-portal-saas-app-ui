import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { PlatformDashboardData, PlatformSchoolAdmin, PlatformSchoolSummary } from '../models/models';

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

  constructor(private api: ApiService) {}

  getDashboard(): Observable<PlatformDashboardData> {
    if (environment.useMocks) {
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
    if (environment.useMocks) {
      return of(this.mockSchools.map(school => ({ ...school }))).pipe(delay(200));
    }
    return this.api.get<PlatformSchoolSummary[]>('/platform/schools');
  }

  getSchoolAdmins(tenantId: string): Observable<PlatformSchoolAdmin[]> {
    if (environment.useMocks) {
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
    if (environment.useMocks) {
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
