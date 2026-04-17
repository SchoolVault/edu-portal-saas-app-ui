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
    this.sortNotificationsNewestFirst();
    this.notificationsSubject.next([...this.notifications]);
    this.syncUnreadFromLoadedNotifications();
  }

  useSchoolNotificationFeed(): void {
    this.notifications = this.schoolNotifications.map(n => ({ ...n }));
    this.sortNotificationsNewestFirst();
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
          this.sortNotificationsNewestFirst();
          this.notificationsSubject.next([...this.notifications]);
          this.unreadInboxSubject.next(unread);
        }),
        map(({ list }) => list)
      );
    }
    if (runtimeConfig.useMocks) {
      this.useSchoolNotificationFeed();
      this.sortNotificationsNewestFirst();
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
        this.sortNotificationsNewestFirst();
        this.notificationsSubject.next([...this.notifications]);
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
        this.sortNotificationsNewestFirst();
        this.notificationsSubject.next([...this.notifications]);
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

  private sortNotificationsNewestFirst(): void {
    this.notifications.sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
  }

  private normalizeApi(n: any): AppNotification {
    const t = String(n.type ?? 'INFO').toLowerCase();
    const type: AppNotification['type'] =
      t === 'warning' ? 'warning' : t === 'success' ? 'success' : t === 'error' ? 'error' : 'info';
    const linkRaw = n.link ?? n.deepLink ?? n.actionUrl ?? n.href ?? n.targetUrl;
    const senderLabel = NotificationService.pickSenderLabel(n);
    return {
      id: String(n.id),
      title: n.title ?? '',
      message: n.message ?? '',
      type,
      read: !!n.isRead || !!n.read,
      userId: Number(n.userId ?? 0),
      createdAt: NotificationService.coerceCreatedAtIso(n),
      link: typeof linkRaw === 'string' ? linkRaw : linkRaw != null ? String(linkRaw) : undefined,
      ...(senderLabel ? { senderLabel } : {}),
    };
  }

  private static pickSenderLabel(n: Record<string, unknown>): string | undefined {
    const nameKeys = ['senderName', 'sender', 'author', 'actorName', 'createdByName', 'originLabel', 'source'] as const;
    for (const k of nameKeys) {
      const v = n[k];
      if (typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
    const roleKeys = ['senderRole', 'actorRole', 'authorRole', 'originRole'] as const;
    for (const k of roleKeys) {
      const v = n[k];
      if (typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
    return undefined;
  }

  /** Accepts ISO strings or Jackson {@code LocalDateTime} array shapes — never fabricates “now” for missing data. */
  private static coerceCreatedAtIso(n: Record<string, unknown>): string {
    const raw = n['createdAt'] ?? n['created_at'];
    const s = NotificationService.stringifyTemporal(raw);
    return s || '';
  }

  private static stringifyTemporal(raw: unknown): string {
    if (raw == null) {
      return '';
    }
    if (typeof raw === 'string' && raw.length) {
      return raw;
    }
    if (Array.isArray(raw) && raw.length >= 3) {
      const y = Number(raw[0]);
      const mo = Number(raw[1]);
      const d = Number(raw[2]);
      const h = raw.length > 3 ? Number(raw[3]) : 0;
      const mi = raw.length > 4 ? Number(raw[4]) : 0;
      const sec = raw.length > 5 ? Number(raw[5]) : 0;
      if (![y, mo, d].every(x => Number.isFinite(x))) {
        return '';
      }
      const dt = new Date(y, mo - 1, d, h, mi, sec);
      return Number.isNaN(dt.getTime()) ? '' : dt.toISOString();
    }
    return '';
  }
}
