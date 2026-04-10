import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, OnboardSchoolRequest, ProfileSummary } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly TENANT_DISPLAY_KEY = 'erp_tenant_display_overrides';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private profileSummarySubject = new BehaviorSubject<ProfileSummary | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  token$ = this.tokenSubject.asObservable();
  profileSummary$ = this.profileSummarySubject.asObservable();

  /** Emits when the signed-in user’s profile photo changes (local or future API). Header/settings subscribe. */
  private readonly profileAvatarChanged = new Subject<void>();
  readonly profileAvatarChanged$ = this.profileAvatarChanged.asObservable();

  private mockUsers = [
    {
      email: 'admin@school.com', password: 'admin123', schoolCode: 'SCH001',
      user: { id: 'u1', email: 'admin@school.com', name: 'John Anderson', role: 'admin' as const, tenantId: 't1', phone: '+1-555-0101' }
    },
    {
      email: 'teacher@school.com', password: 'teacher123', schoolCode: 'SCH001',
      user: { id: 'u2', email: 'teacher@school.com', name: 'Sarah Mitchell', role: 'teacher' as const, tenantId: 't1', phone: '+1-555-0102' }
    },
    {
      email: 'parent@school.com', password: 'parent123', schoolCode: 'SCH001',
      user: { id: 'u3', email: 'parent@school.com', name: 'Michael Chen', role: 'parent' as const, tenantId: 't1', phone: '+1-555-0103' }
    },
    {
      email: 'superadmin@schoolvault.com', password: 'super123', schoolCode: 'PLATFORM',
      user: { id: 'sa1', email: 'superadmin@schoolvault.com', name: 'Priya Narang', role: 'super_admin' as const, tenantId: 'platform', phone: '+1-555-0199' }
    },
  ];

  constructor(private api: ApiService) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('erp_token');
    const refreshToken = localStorage.getItem('erp_refresh_token');
    const userStr = localStorage.getItem('erp_user');
    if (token && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.refreshTokenSubject.next(refreshToken);
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<LoginResponse>('/auth/login', request).pipe(
        tap(res => {
          localStorage.setItem('erp_token', res.token);
          localStorage.setItem('erp_refresh_token', res.refreshToken);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.tokenSubject.next(res.token);
          this.refreshTokenSubject.next(res.refreshToken);
          this.currentUserSubject.next(res.user);
        })
      );
    }
    const found = this.mockUsers.find(
      u => u.email === request.email && u.password === request.password && u.schoolCode === request.schoolCode
    );
    if (found) {
      const response: LoginResponse = {
        token: 'eyJhbGciOiJIUzI1NiJ9.mock-jwt-' + found.user.role + '-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
        user: found.user,
      };
      return of(response).pipe(
        delay(800),
        tap(res => {
          localStorage.setItem('erp_token', res.token);
          localStorage.setItem('erp_refresh_token', res.refreshToken);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.tokenSubject.next(res.token);
          this.refreshTokenSubject.next(res.refreshToken);
          this.currentUserSubject.next(res.user);
        })
      );
    }
    return throwError(() => new Error('Invalid credentials or school code')).pipe(delay(500));
  }

  logout(): void {
    const refreshToken = this.refreshTokenSubject.value;
    if (!runtimeConfig.useMocks && refreshToken) {
      this.api.post<void>('/auth/logout', { refreshToken }).subscribe({ error: () => void 0 });
    }
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_user');
    this.tokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.profileSummarySubject.next(null);
  }

  onboardSchool(request: OnboardSchoolRequest): Observable<LoginResponse> {
    if (runtimeConfig.useMocks) {
      const response: LoginResponse = {
        token: 'mock-onboard-token-' + Date.now(),
        refreshToken: 'mock-onboard-refresh-' + Date.now(),
        user: {
          id: 'u_new',
          email: request.adminEmail,
          name: request.adminName,
          role: 'admin',
          tenantId: 'tenant_' + request.schoolCode.toLowerCase(),
          phone: request.phone
        }
      };
      return of(response).pipe(
        delay(800),
        tap(res => {
          localStorage.setItem('erp_token', res.token);
          localStorage.setItem('erp_refresh_token', res.refreshToken);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.tokenSubject.next(res.token);
          this.refreshTokenSubject.next(res.refreshToken);
          this.currentUserSubject.next(res.user);
        })
      );
    }
    return this.api.post<LoginResponse>('/auth/onboard-tenant', request).pipe(
      tap(res => {
        localStorage.setItem('erp_token', res.token);
        localStorage.setItem('erp_refresh_token', res.refreshToken);
        localStorage.setItem('erp_user', JSON.stringify(res.user));
        this.tokenSubject.next(res.token);
        this.refreshTokenSubject.next(res.refreshToken);
        this.currentUserSubject.next(res.user);
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.role || null;
  }

  /**
   * Canonical role key for UI / guards (lowercase, strips Spring-style ROLE_ prefix).
   * Use this anywhere role string equality matters so API/token drift does not skip flows (e.g. admin confirm dialogs).
   */
  getNormalizedRole(): string {
    const raw = (this.getRole() ?? '').trim().toLowerCase();
    if (!raw) {
      return '';
    }
    return raw.startsWith('role_') ? raw.slice(5) : raw;
  }

  getTenantId(): string | null {
    return this.currentUserSubject.value?.tenantId || null;
  }

  getUserInitials(): string {
    const user = this.currentUserSubject.value;
    if (!user) return '';
    const parts = user.name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
  }

  /** Local profile image (mock / until media API). */
  getStoredAvatarDataUrl(): string | null {
    const u = this.getCurrentUser();
    if (!u) return null;
    return localStorage.getItem(`erp_avatar_${u.id}`);
  }

  setMyProfileAvatarDataUrl(dataUrl: string): void {
    const u = this.getCurrentUser();
    if (!u) return;
    localStorage.setItem(`erp_avatar_${u.id}`, dataUrl);
    const next = { ...u, avatar: dataUrl };
    localStorage.setItem('erp_user', JSON.stringify(next));
    this.currentUserSubject.next(next);
    this.profileAvatarChanged.next();
  }

  clearMyProfileAvatarDataUrl(): void {
    const u = this.getCurrentUser();
    if (!u) return;
    localStorage.removeItem(`erp_avatar_${u.id}`);
    const { avatar: _a, ...rest } = u;
    const next = { ...rest } as User;
    localStorage.setItem('erp_user', JSON.stringify(next));
    this.currentUserSubject.next(next);
    this.profileAvatarChanged.next();
  }

  /** Resolved avatar for header / shell: device override, then user model, then optional summary. */
  resolveCurrentUserAvatarUrl(summaryAvatar?: string | null): string | null {
    return this.getStoredAvatarDataUrl() || this.getCurrentUser()?.avatar || summaryAvatar || null;
  }

  setChildAvatarDataUrl(studentId: string, dataUrl: string): void {
    localStorage.setItem(`erp_child_avatar_${studentId}`, dataUrl);
  }

  getChildAvatarDataUrl(studentId: string): string | null {
    return localStorage.getItem(`erp_child_avatar_${studentId}`);
  }

  clearChildAvatarDataUrl(studentId: string): void {
    localStorage.removeItem(`erp_child_avatar_${studentId}`);
  }

  /** Demo local storage for student directory photo; replace with PUT .../avatar or media URL from API. */
  getDirectoryStudentAvatarDataUrl(studentId: string): string | null {
    return localStorage.getItem(`erp_dir_student_avatar_${studentId}`);
  }

  setDirectoryStudentAvatarDataUrl(studentId: string, dataUrl: string): void {
    localStorage.setItem(`erp_dir_student_avatar_${studentId}`, dataUrl);
  }

  clearDirectoryStudentAvatar(studentId: string): void {
    localStorage.removeItem(`erp_dir_student_avatar_${studentId}`);
  }

  getDirectoryTeacherAvatarDataUrl(teacherId: string): string | null {
    return localStorage.getItem(`erp_dir_teacher_avatar_${teacherId}`);
  }

  setDirectoryTeacherAvatarDataUrl(teacherId: string, dataUrl: string): void {
    localStorage.setItem(`erp_dir_teacher_avatar_${teacherId}`, dataUrl);
  }

  clearDirectoryTeacherAvatar(teacherId: string): void {
    localStorage.removeItem(`erp_dir_teacher_avatar_${teacherId}`);
  }

  readTenantDisplayOverrides(): {
    schoolName?: string;
    schoolEmail?: string;
    schoolPhone?: string;
    schoolAddress?: string;
  } {
    try {
      const raw = localStorage.getItem(AuthService.TENANT_DISPLAY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveTenantDisplay(overrides: {
    schoolName?: string;
    schoolEmail?: string;
    schoolPhone?: string;
    schoolAddress?: string;
  }): void {
    localStorage.setItem(AuthService.TENANT_DISPLAY_KEY, JSON.stringify(overrides ?? {}));
  }

  fetchProfileSummary(): Observable<ProfileSummary> {
    if (runtimeConfig.useMocks) {
      const user = this.getCurrentUser();
      const summary: ProfileSummary = user?.role === 'teacher'
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: 'teacher',
            tenantId: user.tenantId,
            schoolName: 'Crescent Heights Academy',
            schoolCode: 'SCH001',
            schoolEmail: 'info@crescentheights.edu',
            schoolPhone: '+1-555-1000',
            schoolAddress: '245 Learning Avenue, Austin, TX',
            primaryColor: '#1B3A30',
            secondaryColor: '#C05C3D',
            userTitle: 'Senior Mathematics Teacher',
            qualification: 'M.Sc Mathematics',
            specialization: 'Mathematics',
            subjectCount: 3,
            classTeacherOf: [
              { classId: 'c5', className: 'Class 5', totalStudents: 0 },
            ],
          }
        : user?.role === 'super_admin'
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: 'super_admin',
              tenantId: user.tenantId,
              schoolName: 'SchoolVault platform operations',
              schoolCode: 'PLATFORM',
              schoolEmail: 'platform@schoolvault.com',
              schoolPhone: '+1-555-9000',
              schoolAddress: 'Operating console — not a single campus tenant',
              primaryColor: '#0F172A',
              secondaryColor: '#0EA5E9',
              userTitle: 'Platform super administrator',
              platformWorkspaceCount: 4,
              platformOperatorSince: '2024-08-12',
              platformLastLoginDisplay: 'Today · 09:42 (browser session)',
              platformTimezone: 'Asia/Kolkata (operator preference)',
              platformMfaEnabled: true,
              platformPrimaryRegion: 'IN · Primary data residency — multi-tenant EU/US shards available'
            }
        : user?.role === 'parent'
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: 'parent',
              tenantId: user.tenantId,
              schoolName: 'Crescent Heights Academy',
              schoolCode: 'SCH001',
              schoolEmail: 'info@crescentheights.edu',
              schoolPhone: '+1-555-1000',
              schoolAddress: '245 Learning Avenue, Austin, TX',
              primaryColor: '#1B3A30',
              secondaryColor: '#C05C3D',
              userTitle: 'Parent Account',
              childCount: 2
            }
          : {
              id: user?.id ?? 'u1',
              name: user?.name ?? 'John Anderson',
              email: user?.email ?? 'admin@school.com',
              phone: user?.phone ?? '+1-555-0101',
              role: 'admin',
              tenantId: user?.tenantId ?? 't1',
              schoolName: 'Crescent Heights Academy',
              schoolCode: 'SCH001',
              schoolEmail: 'info@crescentheights.edu',
              schoolPhone: '+1-555-1000',
              schoolAddress: '245 Learning Avenue, Austin, TX',
              primaryColor: '#1B3A30',
              secondaryColor: '#C05C3D',
              userTitle: 'School Administrator',
              managedStudentCount: 2847,
              managedTeacherCount: 124
            };
      this.profileSummarySubject.next(summary);
      return of(summary).pipe(delay(200));
    }
    return this.api.get<any>('/auth/profile-summary').pipe(
      tap(summary =>
        this.profileSummarySubject.next({
          ...summary,
          id: String(summary.id),
          role: summary.role,
          platformWorkspaceCount: summary.platformWorkspaceCount ?? undefined,
          classTeacherOf: summary.classTeacherOf ?? undefined,
        })
      )
    );
  }

  getProfileSummarySnapshot(): ProfileSummary | null {
    return this.profileSummarySubject.value;
  }
}
