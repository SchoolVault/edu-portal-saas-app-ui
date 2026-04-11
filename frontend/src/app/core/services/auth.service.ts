import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { catchError, delay, map, take, tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, OnboardSchoolRequest, ProfileSummary, TokenResponse } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { environment } from '../../../environments/environment';
import { isAccessExpiredByClock, isLikelyJwt } from '../auth/access-token';
import { buildMockProfileSummary, findMockLoginUser } from '../mocks/auth.mock-data';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly TENANT_DISPLAY_KEY = 'erp_tenant_display_overrides';
  /** Mock / non-JWT sessions: client-side access expiry (epoch ms). */
  private static readonly STORAGE_ACCESS_EXPIRES_AT = 'erp_access_expires_at';
  private static readonly STORAGE_REFRESH_EXPIRES_AT = 'erp_refresh_expires_at';
  private static readonly CLOCK_SKEW_MS = 60_000;

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
        this.ensureMockSessionMetadata(token);
        this.tokenSubject.next(token);
        this.refreshTokenSubject.next(refreshToken);
        this.currentUserSubject.next(user);
      } catch {
        this.clearLocalAuthState();
      }
    }
  }

  private getMockAccessTtlMs(): number {
    const n = (environment as { mockSessionAccessTtlMs?: number }).mockSessionAccessTtlMs;
    return typeof n === 'number' && n > 0 ? n : 86400000;
  }

  private getMockRefreshTtlMs(): number {
    const n = (environment as { mockSessionRefreshTtlMs?: number }).mockSessionRefreshTtlMs;
    return typeof n === 'number' && n > 0 ? n : 604800000;
  }

  /** One-time metadata for mock tokens so sessions can expire like real JWTs. */
  private ensureMockSessionMetadata(token: string): void {
    if (isLikelyJwt(token)) {
      return;
    }
    if (!localStorage.getItem(AuthService.STORAGE_ACCESS_EXPIRES_AT)) {
      localStorage.setItem(AuthService.STORAGE_ACCESS_EXPIRES_AT, String(Date.now() + this.getMockAccessTtlMs()));
    }
    if (!localStorage.getItem(AuthService.STORAGE_REFRESH_EXPIRES_AT)) {
      localStorage.setItem(AuthService.STORAGE_REFRESH_EXPIRES_AT, String(Date.now() + this.getMockRefreshTtlMs()));
    }
  }

  private readMockAccessExpiryMs(): number | null {
    const raw = localStorage.getItem(AuthService.STORAGE_ACCESS_EXPIRES_AT);
    if (!raw) {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private readMockRefreshExpiryMs(): number | null {
    const raw = localStorage.getItem(AuthService.STORAGE_REFRESH_EXPIRES_AT);
    if (!raw) {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private isAccessExpired(token: string | null): boolean {
    if (!token) {
      return true;
    }
    const now = Date.now();
    if (isLikelyJwt(token)) {
      return isAccessExpiredByClock(token, now, AuthService.CLOCK_SKEW_MS, null);
    }
    const mockExp = this.readMockAccessExpiryMs();
    if (mockExp == null) {
      return false;
    }
    const skew = this.mockSkewForTtl(this.getMockAccessTtlMs());
    return now >= mockExp - skew;
  }

  /** Proportional early-expiry skew so short TTLs (e.g. 60s QA) are not treated as expired immediately. */
  private mockSkewForTtl(ttlMs: number): number {
    return Math.min(AuthService.CLOCK_SKEW_MS, Math.max(2000, Math.floor(ttlMs * 0.1)));
  }

  private stripMockExpiryKeys(): void {
    localStorage.removeItem(AuthService.STORAGE_ACCESS_EXPIRES_AT);
    localStorage.removeItem(AuthService.STORAGE_REFRESH_EXPIRES_AT);
  }

  private persistMockSessionFromNow(): void {
    localStorage.setItem(AuthService.STORAGE_ACCESS_EXPIRES_AT, String(Date.now() + this.getMockAccessTtlMs()));
    localStorage.setItem(AuthService.STORAGE_REFRESH_EXPIRES_AT, String(Date.now() + this.getMockRefreshTtlMs()));
  }

  /** Apply new access + refresh pair after login or refresh (keeps user row unchanged). */
  applyTokenPair(token: string, refreshToken: string): void {
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_refresh_token', refreshToken);
    this.tokenSubject.next(token);
    this.refreshTokenSubject.next(refreshToken);
    if (isLikelyJwt(token)) {
      this.stripMockExpiryKeys();
    }
  }

  /**
   * Clears tokens and user context locally. Used after 401 and failed refresh (no server logout call).
   */
  clearLocalAuthState(): void {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_user');
    this.stripMockExpiryKeys();
    this.tokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.profileSummarySubject.next(null);
  }

  /**
   * Ensures a valid access token for protected routes: uses JWT `exp` or mock TTL, then one refresh call if needed.
   * Backend remains the authority; 401 on API calls still triggers {@link clearLocalAuthState} via the HTTP interceptor.
   */
  ensureValidSession(): Observable<boolean> {
    const token = this.tokenSubject.value;
    const refresh = this.refreshTokenSubject.value;

    if (!token && !refresh) {
      return of(false);
    }
    if (!token || !refresh) {
      this.clearLocalAuthState();
      return of(false);
    }

    if (!this.isAccessExpired(token)) {
      return of(true);
    }

    if (runtimeConfig.useMocks) {
      return of(this.performMockRefresh());
    }

    return this.api.post<TokenResponse>('/auth/refresh-token', { refreshToken: refresh }).pipe(
      tap(res => this.applyTokenPair(res.token, res.refreshToken)),
      map(() => true),
      catchError(() => {
        this.clearLocalAuthState();
        return of(false);
      }),
      take(1)
    );
  }

  private performMockRefresh(): boolean {
    const refreshExp = this.readMockRefreshExpiryMs();
    const refreshSkew = this.mockSkewForTtl(this.getMockRefreshTtlMs());
    if (refreshExp == null || Date.now() >= refreshExp - refreshSkew) {
      this.clearLocalAuthState();
      return false;
    }
    const newRt = 'mock-refresh-' + Date.now();
    localStorage.setItem('erp_refresh_token', newRt);
    this.refreshTokenSubject.next(newRt);
    localStorage.setItem(AuthService.STORAGE_ACCESS_EXPIRES_AT, String(Date.now() + this.getMockAccessTtlMs()));
    return true;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<LoginResponse>('/auth/login', request).pipe(
        tap(res => {
          this.applyTokenPair(res.token, res.refreshToken);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        })
      );
    }
    const found = findMockLoginUser(request);
    if (found) {
      const response: LoginResponse = {
        token: 'eyJhbGciOiJIUzI1NiJ9.mock-jwt-' + found.user.role + '-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
        user: found.user,
      };
      return of(response).pipe(
        delay(800),
        tap(res => {
          this.applyTokenPair(res.token, res.refreshToken);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          this.persistMockSessionFromNow();
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
    this.clearLocalAuthState();
  }

  onboardSchool(request: OnboardSchoolRequest): Observable<LoginResponse> {
    if (runtimeConfig.useMocks) {
      const response: LoginResponse = {
        token: 'mock-onboard-token-' + Date.now(),
        refreshToken: 'mock-onboard-refresh-' + Date.now(),
        user: {
          id: 999001,
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
          this.applyTokenPair(res.token, res.refreshToken);
          localStorage.setItem('erp_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          this.persistMockSessionFromNow();
        })
      );
    }
    return this.api.post<LoginResponse>('/auth/onboard-tenant', request).pipe(
      tap(res => {
        this.applyTokenPair(res.token, res.refreshToken);
        localStorage.setItem('erp_user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  isAuthenticated(): boolean {
    const token = this.tokenSubject.value;
    const refresh = this.refreshTokenSubject.value;
    if (!token || !refresh) {
      return false;
    }
    return !this.isAccessExpired(token);
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

  setChildAvatarDataUrl(studentId: number, dataUrl: string): void {
    localStorage.setItem(`erp_child_avatar_${studentId}`, dataUrl);
  }

  getChildAvatarDataUrl(studentId: number): string | null {
    return localStorage.getItem(`erp_child_avatar_${studentId}`);
  }

  clearChildAvatarDataUrl(studentId: number): void {
    localStorage.removeItem(`erp_child_avatar_${studentId}`);
  }

  /** Demo local storage for student directory photo; replace with PUT .../avatar or media URL from API. */
  getDirectoryStudentAvatarDataUrl(studentId: number): string | null {
    return localStorage.getItem(`erp_dir_student_avatar_${studentId}`);
  }

  setDirectoryStudentAvatarDataUrl(studentId: number, dataUrl: string): void {
    localStorage.setItem(`erp_dir_student_avatar_${studentId}`, dataUrl);
  }

  clearDirectoryStudentAvatar(studentId: number): void {
    localStorage.removeItem(`erp_dir_student_avatar_${studentId}`);
  }

  getDirectoryTeacherAvatarDataUrl(teacherId: number): string | null {
    return localStorage.getItem(`erp_dir_teacher_avatar_${teacherId}`);
  }

  setDirectoryTeacherAvatarDataUrl(teacherId: number, dataUrl: string): void {
    localStorage.setItem(`erp_dir_teacher_avatar_${teacherId}`, dataUrl);
  }

  clearDirectoryTeacherAvatar(teacherId: number): void {
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
      const summary = buildMockProfileSummary(this.getCurrentUser());
      this.profileSummarySubject.next(summary);
      return of(summary).pipe(delay(200));
    }
    return this.api.get<any>('/auth/profile-summary').pipe(
      tap(summary =>
        this.profileSummarySubject.next({
          ...summary,
          id: Number(summary.id),
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
