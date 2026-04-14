import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ImportExportService,
  ImportJobLine,
  ImportJobSummary,
} from '../../core/services/import-export.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';

interface JobTypeOption {
  id: string;
  file: string;
  icon: string;
}

@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent],
  template: `
    <div class="ie-page" data-testid="import-export-page">
      <!-- Hero -->
      <div class="ie-hero mb-4">
        <div class="ie-hero-glow" aria-hidden="true"></div>
        <div class="ie-hero-content">
          <div class="ie-hero-icon-wrap">
            <i class="bi bi-cloud-arrow-up-fill ie-hero-icon" aria-hidden="true"></i>
          </div>
          <div class="ie-hero-text">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
              <h1 class="ie-title mb-0">{{ 'importExport.pageTitle' | translate }}</h1>
              <span class="ie-pill" [attr.title]="'importExport.pillTitle' | translate">
                <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>
                {{ 'importExport.pill' | translate }}
              </span>
            </div>
            <p class="ie-lead mb-0">
              {{ 'importExport.lead' | translate }}
            </p>
          </div>
        </div>
      </div>

      <!-- Import -->
      <div class="erp-card ie-section mb-4">
        <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-start gap-2 mb-0 pb-3 border-bottom-0">
          <div>
            <h3 class="erp-card-title mb-1">
              <i class="bi bi-upload me-2 text-muted" aria-hidden="true"></i>{{ 'importExport.sectionNewJob' | translate }}
            </h3>
            <p class="small text-muted mb-0">{{ 'importExport.newJobLead' | translate }}</p>
          </div>
        </div>

        <p class="small fw-semibold text-uppercase text-muted mb-2 mt-2" style="letter-spacing: 0.04em;">{{ 'importExport.stepJobType' | translate }}</p>
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3" *ngFor="let jt of jobTypes">
            <button
              type="button"
              class="ie-type-tile w-100 text-start"
              [class.ie-type-tile--active]="jobType === jt.id"
              (click)="jobType = jt.id"
              [attr.aria-pressed]="jobType === jt.id"
            >
              <span class="ie-type-icon"><i class="bi" [ngClass]="jt.icon" aria-hidden="true"></i></span>
              <span class="ie-type-label">{{ ('importExport.jobType.' + jt.id) | translate }}</span>
              <span class="ie-type-file"><code>{{ jt.file }}</code></span>
              <span class="ie-type-hint">{{ ('importExport.jobTypeHint.' + jt.id) | translate }}</span>
            </button>
          </div>
        </div>

        <p class="small fw-semibold text-uppercase text-muted mb-2" style="letter-spacing: 0.04em;">{{ 'importExport.stepUpload' | translate }}</p>
        <div
          class="ie-dropzone"
          [class.ie-dropzone--active]="dragOver"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="openFilePicker(fileInput)"
          role="button"
          tabindex="0"
          (keydown.enter)="openFilePicker(fileInput)"
          (keydown.space)="$event.preventDefault(); openFilePicker(fileInput)"
        >
          <input
            #fileInput
            type="file"
            class="d-none"
            accept=".zip,application/zip"
            (change)="onFile($event)"
          />
          <div class="ie-dropzone-inner">
            <i class="bi bi-file-earmark-zip ie-drop-ico" aria-hidden="true"></i>
            <div>
              <div class="ie-drop-title">{{ 'importExport.dropTitle' | translate }}</div>
              <div class="ie-drop-sub">{{ 'importExport.dropSubBefore' | translate }} <code>{{ activeTypeFile }}</code></div>
            </div>
          </div>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-3 mt-3" *ngIf="file">
          <span class="ie-file-chip">
            <i class="bi bi-paperclip" aria-hidden="true"></i>
            {{ file.name }}
            <span class="text-muted">({{ (file.size / 1024) | number : '1.0-0' }} KB)</span>
          </span>
          <button type="button" class="btn btn-link btn-sm text-muted p-0" (click)="clearFile(fileInput)">{{ 'importExport.removeFile' | translate }}</button>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2 mt-4">
          <button
            type="button"
            class="btn-primary-erp"
            [disabled]="!file || busy"
            (click)="submit()"
          >
            <span *ngIf="busy" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <i *ngIf="!busy" class="bi bi-lightning-charge-fill me-2" aria-hidden="true"></i>
            {{ busy ? ('importExport.queueBusy' | translate) : ('importExport.queueBtn' | translate) }}
          </button>
          <span class="small" [class.text-success]="lastSubmitOk" [class.text-danger]="lastSubmitOk === false" *ngIf="lastSubmitMsg">
            {{ lastSubmitMsg }}
          </span>
        </div>
      </div>

      <!-- Exports -->
      <div class="erp-card ie-section mb-4">
        <div class="erp-card-header pb-3 border-bottom-0 mb-0">
          <h3 class="erp-card-title mb-1">
            <i class="bi bi-download me-2 text-muted" aria-hidden="true"></i>{{ 'importExport.exportsTitle' | translate }}
          </h3>
          <p class="small text-muted mb-0">{{ 'importExport.exportsLead' | translate }}</p>
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <button type="button" class="ie-export-card w-100 text-start" (click)="dlStudents()">
              <span class="ie-export-icon ie-export-icon--students"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
              <span class="ie-export-body">
                <span class="ie-export-title">{{ 'importExport.exportStudentsTitle' | translate }}</span>
                <span class="ie-export-desc">{{ 'importExport.exportStudentsDesc' | translate }}</span>
              </span>
              <i class="bi bi-arrow-right-short ie-export-arrow" aria-hidden="true"></i>
            </button>
          </div>
          <div class="col-md-6">
            <button type="button" class="ie-export-card w-100 text-start" (click)="dlTeachers()">
              <span class="ie-export-icon ie-export-icon--staff"><i class="bi bi-person-badge-fill" aria-hidden="true"></i></span>
              <span class="ie-export-body">
                <span class="ie-export-title">{{ 'importExport.exportTeachersTitle' | translate }}</span>
                <span class="ie-export-desc">{{ 'importExport.exportTeachersDesc' | translate }}</span>
              </span>
              <i class="bi bi-arrow-right-short ie-export-arrow" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Jobs table -->
      <div class="erp-card ie-section mb-4">
        <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h3 class="erp-card-title mb-0">
              <i class="bi bi-clock-history me-2 text-muted" aria-hidden="true"></i>{{ 'importExport.jobsTitle' | translate }}
            </h3>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadJobs()" [disabled]="busy || jobsLoading">
            <span *ngIf="jobsLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            <i *ngIf="!jobsLoading" class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            {{ 'importExport.refresh' | translate }}
          </button>
        </div>

        <div *ngIf="jobsLoading && jobs.length === 0" class="empty-state py-5">
          <i class="bi bi-hourglass-split"></i>
          <h4 class="mt-3">{{ 'importExport.loadingJobsTitle' | translate }}</h4>
          <p class="text-muted mb-0">{{ 'importExport.loadingJobsLead' | translate }}</p>
        </div>

        <div *ngIf="!jobsLoading && jobs.length === 0" class="empty-state py-5">
          <i class="bi bi-inbox"></i>
          <h4 class="mt-3">{{ 'importExport.emptyJobsTitle' | translate }}</h4>
          <p class="text-muted mb-0">{{ 'importExport.emptyJobsLead' | translate }}</p>
        </div>

        <div class="table-responsive ie-table-wrap" *ngIf="jobs.length > 0">
          <table class="erp-table mb-0 ie-table">
            <thead>
              <tr>
                <th>{{ 'importExport.thId' | translate }}</th>
                <th>{{ 'importExport.thType' | translate }}</th>
                <th>{{ 'importExport.thStatus' | translate }}</th>
                <th>{{ 'importExport.thFile' | translate }}</th>
                <th class="text-end">{{ 'importExport.thRows' | translate }}</th>
                <th class="text-end">{{ 'importExport.thOkFail' | translate }}</th>
                <th class="text-end">{{ 'importExport.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let j of pagedJobs" [class.ie-row--open]="selectedJob?.id === j.id">
                <td class="fw-semibold text-muted">#{{ j.id }}</td>
                <td>
                  <span class="ie-type-pill">{{ jobTypeLabel(j.jobType) }}</span>
                </td>
                <td>
                  <span class="ie-status" [ngClass]="statusClass(j.status)">
                    <span class="ie-status-dot" aria-hidden="true"></span>
                    {{ jobStatusLabel(j.status) }}
                  </span>
                </td>
                <td class="small text-truncate" style="max-width: 200px;" [title]="j.originalFilename || ''">
                  {{ j.originalFilename || '—' }}
                </td>
                <td class="text-end">{{ j.totalRows }}</td>
                <td class="text-end">
                  <span class="text-success fw-semibold">{{ j.successCount }}</span>
                  <span class="text-muted"> / </span>
                  <span class="text-danger fw-semibold">{{ j.failCount }}</span>
                </td>
                <td class="text-end text-nowrap">
                  <button
                    type="button"
                    class="btn btn-sm btn-link p-0 me-2 ie-action-link"
                    (click)="selectJob(j); $event.stopPropagation()"
                  >
                    <i class="bi bi-list-ul me-1" aria-hidden="true"></i>{{ 'importExport.lines' | translate }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-link p-0 ie-action-link"
                    *ngIf="j.status === 'COMPLETED' && j.failCount > 0"
                    (click)="retry(j); $event.stopPropagation()"
                  >
                    <i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>{{ 'importExport.retryFailed' | translate }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="jobs.length > 0"
            [totalElements]="jobs.length"
            [pageIndex]="jobsPageIndex"
            [pageSize]="jobsPageSize"
            (pageIndexChange)="onJobsPageIndexChange($event)"
            (pageSizeChange)="onJobsPageSizeChange($event)"
          />
        </div>
      </div>

      <!-- Line outcomes -->
      <div class="erp-card ie-section ie-lines-card" *ngIf="selectedJob">
        <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div>
            <h3 class="erp-card-title mb-1">
              <i class="bi bi-ui-checks me-2 text-muted" aria-hidden="true"></i>
              {{ 'importExport.lineOutcomesTitle' | translate: { id: selectedJob.id } }}
            </h3>
            <p class="small text-muted mb-0" *ngIf="selectedJob.summaryMessage">{{ selectedJob.summaryMessage }}</p>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="closeLines()">
            <i class="bi bi-x-lg me-1" aria-hidden="true"></i>{{ 'importExport.close' | translate }}
          </button>
        </div>

        <div *ngIf="linesLoading" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          {{ 'importExport.loadingLines' | translate }}
        </div>

        <div class="table-responsive" *ngIf="!linesLoading && lines.length > 0">
          <table class="erp-table mb-0 ie-table">
            <thead>
              <tr>
                <th>{{ 'importExport.thLineNum' | translate }}</th>
                <th>{{ 'importExport.thLineStatus' | translate }}</th>
                <th>{{ 'importExport.thEntity' | translate }}</th>
                <th>{{ 'importExport.thError' | translate }}</th>
                <th>{{ 'importExport.thPayload' | translate }}</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of pagedLines">
                <td class="fw-semibold">{{ l.lineIndex }}</td>
                <td>
                  <span class="ie-status ie-status--sm" [ngClass]="statusClass(l.status)">
                    <span class="ie-status-dot" aria-hidden="true"></span>
                    {{ lineStatusLabel(l.status) }}
                  </span>
                </td>
                <td class="small">
                  <ng-container *ngIf="l.entityType">{{ l.entityType }} <span class="text-muted">#{{ l.entityId }}</span></ng-container>
                  <ng-container *ngIf="!l.entityType">—</ng-container>
                </td>
                <td class="small text-danger" style="max-width: 220px;">{{ l.errorMessage || '—' }}</td>
                <td class="small">
                  <code class="ie-payload" [title]="l.payloadJson || ''">{{ l.payloadJson || '—' }}</code>
                </td>
                <td class="text-end">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary border-0"
                    *ngIf="l.payloadJson"
                    (click)="copyPayload(l)"
                    [title]="'importExport.copyJson' | translate"
                  >
                    <i class="bi bi-clipboard" aria-hidden="true"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="lines.length > 0"
            [totalElements]="lines.length"
            [pageIndex]="linesPageIndex"
            [pageSize]="linesPageSize"
            (pageIndexChange)="onLinesPageIndexChange($event)"
            (pageSizeChange)="onLinesPageSizeChange($event)"
          />
        </div>
        <p class="small text-muted mb-0" *ngIf="!linesLoading && lines.length === 0">{{ 'importExport.noLineRows' | translate }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .ie-page {
        max-width: 1200px;
        margin: 0 auto;
        animation: ieFadeIn 0.35s ease;
      }
      @keyframes ieFadeIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .ie-hero {
        position: relative;
        border-radius: 16px;
        padding: 1.5rem 1.75rem;
        background: linear-gradient(135deg, var(--clr-surface, #fff) 0%, var(--clr-surface-muted, #f8f9fa) 100%);
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.08));
        box-shadow: 0 8px 32px rgba(27, 58, 48, 0.06);
        overflow: hidden;
      }
      .ie-hero-glow {
        position: absolute;
        width: 280px;
        height: 280px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(192, 92, 61, 0.12) 0%, transparent 70%);
        top: -120px;
        right: -60px;
        pointer-events: none;
      }
      .ie-hero-content {
        position: relative;
        display: flex;
        gap: 1.25rem;
        align-items: flex-start;
      }
      .ie-hero-icon-wrap {
        flex-shrink: 0;
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: linear-gradient(145deg, #1b3a30, #2d5a4a);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(27, 58, 48, 0.25);
      }
      .ie-hero-icon {
        font-size: 1.65rem;
        color: #fff;
      }
      .ie-title {
        font-size: 1.65rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--clr-text, #1a1a1a);
      }
      .ie-lead {
        font-size: 0.95rem;
        line-height: 1.55;
        color: var(--clr-text-muted, #6c757d);
        max-width: 52rem;
      }
      .ie-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        background: rgba(27, 58, 48, 0.08);
        color: #1b3a30;
        border: 1px solid rgba(27, 58, 48, 0.15);
      }
      .ie-section {
        border-radius: 14px;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.08));
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      }
      .ie-type-tile {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
        padding: 1rem 1rem 1.1rem;
        border-radius: 12px;
        border: 2px solid var(--clr-border, rgba(0, 0, 0, 0.1));
        background: var(--clr-surface, #fff);
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
      }
      .ie-type-tile:hover {
        border-color: rgba(192, 92, 61, 0.35);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        transform: translateY(-1px);
      }
      .ie-type-tile--active {
        border-color: #c05c3d;
        background: linear-gradient(180deg, rgba(192, 92, 61, 0.06) 0%, var(--clr-surface, #fff) 100%);
        box-shadow: 0 0 0 1px rgba(192, 92, 61, 0.2);
      }
      .ie-type-icon {
        font-size: 1.35rem;
        color: #c05c3d;
        opacity: 0.9;
      }
      .ie-type-tile--active .ie-type-icon {
        color: #1b3a30;
      }
      .ie-type-label {
        font-weight: 700;
        font-size: 0.95rem;
      }
      .ie-type-file code {
        font-size: 0.75rem;
        color: var(--clr-text-muted);
      }
      .ie-type-hint {
        font-size: 0.72rem;
        color: var(--clr-text-muted);
        line-height: 1.3;
      }
      .ie-dropzone {
        position: relative;
        border: 2px dashed var(--clr-border, rgba(0, 0, 0, 0.15));
        border-radius: 14px;
        padding: 2rem 1.5rem;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
        background: var(--clr-surface-muted, #fafafa);
      }
      .ie-dropzone:hover,
      .ie-dropzone:focus-visible {
        border-color: rgba(192, 92, 61, 0.5);
        outline: none;
      }
      .ie-dropzone--active {
        border-color: #c05c3d;
        background: rgba(192, 92, 61, 0.06);
      }
      .ie-dropzone-inner {
        display: flex;
        align-items: center;
        gap: 1.25rem;
      }
      .ie-drop-ico {
        font-size: 2.5rem;
        color: #c05c3d;
        opacity: 0.85;
      }
      .ie-drop-title {
        font-weight: 700;
        font-size: 1.05rem;
      }
      .ie-drop-sub {
        font-size: 0.85rem;
        color: var(--clr-text-muted);
        margin-top: 0.2rem;
      }
      .ie-file-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.85rem;
        border-radius: 999px;
        background: rgba(27, 58, 48, 0.07);
        font-size: 0.85rem;
      }
      .ie-export-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.15rem 1.25rem;
        border-radius: 12px;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.1));
        background: var(--clr-surface, #fff);
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
      }
      .ie-export-card:hover {
        border-color: rgba(27, 58, 48, 0.25);
        box-shadow: 0 6px 20px rgba(27, 58, 48, 0.08);
        transform: translateY(-2px);
      }
      .ie-export-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        flex-shrink: 0;
      }
      .ie-export-icon--students {
        background: rgba(27, 58, 48, 0.1);
        color: #1b3a30;
      }
      .ie-export-icon--staff {
        background: rgba(192, 92, 61, 0.12);
        color: #a34a32;
      }
      .ie-export-body {
        flex: 1;
        min-width: 0;
      }
      .ie-export-title {
        display: block;
        font-weight: 700;
        font-size: 1rem;
      }
      .ie-export-desc {
        display: block;
        font-size: 0.8rem;
        color: var(--clr-text-muted);
        margin-top: 0.15rem;
      }
      .ie-export-arrow {
        font-size: 1.75rem;
        color: var(--clr-text-muted);
        opacity: 0.6;
      }
      .ie-table-wrap {
        border-radius: 10px;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.06));
        overflow: hidden;
      }
      .ie-table tbody tr {
        transition: background 0.15s;
      }
      .ie-table tbody tr:hover {
        background: rgba(27, 58, 48, 0.03);
      }
      .ie-row--open {
        background: rgba(192, 92, 61, 0.04) !important;
      }
      .ie-type-pill {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.05);
      }
      .ie-status {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
      }
      .ie-status--sm {
        font-size: 0.72rem;
        padding: 0.25rem 0.5rem;
      }
      .ie-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.85;
      }
      .ie-status.ie-st-completed,
      .ie-status.ie-st-success {
        background: rgba(25, 135, 84, 0.12);
        color: #198754;
      }
      .ie-status.ie-st-failed {
        background: rgba(220, 53, 69, 0.12);
        color: #dc3545;
      }
      .ie-status.ie-st-running {
        background: rgba(13, 110, 253, 0.12);
        color: #0d6efd;
      }
      .ie-status.ie-st-pending {
        background: rgba(108, 117, 125, 0.12);
        color: #6c757d;
      }
      .ie-action-link {
        font-weight: 600;
        color: #c05c3d !important;
        text-decoration: none !important;
      }
      .ie-action-link:hover {
        text-decoration: underline !important;
      }
      .ie-lines-card {
        border-left: 4px solid #c05c3d;
      }
      .ie-payload {
        display: block;
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.72rem;
        padding: 0.2rem 0.4rem;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.04);
      }
    `,
  ],
})
export class ImportExportComponent implements OnInit {
  jobTypes: JobTypeOption[] = [
    { id: 'STUDENTS', file: 'students.csv', icon: 'bi-people-fill' },
    { id: 'TEACHERS', file: 'teachers.csv', icon: 'bi-person-workspace' },
    { id: 'STAFF', file: 'staff.csv', icon: 'bi-book-half' },
    { id: 'CLASSES', file: 'classes.csv', icon: 'bi-diagram-3-fill' },
  ];

