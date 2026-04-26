import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  CampaignAnalyticsResponse,
  CampaignHistoryItem,
  CampaignPreviewResponse,
  CampaignRequestPayload,
  CommunicationService,
  CreateCommunicationEventPayload,
  CreateAnnouncementPayload,
  DeadLetterItem,
  ProviderHealthResponse,
} from '../../core/services/communication.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { AcademicService } from '../../core/services/academic.service';
import { InboxUnifiedItem, SchoolClass } from '../../core/models/models';
import { BellReadStateService } from '../../core/services/bell-read-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { InboxUnifiedFeedService } from '../../core/services/inbox-unified-feed.service';
import { DEFAULT_INBOX_FILTER_STATE, InboxFilterState } from '../../core/models/inbox-filter.model';
import { InboxFiltersPanelComponent } from './inbox-filters-panel.component';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { debounceTime } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    SchoolClassNamePipe,
    ErpPaginationComponent,
    ErpI18nPhDirective,
    ErpDatePickerComponent,
    InboxFiltersPanelComponent,
  ],
  template: `
    <div data-testid="communication-page" class="communication-page-root">
      <div class="inbox-layout animate-in">
        <header class="erp-page-header mb-3">
          <div>
            <h1 class="erp-page-header__title">{{ 'inbox.pageTitle' | translate }}</h1>
            <p class="erp-page-header__lead">{{ 'inbox.lead' | translate }}</p>
          </div>
          <div class="erp-page-header__actions">
            <button type="button" class="btn-outline-erp btn-sm" (click)="refreshInbox()">
              <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> {{ 'inbox.refresh' | translate }}
            </button>
            <button *ngIf="canPublish" type="button" class="btn-primary-erp btn-sm" (click)="openAnnouncementModal()">
              <i class="bi bi-plus-lg" aria-hidden="true"></i> {{ 'inbox.newAnnouncement' | translate }}
            </button>
          </div>
        </header>

        <div class="erp-card animate-in animate-in-delay-1 inbox-card-shell">
          <div class="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3 inbox-toolbar">
            <div class="search-input-wrapper inbox-toolbar-search" style="flex: 1 1 220px; min-width: 200px; max-width: 520px;">
              <i class="bi bi-search" aria-hidden="true"></i>
              <input
                type="search"
                class="erp-input"
                erpI18nPh="inbox.searchInboxPh"
                [(ngModel)]="inboxSearch"
                (ngModelChange)="onInboxSearchChange()"
                [attr.data-testid]="'inbox-search-input'"
              />
            </div>
            <app-inbox-filters-panel (apply)="onFiltersApply($event)" (clear)="onFiltersClear()"></app-inbox-filters-panel>
          </div>

          <div *ngIf="inboxTotal === 0 && !inboxSearch && !inboxLoading && !hasActiveFilters" class="empty-inbox text-center py-5 text-muted">
            <i class="bi bi-inboxes" style="font-size: 2rem" aria-hidden="true"></i>
            <p class="mt-2 mb-0">{{ 'inbox.emptyUnified' | translate }}</p>
          </div>

          <div *ngIf="inboxTotal === 0 && !inboxLoading && hasActiveFilters" class="empty-inbox text-center py-5 text-muted">
            <i class="bi bi-funnel" style="font-size: 2rem" aria-hidden="true"></i>
            <p class="mt-2 mb-0">{{ 'inbox.emptyFiltered' | translate }}</p>
          </div>

          <p *ngIf="inboxTotal === 0 && inboxSearch.trim() && !inboxLoading" class="text-muted small mb-3">
            {{ 'inbox.noSearchMatches' | translate }}
          </p>

          <div *ngIf="inboxLoading" class="text-muted py-4 text-center">{{ 'inbox.loading' | translate }}</div>

          <div
            *ngFor="let row of inboxRows; trackBy: trackInboxRow"
            class="erp-card mb-3 inbox-card inbox-row has-read-status-dot"
            [class.is-unread]="inboxRowReadDotUnread(row)"
            [class.is-read]="!inboxRowReadDotUnread(row)"
            [routerLink]="inboxRowLink(row)"
            [attr.data-testid]="inboxRowTestId(row)"
            (click)="onInboxRowActivate(row)">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h3 style="font-size: 16px; font-weight: 700; margin: 0;" class="d-flex align-items-center gap-2 flex-wrap">
                <i
                  *ngIf="row.kind === 'notification'"
                  class="bi"
                  [ngClass]="inboxNotifIcon(row.notificationType)"
                  [style.color]="inboxNotifColor(row.notificationType)"></i>
                <i *ngIf="row.kind === 'announcement'" class="bi bi-megaphone-fill" style="color: var(--clr-primary)"></i>
                {{ row.title }}
                <span *ngIf="row.kind === 'announcement'" class="badge-erp badge-info text-uppercase" style="font-size: 10px">{{
                  audienceBadge(row)
                }}</span>
                <span *ngIf="row.kind === 'notification' && row.read === false" class="badge-erp badge-info text-uppercase" style="font-size: 9px">{{
                  'inbox.notifUnread' | translate
                }}</span>
              </h3>
            </div>
            <p class="announcement-preview text-muted" style="font-size: 14px; line-height: 1.6; margin-bottom: 12px;">{{ row.preview }}</p>
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2" style="font-size: 12px; color: var(--clr-text-muted);">
              <span *ngIf="row.authorLine"><i class="bi bi-person me-1"></i>{{ row.authorLine }}</span>
              <span *ngIf="row.kind === 'announcement' && !row.authorLine"><i class="bi bi-person me-1"></i>{{ 'inbox.authorFallback' | translate }}</span>
              <div class="d-flex gap-2 align-items-center">
                <span><i class="bi bi-clock me-1"></i>{{ formatDate(row.createdAt) }}</span>
                <span class="small text-muted">{{ 'inbox.openItem' | translate }}</span>
              </div>
            </div>
          </div>

          <app-erp-pagination
            *ngIf="inboxTotal > 0"
            class="d-block mt-1"
            [totalElements]="inboxTotal"
            [pageIndex]="inboxPageIndex"
            [pageSize]="inboxPageSize"
            (pageIndexChange)="onInboxPageIndex($event)"
            (pageSizeChange)="onInboxPageSize($event)"
          />
        </div>

        <div *ngIf="canPublish" class="erp-card mt-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h3 style="font-size: 16px; margin: 0;">Notification Delivery Dashboard</h3>
            <button type="button" class="btn-outline-erp btn-sm" (click)="refreshOpsDashboard()">Refresh</button>
          </div>
          <div class="mb-2 small" *ngIf="providerHealth?.providers">
            <strong>Provider status:</strong>
            <span class="ms-2" *ngFor="let p of providerHealthEntries()">
              <span [class.text-success]="p[1]" [class.text-danger]="!p[1]">{{ p[0] }}: {{ p[1] ? 'UP' : 'DOWN' }}</span>
            </span>
          </div>
          <div *ngIf="campaignHistoryLoading" class="text-muted small">Loading campaign history...</div>
          <div *ngIf="!campaignHistoryLoading && !campaignHistory.length" class="text-muted small">No notification campaigns yet.</div>
          <div *ngFor="let c of campaignHistory" class="border rounded p-2 mb-2">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div><strong>{{ c.title }}</strong> <span class="text-muted small">({{ c.eventType }})</span></div>
                <div class="small text-muted">Audience {{ c.targetAudience }} | Recipients {{ c.recipientCount }} | Queued {{ c.queuedCount }}</div>
              </div>
              <span class="badge-erp badge-info text-uppercase">{{ c.status }}</span>
            </div>
            <div class="small mt-1" *ngIf="campaignAnalytics[c.campaignId] as a">
              Delivered {{ a.sent }} | Retrying {{ a.retry }} | Failed {{ a.deadLetter }} | Total {{ a.total }}
            </div>
            <div class="mt-1" *ngIf="(campaignAnalytics[c.campaignId]?.deadLetter || 0) > 0">
              <button type="button" class="btn-outline-erp btn-sm" (click)="replayCampaignDlq(c.campaignId)">Retry failed deliveries</button>
            </div>
          </div>
          <app-erp-pagination
            *ngIf="campaignHistoryTotal > 0"
            class="d-block mt-1"
            [totalElements]="campaignHistoryTotal"
            [pageIndex]="campaignHistoryPageIndex"
            [pageSize]="campaignHistoryPageSize"
            (pageIndexChange)="onCampaignHistoryPageIndex($event)"
            (pageSizeChange)="onCampaignHistoryPageSize($event)"
          />

          <div class="mt-3">
            <h4 style="font-size: 14px;">Failed Deliveries</h4>
            <div *ngIf="deadLetterLoading" class="text-muted small">Loading failed deliveries...</div>
            <div *ngIf="!deadLetterLoading && !deadLetters.length" class="text-muted small">No failed deliveries.</div>
            <div *ngFor="let dlq of deadLetters" class="border rounded p-2 mb-2">
              <div class="small"><strong>{{ dlq.eventType }}</strong> · {{ dlq.channel }} · attempts {{ dlq.attempts }}</div>
              <div class="small text-muted">{{ dlq.lastError }}</div>
              <button type="button" class="btn-outline-erp btn-sm mt-1" (click)="replayDeadLetter(dlq.id)">Retry delivery</button>
            </div>
            <app-erp-pagination
              *ngIf="deadLetterTotal > 0"
              class="d-block mt-1"
              [totalElements]="deadLetterTotal"
              [pageIndex]="deadLetterPageIndex"
              [pageSize]="deadLetterPageSize"
              (pageIndexChange)="onDeadLetterPageIndex($event)"
              (pageSizeChange)="onDeadLetterPageSize($event)"
            />
          </div>
        </div>
      </div>

      <div class="modal-overlay modal-overlay-viewport" *ngIf="showAnnouncementModal" (click)="closeAnnouncementModal()">
        <div class="modal-content-erp modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ 'inbox.modalTitle' | translate }}</h3>
            <button class="btn-icon" type="button" [disabled]="isPublishingAnnouncement" (click)="closeAnnouncementModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="erp-form-group">
              <label class="erp-label">Type</label>
              <select class="erp-select" [(ngModel)]="announcementMode">
                <option value="NOTICE">Notice</option>
                <option value="EVENT">Scheduled Event</option>
              </select>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">{{ 'inbox.labelTitle' | translate }}</label>
              <input type="text" class="erp-input" [(ngModel)]="annForm.title" />
            </div>
            <div class="erp-form-group">
              <label class="erp-label">{{ announcementMode === 'EVENT' ? 'Description' : ('inbox.labelMessage' | translate) }}</label>
              <textarea class="erp-input erp-textarea" rows="5" [(ngModel)]="annForm.content"></textarea>
            </div>
            <div *ngIf="announcementMode === 'EVENT'" class="erp-form-group">
              <label class="erp-label">Event type</label>
              <select class="erp-select" [(ngModel)]="eventType">
                <option value="PTM">PTM</option>
                <option value="SPORTS">Sports</option>
                <option value="FESTIVAL">Festival</option>
                <option value="STAFF_MEETING">Staff Meeting</option>
                <option value="EXAM">Exam</option>
                <option value="FEES">Fees</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">{{ 'inbox.labelAudience' | translate }}</label>
              <select class="erp-select" [(ngModel)]="annForm.targetAudience">
                <option value="ALL">{{ 'inbox.audienceALL' | translate }}</option>
                <option value="TEACHERS">{{ 'inbox.audienceTEACHERS' | translate }}</option>
                <option value="PARENTS">{{ 'inbox.audiencePARENTS' | translate }}</option>
                <option value="CLASS">{{ 'inbox.audienceCLASS' | translate }}</option>
                <option value="SECTION">{{ 'inbox.audienceSECTION' | translate }}</option>
              </select>
              <small class="text-muted d-block mt-1">{{ 'inbox.audienceScopeHint' | translate }}</small>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Channels</label>
              <div class="d-flex flex-wrap gap-3">
                <label class="form-check-label"><input type="checkbox" class="form-check-input me-1" [checked]="channelChecked('SMS')" (change)="toggleChannel('SMS', $event)" />SMS</label>
                <label class="form-check-label"><input type="checkbox" class="form-check-input me-1" [checked]="channelChecked('WHATSAPP')" (change)="toggleChannel('WHATSAPP', $event)" />WhatsApp</label>
                <label class="form-check-label"><input type="checkbox" class="form-check-input me-1" [checked]="channelChecked('IN_APP')" (change)="toggleChannel('IN_APP', $event)" />In-App</label>
              </div>
            </div>
            <div *ngIf="announcementMode === 'EVENT'" class="erp-form-group">
              <label class="erp-label">Event start</label>
              <app-erp-date-picker
                [(ngModel)]="eventStartAt"
                mode="datetime"
                placeholder="Select event start date and time"
              />
            </div>
            <div *ngIf="announcementMode === 'EVENT'" class="erp-form-group">
              <label class="erp-label">Event end (optional)</label>
              <app-erp-date-picker
                [(ngModel)]="eventEndAt"
                mode="datetime"
                placeholder="Select event end date and time"
              />
            </div>
            <div *ngIf="announcementMode === 'EVENT'" class="erp-form-group">
              <label class="erp-label">Publish at (optional schedule)</label>
              <app-erp-date-picker
                [(ngModel)]="publishAt"
                mode="datetime"
                placeholder="Select publish date and time"
              />
            </div>
            <div *ngIf="announcementMode === 'EVENT'" class="erp-form-group">
              <label class="erp-label">Timezone</label>
              <input type="text" class="erp-input" [(ngModel)]="eventTimezone" />
            </div>
            <div *ngIf="announcementMode === 'EVENT'" class="erp-form-group">
              <label class="erp-label">Location</label>
              <input type="text" class="erp-input" [(ngModel)]="eventLocation" />
            </div>
            <div class="erp-form-group" *ngIf="annForm.targetAudience === 'CLASS' || annForm.targetAudience === 'SECTION'">
              <label class="erp-label">{{ 'timetable.labelClass' | translate }}</label>
              <select class="erp-select" [(ngModel)]="annSelectedClassId" (ngModelChange)="onAnnClassChange()">
                <option [ngValue]="null">{{ 'inbox.selectClass' | translate }}</option>
                <option *ngFor="let c of annClasses" [ngValue]="c.id">{{ c.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="erp-form-group" *ngIf="annForm.targetAudience === 'SECTION'">
              <label class="erp-label">{{ 'timetable.labelSection' | translate }}</label>
              <select class="erp-select" [(ngModel)]="annSelectedSectionId" [disabled]="!annSections.length">
                <option [ngValue]="null">{{ annSections.length ? ('inbox.selectSection' | translate) : ('inbox.noSections' | translate) }}</option>
                <option *ngFor="let s of annSections" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div *ngIf="campaignPreview" class="p-2 rounded border bg-light mb-2">
              <div class="small"><strong>Recipients:</strong> {{ campaignPreview.estimatedRecipients }}</div>
              <div class="small"><strong>Estimated cost (minor):</strong> {{ campaignPreview.estimatedCostMinor }}</div>
              <div class="small" *ngIf="campaignPreview.warnings.length"><strong>Warnings:</strong> {{ campaignPreview.warnings.join(' | ') }}</div>
            </div>
            <p *ngIf="announcementPublishError" class="text-danger small mb-0">{{ announcementPublishError }}</p>
            <p *ngIf="announcementPublishInfo" class="text-muted small mb-0">{{ announcementPublishInfo }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" [disabled]="isPublishingAnnouncement" (click)="closeAnnouncementModal()">{{ 'inbox.cancel' | translate }}</button>
            <button
              type="button"
              class="btn-outline-erp"
              (click)="previewCampaign()"
              [disabled]="isPublishingAnnouncement || !annForm.title.trim() || !annForm.content.trim() || selectedChannels.length === 0">
              Preview
            </button>
            <button
              type="button"
              class="btn-primary-erp"
              (click)="publishAnnouncement()"
              [disabled]="isPublishingAnnouncement || !annForm.title.trim() || !annForm.content.trim() || selectedChannels.length === 0 || (announcementMode === 'EVENT' && !eventStartAt)">
              <span *ngIf="!isPublishingAnnouncement">{{ announcementMode === 'EVENT' ? 'Create event' : ('inbox.publish' | translate) }}</span>
              <span *ngIf="isPublishingAnnouncement">
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ 'inbox.publishInProgress' | translate }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .communication-page-root {
        position: relative;
      }
      .inbox-layout {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 4px;
      }
      @media (min-width: 576px) {
        .inbox-layout {
          padding: 0 8px;
        }
      }
      .inbox-card-shell {
        padding: 16px 18px 20px;
      }
      .inbox-toolbar {
        gap: 10px !important;
      }
      .inbox-toolbar-search input {
        width: 100%;
      }
      .inbox-card {
        border-radius: 12px;
      }
      .announcement-preview {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .modal-wide {
        max-width: 520px;
        width: 100%;
      }
      .inbox-row {
        cursor: pointer;
        color: inherit;
        text-decoration: none;
        display: block;
      }
      .inbox-row:hover {
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
      }
      @media (max-width: 576px) {
        .inbox-card-shell {
          padding: 12px;
        }
        .modal-wide {
          max-width: 100%;
        }
      }
    `,
  ],
})
export class CommunicationComponent implements OnInit {
  inboxRows: InboxUnifiedItem[] = [];
  inboxTotal = 0;
  inboxPageIndex = 0;
  inboxPageSize = DEFAULT_ERP_PAGE_SIZE;
  inboxLoading = false;
  inboxSearch = '';
  appliedFilters: InboxFilterState = cloneInboxFilters(DEFAULT_INBOX_FILTER_STATE);

