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

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, SchoolClassNamePipe],
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
        <div *ngIf="announcements.length === 0" class="erp-card empty-inbox text-center py-5 text-muted">
          <i class="bi bi-megaphone" style="font-size: 2rem"></i>
          <p class="mt-2 mb-0">{{ 'inbox.empty' | translate }}</p>
        </div>
        <div *ngFor="let a of announcements" class="erp-card mb-3 inbox-card" [attr.data-testid]="'announcement-' + a.id">
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
  announcements: Announcement[] = [];
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
    this.loadAnnouncements();
    this.academic.getClasses().subscribe(list => (this.annClasses = list || []));
  }

  loadAnnouncements(): void {
    this.comm.getAnnouncements().subscribe(list => {
      this.announcements = (list || []).map(a => this.normalizeAnnouncement(a));
    });
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
