import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlatformService } from '../../core/services/platform.service';
import { PlatformPurgeJob, PlatformSchoolDetail, PlatformSchoolSummary } from '../../core/models/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-platform-schools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="platform-schools-root" data-testid="platform-schools-page">
      <div class="platform-page-inner animate-in">
        <div class="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
          <div>
            <div class="badge-erp badge-info mb-2">Platform</div>
            <h2 class="platform-page-title">School directory</h2>
            <p class="text-muted mb-0 platform-page-lead">
              Operate each workspace: metrics, campus admins, suspension, and irreversible tenant data removal (async job).
            </p>
          </div>
          <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm"><i class="bi bi-arrow-left me-1"></i>Platform overview</a>
        </div>

        <div *ngIf="loadError" class="alert alert-danger py-2 mb-3">{{ loadError }}</div>
        <div *ngIf="actionMessage" class="alert alert-success py-2 mb-3">{{ actionMessage }}</div>
        <div *ngIf="actionError" class="alert alert-danger py-2 mb-3">{{ actionError }}</div>

        <div class="row g-4 align-items-start">
          <div class="col-lg-5">
            <div class="erp-card platform-card">
              <div class="erp-card-header platform-card-header">
                <h3 class="erp-card-title mb-0">Workspaces</h3>
                <span class="text-muted" style="font-size: 12px;">{{ schools.length }} schools</span>
              </div>
              <div class="platform-table-wrap">
                <table class="erp-table platform-table mb-0">
                  <thead>
                    <tr><th>School</th><th>Roll-up</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let s of schools"
                        (click)="select(s)"
                        class="platform-table-row"
                        [class.platform-table-row-active]="selected?.tenantId === s.tenantId">
                      <td>
                        <div class="fw-bold">{{ s.schoolName }}</div>
                        <div class="platform-muted-xs">{{ s.schoolCode }}</div>
                      </td>
                      <td class="platform-muted-sm">
                        {{ s.studentCount | number }} stu · {{ s.teacherCount }} tch · {{ s.adminCount }} adm
                      </td>
                      <td>
                        <span class="badge-erp" [ngClass]="s.active ? 'badge-success' : 'badge-warning'">
                          {{ s.active ? 'Active' : 'Suspended' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="col-lg-7">
            <div class="erp-card platform-card platform-detail-card">
              <div class="erp-card-header platform-card-header">
                <h3 class="erp-card-title mb-0">Workspace detail</h3>
              </div>

              <div *ngIf="!selected" class="empty-state" style="padding: 48px 24px;">
                <i class="bi bi-building"></i>
                <h3>Select a school</h3>
                <p>Metrics, admins, and lifecycle actions appear here.</p>
              </div>

              <div *ngIf="selected && detailLoading" class="platform-detail-body text-muted">Loading…</div>

              <div *ngIf="selected && !detailLoading && detail" class="platform-detail-body">
                <div class="platform-hero" [style.border-left-color]="detail.school.primaryColor || 'var(--clr-primary)'">
                  <div class="d-flex flex-wrap justify-content-between gap-2 align-items-start">
                    <div>
                      <h4 class="platform-hero-title">{{ detail.school.schoolName }}</h4>
                      <p class="platform-muted-sm mb-1">
                        <i class="bi bi-envelope me-1"></i>{{ detail.school.email || '—' }}
                        <span class="mx-2">·</span>
                        <i class="bi bi-telephone me-1"></i>{{ detail.school.phone || '—' }}
                      </p>
                      <p class="platform-muted-xs mb-0" *ngIf="detail.school.address">{{ detail.school.address }}</p>
                    </div>
                    <div class="d-flex flex-wrap gap-2 align-items-center">
                      <span class="platform-pill">{{ detail.subscriptionPlanCode }}</span>
                      <span class="platform-pill platform-pill-muted">{{ detail.subscriptionStatus }}</span>
                    </div>
                  </div>
                </div>

                <div class="platform-stat-grid">
                  <div class="platform-stat-tile">
                    <div class="platform-stat-icon"><i class="bi bi-people-fill"></i></div>
                    <div class="platform-stat-value">{{ detail.school.studentCount | number }}</div>
                    <div class="platform-stat-label">Students</div>
                  </div>
                  <div class="platform-stat-tile">
                    <div class="platform-stat-icon"><i class="bi bi-person-badge-fill"></i></div>
                    <div class="platform-stat-value">{{ detail.school.teacherCount | number }}</div>
                    <div class="platform-stat-label">Teachers</div>
                  </div>
                  <div class="platform-stat-tile">
                    <div class="platform-stat-icon"><i class="bi bi-shield-lock-fill"></i></div>
                    <div class="platform-stat-value">{{ detail.school.adminCount | number }}</div>
                    <div class="platform-stat-label">Admins</div>
                  </div>
                  <div class="platform-stat-tile">
                    <div class="platform-stat-icon"><i class="bi bi-person-vcard-fill"></i></div>
                    <div class="platform-stat-value">{{ detail.parentUserCount | number }}</div>
                    <div class="platform-stat-label">Parent accounts</div>
                  </div>
                </div>

                <div class="platform-actions">
                  <button type="button" class="btn-outline-erp btn-sm" (click)="openSuspendModal()" [disabled]="busy || !detail.school.active">
                    <i class="bi bi-pause-circle me-1"></i>Suspend workspace
                  </button>
                  <button type="button" class="btn-outline-erp btn-sm" (click)="openActivateModal()" [disabled]="busy || detail.school.active">
                    <i class="bi bi-play-circle me-1"></i>Activate workspace
                  </button>
                  <button type="button" class="btn-outline-erp btn-sm" (click)="refreshDetail()" [disabled]="busy">
                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh
                  </button>
                </div>

                <div class="platform-section">
                  <h5 class="platform-section-title">Campus admins</h5>
                  <div class="platform-table-wrap">
                    <table class="erp-table platform-table mb-0">
                      <thead>
                        <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let a of detail.admins">
                          <td class="fw-semibold">{{ a.name }}</td>
                          <td class="platform-muted-sm">{{ a.email }}</td>
                          <td>
                            <span class="badge-erp" [ngClass]="a.active ? 'badge-success' : 'badge-warning'">
                              {{ a.active ? 'Active' : 'Inactive' }}
                            </span>
                          </td>
                        </tr>
                        <tr *ngIf="detail.admins.length === 0">
                          <td colspan="3" class="text-muted platform-muted-sm">No campus admins listed.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="platform-section" *ngIf="detail.school.active">
                  <div class="platform-info-panel">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Data purge</strong> is locked while the workspace is active. Suspend the school first; then you can start the deletion workflow with explicit confirmations.
                  </div>
                </div>

                <div class="platform-section" *ngIf="!detail.school.active">
                  <h5 class="platform-section-title text-danger">Permanent data removal</h5>
                  <div class="platform-danger-panel">
                    <p class="mb-2"><strong>This is not archival.</strong> Queuing a purge starts an asynchronous job that removes this tenant’s academic, financial, and user data from the platform database. Other schools are not affected.</p>
                    <ul class="platform-danger-list mb-3">
                      <li>No automatic backup is created by this action.</li>
                      <li>Recovery typically requires restoring from your own database backups, if they exist.</li>
                      <li>All users for this school remain unable to sign in until the row is removed.</li>
                    </ul>
                    <button type="button" class="btn-danger-erp btn-sm" (click)="openPurgeModal()" [disabled]="busy">
                      <i class="bi bi-exclamation-octagon me-1"></i>Start deletion workflow…
                    </button>
                  </div>
                </div>

                <div class="platform-section" *ngIf="purgeJobs.length">
                  <h5 class="platform-section-title">Recent purge jobs</h5>
                  <ul class="platform-job-list mb-0">
                    <li *ngFor="let j of purgeJobs">
                      <span class="badge-erp badge-info text-uppercase" style="font-size: 10px;">{{ j.status }}</span>
                      <span *ngIf="j.rowsDeletedEstimate" class="platform-muted-sm ms-2">~{{ j.rowsDeletedEstimate | number }} rows affected</span>
                      <span *ngIf="j.errorMessage" class="text-danger ms-2">{{ j.errorMessage }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Suspend -->
      <div class="modal-overlay modal-overlay-viewport" *ngIf="suspendModalOpen" (click)="closeSuspendModal()">
        <div class="modal-content-erp modal-narrow" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>Suspend workspace?</h3>
            <button type="button" class="btn-icon" (click)="closeSuspendModal()" aria-label="Close"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="mb-2">All user accounts in <strong>{{ detail?.school?.schoolName }}</strong> will be deactivated immediately. Nobody from this school can sign in until you activate the workspace again and re-enable individuals.</p>
            <p class="text-muted mb-0" style="font-size: 13px;">Billing and subscription changes are handled separately in your commercial workflow.</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeSuspendModal()">Cancel</button>
            <button type="button" class="btn-primary-erp" (click)="confirmSuspend()" [disabled]="busy">Suspend workspace</button>
          </div>
        </div>
      </div>

      <!-- Activate -->
      <div class="modal-overlay modal-overlay-viewport" *ngIf="activateModalOpen" (click)="closeActivateModal()">
        <div class="modal-content-erp modal-narrow" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>Activate workspace?</h3>
            <button type="button" class="btn-icon" (click)="closeActivateModal()" aria-label="Close"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="mb-0">The school may resume operations at the platform level. <strong>Campus admins stay inactive</strong> until you turn each account back on—this avoids surprise access after a suspension.</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeActivateModal()">Cancel</button>
            <button type="button" class="btn-primary-erp" (click)="confirmActivate()" [disabled]="busy">Activate workspace</button>
          </div>
        </div>
      </div>

      <!-- Purge -->
      <div class="modal-overlay modal-overlay-viewport" *ngIf="purgeModalOpen" (click)="closePurgeModal()">
        <div class="modal-content-erp modal-purge" (click)="$event.stopPropagation()">
          <div class="modal-header-erp border-danger" style="border-bottom-width: 2px;">
            <h3 class="text-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>Confirm permanent deletion</h3>
            <button type="button" class="btn-icon" (click)="closePurgeModal()" aria-label="Close"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="fw-semibold mb-2">You are about to queue a hard delete for <strong>{{ detail?.school?.schoolName }}</strong> (code <strong>{{ detail?.school?.schoolCode }}</strong>).</p>
            <ul class="platform-danger-list mb-3">
              <li>All operational data for this tenant will be removed from the application database.</li>
              <li>There is <strong>no in-app undo</strong> and <strong>no platform-managed backup</strong> from this button.</li>
              <li>If you need retention for compliance, stop and export or backup through your DBA <em>before</em> proceeding.</li>
            </ul>
            <div class="erp-form-group mb-3">
              <label class="erp-label">Type the school code to confirm</label>
              <input type="text" class="erp-input" [(ngModel)]="purgeModalCode" autocomplete="off" [placeholder]="detail?.school?.schoolCode || ''" />
            </div>
            <label class="platform-check d-flex align-items-start gap-2">
              <input type="checkbox" [(ngModel)]="purgeUnderstand" class="mt-1" />
              <span>I understand this action is irreversible, data will be gone from this environment, and I am authorized to proceed.</span>
            </label>
            <p *ngIf="purgeModalError" class="text-danger mt-3 mb-0" style="font-size: 13px;">{{ purgeModalError }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closePurgeModal()">Cancel</button>
            <button type="button" class="btn-danger-erp" (click)="confirmPurgeFromModal()" [disabled]="busy">Queue purge job</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .platform-schools-root { position: relative; }
    .platform-page-inner { max-width: 1200px; margin: 0 auto; }
    .platform-page-title { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .platform-page-lead { font-size: 13px; max-width: 52rem; line-height: 1.5; }
    .platform-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .platform-detail-card { min-height: 480px; }
    .platform-detail-body { padding: 24px; }
    .platform-muted-xs { font-size: 12px; color: var(--clr-text-muted); }
    .platform-muted-sm { font-size: 13px; color: var(--clr-text-muted); }
    .platform-table-wrap { overflow-x: auto; }
    .platform-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--clr-text-muted); }
    .platform-table-row { cursor: pointer; transition: background 0.15s ease; }
    .platform-table-row:hover { background: var(--clr-hover); }
    .platform-table-row-active { background: var(--clr-surface-alt) !important; }
    .platform-hero {
      border-left: 4px solid var(--clr-primary);
      padding: 16px 18px;
      background: var(--clr-surface-alt);
      border-radius: var(--radius-lg);
      margin-bottom: 20px;
    }
    .platform-hero-title { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
    .platform-pill {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
      padding: 6px 12px; border-radius: 999px;
      background: rgba(27, 58, 48, 0.12); color: var(--clr-primary);
    }
    .platform-pill-muted { background: var(--clr-border-light); color: var(--clr-text-muted); }
    .platform-stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (max-width: 767px) {
      .platform-stat-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .platform-stat-tile {
      border: 1px solid var(--clr-border-light);
      border-radius: var(--radius-lg);
      padding: 14px 12px;
      text-align: center;
      background: var(--clr-surface);
    }
    .platform-stat-icon { color: var(--clr-accent); font-size: 1.25rem; margin-bottom: 6px; }
    .platform-stat-value { font-size: 1.35rem; font-weight: 800; line-height: 1.2; }
    .platform-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--clr-text-muted); margin-top: 4px; }
    .platform-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
    .platform-section { margin-bottom: 24px; }
    .platform-section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; color: var(--clr-text-muted); }
    .platform-info-panel {
      font-size: 13px;
      padding: 14px 16px;
      border-radius: var(--radius-lg);
      background: rgba(2, 132, 199, 0.08);
      border: 1px solid rgba(2, 132, 199, 0.25);
      display: flex;
      align-items: flex-start;
    }
    .platform-danger-panel {
      border: 1px solid rgba(220, 38, 38, 0.35);
      background: rgba(220, 38, 38, 0.06);
      border-radius: var(--radius-lg);
      padding: 16px 18px;
      font-size: 14px;
      line-height: 1.55;
    }
    .platform-danger-list { padding-left: 1.2rem; margin: 0; font-size: 13px; }
    .platform-danger-list li { margin-bottom: 6px; }
    .platform-job-list { list-style: none; padding: 0; margin: 0; font-size: 13px; }
    .platform-job-list li { padding: 8px 0; border-bottom: 1px solid var(--clr-border-light); }
    .platform-job-list li:last-child { border-bottom: none; }
    .platform-check { font-size: 13px; line-height: 1.45; cursor: pointer; }
    .modal-narrow { max-width: 480px; width: 100%; }
    .modal-purge { max-width: 520px; width: 100%; }
  `]
})
export class PlatformSchoolsComponent implements OnInit {
  schools: PlatformSchoolSummary[] = [];
  selected: PlatformSchoolSummary | null = null;
  detail: PlatformSchoolDetail | null = null;
  detailLoading = false;
  purgeJobs: PlatformPurgeJob[] = [];
  busy = false;
  loadError = '';
  actionMessage = '';
  actionError = '';

  suspendModalOpen = false;
  activateModalOpen = false;
  purgeModalOpen = false;
  purgeModalCode = '';
  purgeUnderstand = false;
  purgeModalError = '';

  constructor(private platform: PlatformService) {}

  ngOnInit(): void {
    this.platform.getSchools().subscribe({
      next: list => { this.schools = list; },
      error: e => { this.loadError = e?.message || 'Could not load schools.'; }
    });
  }

  select(s: PlatformSchoolSummary): void {
    this.clearFeedback();
    this.selected = s;
    this.refreshDetail();
  }

  refreshDetail(): void {
    if (!this.selected) {
      return;
    }
    this.detailLoading = true;
    this.detail = null;
    forkJoin({
      detail: this.platform.getSchoolDetail(this.selected.tenantId),
      jobs: this.platform.listPurgeJobs(this.selected.tenantId)
    }).subscribe({
      next: ({ detail, jobs }) => {
        this.detail = detail;
        this.purgeJobs = jobs;
        this.detailLoading = false;
      },
      error: e => {
        this.detailLoading = false;
        this.actionError = e?.message || 'Could not load school detail.';
      }
    });
  }

  openSuspendModal(): void {
    this.suspendModalOpen = true;
  }
  closeSuspendModal(): void {
    this.suspendModalOpen = false;
  }
  confirmSuspend(): void {
    if (!this.selected) return;
    this.clearFeedback();
    this.busy = true;
    this.platform.suspendSchoolWorkspace(this.selected.tenantId).subscribe({
      next: () => {
        this.actionMessage = 'Workspace suspended; all users in this tenant were deactivated.';
        this.busy = false;
        this.closeSuspendModal();
        this.patchSelectedActive(false);
        this.refreshDetail();
      },
      error: e => { this.actionError = e?.message || 'Suspend failed'; this.busy = false; }
    });
  }

  openActivateModal(): void {
    this.activateModalOpen = true;
  }
  closeActivateModal(): void {
    this.activateModalOpen = false;
  }
  confirmActivate(): void {
    if (!this.selected) return;
    this.clearFeedback();
    this.busy = true;
    this.platform.activateSchoolWorkspace(this.selected.tenantId).subscribe({
      next: () => {
        this.actionMessage = 'Workspace activated. Re-enable campus admins individually as needed.';
        this.busy = false;
        this.closeActivateModal();
        this.patchSelectedActive(true);
        this.refreshDetail();
      },
      error: e => { this.actionError = e?.message || 'Activate failed'; this.busy = false; }
    });
  }

  openPurgeModal(): void {
    this.purgeModalCode = '';
    this.purgeUnderstand = false;
    this.purgeModalError = '';
    this.purgeModalOpen = true;
  }
  closePurgeModal(): void {
    this.purgeModalOpen = false;
    this.purgeModalError = '';
  }

  confirmPurgeFromModal(): void {
    this.purgeModalError = '';
    if (!this.selected || !this.detail) return;
    if (!this.purgeUnderstand) {
      this.purgeModalError = 'Please confirm that you understand this action is irreversible.';
      return;
    }
    const expected = (this.detail.school.schoolCode || '').trim().toUpperCase();
    const got = (this.purgeModalCode || '').trim().toUpperCase();
    if (!got || got !== expected) {
      this.purgeModalError = 'School code does not match. Type it exactly as shown for this school.';
      return;
    }
    this.clearFeedback();
    this.busy = true;
    this.platform.requestTenantDataPurge(this.selected.tenantId, this.purgeModalCode.trim()).subscribe({
      next: () => {
        this.actionMessage = 'Purge job queued. Status updates appear below; allow a few seconds then refresh.';
        this.busy = false;
        this.closePurgeModal();
        setTimeout(() => this.refreshDetail(), 1800);
      },
      error: e => {
        this.actionError = e?.message || 'Purge request failed';
        this.busy = false;
      }
    });
  }

  private patchSelectedActive(active: boolean): void {
    const s = this.schools.find(x => x.tenantId === this.selected?.tenantId);
    if (s) s.active = active;
    if (this.selected) this.selected = { ...this.selected, active };
  }

  private clearFeedback(): void {
    this.actionMessage = '';
    this.actionError = '';
  }
}
