import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
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
          <button class="notification-btn" (click)="toggleNotifications()" data-testid="notifications-btn">
            <i class="bi bi-bell" style="font-size: 20px;"></i>
            <span class="notification-badge" *ngIf="unreadCount > 0"></span>
          </button>
          <div class="notification-dropdown" *ngIf="showNotifications" data-testid="notification-dropdown">
            <div class="notification-dropdown-header">
              <h4>Notifications</h4>
              <button class="btn-icon btn-xs" (click)="markAllRead()" data-testid="mark-all-read-btn">
                <i class="bi bi-check2-all"></i>
              </button>
            </div>
            <div class="notification-list">
              <div *ngFor="let n of notifications"
                   class="notification-item"
                   [class.unread]="!n.read"
                   (click)="notificationService.markAsRead(n.id)"
                   [attr.data-testid]="'notification-' + n.id">
                <h5>
                  <i class="bi" [ngClass]="getNotifIcon(n.type)" style="margin-right: 6px;"
                     [style.color]="getNotifColor(n.type)"></i>
                  {{ n.title }}
                </h5>
                <p>{{ n.message }}</p>
                <div class="time">{{ getTimeAgo(n.createdAt) }}</div>
              </div>
              <div *ngIf="notifications.length === 0" class="empty-state" style="padding: 24px;">
                <p>No notifications</p>
              </div>
            </div>
          </div>
        </div>
        <div style="position: relative;">
          <button class="profile-btn" (click)="toggleProfile()" data-testid="profile-btn">
            <div class="profile-avatar">{{ initials }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ userName }}</div>
              <div class="profile-role">{{ userRole }}</div>
            </div>
            <i class="bi bi-chevron-down" style="font-size: 12px; color: var(--clr-text-muted);"></i>
          </button>
          <div class="profile-dropdown" *ngIf="showProfile" data-testid="profile-dropdown">
            <button class="profile-dropdown-item" data-testid="profile-view-btn">
              <i class="bi bi-person"></i> My Profile
            </button>
            <button class="profile-dropdown-item">
              <i class="bi bi-gear"></i> Settings
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
export class HeaderComponent implements OnInit {
  @Input() collapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  pageTitle = 'Dashboard';
  showNotifications = false;
  showProfile = false;
  userName = '';
  userRole = '';
  initials = '';
  unreadCount = 0;
  notifications: AppNotification[] = [];

  constructor(
    private authService: AuthService,
    public notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || '';
    this.userRole = user?.role || '';
    this.initials = this.authService.getUserInitials();

    this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.unreadCount = notifs.filter(n => !n.read).length;
    });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.pageTitle = this.getTitleFromUrl(url);
    });

    this.pageTitle = this.getTitleFromUrl(this.router.url);
  }

  private getTitleFromUrl(url: string): string {
    const map: Record<string, string> = {
      'dashboard': 'Dashboard', 'students': 'Students', 'teachers': 'Teachers',
      'academic': 'Academic', 'attendance': 'Attendance', 'timetable': 'Timetable',
      'exams': 'Exams', 'fees': 'Fees', 'communication': 'Communication',
      'reports': 'Reports', 'transport': 'Transport', 'library': 'Library',
      'hostel': 'Hostel', 'payroll': 'Payroll', 'documents': 'Documents',
      'audit': 'Audit Log', 'settings': 'Settings',
    };
    const segment = url.split('/').pop() || 'dashboard';
    return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
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
