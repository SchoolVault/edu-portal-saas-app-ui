import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { Subject, merge, of } from 'rxjs';
import { debounceTime, filter, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommunicationService } from '../../core/services/communication.service';
import { PlatformHealthService } from '../../core/services/platform-health.service';
import { AppNotification, AnnouncementPreview, ProfileSummary } from '../../core/models/models';
import { ThemeService } from '../../core/services/theme.service';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="app-header" data-testid="app-header-bar">
      <div class="header-left">
        <button class="toggle-btn" (click)="toggleSidebar.emit()" data-testid="sidebar-toggle-btn">
          <i class="bi" [ngClass]="collapsed ? 'bi-list' : 'bi-text-indent-left'" style="font-size: 20px;"></i>
        </button>
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
      <div class="header-right">
        <div style="position: relative;">
          <button class="notification-btn" (click)="toggleTheme()" [attr.aria-label]="'Switch to ' + (currentTheme === 'light' ? 'dark' : 'light') + ' mode'">
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
              <h4>Alerts & notices</h4>
              <button class="btn-icon btn-xs" (click)="markAllRead()" data-testid="mark-all-read-btn">
                <i class="bi bi-check2-all"></i>
              </button>
            </div>
            <div class="notification-list">
              <div *ngIf="isSuperAdmin && platformHealthItems.length" class="notification-section-label">Platform status</div>
              <a
                *ngIf="isSuperAdmin"
                routerLink="/app/platform-health"
                class="notification-see-all"
                (click)="showNotifications = false"
                style="margin-bottom: 8px; display: block;">
                Open system health →
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
                <p>{{ h.detail || '—' }}</p>
              </div>

              <div *ngIf="!isSuperAdmin && announcementPreviews.length" class="notification-section-label">School notices</div>
              <div *ngFor="let ann of announcementPreviews"
                   class="notification-item notification-item-announcement"
                   (click)="openAnnouncementFromBell(ann, $event)"
                   [attr.data-testid]="'header-notice-' + ann.id">
                <h5>
                  <i class="bi bi-megaphone-fill" style="margin-right: 6px; color: var(--clr-primary);"></i>
                  {{ ann.title }}
                </h5>
                <p>{{ ann.preview }}</p>
                <div class="time">{{ getTimeAgo(ann.createdAt || '') }}</div>
              </div>
              <a *ngIf="!isSuperAdmin && announcementPreviews.length" routerLink="/app/inbox" class="notification-see-all" (click)="showNotifications = false">All announcements →</a>

              <div *ngIf="notifications.length && isSuperAdmin" class="notification-section-label">Platform alerts</div>
              <div *ngIf="notifications.length && !isSuperAdmin" class="notification-section-label">Your notifications</div>
              <div *ngFor="let n of notifications"
                   class="notification-item"
                   [class.unread]="!n.read"
                   (click)="openNotificationDetail(n, $event)"
                   [attr.data-testid]="'notification-' + n.id">
                <h5>
                  <i class="bi" [ngClass]="getNotifIcon(n.type)" style="margin-right: 6px;"
                     [style.color]="getNotifColor(n.type)"></i>
                  {{ n.title }}
                </h5>
                <p>{{ n.message }}</p>
                <div class="time">{{ getTimeAgo(n.createdAt) }}</div>
              </div>
              <div
                *ngIf="notificationDropdownEmpty"
                class="empty-state"
                style="padding: 24px;">
                <p>No notifications</p>
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
              <div class="profile-role">{{ roleDisplayLabel }}</div>
            </div>
            <i class="bi bi-chevron-down" style="font-size: 12px; color: var(--clr-text-muted);"></i>
          </button>
          <div class="profile-dropdown" *ngIf="showProfile" data-testid="profile-dropdown">
            <div class="profile-summary-card" *ngIf="profileSummary && !isSuperAdmin">
              <div class="profile-summary-school">{{ profileSummary.schoolName }}</div>
              <div class="profile-summary-title">{{ profileSummary.userTitle || userRole }}</div>
              <div class="profile-summary-meta">{{ profileSummary.schoolCode }} · {{ profileSummary.email }}</div>
              <div class="profile-summary-stats">
                <span *ngIf="profileSummary.managedStudentCount">Students {{ profileSummary.managedStudentCount }}</span>
                <span *ngIf="profileSummary.managedTeacherCount">Teachers {{ profileSummary.managedTeacherCount }}</span>
                <span *ngIf="profileSummary.childCount">Children {{ profileSummary.childCount }}</span>
                <span *ngIf="profileSummary.subjectCount">Subjects {{ profileSummary.subjectCount }}</span>
              </div>
            </div>
            <div class="profile-summary-card" *ngIf="profileSummary && isSuperAdmin">
              <div class="profile-summary-school" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--clr-text-muted);">Platform operator</div>
              <div class="profile-summary-title">{{ profileSummary.name }}</div>
              <div class="profile-summary-meta">{{ profileSummary.userTitle || 'Platform super administrator' }}</div>
              <div class="profile-summary-meta mt-1" style="font-size: 12px;">{{ profileSummary.email }}</div>
              <div class="profile-summary-stats mt-2" *ngIf="profileSummary.platformWorkspaceCount != null">
                <span>Active workspaces {{ profileSummary.platformWorkspaceCount }}</span>
              </div>
              <p class="text-muted mb-0 mt-2" style="font-size: 11px; line-height: 1.4;">You are not scoped to a single school tenant. Use Platform settings for your console preferences.</p>
            </div>
            <button class="profile-dropdown-item" data-testid="profile-view-btn" (click)="goToSettings()">
              <i class="bi bi-person"></i> {{ isSuperAdmin ? 'Platform profile' : 'My profile' }}
            </button>
            <button class="profile-dropdown-item" (click)="goToSettings()">
              <i class="bi bi-gear"></i> {{ isSuperAdmin ? 'Platform settings' : 'Settings' }}
            </button>
            <div class="profile-dropdown-divider"></div>
            <button class="profile-dropdown-item danger" (click)="logout()" data-testid="logout-btn">
              <i class="bi bi-box-arrow-right"></i> Logout
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

  pageTitle = 'Dashboard';
  showNotifications = false;
  showProfile = false;
  userName = '';
  userRole = '';
  initials = '';
  unreadCount = 0;
  notifications: AppNotification[] = [];
  announcementPreviews: AnnouncementPreview[] = [];
  isSuperAdmin = false;
  platformHealthItems: { name: string; status: string; detail?: string }[] = [];
  profileSummary: ProfileSummary | null = null;
  currentTheme: 'light' | 'dark' = 'light';

  avatarUrl: string | null = null;

  /** Bell dropdown: nothing to show in the scrollable list (health blocks are separate for super admin). */
  get notificationDropdownEmpty(): boolean {
    if (this.isSuperAdmin) {
      return this.notifications.length === 0 && this.platformHealthItems.length === 0;
    }
    return this.notifications.length === 0 && this.announcementPreviews.length === 0;
  }

  get roleDisplayLabel(): string {
    const r = (this.userRole || '').toLowerCase().replace(/_/g, ' ');
    if (r === 'super admin') return 'Platform super administrator';
    if (r === 'library staff') return 'Library staff';
    return r.replace(/\b\w/g, c => c.toUpperCase()) || this.userRole;
  }

  constructor(
    private authService: AuthService,
    public notificationService: NotificationService,
    private communicationService: CommunicationService,
    private platformHealthService: PlatformHealthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || '';
    this.userRole = user?.role || '';
    this.initials = this.authService.getUserInitials();
    this.isSuperAdmin = (user?.role || '').toLowerCase() === 'super_admin';
    if (this.isSuperAdmin) {
      this.notificationService.usePlatformOperatorFeed();
    }

    this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.unreadCount = notifs.filter(n => !n.read).length;
    });
    if (!runtimeConfig.useMocks) {
      this.notificationService.refreshFromServer().subscribe({ error: () => { /* not logged in or API down */ } });
    }
    this.authService.profileSummary$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      if (!s) return;
      this.profileSummary = s;
      this.userName = s.name || this.userName;
      this.userRole = (s.role as string) || this.userRole;
      const nm = s.name || '';
      this.initials = nm
        .split(/\s+/)
        .filter(Boolean)
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      this.avatarUrl = s.avatar || this.authService.getCurrentUser()?.avatar || this.authService.getStoredAvatarDataUrl() || null;
    });
    this.authService.fetchProfileSummary().subscribe();
    this.themeService.theme$.subscribe(theme => this.currentTheme = theme);

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
            this.announcementPreviews = [];
          },
          error: () => {
            this.platformHealthItems = [];
            this.announcementPreviews = [];
          }
        });
    } else {
      merge(
        of(null),
        this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      )
        .pipe(
          debounceTime(450),
          switchMap(() => this.communicationService.getAnnouncementPreviews()),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (rows: AnnouncementPreview[]) => {
            this.announcementPreviews = (rows || []).map((p: AnnouncementPreview) => ({
              ...p,
              id: String(p.id)
            }));
          },
          error: () => (this.announcementPreviews = [])
        });
    }

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        this.pageTitle = this.getTitleFromUrl(url);
      });

    this.pageTitle = this.getTitleFromUrl(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getTitleFromUrl(url: string): string {
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      students: 'Students',
      teachers: 'Teachers',
      academic: 'Academic',
      attendance: 'Attendance',
      timetable: 'Timetable',
      exams: 'Exams',
      fees: 'Fees',
      chat: 'Messages',
      inbox: 'Announcements',
      communication: 'Announcements',
      leave: 'Leave',
      reports: 'Reports',
      transport: 'Transport',
      library: 'Library',
      hostel: 'Hostel',
      payroll: 'Payroll',
      documents: 'Documents',
      audit: 'Audit Log',
      settings: 'Settings',
      parent: 'Parent portal',
      'super-admin': 'Super admin',
      'platform-health': 'System health',
      'platform-schools': 'School directory',
      'platform-subscriptions': 'Subscription plans',
      'platform-broadcasts': 'Admin broadcasts',
      'platform-settings': 'Platform settings'
    };
    const parts = url.split('/').filter(Boolean);
    const appIdx = parts.indexOf('app');
    const first = appIdx >= 0 ? parts[appIdx + 1] : parts[0];
    if (first === 'announcement') return 'Notice';
    if (first === 'notification') return 'Notification';
    const seg = first || 'dashboard';
    return map[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfile = false;
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
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  goToSettings(): void {
    this.showProfile = false;
    this.router.navigate([this.isSuperAdmin ? '/app/platform-settings' : '/app/settings']);
  }

  openAnnouncementFromBell(ann: AnnouncementPreview, event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = false;
    this.router.navigate(['/app/announcement', ann.id]);
  }

  openNotificationDetail(n: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsRead(n.id);
    this.showNotifications = false;
    if (n.link) {
      if (n.link.startsWith('http://') || n.link.startsWith('https://')) {
        window.open(n.link, '_blank', 'noopener');
        return;
      }
      this.router.navigateByUrl(n.link);
      return;
    }
    this.router.navigate(['/app/notification', n.id]);
  }

  getNotifIcon(type: string): string {
    const icons: Record<string, string> = { info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill', success: 'bi-check-circle-fill', error: 'bi-x-circle-fill' };
    return icons[type] || 'bi-info-circle-fill';
  }

  getNotifColor(type: string): string {
    const colors: Record<string, string> = { info: 'var(--clr-info)', warning: 'var(--clr-warning)', success: 'var(--clr-success)', error: 'var(--clr-danger)' };
    return colors[type] || 'var(--clr-info)';
  }

  getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    return Math.floor(hours / 24) + 'd ago';
  }
}