  jobType = 'STUDENTS';
  file: File | null = null;
  busy = false;
  jobsLoading = false;
  linesLoading = false;
  lastSubmitMsg = '';
  lastSubmitOk: boolean | null = null;
  jobs: ImportJobSummary[] = [];
  pagedJobs: ImportJobSummary[] = [];
  jobsPageIndex = 0;
  jobsPageSize = DEFAULT_ERP_PAGE_SIZE;
  lines: ImportJobLine[] = [];
  pagedLines: ImportJobLine[] = [];
  linesPageIndex = 0;
  linesPageSize = DEFAULT_ERP_PAGE_SIZE;
  selectedJob: ImportJobSummary | null = null;
  dragOver = false;

  constructor(
    private importExport: ImportExportService,
    private translate: TranslateService
  ) {}

  jobTypeLabel(raw: string): string {
    const id = String(raw || '').toUpperCase();
    const key = `importExport.jobType.${id}`;
    const t = this.translate.instant(key);
    return t !== key ? t : raw;
  }

  jobStatusLabel(raw: string): string {
    const id = String(raw || '').toUpperCase();
    const key = `importExport.jobStatus.${id}`;
    const t = this.translate.instant(key);
    return t !== key ? t : raw;
  }

  lineStatusLabel(raw: string): string {
    const id = String(raw || '').toUpperCase();
    const key = `importExport.lineStatus.${id}`;
    const t = this.translate.instant(key);
    return t !== key ? t : raw;
  }

