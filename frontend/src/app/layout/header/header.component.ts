import { ChangeDetectorRef, Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { Subject, merge, of } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { BellReadStateService } from '../../core/services/bell-read-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommunicationService } from '../../core/services/communication.service';
import { PlatformHealthService } from '../../core/services/platform-health.service';
import { AppNotification, AnnouncementPreview, ProfileSummary } from '../../core/models/models';
import {
  formatHomeroomClassSectionLabel,
  pickPrimaryHomeroomAssignment,
} from '../../core/profile/teacher-header-homeroom.util';
import { ThemeService } from '../../core/services/theme.service';
import { TenantModuleGateService } from '../../core/services/tenant-module-gate.service';
import { runtimeConfig } from '../../core/config/runtime-config';
import { notificationListRowNavigation } from '../../core/utils/notification-link.util';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <header class="app-header" data-testid="app-header-bar">
      <div class="header-left">
        <button class="toggle-btn" (click)="toggleSidebar.emit()" data-testid="sidebar-toggle-btn">
          <i class="bi" [ngClass]="collapsed ? 'bi-list' : 'bi-text-indent-left'" style="font-size: 20px;"></i>
        </button>
        <h1 class="page-title">{{ pageTitleKey | translate }}</h1>
      </div>
      <div class="header-right">
        <div style="position: relative;">
          <button
            class="notification-btn"
            (click)="toggleTheme()"
            [attr.aria-label]="themeAriaLabel">
            <i class="bi" [ngClass]="currentTheme === 'light' ? 'bi-moon-stars' : 'bi-sun' " style="font-size: 20px;"></i>
          </button>
        </div>
        <div style="position: relative;">
          <button class="notification-btn" (click)="toggleNotifications()" data-testid="notifications-btn">
            <i class="bi bi-bell" style="font-size: 20px;"></i>
            <span class="notification-badge" *ngIf="unreadCount > 0"></span>
          </button>
          <div class="notification-dropdown" *ngIf="showNotifications" data-testid="notification-dropdown">
            <div class="notification-dropdown-header">
              <h4>{{ 'header.bell.title' | translate }}</h4>
              <button class="btn-icon btn-xs" (click)="markAllRead()" data-testid="mark-all-read-btn">
                <i class="bi bi-check2-all"></i>
              </button>
            </div>
            <div class="notification-list">
              <div *ngIf="isSuperAdmin && platformHealthItems.length" class="notification-section-label">
                {{ 'header.bell.platformStatus' | translate }}
              </div>
              <a
                *ngIf="isSuperAdmin"
                routerLink="/app/platform-health"
                class="notification-see-all"
                (click)="showNotifications = false"
                style="margin-bottom: 8px; display: block;">
                {{ 'header.bell.openSystemHealth' | translate }}
              </a>
              <div
                *ngFor="let h of platformHealthItems"
                class="notification-item"
                [attr.data-testid]="'header-health-' + h.name">
                <h5>
                  <i class="bi bi-activity" style="margin-right: 6px; color: var(--clr-info);"></i>
                  {{ h.name }}
                  <span class="badge-erp badge-neutral ms-1" style="font-size: 10px;">{{ h.status }}</span>
                </h5>
                <p>{{ h.detail || ('header.bell.emptyDetail' | translate) }}</p>
              </div>

              <div *ngIf="!isSuperAdmin && schoolNoticePreviews.length" class="notification-section-label">
                {{ 'header.bell.schoolNotices' | translate }}
              </div>
              <div
                *ngFor="let ann of schoolNoticePreviews"
                class="notification-item notification-item-announcement has-read-status-dot"
                [class.is-unread]="bellReadState.isAnnouncementUnread(ann.id)"
                [class.is-read]="!bellReadState.isAnnouncementUnread(ann.id)"
                (click)="openAnnouncementFromBell(ann, $event)"
                [attr.data-testid]="'header-notice-' + ann.id">
                <h5>
                  <i class="bi bi-megaphone-fill" style="margin-right: 6px; color: var(--clr-primary);"></i>
                  {{ ann.title }}
                </h5>
                <p class="small text-muted mb-1" *ngIf="announcementScopeSubtitle(ann) as scope">
                  {{ scope }}
                </p>
                <p>{{ ann.preview }}</p>
                <div class="time">{{ timeAgo(ann.createdAt || '') }}</div>
              </div>
              <a *ngIf="!isSuperAdmin && schoolNoticePreviews.length" routerLink="/app/inbox" class="notification-see-all" (click)="showNotifications = false">
                {{ 'header.bell.allAnnouncements' | translate }}
              </a>

              <div *ngIf="notifications.length && isSuperAdmin" class="notification-section-label">
                {{ 'header.bell.platformAlerts' | translate }}
              </div>
              <div *ngIf="notifications.length && !isSuperAdmin" class="notification-section-label">
                {{ 'header.bell.yourNotifications' | translate }}
              </div>
              <div
                *ngFor="let n of notifications"
                class="notification-item has-read-status-dot"
                [class.is-unread]="!n.read"
                [class.is-read]="n.read"
                (click)="openNotificationDetail(n, $event)"
                [attr.data-testid]="'notification-' + n.id">
                <h5>
                  <i class="bi" [ngClass]="getNotifIcon(n.type)" style="margin-right: 6px;"
                     [style.color]="getNotifColor(n.type)"></i>
                  {{ n.title }}
                </h5>
                <p>{{ n.message }}</p>
                <div class="time">{{ timeAgo(n.createdAt) }}</div>
              </div>
              <div
                *ngIf="notificationDropdownEmpty"
                class="empty-state"
                style="padding: 24px;">
                <p>{{ 'header.bell.none' | translate }}</p>
              </div>
            </div>
          </div>
        </div>
        <div style="position: relative;">
          <button class="profile-btn" (click)="toggleProfile()" data-testid="profile-btn">
            <div class="profile-avatar" *ngIf="!avatarUrl">{{ initials }}</div>
            <img *ngIf="avatarUrl" [src]="avatarUrl" alt="" class="profile-avatar profile-avatar-img" />
            <div class="profile-info">
              <div class="profile-name">{{ userName }}</div>
              <div class="profile-role">{{ roleDisplayLabelKey | translate }}</div>
            </div>
            <i class="bi bi-chevron-down" style="font-size: 12px; color: var(--clr-text-muted);"></i>
          </button>
          <div class="profile-dropdown" *ngIf="showProfile" data-testid="profile-dropdown">
            <div class="profile-summary-card" *ngIf="profileSummary && !isSuperAdmin">
              <div class="profile-summary-school">{{ profileSummary.schoolName }}</div>
              <div class="profile-summary-title">{{ profileSummary.userTitle || (roleDisplayLabelKey | translate) }}</div>
              <div class="profile-summary-meta profile-summary-meta-row" [attr.title]="profileSummary.schoolCode + ' · ' + profileSummary.email">
                <span class="profile-summary-code">{{ profileSummary.schoolCode }}</span>
                <span class="profile-summary-sep" aria-hidden="true">·</span>
                <span class="profile-summary-email">{{ profileSummary.email }}</span>
              </div>
              <div class="profile-summary-stats">
                <span *ngFor="let chip of profileStatChipRows">
                  {{ chip.translateKey | translate: chip.params }}
                </span>
              </div>
            </div>
            <div class="profile-summary-card" *ngIf="profileSummary && isSuperAdmin">
              <div class="profile-summary-school" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--clr-text-muted);">
                {{ 'header.super.platformOperator' | translate }}
              </div>
              <div class="profile-summary-title">{{ profileSummary.name }}</div>
              <div class="profile-summary-meta">
                {{ profileSummary.userTitle || ('header.super.defaultTitle' | translate) }}
              </div>
              <div class="profile-summary-meta profile-summary-email-block mt-1" style="font-size: 12px;" [attr.title]="profileSummary.email">
                {{ profileSummary.email }}
              </div>
              <div class="profile-summary-stats mt-2" *ngIf="profileSummary.platformWorkspaceCount != null">
                <span>{{ 'header.super.activeWorkspaces' | translate: { count: profileSummary.platformWorkspaceCount } }}</span>
              </div>
              <p class="text-muted mb-0 mt-2" style="font-size: 11px; line-height: 1.4;">
                {{ 'header.super.scopedHint' | translate }}
              </p>
            </div>
            <button class="profile-dropdown-item" data-testid="profile-view-btn" (click)="goToMyAccountProfile()">
              <i class="bi bi-person"></i>
              {{ (isSuperAdmin ? 'header.menu.platformProfile' : 'header.menu.myProfile') | translate }}
            </button>
            <button class="profile-dropdown-item" (click)="goToPreferencesOnly()">
              <i class="bi bi-gear"></i>
              {{ (isSuperAdmin ? 'header.menu.platformSettings' : 'header.menu.settings') | translate }}
            </button>
            <div class="profile-dropdown-divider"></div>
            <button class="profile-dropdown-item danger" (click)="logout()" data-testid="logout-btn">
              <i class="bi bi-box-arrow-right"></i> {{ 'header.menu.logout' | translate }}
            </button>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly destroy$ = new Subject<void>();

  pageTitleKey = 'header.title.dashboard';
  showNotifications = false;
  showProfile = false;
  userName = '';
  userRole = '';
  initials = '';
  unreadCount = 0;
  /** Server unread total (notifications only); combined with local announcement read state in {@link #recomputeUnreadBadge}. */
  private serverUnreadNotifications = 0;
  notifications: AppNotification[] = [];
  /** School-wide bulletin previews (ALL audience) — parents no longer see targeted notices duplicated here. */
  schoolNoticePreviews: AnnouncementPreview[] = [];
  isSuperAdmin = false;
  platformHealthItems: { name: string; status: string; detail?: string }[] = [];
  profileSummary: ProfileSummary | null = null;
  profileStatChipRows: Array<{ translateKey: string; params: Record<string, string | number> }> = [];
  currentTheme: 'light' | 'dark' = 'light';

  avatarUrl: string | null = null;

  get themeAriaLabel(): string {
    return this.translate.instant(
      this.currentTheme === 'light' ? 'header.theme.switchDark' : 'header.theme.switchLight'
    );
  }

  /** ngx-translate key for the subtitle under the user name. */
  get roleDisplayLabelKey(): string {
    let r = (this.userRole || '').toLowerCase().trim();
    if (r.startsWith('role_')) {
      r = r.slice(5);
    }
    const map: Record<string, string> = {
      admin: 'header.role.admin',
      super_admin: 'header.role.superAdmin',
      teacher: 'header.role.teacher',
      parent: 'header.role.parent',
      student: 'header.role.student',
      library_staff: 'header.role.libraryStaff',
      school_staff: 'header.role.schoolStaff',
    };
    return map[r] || 'header.role.user';
  }

  get notificationDropdownEmpty(): boolean {
    if (this.isSuperAdmin) {
      return this.notifications.length === 0 && this.platformHealthItems.length === 0;
    }
    return this.notifications.length === 0 && this.schoolNoticePreviews.length === 0;
  }

  /** Role-aware KPI chips for the profile card (parents never see student/teacher/subject admin stats). */
  private buildProfileStatChips(): Array<{ translateKey: string; params: Record<string, string | number> }> {
    const s = this.profileSummary;
    if (!s || this.isSuperAdmin) {
      return [];
    }
    const role = (this.userRole || '').toLowerCase().replace(/^role_/, '');
    if (role === 'parent') {
      if (s.childCount == null) {
        return [];
      }
      return [{ translateKey: 'header.stats.children', params: { count: Number(s.childCount) } }];
    }
    if (role === 'admin') {
      const out: Array<{ translateKey: string; params: Record<string, string | number> }> = [];
      if (s.managedStudentCount != null) {
        out.push({ translateKey: 'header.stats.students', params: { count: Number(s.managedStudentCount) } });
      }
      if (s.managedTeacherCount != null) {
        out.push({ translateKey: 'header.stats.teachers', params: { count: Number(s.managedTeacherCount) } });
      }
      if (s.managedStaffCount != null && Number(s.managedStaffCount) > 0) {
        out.push({ translateKey: 'header.stats.staff', params: { count: Number(s.managedStaffCount) } });
      }
      return out;
    }
    if (role === 'teacher') {
      const homeroom = pickPrimaryHomeroomAssignment(s.classTeacherOf);
      const out: Array<{ translateKey: string; params: Record<string, string | number> }> = [];
      if (homeroom && homeroom.totalStudents != null) {
        out.push({
          translateKey: 'header.stats.homeroomStudentCount',
          params: { count: Number(homeroom.totalStudents) },
        });
      }
      const classSectionLabel = homeroom ? formatHomeroomClassSectionLabel(homeroom) : '';
      if (classSectionLabel) {
        out.push({
          translateKey: 'header.stats.classTeacherHomeroom',
          params: { label: classSectionLabel },
        });
      }
      const primarySubject = (s.primaryTeachingSubject ?? '').trim();
      if (primarySubject) {
        out.push({
          translateKey: 'header.stats.primaryTeachingSubjectChip',
          params: { subject: primarySubject },
        });
      }
      return out;
    }
    if (s.childCount != null) {
      return [{ translateKey: 'header.stats.children', params: { count: Number(s.childCount) } }];
    }
    return [];
  }

  private rebuildProfileStatChips(): void {
    this.profileStatChipRows = this.buildProfileStatChips();
  }

  constructor(
    private authService: AuthService,
    public notificationService: NotificationService,
    readonly bellReadState: BellReadStateService,
    private communicationService: CommunicationService,
    private platformHealthService: PlatformHealthService,
    private router: Router,
    private themeService: ThemeService,
    private moduleGate: TenantModuleGateService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || '';
    this.userRole = user?.role || '';
    this.initials = this.authService.getUserInitials();
    this.isSuperAdmin = (user?.role || '').toLowerCase() === 'super_admin';
    if (this.isSuperAdmin) {
      this.notificationService.usePlatformOperatorFeed();
      this.themeService.applyStoredConsolePaletteIfSuperAdmin();
    }

    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(notifs => {
      this.notifications = [...(notifs || [])].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      this.recomputeUnreadBadge();
    });
    this.notificationService.unreadInboxTotal$.pipe(takeUntil(this.destroy$)).subscribe(total => {
      this.serverUnreadNotifications = Number(total ?? 0);
      this.recomputeUnreadBadge();
    });
    this.bellReadState.changed$.pipe(takeUntil(this.destroy$)).subscribe(() => this.recomputeUnreadBadge());
    if (!this.isSuperAdmin) {
      this.notificationService.refreshFromServer().subscribe({ error: () => { /* not logged in or API down */ } });
    }
    const syncHeaderIdentity = (): void => {
      const u = this.authService.getCurrentUser();
      const s = this.profileSummary;
      const displayName = s?.name || u?.name || '';
      this.userName = displayName;
      this.userRole = (s?.role as string) || u?.role || this.userRole;
      this.initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      this.avatarUrl = this.authService.resolveCurrentUserAvatarUrl(s?.avatar ?? null);
      this.rebuildProfileStatChips();
    };

    this.authService.profileSummary$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      if (!s) return;
      this.profileSummary = s;
      syncHeaderIdentity();
    });
    this.authService.profileAvatarChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => syncHeaderIdentity());
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(() => syncHeaderIdentity());
    this.authService.fetchProfileSummary().subscribe();
    this.themeService.theme$.subscribe(theme => (this.currentTheme = theme));

    syncHeaderIdentity();

    if (this.isSuperAdmin) {
      merge(of(null), this.router.events.pipe(filter(e => e instanceof NavigationEnd)))
        .pipe(
          debounceTime(450),
          switchMap(() => this.platformHealthService.getSnapshot()),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: snap => {
            this.platformHealthItems = (snap?.components || []).slice(0, 6);
            this.schoolNoticePreviews = [];
            this.recomputeUnreadBadge();
          },
          error: () => {
            this.platformHealthItems = [];
            this.schoolNoticePreviews = [];
            this.recomputeUnreadBadge();
          }
        });
    } else {
      merge(of(null), this.router.events.pipe(filter(e => e instanceof NavigationEnd)))
        .pipe(
          debounceTime(450),
          switchMap(() =>
            this.moduleGate.isModuleEnabled('communication')
              ? this.communicationService.getAnnouncementPreviews()
              : of([] as AnnouncementPreview[])
          ),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (rows: AnnouncementPreview[]) => {
            const normalized = (rows || [])
              .map((p: AnnouncementPreview) => ({
                ...p,
                id: String(p.id),
              }))
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
              );
            this.applySchoolNoticePreviewsForRole(normalized);
            this.recomputeUnreadBadge();
          },
          error: () => (this.schoolNoticePreviews = [])
        });
    }

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        this.pageTitleKey = this.getTitleKeyFromUrl(url);
      });

    this.pageTitleKey = this.getTitleKeyFromUrl(this.router.url);

    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
    this.recomputeUnreadBadge();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getTitleKeyFromUrl(url: string): string {
    const pathOnly = url.split(/[?#]/)[0];
    const tree = this.router.parseUrl(url);
    const settingsTab = String(tree.queryParams['settingsTab'] || '')
      .trim()
      .toLowerCase();
    const onboardFlow = String(tree.queryParams['onboard'] || '')
      .trim()
      .toLowerCase();

    const map: Record<string, string> = {
      dashboard: 'header.title.dashboard',
      students: 'header.title.students',
      teachers: 'header.title.teachers',
      academic: 'header.title.academic',
      attendance: 'header.title.attendance',
      timetable: 'header.title.timetable',
      exams: 'header.title.exams',
      fees: 'header.title.fees',
      chat: 'header.title.messages',
      inbox: 'header.title.announcements',
      communication: 'header.title.announcements',
      leave: 'header.title.leave',
      reports: 'header.title.reports',
      directory: 'header.title.directory',
      staff: 'header.title.staff',
      operations: 'header.title.operationsHub',
      transport: 'header.title.transport',
      library: 'header.title.library',
      hostel: 'header.title.hostel',
      payroll: 'header.title.payroll',
      documents: 'header.title.documents',
      audit: 'header.title.auditLog',
      settings: 'header.title.settings',
      parent: 'header.title.parentPortal',
      'super-admin': 'header.title.superAdmin',
      'platform-health': 'header.title.systemHealth',
      'platform-schools': 'header.title.schoolDirectory',
      'platform-feature-rollout': 'header.title.featureRollout',
      'platform-subscriptions': 'header.title.subscriptionPlans',
      'platform-broadcasts': 'header.title.adminBroadcasts',
      'platform-settings': 'header.title.platformSettings',
      'import-export': 'header.title.importExport',
      'school-onboarding': 'header.title.schoolOnboarding',
    };
    const parts = pathOnly.split('/').filter(Boolean);
    const appIdx = parts.indexOf('app');
    const rawFirst = appIdx >= 0 ? parts[appIdx + 1] : parts[0];
    const first = (rawFirst || '').split('?')[0];
    if (first === 'announcement') return 'header.title.notice';
    if (first === 'notification' || first === 'notifications') return 'header.title.notificationDetail';
    const seg = first || 'dashboard';
    if (seg === 'platform-schools' && (onboardFlow === '1' || onboardFlow === 'true' || onboardFlow === 'yes')) {
      return 'header.title.schoolOnboarding';
    }
    if (seg === 'settings') {
      if (settingsTab === 'finance') {
        return 'header.title.settingsFinance';
      }
      if (settingsTab === 'preferences') {
        return 'header.title.preferences';
      }
      if (settingsTab === 'profile') {
        return 'header.title.myAccountProfile';
      }
    }
    return map[seg] || 'header.title.fallback';
  }

  timeAgo(dateStr: string): string {
    const t = new Date(dateStr).getTime();
    if (!dateStr || Number.isNaN(t)) {
      return this.translate.instant('header.time.unknown');
    }
    const diff = Date.now() - t;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) {
      return this.translate.instant('header.time.minutesAgo', { n: Math.max(0, mins) });
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return this.translate.instant('header.time.hoursAgo', { n: hours });
    }
    return this.translate.instant('header.time.daysAgo', { n: Math.floor(hours / 24) });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfile = false;
    if (this.showNotifications && !this.isSuperAdmin) {
      this.notificationService.refreshFromServer().subscribe({ error: () => {} });
    }
  }

  toggleProfile(): void {
    this.showProfile = !this.showProfile;
    this.showNotifications = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.showNotifications && !target.closest('.notification-btn') && !target.closest('.notification-dropdown')) {
      this.showNotifications = false;
    }
    if (this.showProfile && !target.closest('.profile-btn') && !target.closest('.profile-dropdown')) {
      this.showProfile = false;
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
    this.bellReadState.markAnnouncementsRead(this.schoolNoticePreviews.map(p => p.id));
    this.recomputeUnreadBadge();
  }

  private recomputeUnreadBadge(): void {
    if (this.isSuperAdmin) {
      if (runtimeConfig.useMocks) {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      } else {
        this.unreadCount = this.serverUnreadNotifications;
      }
      return;
    }
    const annUnread = this.schoolNoticePreviews.filter(p => this.bellReadState.isAnnouncementUnread(p.id)).length;
    if (runtimeConfig.useMocks) {
      const nu = this.notifications.filter(n => !n.read).length;
      this.unreadCount = nu + annUnread;
    } else {
      this.unreadCount = this.serverUnreadNotifications + annUnread;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  goToMyAccountProfile(): void {
    this.showProfile = false;
    if (this.isSuperAdmin) {
      this.router.navigate(['/app/platform-settings']);
      return;
    }
    this.router.navigate(['/app/settings'], { queryParams: { settingsTab: 'profile' } });
  }

  goToPreferencesOnly(): void {
    this.showProfile = false;
    if (this.isSuperAdmin) {
      this.router.navigate(['/app/platform-settings']);
      return;
    }
    this.router.navigate(['/app/settings'], { queryParams: { settingsTab: 'preferences' } });
  }

  /** Show the same announcement previews in bell across roles; role visibility is enforced by backend API. */
  private applySchoolNoticePreviewsForRole(rows: AnnouncementPreview[]): void {
    this.schoolNoticePreviews = rows;
  }

  openAnnouncementFromBell(ann: AnnouncementPreview, event: MouseEvent): void {
    event.stopPropagation();
    this.bellReadState.markAnnouncementRead(ann.id);
    this.showNotifications = false;
    this.router.navigate(['/app/announcement', ann.id]);
  }

  openNotificationDetail(n: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsRead(n.id);
    this.showNotifications = false;
    const target = notificationListRowNavigation(n.link, n.id);
    if (target.kind === 'announcement') {
      void this.router.navigate(['/app/announcement', target.id]);
      return;
    }
    void this.router.navigate(['/app/notifications', target.id]);
  }

  announcementScopeSubtitle(ann: AnnouncementPreview): string {
    const aud = String(ann.targetAudience || '').toLowerCase();
    if (aud !== 'class' && aud !== 'section') {
      return '';
    }
    const classNameRaw = String(ann.targetClassName || '').trim();
    const className = classNameRaw.replace(/^class\s+/i, '').trim();
    if (!className) {
      return '';
    }
    const sectionName = String(ann.targetSectionName || '').trim();
    if (aud === 'section' && sectionName) {
      return this.translate.instant('header.bell.scopeClassSection', { className, sectionName });
    }
    return this.translate.instant('header.bell.scopeClassOnly', { className });
  }

  getNotifIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill'
    };
    return icons[type] || 'bi-info-circle-fill';
  }

  getNotifColor(type: string): string {
    const colors: Record<string, string> = {
      info: 'var(--clr-info)',
      warning: 'var(--clr-warning)',
      success: 'var(--clr-success)',
      error: 'var(--clr-danger)'
    };
    return colors[type] || 'var(--clr-info)';
  }
}
