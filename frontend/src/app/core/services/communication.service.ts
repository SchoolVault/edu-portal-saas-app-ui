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

export interface CreateCommunicationEventPayload {
  title: string;
  description?: string;
  eventType: string;
  audienceScope: string;
  targetClassId?: number;
  targetSectionId?: number;
  publishAt?: string;
  eventStartAt: string;
  eventEndAt?: string;
  timezone: string;
  locale?: string;
  location?: string;
}

export interface CommunicationEventResponse {
  id: number;
  title: string;
  description?: string;
  eventType: string;
  audienceScope: string;
  targetClassId?: number;
  targetSectionId?: number;
  publishAt?: string;
  eventStartAt: string;
  eventEndAt?: string;
  timezone: string;
  locale?: string;
  location?: string;
  status: string;
  createdAt: string;
  publishedCampaignId?: string;
  reminder1dCampaignId?: string;
  reminder1hCampaignId?: string;
}

export interface CampaignRequestPayload {
  title: string;
  message: string;
  eventType: string;
  targetAudience: string;
  targetClassId?: number;
  targetSectionId?: number;
  channels: string[];
  locale?: string;
  scheduledAt?: string;
  templateVariables?: Record<string, string>;
}

export interface CampaignPreviewResponse {
  estimatedRecipients: number;
  recipientCountsByRole: Record<string, number>;
  channelRecipientCounts: Record<string, number>;
  estimatedCostMinor: number;
  warnings: string[];
}

export interface CampaignSendResponse {
  campaignId: string;
  recipientCount: number;
  queuedCount: number;
  scheduled: boolean;
  scheduledAt?: string;
}

export interface CampaignHistoryItem {
  campaignId: string;
  title: string;
  eventType: string;
  targetAudience: string;
  recipientCount: number;
  queuedCount: number;
  status: string;
  scheduledAt?: string;
  createdAt: string;
}

export interface CampaignAnalyticsResponse {
  campaignId: string;
  statusCounts: Record<string, number>;
  total: number;
  sent: number;
  retry: number;
  deadLetter: number;
}

export interface DeadLetterItem {
  id: number;
  eventType: string;
  channel: string;
  correlationId: string;
  lastError: string;
  attempts: number;
  deadLetteredAt?: string;
}

export interface ReplayResult {
  replayed: number;
  skipped: number;
}

