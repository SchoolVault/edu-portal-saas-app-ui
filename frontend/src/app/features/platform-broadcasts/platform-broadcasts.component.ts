import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../core/services/platform.service';
import { PlatformSchoolSummary } from '../../core/models/models';

@Component({
  selector: 'app-platform-broadcasts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="platform-bc-root" data-testid="platform-broadcasts-page">
      <div class="platform-bc-inner animate-in">
        <div class="erp-filter-toolbar mb-4">
          <div>
            <div class="badge-erp badge-info mb-2">Platform</div>
            <h2 class="platform-bc-title">Admin broadcasts</h2>
            <p class="text-muted mb-0 platform-bc-lead">
              Reach campus administrators through their in-app notification center—ideal for maintenance windows, policy reminders, or release notes.
            </p>
          </div>
          <div class="erp-filter-toolbar__actions">
            <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="refreshPageData()" [disabled]="loadingSchools || sending">
              <i class="bi bi-arrow-clockwise me-1"></i>{{ loadingSchools ? 'Refreshing...' : 'Refresh' }}
            </button>
            <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm erp-filter-toolbar__action"><i class="bi bi-arrow-left me-1"></i>Platform overview</a>
          </div>
        </div>

        <div class="row g-4 justify-content-center">
          <div class="col-lg-7">
            <div class="erp-card platform-bc-card">
              <div class="erp-card-header platform-bc-card-head">
                <div>
                  <h3 class="erp-card-title mb-1">Compose</h3>
                  <p class="text-muted mb-0" style="font-size: 12px;">Recipients only see this inside their signed-in portal.</p>
                </div>
              </div>
              <div class="platform-bc-form">
                <div class="erp-form-group">
                  <label class="erp-label">Audience</label>
                  <select class="erp-select" [(ngModel)]="targetMode">
                    <option value="all">All campuses — every school workspace</option>
                    <option value="one">One campus — pick a school below</option>
                  </select>
                </div>
                <div class="erp-form-group" *ngIf="targetMode === 'one'">
                  <label class="erp-label">School</label>
                  <select class="erp-select" [(ngModel)]="targetTenantId">
                    <option value="">Select a school…</option>
                    <option *ngFor="let s of schools" [value]="s.tenantId">{{ s.schoolName }} — {{ s.schoolCode }}</option>
                  </select>
                </div>
                <div class="erp-form-group">
                  <label class="erp-label">Title</label>
                  <input type="text" class="erp-input" [(ngModel)]="title" placeholder="Short headline" />
                </div>
                <div class="erp-form-group">
                  <label class="erp-label">Message</label>
                  <textarea class="erp-input erp-textarea" rows="5" [(ngModel)]="message" placeholder="Plain language; admins read this in the notification drawer."></textarea>
                </div>
                <div class="erp-form-group mb-0">
                  <label class="erp-label">Severity</label>
                  <select class="erp-select" [(ngModel)]="notificationType">
                    <option value="INFO">Informational</option>
                    <option value="WARNING">Warning — attention needed</option>
                    <option value="SUCCESS">Positive update</option>
                    <option value="ERROR">Critical / service impact</option>
                  </select>
                </div>
                <div class="platform-bc-actions">
                  <button type="button" class="btn-primary-erp" (click)="openConfirmModal()" [disabled]="sending">
                    <i class="bi bi-send-fill me-2"></i>Review & send
                  </button>
                </div>
                <div *ngIf="resultText" class="alert alert-success py-2 mt-3 mb-0" style="font-size: 13px;">{{ resultText }}</div>
                <div *ngIf="error" class="alert alert-danger py-2 mt-3 mb-0" style="font-size: 13px;">{{ error }}</div>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="erp-card platform-preview-card h-100">
              <h4 class="platform-preview-title">Preview</h4>
              <p class="text-muted" style="font-size: 12px;">Approximate rendering in the admin notification list.</p>
              <div class="platform-preview-shell">
                <div class="platform-preview-row">
                  <span class="platform-preview-dot" [ngClass]="previewToneClass"></span>
                  <div>
                    <div class="platform-preview-headline">{{ title.trim() || 'Title' }}</div>
                    <div class="platform-preview-body">{{ message.trim() || 'Message body will appear here.' }}</div>
                    <div class="platform-preview-meta">Platform · just now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay modal-overlay-viewport" *ngIf="confirmOpen" (click)="confirmOpen = false">
        <div class="modal-content-erp modal-bc" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>Send this broadcast?</h3>
            <button type="button" class="btn-icon" (click)="confirmOpen = false" [attr.aria-label]="'platformUi.closeAlert' | translate"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <ng-container *ngIf="targetMode === 'all'; else oneSchool">
              <p class="mb-2"><strong>Every campus</strong> on the platform will receive an in-app notification for <strong>each</strong> active campus admin account.</p>
              <p class="text-muted mb-0" style="font-size: 13px;">Use for maintenance, security advisories, or product updates. Avoid duplicate sends if you already emailed the same content.</p>
            </ng-container>
            <ng-template #oneSchool>
              <p class="mb-2">Only administrators at <strong>{{ selectedSchoolName }}</strong> will be notified.</p>
              <p class="text-muted mb-0" style="font-size: 13px;">Parents, teachers, and students are not included.</p>
            </ng-template>
            <div class="platform-bc-modal-recap mt-3">
              <div><span class="text-muted">Title</span><br /><strong>{{ title.trim() }}</strong></div>
              <div class="mt-2"><span class="text-muted">Severity</span><br /><strong>{{ notificationType }}</strong></div>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="confirmOpen = false">Back to edit</button>
            <button type="button" class="btn-primary-erp" (click)="confirmSend()" [disabled]="sending">Send notifications</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .platform-bc-root { position: relative; }
    .platform-bc-inner { max-width: 1100px; margin: 0 auto; }
    .platform-bc-title { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .platform-bc-lead { font-size: 13px; max-width: 40rem; line-height: 1.55; }
    .platform-bc-card-head { padding-bottom: 8px; }
    .platform-bc-form { padding: 8px 24px 24px; }
    .platform-bc-actions { margin-top: 24px; }
    .platform-preview-card { padding: 22px 24px; }
    .platform-preview-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--clr-text-muted); margin-bottom: 8px; }
    .platform-preview-shell {
      margin-top: 16px;
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-lg);
      background: var(--clr-surface-alt);
      padding: 16px;
    }
    .platform-preview-row { display: flex; gap: 12px; align-items: flex-start; }
    .platform-preview-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
    .tone-info { background: var(--clr-info); }
    .tone-warn { background: var(--clr-warning); }
    .tone-ok { background: var(--clr-success); }
    .tone-bad { background: var(--clr-danger); }
    .platform-preview-headline { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .platform-preview-body { font-size: 13px; color: var(--clr-text-secondary); line-height: 1.5; white-space: pre-wrap; }
    .platform-preview-meta { font-size: 11px; color: var(--clr-text-muted); margin-top: 10px; }
    .modal-bc { max-width: 480px; width: 100%; }
    .platform-bc-modal-recap { font-size: 13px; padding: 12px 14px; border-radius: var(--radius-md); background: var(--clr-surface-alt); border: 1px solid var(--clr-border-light); }
  `]
})
export class PlatformBroadcastsComponent implements OnInit {
  schools: PlatformSchoolSummary[] = [];
  targetMode: 'all' | 'one' = 'all';
  targetTenantId = '';
  title = 'Scheduled maintenance';
  message = 'We will deploy a platform update tonight. Expect under 5 minutes of read-only mode.';
  notificationType = 'WARNING';
  sending = false;
  loadingSchools = false;
  resultText = '';
  error = '';
  confirmOpen = false;

  constructor(private platform: PlatformService) {}

  ngOnInit(): void {
    this.refreshPageData();
  }

  refreshPageData(): void {
    this.loadingSchools = true;
    this.error = '';
    this.platform.getSchools().subscribe({
      next: s => {
        this.schools = s;
        this.loadingSchools = false;
      },
      error: () => {
        this.error = 'Could not load schools for targeting.';
        this.loadingSchools = false;
      }
    });
  }

  get previewToneClass(): string {
    switch (this.notificationType) {
      case 'WARNING': return 'tone-warn';
      case 'SUCCESS': return 'tone-ok';
      case 'ERROR': return 'tone-bad';
      default: return 'tone-info';
    }
  }

  get selectedSchoolName(): string {
    const s = this.schools.find(x => x.tenantId === this.targetTenantId);
    return s ? `${s.schoolName} (${s.schoolCode})` : 'the selected school';
  }

  openConfirmModal(): void {
    this.error = '';
    this.resultText = '';
    if (this.targetMode === 'one' && !this.targetTenantId) {
      this.error = 'Select a school for a single-campus broadcast.';
      return;
    }
    if (!this.title.trim() || !this.message.trim()) {
      this.error = 'Title and message are required.';
      return;
    }
    this.confirmOpen = true;
  }

  confirmSend(): void {
    this.error = '';
    this.resultText = '';
    this.sending = true;
    this.platform.broadcastToAdmins({
      targetTenantId: this.targetMode === 'one' ? this.targetTenantId : undefined,
      title: this.title.trim(),
      message: this.message.trim(),
      notificationType: this.notificationType
    }).subscribe({
      next: r => {
        this.resultText = `Delivered ${r.notificationRowsCreated} notification(s) across ${r.tenantWorkspacesReached} workspace(s).`;
        this.sending = false;
        this.confirmOpen = false;
      },
      error: e => {
        this.error = e?.message || 'Broadcast failed.';
        this.sending = false;
      }
    });
  }
}
