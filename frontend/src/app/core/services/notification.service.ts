import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { MOCK_PLATFORM_OPERATOR_NOTIFICATIONS_SEED, MOCK_SCHOOL_NOTIFICATIONS_SEED } from '../mocks/notification.mock-data';
import { AppNotification } from '../models/models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  /** Typical school admin / staff inbox (admissions, fees, class ops). */
  private schoolNotifications: AppNotification[] = MOCK_SCHOOL_NOTIFICATIONS_SEED.map(n => ({ ...n }));

  /** Platform operator — no class-level or enrollment noise. */
  private readonly platformOperatorMocks: AppNotification[] = MOCK_PLATFORM_OPERATOR_NOTIFICATIONS_SEED.map(n => ({ ...n }));

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
      userId: Number(n.userId ?? 0),
      createdAt: n.createdAt ?? new Date().toISOString(),
      link: n.link
    };
  }
}
