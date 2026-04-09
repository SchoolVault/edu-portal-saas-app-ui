import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { AppNotification } from '../models/models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** Typical school admin / staff inbox (admissions, fees, class ops). */
  private schoolNotifications: AppNotification[] = [
    { id: 'n1', title: 'New Admission', message: 'Arjun Patel has been admitted to Class 5-A', type: 'success', read: false, userId: 'u1', createdAt: '2026-02-05T10:30:00Z' },
    { id: 'n2', title: 'Fee Payment Received', message: 'Fee payment received from Emily Watson', type: 'info', read: false, userId: 'u1', createdAt: '2026-02-05T09:15:00Z' },
    { id: 'n3', title: 'Exam Schedule Updated', message: 'Midterm exam schedule has been updated for Class 8', type: 'warning', read: false, userId: 'u1', createdAt: '2026-02-04T16:45:00Z' },
    { id: 'n4', title: 'Attendance Alert', message: 'Class 3-B has below 80% attendance today', type: 'error', read: true, userId: 'u1', createdAt: '2026-02-04T11:00:00Z' },
    { id: 'n5', title: 'Parent Meeting', message: 'Parent-teacher meeting scheduled for Feb 15', type: 'info', read: true, userId: 'u1', createdAt: '2026-02-03T14:20:00Z' },
    { id: 'n6', title: 'Library Book Overdue', message: '5 books are overdue from Class 7 students', type: 'warning', read: true, userId: 'u1', createdAt: '2026-02-03T10:00:00Z' },
  ];

  /** Platform operator — no class-level or enrollment noise. */
  private readonly platformOperatorMocks: AppNotification[] = [
    {
      id: 'p1',
      title: 'Billing reconciliation queued',
      message: 'Monthly subscription sync is prepared for all active school workspaces.',
      type: 'info',
      read: false,
      userId: 'sa1',
      createdAt: new Date().toISOString(),
      link: '/app/platform-subscriptions'
    },
    {
      id: 'p2',
      title: 'Platform maintenance window',
      message: 'Reserve 22:00–22:30 UTC for database patching; campuses may see brief read-only mode.',
      type: 'warning',
      read: false,
      userId: 'sa1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      link: '/app/platform-health'
    },
    {
      id: 'p3',
      title: 'New workspace onboarded',
      message: 'Riverdale Public School completed provisioning — review directory and subscription tier.',
      type: 'success',
      read: true,
      userId: 'sa1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      link: '/app/platform-schools'
    }
  ];

  private notifications: AppNotification[] = [...this.schoolNotifications];
  private notificationsSubject = new BehaviorSubject<AppNotification[]>(this.notifications);
  notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  /** Call after session is known (e.g. from header) so mocks match role. */
  usePlatformOperatorFeed(): void {
    this.notifications = this.platformOperatorMocks.map(n => ({ ...n }));
    this.notificationsSubject.next([...this.notifications]);
  }

  useSchoolNotificationFeed(): void {
    this.notifications = this.schoolNotifications.map(n => ({ ...n }));
    this.notificationsSubject.next([...this.notifications]);
  }

  refreshFromServer(): Observable<AppNotification[]> {
    const role = (this.auth.getCurrentUser()?.role || '').toLowerCase();
    if (role === 'super_admin') {
      if (runtimeConfig.useMocks) {
        this.usePlatformOperatorFeed();
        return of(this.notifications);
      }
      return this.api.get<any[]>('/notifications').pipe(
        map(list => (list || []).map(n => this.normalizeApi(n))),
        tap(list => {
          this.notifications = list;
          this.notificationsSubject.next([...list]);
        })
      );
    }
    if (runtimeConfig.useMocks) {
      this.useSchoolNotificationFeed();
      return of(this.notifications).pipe(delay(200));
    }
    return this.api.get<any[]>('/notifications').pipe(
      map(list => list.map(n => this.normalizeApi(n))),
      tap(list => {
        this.notifications = list;
        this.notificationsSubject.next([...list]);
      })
    );
  }

  getById(id: string): AppNotification | undefined {
    return this.notifications.find(x => x.id === id);
  }

  getNotifications(): Observable<AppNotification[]> {
    if (!runtimeConfig.useMocks) {
      return this.refreshFromServer();
    }
    return of(this.notifications).pipe(delay(300));
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id: string): void {
    const n = this.notifications.find(x => x.id === id);
    if (n) {
      n.read = true;
      this.notificationsSubject.next([...this.notifications]);
    }
    if (!runtimeConfig.useMocks) {
      this.api.put<void>(`/notifications/${id}/read`, {}).subscribe({
        error: () => this.refreshFromServer().subscribe()
      });
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => { n.read = true; });
    this.notificationsSubject.next([...this.notifications]);
    if (!runtimeConfig.useMocks) {
      this.api.put<void>('/notifications/read-all', {}).subscribe({
        error: () => this.refreshFromServer().subscribe()
      });
    }
  }

  private normalizeApi(n: any): AppNotification {
    const t = String(n.type ?? 'INFO').toLowerCase();
    const type: AppNotification['type'] =
      t === 'warning' ? 'warning' : t === 'success' ? 'success' : t === 'error' ? 'error' : 'info';
    return {
      id: String(n.id),
      title: n.title ?? '',
      message: n.message ?? '',
      type,
      read: !!n.isRead || !!n.read,
      userId: String(n.userId ?? ''),
      createdAt: n.createdAt ?? new Date().toISOString(),
      link: n.link
    };
  }
}
