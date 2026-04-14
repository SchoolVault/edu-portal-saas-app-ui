import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommunicationService, CreateAnnouncementPayload } from '../../core/services/communication.service';
import { AuthService } from '../../core/services/auth.service';
import { AcademicService } from '../../core/services/academic.service';
import { Announcement, SchoolClass } from '../../core/models/models';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { debounceTime } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { runtimeConfig } from '../../core/config/runtime-config';

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
    ErpI18nTextDirective,
  ],
  template: `
    <!-- Modal outside .animate-in: transform on parent breaks position:fixed (backdrop confined to box) -->
    <div data-testid="communication-page" class="communication-page-root">
      <div class="inbox-layout animate-in">
      <div class="inbox-header mb-4 d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'inbox.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'inbox.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="loadAnnouncements()"><i class="bi bi-arrow-clockwise"></i> {{ 'inbox.refresh' | translate }}</button>
          <button
            *ngIf="canPublish"
            type="button"
            class="btn-primary-erp btn-sm"
            (click)="openAnnouncementModal()">
            <i class="bi bi-plus-lg"></i> {{ 'inbox.newAnnouncement' | translate }}
          </button>
        </div>
      </div>

      <div class="animate-in animate-in-delay-1">
        <div *ngIf="annFilteredTotal === 0 && !annSearch" class="erp-card empty-inbox text-center py-5 text-muted">
          <i class="bi bi-megaphone" style="font-size: 2rem"></i>
          <p class="mt-2 mb-0">{{ 'inbox.empty' | translate }}</p>
        </div>
        <div class="row g-2 align-items-end mb-3" *ngIf="annFilteredTotal > 0 || annSearch">
          <div class="col-md-6">
            <label class="erp-label small mb-1" erpI18nText="inbox.searchAnnouncements"></label>
            <input type="search" class="erp-input" erpI18nPh="inbox.searchAnnouncementsPh" [(ngModel)]="annSearch" (ngModelChange)="onAnnSearchChange()" />
          </div>
        </div>
        <p *ngIf="annFilteredTotal === 0 && annSearch" class="text-muted small mb-3">{{ 'inbox.noSearchMatches' | translate }}</p>
        <div *ngFor="let a of pagedAnnouncements" class="erp-card mb-3 inbox-card" [attr.data-testid]="'announcement-' + a.id">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h3 style="font-size: 16px; font-weight: 700; margin: 0;">{{ a.title }}</h3>
            <span class="badge-erp badge-info text-uppercase" style="font-size: 10px">{{ audienceLabel(a) }}</span>
          </div>
          <p class="announcement-preview text-muted" style="font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
            {{ previewBody(a.content) }}
          </p>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2" style="font-size: 12px; color: var(--clr-text-muted);">
            <span><i class="bi bi-person me-1"></i>{{ a.author || ('inbox.authorFallback' | translate) }} <span *ngIf="a.authorRole">({{ a.authorRole }})</span></span>
            <div class="d-flex gap-2 align-items-center">
              <span><i class="bi bi-clock me-1"></i>{{ formatDate(a.createdAt) }}</span>
              <a class="btn-outline-erp btn-xs" [routerLink]="['/app/announcement', a.id]">{{ 'inbox.openFullNotice' | translate }}</a>
            </div>
          </div>
        </div>
        <app-erp-pagination
          *ngIf="annFilteredTotal > 0"
          class="d-block"
          [totalElements]="annFilteredTotal"
          [pageIndex]="annPageIndex"
          [pageSize]="annPageSize"
          (pageIndexChange)="onAnnPageIndex($event)"
          (pageSizeChange)="onAnnPageSize($event)"
        />
      </div>
      </div>

      <div
        class="modal-overlay modal-overlay-viewport"
        *ngIf="showAnnouncementModal"
        (click)="showAnnouncementModal = false">
        <div class="modal-content-erp modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ 'inbox.modalTitle' | translate }}</h3>
            <button class="btn-icon" type="button" (click)="showAnnouncementModal = false"><i class="bi bi-x-lg"></i></button>
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
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="showAnnouncementModal = false">{{ 'inbox.cancel' | translate }}</button>
            <button type="button" class="btn-primary-erp" (click)="publishAnnouncement()" [disabled]="!annForm.title.trim()">{{ 'inbox.publish' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .communication-page-root { position: relative; }
      .inbox-layout { max-width: 1100px; margin: 0 auto; }
      .inbox-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
      .stat-pill { display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 999px; }
      .inbox-card { border-radius: 12px; }
      .announcement-preview { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      .modal-wide { max-width: 520px; width: 100%; }
    `
  ]
})
export class CommunicationComponent implements OnInit {
  readonly useServerPaging = !runtimeConfig.useMocks;

