import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import {
  DryRunResponse,
  FileHeaderPreview,
  ImportExportService,
  ImportJobLine,
  ImportJobSummary,
  ImportLedgerLine,
  ImportMetricsSummary,
  RollbackBundleResponse,
  ExportJobSummary,
} from '../../core/services/import-export.service';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { AuthService } from '../../core/services/auth.service';
import { PlatformService } from '../../core/services/platform.service';
import { OnboardSchoolRequest, PlatformSchoolSummary } from '../../core/models/models';
import {
  FieldErrors,
  OnboardSchoolField,
  hasFieldErrors,
  validateOnboardSchoolForm,
} from '../../core/validation/onboard-school-form.validation';
import {
  ONBOARD_ADMIN_PASSWORD_MAX,
  ONBOARD_ADMIN_PASSWORD_MIN,
  ONBOARD_SCHOOL_CODE_MAX,
  ONBOARD_SCHOOL_CODE_MIN,
} from '../../core/validation/auth-forms.constants';

interface JobTypeOption {
  id: string;
  file: string;
  icon: string;
  /** Visual import sequence number (sales ops guidance). */
  seq?: number;
}

/** Minimum canonical fields that must be mapped for each job type (matches backend validators). */
const REQUIRED_IMPORT_FIELDS: Record<string, string[]> = {
  STUDENTS: ['first_name', 'last_name', 'primary_guardian_phone'],
  TEACHERS: ['first_name', 'last_name', 'phone'],
  STAFF: ['first_name', 'last_name', 'phone'],
  CLASSES: ['class_name', 'grade'],
  // subject: at least one of subject_name / legacy subjectname / subject_code (validated in mappingIncomplete)
  TIMETABLE: ['teacher_ref', 'class_ref', 'day_of_week', 'period_no', 'start_time', 'end_time'],
  FEE_STRUCTURES: ['name', 'class_name', 'academic_year_id', 'component_spec'],
};

