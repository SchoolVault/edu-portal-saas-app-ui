import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlatformService } from '../../core/services/platform.service';
import { PlatformPurgeJob, PlatformSchoolDetail, PlatformSchoolSummary } from '../../core/models/models';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';

@Component({
  selector: 'app-platform-schools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, ErpPaginationComponent],
  template: `
    <div class="platform-schools-root platform-shell" data-testid="platform-schools-page">
      <div class="platform-page-inner animate-in">
        <div class="erp-filter-toolbar mb-4">
          <div>
            <div class="badge-erp badge-info mb-2">{{ 'platformSchools.badge' | translate }}</div>
            <h2 class="platform-page-title">{{ 'platformSchools.pageTitle' | translate }}</h2>
            <p class="text-muted mb-0 platform-page-lead">{{ 'platformSchools.lead' | translate }}</p>
          </div>
          <div class="erp-filter-toolbar__actions">
            <button type="button" class="btn-outline-erp btn-sm" (click)="refreshPageData()" [disabled]="detailLoading || purgeHistoryLoading || busy">
              <i class="bi bi-arrow-clockwise me-1"></i>{{ 'platformSchools.actions.refresh' | translate }}
            </button>
            <a routerLink="/app/super-admin" class="btn-outline-erp btn-sm"><i class="bi bi-arrow-left me-1"></i>{{ 'platformSchools.backOverview' | translate }}</a>
          </div>
        </div>

        <div *ngIf="loadError" class="alert alert-danger py-2 mb-3">{{ loadError }}</div>
        <div *ngIf="actionMessage" class="alert alert-success py-2 mb-3">{{ actionMessage }}</div>
        <div *ngIf="actionError" class="alert alert-danger py-2 mb-3">{{ actionError }}</div>

        <div class="row g-4 align-items-start platform-main-grid">
          <div class="col-lg-5">
            <div class="erp-card platform-card platform-card-elevated h-100">
              <div class="erp-card-header platform-card-header flex-wrap gap-2">
                <div>
                  <h3 class="erp-card-title mb-0">{{ 'platformSchools.workspaces' | translate }}</h3>
                  <span class="text-muted" style="font-size: 12px;">{{ 'platformSchools.schoolsCount' | translate: { count: schoolsTotal } }}</span>
                </div>
              </div>
              <div class="px-3 pt-2 pb-0">
                <label class="erp-label small mb-1">{{ 'platformSchools.search' | translate }}</label>
                <input type="search" class="erp-input" style="max-width: 360px;" [(ngModel)]="schoolSearchInput" (ngModelChange)="schoolSearch$.next($event)" [placeholder]="'platformSchools.searchPh' | translate" />
              </div>
              <div class="platform-table-wrap">
                <table class="erp-table platform-table mb-0">
                  <thead>
                    <tr><th>{{ 'platformSchools.thSchool' | translate }}</th><th>{{ 'platformSchools.thRollup' | translate }}</th><th>{{ 'platformSchools.thStatus' | translate }}</th></tr>
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
                        <span class="platform-rollup-text">{{ formatWorkspaceRollup(s) }}</span>
                      </td>
                      <td>
                        <span class="badge-erp" [ngClass]="s.active ? 'badge-success' : 'badge-warning'">
                          {{ s.active ? ('platformSchools.active' | translate) : ('platformSchools.suspended' | translate) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <app-erp-pagination
                *ngIf="schoolsTotal > 0"
                class="d-block px-3 pb-3"
                [totalElements]="schoolsTotal"
                [pageIndex]="schoolPageIndex"
                [pageSize]="schoolPageSize"
                (pageIndexChange)="onSchoolPageIndex($event)"
                (pageSizeChange)="onSchoolPageSize($event)"
              />
            </div>
          </div>

          <div class="col-lg-7">
            <div class="erp-card platform-card platform-card-elevated platform-detail-card h-100">
              <div class="erp-card-header platform-card-header">
                <h3 class="erp-card-title mb-0">{{ 'platformSchools.detailTitle' | translate }}</h3>
              </div>

              <div *ngIf="!selected" class="empty-state" style="padding: 48px 24px;">
                <i class="bi bi-building"></i>
                <h3>{{ 'platformSchools.emptyTitle' | translate }}</h3>
                <p>{{ 'platformSchools.emptyLead' | translate }}</p>
              </div>

              <div *ngIf="selected && detailLoading" class="platform-detail-body text-muted">{{ 'platformSchools.loading' | translate }}</div>

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
                    <div class="platform-stat-label">{{ 'platformSchools.stats.students' | translate }}</div>
                  </div>
                  <div class="platform-stat-tile">
                    <div class="platform-stat-icon"><i class="bi bi-person-badge-fill"></i></div>
                    <div class="platform-stat-value">{{ detail.school.teacherCount | number }}</div>
                    <div class="platform-stat-label">{{ 'platformSchools.stats.teachers' | translate }}</div>
                  </div>
                  <div class="platform-stat-tile">
                    <div class="platform-stat-icon"><i class="bi bi-shield-lock-fill"></i></div>
                    <div class="platform-stat-value">{{ detail.school.adminCount | number }}</div>
                    <div class="platform-stat-label">{{ 'platformSchools.stats.admins' | translate }}</div>
                  </div>
                  <div class="platform-stat-tile">
                    <div class="platform-stat-icon"><i class="bi bi-person-vcard-fill"></i></div>
                    <div class="platform-stat-value">{{ detail.parentUserCount | number }}</div>
                    <div class="platform-stat-label">{{ 'platformSchools.stats.parentAccounts' | translate }}</div>
                  </div>
                </div>

                <div class="platform-actions">
                  <button type="button" class="btn-outline-erp btn-sm" (click)="openSuspendModal()" [disabled]="busy || !detail.school.active">
                    <i class="bi bi-pause-circle me-1"></i>{{ 'platformSchools.actions.suspend' | translate }}
                  </button>
                  <button type="button" class="btn-outline-erp btn-sm" (click)="openActivateModal()" [disabled]="busy || detail.school.active">
                    <i class="bi bi-play-circle me-1"></i>{{ 'platformSchools.actions.activate' | translate }}
                  </button>
                  <button type="button" class="btn-outline-erp btn-sm" (click)="refreshDetail()" [disabled]="busy">
                    <i class="bi bi-arrow-clockwise me-1"></i>{{ 'platformSchools.actions.refresh' | translate }}
                  </button>
                </div>

                <div class="platform-section">
                  <h5 class="platform-section-title">{{ 'platformSchools.adminsTitle' | translate }}</h5>
                  <div class="platform-table-wrap">
                    <table class="erp-table platform-table mb-0">
                      <thead>
                        <tr><th>{{ 'platformSchools.adminCols.name' | translate }}</th><th>{{ 'platformSchools.adminCols.email' | translate }}</th><th>{{ 'platformSchools.adminCols.status' | translate }}</th></tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let a of detail.admins">
                          <td class="fw-semibold">{{ a.name }}</td>
                          <td class="platform-muted-sm">{{ a.email }}</td>
                          <td>
                            <span class="badge-erp" [ngClass]="a.active ? 'badge-success' : 'badge-warning'">
                              {{ a.active ? ('platformSchools.active' | translate) : ('platformSchools.inactive' | translate) }}
                            </span>
                          </td>
                        </tr>
                        <tr *ngIf="detail.admins.length === 0">
                          <td colspan="3" class="text-muted platform-muted-sm">{{ 'platformSchools.noAdmins' | translate }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div class="platform-section" *ngIf="detail.school.active">
                  <div class="platform-info-panel">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>{{ 'platformSchools.purge.lockedTitle' | translate }}</strong> {{ 'platformSchools.purge.lockedLead' | translate }}
                  </div>
                </div>

                <div class="platform-section" *ngIf="!detail.school.active">
                  <h5 class="platform-section-title text-danger">{{ 'platformSchools.purge.title' | translate }}</h5>
                  <div class="platform-danger-panel">
                    <p class="mb-2"><strong>{{ 'platformSchools.purge.notArchiveTitle' | translate }}</strong> {{ 'platformSchools.purge.notArchiveLead' | translate }}</p>
                    <ul class="platform-danger-list mb-3">
                      <li>{{ 'platformSchools.purge.warning1' | translate }}</li>
                      <li>{{ 'platformSchools.purge.warning2' | translate }}</li>
                      <li>{{ 'platformSchools.purge.warning3' | translate }}</li>
                    </ul>
                    <button type="button" class="btn-danger-erp btn-sm" (click)="openPurgeModal()" [disabled]="busy">
                      <i class="bi bi-exclamation-octagon me-1"></i>{{ 'platformSchools.purge.startWorkflow' | translate }}
                    </button>
                  </div>
                </div>

                <div class="platform-section" *ngIf="purgeJobs.length">
                  <h5 class="platform-section-title">{{ 'platformSchools.purge.recentJobs' | translate }}</h5>
                  <ul class="platform-job-list mb-0">
                    <li *ngFor="let j of purgeJobs"
                        (click)="selectedPurgeJob = j"
                        [class.platform-job-list-active]="selectedPurgeJob?.id === j.id">
                      <span class="badge-erp badge-info text-uppercase" style="font-size: 10px;">{{ j.status }}</span>
                      <span class="platform-muted-xs ms-2" *ngIf="j.createdAt">{{ j.createdAt | date: 'medium' }}</span>
                      <span *ngIf="j.rowsDeletedEstimate" class="platform-muted-sm ms-2">{{ 'platformSchools.purge.rowsAffected' | translate: { rows: (j.rowsDeletedEstimate | number) } }}</span>
                      <span *ngIf="j.errorMessage" class="text-danger ms-2">{{ j.errorMessage }}</span>
                    </li>
                  </ul>
                </div>
                <div class="platform-section" *ngIf="selectedPurgeJob">
                  <h5 class="platform-section-title">{{ 'platformSchools.purge.jobDetails' | translate }}</h5>
                  <div class="platform-info-panel">
                    <div class="platform-impact-grid">
                      <div><strong>{{ 'platformSchools.purge.duration' | translate }}:</strong> {{ formatDurationMs(selectedPurgeJob.executionDurationMs) }}</div>
                      <div><strong>{{ 'platformSchools.purge.startedAt' | translate }}:</strong> {{ selectedPurgeJob.startedAt ? (selectedPurgeJob.startedAt | date: 'medium') : '—' }}</div>
                      <div><strong>{{ 'platformSchools.purge.completedAt' | translate }}:</strong> {{ selectedPurgeJob.completedAt ? (selectedPurgeJob.completedAt | date: 'medium') : '—' }}</div>
                      <div><strong>{{ 'platformSchools.purge.initiatedBy' | translate }}:</strong> {{ selectedPurgeJob.requestedByDisplayName || selectedPurgeJob.requestedByPrincipal || '—' }}</div>
                      <div><strong>{{ 'platformSchools.purge.role' | translate }}:</strong> {{ selectedPurgeJob.requestedByRole || '—' }}</div>
                      <div><strong>{{ 'platformSchools.purge.affectedUsers' | translate }}:</strong>
                        {{ (selectedPurgeJob.affectedStudents || 0) + (selectedPurgeJob.affectedTeachers || 0) + (selectedPurgeJob.affectedAdmins || 0) + (selectedPurgeJob.affectedParentAccounts || 0) | number }}
                      </div>
                    </div>
                    <div class="d-flex justify-content-end mt-3">
                      <button type="button" class="btn-outline-erp btn-sm" (click)="downloadPurgeCsv(selectedPurgeJob)" [disabled]="busy">
                        <i class="bi bi-download me-1"></i>{{ 'platformSchools.purge.downloadCsv' | translate }}
                      </button>
                    </div>
                  </div>
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
            <h3>{{ 'platformSchools.modal.suspendTitle' | translate }}</h3>
            <button type="button" class="btn-icon" (click)="closeSuspendModal()" [attr.aria-label]="'platformSchools.modal.closeAria' | translate"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="mb-2">{{ 'platformSchools.modal.suspendLead' | translate: { school: detail?.school?.schoolName } }}</p>
            <p class="text-muted mb-0" style="font-size: 13px;">{{ 'platformSchools.modal.suspendNote' | translate }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeSuspendModal()">{{ 'platformSchools.modal.cancel' | translate }}</button>
            <button type="button" class="btn-primary-erp" (click)="confirmSuspend()" [disabled]="busy">{{ 'platformSchools.actions.suspend' | translate }}</button>
          </div>
        </div>
      </div>

      <!-- Activate -->
      <div class="modal-overlay modal-overlay-viewport" *ngIf="activateModalOpen" (click)="closeActivateModal()">
        <div class="modal-content-erp modal-narrow" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ 'platformSchools.modal.activateTitle' | translate }}</h3>
            <button type="button" class="btn-icon" (click)="closeActivateModal()" [attr.aria-label]="'platformSchools.modal.closeAria' | translate"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="mb-0">{{ 'platformSchools.modal.activateLead' | translate }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeActivateModal()">{{ 'platformSchools.modal.cancel' | translate }}</button>
            <button type="button" class="btn-primary-erp" (click)="confirmActivate()" [disabled]="busy">{{ 'platformSchools.actions.activate' | translate }}</button>
          </div>
        </div>
      </div>

      <!-- Purge -->
      <div class="modal-overlay modal-overlay-viewport" *ngIf="purgeModalOpen" (click)="closePurgeModal()">
        <div class="modal-content-erp modal-purge" (click)="$event.stopPropagation()">
          <div class="modal-header-erp border-danger" style="border-bottom-width: 2px;">
            <h3 class="text-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>{{ 'platformSchools.modal.purgeTitle' | translate }}</h3>
            <button type="button" class="btn-icon" (click)="closePurgeModal()" [attr.aria-label]="'platformSchools.modal.closeAria' | translate"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="fw-semibold mb-2">{{ 'platformSchools.modal.purgeLead' | translate: { school: detail?.school?.schoolName, code: detail?.school?.schoolCode } }}</p>
            <div class="platform-impact-box mb-3">
              <div class="platform-impact-title">{{ 'platformSchools.modal.impactTitle' | translate }}</div>
              <p class="platform-impact-lead mb-2">{{ 'platformSchools.modal.impactLead' | translate }}</p>
              <div class="platform-impact-grid">
                <div class="platform-impact-item">
                  <span class="platform-impact-label">{{ 'platformSchools.stats.students' | translate }}</span>
                  <strong>{{ detail?.school?.studentCount || 0 | number }}</strong>
                </div>
                <div class="platform-impact-item">
                  <span class="platform-impact-label">{{ 'platformSchools.stats.teachers' | translate }}</span>
                  <strong>{{ detail?.school?.teacherCount || 0 | number }}</strong>
                </div>
                <div class="platform-impact-item">
                  <span class="platform-impact-label">{{ 'platformSchools.stats.admins' | translate }}</span>
                  <strong>{{ detail?.school?.adminCount || 0 | number }}</strong>
                </div>
                <div class="platform-impact-item">
                  <span class="platform-impact-label">{{ 'platformSchools.stats.parentAccounts' | translate }}</span>
                  <strong>{{ detail?.parentUserCount || 0 | number }}</strong>
                </div>
              </div>
            </div>
            <ol class="platform-danger-list mb-3">
              <li><strong>{{ 'platformSchools.modal.step1Title' | translate }}</strong> — {{ 'platformSchools.modal.step1Lead' | translate }}</li>
              <li><strong>{{ 'platformSchools.modal.step2Title' | translate }}</strong> — {{ 'platformSchools.modal.step2Lead' | translate }}</li>
              <li><strong>{{ 'platformSchools.modal.step3Title' | translate }}</strong> — {{ 'platformSchools.modal.step3Lead' | translate }}</li>
            </ol>
            <ul class="platform-danger-list mb-3">
              <li>{{ 'platformSchools.modal.purgeWarning1' | translate }}</li>
              <li>{{ 'platformSchools.modal.purgeWarning2' | translate }}</li>
              <li>{{ 'platformSchools.modal.purgeWarning3' | translate }}</li>
            </ul>
            <div class="erp-form-group mb-3">
              <label class="erp-label">{{ 'platformSchools.modal.confirmCodeLabel' | translate }}</label>
              <input type="text" class="erp-input" [(ngModel)]="purgeModalCode" autocomplete="off" [placeholder]="detail?.school?.schoolCode || ''" />
            </div>
            <label class="platform-check d-flex align-items-start gap-2">
              <input type="checkbox" [(ngModel)]="purgeChecks.irreversible" class="mt-1" />
              <span>{{ 'platformSchools.modal.checkIrreversible' | translate }}</span>
            </label>
            <label class="platform-check d-flex align-items-start gap-2 mt-2">
              <input type="checkbox" [(ngModel)]="purgeChecks.backup" class="mt-1" />
              <span>{{ 'platformSchools.modal.checkBackup' | translate }}</span>
            </label>
            <label class="platform-check d-flex align-items-start gap-2 mt-2">
              <input type="checkbox" [(ngModel)]="purgeChecks.authorized" class="mt-1" />
              <span>{{ 'platformSchools.modal.checkAuthorized' | translate }}</span>
            </label>
            <p *ngIf="purgeModalError" class="text-danger mt-3 mb-0" style="font-size: 13px;">{{ purgeModalError }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closePurgeModal()">{{ 'platformSchools.modal.cancel' | translate }}</button>
            <button type="button" class="btn-danger-erp" (click)="confirmPurgeFromModal()" [disabled]="busy">{{ 'platformSchools.modal.queuePurge' | translate }}</button>
          </div>
        </div>
      </div>

      <div class="platform-history-section mt-4">
        <div class="erp-card platform-card platform-card-elevated">
          <div class="erp-card-header platform-card-header">
            <div>
              <h3 class="erp-card-title mb-0">{{ 'platformSchools.purge.historyTitle' | translate }}</h3>
              <p class="text-muted mb-0 small">{{ 'platformSchools.purge.historyLead' | translate }}</p>
            </div>
          </div>
          <div class="p-3 pb-2">
            <div class="erp-filter-toolbar platform-history-toolbar">
              <div class="erp-filter-toolbar__search">
                <div>
                  <label class="erp-label small mb-1">{{ 'platformSchools.purge.searchLabel' | translate }}</label>
                  <input
                    type="search"
                    class="erp-input"
                    [(ngModel)]="purgeHistorySearchInput"
                    (ngModelChange)="onPurgeHistorySearchChange($event)"
                    [placeholder]="'platformSchools.purge.searchPh' | translate"
                  />
                </div>
              </div>
              <div class="erp-filter-toolbar__actions">
                <select class="erp-select erp-filter-toolbar__action" [(ngModel)]="purgeHistoryStatus" (ngModelChange)="onPurgeHistoryStatusChange($event)">
                  <option value="">{{ 'platformSchools.purge.statusAll' | translate }}</option>
                  <option value="QUEUED">{{ 'platformSchools.purge.statusQueued' | translate }}</option>
                  <option value="RUNNING">{{ 'platformSchools.purge.statusRunning' | translate }}</option>
                  <option value="COMPLETED">{{ 'platformSchools.purge.statusCompleted' | translate }}</option>
                  <option value="FAILED">{{ 'platformSchools.purge.statusFailed' | translate }}</option>
                </select>
                <button type="button" class="btn-outline-erp btn-sm erp-filter-toolbar__action" (click)="loadGlobalPurgeHistory()" [disabled]="busy || purgeHistoryLoading">
                  <i class="bi bi-arrow-clockwise me-1"></i>{{ 'platformSchools.actions.refresh' | translate }}
                </button>
              </div>
            </div>
          </div>
          <div class="platform-table-wrap">
            <table class="erp-table platform-table platform-purge-table mb-0">
              <thead>
                <tr>
                  <th>{{ 'platformSchools.purge.colStatus' | translate }}</th>
                  <th>{{ 'platformSchools.purge.colSchool' | translate }}</th>
                  <th>{{ 'platformSchools.purge.colCode' | translate }}</th>
                  <th>{{ 'platformSchools.purge.colTenant' | translate }}</th>
                  <th>{{ 'platformSchools.purge.colCreated' | translate }}</th>
                  <th>{{ 'platformSchools.purge.colCompleted' | translate }}</th>
                  <th>{{ 'platformSchools.purge.colRows' | translate }}</th>
                  <th>{{ 'platformSchools.purge.colAction' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="purgeHistoryLoading">
                  <td colspan="8" class="text-muted">{{ 'platformSchools.loading' | translate }}</td>
                </tr>
                <tr *ngFor="let job of globalPurgeJobs" (click)="selectedPurgeJob = job" class="platform-table-row">
                  <td>
                    <span class="badge-erp text-uppercase" [ngClass]="purgeStatusBadge(job.status)">{{ job.status }}</span>
                  </td>
                  <td>{{ job.schoolName || '—' }}</td>
                  <td>{{ job.schoolCode || '—' }}</td>
                  <td><span class="platform-muted-xs">{{ job.tenantId }}</span></td>
                  <td>{{ job.createdAt ? (job.createdAt | date: 'short') : '—' }}</td>
                  <td>{{ job.completedAt ? (job.completedAt | date: 'short') : '—' }}</td>
                  <td>{{ (job.rowsDeletedEstimate || 0) | number }}</td>
                  <td>
                    <button type="button" class="btn-outline-erp btn-sm" (click)="downloadPurgeCsv(job); $event.stopPropagation()" [disabled]="busy">
                      <i class="bi bi-download me-1"></i>{{ 'platformSchools.purge.downloadCsv' | translate }}
                    </button>
                  </td>
                </tr>
                <tr *ngIf="!purgeHistoryLoading && globalPurgeJobs.length === 0">
                  <td colspan="8" class="text-muted">{{ 'platformSchools.purge.historyEmpty' | translate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <app-erp-pagination
            *ngIf="globalPurgeJobsTotal > 0"
            class="d-block px-3 pb-3"
            [totalElements]="globalPurgeJobsTotal"
            [pageIndex]="globalPurgePageIndex"
            [pageSize]="globalPurgePageSize"
            (pageIndexChange)="onGlobalPurgePageIndex($event)"
            (pageSizeChange)="onGlobalPurgePageSize($event)"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .platform-schools-root { position: relative; }
    .platform-page-inner { max-width: 1200px; margin: 0 auto; }
    .platform-shell { padding-bottom: 10px; }
    .platform-main-grid { margin-bottom: 6px; }
    .platform-page-title { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
    .platform-page-lead { font-size: 13px; max-width: 52rem; line-height: 1.5; }
    .platform-card-elevated {
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--clr-surface) 94%, var(--clr-primary) 6%) 0%,
        var(--clr-surface) 100%
      );
      box-shadow: 0 10px 26px color-mix(in srgb, var(--clr-bg) 65%, transparent);
    }
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
    .platform-rollup-text { white-space: nowrap; }
    .platform-hero {
      border-left: 4px solid var(--clr-primary);
      padding: 16px 18px;
      background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface));
      border-radius: var(--radius-lg);
      margin-bottom: 20px;
    }
    .platform-hero-title { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
    .platform-pill {
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
      padding: 6px 12px; border-radius: 999px;
      background: color-mix(in srgb, var(--clr-primary) 14%, var(--clr-surface)); color: var(--clr-primary);
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
      background: color-mix(in srgb, var(--clr-info) 10%, var(--clr-surface));
      border: 1px solid color-mix(in srgb, var(--clr-info) 26%, var(--clr-border));
      display: flex;
      align-items: flex-start;
    }
    .platform-danger-panel {
      border: 1px solid color-mix(in srgb, var(--clr-danger) 30%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-danger) 8%, var(--clr-surface));
      border-radius: var(--radius-lg);
      padding: 16px 18px;
      font-size: 14px;
      line-height: 1.55;
    }
    .platform-danger-list { padding-left: 1.2rem; margin: 0; font-size: 13px; }
    .platform-danger-list li { margin-bottom: 6px; }
    .platform-job-list { list-style: none; padding: 0; margin: 0; font-size: 13px; }
    .platform-job-list li { padding: 8px 10px; border-bottom: 1px solid var(--clr-border-light); cursor: pointer; border-radius: 10px; }
    .platform-job-list li:last-child { border-bottom: none; }
    .platform-job-list-active { background: color-mix(in srgb, var(--clr-primary) 10%, transparent); }
    .platform-history-section .erp-card-header p {
      max-width: 760px;
    }
    .platform-history-toolbar { align-items: end; }
    .platform-purge-table {
      min-width: 980px;
    }
    .platform-check { font-size: 13px; line-height: 1.45; cursor: pointer; }
    .platform-impact-box {
      border: 1px solid color-mix(in srgb, var(--clr-border-light) 75%, var(--clr-primary) 25%);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--clr-surface-alt) 72%, var(--clr-surface) 28%);
      padding: 12px 14px;
    }
    .platform-impact-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--clr-text-muted);
      margin-bottom: 4px;
    }
    .platform-impact-lead {
      font-size: 12px;
      color: var(--clr-text-secondary);
    }
    .platform-impact-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .platform-impact-item {
      border: 1px solid var(--clr-border-light);
      border-radius: 10px;
      padding: 8px 10px;
      background: var(--clr-surface);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .platform-impact-label {
      color: var(--clr-text-muted);
      font-size: 12px;
    }
    .modal-narrow { max-width: 480px; width: 100%; }
    .modal-purge { max-width: 520px; width: 100%; }
    @media (max-width: 768px) {
      .platform-page-title { font-size: 22px; }
      .platform-page-lead { font-size: 12px; }
      .platform-table th,
      .platform-table td {
        padding: 10px 8px;
      }
      .platform-rollup-text {
        white-space: normal;
        line-height: 1.35;
      }
      .platform-impact-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PlatformSchoolsComponent implements OnInit {
  schools: PlatformSchoolSummary[] = [];
  schoolsTotal = 0;
  schoolPageIndex = 0;
  schoolPageSize = DEFAULT_ERP_PAGE_SIZE;
  schoolQuery = '';
  schoolSearchInput = '';
  readonly schoolSearch$ = new Subject<string>();
  selected: PlatformSchoolSummary | null = null;
  detail: PlatformSchoolDetail | null = null;
  detailLoading = false;
  purgeJobs: PlatformPurgeJob[] = [];
  selectedPurgeJob: PlatformPurgeJob | null = null;
  globalPurgeJobs: PlatformPurgeJob[] = [];
  globalPurgeJobsTotal = 0;
  globalPurgePageIndex = 0;
  globalPurgePageSize = DEFAULT_ERP_PAGE_SIZE;
  purgeHistorySearchInput = '';
  purgeHistoryQuery = '';
  purgeHistoryStatus = '';
  purgeHistoryLoading = false;
  busy = false;
  loadError = '';
  actionMessage = '';
  actionError = '';

  suspendModalOpen = false;
  activateModalOpen = false;
  purgeModalOpen = false;
  purgeModalCode = '';
  purgeChecks = { irreversible: false, backup: false, authorized: false };
  purgeModalError = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private platform: PlatformService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.schoolSearch$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(q => {
        this.schoolQuery = (q || '').trim();
        this.schoolPageIndex = 0;
        this.loadSchoolsPage();
      });
    this.purgeHistorySearchInput = '';
    this.purgeHistoryQuery = '';
    this.refreshPageData();
  }

  refreshPageData(): void {
    this.loadSchoolsPage();
    this.loadGlobalPurgeHistory();
    if (this.selected) {
      this.refreshDetail();
    }
  }

  loadSchoolsPage(): void {
    this.loadError = '';
    this.platform.getSchoolsPage(this.schoolPageIndex, this.schoolPageSize, this.schoolQuery || undefined).subscribe({
      next: p => {
        this.schools = p.content;
        this.schoolsTotal = p.totalElements;
        this.schoolPageIndex = p.page;
      },
      error: e => {
        this.loadError = e?.message || this.translate.instant('platformSchools.loadError');
        this.schools = [];
        this.schoolsTotal = 0;
      },
    });
  }

  onSchoolPageIndex(i: number): void {
    this.schoolPageIndex = i;
    this.loadSchoolsPage();
  }

  onSchoolPageSize(s: number): void {
    this.schoolPageSize = s;
    this.schoolPageIndex = 0;
    this.loadSchoolsPage();
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
    this.clearFeedback();
    this.detailLoading = true;
    this.detail = null;
    forkJoin({
      detail: this.platform.getSchoolDetail(this.selected.tenantId),
      jobs: this.platform.listPurgeJobs(this.selected.tenantId)
    }).subscribe({
      next: ({ detail, jobs }) => {
        this.detail = detail;
        this.purgeJobs = jobs;
        this.selectedPurgeJob = jobs[0] ?? null;
        this.detailLoading = false;
      },
      error: e => {
        this.detailLoading = false;
        this.actionError = e?.message || this.translate.instant('platformSchools.detailLoadError');
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
        this.actionMessage = this.translate.instant('platformSchools.messages.suspended');
        this.busy = false;
        this.closeSuspendModal();
        this.patchSelectedActive(false);
        this.refreshDetail();
      },
      error: e => { this.actionError = e?.message || this.translate.instant('platformSchools.messages.suspendFailed'); this.busy = false; }
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
        this.actionMessage = this.translate.instant('platformSchools.messages.activated');
        this.busy = false;
        this.closeActivateModal();
        this.patchSelectedActive(true);
        this.refreshDetail();
      },
      error: e => { this.actionError = e?.message || this.translate.instant('platformSchools.messages.activateFailed'); this.busy = false; }
    });
  }

  openPurgeModal(): void {
    this.purgeModalCode = '';
    this.purgeChecks = { irreversible: false, backup: false, authorized: false };
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
    if (!this.purgeChecks.irreversible || !this.purgeChecks.backup || !this.purgeChecks.authorized) {
      this.purgeModalError = this.translate.instant('platformSchools.modal.checklistRequired');
      return;
    }
    const expected = (this.detail.school.schoolCode || '').trim().toUpperCase();
    const got = (this.purgeModalCode || '').trim().toUpperCase();
    if (!got || got !== expected) {
      this.purgeModalError = this.translate.instant('platformSchools.modal.codeMismatch');
      return;
    }
    this.clearFeedback();
    this.busy = true;
    this.platform.requestTenantDataPurge(this.selected.tenantId, this.purgeModalCode.trim()).subscribe({
      next: () => {
        this.actionMessage = this.translate.instant('platformSchools.purge.jobQueued');
        this.busy = false;
        this.closePurgeModal();
        setTimeout(() => {
          this.loadSchoolsPage();
          this.refreshDetail();
          this.loadGlobalPurgeHistory();
        }, 1800);
      },
      error: e => {
        this.actionError = e?.message || this.translate.instant('platformSchools.purge.requestFailed');
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

  formatDurationMs(durationMs?: number | null): string {
    if (!durationMs || durationMs <= 0) {
      return '—';
    }
    const seconds = Math.round(durationMs / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return `${mins}m ${rem}s`;
  }

  downloadPurgeCsv(job: PlatformPurgeJob): void {
    const targetTenantId = job.tenantId || this.selected?.tenantId;
    if (!targetTenantId) {
      return;
    }
    this.clearFeedback();
    this.busy = true;
    this.platform.exportPurgeJobCsv(targetTenantId, job.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `purge-job-${job.id}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.actionMessage = this.translate.instant('platformSchools.purge.exportReady');
        this.busy = false;
      },
      error: e => {
        this.actionError = e?.message || this.translate.instant('platformSchools.purge.exportFailed');
        this.busy = false;
      }
    });
  }

  onPurgeHistorySearchChange(value: string): void {
    this.purgeHistoryQuery = (value || '').trim();
    this.globalPurgePageIndex = 0;
    this.loadGlobalPurgeHistory();
  }

  onPurgeHistoryStatusChange(value: string): void {
    this.purgeHistoryStatus = (value || '').trim().toUpperCase();
    this.globalPurgePageIndex = 0;
    this.loadGlobalPurgeHistory();
  }

  onGlobalPurgePageIndex(index: number): void {
    this.globalPurgePageIndex = index;
    this.loadGlobalPurgeHistory();
  }

  onGlobalPurgePageSize(size: number): void {
    this.globalPurgePageSize = size;
    this.globalPurgePageIndex = 0;
    this.loadGlobalPurgeHistory();
  }

  loadGlobalPurgeHistory(): void {
    this.purgeHistoryLoading = true;
    this.platform
      .listGlobalPurgeJobs(
        this.globalPurgePageIndex,
        this.globalPurgePageSize,
        this.purgeHistoryQuery || undefined,
        this.purgeHistoryStatus || undefined
      )
      .subscribe({
        next: page => {
          this.globalPurgeJobs = page.content;
          this.globalPurgeJobsTotal = page.totalElements;
          this.globalPurgePageIndex = page.page;
          this.purgeHistoryLoading = false;
        },
        error: e => {
          this.purgeHistoryLoading = false;
          this.actionError = e?.message || this.translate.instant('platformSchools.detailLoadError');
        }
      });
  }

  purgeStatusBadge(status: string): string {
    const normalizedStatus = (status || '').toUpperCase();
    if (normalizedStatus === 'COMPLETED') return 'badge-success';
    if (normalizedStatus === 'FAILED') return 'badge-danger';
    if (normalizedStatus === 'RUNNING') return 'badge-warning';
    return 'badge-info';
  }

  /**
   * Human-readable counts for sales/support users (avoids short technical abbreviations).
   */
  formatWorkspaceRollup(school: Pick<PlatformSchoolSummary, 'studentCount' | 'teacherCount' | 'adminCount'>): string {
    const student = this.translate.instant('platformSchools.rollupStudent', {
      count: this.formatLocalizedCount(school.studentCount),
    });
    const teacher = this.translate.instant('platformSchools.rollupTeacher', {
      count: this.formatLocalizedCount(school.teacherCount),
    });
    const admin = this.translate.instant('platformSchools.rollupAdmin', {
      count: this.formatLocalizedCount(school.adminCount),
    });
    return [student, teacher, admin].join(' · ');
  }

  private formatLocalizedCount(value: number): string {
    const locale = this.translate.currentLang?.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale).format(value || 0);
  }
}
