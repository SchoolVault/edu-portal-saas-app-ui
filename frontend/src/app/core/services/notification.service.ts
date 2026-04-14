import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { MOCK_PLATFORM_OPERATOR_NOTIFICATIONS_SEED, MOCK_SCHOOL_NOTIFICATIONS_SEED } from '../mocks/notification.mock-data';
import { AppNotification } from '../models/models';
import { ApiService, PageResp } from './api.service';
import { DEFAULT_ERP_PAGE_SIZE, NOTIFICATION_HEADER_PREVIEW_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';
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

  /**
   * Server-backed unread total when {@code runtimeConfig.useMocks} is false (from {@code GET /notifications/unread-count}).
   * With mocks, kept in sync from the in-memory list.
   */
  private unreadInboxSubject = new BehaviorSubject<number>(0);
  readonly unreadInboxTotal$ = this.unreadInboxSubject.asObservable();

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  /** Call after session is known (e.g. from header) so mocks match role. */
  usePlatformOperatorFeed(): void {
    this.notifications = this.platformOperatorMocks.map(n => ({ ...n }));
    this.notificationsSubject.next([...this.notifications]);
    this.syncUnreadFromLoadedNotifications();
  }

  useSchoolNotificationFeed(): void {
    this.notifications = this.schoolNotifications.map(n => ({ ...n }));
    this.notificationsSubject.next([...this.notifications]);
    this.syncUnreadFromLoadedNotifications();
  }

  private syncUnreadFromLoadedNotifications(): void {
    this.unreadInboxSubject.next(this.notifications.filter(n => !n.read).length);
  }

  /**
   * Loads a lightweight inbox preview for the header ({@code /notifications/paged} + {@code /notifications/unread-count}).
   */
  refreshFromServer(): Observable<AppNotification[]> {
    const role = (this.auth.getCurrentUser()?.role || '').toLowerCase();
    if (role === 'super_admin') {
      if (runtimeConfig.useMocks) {
        this.usePlatformOperatorFeed();
        return of(this.notifications);
      }
      return forkJoin({
        page: this.api.getPageParams<any>('/notifications/paged', {
          page: 0,
          size: NOTIFICATION_HEADER_PREVIEW_SIZE,
        }),
        unread: this.api.get<number>('/notifications/unread-count'),
      }).pipe(
        map(({ page, unread }) => {
          const list = (page?.content ?? []).map((n: any) => this.normalizeApi(n));
          return { list, unread: Number(unread ?? 0) };
        }),
        tap(({ list, unread }) => {
          this.notifications = list;
          this.notificationsSubject.next([...list]);
          this.unreadInboxSubject.next(unread);
        }),
        map(({ list }) => list)
      );
    }
    if (runtimeConfig.useMocks) {
      this.useSchoolNotificationFeed();
      return of(this.notifications).pipe(delay(200));
    }
    return forkJoin({
      page: this.api.getPageParams<any>('/notifications/paged', {
        page: 0,
        size: NOTIFICATION_HEADER_PREVIEW_SIZE,
      }),
      unread: this.api.get<number>('/notifications/unread-count'),
    }).pipe(
      map(({ page, unread }) => {
        const list = (page?.content ?? []).map((n: any) => this.normalizeApi(n));
        return { list, unread: Number(unread ?? 0) };
      }),
      tap(({ list, unread }) => {
        this.notifications = list;
        this.notificationsSubject.next([...list]);
        this.unreadInboxSubject.next(unread);
      }),
      map(({ list }) => list)
    );
  }

  /** Optional full list (heavier); prefer paged + unread-count for shell UI. */
  refreshFullListFromServer(): Observable<AppNotification[]> {
    if (runtimeConfig.useMocks) {
      return this.getNotifications();
    }
    return this.api.get<any[]>('/notifications').pipe(
      map(list => (list || []).map(n => this.normalizeApi(n))),
      tap(list => {
        this.notifications = list;
        this.notificationsSubject.next([...list]);
        this.unreadInboxSubject.next(list.filter(n => !n.read).length);
      })
    );
  }

  getById(id: string): AppNotification | undefined {
    return this.notifications.find(x => x.id === id);
  }

  /** Loads one notification for detail view (works when the row is not in the header preview page). */
  getNotificationById(id: string): Observable<AppNotification> {
    if (!id) {
      return throwError(() => new Error('Missing id'));
    }
    if (runtimeConfig.useMocks) {
      const local = this.getById(id);
      return local ? of({ ...local }) : throwError(() => new Error('Notification not found'));
    }
    return this.api.get<any>(`/notifications/${encodeURIComponent(id)}`).pipe(
      map(raw => this.normalizeApi(raw)),
      tap(n => {
        const ix = this.notifications.findIndex(x => x.id === id);
        if (ix === -1) {
          this.notifications = [n, ...this.notifications];
        } else {
          this.notifications = this.notifications.map((x, i) => (i === ix ? n : x));
        }
        this.notificationsSubject.next([...this.notifications]);
      })
    );
  }

  getNotifications(): Observable<AppNotification[]> {
    if (!runtimeConfig.useMocks) {
      return this.refreshFromServer();
    }
    return of(this.notifications).pipe(delay(300));
  }

  getNotificationsPage(page = 0, size = DEFAULT_ERP_PAGE_SIZE): Observable<PageResp<AppNotification>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<any>('/notifications/paged', { page, size }).pipe(
        map(p => ({ ...p, content: p.content.map((n: any) => this.normalizeApi(n)) }))
      );
    }
    return this.getNotifications().pipe(map(list => sliceToPage(list, page, size)));
  }

  getUnreadCount(): number {
    return this.unreadInboxSubject.value;
  }

  markAsRead(id: string): void {
    const n = this.notifications.find(x => x.id === id);
    const wasUnread = !!(n && !n.read);
    if (n) {
      n.read = true;
      this.notificationsSubject.next([...this.notifications]);
    }
    if (!runtimeConfig.useMocks) {
      if (wasUnread) {
        this.unreadInboxSubject.next(Math.max(0, this.unreadInboxSubject.value - 1));
      }
      this.api.put<void>(`/notifications/${encodeURIComponent(id)}/read`, {}).subscribe({
        error: () => this.refreshFromServer().subscribe(),
      });
    } else {
      this.syncUnreadFromLoadedNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => {
      n.read = true;
    });
    this.notificationsSubject.next([...this.notifications]);
    if (!runtimeConfig.useMocks) {
      this.unreadInboxSubject.next(0);
      this.api.put<void>('/notifications/read-all', {}).subscribe({
        error: () => this.refreshFromServer().subscribe(),
      });
    } else {
      this.syncUnreadFromLoadedNotifications();
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
      link: n.link,
    };
  }
}