  announcements: Announcement[] = [];
  annSearch = '';
  annPageIndex = 0;
  annPageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedAnnouncements: Announcement[] = [];
  annFilteredTotal = 0;
  showAnnouncementModal = false;
  annClasses: SchoolClass[] = [];
  annSections: { id: number; name: string }[] = [];
  annSelectedClassId: number | null = null;
  annSelectedSectionId: number | null = null;
  annForm: CreateAnnouncementPayload = {
    title: '',
    content: '',
    targetAudience: 'ALL'
  };

  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly annSearch$ = new Subject<void>();
  private readonly subs = new Subscription();
  private annReqSeq = 0;

  constructor(
    private comm: CommunicationService,
    private auth: AuthService,
    private academic: AcademicService
  ) {}

  get canPublish(): boolean {
    const r = this.auth.getRole();
    return r === 'admin' || r === 'teacher';
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.subs.add(
      this.annSearch$.pipe(debounceTime(300)).subscribe(() => {
        if (!this.useServerPaging) return;
        this.annPageIndex = 0;
        this.fetchAnnPage();
      })
    );
    this.destroyRef.onDestroy(() => this.subs.unsubscribe());
    this.loadAnnouncements();
    this.academic.getClasses().subscribe(list => (this.annClasses = list || []));
  }

  loadAnnouncements(): void {
    if (this.useServerPaging) {
      this.annPageIndex = 0;
      this.fetchAnnPage();
      return;
    }
    this.comm.getAnnouncements().subscribe(list => {
      this.announcements = (list || []).map(a => this.normalizeAnnouncement(a));
      this.annPageIndex = 0;
      this.applyAnnPaging();
    });
  }

  private fetchAnnPage(): void {
    const seq = ++this.annReqSeq;
    this.comm
      .getAnnouncementsPage({
        page: this.annPageIndex,
        size: this.annPageSize,
        q: this.annSearch.trim() || undefined,
      })
      .subscribe(p => {
        if (seq !== this.annReqSeq) return;
        this.pagedAnnouncements = p.content;
        this.annFilteredTotal = p.totalElements;
        this.annPageIndex = p.page;
        this.annPageSize = p.size;
        this.cdr.markForCheck();
      });
  }

  private filterAnnouncements(): Announcement[] {
    const q = this.annSearch.trim().toLowerCase();
    if (!q) {
      return this.announcements;
    }
    return this.announcements.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        (a.content || '').toLowerCase().includes(q) ||
        (a.author || '').toLowerCase().includes(q)
    );
  }

  applyAnnPaging(): void {
    const pg = sliceToPage(this.filterAnnouncements(), this.annPageIndex, this.annPageSize);
    this.pagedAnnouncements = pg.content;
    this.annPageIndex = pg.page;
    this.annFilteredTotal = pg.totalElements;
  }

  onAnnSearchChange(): void {
    if (this.useServerPaging) {
      this.annSearch$.next();
    } else {
      this.annPageIndex = 0;
      this.applyAnnPaging();
    }
  }

  onAnnPageIndex(i: number): void {
    this.annPageIndex = i;
    if (this.useServerPaging) this.fetchAnnPage();
    else this.applyAnnPaging();
  }

  onAnnPageSize(s: number): void {
    this.annPageSize = s;
    this.annPageIndex = 0;
    if (this.useServerPaging) this.fetchAnnPage();
    else this.applyAnnPaging();
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

  previewBody(content: string): string {
    if (!content) return '';
    const t = content.replace(/\s+/g, ' ').trim();
    return t.length > 220 ? t.slice(0, 217) + '…' : t;
  }

  onAnnClassChange(): void {
    const cls = this.annClasses.find(c => c.id === this.annSelectedClassId);
    this.annSections = cls ? cls.sections.map(s => ({ id: s.id, name: s.name })) : [];
    this.annSelectedSectionId = null;
  }

  openAnnouncementModal(): void {
    this.annForm = {
      title: '',
      content: '',
      targetAudience: 'ALL'
    };
    this.annSelectedClassId = null;
    this.annSelectedSectionId = null;
    this.annSections = [];
    this.showAnnouncementModal = true;
  }

  publishAnnouncement(): void {
    let targetClassId: number | undefined;
    let targetSectionId: number | undefined;
    if (this.annForm.targetAudience === 'CLASS' || this.annForm.targetAudience === 'SECTION') {
      targetClassId = this.annSelectedClassId ?? undefined;
    }
    if (this.annForm.targetAudience === 'SECTION') {
      targetSectionId = this.annSelectedSectionId ?? undefined;
    }
    const payload: CreateAnnouncementPayload = {
      title: this.annForm.title.trim(),
      content: this.annForm.content,
      targetAudience: this.annForm.targetAudience,
      targetClassId,
      targetSectionId
    };
    this.comm.createAnnouncement(payload).subscribe(() => {
      this.showAnnouncementModal = false;
      this.loadAnnouncements();
    });
  }

  audienceLabel(a: Announcement): string {
    const v = (a.targetAudience || 'all').toUpperCase();
    const key = `inbox.badge${v}`;
    const t = this.translate.instant(key);
    return t !== key ? t : v;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const lang = this.translate.currentLang || 'en';
    return new Date(dateStr).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
