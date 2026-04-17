import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Announcement, AppNotification, InboxUnifiedItem } from '../models/models';
import { DEFAULT_INBOX_FILTER_STATE, InboxFilterState } from '../models/inbox-filter.model';
import { ApiService, PageResp } from './api.service';
import { AuthService } from './auth.service';
import { CommunicationService } from './communication.service';
import { NotificationService } from './notification.service';
import { runtimeConfig } from '../config/runtime-config';
import { sliceToPage } from '../utils/paginate';
import { applyInboxFilters } from '../utils/inbox-filter.util';
import { sanitizeInboxAudienceTokens } from '../utils/inbox-audience-visibility';

/**
 * Unified inbox feed (announcements + notifications), newest first.
 * Production: {@code GET /communication/inbox/timeline}. Mocks: client merge + same filter rules as server.
 */
@Injectable({ providedIn: 'root' })
export class InboxUnifiedFeedService {
  constructor(
    private api: ApiService,
    private auth: AuthService,
    private comm: CommunicationService,
    private notifications: NotificationService
  ) {}

  getPage(opts: {
    page: number;
    size: number;
    q?: string;
    filters?: InboxFilterState;
  }): Observable<PageResp<InboxUnifiedItem>> {
    const q = (opts.q ?? '').trim();
    const f = opts.filters ?? DEFAULT_INBOX_FILTER_STATE;
    const role = this.auth.getNormalizedRole();
    const fSafe: InboxFilterState = {
      ...f,
      audienceTokens: sanitizeInboxAudienceTokens(role, f.audienceTokens),
    };
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/communication/inbox/timeline', {
          page: opts.page,
          size: opts.size,
          q: q || undefined,
          feedKind: fSafe.feedKind === 'ALL' ? undefined : fSafe.feedKind,
          audiences: fSafe.audienceTokens.length ? [...fSafe.audienceTokens].join(',') : undefined,
          yearMonth: fSafe.yearMonth?.trim() || undefined,
        })
        .pipe(map(p => ({ ...p, content: (p.content ?? []).map((row: any) => this.normalizeApiRow(row)) })));
    }
    return forkJoin({
      announcements: this.comm.getAnnouncements(),
      notifications: this.notifications.getNotifications(),
    }).pipe(
      delay(200),
      map(({ announcements, notifications }) => {
        const merged = this.mergeAndSort(announcements || [], notifications || [], q);
        const filtered = applyInboxFilters(merged, fSafe);
        return sliceToPage(filtered, opts.page, opts.size);
      })
    );
  }

  private normalizeApiRow(raw: any): InboxUnifiedItem {
    const kindRaw = String(raw.kind ?? '').toUpperCase();
    const kind: InboxUnifiedItem['kind'] = kindRaw === 'ANNOUNCEMENT' ? 'announcement' : 'notification';
    const typeNorm = String(raw.notificationType ?? 'INFO').toLowerCase();
    const notificationType: AppNotification['type'] =
      typeNorm === 'warning'
        ? 'warning'
        : typeNorm === 'success'
          ? 'success'
          : typeNorm === 'error'
            ? 'error'
            : 'info';
    return {
      kind,
      id: String(raw.id ?? ''),
      title: raw.title ?? '',
      preview: raw.preview ?? '',
      createdAt: raw.createdAt ?? '',
      audienceKey: raw.audienceKey != null ? String(raw.audienceKey) : undefined,
      authorLine: raw.authorLine != null ? String(raw.authorLine) : undefined,
      notificationType: kind === 'notification' ? notificationType : undefined,
      read: raw.read !== undefined && raw.read !== null ? !!raw.read : kind === 'announcement' ? true : undefined,
    };
  }

  private mergeAndSort(announcements: Announcement[], notifications: AppNotification[], q: string): InboxUnifiedItem[] {
    const ql = q.toLowerCase();
    const rows: InboxUnifiedItem[] = [];
    for (const a of announcements) {
      const authorLine =
        a.author && a.authorRole ? `${a.author} (${a.authorRole})` : (a.author || '').trim() || undefined;
      const item: InboxUnifiedItem = {
        kind: 'announcement',
        id: String(a.id),
        title: a.title ?? '',
        preview: this.previewFromBody(a.content),
        createdAt: a.createdAt ?? '',
        audienceKey: (a.targetAudience ?? 'ALL').toString().toUpperCase(),
        authorLine,
        read: true,
      };
      if (!ql || this.matchesSearch(item, ql)) {
        rows.push(item);
      }
    }
    for (const n of notifications) {
      const authorLine = n.senderLabel?.trim() || undefined;
      const item: InboxUnifiedItem = {
        kind: 'notification',
        id: String(n.id),
        title: n.title ?? '',
        preview: this.previewFromBody(n.message),
        createdAt: n.createdAt ?? '',
        notificationType: n.type,
        read: n.read,
        authorLine,
      };
      if (!ql || this.matchesSearch(item, ql)) {
        rows.push(item);
      }
    }
    rows.sort((x, y) => new Date(y.createdAt || 0).getTime() - new Date(x.createdAt || 0).getTime());
    return rows;
  }

  private matchesSearch(item: InboxUnifiedItem, ql: string): boolean {
    return (
      item.title.toLowerCase().includes(ql) ||
      item.preview.toLowerCase().includes(ql) ||
      (item.authorLine ?? '').toLowerCase().includes(ql)
    );
  }

  private previewFromBody(body: string | undefined): string {
    if (!body) {
      return '';
    }
    const t = body.replace(/\s+/g, ' ').trim();
    return t.length > 220 ? t.slice(0, 217) + '…' : t;
  }
}
