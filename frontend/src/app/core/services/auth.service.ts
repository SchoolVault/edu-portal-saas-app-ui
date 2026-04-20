import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { catchError, delay, map, switchMap, take, tap } from 'rxjs/operators';
import {
  User,
  LoginRequest,
  LoginResponse,
  OnboardSchoolRequest,
  PasswordResetRequest,
  PasswordResetResponse,
  PhoneLoginRequest,
  ProfileSummary,
  SendOtpRequest,
  SendOtpResponse,
  TokenResponse,
  UpdateAccountProfileRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { environment } from '../../../environments/environment';
import { decodeJwtPermissions, isAccessExpiredByClock, isLikelyJwt } from '../auth/access-token';
import { MOCK_LOGIN_USERS, buildMockProfileSummary, findMockLoginUser, phonesMatch } from '../mocks/auth.mock-data';
import { ERP_ACCESS_TOKEN_KEY, ERP_REFRESH_TOKEN_KEY, ERP_USER_KEY } from '../auth/client-session-keys';
import { UserLocaleService, type UiLanguage } from '../i18n/user-locale.service';

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

  constructor(
    private api: ApiService,
    private userLocale: UserLocaleService
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem(ERP_ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(ERP_REFRESH_TOKEN_KEY);
    const userStr = localStorage.getItem(ERP_USER_KEY);
    if (token && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.ensureMockSessionMetadata(token);
        this.tokenSubject.next(token);
        this.refreshTokenSubject.next(refreshToken);
        this.currentUserSubject.next(user);
        if (user?.interfaceLocale) {
          const lang: UiLanguage = user.interfaceLocale === 'hi' ? 'hi' : 'en';
          this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
        }
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
    localStorage.setItem(ERP_ACCESS_TOKEN_KEY, token);
    localStorage.setItem(ERP_REFRESH_TOKEN_KEY, refreshToken);
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
    localStorage.removeItem(ERP_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ERP_REFRESH_TOKEN_KEY);
    localStorage.removeItem(ERP_USER_KEY);
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
    localStorage.setItem(ERP_REFRESH_TOKEN_KEY, newRt);
    this.refreshTokenSubject.next(newRt);
    localStorage.setItem(AuthService.STORAGE_ACCESS_EXPIRES_AT, String(Date.now() + this.getMockAccessTtlMs()));
    return true;
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<LoginResponse>('/auth/login', request).pipe(
        tap(res => {
          this.applyTokenPair(res.token, res.refreshToken);
          localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          const lang: UiLanguage = res.user.interfaceLocale === 'hi' ? 'hi' : 'en';
          this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
        })
      );
    }
    const found = findMockLoginUser(request) ?? this.findMockPasswordLogin(request);
    if (found) {
      const lang: UiLanguage = request.interfaceLocale === 'hi' ? 'hi' : 'en';
      const user = { ...found.user, interfaceLocale: lang };
      const response: LoginResponse = {
        // Must NOT be three dot-separated segments: otherwise isLikelyJwt() is true, exp decode fails, session is always "expired" and refresh clears storage on every navigation.
        token: 'mock-access-' + found.user.role + '-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
        user,
      };
      return of(response).pipe(
        delay(800),
        tap(res => {
          this.applyTokenPair(res.token, res.refreshToken);
          localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          this.persistMockSessionFromNow();
          this.userLocale.useUiLanguage(res.user.interfaceLocale === 'hi' ? 'hi' : 'en').subscribe({ error: () => void 0 });
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
    const iface: UiLanguage = request.interfaceLocale === 'hi' ? 'hi' : 'en';
    if (runtimeConfig.useMocks) {
      const response: LoginResponse = {
        token: 'mock-onboard-token-' + Date.now(),
        refreshToken: 'mock-onboard-refresh-' + Date.now(),
        user: {
          id: 999001,
          email: request.adminEmail ?? `admin+${(request.phone ?? '').replace(/\D/g, '')}@${request.schoolCode.toLowerCase()}.local`,
          name: request.adminName,
          role: 'admin',
          tenantId: 'tenant_' + request.schoolCode.toLowerCase(),
          phone: request.phone,
          interfaceLocale: iface,
        }
      };
      return of(response).pipe(
        delay(800),
        tap(res => {
          this.applyTokenPair(res.token, res.refreshToken);
          localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          this.persistMockSessionFromNow();
          this.userLocale.useUiLanguage(iface).subscribe({ error: () => void 0 });
        })
      );
    }
    return this.api.post<LoginResponse>('/auth/onboard-tenant', request).pipe(
      tap(res => {
        this.applyTokenPair(res.token, res.refreshToken);
        localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
        const lang: UiLanguage = res.user.interfaceLocale === 'hi' ? 'hi' : 'en';
        this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
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

  /**
   * Fine-grained authorities from the access JWT `permissions` claim (e.g. LIBRARY_MANAGE).
   * Empty for mock tokens — features that need this should fall back to profile/API hints.
   */
  getJwtPermissionAuthorities(): Set<string> {
    const token = this.getToken();
    if (!token) {
      return new Set();
    }
    return new Set(decodeJwtPermissions(token));
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
    localStorage.setItem(ERP_USER_KEY, JSON.stringify(next));
    this.currentUserSubject.next(next);
    this.profileAvatarChanged.next();
  }

  clearMyProfileAvatarDataUrl(): void {
    const u = this.getCurrentUser();
    if (!u) return;
    localStorage.removeItem(`erp_avatar_${u.id}`);
    const { avatar: _a, ...rest } = u;
    const next = { ...rest } as User;
    localStorage.setItem(ERP_USER_KEY, JSON.stringify(next));
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
      const lang: UiLanguage = summary.interfaceLocale === 'hi' ? 'hi' : 'en';
      this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
      return of(summary).pipe(delay(200));
    }
    return this.api.get<any>('/auth/profile-summary').pipe(
      tap(summary => {
        const normalizedRole = this.normalizeApiRole(summary.role);
        const normalized: ProfileSummary = {
          ...summary,
          id: Number(summary.id),
          role: normalizedRole,
          platformWorkspaceCount:
            summary.platformWorkspaceCount != null ? Number(summary.platformWorkspaceCount) : undefined,
          childCount: summary.childCount != null ? Number(summary.childCount) : undefined,
          managedStudentCount: summary.managedStudentCount != null ? Number(summary.managedStudentCount) : undefined,
          managedTeacherCount: summary.managedTeacherCount != null ? Number(summary.managedTeacherCount) : undefined,
          primaryTeachingSubject:
            summary.primaryTeachingSubject != null && String(summary.primaryTeachingSubject).trim() !== ''
              ? String(summary.primaryTeachingSubject).trim()
              : undefined,
          classTeacherOf: Array.isArray(summary.classTeacherOf)
            ? summary.classTeacherOf.map((r: Record<string, unknown>) => ({
                classId: Number(r['classId']),
                className: r['className'] != null ? String(r['className']) : undefined,
                sectionId: r['sectionId'] != null ? Number(r['sectionId']) : undefined,
                sectionName: r['sectionName'] != null ? String(r['sectionName']) : undefined,
                totalStudents: r['totalStudents'] != null ? Number(r['totalStudents']) : undefined,
              }))
            : undefined,
          assignedClassCount: summary.assignedClassCount != null ? Number(summary.assignedClassCount) : undefined,
          assignedStudentCount: summary.assignedStudentCount != null ? Number(summary.assignedStudentCount) : undefined,
          subjectCount: summary.subjectCount != null ? Number(summary.subjectCount) : undefined,
        };
        this.profileSummarySubject.next(normalized);
        if (summary.interfaceLocale) {
          const lang: UiLanguage = summary.interfaceLocale === 'hi' ? 'hi' : 'en';
          this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
          this.applyInterfaceLocaleToStoredUser(lang);
        }
      })
    );
  }

  private normalizeApiRole(rawRole: unknown): User['role'] {
    const raw = String(rawRole ?? '').trim().toLowerCase();
    const withoutSpringPrefix = raw.startsWith('role_') ? raw.slice(5) : raw;
    switch (withoutSpringPrefix) {
      case 'super_admin':
      case 'admin':
      case 'teacher':
      case 'parent':
      case 'student':
      case 'library_staff':
        return withoutSpringPrefix;
      default:
        return (this.getCurrentUser()?.role ?? 'parent') as User['role'];
    }
  }

  /**
   * Persists interface language to the server (or mock storage) after {@link UserLocaleService#useUiLanguage}.
   */
  updateInterfacePreferences(lang: UiLanguage) {
    const previous = this.userLocale.readStored();
    return this.userLocale.useUiLanguage(lang).pipe(
      switchMap(() => {
        if (!this.isAuthenticated()) {
          return this.userLocale.useUiLanguage(previous).pipe(switchMap(() => of(null)));
        }
        if (runtimeConfig.useMocks) {
          this.applyInterfaceLocaleToStoredUser(lang);
          return of(this.getCurrentUser());
        }
        return this.api.put<User>('/auth/preferences', { interfaceLocale: lang }).pipe(
          tap(p => {
            if (p?.interfaceLocale) {
              this.applyInterfaceLocaleToStoredUser(p.interfaceLocale === 'hi' ? 'hi' : 'en');
            } else {
              this.applyInterfaceLocaleToStoredUser(lang);
            }
          }),
          map(() => this.getCurrentUser()),
          catchError(err =>
            this.userLocale.useUiLanguage(previous).pipe(switchMap(() => throwError(() => err)))
          )
        );
      })
    );
  }

  private applyInterfaceLocaleToStoredUser(lang: UiLanguage): void {
    const u = this.getCurrentUser();
    if (!u) {
      return;
    }
    const next = { ...u, interfaceLocale: lang };
    localStorage.setItem(ERP_USER_KEY, JSON.stringify(next));
    this.currentUserSubject.next(next);
  }

  /**
   * Normalizes {@code GET/PUT /auth/profile} payloads into the client {@link User} model.
   * Role strings follow the API (lowercase, underscores).
   */
  private mapServerProfileToUser(p: Record<string, unknown>, previous: User | null): User {
    const id = Number(p['id']);
    const roleRaw = String(p['role'] ?? previous?.role ?? 'parent');
    const iface = p['interfaceLocale'];
    const interfaceLocale: User['interfaceLocale'] =
      iface === 'hi' ? 'hi' : iface === 'en' ? 'en' : previous?.interfaceLocale;
    return {
      id: Number.isFinite(id) ? id : (previous?.id ?? 0),
      name: String(p['name'] ?? previous?.name ?? ''),
      email: String(p['email'] ?? previous?.email ?? ''),
      phone: p['phone'] != null && String(p['phone']).length > 0 ? String(p['phone']) : undefined,
      role: roleRaw as User['role'],
      tenantId: String(p['tenantId'] ?? previous?.tenantId ?? ''),
      avatar: p['avatar'] != null && String(p['avatar']).length > 0 ? String(p['avatar']) : undefined,
      interfaceLocale,
    };
  }

  /**
   * Refreshes the signed-in user from {@code GET /auth/profile} so phone/name match the database
   * (e.g. after onboarding or staff edits). No-op in mock mode.
   */
  syncProfileFromServer(): Observable<User | null> {
    if (runtimeConfig.useMocks || !this.isAuthenticated()) {
      return of(this.getCurrentUser());
    }
    return this.api.get<Record<string, unknown>>('/auth/profile').pipe(
      map(row => this.mapServerProfileToUser(row, this.getCurrentUser())),
      tap(nextRow => {
        const cur = this.getCurrentUser();
        if (!cur || nextRow.id !== cur.id) {
          return;
        }
        const hasLocalPhoto = !!this.getStoredAvatarDataUrl();
        const merged: User = {
          ...nextRow,
          avatar: hasLocalPhoto ? cur.avatar : nextRow.avatar,
          interfaceLocale: cur.interfaceLocale ?? nextRow.interfaceLocale,
        };
        localStorage.setItem(ERP_USER_KEY, JSON.stringify(merged));
        this.currentUserSubject.next(merged);
      }),
      map(() => this.getCurrentUser())
    );
  }

  /**
   * Persists display name and contact phone for the signed-in portal user (same row as login identity).
   * Mirrors {@code PUT /api/v1/auth/profile}; mock mode updates local session only.
   */
  updateAccountProfile(body: { name: string; phone: string }): Observable<User> {
    const u = this.getCurrentUser();
    if (!u) {
      return throwError(() => new Error('Not signed in'));
    }
    const name = body.name.trim();
    const phoneTrimmed = (body.phone ?? '').trim();
    const payload: UpdateAccountProfileRequest = { name, phone: phoneTrimmed };
    if (runtimeConfig.useMocks) {
      const next: User = { ...u, name, phone: phoneTrimmed || undefined };
      localStorage.setItem(ERP_USER_KEY, JSON.stringify(next));
      this.currentUserSubject.next(next);
      const sm = this.profileSummarySubject.value;
      if (sm && sm.id === next.id) {
        this.profileSummarySubject.next({ ...sm, name: next.name, phone: next.phone });
      }
      return of(next).pipe(delay(250));
    }
    return this.api.put<Record<string, unknown>>('/auth/profile', payload).pipe(
      map(row => this.mapServerProfileToUser(row, u)),
      tap(nextRow => {
        const hasLocalPhoto = !!this.getStoredAvatarDataUrl();
        const merged: User = {
          ...nextRow,
          avatar: hasLocalPhoto ? u.avatar : nextRow.avatar,
          interfaceLocale: u.interfaceLocale ?? nextRow.interfaceLocale,
        };
        localStorage.setItem(ERP_USER_KEY, JSON.stringify(merged));
        this.currentUserSubject.next(merged);
      }),
      map(() => this.getCurrentUser() as User)
    );
  }

  getProfileSummarySnapshot(): ProfileSummary | null {
    return this.profileSummarySubject.value;
  }

  // ========================================
  // PHONE AUTHENTICATION METHODS
  // ========================================

  private mockPasswordOverrideKey(schoolCode: string, userId: number): string {
    return `erp_mock_password_${schoolCode.trim().toUpperCase()}_${userId}`;
  }

  private findMockUserByPhoneAndSchool(phone: string, schoolCode: string) {
    const sc = (schoolCode ?? '').trim().toUpperCase();
    return MOCK_LOGIN_USERS.find(u => phonesMatch(u.user.phone, phone) && u.schoolCode === sc);
  }

  private findMockPasswordLogin(request: LoginRequest) {
    const sc = (request.schoolCode ?? '').trim().toUpperCase();
    const email = (request.email ?? '').trim();
    const row = MOCK_LOGIN_USERS.find(u => u.schoolCode === sc && (request.phone?.trim() ? phonesMatch(u.user.phone, request.phone) : u.email === email));
    if (!row) {
      return undefined;
    }
    const override = localStorage.getItem(this.mockPasswordOverrideKey(sc, row.user.id));
    const acceptedPassword = override ?? row.password;
    return acceptedPassword === request.password ? row : undefined;
  }

  /**
   * Send OTP to phone number for login.
   */
  sendLoginOtp(request: SendOtpRequest): Observable<SendOtpResponse> {
    if (runtimeConfig.useMocks) {
      // Mock OTP: always "123456" for testing
      const response: SendOtpResponse = {
        success: true,
        message: 'OTP sent successfully to ' + request.phone,
        requestId: 'mock-' + Date.now(),
        expiresInSeconds: 300,
        canRetryAfterSeconds: 60,
        devOtpCode: '123456' // Always show OTP in dev mode
      };
      return of(response).pipe(delay(800));
    }

    return this.api.post<SendOtpResponse>('/auth/phone/send-otp', request);
  }

  /**
   * Verify OTP entered by user.
   */
  verifyLoginOtp(request: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    if (runtimeConfig.useMocks) {
      // Mock verification: accept "123456"
      const verified = request.otpCode === '123456';
      const response: VerifyOtpResponse = {
        verified,
        message: verified ? 'OTP verified successfully' : 'Invalid OTP. Please try again.',
        remainingAttempts: verified ? 3 : 2,
        verificationToken: verified ? 'MOCK-VERIFY-TOKEN-' + Date.now() : undefined
      };
      return of(response).pipe(delay(500));
    }

    return this.api.post<VerifyOtpResponse>('/auth/phone/verify-otp', request);
  }

  /**
   * Complete phone login after OTP verification.
   */
  phoneLogin(request: PhoneLoginRequest): Observable<LoginResponse> {
    const iface: UiLanguage = request.interfaceLocale === 'hi' ? 'hi' : 'en';

    if (runtimeConfig.useMocks) {
      const sc = (request.schoolCode ?? '').trim().toUpperCase();
      const row = MOCK_LOGIN_USERS.find(
        u => phonesMatch(u.user.phone, request.phone) && u.schoolCode === sc
      );
      if (!row || !request.verificationToken.startsWith('MOCK-VERIFY')) {
        return throwError(() => new Error('Invalid phone verification or school code')).pipe(delay(400));
      }
      const user = { ...row.user, interfaceLocale: iface };
      const response: LoginResponse = {
        token: 'mock-phone-token-' + Date.now(),
        refreshToken: 'mock-refresh-' + Date.now(),
        user,
      };

      return of(response).pipe(
        delay(600),
        tap(res => {
          this.applyTokenPair(res.token, res.refreshToken);
          localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
          this.persistMockSessionFromNow();
          this.userLocale.useUiLanguage(iface).subscribe({ error: () => void 0 });
        })
      );
    }

    return this.api.post<LoginResponse>('/auth/phone/login', request).pipe(
      tap(res => {
        this.applyTokenPair(res.token, res.refreshToken);
        localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
        const lang: UiLanguage = res.user.interfaceLocale === 'hi' ? 'hi' : 'en';
        this.userLocale.useUiLanguage(lang).subscribe({ error: () => void 0 });
      })
    );
  }

  /**
   * Resend OTP to phone number.
   */
  resendLoginOtp(request: SendOtpRequest): Observable<SendOtpResponse> {
    const sendRequest: SendOtpRequest = {
      phone: request.phone,
      schoolCode: request.schoolCode,
      purpose: request.purpose,
      channel: request.channel
    };
    return this.sendLoginOtp(sendRequest);
  }

  sendPasswordResetOtp(request: SendOtpRequest): Observable<SendOtpResponse> {
    return this.sendLoginOtp({ ...request, purpose: 'PASSWORD_RESET' });
  }

  verifyPasswordResetOtp(request: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.verifyLoginOtp({ ...request, purpose: 'PASSWORD_RESET' });
  }

  resetPassword(request: PasswordResetRequest): Observable<PasswordResetResponse> {
    if (runtimeConfig.useMocks) {
      const row = this.findMockUserByPhoneAndSchool(request.phone, request.schoolCode);
      if (!row || !request.verificationToken.startsWith('MOCK-VERIFY')) {
        return throwError(() => new Error('Invalid reset verification')).pipe(delay(400));
      }
      localStorage.setItem(this.mockPasswordOverrideKey(row.schoolCode, row.user.id), request.newPassword);
      return of({ success: true, message: 'Password reset successfully' }).pipe(delay(700));
    }
    return this.api.post<PasswordResetResponse>('/auth/phone/reset-password', request);
  }
}