  showAnnouncementModal = false;
  isPublishingAnnouncement = false;
  announcementPublishError = '';
  announcementPublishInfo = '';
  campaignPreview: CampaignPreviewResponse | null = null;
  selectedChannels: string[] = ['SMS'];
  campaignHistory: CampaignHistoryItem[] = [];
  campaignAnalytics: Record<string, CampaignAnalyticsResponse> = {};
  campaignHistoryLoading = false;
  campaignHistoryTotal = 0;
  campaignHistoryPageIndex = 0;
  campaignHistoryPageSize = 8;
  providerHealth: ProviderHealthResponse | null = null;
  deadLetters: DeadLetterItem[] = [];
  deadLetterLoading = false;
  deadLetterTotal = 0;
  deadLetterPageIndex = 0;
  deadLetterPageSize = 10;
  annClasses: SchoolClass[] = [];
  annSections: { id: number; name: string }[] = [];
  annSelectedClassId: number | null = null;
  annSelectedSectionId: number | null = null;
  annForm: CreateAnnouncementPayload = {
    title: '',
    content: '',
    targetAudience: 'ALL',
  };
  announcementMode: 'NOTICE' | 'EVENT' = 'NOTICE';
  eventType = 'PTM';
  eventStartAt = '';
  eventEndAt = '';
  publishAt = '';
  eventTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  eventLocation = '';

  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bellRead = inject(BellReadStateService);
  private readonly inboxSearch$ = new Subject<void>();
  private readonly subs = new Subscription();
  private inboxReqSeq = 0;
  private readonly uiAccess = inject(UiAccessService);

