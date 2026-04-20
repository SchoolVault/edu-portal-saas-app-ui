import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommunicationService, CreateAnnouncementPayload } from '../../core/services/communication.service';
import { AuthService } from '../../core/services/auth.service';
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
      </div>

      <div class="modal-overlay modal-overlay-viewport" *ngIf="showAnnouncementModal" (click)="closeAnnouncementModal()">
        <div class="modal-content-erp modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ 'inbox.modalTitle' | translate }}</h3>
            <button class="btn-icon" type="button" [disabled]="isPublishingAnnouncement" (click)="closeAnnouncementModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="erp-form-group">
              <label class="erp-label">{{ 'inbox.labelTitle' | translate }}</label>
              <input type="text" class="erp-input" [(ngModel)]="annForm.title" />
            </div>
            <div class="erp-form-group">
              <label class="erp-label">{{ 'inbox.labelMessage' | translate }}</label>
              <textarea class="erp-input erp-textarea" rows="5" [(ngModel)]="annForm.content"></textarea>
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
            <p *ngIf="announcementPublishError" class="text-danger small mb-0">{{ announcementPublishError }}</p>
            <p *ngIf="announcementPublishInfo" class="text-muted small mb-0">{{ announcementPublishInfo }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" [disabled]="isPublishingAnnouncement" (click)="closeAnnouncementModal()">{{ 'inbox.cancel' | translate }}</button>
            <button
              type="button"
              class="btn-primary-erp"
              (click)="publishAnnouncement()"
              [disabled]="isPublishingAnnouncement || !annForm.title.trim() || !annForm.content.trim()">
              <span *ngIf="!isPublishingAnnouncement">{{ 'inbox.publish' | translate }}</span>
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
  annClasses: SchoolClass[] = [];
  annSections: { id: number; name: string }[] = [];
  annSelectedClassId: number | null = null;
  annSelectedSectionId: number | null = null;
  annForm: CreateAnnouncementPayload = {
    title: '',
    content: '',
    targetAudience: 'ALL',
  };

  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bellRead = inject(BellReadStateService);
  private readonly inboxSearch$ = new Subject<void>();
  private readonly subs = new Subscription();
  private inboxReqSeq = 0;

  constructor(
    private comm: CommunicationService,
    private auth: AuthService,
    private academic: AcademicService,
    private notificationService: NotificationService,
    private inboxFeed: InboxUnifiedFeedService
  ) {}

  /** Only school / platform administrators publish announcements; teachers and parents read only. */
  get canPublish(): boolean {
    const r = this.auth.getNormalizedRole();
    return r === 'admin' || r === 'super_admin';
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
    this.comm.createAnnouncement(payload).subscribe({
      next: () => {
        this.isPublishingAnnouncement = false;
        this.announcementPublishInfo = this.translate.instant('inbox.publishSuccess');
        this.showAnnouncementModal = false;
        this.refreshInbox();
      },
      error: (err: { error?: { message?: string } }) => {
        this.isPublishingAnnouncement = false;
        this.announcementPublishInfo = '';
        this.announcementPublishError = err?.error?.message || this.translate.instant('inbox.publishFailed');
      },
    });
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
