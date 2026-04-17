import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { MOCK_ANNOUNCEMENTS_SEED } from '../mocks/communication.mock-data';
import { Announcement, AnnouncementPreview } from '../models/models';
import { ApiService, PageResp } from './api.service';
import { AuthService } from './auth.service';
import { runtimeConfig } from '../config/runtime-config';
import { DEFAULT_ERP_PAGE_SIZE } from '../constants/pagination.constants';
import { sliceToPage } from '../utils/paginate';

/** Payload for POST /communication/announcements (matches backend CreateAnnouncementRequest). */
export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  targetAudience: string;
  targetClassId?: number;
  targetSectionId?: number;
}

@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private announcements: Announcement[] = MOCK_ANNOUNCEMENTS_SEED.map(a => ({ ...a }));

  getAnnouncements(): Observable<Announcement[]> {
    if (!runtimeConfig.useMocks) { return this.api.get<Announcement[]>('/communication/announcements'); }
    return of([...this.visibleMockAnnouncements()]).pipe(delay(400));
  }

  getAnnouncementsPage(opts: { page?: number; size?: number; q?: string }): Observable<PageResp<Announcement>> {
    const page = opts.page ?? 0;
    const size = opts.size ?? DEFAULT_ERP_PAGE_SIZE;
    if (!runtimeConfig.useMocks) {
      return this.api
        .getPageParams<any>('/communication/announcements/paged', {
          page,
          size,
          q: opts.q?.trim() || undefined,
        })
        .pipe(map(p => ({ ...p, content: p.content.map((a: any) => this.normalizeAnnouncement(a)) })));
    }
    let rows = [...this.visibleMockAnnouncements()].map(a => this.normalizeAnnouncement(a));
    const tq = (opts.q ?? '').trim().toLowerCase();
    if (tq) {
      rows = rows.filter(
        a =>
          a.title.toLowerCase().includes(tq) ||
          (a.content || '').toLowerCase().includes(tq) ||
          (a.author || '').toLowerCase().includes(tq)
      );
    }
    return of(sliceToPage(rows, page, size)).pipe(delay(250));
  }

  getAnnouncement(id: string): Observable<Announcement> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<Announcement>(`/communication/announcements/${encodeURIComponent(id)}`);
    }
    const found = this.visibleMockAnnouncements().find(a => String(a.id) === String(id));
    if (!found) {
      return throwError(() => new Error('Announcement not found'));
    }
    return of({ ...found }).pipe(delay(200));
  }

  createAnnouncement(payload: CreateAnnouncementPayload): Observable<Announcement> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<Announcement>('/communication/announcements', {
        title: payload.title,
        content: payload.content,
        targetAudience: payload.targetAudience,
        targetClassId: payload.targetClassId,
        targetSectionId: payload.targetSectionId
      });
    }
    const ann: Announcement = {
      id: 'a' + Date.now(),
      title: payload.title,
      content: payload.content,
      author: 'You',
      authorRole: 'Admin',
      targetAudience: (payload.targetAudience || 'ALL').toLowerCase(),
      createdAt: new Date().toISOString(),
      tenantId: 't1'
    };
    this.announcements = [ann, ...this.announcements];
    return of(ann).pipe(delay(500));
  }

  getAnnouncementPreviews(): Observable<AnnouncementPreview[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<AnnouncementPreview[]>('/communication/announcements/previews').pipe(
        map(rows =>
          (rows || []).map(p => ({
            ...p,
            id: String(p.id),
            targetAudience: (p as { targetAudience?: string }).targetAudience?.toLowerCase(),
          }))
        )
      );
    }
    return this.getAnnouncements().pipe(
      map(list =>
        (list || []).slice(0, 5).map(a => {
          const t = (a.content || '').replace(/\s+/g, ' ').trim();
          const preview = t.length > 140 ? t.slice(0, 139) + '…' : t;
          return {
            id: String(a.id),
            title: a.title,
            preview,
            createdAt: a.createdAt,
            targetAudience: (a.targetAudience || 'all').toString().toLowerCase(),
          };
        })
      )
    );
  }

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  /** Mirrors backend {@code findForAudience} audience tokens for local-only demos. */
  private visibleMockAnnouncements(): Announcement[] {
    if (!runtimeConfig.useMocks) {
      return this.announcements;
    }
    const r = (this.auth.getCurrentUser()?.role || '').toLowerCase().replace(/^role_/, '');
    return this.announcements.filter(a => CommunicationService.mockAnnouncementVisibleToRole(r, a));
  }

  private static mockAnnouncementVisibleToRole(role: string, a: Announcement): boolean {
    const aud = (a.targetAudience || 'all').toLowerCase();
    if (aud === 'all') {
      return true;
    }
    if (role === 'parent') {
      return aud === 'parents' || aud === 'class' || aud === 'section';
    }
    if (role === 'teacher') {
      return aud === 'teachers' || aud === 'class' || aud === 'section';
    }
    if (role === 'student') {
      return false;
    }
    return true;
  }

  private normalizeAnnouncement(a: any): Announcement {
    return {
      id: String(a.id ?? ''),
      title: a.title ?? '',
      content: a.content ?? '',
      author: a.author ?? '',
      authorRole: a.authorRole ?? '',
      targetAudience: (a.targetAudience ?? 'ALL').toString().toLowerCase(),
      createdAt: a.createdAt ?? a.created_at ?? new Date().toISOString(),
      tenantId: String(a.tenantId ?? a.tenant_id ?? '')
    };
  }

  addAnnouncement(announcement: Announcement): Observable<Announcement> {
    if (!runtimeConfig.useMocks) { return this.api.post<Announcement>('/communication/announcements', announcement); }
    this.announcements = [announcement, ...this.announcements];
    return of(announcement).pipe(delay(500));
  }
}
