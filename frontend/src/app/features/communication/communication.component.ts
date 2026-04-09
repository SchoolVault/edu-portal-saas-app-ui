import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommunicationService, CreateAnnouncementPayload } from '../../core/services/communication.service';
import { AuthService } from '../../core/services/auth.service';
import { AcademicService } from '../../core/services/academic.service';
import { Announcement, SchoolClass } from '../../core/models/models';

@Component({
  selector: 'app-communication',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Modal outside .animate-in: transform on parent breaks position:fixed (backdrop confined to box) -->
    <div data-testid="communication-page" class="communication-page-root">
      <div class="inbox-layout animate-in">
      <div class="inbox-header mb-4 d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Announcements</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            Official school notices. Use <strong>Messages</strong> in the sidebar for chats.
          </p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="loadAnnouncements()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          <button
            *ngIf="canPublish"
            type="button"
            class="btn-primary-erp btn-sm"
            (click)="openAnnouncementModal()">
            <i class="bi bi-plus-lg"></i> New announcement
          </button>
        </div>
      </div>

      <div class="animate-in animate-in-delay-1">
        <div *ngIf="announcements.length === 0" class="erp-card empty-inbox text-center py-5 text-muted">
          <i class="bi bi-megaphone" style="font-size: 2rem"></i>
          <p class="mt-2 mb-0">No announcements yet.</p>
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
            <span><i class="bi bi-person me-1"></i>{{ a.author || 'School' }} <span *ngIf="a.authorRole">({{ a.authorRole }})</span></span>
            <div class="d-flex gap-2 align-items-center">
              <span><i class="bi bi-clock me-1"></i>{{ formatDate(a.createdAt) }}</span>
              <a class="btn-outline-erp btn-xs" [routerLink]="['/app/announcement', a.id]">Open full notice</a>
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
            <h3>Publish announcement</h3>
            <button class="btn-icon" type="button" (click)="showAnnouncementModal = false"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="erp-form-group">
              <label class="erp-label">Title</label>
              <input type="text" class="erp-input" [(ngModel)]="annForm.title" />
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Message</label>
              <textarea class="erp-input erp-textarea" rows="5" [(ngModel)]="annForm.content"></textarea>
            </div>
            <div class="erp-form-group">
              <label class="erp-label">Who should see this?</label>
              <select class="erp-select" [(ngModel)]="annForm.targetAudience">
                <option value="ALL">Everyone</option>
                <option value="TEACHERS">Teachers only</option>
                <option value="PARENTS">Parents only</option>
                <option value="CLASS">Specific class</option>
                <option value="SECTION">Specific section</option>
              </select>
            </div>
            <div class="erp-form-group" *ngIf="annForm.targetAudience === 'CLASS' || annForm.targetAudience === 'SECTION'">
              <label class="erp-label">Class</label>
              <select class="erp-select" [(ngModel)]="annSelectedClassId" (ngModelChange)="onAnnClassChange()">
                <option value="">Select class</option>
                <option *ngFor="let c of annClasses" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="erp-form-group" *ngIf="annForm.targetAudience === 'SECTION'">
              <label class="erp-label">Section</label>
              <select class="erp-select" [(ngModel)]="annSelectedSectionId" [disabled]="!annSections.length">
                <option value="">{{ annSections.length ? 'Select section' : 'No sections for this class' }}</option>
                <option *ngFor="let s of annSections" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="showAnnouncementModal = false">Cancel</button>
            <button type="button" class="btn-primary-erp" (click)="publishAnnouncement()" [disabled]="!annForm.title.trim()">Publish</button>
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
  annSections: { id: string; name: string }[] = [];
  annSelectedClassId = '';
  annSelectedSectionId = '';
  annForm: CreateAnnouncementPayload = {
    title: '',
    content: '',
    targetAudience: 'ALL'
  };

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
    this.annSelectedSectionId = '';
  }

  openAnnouncementModal(): void {
    this.annForm = {
      title: '',
      content: '',
      targetAudience: 'ALL'
    };
    this.annSelectedClassId = '';
    this.annSelectedSectionId = '';
    this.annSections = [];
    this.showAnnouncementModal = true;
  }

  publishAnnouncement(): void {
    let targetClassId: number | undefined;
    let targetSectionId: number | undefined;
    if (this.annForm.targetAudience === 'CLASS' || this.annForm.targetAudience === 'SECTION') {
      const cid = Number(this.annSelectedClassId);
      targetClassId = Number.isFinite(cid) ? cid : undefined;
    }
    if (this.annForm.targetAudience === 'SECTION') {
      const sid = Number(this.annSelectedSectionId);
      targetSectionId = Number.isFinite(sid) ? sid : undefined;
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
    const labels: Record<string, string> = {
      ALL: 'Everyone',
      TEACHERS: 'Teachers',
      PARENTS: 'Parents',
      CLASS: 'Class',
      SECTION: 'Section'
    };
    return labels[v] || v;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