export interface ProviderHealthResponse {
  providers: Record<string, boolean>;
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
      targetClassId: payload.targetClassId,
      targetSectionId: payload.targetSectionId,
      createdAt: new Date().toISOString(),
      tenantId: 't1'
    };
    this.announcements = [ann, ...this.announcements];
    return of(ann).pipe(delay(500));
  }

  createCommunicationEvent(payload: CreateCommunicationEventPayload): Observable<CommunicationEventResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<CommunicationEventResponse>('/communication/events', payload);
    }
    return of({
      id: Date.now(),
      title: payload.title,
      description: payload.description,
      eventType: payload.eventType,
      audienceScope: payload.audienceScope,
      targetClassId: payload.targetClassId,
      targetSectionId: payload.targetSectionId,
      publishAt: payload.publishAt,
      eventStartAt: payload.eventStartAt,
      eventEndAt: payload.eventEndAt,
      timezone: payload.timezone,
      location: payload.location,
      status: payload.publishAt ? 'SCHEDULED' : 'PUBLISHED',
      createdAt: new Date().toISOString(),
    }).pipe(delay(200));
  }

  previewCampaign(payload: CampaignRequestPayload): Observable<CampaignPreviewResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<CampaignPreviewResponse>('/communication/campaigns/preview', payload);
    }
    const estimatedRecipients = Math.max(1, this.visibleMockAnnouncements().length * 10);
    return of({
      estimatedRecipients,
      recipientCountsByRole: { PARENT: estimatedRecipients },
      channelRecipientCounts: (payload.channels || []).reduce((acc, c) => ({ ...acc, [c]: estimatedRecipients }), {}),
      estimatedCostMinor: estimatedRecipients * 25,
      warnings: [],
    }).pipe(delay(200));
  }

  sendCampaign(payload: CampaignRequestPayload): Observable<CampaignSendResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<CampaignSendResponse>('/communication/campaigns/send', payload);
    }
    return of({
      campaignId: `cmp-mock-${Date.now()}`,
      recipientCount: Math.max(1, this.visibleMockAnnouncements().length * 10),
      queuedCount: Math.max(1, this.visibleMockAnnouncements().length * 10) * (payload.channels?.length || 1),
      scheduled: !!payload.scheduledAt,
      scheduledAt: payload.scheduledAt,
    }).pipe(delay(300));
  }

  getCampaignHistory(page = 0, size = 10): Observable<PageResp<CampaignHistoryItem>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<CampaignHistoryItem>('/communication/campaigns/history', { page, size });
    }
    const mock: CampaignHistoryItem[] = [
      {
        campaignId: `cmp-mock-${Date.now()}`,
        title: 'Mock campaign',
        eventType: 'ANNOUNCEMENT_PUBLISHED',
        targetAudience: 'ALL',
        recipientCount: 120,
        queuedCount: 120,
        status: 'QUEUED',
        createdAt: new Date().toISOString(),
      },
    ];
    return of(sliceToPage(mock, page, size)).pipe(delay(180));
  }

  getCampaignAnalytics(campaignId: string): Observable<CampaignAnalyticsResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<CampaignAnalyticsResponse>(`/communication/campaigns/${encodeURIComponent(campaignId)}/analytics`);
    }
    return of({
      campaignId,
      statusCounts: { SENT: 100, RETRY: 5, DEAD_LETTER: 1 },
      total: 106,
      sent: 100,
      retry: 5,
      deadLetter: 1,
    }).pipe(delay(150));
  }

  getDeadLetterPage(page = 0, size = 20): Observable<PageResp<DeadLetterItem>> {
    if (!runtimeConfig.useMocks) {
      return this.api.getPageParams<DeadLetterItem>('/notifications/ops/dead-letter', { page, size });
    }
    const mock: DeadLetterItem[] = [
      {
        id: 1,
        eventType: 'ANNOUNCEMENT_SMS',
        channel: 'SMS',
        correlationId: 'cmp-mock-sms-1',
        lastError: 'TEMP_FAIL',
        attempts: 4,
        deadLetteredAt: new Date().toISOString(),
      },
    ];
    return of(sliceToPage(mock, page, size)).pipe(delay(180));
  }

  replayDeadLetter(id: number): Observable<ReplayResult> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<ReplayResult>(`/notifications/ops/dead-letter/${id}/replay`, {});
    }
    return of({ replayed: 1, skipped: 0 }).pipe(delay(120));
  }

  replayCampaignDeadLetters(campaignId: string, limit = 200): Observable<ReplayResult> {
    if (!runtimeConfig.useMocks) {
      return this.api.post<ReplayResult>(
        `/notifications/ops/dead-letter/replay-by-campaign/${encodeURIComponent(campaignId)}?limit=${limit}`,
        {}
      );
    }
    return of({ replayed: 2, skipped: 1 }).pipe(delay(120));
  }

  getProviderHealth(): Observable<ProviderHealthResponse> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<ProviderHealthResponse>('/notifications/ops/provider-health');
    }
    return of({ providers: { MSG91: true, TWILIO: false, MOCK: true } }).pipe(delay(100));
  }

  getAnnouncementPreviews(): Observable<AnnouncementPreview[]> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<AnnouncementPreview[]>('/communication/announcements/previews').pipe(
        map(rows =>
          (rows || []).map(p => ({
            ...p,
            id: String(p.id),
            targetAudience: (p as { targetAudience?: string }).targetAudience?.toLowerCase(),
            targetClassId: (p as { targetClassId?: number }).targetClassId,
            targetSectionId: (p as { targetSectionId?: number }).targetSectionId,
            targetClassName: (p as { targetClassName?: string }).targetClassName,
            targetSectionName: (p as { targetSectionName?: string }).targetSectionName,
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
      targetClassId: a.targetClassId != null ? Number(a.targetClassId) : undefined,
      targetSectionId: a.targetSectionId != null ? Number(a.targetSectionId) : undefined,
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