@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent, ErpDatePickerComponent],
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

      <div class="ie-wizard mb-4" role="navigation" [attr.aria-label]="'importExport.wizardAria' | translate">
        <div class="ie-wizard-track">
          <div
            *ngFor="let s of wizardSteps; let i = index"
            class="ie-wizard-step"
            [class.ie-wizard-step--active]="wizardStepIndex === i"
            [class.ie-wizard-step--done]="wizardStepIndex > i"
          >
            <span class="ie-wizard-num">{{ i + 1 }}</span>
            <span class="ie-wizard-label">{{ s.labelKey | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Operations metrics (tenant DB) + hint for Prometheus -->
      <div class="erp-card ie-section ie-metrics mb-4" *ngIf="metricsSummary || metricsLoading">
        <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 border-bottom-0 mb-0">
          <div>
            <h3 class="erp-card-title mb-1">
              <i class="bi bi-speedometer2 me-2 text-muted" aria-hidden="true"></i>{{ 'importExport.metricsTitle' | translate }}
            </h3>
            <p class="small text-muted mb-0">{{ 'importExport.metricsLead' | translate }}</p>
          </div>
          <button
            type="button"
            class="btn-outline-erp btn-sm"
            (click)="loadMetrics()"
            [disabled]="metricsLoading || (isSuperAdmin && !hasTargetSchoolCode)"
          >
            <span *ngIf="metricsLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            <i *ngIf="!metricsLoading" class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            {{ 'importExport.metricsRefresh' | translate }}
          </button>
        </div>
        <div class="row g-2 g-md-3" *ngIf="metricsSummary as m">
          <div class="col-6 col-md-4 col-xl-2">
            <div class="ie-metric-tile">
              <span class="ie-metric-val">{{ m.jobsCreatedLast24h }}</span>
              <span class="ie-metric-lbl">{{ 'importExport.metricJobsCreated' | translate }}</span>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl-2">
            <div class="ie-metric-tile">
              <span class="ie-metric-val text-success">{{ m.jobsCompletedLast24h }}</span>
              <span class="ie-metric-lbl">{{ 'importExport.metricJobsDone' | translate }}</span>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl-2">
            <div class="ie-metric-tile">
              <span class="ie-metric-val text-danger">{{ m.jobsFailedLast24h }}</span>
              <span class="ie-metric-lbl">{{ 'importExport.metricJobsFail' | translate }}</span>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl-2">
            <div class="ie-metric-tile">
              <span class="ie-metric-val text-primary">{{ m.jobsRunningNow }}</span>
              <span class="ie-metric-lbl">{{ 'importExport.metricJobsRun' | translate }}</span>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl-2">
            <div class="ie-metric-tile">
              <span class="ie-metric-val">{{ m.rowsSucceededLast24h | number }}</span>
              <span class="ie-metric-lbl">{{ 'importExport.metricRowsOk' | translate }}</span>
            </div>
          </div>
          <div class="col-6 col-md-4 col-xl-2">
            <div class="ie-metric-tile">
              <span class="ie-metric-val">{{ m.rowsFailedLast24h | number }}</span>
              <span class="ie-metric-lbl">{{ 'importExport.metricRowsFail' | translate }}</span>
            </div>
          </div>
        </div>
        <p class="small text-muted mb-0 mt-2" *ngIf="metricsSummary?.meterNamespaceHint">
          {{ 'importExport.metricsPromHint' | translate: { ns: metricsSummary!.meterNamespaceHint! } }}
        </p>
      </div>
      <div
        *ngIf="globalFlowMessage"
        class="alert mb-4"
        [class.alert-success]="globalFlowMessageOk"
        [class.alert-danger]="!globalFlowMessageOk"
      >
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="fw-semibold">{{ globalFlowMessage }}</div>
            <div class="small mt-1" *ngIf="globalFlowMessageContext">{{ globalFlowMessageContext }}</div>
          </div>
          <button type="button" class="btn-close" [attr.aria-label]="'importExport.closeAlert' | translate" (click)="clearGlobalFlowMessage()"></button>
        </div>
      </div>

      <!-- Import -->
      <div class="erp-card ie-section mb-4">
        <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-start gap-2 mb-0 pb-3 border-bottom-0">
          <div>
            <h3 class="erp-card-title mb-1">
              <i class="bi bi-upload me-2 text-muted" aria-hidden="true"></i>{{ 'importExport.sectionNewJob' | translate }}
            </h3>
            <p class="small text-muted mb-0">{{ 'importExport.newJobLeadV2' | translate }}</p>
          </div>
          <button
            *ngIf="isSuperAdmin"
            type="button"
            class="btn-primary-erp btn-sm"
            (click)="openOnboardModal()"
          >
            <i class="bi bi-plus-circle me-1"></i>{{ 'importExport.onboard.openCta' | translate }}
          </button>
        </div>

        <p class="small fw-semibold text-uppercase text-muted mb-2 mt-2" style="letter-spacing: 0.04em;">{{ 'importExport.stepJobType' | translate }}</p>
        <div class="mb-3" *ngIf="isSuperAdmin">
          <label class="form-label small fw-semibold mb-1">{{ 'importExport.targetSchoolCodeLabel' | translate }}</label>
          <div class="ie-school-picker-wrap">
            <input
              class="form-control ie-school-code-input"
              [class.ie-school-code-input--invalid]="showSchoolCodeValidationError"
              [(ngModel)]="targetSchoolCode"
              (ngModelChange)="onTargetSchoolCodeChanged()"
              (focus)="showSchoolPicker = true"
              (blur)="onSchoolCodeBlur()"
              [placeholder]="'importExport.targetSchoolCodePlaceholder' | translate"
              maxlength="20"
            />
            <div class="ie-school-picker-dropdown" *ngIf="showSchoolPicker && filteredSchoolOptions.length > 0">
              <button
                type="button"
                class="ie-school-option"
                *ngFor="let school of filteredSchoolOptions"
                (mousedown)="selectSchoolCodeOption(school)"
              >
                <span class="ie-school-option-name">{{ school.schoolName }}</span>
                <span class="ie-school-option-code">{{ school.schoolCode }}</span>
              </button>
            </div>
          </div>
          <p class="small text-muted mb-0 mt-1" *ngIf="schoolOptionsLoading">{{ 'importExport.targetSchoolCodeLoading' | translate }}</p>
          <p class="small text-muted mb-0 mt-1" *ngIf="!showSchoolCodeValidationError">{{ 'importExport.targetSchoolCodeHint' | translate }}</p>
          <p class="small text-danger mb-0 mt-1" *ngIf="showSchoolCodeValidationError">{{ schoolCodeValidationMessageKey | translate }}</p>
        </div>
        <div class="row g-3 mb-4">
          <div class="col-12 col-sm-6 col-lg-3" *ngFor="let jt of jobTypes">
            <button
              type="button"
              class="ie-type-tile w-100 text-start"
              [class.ie-type-tile--active]="jobType === jt.id"
              (click)="onJobTypeSelect(jt.id)"
              [attr.aria-pressed]="jobType === jt.id"
            >
              <span class="ie-type-icon">
                <span class="ie-type-seq" *ngIf="jt.seq">{{ jt.seq }}</span>
                <i class="bi" [ngClass]="jt.icon" aria-hidden="true"></i>
              </span>
              <span class="ie-type-label">{{ ('importExport.jobType.' + jt.id) | translate }}</span>
              <span class="ie-type-file"><code>{{ jt.file }}</code></span>
              <!-- <span class="ie-type-hint">{{ ('importExport.jobTypeHint.' + jt.id) | translate }}</span> -->
            </button>
          </div>
        </div>

        <p class="small fw-semibold text-uppercase text-muted mb-2" style="letter-spacing: 0.04em;">{{ 'importExport.stepUploadV2' | translate }}</p>
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
            accept=".zip,.csv,.xlsx,application/zip,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            (change)="onFile($event)"
          />
          <div class="ie-dropzone-inner">
            <i class="bi bi-file-earmark-spreadsheet ie-drop-ico" aria-hidden="true"></i>
            <div>
              <div class="ie-drop-title">{{ 'importExport.dropTitleV2' | translate }}</div>
              <div class="ie-drop-sub">{{ 'importExport.dropSubV2' | translate }} <code>{{ activeTypeFile }}</code></div>
            </div>
          </div>
        </div>
        <p class="small text-muted mb-0 mt-2" *ngIf="isSuperAdmin && !hasTargetSchoolCode">
          <i class="bi bi-info-circle me-1" aria-hidden="true"></i>{{ 'importExport.schoolSelectBeforeUpload' | translate }}
        </p>
        <div class="d-flex flex-wrap align-items-center gap-3 mt-3" *ngIf="file">
          <span class="ie-file-chip">
            <i class="bi bi-paperclip" aria-hidden="true"></i>
            {{ file.name }}
            <span class="text-muted">({{ (file.size / 1024) | number : '1.0-0' }} KB)</span>
          </span>
          <button type="button" class="btn btn-link btn-sm text-muted p-0" (click)="clearFile(fileInput)">{{ 'importExport.removeFile' | translate }}</button>
          <span class="small text-muted" *ngIf="previewLoading">
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>{{ 'importExport.previewLoading' | translate }}
          </span>
        </div>

        <div class="ie-map card border-0 mt-3 p-3" *ngIf="file && headerPreview">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <div>
              <div class="small text-muted text-uppercase fw-semibold" style="letter-spacing: 0.04em;">{{ 'importExport.stepMapColumns' | translate }}</div>
              <p class="small text-muted mb-0">{{ 'importExport.mapLead' | translate }}</p>
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary" (click)="resetMappingToSuggested()">
              {{ 'importExport.mapResetSuggested' | translate }}
            </button>
          </div>
          <div class="ie-map-scroll" *ngIf="headerPreview.detectedHeaders.length">
            <table class="erp-table mb-0 ie-table ie-table--map">
              <thead>
                <tr>
                  <th>{{ 'importExport.mapColFile' | translate }}</th>
                  <th>{{ 'importExport.mapColSystem' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of headerPreview.detectedHeaders">
                  <td class="small"><code>{{ h }}</code></td>
                  <td style="min-width: 200px;">
                    <select
                      class="form-select form-select-sm"
                      [(ngModel)]="columnSelections[h]"
                      (ngModelChange)="onColumnMappingChanged()"
                      [name]="'map-' + h"
                    >
                      <option value="">{{ 'importExport.mapIgnore' | translate }}</option>
                      <option *ngFor="let c of headerPreview.canonicalFields" [value]="c">{{ c }}</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="small text-danger mb-0 mt-2" *ngIf="mappingIncomplete">{{ 'importExport.mapIncomplete' | translate }}</p>
        </div>

        <div
          class="ie-execution border-0 mt-3 p-3 rounded-3"
          *ngIf="file && headerPreview"
          style="background: var(--clr-surface-muted, rgba(0, 0, 0, 0.04)); border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.08)) !important"
        >
          <label class="form-label small text-muted text-uppercase fw-semibold mb-2 d-block" style="letter-spacing: 0.04em">{{
            'importExport.executionModeLabel' | translate
          }}</label>
          <select
            class="form-select form-select-sm"
            [(ngModel)]="executionMode"
            name="importExecutionMode"
            style="max-width: 28rem"
          >
            <option value="BEST_EFFORT">{{ 'importExport.executionModeBestEffort' | translate }}</option>
            <option value="ALL_OR_NOTHING">{{ 'importExport.executionModeAllOrNothing' | translate }}</option>
          </select>
          <p class="small text-muted mt-2 mb-0" style="max-width: 40rem">
            {{ 'importExport.executionModeHint' | translate }}
          </p>
          <div class="form-check mt-3 mb-0">
            <input
              id="import-reprocess"
              class="form-check-input"
              type="checkbox"
              [(ngModel)]="reprocessImport"
              name="reprocessImport"
            />
            <label class="form-check-label small fw-semibold" for="import-reprocess">
              {{ 'importExport.reprocessToggleLabel' | translate }}
            </label>
          </div>
          <p class="small text-muted mt-1 mb-0" style="max-width: 48rem">
            {{ 'importExport.reprocessToggleHint' | translate }}
          </p>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2 mt-4">
          <button
            type="button"
            class="btn-outline-erp"
            [disabled]="!canRunDryRun"
            (click)="runDryRun()"
          >
            <span *ngIf="dryRunBusy" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <i *ngIf="!dryRunBusy" class="bi bi-check2-circle me-2" aria-hidden="true"></i>
            {{ dryRunBusy ? ('importExport.dryRunBusy' | translate) : ('importExport.dryRunBtn' | translate) }}
          </button>
          <button
            type="button"
            class="btn-primary-erp"
            [disabled]="!canImportData"
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
        <div class="ie-dry-run card border-0 mt-3 p-3" *ngIf="dryRunResult as dr">
          <div class="small text-muted text-uppercase fw-semibold mb-2" style="letter-spacing: 0.04em;">{{ 'importExport.dryRunSummary' | translate }}</div>
          <div class="small text-muted mb-2">
            <span class="fw-semibold">{{ 'importExport.dedupeKeyLabel' | translate }}:</span> {{ dryRunDedupeKeyHint() }}
          </div>
          <div class="alert alert-info py-2 px-3 small mb-2" *ngIf="dr.advisoryMessage">
            <i class="bi bi-info-circle me-1" aria-hidden="true"></i>{{ dr.advisoryMessage }}
          </div>
          <div class="row g-2 small ie-dry-run-stats">
            <div class="col-6 col-md-3">
              <div class="ie-dry-run-stat"><span class="text-muted">{{ 'importExport.dryRunTotal' | translate }}</span><strong>{{ dr.totalRows }}</strong></div>
            </div>
            <div class="col-6 col-md-3">
              <div class="ie-dry-run-stat"><span class="text-muted">{{ 'importExport.dryRunValid' | translate }}</span><strong class="text-success">{{ dr.validRows }}</strong></div>
            </div>
            <div class="col-6 col-md-3">
              <div class="ie-dry-run-stat"><span class="text-muted">{{ 'importExport.dryRunInvalid' | translate }}</span><strong class="text-danger">{{ dr.invalidRows }}</strong></div>
            </div>
            <div class="col-6 col-md-3" *ngIf="dr.createOnlyEvaluatedRows != null && dr.createOnlyEvaluatedRows > 0">
              <div class="ie-dry-run-stat">
                <span class="text-muted">{{ 'importExport.createOnlyDupRatio' | translate }}</span
                ><strong
                  >{{ (dr.createOnlyDuplicateRatio != null ? dr.createOnlyDuplicateRatio * 100 : 0) | number: '1.0-1' }}%</strong
                >
                <span class="text-muted d-block small"
                  >({{ dr.createOnlyCollisionRows }} / {{ dr.createOnlyEvaluatedRows }})</span
                >
              </div>
            </div>
          </div>
          <div class="alert alert-danger py-2 px-3 small mb-2" *ngIf="dr.importBlocked && dr.importBlockMessage">
            <i class="bi bi-shield-exclamation me-1" aria-hidden="true"></i>{{ dr.importBlockMessage }}
          </div>
          <div class="small text-muted mt-2" *ngIf="dr.sampleErrors.length">
            <span *ngFor="let bucket of groupedDryRunErrorBuckets(); let last = last">
              {{ dryRunErrorCodeLabel(bucket.code) }}: {{ bucket.count }}<span *ngIf="!last"> · </span>
            </span>
          </div>
          <div class="alert alert-warning py-2 px-3 small mb-2 mt-2" *ngIf="jobType.toUpperCase() === 'TIMETABLE' && dr.sampleErrors.length">
            <i class="bi bi-lightbulb me-1" aria-hidden="true"></i>{{ 'importExport.timetableDryRunHelper' | translate }}
          </div>
          <ul class="list-unstyled mb-0 mt-2 small" *ngIf="dr.sampleErrors.length">
            <li *ngFor="let e of dr.sampleErrors" class="text-danger">
              <span class="text-muted">#{{ e.lineIndex }}</span>
              <span *ngIf="e.errorCode" class="text-muted">[{{ dryRunErrorCodeLabel(e.errorCode) }}]</span>
              — {{ humanizeDryRunMessage(e.message, e.errorCode) }}
              <span *ngIf="e.dedupeKey" class="text-muted">({{ e.dedupeKey }})</span>
            </li>
          </ul>
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
            <button type="button" class="ie-export-card w-100 text-start" (click)="exportCanonicalCsv('STUDENTS')">
              <span class="ie-export-icon ie-export-icon--students"><i class="bi bi-people-fill" aria-hidden="true"></i></span>
              <span class="ie-export-body">
                <span class="ie-export-title">{{ 'importExport.exportStudentsTitle' | translate }}</span>
                <span class="ie-export-desc">{{ 'importExport.exportStudentsDesc' | translate }}</span>
              </span>
              <i class="bi bi-arrow-right-short ie-export-arrow" aria-hidden="true"></i>
            </button>
          </div>
          <div class="col-md-6">
            <button type="button" class="ie-export-card w-100 text-start" (click)="exportCanonicalCsv('TEACHERS')">
              <span class="ie-export-icon ie-export-icon--staff"><i class="bi bi-person-badge-fill" aria-hidden="true"></i></span>
              <span class="ie-export-body">
                <span class="ie-export-title">{{ 'importExport.exportTeachersTitle' | translate }}</span>
                <span class="ie-export-desc">{{ 'importExport.exportTeachersDesc' | translate }}</span>
              </span>
              <i class="bi bi-arrow-right-short ie-export-arrow" aria-hidden="true"></i>
            </button>
          </div>
          <div class="col-md-6">
            <button type="button" class="ie-export-card w-100 text-start" (click)="exportCanonicalCsv('STAFF')">
              <span class="ie-export-icon ie-export-icon--staff"><i class="bi bi-person-vcard-fill" aria-hidden="true"></i></span>
              <span class="ie-export-body">
                <span class="ie-export-title">{{ 'importExport.exportStaffTitle' | translate }}</span>
                <span class="ie-export-desc">{{ 'importExport.exportStaffDesc' | translate }}</span>
              </span>
              <i class="bi bi-arrow-right-short ie-export-arrow" aria-hidden="true"></i>
            </button>
          </div>
          <div class="col-md-6">
            <button type="button" class="ie-export-card w-100 text-start" (click)="exportCanonicalCsv('FEE_STRUCTURES')">
              <span class="ie-export-icon ie-export-icon--students"><i class="bi bi-cash-stack" aria-hidden="true"></i></span>
              <span class="ie-export-body">
                <span class="ie-export-title">{{ 'importExport.exportFeeTitle' | translate }}</span>
                <span class="ie-export-desc">{{ 'importExport.exportFeeDesc' | translate }}</span>
              </span>
              <i class="bi bi-arrow-right-short ie-export-arrow" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Jobs table (report) -->
      <div class="erp-card ie-section mb-4" id="import-export-report">
        <div class="erp-card-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h3 class="erp-card-title mb-0">
              <i class="bi bi-clipboard-data me-2 text-muted" aria-hidden="true"></i>{{ 'importExport.jobsTitleReport' | translate }}
            </h3>
            <p class="small text-muted mb-0 mt-1">{{ 'importExport.jobsReportLead' | translate }}</p>
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
                <th>{{ 'importExport.thExecution' | translate }}</th>
                <th>{{ 'importExport.thStatus' | translate }}</th>
                <th>{{ 'importExport.thTimeTaken' | translate }}</th>
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
                  <span class="ie-patch-pill ms-1" *ngIf="j.reprocessRequested">
                    {{ patchJobBadgeLabel() }}
                  </span>
                </td>
                <td class="small text-nowrap text-muted">
                  {{ jobExecutionModeLabel(j.executionMode) }}
                </td>
                <td>
                  <span class="ie-status" [ngClass]="statusClass(j.status)">
                    <span class="ie-status-dot" aria-hidden="true"></span>
                    {{ jobStatusLabel(j.status) }}
                  </span>
                </td>
                <td class="small text-nowrap text-muted">{{ formatJobDuration(j) }}</td>
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
                    class="btn btn-sm btn-link p-0 me-2 ie-action-link"
                    *ngIf="canDownloadNormalizedJob(j)"
                    (click)="downloadNormalizedJobCsv(j); $event.stopPropagation()"
                  >
                    <i class="bi bi-file-earmark-spreadsheet me-1" aria-hidden="true"></i>
                    {{ 'importExport.downloadNormalizedCsv' | translate }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-link p-0 ie-action-link"
                    *ngIf="j.failCount > 0 && j.status !== 'QUEUED' && j.status !== 'RUNNING'"
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

        <div
          *ngIf="!linesLoading && rollbackBrief"
          class="border rounded p-3 mb-3 bg-body-secondary bg-opacity-10"
        >
          <h4 class="h6 text-uppercase text-muted mb-2" style="letter-spacing: 0.04em">
            <i class="bi bi-reply-all me-1" aria-hidden="true"></i>{{ 'importExport.undoGuideTitle' | translate }}
          </h4>
          <p class="small text-muted mb-2">
            <span *ngIf="rollbackBrief.ledgerRowCount"
              >{{ 'importExport.undoLedgerCount' | translate: { n: rollbackBrief.ledgerRowCount } }}</span
            >
            <span *ngIf="!rollbackBrief.ledgerRowCount">{{ 'importExport.undoLedgerEmpty' | translate }}</span>
          </p>
          <ol class="small mb-0 ps-3">
            <li *ngFor="let s of rollbackBrief.suggestedOperatorSteps">{{ s }}</li>
          </ol>
        </div>

        <div *ngIf="ledgerLoading" class="text-center py-2 text-muted small">
          <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          {{ 'importExport.loadingLedger' | translate }}
        </div>

        <div *ngIf="!ledgerLoading && ledgerRows.length > 0" class="mb-3">
          <h4 class="h6 text-uppercase text-muted mb-2" style="letter-spacing: 0.04em">
            <i class="bi bi-journal-text me-1" aria-hidden="true"></i>{{ 'importExport.importLedgerTitle' | translate }}
          </h4>
          <div class="table-responsive ie-table-wrap">
            <table class="erp-table mb-0 ie-table ie-table--lines small">
              <thead>
                <tr>
                  <th>{{ 'importExport.thLineNum' | translate }}</th>
                  <th>{{ 'importExport.thLedgerOutcome' | translate }}</th>
                  <th>{{ 'importExport.thEntity' | translate }}</th>
                  <th>{{ 'importExport.thLedgerKey' | translate }}</th>
                  <th>{{ 'importExport.thLedgerGuidance' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let g of ledgerRows">
                  <td class="fw-semibold">{{ g.lineIndex }}</td>
                  <td>
                    <span class="ie-status ie-status--sm" [ngClass]="ledgerOutcomeClass(g.outcome)">
                      <span class="ie-status-dot" aria-hidden="true"></span>
                      {{ g.outcome }}
                    </span>
                  </td>
                  <td>
                    <ng-container *ngIf="g.entityType"
                      >{{ g.entityType }} <span class="text-muted" *ngIf="g.entityId != null">#{{ g.entityId }}</span></ng-container
                    >
                    <ng-container *ngIf="!g.entityType">—</ng-container>
                  </td>
                  <td class="text-break" style="max-width: 140px">
                    <code class="ie-payload small">{{ g.naturalKey || '—' }}</code>
                  </td>
                  <td class="text-muted" style="max-width: 320px">{{ g.rollbackGuidance || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-responsive ie-table-wrap" *ngIf="!linesLoading && lines.length > 0">
          <table class="erp-table mb-0 ie-table ie-table--lines">
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

      <div class="modal-overlay modal-overlay-viewport" *ngIf="onboardModalOpen" (click)="closeOnboardModal()">
        <div class="modal-content-erp modal-narrow" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ 'signup.title' | translate }}</h3>
            <button type="button" class="btn-icon" (click)="closeOnboardModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="erp-form-group mb-2">
              <label class="erp-label">{{ 'signup.schoolName' | translate }}</label>
              <input
                class="erp-input"
                [class.erp-input--invalid]="showOnboardFieldError('schoolName')"
                [(ngModel)]="onboardForm.schoolName"
                (ngModelChange)="onOnboardFieldInput('schoolName')"
                (blur)="markOnboardFieldTouched('schoolName')"
                [placeholder]="'signup.schoolNamePlaceholder' | translate"
              />
              <p *ngIf="!showOnboardFieldError('schoolName')" class="text-muted mb-0 mt-1 small">{{ 'signup.validation.schoolNameRequired' | translate }}</p>
              <p *ngIf="showOnboardFieldError('schoolName')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('schoolName') | translate }}</p>
            </div>
            <div class="erp-form-group mb-2">
              <label class="erp-label">{{ 'signup.schoolCode' | translate }}</label>
              <input
                class="erp-input"
                [class.erp-input--invalid]="showOnboardFieldError('schoolCode')"
                [(ngModel)]="onboardForm.schoolCode"
                (ngModelChange)="onOnboardFieldInput('schoolCode')"
                (blur)="markOnboardFieldTouched('schoolCode')"
                [placeholder]="'signup.schoolCodePlaceholder' | translate"
              />
              <p *ngIf="!showOnboardFieldError('schoolCode')" class="text-muted mb-0 mt-1 small">{{ 'signup.schoolCodeHint' | translate: getOnboardFieldErrorParams('schoolCode') }}</p>
              <p *ngIf="showOnboardFieldError('schoolCode')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('schoolCode') | translate: getOnboardFieldErrorParams('schoolCode') }}</p>
            </div>
            <div class="erp-form-group mb-2">
              <label class="erp-label">{{ 'signup.adminName' | translate }}</label>
              <input
                class="erp-input"
                [class.erp-input--invalid]="showOnboardFieldError('adminName')"
                [(ngModel)]="onboardForm.adminName"
                (ngModelChange)="onOnboardFieldInput('adminName')"
                (blur)="markOnboardFieldTouched('adminName')"
              />
              <p *ngIf="!showOnboardFieldError('adminName')" class="text-muted mb-0 mt-1 small">{{ 'signup.validation.adminNameRequired' | translate }}</p>
              <p *ngIf="showOnboardFieldError('adminName')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('adminName') | translate }}</p>
            </div>
            <div class="erp-form-group mb-2">
              <label class="erp-label">{{ 'signup.adminEmail' | translate }}</label>
              <input
                class="erp-input"
                [class.erp-input--invalid]="showOnboardFieldError('adminEmail')"
                [(ngModel)]="onboardForm.adminEmail"
                (ngModelChange)="onOnboardFieldInput('adminEmail')"
                (blur)="markOnboardFieldTouched('adminEmail')"
              />
              <p *ngIf="!showOnboardFieldError('adminEmail')" class="text-muted mb-0 mt-1 small">{{ 'signup.adminEmailHint' | translate }}</p>
              <p *ngIf="showOnboardFieldError('adminEmail')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('adminEmail') | translate }}</p>
            </div>
            <div class="erp-form-group mb-2">
              <label class="erp-label" for="onboard-phone-national">{{ 'signup.phone' | translate }}</label>
              <input
                id="onboard-phone-national"
                type="text"
                class="erp-input"
                [class.erp-input--invalid]="showOnboardFieldError('phone')"
                inputmode="numeric"
                autocomplete="tel-national"
                maxlength="10"
                name="onboardPhoneNational"
                [ngModel]="onboardPhoneNational"
                (ngModelChange)="onOnboardNationalPhoneChange($event)"
                (blur)="markOnboardFieldTouched('phone')"
                [placeholder]="'login.phoneNationalPlaceholder' | translate"
              />
              <p *ngIf="!showOnboardFieldError('phone')" class="text-muted mb-0 mt-1 small">{{ 'signup.phoneHintAdmin' | translate }}</p>
              <p *ngIf="showOnboardFieldError('phone')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('phone') | translate }}</p>
            </div>
            <div class="erp-form-group mb-2">
              <label class="erp-label">{{ 'signup.adminPassword' | translate }}</label>
              <div class="d-flex align-items-center gap-2">
                <input
                  [type]="showTempPassword ? 'text' : 'password'"
                  class="erp-input"
                  [class.erp-input--invalid]="showOnboardFieldError('adminPassword')"
                  [(ngModel)]="onboardForm.adminPassword"
                  (ngModelChange)="onOnboardFieldInput('adminPassword')"
                  (blur)="markOnboardFieldTouched('adminPassword')"
                  [placeholder]="'signup.adminPasswordPlaceholder' | translate"
                />
                <button type="button" class="btn-outline-erp btn-sm" (click)="showTempPassword = !showTempPassword">
                  <i class="bi" [ngClass]="showTempPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <p *ngIf="!showOnboardFieldError('adminPassword')" class="text-muted mb-0 mt-1 small">{{ 'signup.passwordHint' | translate: getOnboardFieldErrorParams('adminPassword') }}</p>
              <p *ngIf="showOnboardFieldError('adminPassword')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('adminPassword') | translate: getOnboardFieldErrorParams('adminPassword') }}</p>
            </div>
            <div class="erp-form-group mb-2">
              <label class="erp-label">{{ 'importExport.onboard.academicYearLabel' | translate }}</label>
              <select
                class="erp-select"
                [class.erp-input--invalid]="showOnboardFieldError('academicYearName')"
                [(ngModel)]="onboardForm.academicYearName"
                (ngModelChange)="onAcademicYearOptionChange()"
                (blur)="markOnboardFieldTouched('academicYearName')"
              >
                <option *ngFor="let ay of onboardingAcademicYearOptions" [ngValue]="ay.label">{{ ay.label }}</option>
              </select>
              <p *ngIf="!showOnboardFieldError('academicYearName')" class="text-muted mb-0 mt-1 small">{{ 'importExport.onboard.hints.academicYearSelect' | translate }}</p>
              <p *ngIf="showOnboardFieldError('academicYearName')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('academicYearName') | translate }}</p>
            </div>
            <div class="row g-2">
              <div class="col-6">
                <label class="erp-label">{{ 'importExport.onboard.academicYearStart' | translate }}</label>
                <app-erp-date-picker
                  [class.erp-input--invalid]="showOnboardFieldError('academicYearStartDate')"
                  [(ngModel)]="onboardForm.academicYearStartDate"
                  (ngModelChange)="onAcademicYearDateChanged('academicYearStartDate')"
                  (blur)="markOnboardFieldTouched('academicYearStartDate')"
                  [maxDate]="onboardForm.academicYearEndDate || undefined"
                  placeholderI18nKey="importExport.onboard.datePlaceholder"
                />
                <p *ngIf="!showOnboardFieldError('academicYearStartDate')" class="text-muted mb-0 mt-1 small">{{ 'importExport.onboard.hints.academicYearStart' | translate }}</p>
                <p *ngIf="showOnboardFieldError('academicYearStartDate')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('academicYearStartDate') | translate }}</p>
              </div>
              <div class="col-6">
                <label class="erp-label">{{ 'importExport.onboard.academicYearEnd' | translate }}</label>
                <app-erp-date-picker
                  [class.erp-input--invalid]="showOnboardFieldError('academicYearEndDate')"
                  [(ngModel)]="onboardForm.academicYearEndDate"
                  (ngModelChange)="onAcademicYearDateChanged('academicYearEndDate')"
                  (blur)="markOnboardFieldTouched('academicYearEndDate')"
                  [minDate]="onboardForm.academicYearStartDate || undefined"
                  placeholderI18nKey="importExport.onboard.datePlaceholder"
                />
                <p *ngIf="!showOnboardFieldError('academicYearEndDate')" class="text-muted mb-0 mt-1 small">{{ 'importExport.onboard.hints.academicYearEnd' | translate }}</p>
                <p *ngIf="showOnboardFieldError('academicYearEndDate')" class="text-danger mb-0 mt-1 small">{{ getOnboardFieldError('academicYearEndDate') | translate }}</p>
              </div>
            </div>
            <div class="erp-form-group mb-0 mt-2">
              <label class="erp-label">{{ 'signup.address' | translate }}</label>
              <input class="erp-input" [(ngModel)]="onboardForm.address" [placeholder]="'signup.addressPlaceholder' | translate" />
              <p class="text-muted mb-0 mt-1 small">{{ 'importExport.onboard.hints.address' | translate }}</p>
            </div>
            <p *ngIf="onboardError" class="text-danger mb-0 mt-2">{{ onboardError }}</p>
            <p *ngIf="onboardSuccess" class="text-success mb-0 mt-2">{{ onboardSuccess }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeOnboardModal()">{{ 'importExport.close' | translate }}</button>
            <button type="button" class="btn-primary-erp" (click)="submitOnboardSchool()" [disabled]="onboardSubmitting">
              {{ onboardSubmitting ? ('signup.submitting' | translate) : ('signup.submit' | translate) }}
            </button>
          </div>
        </div>
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
        flex-wrap: wrap;
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
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
      }
      .ie-type-seq {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: -0.02em;
        background: color-mix(in srgb, var(--clr-surface) 88%, var(--clr-text-muted) 12%);
        color: var(--clr-text-muted);
        border: 1px solid color-mix(in srgb, var(--clr-border) 70%, transparent);
      }
      .ie-type-tile--active .ie-type-icon {
        color: #1b3a30;
      }
      .ie-type-tile--active .ie-type-seq {
        background: color-mix(in srgb, var(--clr-accent) 18%, var(--clr-surface));
        color: var(--clr-text);
        border-color: color-mix(in srgb, var(--clr-accent) 40%, transparent);
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
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
      }
      .ie-table {
        min-width: 640px;
      }
      .ie-table.ie-table--lines {
        min-width: 880px;
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
      .ie-patch-pill {
        display: inline-flex;
        align-items: center;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0.2rem 0.45rem;
        border-radius: 6px;
        color: #1b3a30;
        background: rgba(192, 92, 61, 0.12);
        border: 1px solid rgba(192, 92, 61, 0.28);
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
        max-width: min(320px, 100%);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.72rem;
        padding: 0.2rem 0.4rem;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.04);
      }
      .ie-dry-run {
        background: color-mix(in srgb, var(--clr-surface-muted, #f5f5f5) 92%, transparent);
        border-radius: 12px;
      }
      .ie-map {
        background: color-mix(in srgb, var(--clr-surface, #fff) 90%, var(--clr-surface-muted, #f5f5f5));
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.08));
        border-radius: 12px;
      }
      .ie-map .form-select {
        border-color: var(--clr-border, rgba(0, 0, 0, 0.15));
        background-color: var(--clr-surface, #fff);
        color: var(--clr-text, #1a1a1a);
      }
      .ie-map .form-select:focus {
        border-color: color-mix(in srgb, var(--clr-accent, #c05c3d) 55%, var(--clr-border));
        box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--clr-accent, #c05c3d) 20%, transparent);
      }
      .ie-map .btn-outline-secondary {
        border-color: var(--clr-border, rgba(0, 0, 0, 0.18));
        color: var(--clr-text-secondary, #57534e);
        background: color-mix(in srgb, var(--clr-surface, #fff) 96%, var(--clr-surface-muted, #f5f5f5));
      }
      .ie-map .btn-outline-secondary:hover {
        border-color: var(--clr-accent, #c05c3d);
        color: var(--clr-text, #1a1a1a);
        background: color-mix(in srgb, var(--clr-accent, #c05c3d) 10%, var(--clr-surface, #fff));
      }
      .ie-dry-run .alert-info {
        background: color-mix(in srgb, var(--clr-info, #0284c7) 14%, var(--clr-surface, #fff));
        border-color: color-mix(in srgb, var(--clr-info, #0284c7) 30%, var(--clr-border));
        color: var(--clr-text-secondary, #57534e);
      }
      .ie-dry-run .list-unstyled li {
        border-left: 2px solid color-mix(in srgb, var(--clr-danger, #dc3545) 55%, transparent);
        padding-left: 0.55rem;
      }
      .ie-dry-run-stats .ie-dry-run-stat {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .ie-wizard {
        border-radius: 14px;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.08));
        background: var(--clr-surface, #fff);
        padding: 0.75rem 1rem;
        overflow: hidden;
      }
      .ie-wizard-track {
        display: flex;
        flex-wrap: nowrap;
        gap: 0.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.25rem;
        scrollbar-width: thin;
      }
      .ie-wizard-step {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex: 1 1 0;
        min-width: 120px;
        padding: 0.45rem 0.5rem;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.03);
        color: var(--clr-text-muted);
        font-size: 0.78rem;
        font-weight: 600;
        white-space: nowrap;
      }
      .ie-wizard-step--active {
        background: rgba(192, 92, 61, 0.12);
        color: #1b3a30;
        border: 1px solid rgba(192, 92, 61, 0.35);
      }
      .ie-wizard-step--done {
        background: rgba(27, 58, 48, 0.08);
        color: #1b3a30;
      }
      .ie-wizard-num {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 800;
        background: rgba(0, 0, 0, 0.06);
        flex-shrink: 0;
      }
      .ie-wizard-step--active .ie-wizard-num {
        background: #c05c3d;
        color: #fff;
      }
      .ie-wizard-step--done .ie-wizard-num {
        background: #1b3a30;
        color: #fff;
      }
      .ie-table.ie-table--map {
        min-width: 480px;
      }
      .ie-map-scroll {
        max-height: min(420px, 56vh);
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 12px;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.08));
      }
      .ie-map-scroll .ie-table--map {
        min-width: 520px;
      }
      .ie-table--map thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: color-mix(in srgb, var(--clr-surface) 92%, var(--clr-surface-alt));
      }
      .ie-table--map tbody tr:nth-child(2n) td {
        background: color-mix(in srgb, var(--clr-surface-alt) 76%, transparent);
      }
      .ie-table--map td {
        vertical-align: middle;
      }
      .ie-metrics .ie-metric-tile {
        border-radius: 12px;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.08));
        background: linear-gradient(180deg, rgba(27, 58, 48, 0.04) 0%, var(--clr-surface, #fff) 100%);
        padding: 0.85rem 1rem;
        min-height: 88px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.25rem;
      }
      .ie-metric-val {
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.2;
        color: var(--clr-text, #1a1a1a);
      }
      .ie-metric-lbl {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--clr-text-muted, #6c757d);
        line-height: 1.25;
      }
      .ie-school-code-input {
        border-radius: 10px;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.14));
        background: var(--clr-surface, #fff);
        color: var(--clr-text, #1a1a1a);
      }
      .ie-school-code-input:focus {
        border-color: rgba(192, 92, 61, 0.55);
        box-shadow: 0 0 0 0.2rem rgba(192, 92, 61, 0.16);
      }
      .ie-school-code-input--invalid {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.12) !important;
      }
      .ie-school-picker-wrap {
        position: relative;
      }
      .ie-school-picker-dropdown {
        position: absolute;
        inset-inline: 0;
        top: calc(100% + 6px);
        z-index: 25;
        border: 1px solid var(--clr-border, rgba(0, 0, 0, 0.12));
        border-radius: 10px;
        background: var(--clr-surface, #fff);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        max-height: 240px;
        overflow-y: auto;
      }
      .ie-school-option {
        width: 100%;
        border: 0;
        background: transparent;
        text-align: left;
        padding: 0.55rem 0.7rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .ie-school-option:hover {
        background: rgba(192, 92, 61, 0.08);
      }
      .ie-school-option-name {
        font-size: 0.84rem;
        font-weight: 600;
        color: var(--clr-text, #1a1a1a);
      }
      .ie-school-option-code {
        font-size: 0.75rem;
        color: var(--clr-text-muted, #6c757d);
      }
      :host-context([data-theme='dark']) .ie-section {
        box-shadow: 0 10px 26px rgba(2, 6, 23, 0.28);
      }
      :host-context([data-theme='dark']) .ie-map {
        background: linear-gradient(
          165deg,
          color-mix(in srgb, var(--clr-surface) 94%, #0b1220) 0%,
          color-mix(in srgb, var(--clr-surface-alt) 95%, #0b1220) 100%
        );
        border-color: color-mix(in srgb, var(--clr-primary) 18%, var(--clr-border));
      }
      :host-context([data-theme='dark']) .ie-map .form-select {
        background-color: color-mix(in srgb, var(--clr-surface-alt) 96%, #0b1220);
        border-color: color-mix(in srgb, var(--clr-primary) 16%, var(--clr-border));
        color: var(--clr-text);
      }
      :host-context([data-theme='dark']) .ie-map .form-select option {
        background: var(--clr-surface-alt);
        color: var(--clr-text);
      }
      :host-context([data-theme='dark']) .ie-map .btn-outline-secondary {
        background: color-mix(in srgb, var(--clr-surface-alt) 97%, #0b1220);
        border-color: color-mix(in srgb, var(--clr-primary) 20%, var(--clr-border));
        color: var(--clr-text-secondary);
      }
      :host-context([data-theme='dark']) .ie-map .btn-outline-secondary:hover {
        background: color-mix(in srgb, var(--clr-primary) 18%, var(--clr-surface-alt));
        color: var(--clr-text);
      }
      :host-context([data-theme='dark']) .ie-dry-run {
        background: linear-gradient(
          165deg,
          color-mix(in srgb, var(--clr-surface-alt) 94%, #0b1220) 0%,
          color-mix(in srgb, var(--clr-surface-muted) 92%, #0b1220) 100%
        );
        border: 1px solid color-mix(in srgb, var(--clr-primary) 14%, var(--clr-border));
      }
      :host-context([data-theme='dark']) .ie-dry-run .alert-info {
        background: color-mix(in srgb, var(--clr-info) 22%, var(--clr-surface-alt));
        border-color: color-mix(in srgb, var(--clr-info) 35%, var(--clr-border));
        color: var(--clr-text-secondary);
      }
      :host-context([data-theme='dark']) .ie-table-wrap {
        border-color: color-mix(in srgb, var(--clr-primary) 16%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-surface-alt) 96%, #0b1220);
      }
      :host-context([data-theme='dark']) .ie-map-scroll {
        border-color: color-mix(in srgb, var(--clr-primary) 16%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-surface-alt) 96%, #0b1220);
      }
      :host-context([data-theme='dark']) .ie-table--map thead th {
        background: color-mix(in srgb, var(--clr-surface-alt) 94%, #0b1220);
      }
      :host-context([data-theme='dark']) .ie-table--map tbody tr:nth-child(2n) td {
        background: color-mix(in srgb, var(--clr-surface-muted) 44%, transparent);
      }
      :host-context([data-theme='dark']) .ie-table tbody tr:hover {
        background: color-mix(in srgb, var(--clr-primary) 12%, transparent);
      }
      :host-context([data-theme='dark']) .ie-row--open {
        background: color-mix(in srgb, var(--clr-accent) 14%, transparent) !important;
      }
      :host-context([data-theme='dark']) .ie-file-chip {
        background: color-mix(in srgb, var(--clr-primary) 18%, transparent);
        color: var(--clr-text-secondary);
      }
      @media (max-width: 575.98px) {
        .ie-title {
          font-size: 1.35rem;
        }
        .ie-hero {
          padding: 1rem !important;
        }
        .ie-dropzone-inner {
          flex-direction: column;
          align-items: flex-start !important;
        }
        .ie-wizard-step {
          min-width: 100px;
          font-size: 0.72rem;
        }
      }
    `,
  ],
})
export class ImportExportComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>;

  private static readonly ACADEMIC_YEAR_MONTH_START = 4;
  private static readonly ACADEMIC_YEAR_MONTH_END = 3;

  /**
   * Order matches onboarding: classes → teachers + staff (library) → students → timetable → fees.
   * Seq badges are shown on tiles so super admins can follow the same order as sales CSV packs.
   */
  jobTypes: JobTypeOption[] = [
    { id: 'CLASSES', file: 'classes.csv', icon: 'bi-diagram-3-fill', seq: 1 },
    { id: 'TEACHERS', file: 'teachers.csv', icon: 'bi-person-workspace', seq: 2 },
    { id: 'STAFF', file: 'staff.csv', icon: 'bi-person-badge-fill', seq: 3 },
    { id: 'STUDENTS', file: 'students.csv', icon: 'bi-people-fill', seq: 4 },
    { id: 'TIMETABLE', file: 'timetable.csv', icon: 'bi-calendar-week-fill', seq: 5 },
    { id: 'FEE_STRUCTURES', file: 'fee-structures.csv', icon: 'bi-cash-stack', seq: 6 },
  ];

  /** Default job type: start with classes (see {@link jobTypes} for full sequence). */
  jobType = 'CLASSES';
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
  /** Import ledger: per-row create / update / skip (after successful line commit). */
  ledgerRows: ImportLedgerLine[] = [];
  ledgerLoading = false;
  /** Operator-facing undo copy (no automatic deletes). */
  rollbackBrief: RollbackBundleResponse | null = null;
  dragOver = false;
  dryRunBusy = false;
  dryRunResult: DryRunResponse | null = null;
  /** BEST_EFFORT (default) or ALL_OR_NOTHING (single DB transaction, smaller files). */
  executionMode: 'BEST_EFFORT' | 'ALL_OR_NOTHING' = 'BEST_EFFORT';
  /** Force same-file submit to run as a new corrective import job (when backend allows it). */
  reprocessImport = false;

  /** 0..4 — upload, map, validate, queue, report */
  wizardStepIndex = 0;
  readonly wizardSteps = [
    { labelKey: 'importExport.wizardStepUpload' },
    { labelKey: 'importExport.wizardStepMap' },
    { labelKey: 'importExport.wizardStepValidate' },
    { labelKey: 'importExport.wizardStepQueue' },
    { labelKey: 'importExport.wizardStepReport' },
  ];

  headerPreview: FileHeaderPreview | null = null;
  previewLoading = false;
  /** File header → canonical field (empty = ignore column). */
  columnSelections: Record<string, string> = {};

  metricsSummary: ImportMetricsSummary | null = null;
  metricsLoading = false;
  targetSchoolCode = '';
  targetSchoolCodeTouched = false;
  showSchoolPicker = false;
  schoolOptionsLoading = false;
  schoolOptions: PlatformSchoolSummary[] = [];
  isSuperAdmin = false;
  onboardModalOpen = false;
  onboardSubmitting = false;
  showTempPassword = false;
  onboardError = '';
  onboardSuccess = '';
  globalFlowMessage = '';
  globalFlowMessageContext = '';
  globalFlowMessageOk = true;
  onboardValidationErrors: FieldErrors<OnboardSchoolField> = {};
  onboardTouched: Partial<Record<OnboardSchoolField, boolean>> = {};
  onboardingAcademicYearOptions: Array<{ label: string; academicYearStartDate: string; academicYearEndDate: string }> = [];
  onboardForm: OnboardSchoolRequest = this.createEmptyOnboardForm();
  /** UI digits only; {@link onboardForm}.phone is 10-digit national for the API. */
  onboardPhoneNational = '';
  private liveRefreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private importExport: ImportExportService,
    private translate: TranslateService,
    private authService: AuthService,
    private platformService: PlatformService
  ) {}

  get mappingIncomplete(): boolean {
    if (!this.headerPreview) {
      return true;
    }
    const mapped = new Set(
      Object.values(this.columnSelections).filter(v => !!v && String(v).trim().length > 0)
    );
    if (this.jobType === 'FEE_STRUCTURES') {
      const hasBase = mapped.has('name') && mapped.has('academic_year_id') && mapped.has('component_spec');
      const hasClassRef = mapped.has('class_id') || mapped.has('class_name');
      return !(hasBase && hasClassRef);
    }
    if (this.jobType === 'TIMETABLE') {
      const hasSubject =
        mapped.has('subject_name') || mapped.has('subjectname') || mapped.has('subject_code');
      const req = REQUIRED_IMPORT_FIELDS[this.jobType] ?? [];
      return !hasSubject || req.some(f => !mapped.has(f));
    }
    const req = REQUIRED_IMPORT_FIELDS[this.jobType] ?? [];
    return req.some(f => !mapped.has(f));
  }

  get canRunDryRun(): boolean {
    const hasSchoolScope = !this.isSuperAdmin || this.hasTargetSchoolCode;
    return hasSchoolScope && !!this.file && !!this.headerPreview && !this.busy && !this.dryRunBusy && !this.previewLoading && !this.mappingIncomplete;
  }

  get canImportData(): boolean {
    if (!this.canRunDryRun) {
      return false;
    }
    if (!this.dryRunResult || this.dryRunResult.invalidRows !== 0) {
      return false;
    }
    return this.dryRunResult.importBlocked !== true;
  }

  get hasTargetSchoolCode(): boolean {
    return !!this.effectiveSchoolCode;
  }

  get showSchoolCodeValidationError(): boolean {
    return this.isSuperAdmin && this.targetSchoolCodeTouched && !this.hasTargetSchoolCode;
  }

  get schoolCodeValidationMessageKey(): string {
    return this.targetSchoolCode.trim().length > 0
      ? 'importExport.targetSchoolCodeNoMatch'
      : 'importExport.targetSchoolCodeRequired';
  }

  get filteredSchoolOptions(): PlatformSchoolSummary[] {
    const query = this.targetSchoolCode.trim().toLowerCase();
    const source = this.schoolOptions.filter(s => s.active);
    if (!query) {
      return source.slice(0, 8);
    }
    return source
      .filter(s => s.schoolName.toLowerCase().includes(query) || s.schoolCode.toLowerCase().includes(query))
      .slice(0, 8);
  }

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

  jobExecutionModeLabel(raw: string | null | undefined): string {
    const id = String(raw || 'BEST_EFFORT').toUpperCase();
    const key = `importExport.executionModeShort.${id}`;
    return this.translate.instant(key);
  }

  patchJobBadgeLabel(): string {
    const key = 'importExport.patchJobBadge';
    const translated = this.translate.instant(key);
    return translated !== key ? translated : 'Patch job';
  }

  lineStatusLabel(raw: string): string {
    const id = String(raw || '').toUpperCase();
    const key = `importExport.lineStatus.${id}`;
    const t = this.translate.instant(key);
    return t !== key ? t : raw;
  }

  dryRunDedupeKeyHint(): string {
    switch ((this.jobType || '').toUpperCase()) {
      case 'TEACHERS':
      case 'STAFF':
        return 'phone';
      case 'STUDENTS':
        return 'admissionnumber (parent household by parentphone)';
      case 'TIMETABLE':
        return 'class+section+day+period; teacher by id, phone, or email (conflicts checked)';
      case 'FEE_STRUCTURES':
        return 'class+academicyearid+name';
      default:
        return 'entity natural key';
    }
  }

  groupedDryRunErrorBuckets(): Array<{ code: string; count: number }> {
    if (!this.dryRunResult?.sampleErrors?.length) {
      return [];
    }
    const counts = new Map<string, number>();
    for (const e of this.dryRunResult.sampleErrors) {
      const code = (e.errorCode || 'VALIDATION_ERROR').toUpperCase();
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([code, count]) => ({ code, count }));
  }

  dryRunErrorCodeLabel(raw: string | null | undefined): string {
    const code = String(raw || 'VALIDATION_ERROR').toUpperCase();
    const key = `importExport.dryRunCode.${code}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : code;
  }

  humanizeDryRunMessage(message: string | null | undefined, code: string | null | undefined): string {
    const msg = String(message || '').trim();
    const normalizedCode = String(code || '').toUpperCase();
    if (normalizedCode === 'FK_NOT_FOUND' && msg.toLowerCase().includes('teacher not found')) {
      return this.translate.instant('importExport.dryRunTeacherMissing');
    }
    if (normalizedCode === 'DUPLICATE_IN_FILE' && msg.toLowerCase().includes('double-booked')) {
      return this.translate.instant('importExport.dryRunTeacherDoubleBooked');
    }
    return msg;
  }

  get activeTypeFile(): string {
    return this.jobTypes.find(j => j.id === this.jobType)?.file ?? 'students.csv';
  }

  ngOnInit(): void {
    this.isSuperAdmin = (this.authService.getRole() || '').toLowerCase() === 'super_admin';
    if (this.isSuperAdmin) {
      this.loadSchoolCodeOptions();
    }
    this.loadMetrics();
    this.reloadJobs();
    this.startLiveRefreshLoop();
  }

  ngOnDestroy(): void {
    this.stopLiveRefreshLoop();
  }

  loadMetrics(): void {
    if (this.isSuperAdmin && !this.hasTargetSchoolCode) {
      this.metricsSummary = null;
      this.metricsLoading = false;
      return;
    }
    this.metricsLoading = true;
    this.importExport.getMetricsSummary(this.effectiveSchoolCode).subscribe({
      next: m => {
        this.metricsSummary = m;
        this.metricsLoading = false;
      },
      error: () => {
        this.metricsLoading = false;
      },
    });
  }

  onJobTypeSelect(id: string): void {
    this.jobType = id;
    this.resetDryRunState();
    if (this.file) {
      this.loadHeaderPreview();
    }
  }

  private loadHeaderPreview(): void {
    if (!this.ensureSchoolCodePresentForSuperAdmin()) {
      this.previewLoading = false;
      this.headerPreview = null;
      this.columnSelections = {};
      this.dryRunResult = null;
      this.lastSubmitMsg = this.translate.instant('importExport.targetSchoolCodeRequired');
      this.lastSubmitOk = false;
      return;
    }
    if (!this.file) {
      return;
    }
    this.previewLoading = true;
    this.headerPreview = null;
    this.columnSelections = {};
    this.dryRunResult = null;
    this.importExport.previewHeaders(this.jobType, this.file, this.effectiveSchoolCode).subscribe({
      next: p => {
        this.headerPreview = p;
        this.initColumnSelections(p);
        this.wizardStepIndex = 1;
        this.previewLoading = false;
      },
      error: () => {
        this.previewLoading = false;
        this.lastSubmitMsg = this.translate.instant('importExport.previewFailed');
        this.lastSubmitOk = false;
      },
    });
  }

  private initColumnSelections(p: FileHeaderPreview): void {
    const next: Record<string, string> = {};
    for (const h of p.detectedHeaders) {
      next[h] = p.suggestedMapping[h] ?? '';
    }
    this.columnSelections = next;
  }

  resetMappingToSuggested(): void {
    if (this.headerPreview) {
      this.initColumnSelections(this.headerPreview);
      this.resetDryRunState();
    }
  }

  onColumnMappingChanged(): void {
    this.resetDryRunState();
  }

  onTargetSchoolCodeChanged(): void {
    this.targetSchoolCode = this.targetSchoolCode.toUpperCase();
    this.showSchoolPicker = true;
    this.resetDryRunState();
    this.reloadJobs();
    this.loadMetrics();
  }

  onSchoolCodeBlur(): void {
    this.targetSchoolCodeTouched = true;
    setTimeout(() => {
      this.showSchoolPicker = false;
    }, 120);
  }

  selectSchoolCodeOption(school: PlatformSchoolSummary): void {
    this.targetSchoolCode = school.schoolCode.toUpperCase();
    this.targetSchoolCodeTouched = true;
    this.showSchoolPicker = false;
    this.onTargetSchoolCodeChanged();
  }

  /** JSON for multipart `columnMappingJson`, or null when mapping not needed (identity). */
  private buildColumnMappingJson(): string | null {
    if (!this.headerPreview) {
      return null;
    }
    const o: Record<string, string> = {};
    for (const h of this.headerPreview.detectedHeaders) {
      const v = this.columnSelections[h];
      if (v && String(v).trim().length > 0) {
        o[h] = v.trim();
      }
    }
    if (Object.keys(o).length === 0) {
      return null;
    }
    const allIdentity = Object.keys(o).every(k => k === o[k]);
    if (allIdentity) {
      return null;
    }
    return JSON.stringify(o);
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
    if (f && this.isAllowedImportFile(f)) {
      this.file = f;
      this.lastSubmitMsg = '';
      this.lastSubmitOk = null;
      this.resetImportDraftState();
      this.loadHeaderPreview();
    }
  }

  onFile(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.file = input.files && input.files.length ? input.files[0] : null;
    this.lastSubmitMsg = '';
    this.lastSubmitOk = null;
    this.resetImportDraftState();
    if (this.file) {
      this.loadHeaderPreview();
    }
  }

  private isAllowedImportFile(f: File): boolean {
    const n = f.name.toLowerCase();
    return n.endsWith('.zip') || n.endsWith('.csv') || n.endsWith('.xlsx');
  }

  clearFile(input: HTMLInputElement): void {
    this.file = null;
    input.value = '';
    this.resetImportDraftState();
  }

  runDryRun(): void {
    if (!this.ensureSchoolCodePresentForSuperAdmin()) return;
    if (!this.canRunDryRun || !this.file || !this.headerPreview) return;
    this.resetDryRunState();
    this.dryRunBusy = true;
    const mapJson = this.buildColumnMappingJson();
    this.importExport.dryRun(this.jobType, this.file, mapJson, this.effectiveSchoolCode).subscribe({
      next: r => {
        this.dryRunResult = r;
        this.wizardStepIndex = 2;
        this.lastSubmitMsg = this.translate.instant('importExport.msgDryRunDone');
        this.lastSubmitOk = r.invalidRows === 0;
      },
      error: e => {
        const errMsg = e?.message || this.translate.instant('importExport.msgDryRunFailed');
        this.lastSubmitMsg = errMsg;
        this.lastSubmitOk = false;
        this.dryRunBusy = false;
      },
      complete: () => (this.dryRunBusy = false),
    });
  }

  submit(): void {
    if (!this.ensureSchoolCodePresentForSuperAdmin()) return;
    if (!this.canImportData || !this.file || !this.headerPreview) return;
    this.wizardStepIndex = 3;
    this.busy = true;
    this.lastSubmitMsg = '';
    this.lastSubmitOk = null;
    const mapJson = this.buildColumnMappingJson();
    this.importExport.submitJob(this.jobType, this.file, mapJson, this.effectiveSchoolCode, this.executionMode, this.reprocessImport).subscribe({
      next: r => {
        this.wizardStepIndex = 4;
        this.lastSubmitMsg = this.translate.instant('importExport.msgQueued', { jobId: r.jobId, rows: r.totalRows });
        if (r.advisoryMessage) {
          this.lastSubmitMsg = `${this.lastSubmitMsg} ${r.advisoryMessage}`;
        }
        this.lastSubmitOk = true;
        this.reloadJobs();
        this.loadMetrics();
        this.clearSelectedImportState();
        setTimeout(() => {
          const el = document.getElementById('import-export-report');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      },
      error: e => {
        this.lastSubmitMsg = e?.message || this.translate.instant('importExport.msgUploadFailed');
        this.lastSubmitOk = false;
        this.busy = false;
      },
      complete: () => (this.busy = false),
    });
  }

  private resetDryRunState(): void {
    this.dryRunResult = null;
    this.dryRunBusy = false;
  }

  /**
   * Clears selected file + mapped columns so the next import can start immediately.
   * Keeps submit status banner intact for operator visibility.
   */
  private clearSelectedImportState(): void {
    this.file = null;
    this.resetImportDraftState();
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  private resetImportDraftState(): void {
    this.resetDryRunState();
    this.headerPreview = null;
    this.columnSelections = {};
    this.wizardStepIndex = 0;
    this.previewLoading = false;
    this.executionMode = 'BEST_EFFORT';
    this.reprocessImport = false;
  }

  reloadJobs(): void {
    if (this.isSuperAdmin && !this.hasTargetSchoolCode) {
      this.jobs = [];
      this.pagedJobs = [];
      this.jobsLoading = false;
      return;
    }
    this.jobsLoading = true;
    this.importExport.listJobs(0, 50, this.effectiveSchoolCode).subscribe({
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
    this.ledgerLoading = true;
    this.lines = [];
    this.pagedLines = [];
    this.ledgerRows = [];
    this.rollbackBrief = null;
    forkJoin({
      lines: this.importExport.getLines(j.id, 0, 200, this.effectiveSchoolCode),
      ledger: this.importExport.getLedger(j.id, 0, 500, this.effectiveSchoolCode),
      rb: this.importExport.getRollbackBrief(j.id, this.effectiveSchoolCode),
    }).subscribe({
      next: res => {
        this.lines = res.lines.content;
        this.linesPageIndex = 0;
        this.applyLinesPage();
        this.ledgerRows = res.ledger.content;
        this.rollbackBrief = res.rb;
        this.linesLoading = false;
        this.ledgerLoading = false;
      },
      error: () => {
        this.linesLoading = false;
        this.ledgerLoading = false;
      },
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
    this.ledgerRows = [];
    this.rollbackBrief = null;
  }

  retry(j: ImportJobSummary): void {
    this.busy = true;
    this.importExport.retryFailed(j.id, this.effectiveSchoolCode).subscribe({
      next: () => {
        this.lastSubmitMsg = this.translate.instant('importExport.msgRetryQueued', { id: j.id });
        this.lastSubmitOk = true;
        this.reloadJobs();
        this.loadMetrics();
      },
      error: e => {
        this.lastSubmitMsg = e?.message || this.translate.instant('importExport.msgRetryFailed');
        this.lastSubmitOk = false;
      },
      complete: () => (this.busy = false),
    });
  }

  canDownloadNormalizedJob(j: ImportJobSummary): boolean {
    const s = (j.status || '').toUpperCase();
    if (s === 'QUEUED' || s === 'RUNNING') {
      return false;
    }
    const t = (j.jobType || '').toUpperCase();
    return t === 'STUDENTS' || t === 'TEACHERS' || t === 'STAFF';
  }

  downloadNormalizedJobCsv(j: ImportJobSummary): void {
    this.busy = true;
    this.importExport.downloadNormalizedJobCsv(j.id, this.effectiveSchoolCode).subscribe({
      next: blob => {
        this.saveBlob(blob, `import-job-${j.id}-normalized.csv`);
        this.lastSubmitMsg = this.translate.instant('importExport.msgNormalizedDownloadOk', { id: j.id });
        this.lastSubmitOk = true;
      },
      error: e => {
        this.lastSubmitMsg = e?.message || this.translate.instant('importExport.msgNormalizedDownloadFailed');
        this.lastSubmitOk = false;
      },
      complete: () => (this.busy = false),
    });
  }

  exportCanonicalCsv(exportType: 'STUDENTS' | 'TEACHERS' | 'STAFF' | 'FEE_STRUCTURES'): void {
    this.busy = true;
    this.importExport.createExportJob(exportType, this.effectiveSchoolCode).subscribe({
      next: job => {
        this.lastSubmitMsg = this.translate.instant('importExport.msgExportQueued', { id: job.id, type: exportType });
        this.lastSubmitOk = true;
        this.pollExportJob(job.id, exportType, 0);
      },
      error: e => {
        this.lastSubmitMsg = e?.message || this.translate.instant('importExport.msgExportFailed');
        this.lastSubmitOk = false;
        this.busy = false;
      },
    });
  }

  private pollExportJob(jobId: number, exportType: string, attempt: number): void {
    this.importExport.getExportJob(jobId, this.effectiveSchoolCode).subscribe({
      next: (job: ExportJobSummary) => {
        const status = (job.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          this.importExport.downloadExportJobCsv(jobId, this.effectiveSchoolCode).subscribe(blob => {
            const fileName = this.exportFileName(exportType, jobId);
            this.saveBlob(blob, fileName);
            this.lastSubmitMsg = this.translate.instant('importExport.msgExportDownloadReady', { id: jobId });
            this.lastSubmitOk = true;
            this.busy = false;
          });
          return;
        }
        if (status === 'FAILED') {
          this.lastSubmitMsg = job.errorMessage || this.translate.instant('importExport.msgExportFailed');
          this.lastSubmitOk = false;
          this.busy = false;
          return;
        }
        if (attempt >= 80) {
          this.lastSubmitMsg = this.translate.instant('importExport.msgExportTimeout');
          this.lastSubmitOk = false;
          this.busy = false;
          return;
        }
        setTimeout(() => this.pollExportJob(jobId, exportType, attempt + 1), 1500);
      },
      error: () => {
        this.lastSubmitMsg = this.translate.instant('importExport.msgExportFailed');
        this.lastSubmitOk = false;
        this.busy = false;
      },
    });
  }

  private exportFileName(exportType: string, jobId: number): string {
    const suffix = new Date().toISOString().slice(0, 10);
    const p = exportType.toLowerCase();
    return `canonical-${p}-${suffix}-${jobId}.csv`;
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

  ledgerOutcomeClass(outcome: string): string {
    const o = (outcome || '').toUpperCase();
    if (o === 'CREATED') return 'ie-st-completed';
    if (o === 'UPDATED') return 'ie-st-running';
    if (o === 'SKIPPED') return 'ie-st-pending';
    return 'ie-st-pending';
  }

  formatJobDuration(job: ImportJobSummary): string {
    const durationMs = this.computeDurationMs(job);
    if (durationMs === null) {
      return '—';
    }
    if (durationMs < 1000) {
      return '<1s';
    }
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  private computeDurationMs(job: ImportJobSummary): number | null {
    const startedAtMs = this.toEpochMs(job.startedAt);
    if (startedAtMs === null) {
      return null;
    }
    const finishedAtMs = this.toEpochMs(job.finishedAt);
    const endMs = finishedAtMs ?? Date.now();
    if (endMs < startedAtMs) {
      return null;
    }
    return endMs - startedAtMs;
  }

  private toEpochMs(value: string | null): number | null {
    if (!value) {
      return null;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * For super admin, only emit a workspace code once it matches an active school — avoids API calls while typing prefixes
   * (backend used to reject unknown codes with 401 and clear the portal session).
   */
  private get effectiveSchoolCode(): string | null {
    if (!this.isSuperAdmin) {
      return null;
    }
    const raw = this.targetSchoolCode.trim().toUpperCase();
    if (!raw.length) {
      return null;
    }
    const match = this.schoolOptions.find(s => s.active && s.schoolCode.trim().toUpperCase() === raw);
    return match ? match.schoolCode.trim().toUpperCase() : null;
  }

  private ensureSchoolCodePresentForSuperAdmin(): boolean {
    if (!this.isSuperAdmin) {
      return true;
    }
    this.targetSchoolCodeTouched = true;
    return this.hasTargetSchoolCode;
  }

  private loadSchoolCodeOptions(): void {
    this.schoolOptionsLoading = true;
    this.platformService.getSchools().subscribe({
      next: rows => {
        this.schoolOptions = rows ?? [];
        this.schoolOptionsLoading = false;
        /** Typing ahead of catalog load — now we can resolve a full code and refresh panels */
        if (this.isSuperAdmin) {
          this.reloadJobs();
          this.loadMetrics();
        }
      },
      error: () => {
        this.schoolOptions = [];
        this.schoolOptionsLoading = false;
      },
    });
  }

  private startLiveRefreshLoop(): void {
    this.stopLiveRefreshLoop();
    this.liveRefreshTimer = setInterval(() => {
      this.reloadJobs();
      this.loadMetrics();
      if (this.selectedJob) {
        this.selectJob(this.selectedJob);
      }
    }, 5000);
  }

  private stopLiveRefreshLoop(): void {
    if (!this.liveRefreshTimer) {
      return;
    }
    clearInterval(this.liveRefreshTimer);
    this.liveRefreshTimer = null;
  }

  openOnboardModal(): void {
    this.onboardModalOpen = true;
    this.onboardForm = this.createEmptyOnboardForm();
    this.onboardPhoneNational = '';
    this.onboardError = '';
    this.onboardSuccess = '';
    this.onboardValidationErrors = {};
    this.onboardTouched = {};
    this.onboardingAcademicYearOptions = this.buildAcademicYearOptions();
    if (!this.onboardForm.academicYearStartDate || !this.onboardForm.academicYearEndDate) {
      const now = new Date();
      const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      this.onboardForm.academicYearStartDate = `${startYear}-04-01`;
      this.onboardForm.academicYearEndDate = `${startYear + 1}-03-31`;
    }
    if (!this.onboardForm.academicYearName) {
      this.onboardForm.academicYearName = this.findAcademicYearLabel(
        this.onboardForm.academicYearStartDate,
        this.onboardForm.academicYearEndDate
      );
    }
    this.ensureAcademicYearOptionExists();
  }

  closeOnboardModal(): void {
    this.onboardModalOpen = false;
  }

  clearGlobalFlowMessage(): void {
    this.globalFlowMessage = '';
    this.globalFlowMessageContext = '';
  }

  private validateOnboardForm(): FieldErrors<OnboardSchoolField> {
    const errors = validateOnboardSchoolForm(this.onboardForm);
    if (!(this.onboardForm.academicYearName || '').trim()) errors.academicYearName = 'importExport.onboard.errors.academicYearNameRequired';
    if (!(this.onboardForm.academicYearStartDate || '').trim()) errors.academicYearStartDate = 'importExport.onboard.errors.academicYearStartRequired';
    if (!(this.onboardForm.academicYearEndDate || '').trim()) errors.academicYearEndDate = 'importExport.onboard.errors.academicYearEndRequired';
    if (this.onboardForm.academicYearStartDate && this.onboardForm.academicYearEndDate && this.onboardForm.academicYearEndDate <= this.onboardForm.academicYearStartDate) {
      errors.academicYearEndDate = 'importExport.onboard.errors.academicYearRange';
    }
    return errors;
  }

  private markAllOnboardFieldsTouched(): void {
    this.onboardTouched = {
      schoolName: true,
      schoolCode: true,
      adminName: true,
      adminEmail: true,
      adminPassword: true,
      phone: true,
      academicYearName: true,
      academicYearStartDate: true,
      academicYearEndDate: true,
    };
  }

  markOnboardFieldTouched(field: OnboardSchoolField): void {
    this.onboardTouched[field] = true;
    this.onboardValidationErrors = this.validateOnboardForm();
  }

  onOnboardFieldInput(field: OnboardSchoolField): void {
    if (field === 'schoolCode') {
      this.onboardForm.schoolCode = (this.onboardForm.schoolCode || '').toUpperCase();
    }
    if (!this.onboardTouched[field]) {
      return;
    }
    this.onboardValidationErrors = this.validateOnboardForm();
  }

  onOnboardNationalPhoneChange(raw: string): void {
    const d = String(raw ?? '').replace(/\D/g, '').slice(0, 10);
    this.onboardPhoneNational = d;
    this.onboardForm.phone = d.length === 10 ? d : '';
    this.onOnboardFieldInput('phone');
  }

  onAcademicYearOptionChange(): void {
    const selected = this.onboardingAcademicYearOptions.find(ay => ay.label === (this.onboardForm.academicYearName || ''));
    if (selected) {
      this.onboardForm.academicYearStartDate = selected.academicYearStartDate;
      this.onboardForm.academicYearEndDate = selected.academicYearEndDate;
    }
    this.onOnboardFieldInput('academicYearName');
    this.onOnboardFieldInput('academicYearStartDate');
    this.onOnboardFieldInput('academicYearEndDate');
  }

  onAcademicYearDateChanged(field: 'academicYearStartDate' | 'academicYearEndDate'): void {
    this.syncAcademicYearLabelFromDates();
    this.ensureAcademicYearOptionExists();
    this.onOnboardFieldInput(field);
    this.onOnboardFieldInput('academicYearName');
  }

  private syncAcademicYearLabelFromDates(): void {
    this.onboardForm.academicYearName = this.findAcademicYearLabel(
      this.onboardForm.academicYearStartDate,
      this.onboardForm.academicYearEndDate
    );
  }

  private findAcademicYearLabel(startDate?: string, endDate?: string): string {
    const startYear = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? Number(startDate.slice(0, 4)) : NaN;
    const endYear = endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? Number(endDate.slice(0, 4)) : NaN;
    if (!Number.isNaN(startYear) && !Number.isNaN(endYear)) {
      return `${startYear}-${endYear}`;
    }
    const now = new Date();
    const fallbackStartYear = now.getMonth() + 1 >= ImportExportComponent.ACADEMIC_YEAR_MONTH_START
      ? now.getFullYear()
      : now.getFullYear() - 1;
    return `${fallbackStartYear}-${fallbackStartYear + 1}`;
  }

  private ensureAcademicYearOptionExists(): void {
    const label = (this.onboardForm.academicYearName || '').trim();
    const start = (this.onboardForm.academicYearStartDate || '').trim();
    const end = (this.onboardForm.academicYearEndDate || '').trim();
    if (!label || !start || !end) {
      return;
    }
    if (this.onboardingAcademicYearOptions.some(ay => ay.label === label)) {
      return;
    }
    this.onboardingAcademicYearOptions = [
      ...this.onboardingAcademicYearOptions,
      { label, academicYearStartDate: start, academicYearEndDate: end },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }

  private buildAcademicYearOptions(): Array<{ label: string; academicYearStartDate: string; academicYearEndDate: string }> {
    const now = new Date();
    const currentStartYear = now.getMonth() + 1 >= ImportExportComponent.ACADEMIC_YEAR_MONTH_START
      ? now.getFullYear()
      : now.getFullYear() - 1;
    const options: Array<{ label: string; academicYearStartDate: string; academicYearEndDate: string }> = [];
    for (let startYear = currentStartYear - 2; startYear <= currentStartYear + 6; startYear++) {
      const endYear = startYear + 1;
      options.push({
        label: `${startYear}-${endYear}`,
        academicYearStartDate: `${startYear}-${String(ImportExportComponent.ACADEMIC_YEAR_MONTH_START).padStart(2, '0')}-01`,
        academicYearEndDate: `${endYear}-${String(ImportExportComponent.ACADEMIC_YEAR_MONTH_END).padStart(2, '0')}-31`,
      });
    }
    return options;
  }

  showOnboardFieldError(field: OnboardSchoolField): boolean {
    return !!this.onboardTouched[field] && !!this.onboardValidationErrors[field];
  }

  getOnboardFieldError(field: OnboardSchoolField): string {
    return this.onboardValidationErrors[field] || '';
  }

  getOnboardFieldErrorParams(field: OnboardSchoolField): Record<string, number> {
    if (field === 'schoolCode') return { min: ONBOARD_SCHOOL_CODE_MIN, max: ONBOARD_SCHOOL_CODE_MAX };
    if (field === 'adminPassword') return { min: ONBOARD_ADMIN_PASSWORD_MIN, max: ONBOARD_ADMIN_PASSWORD_MAX };
    return {};
  }

  submitOnboardSchool(): void {
    this.onboardError = '';
    this.onboardSuccess = '';
    this.markAllOnboardFieldsTouched();
    this.onboardValidationErrors = this.validateOnboardForm();
    if (hasFieldErrors(this.onboardValidationErrors)) {
      this.onboardError = this.translate.instant('importExport.onboard.errors.fixFieldErrors');
      return;
    }
    this.onboardSubmitting = true;
    this.platformService.onboardSchoolWorkspace(this.onboardForm).subscribe({
      next: res => {
        this.onboardSubmitting = false;
        this.onboardSuccess = this.translate.instant('importExport.onboard.success', {
          tenantId: res.tenantId,
          academicYearId: res.academicYearId ?? '-',
        });
        this.globalFlowMessage = this.translate.instant('importExport.onboard.flowSuccessTitle');
        this.globalFlowMessageContext = this.onboardSuccess;
        this.globalFlowMessageOk = true;
        this.closeOnboardModal();
        this.onboardForm = this.createEmptyOnboardForm();
        this.onboardPhoneNational = '';
        this.onboardValidationErrors = {};
        this.onboardTouched = {};
        this.showTempPassword = false;
        this.reloadJobs();
        this.loadMetrics();
      },
      error: err => {
        this.onboardSubmitting = false;
        this.onboardError = err?.message || this.translate.instant('importExport.onboard.errors.createFailed');
        this.globalFlowMessage = this.translate.instant('importExport.onboard.flowErrorTitle');
        this.globalFlowMessageContext = this.onboardError;
        this.globalFlowMessageOk = false;
      },
    });
  }

  private createEmptyOnboardForm(): OnboardSchoolRequest {
    return {
      schoolName: '',
      schoolCode: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      phone: '',
      address: '',
    };
  }
}