  constructor(
    private comm: CommunicationService,
    private auth: AuthService,
    private academic: AcademicService,
    private notificationService: NotificationService,
    private inboxFeed: InboxUnifiedFeedService
  ) {}

  /** Mirrors {@code RbacSpel#COMMUNICATION_SCHOOL_ADMIN} — delegated comms / ops desk may publish. */
  get canPublish(): boolean {
    return this.uiAccess.hasCommunicationSchoolAdminDesk();
  }

  get hasActiveFilters(): boolean {
    return (
      this.appliedFilters.feedKind !== 'ALL' ||
      this.appliedFilters.audienceTokens.length > 0 ||
      !!this.appliedFilters.yearMonth?.trim()
    );
  }

  onFiltersApply(state: InboxFilterState): void {
    this.appliedFilters = cloneInboxFilters(state);
    this.inboxPageIndex = 0;
    this.fetchInboxPage();
  }

  onFiltersClear(): void {
    this.appliedFilters = cloneInboxFilters(DEFAULT_INBOX_FILTER_STATE);
    this.inboxPageIndex = 0;
    this.fetchInboxPage();
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.bellRead.changed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.subs.add(
      this.inboxSearch$.pipe(debounceTime(300)).subscribe(() => {
        this.inboxPageIndex = 0;
        this.fetchInboxPage();
      })
    );
    this.destroyRef.onDestroy(() => this.subs.unsubscribe());
    this.refreshInbox();
    this.academic.getClasses().subscribe(list => (this.annClasses = list || []));
    this.refreshOpsDashboard();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const campaignId = params.get('campaignId');
      if (campaignId && this.canPublish) {
        this.comm.getCampaignAnalytics(campaignId).subscribe({
          next: analytics => {
            this.announcementPublishInfo = `Campaign ${campaignId}: Delivered ${analytics.sent}, Retrying ${analytics.retry}, Failed ${analytics.deadLetter}`;
          },
        });
      }
    });
  }

  refreshInbox(): void {
    this.inboxPageIndex = 0;
    this.fetchInboxPage();
  }

  trackInboxRow(_index: number, row: InboxUnifiedItem): string {
    return `${row.kind}-${row.id}`;
  }

  inboxRowLink(row: InboxUnifiedItem): string[] {
    return row.kind === 'announcement' ? ['/app/announcement', row.id] : ['/app/notifications', row.id];
  }

  inboxRowTestId(row: InboxUnifiedItem): string {
    return `inbox-row-${row.kind}-${row.id}`;
  }

  onInboxRowActivate(row: InboxUnifiedItem): void {
    if (row.kind === 'announcement') {
      this.bellRead.markAnnouncementRead(row.id);
      return;
    }
    this.notificationService.markAsRead(row.id);
  }

  /** Unread = announcement not in local read set, or notification with {@code read === false}. */
  inboxRowReadDotUnread(row: InboxUnifiedItem): boolean {
    if (row.kind === 'announcement') {
      return this.bellRead.isAnnouncementUnread(row.id);
    }
    return row.read === false;
  }

  inboxNotifIcon(type: string | undefined): string {
    const icons: Record<string, string> = {
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
    };
    return icons[type || 'info'] || 'bi-info-circle-fill';
  }

  inboxNotifColor(type: string | undefined): string {
    const colors: Record<string, string> = {
      info: 'var(--clr-info)',
      warning: 'var(--clr-warning)',
      success: 'var(--clr-success)',
      error: 'var(--clr-danger)',
    };
    return colors[type || 'info'] || 'var(--clr-info)';
  }

  audienceBadge(row: InboxUnifiedItem): string {
    const key = row.audienceKey;
    if (!key) {
      return '';
    }
    const v = key.toUpperCase();
    if (v === 'CLASS' || v === 'SECTION') {
      const cls = this.annClasses.find(c => c.id === row.targetClassId);
      const sec = cls?.sections?.find(s => s.id === row.targetSectionId);
      const className = this.classDisplayName((row.targetClassName || cls?.name || '').trim());
      const sectionName = (row.targetSectionName || sec?.name || '').trim();
      if (v === 'SECTION' && className && sec?.name) {
        return `${this.translate.instant('inbox.badgeClassPrefix')} ${className} - ${sectionName}`;
      }
      if (v === 'CLASS' && className) {
        return `${this.translate.instant('inbox.badgeClassPrefix')} ${className}`;
      }
      if (v === 'SECTION' && className && sectionName) {
        return `${this.translate.instant('inbox.badgeClassPrefix')} ${className} - ${sectionName}`;
      }
    }
    const trKey = `inbox.badge${v}`;
    const t = this.translate.instant(trKey);
    return t !== trKey ? t : v;
  }

  private classDisplayName(name: string): string {
    const t = (name || '').trim();
    if (!t) {
      return '';
    }
    return t.toUpperCase().startsWith('CLASS ') ? t.substring(6).trim() : t;
  }

  onInboxSearchChange(): void {
    this.inboxSearch$.next();
  }

  onInboxPageIndex(i: number): void {
    this.inboxPageIndex = i;
    this.fetchInboxPage();
  }

  onInboxPageSize(s: number): void {
    this.inboxPageSize = s;
    this.inboxPageIndex = 0;
    this.fetchInboxPage();
  }

  onAnnClassChange(): void {
    const cls = this.annClasses.find(c => c.id === this.annSelectedClassId);
    this.annSections = cls ? cls.sections.map(se => ({ id: se.id, name: se.name })) : [];
    this.annSelectedSectionId = null;
  }

  openAnnouncementModal(): void {
    this.annForm = {
      title: '',
      content: '',
      targetAudience: 'ALL',
    };
    this.annSelectedClassId = null;
    this.annSelectedSectionId = null;
    this.annSections = [];
    this.isPublishingAnnouncement = false;
    this.announcementPublishError = '';
    this.announcementPublishInfo = '';
    this.selectedChannels = ['SMS'];
    this.campaignPreview = null;
    this.announcementMode = 'NOTICE';
    this.eventType = 'PTM';
    this.eventStartAt = '';
    this.eventEndAt = '';
    this.publishAt = '';
    this.eventTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    this.eventLocation = '';
    this.showAnnouncementModal = true;
  }

  closeAnnouncementModal(): void {
    if (this.isPublishingAnnouncement) {
      return;
    }
    this.showAnnouncementModal = false;
  }

  publishAnnouncement(): void {
    if (this.isPublishingAnnouncement) {
      return;
    }
    const title = this.annForm.title.trim();
    const content = this.annForm.content.trim();
    if (!title || !content) {
      this.announcementPublishError = this.translate.instant('inbox.publishValidationTitleMessage');
      return;
    }
    if (!this.selectedChannels.length) {
      this.announcementPublishError = 'Select at least one channel.';
      return;
    }
    let targetClassId: number | undefined;
    let targetSectionId: number | undefined;
    if (this.annForm.targetAudience === 'CLASS' || this.annForm.targetAudience === 'SECTION') {
      targetClassId = this.annSelectedClassId ?? undefined;
      if (!targetClassId) {
        this.announcementPublishError = this.translate.instant('inbox.publishValidationClass');
        return;
      }
    }
    if (this.annForm.targetAudience === 'SECTION') {
      targetSectionId = this.annSelectedSectionId ?? undefined;
      if (!targetSectionId) {
        this.announcementPublishError = this.translate.instant('inbox.publishValidationSection');
        return;
      }
    }
    if (this.announcementMode === 'EVENT' && !this.eventStartAt) {
      this.announcementPublishError = 'Event start date/time is required.';
      return;
    }
    this.announcementPublishError = '';
    this.announcementPublishInfo = this.translate.instant('inbox.publishInProgress');
    this.isPublishingAnnouncement = true;
    const payload: CreateAnnouncementPayload = {
      title,
      content,
      targetAudience: this.annForm.targetAudience,
      targetClassId,
      targetSectionId,
    };
    const campaignPayload: CampaignRequestPayload = {
      title,
      message: content,
      eventType: this.announcementMode === 'EVENT' ? this.eventType : 'ANNOUNCEMENT_PUBLISHED',
      targetAudience: this.annForm.targetAudience,
      targetClassId,
      targetSectionId,
      channels: [...this.selectedChannels],
      locale: 'en',
      scheduledAt: this.publishAt || undefined,
    };
    this.comm.sendCampaign(campaignPayload).subscribe({
      next: () => {
        if (this.announcementMode === 'EVENT') {
          const eventPayload: CreateCommunicationEventPayload = {
            title,
            description: content,
            eventType: this.eventType,
            audienceScope: this.annForm.targetAudience,
            targetClassId,
            targetSectionId,
            publishAt: this.publishAt || undefined,
            eventStartAt: this.eventStartAt,
            eventEndAt: this.eventEndAt || undefined,
            timezone: this.eventTimezone || 'Asia/Kolkata',
            locale: (this.translate.currentLang || 'en').toLowerCase(),
            location: this.eventLocation || undefined,
          };
          this.comm.createCommunicationEvent(eventPayload).subscribe({
            next: () => {
              this.isPublishingAnnouncement = false;
              this.announcementPublishInfo = this.translate.instant('inbox.publishSuccess');
              this.showAnnouncementModal = false;
              this.refreshInbox();
              this.loadCampaignHistory();
            },
            error: (err: { error?: { message?: string } }) => {
              this.isPublishingAnnouncement = false;
              this.announcementPublishInfo = '';
              this.announcementPublishError = err?.error?.message || this.translate.instant('inbox.publishFailed');
            },
          });
          return;
        }
        this.comm.createAnnouncement(payload).subscribe({
          next: () => {
            this.isPublishingAnnouncement = false;
            this.announcementPublishInfo = this.translate.instant('inbox.publishSuccess');
            this.showAnnouncementModal = false;
            this.refreshInbox();
            this.loadCampaignHistory();
          },
          error: (err: { error?: { message?: string } }) => {
            this.isPublishingAnnouncement = false;
            this.announcementPublishInfo = '';
            this.announcementPublishError = err?.error?.message || this.translate.instant('inbox.publishFailed');
          },
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.isPublishingAnnouncement = false;
        this.announcementPublishInfo = '';
        this.announcementPublishError = err?.error?.message || this.translate.instant('inbox.publishFailed');
      },
    });
  }

  previewCampaign(): void {
    const title = this.annForm.title.trim();
    const content = this.annForm.content.trim();
    if (!title || !content || !this.selectedChannels.length) {
      return;
    }
    const payload: CampaignRequestPayload = {
      title,
      message: content,
      eventType: this.announcementMode === 'EVENT' ? this.eventType : 'ANNOUNCEMENT_PUBLISHED',
      targetAudience: this.annForm.targetAudience,
      targetClassId: this.annSelectedClassId ?? undefined,
      targetSectionId: this.annSelectedSectionId ?? undefined,
      channels: [...this.selectedChannels],
      locale: 'en',
      scheduledAt: this.publishAt || undefined,
    };
    this.comm.previewCampaign(payload).subscribe({
      next: preview => {
        this.campaignPreview = preview;
        this.announcementPublishInfo = `Estimated recipients: ${preview.estimatedRecipients}`;
      },
      error: () => {
        this.campaignPreview = null;
        this.announcementPublishError = 'Preview failed';
      },
    });
  }

  toggleChannel(channel: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedChannels.includes(channel)) {
        this.selectedChannels = [...this.selectedChannels, channel];
      }
      return;
    }
    this.selectedChannels = this.selectedChannels.filter(c => c !== channel);
  }

  channelChecked(channel: string): boolean {
    return this.selectedChannels.includes(channel);
  }

  loadCampaignHistory(): void {
    if (!this.canPublish) {
      return;
    }
    this.campaignHistoryLoading = true;
    this.comm.getCampaignHistory(this.campaignHistoryPageIndex, this.campaignHistoryPageSize).subscribe({
      next: page => {
        this.campaignHistory = page.content || [];
        this.campaignHistoryTotal = page.totalElements || 0;
        this.campaignHistoryLoading = false;
        this.campaignAnalytics = {};
        for (const row of this.campaignHistory) {
          this.comm.getCampaignAnalytics(row.campaignId).subscribe({
            next: a => {
              this.campaignAnalytics[row.campaignId] = a;
            },
          });
        }
      },
      error: () => {
        this.campaignHistoryLoading = false;
      },
    });
  }

  loadDeadLetters(): void {
    if (!this.canPublish) {
      return;
    }
    this.deadLetterLoading = true;
    this.comm.getDeadLetterPage(this.deadLetterPageIndex, this.deadLetterPageSize).subscribe({
      next: page => {
        this.deadLetters = page.content || [];
        this.deadLetterTotal = page.totalElements || 0;
        this.deadLetterLoading = false;
      },
      error: () => {
        this.deadLetterLoading = false;
      },
    });
  }

  loadProviderHealth(): void {
    if (!this.canPublish) {
      return;
    }
    this.comm.getProviderHealth().subscribe({
      next: health => {
        this.providerHealth = health;
      },
    });
  }

  replayDeadLetter(id: number): void {
    this.comm.replayDeadLetter(id).subscribe({
      next: () => this.loadDeadLetters(),
    });
  }

  replayCampaignDlq(campaignId: string): void {
    this.comm.replayCampaignDeadLetters(campaignId).subscribe({
      next: () => {
        this.loadCampaignHistory();
        this.loadDeadLetters();
      },
    });
  }

  providerHealthEntries(): [string, boolean][] {
    const providers = this.providerHealth?.providers || {};
    return Object.entries(providers) as [string, boolean][];
  }

  refreshOpsDashboard(): void {
    this.loadCampaignHistory();
    this.loadDeadLetters();
    this.loadProviderHealth();
  }

  onCampaignHistoryPageIndex(i: number): void {
    this.campaignHistoryPageIndex = i;
    this.loadCampaignHistory();
  }

  onCampaignHistoryPageSize(s: number): void {
    this.campaignHistoryPageSize = s;
    this.campaignHistoryPageIndex = 0;
    this.loadCampaignHistory();
  }

  onDeadLetterPageIndex(i: number): void {
    this.deadLetterPageIndex = i;
    this.loadDeadLetters();
  }

  onDeadLetterPageSize(s: number): void {
    this.deadLetterPageSize = s;
    this.deadLetterPageIndex = 0;
    this.loadDeadLetters();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) {
      return '';
    }
    const lang = this.translate.currentLang || 'en';
    return new Date(dateStr).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private fetchInboxPage(): void {
    const seq = ++this.inboxReqSeq;
    this.inboxLoading = true;
    this.inboxFeed
      .getPage({
        page: this.inboxPageIndex,
        size: this.inboxPageSize,
        q: this.inboxSearch.trim() || undefined,
        filters: cloneInboxFilters(this.appliedFilters),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p => {
          if (seq !== this.inboxReqSeq) {
            return;
          }
          this.inboxRows = p.content;
          this.inboxTotal = p.totalElements;
          this.inboxLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          if (seq !== this.inboxReqSeq) {
            return;
          }
          this.inboxRows = [];
          this.inboxTotal = 0;
          this.inboxLoading = false;
          this.cdr.markForCheck();
        },
      });
  }
}

function cloneInboxFilters(f: InboxFilterState): InboxFilterState {
  return {
    feedKind: f.feedKind,
    audienceTokens: [...f.audienceTokens],
    yearMonth: f.yearMonth ?? '',
  };
}