  get activeTypeFile(): string {
    return this.jobTypes.find(j => j.id === this.jobType)?.file ?? 'students.csv';
  }

  ngOnInit(): void {
    this.reloadJobs();
  }

  openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f && (f.name.toLowerCase().endsWith('.zip') || f.type === 'application/zip')) {
      this.file = f;
      this.lastSubmitMsg = '';
      this.lastSubmitOk = null;
    }
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.file = input.files && input.files.length ? input.files[0] : null;
    this.lastSubmitMsg = '';
    this.lastSubmitOk = null;
  }

  clearFile(input: HTMLInputElement): void {
    this.file = null;
    input.value = '';
  }

  submit(): void {
    if (!this.file) return;
    this.busy = true;
    this.lastSubmitMsg = '';
    this.lastSubmitOk = null;
    this.importExport.submitJob(this.jobType, this.file).subscribe({
      next: r => {
        this.lastSubmitMsg = this.translate.instant('importExport.msgQueued', { jobId: r.jobId, rows: r.totalRows });
        this.lastSubmitOk = true;
        this.reloadJobs();
      },
      error: e => {
        this.lastSubmitMsg = e?.message || this.translate.instant('importExport.msgUploadFailed');
        this.lastSubmitOk = false;
      },
      complete: () => (this.busy = false),
    });
  }

  reloadJobs(): void {
    this.jobsLoading = true;
    this.importExport.listJobs(0, 50).subscribe({
      next: p => {
        this.jobs = p.content;
        this.jobsPageIndex = 0;
        this.applyJobsPage();
        this.jobsLoading = false;
      },
      error: () => (this.jobsLoading = false),
    });
  }

  private applyJobsPage(): void {
    const slice = sliceToPage(this.jobs, this.jobsPageIndex, this.jobsPageSize);
    this.pagedJobs = slice.content;
    this.jobsPageIndex = slice.page;
  }

  onJobsPageIndexChange(idx: number): void {
    this.jobsPageIndex = idx;
    this.applyJobsPage();
  }

  onJobsPageSizeChange(size: number): void {
    this.jobsPageSize = size;
    this.jobsPageIndex = 0;
    this.applyJobsPage();
  }

  selectJob(j: ImportJobSummary): void {
    this.selectedJob = j;
    this.linesLoading = true;
    this.lines = [];
    this.pagedLines = [];
    this.importExport.getLines(j.id, 0, 200).subscribe({
      next: p => {
        this.lines = p.content;
        this.linesPageIndex = 0;
        this.applyLinesPage();
        this.linesLoading = false;
      },
      error: () => (this.linesLoading = false),
    });
  }

  private applyLinesPage(): void {
    const slice = sliceToPage(this.lines, this.linesPageIndex, this.linesPageSize);
    this.pagedLines = slice.content;
    this.linesPageIndex = slice.page;
  }

  onLinesPageIndexChange(idx: number): void {
    this.linesPageIndex = idx;
    this.applyLinesPage();
  }

  onLinesPageSizeChange(size: number): void {
    this.linesPageSize = size;
    this.linesPageIndex = 0;
    this.applyLinesPage();
  }

  closeLines(): void {
    this.selectedJob = null;
    this.lines = [];
    this.pagedLines = [];
  }

  retry(j: ImportJobSummary): void {
    this.busy = true;
    this.importExport.retryFailed(j.id).subscribe({
      next: () => {
        this.lastSubmitMsg = this.translate.instant('importExport.msgRetryQueued', { id: j.id });
        this.lastSubmitOk = true;
        this.reloadJobs();
      },
      error: e => {
        this.lastSubmitMsg = e?.message || this.translate.instant('importExport.msgRetryFailed');
        this.lastSubmitOk = false;
      },
      complete: () => (this.busy = false),
    });
  }

  dlStudents(): void {
    this.importExport.downloadStudentsCsv().subscribe(blob => this.saveBlob(blob, 'students-export.csv'));
  }

  dlTeachers(): void {
    this.importExport.downloadTeachersCsv().subscribe(blob => this.saveBlob(blob, 'teachers-export.csv'));
  }

  copyPayload(l: ImportJobLine): void {
    const t = l.payloadJson || '';
    if (!t || !navigator.clipboard) return;
    const copiedMsg = this.translate.instant('importExport.msgPayloadCopied');
    navigator.clipboard.writeText(t).then(() => {
      this.lastSubmitMsg = copiedMsg;
      this.lastSubmitOk = true;
      setTimeout(() => {
        if (this.lastSubmitMsg === copiedMsg) {
          this.lastSubmitMsg = '';
          this.lastSubmitOk = null;
        }
      }, 2000);
    });
  }

  private saveBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  statusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'SUCCESS') return 'ie-st-completed';
    if (s === 'FAILED') return 'ie-st-failed';
    if (s === 'RUNNING') return 'ie-st-running';
    return 'ie-st-pending';
  }
}
