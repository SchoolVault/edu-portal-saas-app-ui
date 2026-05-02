import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeeService } from '../../core/services/fee.service';
import { SettingsService } from '../../core/services/settings.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { filter } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';
import {
  AcademicYear,
  BulkAssignFeesResponse,
  BulkAssignFeesSkipEntry,
  FeeComponent,
  FeeCollectionSummary,
  FeePayment,
  FeeRefundDecisionRequest,
  FeeRefundExecuteRequest,
  FeeRefundRequest,
  FeeStructure,
  FeeTransaction,
  FeeV2AuditEvent,
  FeeV2ClassOutstanding,
  FeeV2CollectionSummary,
  FeeV2Component,
  FeeV2CreateComponentRequest,
  FeeV2CreateDemandRunRequest,
  FeeV2CreateDiscountRequest,
  FeeV2CreateRuleRequest,
  FeeV2DefaulterRow,
  FeeV2Demand,
  FeeV2DemandRun,
  FeeV2Discount,
  FeeV2LateFeePolicy,
  FeeV2CreateLateFeePolicyRequest,
  FeeV2UpdateLateFeePolicyRequest,
  FeeV2LateFeeRun,
  FeeV2CreateLateFeeRunRequest,
  FeeV2LedgerEntry,
  FeeV2PaymentRegisterRow,
  FeeV2RecordPaymentRequest,
  FeeV2RecordPaymentResponse,
  FeeV2RecordRefundRequest,
  FeeV2Rule,
  FeeV2RuleActionLine,
  FeeV2RuleConditionLine,
  FeeV2Structure,
  FeeV2StudentFeeMap,
  FeeV2StudentStatement,
  FeeAssignmentPreviewResponse,
  FeeAssignmentExecuteRequest,
  FeeV2LedgerReconciliationReport,
  SchoolClass,
  Section,
  Student,
} from '../../core/models/models';
import { StudentService } from '../../core/services/student.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { buildCsvSchoolLine, downloadCsvDocument } from '../../core/utils/csv-export.util';
import { ImportExportService } from '../../core/services/import-export.service';
import { formatDateDdMmYyyy } from '../../core/utils/date-format';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    SchoolClassNamePipe,
    ErpPaginationComponent,
    ErpI18nPhDirective,
    ErpDatePickerComponent,
  ],
  styles: [`
    .fees-page {
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }
    .fees-v2-tabs {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      flex-wrap: nowrap;
      gap: 6px;
      padding-bottom: 4px;
      margin-bottom: 0.35rem;
    }
    .fees-v2-tabs .erp-tab {
      flex: 0 0 auto;
    }
    .fees-v2-panel-title {
      font-size: 1.05rem;
      font-weight: 800;
      margin-bottom: 0.35rem;
    }
    .fees-v2-subcard {
      border: 1px solid var(--clr-border-light);
      border-radius: 12px;
      padding: 12px;
      background: var(--clr-surface);
      margin-top: 10px;
    }
    .fees-page .fees-form-field {
      margin-bottom: 0;
    }
    .fees-page .fees-form-field > .erp-label.small,
    .fees-page .fees-form-field > label.erp-label.small {
      display: block;
      margin-bottom: 4px;
      font-weight: 600;
      color: var(--clr-text-muted);
      font-size: 12px;
      letter-spacing: 0.02em;
    }
    .fees-assignment-panel .fees-panel-lead,
    .fees-page .fees-panel-lead {
      max-width: 720px;
    }
    .fees-field-label-spacer {
      visibility: hidden;
      min-height: 1.15em;
      margin-bottom: 4px;
      padding: 0;
      line-height: 1.2;
    }
    .fees-banner {
      border-radius: 10px;
    }
    .fees-banner .btn-close {
      opacity: 0.72;
      padding: 0.35rem;
      margin: -0.15rem -0.25rem -0.15rem 0;
    }
    .fees-banner .btn-close:hover {
      opacity: 1;
    }
    .fees-inline-field-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: stretch;
    }
    .fees-inline-field-row .erp-input {
      min-width: 160px;
      flex: 1 1 180px;
    }
    .fees-inline-field-row .btn {
      flex: 0 0 auto;
      align-self: stretch;
    }
    .fees-assignment-divider {
      border: 0;
      border-top: 1px solid var(--clr-border-light);
      margin: 1rem 0;
      opacity: 1;
    }
    .fees-page-header {
      margin-bottom: 1.1rem;
    }
    .fees-page-title {
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .fees-page-subtitle {
      font-size: 13px;
      margin: 4px 0 0;
    }
    .fees-kpi-grid .erp-card {
      border-radius: 12px;
      border: 1px solid var(--clr-border-light);
      box-shadow: var(--shadow-sm);
      min-height: 68px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
    }
    .fees-kpi-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-weight: 700;
      color: var(--clr-text-muted);
    }
    .fees-kpi-value {
      font-size: 18px;
      font-weight: 800;
      color: var(--clr-text);
      font-family: var(--font-heading, inherit);
      line-height: 1.2;
    }
    .fees-payments-shell {
      border-radius: 14px;
      border: 1px solid var(--clr-border-light);
      box-shadow: var(--shadow-sm);
      padding: 14px;
    }
    .fees-structures-shell .erp-card {
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--clr-border) 88%, var(--clr-primary) 12%);
      box-shadow: var(--shadow-sm);
    }
    .fees-structure-total {
      font-size: 18px;
      font-weight: 800;
      font-family: var(--font-heading, inherit);
      line-height: 1.1;
      letter-spacing: 0.01em;
      color: color-mix(in srgb, var(--clr-success) 68%, var(--clr-text) 32%);
      text-shadow: 0 0 0.01px currentColor;
    }
    .fees-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 12px;
      align-items: end;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--clr-border-light);
    }
    .fees-toolbar-group {
      min-width: 150px;
    }
    .fees-toolbar-group--class,
    .fees-toolbar-group--section {
      min-width: 170px;
    }
    .fees-toolbar-right {
      margin-left: auto;
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 10px;
    }
    .fees-search-block {
      min-width: 220px;
      max-width: 380px;
    }
    .fees-search-block .erp-input,
    .fees-toolbar .erp-select,
    .fees-toolbar .btn-outline-erp.btn-sm {
      height: 40px;
      min-height: 40px;
      border-radius: 12px;
      box-sizing: border-box;
    }
    .fees-search-block .erp-input {
      font-size: 13px;
      padding-top: 0;
      padding-bottom: 0;
    }
    .fees-toolbar .erp-select {
      font-size: 13px;
      padding-top: 0;
      padding-bottom: 0;
    }
    .fees-toolbar .btn-outline-erp.btn-sm {
      font-size: 12.5px;
      font-weight: 700;
      padding: 0 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
    }
    .fees-toolbar .erp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-weight: 700;
      margin-bottom: 4px !important;
    }
    .fees-toolbar-actions {
      display: flex;
      align-items: end;
      gap: 8px;
    }
    .fees-toolbar-actions .btn-outline-erp.btn-sm {
      min-width: 112px;
    }
    .fees-summary-note {
      margin: 2px 0 10px;
      font-size: 12px;
    }
    .fees-table-wrap {
      border: 1px solid var(--clr-border-light);
      border-radius: 12px;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      background: var(--clr-surface);
    }
    .fees-table-wrap .erp-table thead th {
      white-space: nowrap;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-weight: 700;
    }
    .fees-table-wrap .erp-table tbody td {
      vertical-align: middle;
      font-size: 13px;
    }
    .fees-cell-student {
      font-weight: 700;
      white-space: nowrap;
    }
    .fees-cell-amount {
      font-weight: 700;
      color: color-mix(in srgb, var(--clr-text) 90%, var(--clr-primary) 10%);
      font-variant-numeric: tabular-nums;
    }
    .fees-cell-paid {
      font-weight: 700;
      color: color-mix(in srgb, var(--clr-success) 72%, var(--clr-text) 28%);
      font-variant-numeric: tabular-nums;
    }
    .fees-cell-due {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .fees-cell-due--pending {
      color: color-mix(in srgb, var(--clr-danger) 78%, var(--clr-text) 22%);
    }
    .fees-cell-due--clear {
      color: color-mix(in srgb, var(--clr-success) 76%, var(--clr-text) 24%);
    }
    .fees-actions {
      white-space: nowrap;
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .fees-btn-ledger,
    .fees-btn-reminder,
    .fees-btn-collect {
      border-radius: 999px;
    }
    .fees-btn-refund {
      border-radius: 999px;
      border-color: color-mix(in srgb, var(--clr-info) 28%, var(--clr-border));
      color: color-mix(in srgb, var(--clr-info) 82%, var(--clr-text) 18%);
    }
    .fees-actions .btn-outline-erp,
    .fees-actions .btn-primary-erp,
    .fees-toolbar-actions .btn-outline-erp,
    .fees-tx-filter .btn-outline-erp,
    .fees-reminder-alert__close {
      transition: transform 140ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease;
    }
    .fees-actions .btn-outline-erp:hover,
    .fees-actions .btn-primary-erp:hover,
    .fees-toolbar-actions .btn-outline-erp:hover,
    .fees-tx-filter .btn-outline-erp:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    .fees-actions .btn-outline-erp:active,
    .fees-actions .btn-primary-erp:active,
    .fees-toolbar-actions .btn-outline-erp:active,
    .fees-tx-filter .btn-outline-erp:active {
      transform: translateY(0);
    }
    .fees-actions .btn-outline-erp:focus-visible,
    .fees-actions .btn-primary-erp:focus-visible,
    .fees-toolbar-actions .btn-outline-erp:focus-visible,
    .fees-tx-filter .btn-outline-erp:focus-visible,
    .fees-reminder-alert__close:focus-visible {
      outline: 0;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary) 34%, transparent);
    }
    .fees-ledger-split {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }
    .fees-ledger-block {
      border: 1px solid var(--clr-border-light);
      border-radius: 14px;
      padding: 12px;
      background: color-mix(in srgb, var(--clr-surface) 96%, var(--clr-surface-muted) 4%);
      min-width: 0;
    }
    .fees-ledger-block h5 {
      font-size: 14px;
      font-weight: 800;
      margin: 0 0 10px;
      letter-spacing: 0.01em;
    }
    .fees-tx-timeline {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 360px;
      overflow: auto;
      padding-right: 4px;
    }
    .fees-tx-filter {
      display: inline-flex;
      gap: 6px;
      flex-wrap: wrap;
      margin: 0 0 8px;
    }
    .fees-tx-filter .btn-outline-erp.btn-xs {
      border-radius: 999px;
      padding-inline: 10px;
      font-size: 11px;
      font-weight: 700;
    }
    .fees-tx-filter .btn-outline-erp.btn-xs.active {
      background: color-mix(in srgb, var(--clr-primary) 14%, var(--clr-surface));
      border-color: color-mix(in srgb, var(--clr-primary) 30%, var(--clr-border));
      color: color-mix(in srgb, var(--clr-primary) 80%, var(--clr-text));
    }
    .fees-tx-item {
      border: 1px solid var(--clr-border-light);
      border-radius: 12px;
      padding: 10px 11px;
      background: var(--clr-surface);
      box-shadow: var(--shadow-sm);
      position: relative;
      transition: transform 140ms ease, box-shadow 160ms ease, border-color 160ms ease;
    }
    .fees-tx-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 3px;
      border-radius: 99px;
      background: color-mix(in srgb, var(--clr-primary) 50%, var(--clr-border));
    }
    .fees-tx-item__head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 12.5px;
      font-weight: 800;
    }
    .fees-tx-item__title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }
    .fees-tx-item__title i {
      font-size: 13px;
    }
    .fees-tx-item__title span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .fees-tx-item__meta {
      font-size: 11.5px;
      color: var(--clr-text-muted);
      line-height: 1.45;
      word-break: break-word;
      display: grid;
      gap: 2px;
    }
    .fees-tx-item:hover {
      transform: translateY(-1px);
      border-color: color-mix(in srgb, var(--clr-primary) 30%, var(--clr-border-light));
      box-shadow: var(--shadow-md);
    }
    .fees-refund-panel {
      border-top: 1px dashed var(--clr-border);
      margin-top: 12px;
      padding-top: 12px;
    }
    .fees-refund-panel .erp-input,
    .fees-refund-panel .erp-textarea {
      width: 100%;
    }
    .fees-refund-panel .btn-outline-erp.btn-sm {
      min-width: 160px;
      border-radius: 999px;
      font-weight: 700;
    }
    .fees-reminder-alert {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .fees-reminder-alert__text {
      min-width: 0;
      word-break: break-word;
    }
    .fees-reminder-alert__close {
      border: 0;
      background: transparent;
      padding: 0;
      line-height: 1;
      font-size: 16px;
      opacity: 0.72;
      cursor: pointer;
      color: inherit;
    }
    .fees-reminder-alert__close:hover {
      opacity: 1;
      transform: scale(1.03);
    }
    .fees-ledger-table-wrap {
      overflow: auto;
      border: 1px solid var(--clr-border-light);
      border-radius: 12px;
    }
    .fees-ledger-table-wrap .erp-table {
      margin-bottom: 0;
    }
    .fees-ledger-modal {
      width: min(calc(100vw - 16px), 940px);
      max-width: 940px !important;
    }
    .fees-ledger-modal-body {
      max-height: min(78vh, 720px);
      overflow: auto;
    }
    .fees-ledger-modal .modal-header-erp h3 {
      font-size: 28px;
      line-height: 1.15;
    }
    .fees-ledger-modal .modal-footer-erp .btn-outline-erp {
      border-radius: 999px;
      min-width: 120px;
    }
    .fees-empty-state {
      border: 1px dashed var(--clr-border);
      border-radius: 12px;
      padding: 14px 12px;
      background: color-mix(in srgb, var(--clr-surface-muted) 70%, var(--clr-surface) 30%);
      text-align: center;
      color: var(--clr-text-muted);
      font-size: 12.5px;
      line-height: 1.45;
    }
    .fees-empty-state i {
      display: inline-block;
      margin-right: 6px;
      color: color-mix(in srgb, var(--clr-primary) 66%, var(--clr-text-muted) 34%);
    }
    .fees-refund-toast {
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.4;
      margin: 0 0 10px;
      border: 1px solid var(--clr-border-light);
      background: var(--clr-surface-muted);
      color: var(--clr-text);
    }
    .fees-refund-toast--ok {
      border-color: color-mix(in srgb, var(--clr-success) 30%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-success) 10%, var(--clr-surface));
      color: color-mix(in srgb, var(--clr-success) 86%, var(--clr-text) 14%);
    }
    .fees-refund-toast--err {
      border-color: color-mix(in srgb, var(--clr-danger) 34%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-danger) 10%, var(--clr-surface));
      color: color-mix(in srgb, var(--clr-danger) 86%, var(--clr-text) 14%);
    }
    .fees-refund-panel .erp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-weight: 700;
    }
    [data-theme='dark'] .fees-payments-shell,
    [data-theme='dark'] .fees-kpi-grid .erp-card,
    [data-theme='dark'] .fees-table-wrap {
      border-color: color-mix(in srgb, var(--clr-primary) 20%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-surface) 96%, #0b1220);
    }
    [data-theme='dark'] .fees-structures-shell .erp-card {
      border-color: color-mix(in srgb, var(--clr-primary) 20%, var(--clr-border));
      background: linear-gradient(
        150deg,
        color-mix(in srgb, var(--clr-surface) 95%, #0b1220),
        color-mix(in srgb, var(--clr-surface-alt) 96%, #0b1220)
      );
    }
    [data-theme='dark'] .fees-structure-total {
      color: color-mix(in srgb, var(--clr-success) 84%, #ffffff 16%);
      text-shadow: 0 1px 10px color-mix(in srgb, var(--clr-success) 22%, transparent);
    }
    [data-theme='dark'] .fees-toolbar {
      border-bottom-color: color-mix(in srgb, var(--clr-primary) 20%, var(--clr-border));
    }
    [data-theme='dark'] .fees-cell-amount {
      color: color-mix(in srgb, var(--clr-text) 88%, #ffffff 12%);
    }
    [data-theme='dark'] .fees-cell-paid {
      color: color-mix(in srgb, var(--clr-success) 86%, #ffffff 14%);
      text-shadow: 0 1px 8px color-mix(in srgb, var(--clr-success) 18%, transparent);
    }
    [data-theme='dark'] .fees-cell-due--pending {
      color: color-mix(in srgb, var(--clr-danger) 84%, #ffffff 16%);
    }
    [data-theme='dark'] .fees-cell-due--clear {
      color: color-mix(in srgb, var(--clr-success) 84%, #ffffff 16%);
    }
    [data-theme='dark'] .fees-ledger-block {
      border-color: color-mix(in srgb, var(--clr-primary) 20%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-surface) 95%, #0b1220);
    }
    [data-theme='dark'] .fees-tx-item {
      border-color: color-mix(in srgb, var(--clr-primary) 18%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-surface) 93%, #0b1220);
    }
    [data-theme='dark'] .fees-tx-filter .btn-outline-erp.btn-xs.active {
      background: color-mix(in srgb, var(--clr-primary) 26%, var(--clr-surface));
      border-color: color-mix(in srgb, var(--clr-primary) 42%, var(--clr-border));
      color: color-mix(in srgb, #ffffff 78%, var(--clr-primary) 22%);
    }
    [data-theme='dark'] .fees-refund-toast--ok {
      background: color-mix(in srgb, var(--clr-success) 18%, var(--clr-surface));
      color: color-mix(in srgb, #ffffff 78%, var(--clr-success) 22%);
    }
    [data-theme='dark'] .fees-refund-toast--err {
      background: color-mix(in srgb, var(--clr-danger) 20%, var(--clr-surface));
      color: color-mix(in srgb, #ffffff 76%, var(--clr-danger) 24%);
    }
    @media (max-width: 480px) {
      .fees-page-title {
        font-size: 1.15rem;
      }
      .fees-kpi-grid > [class*='col-'] {
        flex: 0 0 100%;
        max-width: 100%;
      }
    }
    @media (max-width: 768px) {
      .fees-page-header {
        margin-bottom: 0.8rem;
      }
      .fees-toolbar-stack {
        width: 100%;
        justify-content: flex-start !important;
      }
      .fees-toolbar {
        gap: 8px;
        align-items: stretch;
      }
      .fees-toolbar-right {
        width: 100%;
        margin-left: 0;
        gap: 8px;
      }
      .fees-toolbar-group,
      .fees-search-block {
        min-width: 100% !important;
        max-width: 100% !important;
      }
      .fees-toolbar-actions {
        width: 100%;
        margin-left: 0;
      }
      .fees-toolbar-actions .btn-outline-erp.btn-sm {
        flex: 1;
      }
      .fees-table-wrap .erp-table {
        min-width: 860px;
      }
      .fees-ledger-split {
        grid-template-columns: 1fr;
      }
      .fees-refund-panel .btn-outline-erp.btn-sm {
        width: 100%;
      }
    }
    @media (max-width: 1180px) {
      .fees-ledger-split {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <div class="fees-page" data-testid="fees-page">
      <div *ngIf="operationMessage" class="alert py-2 small mb-3" [class.alert-success]="operationMessageOk" [class.alert-danger]="!operationMessageOk">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <span>{{ operationMessage }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'fees.close' | translate" (click)="clearOperationMessage()"></button>
        </div>
      </div>
      <div
        *ngIf="canManageFeeFinanceRouting && feeFinanceBannerVisible"
        class="alert py-2 small mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2"
        style="background: color-mix(in srgb, var(--clr-info) 10%, var(--clr-surface)); border: 1px solid color-mix(in srgb, var(--clr-info) 26%, var(--clr-border));"
        role="status"
      >
        <span class="fees-reminder-alert__text mb-0">{{ 'fees.bannerParentCheckoutOff' | translate }}</span>
        <button type="button" class="btn-outline-erp btn-sm text-nowrap" (click)="goToFeeSettlementSettings()">
          {{ 'fees.bannerParentCheckoutOffCta' | translate }}
        </button>
      </div>
      <div class="d-flex justify-content-between align-items-center animate-in flex-wrap gap-2 fees-page-header">
        <div>
          <h2 class="fees-page-title">{{ 'fees.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0 fees-page-subtitle">{{ 'fees.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap fees-toolbar-stack">
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAll()" [disabled]="refreshing">
            <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? ('fees.refreshing' | translate) : ('fees.refresh' | translate) }}
          </button>
          <button type="button" class="btn-outline-erp btn-sm" (click)="exportCanonicalFeeStructuresCsv()">
            <i class="bi bi-download"></i> {{ 'fees.exportCsv' | translate }}
          </button>
          <button *ngIf="canManageFeeFinanceRouting" type="button" class="btn-outline-erp btn-sm" (click)="goToFeeSettlementSettings()">
            <i class="bi bi-bank2 me-1"></i>{{ 'fees.linkPaymentSettlement' | translate }}
          </button>
          <button *ngIf="feeDeskOps" type="button" class="btn-primary-erp btn-sm" (click)="openStructureModal()">
            <i class="bi bi-plus-lg"></i> {{ 'fees.newStructure' | translate }}
          </button>
        </div>
      </div>

      <div class="erp-tabs animate-in fees-v2-tabs">
        <button *ngIf="showLegacyFeesTabs" type="button" class="erp-tab" [class.active]="tab === 'structures'" (click)="tab = 'structures'" data-testid="tab-structures">{{ 'fees.tabStructures' | translate }}</button>
        <button *ngIf="showLegacyFeesTabs" type="button" class="erp-tab" [class.active]="tab === 'payments'" (click)="tab = 'payments'" data-testid="tab-payments">{{ 'fees.tabPayments' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2ConfigWrite" type="button" class="erp-tab" [class.active]="tab === 'componentsV2'" (click)="tab = 'componentsV2'" data-testid="tab-components-v2">{{ 'fees.tabComponentsV2' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2ConfigWrite" type="button" class="erp-tab" [class.active]="tab === 'structuresV2'" (click)="onSelectV2Tab('structuresV2')" data-testid="tab-structures-v2">{{ 'fees.tabStructuresV2' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && (feeV2FinanceRead || feeV2ConfigWrite || feeV2BillingWrite)" type="button" class="erp-tab" [class.active]="tab === 'assignmentsV2'" (click)="onSelectV2Tab('assignmentsV2')" data-testid="tab-assignments-v2">{{ 'fees.tabAssignmentsV2' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2ConfigWrite" type="button" class="erp-tab" [class.active]="tab === 'rulesV2'" (click)="tab = 'rulesV2'" data-testid="tab-rules-v2">{{ 'fees.tabRulesV2' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'demandRunsV2'" (click)="tab = 'demandRunsV2'" data-testid="tab-demand-runs-v2">{{ 'fees.tabDemandRunsV2' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'demandsV2'" (click)="onSelectV2Tab('demandsV2')" data-testid="tab-demands-v2">{{ 'fees.tabDemandsV2' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'discountsV2'" (click)="onSelectV2Tab('discountsV2')" data-testid="tab-discounts-v2">{{ 'fees.tabDiscountsV2' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'phase3Reports'" (click)="selectPhase3Tab('phase3Reports')" data-testid="tab-phase3-reports">{{ 'fees.tabPhase3Reports' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'phase3Payments'" (click)="selectPhase3Tab('phase3Payments')" data-testid="tab-phase3-payments">{{ 'fees.tabPhase3Payments' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'phase3Recon'" (click)="selectPhase3ReconTab()" data-testid="tab-phase3-recon">{{ 'fees.tabPhase3Recon' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'phase3Audit'" (click)="selectPhase3Tab('phase3Audit')" data-testid="tab-phase3-audit">{{ 'fees.tabPhase3Audit' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && (feeV2FinanceRead || feeV2ConfigWrite || feeV2BillingWrite)" type="button" class="erp-tab" [class.active]="tab === 'phase4LateFees'" (click)="selectPhase4LateFeeTab()" data-testid="tab-phase4-late-fees">{{ 'fees.tabPhase4LateFees' | translate }}</button>
        <button *ngIf="canAccessFeesV2Tabs && feeV2FinanceRead" type="button" class="erp-tab" [class.active]="tab === 'ledgerV2'" (click)="tab = 'ledgerV2'" data-testid="tab-ledger-v2">{{ 'fees.tabLedgerV2' | translate }}</button>
      </div>

      <div *ngIf="showLegacyFeesTabs && tab === 'structures'" class="animate-in fees-structures-shell">
        <div class="erp-card mb-3" *ngIf="feeDeskOps">
          <div class="small fw-semibold text-uppercase text-muted mb-2">{{ 'fees.adminFlowTitle' | translate }}</div>
          <div class="d-flex flex-wrap gap-2">
            <span class="badge-erp badge-neutral">{{ 'fees.adminFlowStep1' | translate }}</span>
            <span class="badge-erp badge-neutral">{{ 'fees.adminFlowStep2' | translate }}</span>
            <span class="badge-erp badge-neutral">{{ 'fees.adminFlowStep3' | translate }}</span>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let fs of feeStructures">
            <div class="erp-card h-100" [attr.data-testid]="'fee-structure-' + fs.id">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h4 style="font-size: 15px; font-weight: 700;">{{ fs.name }}</h4>
                <span class="fees-structure-total">₹{{ fs.totalAmount | number:'1.0-0':'en-IN' }}</span>
              </div>
              <div class="text-muted small mb-2">{{ fs.className | schoolClassName }} · {{ 'fees.yearPrefix' | translate }} {{ fs.academicYearId }}</div>
              <div *ngFor="let comp of fs.components" class="d-flex justify-content-between align-items-center" style="padding: 6px 0; border-bottom: 1px solid var(--clr-border-light); font-size: 13px;">
                <span>
                  <span class="badge-erp badge-neutral me-1" style="font-size: 10px;">{{ ('fees.componentType.' + comp.type) | translate }}</span>
                  {{ comp.name }}
                </span>
                <strong>₹{{ comp.amount | number:'1.0-0':'en-IN' }}</strong>
              </div>
              <div *ngIf="feeDeskOps" class="d-flex flex-wrap gap-2 mt-3 pt-2" style="border-top: 1px solid var(--clr-border-light);">
                <button type="button" class="btn-outline-erp btn-xs" (click)="openStructureModal(fs)">{{ 'fees.edit' | translate }}</button>
                <button
                  type="button"
                  class="btn-outline-erp btn-xs"
                  (click)="openBulkAssignModal(fs)"
                  data-testid="bulk-assign-open"
                  [title]="'fees.bulkAssignTitle' | translate"
                >
                  <i class="bi bi-people"></i> {{ 'fees.bulkAssign' | translate }}
                </button>
                <button type="button" class="btn-outline-erp btn-xs" style="color: var(--clr-danger); border-color: color-mix(in srgb, var(--clr-danger) 35%, var(--clr-border));" (click)="deleteStructure(fs)">{{ 'fees.delete' | translate }}</button>
              </div>
            </div>
          </div>
        </div>
        <p *ngIf="!feeStructures.length" class="text-muted">{{ 'fees.emptyStructures' | translate }}</p>
      </div>

      <div *ngIf="showLegacyFeesTabs && tab === 'payments'" class="animate-in">
        <div *ngIf="reminderMessage" class="alert py-2 small mb-2 fees-reminder-alert" [class.alert-success]="reminderMessageOk" [class.alert-danger]="!reminderMessageOk">
          <span class="fees-reminder-alert__text">{{ reminderMessage }}</span>
          <button type="button" class="fees-reminder-alert__close" (click)="clearReminderMessage()" [attr.aria-label]="'fees.close' | translate">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="row g-2 mb-3 fees-kpi-grid" *ngIf="feeDeskOps">
          <div class="col-6 col-md-3">
            <div class="erp-card p-2">
              <div class="fees-kpi-label">{{ 'fees.kpiCollected' | translate }}</div>
              <div class="fees-kpi-value">₹{{ effectiveCollected | number:'1.0-0':'en-IN' }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="erp-card p-2">
              <div class="fees-kpi-label">{{ 'fees.kpiPending' | translate }}</div>
              <div class="fees-kpi-value">₹{{ effectivePending | number:'1.0-0':'en-IN' }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="erp-card p-2">
              <div class="fees-kpi-label">{{ 'fees.kpiOverdueCount' | translate }}</div>
              <div class="fees-kpi-value">{{ effectiveOverdueCount }}</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="erp-card p-2">
              <div class="fees-kpi-label">{{ 'fees.kpiCollectionRate' | translate }}</div>
              <div class="fees-kpi-value">{{ effectiveCollectionRatePct | number:'1.0-1' }}%</div>
            </div>
          </div>
        </div>
        <div class="erp-card fees-payments-shell">
          <div class="fees-toolbar">
            <div class="search-input-wrapper flex-grow-1 fees-search-block">
              <i class="bi bi-search"></i>
              <input
                type="text"
                class="erp-input"
                erpI18nPh="fees.searchPaymentsPlaceholder"
                [(ngModel)]="paymentSearch"
                (ngModelChange)="schedulePaymentSearch()"
                data-testid="payments-search"
              />
            </div>
            <div class="fees-toolbar-right">
              <div class="fees-toolbar-group">
                <label class="erp-label d-block mb-1">{{ 'fees.labelStatus' | translate }}</label>
                <select class="erp-select w-100" [(ngModel)]="statusFilter" (ngModelChange)="onPaymentStatusChange()">
                  <option value="">{{ 'fees.allStatus' | translate }}</option>
                  <option value="paid">{{ 'fees.statusPaid' | translate }}</option>
                  <option value="partial">{{ 'fees.statusPartial' | translate }}</option>
                  <option value="unpaid">{{ 'fees.statusUnpaid' | translate }}</option>
                  <option value="overdue">{{ 'fees.statusOverdue' | translate }}</option>
                </select>
              </div>
              <div class="fees-toolbar-group fees-toolbar-group--class">
                <label class="erp-label d-block mb-1">{{ 'fees.labelClass' | translate }}</label>
                <select class="erp-select w-100" [(ngModel)]="classFilterId" (ngModelChange)="onPaymentClassFilterChange()">
                  <option [ngValue]="null">{{ 'fees.allClasses' | translate }}</option>
                  <option *ngFor="let classItem of paymentFilterClasses" [ngValue]="classItem.id">
                    {{ classItem.name | schoolClassName }}
                  </option>
                </select>
              </div>
              <div class="fees-toolbar-group fees-toolbar-group--section">
                <label class="erp-label d-block mb-1">{{ 'fees.labelSection' | translate }}</label>
                <select
                  class="erp-select w-100"
                  [(ngModel)]="sectionFilterId"
                  (ngModelChange)="onPaymentSectionFilterChange()"
                  [disabled]="classFilterId == null"
                >
                  <option [ngValue]="null">{{ 'fees.allSections' | translate }}</option>
                  <option *ngFor="let section of paymentFilterSections" [ngValue]="section.id">
                    {{ section.name }}
                  </option>
                </select>
              </div>
              <div class="fees-toolbar-group">
                <label class="erp-label d-block mb-1">{{ 'fees.sortBy' | translate }}</label>
                <select class="erp-select w-100" [(ngModel)]="sortBy" (ngModelChange)="applyClientView()">
                  <option value="dueDateAsc">{{ 'fees.sortDueDateAsc' | translate }}</option>
                  <option value="dueDateDesc">{{ 'fees.sortDueDateDesc' | translate }}</option>
                  <option value="dueAmountDesc">{{ 'fees.sortDueAmountDesc' | translate }}</option>
                  <option value="studentAsc">{{ 'fees.sortStudentAsc' | translate }}</option>
                </select>
              </div>
              <div class="fees-toolbar-actions">
                <button type="button" class="btn-outline-erp btn-sm" (click)="loadPaymentsPage()"><i class="bi bi-arrow-clockwise"></i> {{ 'fees.refresh' | translate }}</button>
                <button type="button" class="btn-outline-erp btn-sm" (click)="exportPaymentsCsv()"><i class="bi bi-download"></i> {{ 'fees.exportPayments' | translate }}</button>
              </div>
            </div>
          </div>
          <p class="small text-muted fees-summary-note" *ngIf="collectionSummary">
            {{ 'fees.summaryStudents' | translate: { n: collectionSummary.totalStudents } }}
          </p>
          <div class="fees-table-wrap" dir="ltr">
            <table class="erp-table" data-testid="payments-table">
              <thead>
                <tr
                  ><th>{{ 'fees.thStudent' | translate }}</th
                  ><th>{{ 'fees.thAmount' | translate }}</th
                  ><th>{{ 'fees.thPaid' | translate }}</th
                  ><th>{{ 'fees.thDue' | translate }}</th
                  ><th>{{ 'fees.thDueDate' | translate }}</th
                  ><th>{{ 'fees.thStatus' | translate }}</th
                  ><th>{{ 'fees.thReceipt' | translate }}</th
                  ><th>{{ 'fees.thActions' | translate }}</th></tr
                >
              </thead>
              <tbody>
                <tr *ngFor="let p of displayPaymentsPage" [attr.data-testid]="'payment-row-' + p.id">
                  <td class="fees-cell-student">{{ p.studentName }}</td>
                  <td class="fees-cell-amount">₹{{ p.amount | number:'1.0-0':'en-IN' }}</td>
                  <td class="fees-cell-paid">₹{{ p.paidAmount | number:'1.0-0':'en-IN' }}</td>
                  <td class="fees-cell-due" [ngClass]="p.dueAmount > 0 ? 'fees-cell-due--pending' : 'fees-cell-due--clear'">₹{{ p.dueAmount | number:'1.0-0':'en-IN' }}</td>
                  <td>{{ formatDate(p.dueDate) }}</td>
                  <td>
                    <span class="badge-erp" [ngClass]="{'badge-success': p.status === 'paid', 'badge-warning': p.status === 'partial', 'badge-danger': p.status === 'overdue', 'badge-neutral': p.status === 'unpaid'}">
                      {{ feeStatusLabel(p.status) }}
                    </span>
                  </td>
                  <td>{{ p.receiptNumber || '-' }}</td>
                  <td class="fees-actions">
                    <button type="button" class="btn-outline-erp btn-xs fees-btn-ledger" (click)="openStudentLedgerModal(p)">
                      {{ 'fees.viewLedger' | translate }}
                    </button>
                    <button
                      *ngIf="feeDeskOps && p.paidAmount > 0"
                      type="button"
                      class="btn-outline-erp btn-xs fees-btn-refund"
                      (click)="openRefundPanel(p)"
                    >
                      {{ 'fees.refund' | translate }}
                    </button>
                    <button
                      *ngIf="feeDeskOps && p.dueAmount > 0"
                      type="button"
                      class="btn-primary-erp btn-xs fees-btn-collect"
                      (click)="openCollectPaymentModal(p)"
                    >
                      {{ 'fees.collectNow' | translate }}
                    </button>
                    <button
                      *ngIf="feeDeskOps && p.dueAmount > 0"
                      type="button"
                      class="btn-outline-erp btn-xs fees-btn-reminder"
                      (click)="sendReminder(p)"
                    >
                      {{ 'fees.sendReminder' | translate }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="!displayPaymentsPage.length && !paymentsLoading" class="text-muted small mb-0">{{ 'fees.emptyPayments' | translate }}</p>
          <app-erp-pagination
            *ngIf="paymentsTotal > 0"
            [totalElements]="paymentsTotal"
            [pageIndex]="paymentPageIndex"
            [pageSize]="paymentPageSize"
            (pageIndexChange)="onPaymentPageIndexChange($event)"
            (pageSizeChange)="onPaymentPageSizeChange($event)"
          />
        </div>
      </div>

      <div *ngIf="tab === 'componentsV2' && feeV2ConfigWrite" class="animate-in">
        <div
          *ngIf="v2Message"
          class="alert alert-dismissible fees-banner py-2 px-3 small mb-2 d-flex align-items-start justify-content-between gap-2"
          [class.alert-success]="v2MessageOk"
          [class.alert-danger]="!v2MessageOk"
          role="alert"
        >
          <span class="fees-banner__text flex-grow-1">{{ v2Message }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'fees.close' | translate" (click)="clearV2Message()"></button>
        </div>
        <div class="erp-card mb-3">
          <h4 class="mb-2">{{ 'fees.v2ComponentsTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'fees.v2ComponentsDesc' | translate }}</p>
          <div class="row g-2">
            <div class="col-md-2"><input class="erp-input" [(ngModel)]="v2ComponentForm.code" [placeholder]="'fees.v2Code' | translate" /></div>
            <div class="col-md-3"><input class="erp-input" [(ngModel)]="v2ComponentForm.name" [placeholder]="'fees.v2Name' | translate" /></div>
            <div class="col-md-2">
              <select class="erp-select" [(ngModel)]="v2ComponentForm.componentType">
                <option value="RECURRING">{{ 'fees.v2Recurring' | translate }}</option>
                <option value="ONE_TIME">{{ 'fees.v2OneTime' | translate }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="erp-select" [(ngModel)]="v2ComponentForm.frequency">
                <option value="MONTHLY">{{ 'fees.v2Monthly' | translate }}</option>
                <option value="QUARTERLY">{{ 'fees.v2Quarterly' | translate }}</option>
                <option value="YEARLY">{{ 'fees.v2Yearly' | translate }}</option>
                <option value="CUSTOM">{{ 'fees.v2Custom' | translate }}</option>
              </select>
            </div>
            <div class="col-md-3 d-flex gap-2 align-items-center">
              <label class="small"><input type="checkbox" [(ngModel)]="v2ComponentForm.optionalComponent" /> {{ 'fees.v2Optional' | translate }}</label>
              <label class="small"><input type="checkbox" [(ngModel)]="v2ComponentForm.refundable" /> {{ 'fees.v2Refundable' | translate }}</label>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button type="button" class="btn-primary-erp btn-sm" [disabled]="v2Busy" (click)="saveV2Component()">{{ 'fees.save' | translate }}</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="resetV2ComponentForm()">{{ 'fees.cancel' | translate }}</button>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.v2Code' | translate }}</th><th>{{ 'fees.v2Name' | translate }}</th><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.v2Freq' | translate }}</th><th>{{ 'fees.thActions' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of v2Components">
                  <td>{{ c.code }}</td><td>{{ c.name }}</td><td>{{ c.componentType }}</td><td>{{ c.frequency }}</td>
                  <td class="fees-actions">
                    <button type="button" class="btn-outline-erp btn-xs" (click)="startEditV2Component(c)">{{ 'fees.edit' | translate }}</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="deleteV2Component(c.id)">{{ 'fees.delete' | translate }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'structuresV2' && feeV2ConfigWrite" class="animate-in">
        <div
          *ngIf="v2Message"
          class="alert alert-dismissible fees-banner py-2 px-3 small mb-2 d-flex align-items-start justify-content-between gap-2"
          [class.alert-success]="v2MessageOk"
          [class.alert-danger]="!v2MessageOk"
          role="alert"
        >
          <span class="fees-banner__text flex-grow-1">{{ v2Message }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'fees.close' | translate" (click)="clearV2Message()"></button>
        </div>
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v2StructuresTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'fees.v2StructuresDesc' | translate }}</p>
          <div class="row g-2">
            <div class="col-12 col-md-3">
              <label class="erp-label small">{{ 'fees.v2Class' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2StructureForm.classId">
                <option [ngValue]="null">{{ 'fees.pickClass' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name }}</option>
              </select>
            </div>
            <div class="col-12 col-md-3">
              <label class="erp-label small">{{ 'fees.v2StructureName' | translate }}</label>
              <input class="erp-input w-100" [(ngModel)]="v2StructureForm.structureName" [placeholder]="'fees.v2StructureNamePh' | translate" />
            </div>
            <div class="col-6 col-md-2">
              <label class="erp-label small">{{ 'fees.v2Version' | translate }}</label>
              <input class="erp-input w-100" type="number" [(ngModel)]="v2StructureForm.versionNo" />
            </div>
            <div class="col-6 col-md-2">
              <label class="erp-label small">{{ 'fees.labelStatus' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2StructureForm.status">
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
          <div class="fees-v2-subcard">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="small fw-bold">{{ 'fees.v2StructureLines' | translate }}</span>
              <button type="button" class="btn-outline-erp btn-xs" (click)="addV2StructureLine()">{{ 'fees.v2AddLine' | translate }}</button>
            </div>
            <div *ngFor="let line of v2StructureForm.lines; let li = index" class="row g-2 align-items-end mb-2">
              <div class="col-12 col-md-5">
                <label class="erp-label small">{{ 'fees.v2Component' | translate }}</label>
                <select class="erp-select w-100" [(ngModel)]="line.feeComponentMasterId">
                  <option [ngValue]="0">{{ 'fees.pickComponent' | translate }}</option>
                  <option *ngFor="let c of v2Components" [ngValue]="c.id">{{ c.code }} — {{ c.name }}</option>
                </select>
              </div>
              <div class="col-10 col-md-4">
                <label class="erp-label small">{{ 'fees.thAmount' | translate }}</label>
                <input class="erp-input w-100" type="number" [(ngModel)]="line.amount" />
              </div>
              <div class="col-2 col-md-3 text-md-end">
                <button type="button" class="btn-outline-erp btn-xs" *ngIf="v2StructureForm.lines.length > 1" (click)="removeV2StructureLine(li)">{{ 'fees.delete' | translate }}</button>
              </div>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button type="button" class="btn-primary-erp btn-sm" [disabled]="v2StructureSaving" (click)="saveV2Structure()">{{ 'fees.save' | translate }}</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="resetV2StructureForm()">{{ 'fees.cancel' | translate }}</button>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.v2Class' | translate }}</th><th>{{ 'fees.v2StructureName' | translate }}</th><th>{{ 'fees.v2Version' | translate }}</th><th>{{ 'fees.labelStatus' | translate }}</th><th>{{ 'fees.v2LinesCount' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of v2Structures">
                  <td>{{ s.id }}</td>
                  <td>{{ s.classId }}</td>
                  <td>{{ s.structureName }}</td>
                  <td>{{ s.versionNo }}</td>
                  <td>{{ s.status }}</td>
                  <td>{{ s.components.length || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'assignmentsV2' && (feeV2FinanceRead || feeV2ConfigWrite || feeV2BillingWrite)" class="animate-in fees-assignment-panel">
        <div
          *ngIf="v2Message"
          class="alert alert-dismissible fees-banner py-2 px-3 small mb-2 d-flex align-items-start justify-content-between gap-2"
          [class.alert-success]="v2MessageOk"
          [class.alert-danger]="!v2MessageOk"
          role="alert"
        >
          <span class="fees-banner__text flex-grow-1">{{ v2Message }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'fees.close' | translate" (click)="clearV2Message()"></button>
        </div>
        <div class="erp-card mb-3" *ngIf="feeV2ConfigWrite">
          <h4 class="fees-v2-panel-title">{{ 'fees.v2AssignmentsTitle' | translate }}</h4>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v2AssignmentsDesc' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-6 col-lg-4 fees-form-field">
              <label class="erp-label small" for="feeV2SnapClass">{{ 'fees.v2PickClassForAssignment' | translate }}</label>
              <select id="feeV2SnapClass" class="erp-select w-100" [(ngModel)]="v2SnapshotForm.classId" (ngModelChange)="onV2SnapshotClassChange($event)">
                <option [ngValue]="null">{{ 'fees.v2ChooseClassPlaceholder' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-6 col-lg-4 fees-form-field">
              <label class="erp-label small" for="feeV2SnapStudent">{{ 'fees.labelStudent' | translate }}</label>
              <select id="feeV2SnapStudent" class="erp-select w-100" [(ngModel)]="v2SnapshotForm.studentId" [disabled]="!v2SnapshotStudentsInClass.length">
                <option [ngValue]="0">{{ 'fees.v2ChooseStudentPlaceholder' | translate }}</option>
                <option *ngFor="let st of v2SnapshotStudentsInClass" [ngValue]="st.id">{{ v2StudentOptionLabel(st) }}</option>
              </select>
            </div>
            <div class="col-12 col-md-6 col-lg-4 fees-form-field" *ngIf="v2StructuresForSnapshotClass.length">
              <label class="erp-label small" for="feeV2SnapPlan">{{ 'fees.v2FeePlanLabel' | translate }}</label>
              <select id="feeV2SnapPlan" class="erp-select w-100" [ngModel]="v2SnapshotForm.feeStructureId" (ngModelChange)="onV2SnapshotPlanChange($event)">
                <option [ngValue]="0">{{ 'fees.v2ChoosePlanPlaceholder' | translate }}</option>
                <option *ngFor="let pl of v2StructuresForSnapshotClass" [ngValue]="pl.id">{{ pl.structureName }} — {{ 'fees.v2VersionTag' | translate: { n: pl.versionNo } }}</option>
              </select>
            </div>
            <ng-container *ngIf="v2SnapshotForm.classId && !v2StructuresForSnapshotClass.length">
              <div class="col-12 col-md-6 col-lg-4 fees-form-field">
                <label class="erp-label small" for="feeV2SnapPlanId">{{ 'fees.v2ManualPlanIdLabel' | translate }}</label>
                <input id="feeV2SnapPlanId" class="erp-input w-100" type="number" [(ngModel)]="v2SnapshotForm.feeStructureId" (ngModelChange)="onV2SnapshotManualStructureIdChange()" />
                <p class="small text-muted mb-0 mt-1">{{ 'fees.v2ManualPlanHint' | translate }}</p>
              </div>
              <div class="col-12 col-md-4 col-lg-3 fees-form-field">
                <label class="erp-label small" for="feeV2SnapVerManual">{{ 'fees.v2FrozenVersionPh' | translate }}</label>
                <input id="feeV2SnapVerManual" class="erp-input w-100" type="number" [(ngModel)]="v2SnapshotForm.frozenVersionNo" />
              </div>
            </ng-container>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field" *ngIf="v2StructuresForSnapshotClass.length && v2SnapshotFrozenVersionLocked">
              <label class="erp-label small">{{ 'fees.v2FrozenVersionPh' | translate }}</label>
              <div class="erp-input w-100 py-2 small mb-0 border rounded px-2" style="background:var(--clr-surface-muted);opacity:0.95">{{ v2SnapshotForm.frozenVersionNo }}</div>
              <p class="small text-muted mb-0 mt-1">{{ 'fees.v2VersionFromPlanHint' | translate }}</p>
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small" for="feeV2SnapFrom">{{ 'fees.v2ValidFrom' | translate }}</label>
              <app-erp-date-picker
                [(ngModel)]="v2SnapshotForm.validFrom"
                inputId="feeV2SnapFrom"
                placeholderI18nKey="fees.datePlaceholder"
              />
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small" for="feeV2SnapTo">{{ 'fees.v2ValidToOptional' | translate }}</label>
              <app-erp-date-picker
                [(ngModel)]="v2SnapshotForm.validTo"
                inputId="feeV2SnapTo"
                placeholderI18nKey="fees.datePlaceholder"
              />
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-primary-erp btn-sm w-100" (click)="saveV2Snapshot()">{{ 'fees.v2FreezeAssignment' | translate }}</button>
            </div>
          </div>
        </div>
        <div class="erp-card mb-3" *ngIf="feeV2FinanceRead || feeV2BillingWrite">
          <h4 class="fees-v2-panel-title">{{ 'fees.v2RuleAssignmentTitle' | translate }}</h4>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v2RuleAssignmentDesc' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-6 col-lg-4 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2RuleAssignClass' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2AssignPreviewClassId" (ngModelChange)="onV2AssignPreviewClassChange()">
                <option [ngValue]="null">{{ 'fees.v2ChooseClassPlaceholder' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-6 col-lg-4 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2SectionLabel' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2AssignPreviewSectionId" [disabled]="!v2AssignPreviewSections.length">
                <option [ngValue]="null">{{ 'fees.v2SectionWholeClass' | translate }}</option>
                <option *ngFor="let sec of v2AssignPreviewSections" [ngValue]="sec.id">{{ sec.name }}</option>
              </select>
            </div>
            <div class="col-12 col-lg-6 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2StudentIdsOptionalCsv' | translate }}</label>
              <div class="fees-inline-field-row">
                <input class="erp-input" [(ngModel)]="v2AssignPreviewStudentIdsCsv" />
                <button
                  *ngIf="feeV2FinanceRead"
                  type="button"
                  class="btn-outline-erp btn-sm"
                  [disabled]="v2Busy"
                  (click)="runV2AssignmentPreview()"
                >
                  {{ 'fees.v2AssignmentPreview' | translate }}
                </button>
              </div>
              <p class="small text-muted mb-0 mt-1">{{ 'fees.v2StudentIdsCsvHelp' | translate }}</p>
            </div>
          </div>
          <hr class="fees-assignment-divider" *ngIf="feeV2BillingWrite" />
          <h5 class="small fw-bold mb-2" *ngIf="feeV2BillingWrite">{{ 'fees.v2RuleApplySectionTitle' | translate }}</h5>
          <p class="text-muted small mb-3" *ngIf="feeV2BillingWrite">{{ 'fees.v2RuleApplySectionLead' | translate }}</p>
          <div class="row g-3 align-items-end" *ngIf="feeV2BillingWrite">
            <div class="col-12 col-md-6 col-lg-4 fees-form-field">
              <label class="erp-label small" for="feeV2AssignExecFrom">{{ 'fees.v2AssignExecValidFrom' | translate }}</label>
              <app-erp-date-picker
                [(ngModel)]="v2AssignExecValidFrom"
                inputId="feeV2AssignExecFrom"
                placeholderI18nKey="fees.datePlaceholder"
              />
            </div>
            <div class="col-12 col-md-6 col-lg-4 fees-form-field">
              <label class="erp-label small" for="feeV2AssignExecTo">{{ 'fees.v2AssignExecValidToOptional' | translate }}</label>
              <app-erp-date-picker
                [(ngModel)]="v2AssignExecValidTo"
                inputId="feeV2AssignExecTo"
                placeholderI18nKey="fees.datePlaceholder"
              />
            </div>
            <div class="col-12 col-lg-4 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2RunIdempotencyPh' | translate }}</label>
              <input class="erp-input w-100" [(ngModel)]="v2AssignExecIdem" />
              <p class="small text-muted mb-0 mt-1">{{ 'fees.v2RunIdempotencyHelp' | translate }}</p>
            </div>
          </div>
          <div class="row g-3 align-items-center mt-1" *ngIf="feeV2BillingWrite">
            <div class="col-12 col-md-auto fees-form-field">
              <label class="small mb-0 d-flex align-items-center gap-2">
                <input type="checkbox" [(ngModel)]="v2AssignExecForce" /> {{ 'fees.v2AssignmentForce' | translate }}
              </label>
            </div>
            <div class="col-12 col-md-auto ms-md-auto fees-form-field">
              <button type="button" class="btn-primary-erp btn-sm" [disabled]="v2Busy" (click)="runV2AssignmentExecute()">{{ 'fees.v2AssignmentExecute' | translate }}</button>
            </div>
          </div>
          <div class="fees-table-wrap mt-3" *ngIf="v2AssignPreviewResult as prev">
            <p class="small text-muted mb-2" *ngIf="prev.rows.length">{{ 'fees.v2PreviewSummary' | translate: { change: (prev.wouldChangeCount ?? 0), total: prev.rows.length } }}</p>
            <table class="erp-table" *ngIf="prev.rows.length">
              <thead>
                <tr>
                  <th>{{ 'fees.thStudent' | translate }}</th>
                  <th>{{ 'fees.v2Class' | translate }}</th>
                  <th>{{ 'fees.v2CurrentStructure' | translate }}</th>
                  <th>{{ 'fees.v2ProposedStructure' | translate }}</th>
                  <th>{{ 'fees.v2MatchedRule' | translate }}</th>
                  <th>{{ 'fees.v2WouldChange' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pr of prev.rows">
                  <td>
                    <div class="fw-semibold">{{ v2StudentDisplayName(pr.studentId) }}</div>
                    <div class="small text-muted" *ngIf="v2StudentsById.get(pr.studentId)?.admissionNumber">{{ 'fees.v2Adm' | translate }} {{ v2StudentsById.get(pr.studentId)?.admissionNumber }}</div>
                  </td>
                  <td>{{ v2ClassDisplayName(pr.classId) }}</td>
                  <td>{{ v2StructureDisplay(pr.currentFeeStructureId, pr.currentFrozenVersionNo) }}</td>
                  <td>{{ v2StructureDisplay(pr.proposedFeeStructureId, pr.proposedFrozenVersionNo) }}</td>
                  <td>{{ pr.matchedRuleCode || '—' }}</td>
                  <td><span class="badge rounded-pill" [class.text-bg-warning]="pr.wouldChange" [class.text-bg-secondary]="!pr.wouldChange">{{ v2WouldChangeLabel(pr.wouldChange) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title mb-2">{{ 'fees.v2CurrentAssignmentsTitle' | translate }}</h4>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v2CurrentAssignmentsDesc' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-6 col-lg-5 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2FilterStudentOptional' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2MapsFilterStudentId">
                <option [ngValue]="null">{{ 'fees.v2AllStudentsFilter' | translate }}</option>
                <option *ngFor="let s of v2StudentsSortedForPicker" [ngValue]="s.id">{{ v2StudentOptionLabel(s) }}</option>
              </select>
            </div>
            <div class="col-12 col-md-3 col-lg-2 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-outline-erp btn-sm w-100" (click)="loadV2FeeMaps()">{{ 'fees.refresh' | translate }}</button>
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>{{ 'fees.thRecordId' | translate }}</th>
                  <th>{{ 'fees.thStudent' | translate }}</th>
                  <th>{{ 'fees.v2Class' | translate }}</th>
                  <th>{{ 'fees.v2FeePlanLabel' | translate }}</th>
                  <th>{{ 'fees.v2FrozenVersionPh' | translate }}</th>
                  <th>{{ 'fees.v2ValidFrom' | translate }}</th>
                  <th>{{ 'fees.v2ValidTo' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of v2FeeMaps">
                  <td>{{ m.id }}</td>
                  <td>
                    <div class="fw-semibold">{{ v2StudentDisplayName(m.studentId) }}</div>
                    <div class="small text-muted" *ngIf="v2StudentsById.get(m.studentId)?.admissionNumber">{{ 'fees.v2Adm' | translate }} {{ v2StudentsById.get(m.studentId)?.admissionNumber }}</div>
                  </td>
                  <td>{{ v2ClassDisplayName(m.classId) }}</td>
                  <td>{{ v2FeeMapPlanName(m.feeStructureId) }}</td>
                  <td>{{ m.frozenVersionNo }}</td>
                  <td>{{ m.validFrom }}</td>
                  <td>{{ m.validTo || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'rulesV2' && feeV2ConfigWrite" class="animate-in">
        <div class="erp-card mb-3">
          <h4 class="mb-2">{{ 'fees.v2RulesTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'fees.v2RulesDesc' | translate }}</p>
          <div class="row g-2">
            <div class="col-md-2"><input class="erp-input" [(ngModel)]="v2RuleForm.ruleCode" [placeholder]="'fees.v2Code' | translate" /></div>
            <div class="col-md-4"><input class="erp-input" [(ngModel)]="v2RuleForm.ruleName" [placeholder]="'fees.v2Name' | translate" /></div>
            <div class="col-md-2">
              <select class="erp-select" [(ngModel)]="v2RuleForm.ruleType">
                <option value="ASSIGNMENT">ASSIGNMENT</option>
                <option value="DISCOUNT">DISCOUNT</option>
                <option value="LATE_FEE">LATE_FEE</option>
              </select>
            </div>
            <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="v2RuleForm.priorityNo" [placeholder]="'fees.v2Priority' | translate" /></div>
            <div class="col-md-2 d-flex align-items-center"><label class="small"><input type="checkbox" [(ngModel)]="v2RuleForm.stopOnMatch" /> {{ 'fees.v2StopOnMatch' | translate }}</label></div>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button type="button" class="btn-primary-erp btn-sm" [disabled]="v2Busy" (click)="saveV2Rule()">{{ 'fees.save' | translate }}</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="resetV2RuleForm()">{{ 'fees.cancel' | translate }}</button>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.v2Code' | translate }}</th><th>{{ 'fees.v2Name' | translate }}</th><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.v2Priority' | translate }}</th><th>{{ 'fees.thActions' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of v2Rules">
                  <td>{{ r.ruleCode }}</td><td>{{ r.ruleName }}</td><td>{{ r.ruleType }}</td><td>{{ r.priorityNo }}</td>
                  <td class="fees-actions">
                    <button type="button" class="btn-outline-erp btn-xs" (click)="openV2RuleLogic(r)">{{ 'fees.v2RuleLogic' | translate }}</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="startEditV2Rule(r)">{{ 'fees.edit' | translate }}</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="deleteV2Rule(r.id)">{{ 'fees.delete' | translate }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div *ngIf="v2RuleLogicRuleId" class="erp-card mt-3">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h4 class="fees-v2-panel-title mb-1">{{ 'fees.v2RuleLogicTitle' | translate }}</h4>
              <p class="text-muted small mb-0">{{ 'fees.v2RuleLogicDesc' | translate }}</p>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="closeV2RuleLogic()">{{ 'fees.close' | translate }}</button>
          </div>
          <p *ngIf="v2RuleLogicLoading" class="small text-muted my-2">{{ 'fees.refreshing' | translate }}</p>
          <div *ngIf="!v2RuleLogicLoading" class="row g-3 mt-1">
            <div class="col-12 col-lg-6">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small fw-bold">{{ 'fees.v2RuleConditions' | translate }}</span>
                <button type="button" class="btn-outline-erp btn-xs" (click)="addV2RuleConditionDraft()">{{ 'fees.v2AddLine' | translate }}</button>
              </div>
              <div *ngFor="let c of v2RuleConditionDrafts; let ci = index" class="fees-v2-subcard py-2 mb-2">
                <div class="row g-2">
                  <div class="col-12 col-md-6"><input class="erp-input w-100" [(ngModel)]="c.fieldName" [placeholder]="'fees.v2CondField' | translate" /></div>
                  <div class="col-12 col-md-6"><input class="erp-input w-100" [(ngModel)]="c.operator" [placeholder]="'fees.v2CondOp' | translate" /></div>
                  <div class="col-12 col-md-4"><input class="erp-input w-100" [(ngModel)]="c.valueType" [placeholder]="'fees.v2ValueType' | translate" /></div>
                  <div class="col-12 col-md-4"><input class="erp-input w-100" [(ngModel)]="c.valueText" [placeholder]="'fees.v2ValueText' | translate" /></div>
                  <div class="col-12 col-md-4"><input class="erp-input w-100" type="number" [(ngModel)]="c.valueNumber" [placeholder]="'fees.v2ValueNumber' | translate" /></div>
                  <div class="col-12"><input class="erp-input w-100" [(ngModel)]="c.logicalJoin" [placeholder]="'fees.v2LogicalJoin' | translate" /></div>
                </div>
                <button type="button" class="btn-outline-erp btn-xs mt-2" (click)="removeV2RuleConditionDraft(ci)">{{ 'fees.delete' | translate }}</button>
              </div>
            </div>
            <div class="col-12 col-lg-6">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small fw-bold">{{ 'fees.v2RuleActions' | translate }}</span>
                <button type="button" class="btn-outline-erp btn-xs" (click)="addV2RuleActionDraft()">{{ 'fees.v2AddLine' | translate }}</button>
              </div>
              <div *ngFor="let a of v2RuleActionDrafts; let ai = index" class="fees-v2-subcard py-2 mb-2">
                <div class="row g-2">
                  <div class="col-12 col-md-6"><input class="erp-input w-100" [(ngModel)]="a.actionType" [placeholder]="'fees.v2ActionType' | translate" /></div>
                  <div class="col-12 col-md-6"><input class="erp-input w-100" [(ngModel)]="a.targetScope" [placeholder]="'fees.v2TargetScope' | translate" /></div>
                  <div class="col-12 col-md-4"><input class="erp-input w-100" [(ngModel)]="a.valueType" [placeholder]="'fees.v2ValueType' | translate" /></div>
                  <div class="col-12 col-md-4"><input class="erp-input w-100" [(ngModel)]="a.valueText" [placeholder]="'fees.v2ValueText' | translate" /></div>
                  <div class="col-12 col-md-4"><input class="erp-input w-100" type="number" [(ngModel)]="a.valueNumber" [placeholder]="'fees.v2ValueNumber' | translate" /></div>
                </div>
                <button type="button" class="btn-outline-erp btn-xs mt-2" (click)="removeV2RuleActionDraft(ai)">{{ 'fees.delete' | translate }}</button>
              </div>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3" *ngIf="!v2RuleLogicLoading">
            <button type="button" class="btn-primary-erp btn-sm" [disabled]="v2Busy" (click)="saveV2RuleDefinition()">{{ 'fees.save' | translate }}</button>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'demandRunsV2' && feeV2FinanceRead" class="animate-in">
        <div class="erp-card mb-3">
          <h4 class="mb-2">{{ 'fees.v2DemandRunsTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'fees.v2DemandRunsDesc' | translate }}</p>
          <div class="row g-2">
            <div class="col-md-2">
              <select class="erp-select" [(ngModel)]="v2DemandRunForm.runType">
                <option value="MONTHLY">MONTHLY</option>
                <option value="ADHOC">ADHOC</option>
              </select>
            </div>
            <div class="col-md-3"><input class="erp-input" [(ngModel)]="v2DemandRunForm.periodKey" [placeholder]="'fees.v2PeriodKey' | translate" /></div>
            <div class="col-md-3"><input class="erp-input" [(ngModel)]="v2DemandRunForm.idempotencyKey" [placeholder]="'fees.v2Idempotency' | translate" /></div>
            <div class="col-md-2"><input class="erp-input" [(ngModel)]="v2DemandRunForm.triggerSource" [placeholder]="'fees.v2TriggerSource' | translate" /></div>
            <div class="col-md-2"><button type="button" class="btn-primary-erp btn-sm w-100" [disabled]="!feeV2BillingWrite" (click)="createV2DemandRun()">{{ 'fees.save' | translate }}</button></div>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.v2PeriodKey' | translate }}</th><th>{{ 'fees.thStatus' | translate }}</th><th>{{ 'fees.v2DemandsPosted' | translate }}</th><th>{{ 'fees.v2Idempotency' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let d of v2DemandRuns">
                  <td>{{ d.id }}</td><td>{{ d.runType }}</td><td>{{ d.periodKey }}</td><td>{{ d.status }}</td><td>{{ d.demandsPosted ?? '—' }}</td><td>{{ d.idempotencyKey }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'demandsV2' && feeV2FinanceRead" class="animate-in fees-assignment-panel">
        <div
          *ngIf="v2Message"
          class="alert alert-dismissible fees-banner py-2 px-3 small mb-2 d-flex align-items-start justify-content-between gap-2"
          [class.alert-success]="v2MessageOk"
          [class.alert-danger]="!v2MessageOk"
          role="alert"
        >
          <span class="fees-banner__text flex-grow-1">{{ v2Message }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'fees.close' | translate" (click)="clearV2Message()"></button>
        </div>
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v2DemandsTitle' | translate }}</h4>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v2DemandsDesc' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2PickClassForAssignment' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2DemandsClassId" (ngModelChange)="onV2DemandsClassChange($event)">
                <option [ngValue]="null">{{ 'fees.v2ChooseClassPlaceholder' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-5 col-lg-4 fees-form-field">
              <label class="erp-label small">{{ 'fees.labelStudent' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2DemandsStudentId" [disabled]="!v2DemandsStudentsInClass.length">
                <option [ngValue]="null">{{ 'fees.v2ChooseStudentPlaceholder' | translate }}</option>
                <option *ngFor="let st of v2DemandsStudentsInClass" [ngValue]="st.id">{{ v2StudentOptionLabel(st) }}</option>
              </select>
            </div>
            <div class="col-12 col-md-3 col-lg-2 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-outline-erp btn-sm w-100" (click)="loadV2Demands()">{{ 'fees.refresh' | translate }}</button>
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.v2PeriodKey' | translate }}</th><th>{{ 'fees.thDueDate' | translate }}</th><th>{{ 'fees.thAmount' | translate }}</th><th>{{ 'fees.v2Outstanding' | translate }}</th><th>{{ 'fees.thStatus' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let x of v2Demands">
                  <td>{{ x.id }}</td><td>{{ x.periodKey }}</td><td>{{ x.dueDate }}</td><td>{{ x.netAmount }}</td><td>{{ x.outstandingAmount }}</td><td>{{ x.demandStatus }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'discountsV2' && feeV2FinanceRead" class="animate-in fees-assignment-panel">
        <div
          *ngIf="v2Message"
          class="alert alert-dismissible fees-banner py-2 px-3 small mb-2 d-flex align-items-start justify-content-between gap-2"
          [class.alert-success]="v2MessageOk"
          [class.alert-danger]="!v2MessageOk"
          role="alert"
        >
          <span class="fees-banner__text flex-grow-1">{{ v2Message }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'fees.close' | translate" (click)="clearV2Message()"></button>
        </div>
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v2DiscountsTitle' | translate }}</h4>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v2DiscountsDesc' | translate }}</p>
          <div class="row g-3 align-items-end mb-3">
            <div class="col-12 col-md-4 col-lg-3 fees-form-field" *ngIf="!v2DiscountEditingId">
              <label class="erp-label small">{{ 'fees.v2PickClassForAssignment' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2DiscountClassId" (ngModelChange)="onV2DiscountClassChange($event)">
                <option [ngValue]="null">{{ 'fees.v2ChooseClassPlaceholder' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-5 col-lg-4 fees-form-field" *ngIf="!v2DiscountEditingId">
              <label class="erp-label small">{{ 'fees.labelStudent' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2DiscountStudentId" (ngModelChange)="onV2DiscountStudentPicked($event)" [disabled]="!v2DiscountStudentsInClass.length">
                <option [ngValue]="null">{{ 'fees.v2ChooseStudentPlaceholder' | translate }}</option>
                <option *ngFor="let st of v2DiscountStudentsInClass" [ngValue]="st.id">{{ v2StudentOptionLabel(st) }}</option>
              </select>
            </div>
            <div class="col-12 col-md-3 col-lg-2 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-outline-erp btn-sm w-100" (click)="loadV2Discounts()">{{ 'fees.refresh' | translate }}</button>
            </div>
          </div>
          <div class="fees-v2-subcard" *ngIf="v2DiscountEditingId">
            <p class="small mb-3"><span class="text-muted">{{ 'fees.v2EditingDiscountFor' | translate }}</span> <strong>{{ v2StudentDisplayName(v2DiscountForm.studentId) }}</strong></p>
          </div>
          <div class="fees-v2-subcard fees-assignment-panel">
            <div class="row g-3">
              <div class="col-12 col-md-4 col-lg-3 fees-form-field">
                <label class="erp-label small">{{ 'fees.v2DiscountTypeLabel' | translate }}</label>
                <select class="erp-select w-100" [(ngModel)]="v2DiscountForm.discountType">
                  <option value="FLAT">{{ 'fees.v2DiscountFlat' | translate }}</option>
                  <option value="PERCENTAGE">{{ 'fees.v2DiscountPercent' | translate }}</option>
                </select>
              </div>
              <div class="col-12 col-md-4 col-lg-3 fees-form-field">
                <label class="erp-label small">{{ 'fees.v2DiscountValue' | translate }}</label>
                <input class="erp-input w-100" type="number" [(ngModel)]="v2DiscountForm.discountValue" />
              </div>
              <div class="col-12 col-md-4 col-lg-3 fees-form-field">
                <label class="erp-label small">{{ 'fees.v2ComponentScope' | translate }}</label>
                <input class="erp-input w-100" [(ngModel)]="v2DiscountForm.componentScope" />
              </div>
              <div class="col-12 col-md-6 fees-form-field">
                <label class="erp-label small">{{ 'fees.v2ComponentIdsJsonPh' | translate }}</label>
                <input class="erp-input w-100" [(ngModel)]="v2DiscountForm.applicableComponentIdsJson" />
              </div>
              <div class="col-12 col-md-4 col-lg-3 fees-form-field">
                <label class="erp-label small" for="feeV2DiscFrom">{{ 'fees.v2ValidFrom' | translate }}</label>
                <app-erp-date-picker
                  [(ngModel)]="v2DiscountForm.validFrom"
                  inputId="feeV2DiscFrom"
                  placeholderI18nKey="fees.datePlaceholder"
                />
              </div>
              <div class="col-12 col-md-4 col-lg-3 fees-form-field">
                <label class="erp-label small" for="feeV2DiscTo">{{ 'fees.v2ValidToOptional' | translate }}</label>
                <app-erp-date-picker
                  [(ngModel)]="v2DiscountForm.validTo"
                  inputId="feeV2DiscTo"
                  placeholderI18nKey="fees.datePlaceholder"
                />
              </div>
              <div class="col-12 fees-form-field">
                <label class="erp-label small">{{ 'fees.v2Reason' | translate }}</label>
                <input class="erp-input w-100" [(ngModel)]="v2DiscountForm.reason" />
              </div>
            </div>
            <div class="d-flex gap-2 mt-3">
              <button type="button" class="btn-primary-erp btn-sm" [disabled]="v2Busy || !feeV2BillingWrite" (click)="saveV2Discount()">{{ 'fees.save' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-sm" [disabled]="!feeV2BillingWrite" (click)="resetV2DiscountForm()">{{ 'fees.cancel' | translate }}</button>
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.thStudent' | translate }}</th><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.thAmount' | translate }}</th><th>{{ 'fees.v2ComponentScope' | translate }}</th><th>{{ 'fees.v2ValidFrom' | translate }}</th><th>{{ 'fees.thActions' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let di of v2Discounts">
                  <td>{{ di.id }}</td>
                  <td>
                    <div class="fw-semibold">{{ v2StudentDisplayName(di.studentId) }}</div>
                    <div class="small text-muted" *ngIf="v2StudentsById.get(di.studentId)?.admissionNumber">{{ 'fees.v2Adm' | translate }} {{ v2StudentsById.get(di.studentId)?.admissionNumber }}</div>
                  </td>
                  <td>{{ di.discountType }}</td><td>{{ di.discountValue }}</td><td>{{ di.componentScope }}</td><td>{{ di.validFrom }}</td>
                  <td class="fees-actions">
                    <button type="button" class="btn-outline-erp btn-xs" [disabled]="!feeV2BillingWrite" (click)="startEditV2Discount(di)">{{ 'fees.edit' | translate }}</button>
                    <button type="button" class="btn-outline-erp btn-xs" [disabled]="!feeV2BillingWrite" (click)="deleteV2Discount(di.id)">{{ 'fees.delete' | translate }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'phase3Reports' && feeV2FinanceRead" class="animate-in">
        <div
          *ngIf="v2Message"
          class="alert alert-dismissible fees-banner py-2 px-3 small mb-2 d-flex align-items-start justify-content-between gap-2"
          [class.alert-success]="v2MessageOk"
          [class.alert-danger]="!v2MessageOk"
          role="alert"
        >
          <span class="fees-banner__text flex-grow-1">{{ v2Message }}</span>
          <button type="button" class="btn-close" [attr.aria-label]="'fees.close' | translate" (click)="clearV2Message()"></button>
        </div>
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v3ReportsTitle' | translate }}</h4>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v3ReportsDesc' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-3 fees-form-field">
              <label class="erp-label small" for="feeV3ReportFrom">{{ 'fees.v3DateFrom' | translate }}</label>
              <app-erp-date-picker [(ngModel)]="v3ReportFrom" inputId="feeV3ReportFrom" placeholderI18nKey="fees.datePlaceholder" />
            </div>
            <div class="col-12 col-md-3 fees-form-field">
              <label class="erp-label small" for="feeV3ReportTo">{{ 'fees.v3DateTo' | translate }}</label>
              <app-erp-date-picker [(ngModel)]="v3ReportTo" inputId="feeV3ReportTo" placeholderI18nKey="fees.datePlaceholder" />
            </div>
            <div class="col-12 col-md-3 col-lg-2 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-primary-erp btn-sm w-100" (click)="loadPhase3Reports()">{{ 'fees.refresh' | translate }}</button>
            </div>
          </div>
          <div *ngIf="v3CollectionSummary" class="fees-v2-subcard mt-3">
            <div class="row g-2">
              <div class="col-6 col-md-4"><span class="small text-muted">{{ 'fees.v3TotalCollected' | translate }}</span><div class="fw-bold">{{ v3CollectionSummary.totalCollected }}</div></div>
              <div class="col-6 col-md-4"><span class="small text-muted">{{ 'fees.v3PaymentCount' | translate }}</span><div class="fw-bold">{{ v3CollectionSummary.paymentCount }}</div></div>
            </div>
            <div class="fees-table-wrap mt-2" *ngIf="v3CollectionSummary.byPaymentMode && v3CollectionSummary.byPaymentMode.length">
              <table class="erp-table">
                <thead><tr><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.thAmount' | translate }}</th><th>{{ 'fees.v3PaymentCount' | translate }}</th></tr></thead>
                <tbody>
                  <tr *ngFor="let b of v3CollectionSummary.byPaymentMode"><td>{{ b.paymentMode }}</td><td>{{ b.totalAmount }}</td><td>{{ b.paymentCount }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="erp-card mb-3">
          <h5 class="small fw-bold mb-2">{{ 'fees.v3DefaultersTitle' | translate }}</h5>
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thStudent' | translate }}</th><th>{{ 'fees.v2Class' | translate }}</th><th>{{ 'fees.v2Outstanding' | translate }}</th><th>{{ 'fees.v3DemandCount' | translate }}</th><th>{{ 'fees.thDueDate' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let d of v3Defaulters">
                  <td>
                    <div class="fw-semibold">{{ v2StudentDisplayName(d.studentId) }}</div>
                    <div class="small text-muted" *ngIf="v2StudentsById.get(d.studentId)?.admissionNumber">{{ 'fees.v2Adm' | translate }} {{ v2StudentsById.get(d.studentId)?.admissionNumber }}</div>
                  </td>
                  <td>{{ v2ClassDisplayName(d.classId) }}</td>
                  <td>{{ d.totalOutstanding }}</td><td>{{ d.demandCount }}</td><td>{{ d.oldestDueDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="erp-card mb-3">
          <h5 class="small fw-bold mb-2">{{ 'fees.v3ClassOutstandingTitle' | translate }}</h5>
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.v2Class' | translate }}</th><th>{{ 'fees.v2Outstanding' | translate }}</th><th>{{ 'fees.v3TotalDemanded' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of v3ClassOutstanding"><td>{{ v2ClassDisplayName(c.classId) }}</td><td>{{ c.totalOutstanding }}</td><td>{{ c.totalDemanded }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="erp-card fees-assignment-panel">
          <h5 class="small fw-bold mb-2">{{ 'fees.v3StatementTitle' | translate }}</h5>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v3StatementLead' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2PickClassForAssignment' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v3StatementClassId" (ngModelChange)="onV3StatementClassChange($event)">
                <option [ngValue]="null">{{ 'fees.v2ChooseClassPlaceholder' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-5 col-lg-4 fees-form-field">
              <label class="erp-label small">{{ 'fees.labelStudent' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v3StatementStudentId" [disabled]="!v3StatementStudentsInClass.length">
                <option [ngValue]="null">{{ 'fees.v2ChooseStudentPlaceholder' | translate }}</option>
                <option *ngFor="let st of v3StatementStudentsInClass" [ngValue]="st.id">{{ v2StudentOptionLabel(st) }}</option>
              </select>
            </div>
            <div class="col-12 col-md-3 col-lg-2 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-outline-erp btn-sm w-100" (click)="loadV3Statement()">{{ 'fees.refresh' | translate }}</button>
            </div>
          </div>
          <div *ngIf="v3Statement" class="fees-v2-subcard mt-3">
            <p class="small mb-2"><strong>{{ 'fees.v2RunningBalance' | translate }}:</strong> {{ v3Statement.runningBalance }}</p>
            <div class="fees-table-wrap mb-2">
              <div class="small fw-bold mb-1">{{ 'fees.v3OpenDemands' | translate }}</div>
              <table class="erp-table">
                <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.v2PeriodKey' | translate }}</th><th>{{ 'fees.v2Outstanding' | translate }}</th><th>{{ 'fees.thStatus' | translate }}</th></tr></thead>
                <tbody>
                  <tr *ngFor="let od of v3Statement.openDemands"><td>{{ od.id }}</td><td>{{ od.periodKey }}</td><td>{{ od.outstandingAmount }}</td><td>{{ od.demandStatus }}</td></tr>
                </tbody>
              </table>
            </div>
            <div class="fees-table-wrap">
              <div class="small fw-bold mb-1">{{ 'fees.v3RecentLedger' | translate }}</div>
              <table class="erp-table">
                <thead><tr><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.v2Source' | translate }}</th><th>{{ 'fees.thAmount' | translate }}</th><th>{{ 'fees.v2RunningBalance' | translate }}</th></tr></thead>
                <tbody>
                  <tr *ngFor="let le of v3Statement.recentLedger"><td>{{ le.entryType }}</td><td>{{ le.sourceRefCode }}</td><td>{{ le.amount }}</td><td>{{ le.runningBalance }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'phase3Payments' && feeV2FinanceRead" class="animate-in fees-assignment-panel">
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v3PaymentsTitle' | translate }}</h4>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v3PaymentsDesc' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2PickClassForAssignment' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v3PayRegClassId" (ngModelChange)="onV3PayRegClassChange($event)">
                <option [ngValue]="null">{{ 'fees.v2ChooseClassPlaceholder' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-5 col-lg-4 fees-form-field">
              <label class="erp-label small">{{ 'fees.labelStudentOptional' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v3PayRegStudentId">
                <option [ngValue]="null">{{ 'fees.v3PayRegNoStudentFilter' | translate }}</option>
                <option *ngFor="let st of v3PayRegStudentsInClass" [ngValue]="st.id">{{ v2StudentOptionLabel(st) }}</option>
              </select>
              <p class="small text-muted mb-0 mt-1">{{ 'fees.v3PayRegStudentHint' | translate }}</p>
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small" for="feeV3PayRegFrom">{{ 'fees.v3DateFrom' | translate }}</label>
              <app-erp-date-picker [(ngModel)]="v3PayRegFrom" inputId="feeV3PayRegFrom" placeholderI18nKey="fees.datePlaceholder" />
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small" for="feeV3PayRegTo">{{ 'fees.v3DateTo' | translate }}</label>
              <app-erp-date-picker [(ngModel)]="v3PayRegTo" inputId="feeV3PayRegTo" placeholderI18nKey="fees.datePlaceholder" />
            </div>
            <div class="col-12 col-md-3 col-lg-2 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-primary-erp btn-sm w-100" (click)="loadPhase3PaymentRegister()">{{ 'fees.refresh' | translate }}</button>
            </div>
          </div>
        </div>
        <div class="erp-card mb-3" *ngIf="feeV2OnlineCheckout">
          <h5 class="small fw-bold mb-2">{{ 'fees.v3RazorpayOrderTitle' | translate }}</h5>
          <p class="text-muted small fees-panel-lead mb-3">{{ 'fees.v3RazorpayOrderDesc' | translate }}</p>
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2PickClassForAssignment' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2AdminRzpClassId" (ngModelChange)="onV2AdminRzpClassChange($event)">
                <option [ngValue]="null">{{ 'fees.v2ChooseClassPlaceholder' | translate }}</option>
                <option *ngFor="let cl of classes" [ngValue]="cl.id">{{ cl.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-5 col-lg-4 fees-form-field">
              <label class="erp-label small">{{ 'fees.labelStudent' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v2AdminRzpStudentId" [disabled]="!v2AdminRzpStudentsInClass.length">
                <option [ngValue]="null">{{ 'fees.v2ChooseStudentPlaceholder' | translate }}</option>
                <option *ngFor="let st of v2AdminRzpStudentsInClass" [ngValue]="st.id">{{ v2StudentOptionLabel(st) }}</option>
              </select>
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small">{{ 'fees.thAmount' | translate }}</label>
              <input class="erp-input w-100" type="number" [(ngModel)]="v2AdminRzpAmount" />
            </div>
            <div class="col-12 col-md-3 col-lg-2 fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <button type="button" class="btn-outline-erp btn-sm w-100" [disabled]="v2Busy" (click)="createAdminV2RazorpayOrder()">{{ 'fees.v3CreateRzpOrder' | translate }}</button>
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.thStudent' | translate }}</th><th>{{ 'fees.v3PayNo' | translate }}</th><th>{{ 'fees.v3ReceiptNo' | translate }}</th><th>{{ 'fees.thAmount' | translate }}</th><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.thStatus' | translate }}</th><th>{{ 'fees.v3PaidAt' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let p of v3PaymentRegister">
                  <td>{{ p.id }}</td>
                  <td>
                    <div class="fw-semibold">{{ v2StudentDisplayName(p.studentId) }}</div>
                    <div class="small text-muted" *ngIf="v2StudentsById.get(p.studentId)?.admissionNumber">{{ 'fees.v2Adm' | translate }} {{ v2StudentsById.get(p.studentId)?.admissionNumber }}</div>
                  </td>
                  <td>{{ p.paymentNo }}</td><td>{{ p.receiptNo || '—' }}</td><td>{{ p.amount }}</td><td>{{ p.paymentMode }}</td><td>{{ p.paymentStatus }}</td><td>{{ p.paymentDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'phase3Recon' && feeV2FinanceRead" class="animate-in">
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v3ReconTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'fees.v3ReconDesc' | translate }}</p>
          <button type="button" class="btn-primary-erp btn-sm" (click)="loadLedgerReconciliation()">{{ 'fees.refresh' | translate }}</button>
        </div>
        <div class="erp-card" *ngIf="v3LedgerRecon as recon">
          <p class="small text-muted mb-2">{{ 'fees.v3ReconMismatchCount' | translate }}: {{ recon.mismatchCount }}</p>
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thStudent' | translate }}</th><th>{{ 'fees.v3ReconDemand' | translate }}</th><th>{{ 'fees.v3ReconLedger' | translate }}</th><th>{{ 'fees.v3ReconDelta' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of recon.mismatches">
                  <td>
                    <div class="fw-semibold">{{ v2StudentDisplayName(row.studentId) }}</div>
                    <div class="small text-muted" *ngIf="v2StudentsById.get(row.studentId)?.admissionNumber">{{ 'fees.v2Adm' | translate }} {{ v2StudentsById.get(row.studentId)?.admissionNumber }}</div>
                  </td>
                  <td>{{ row.demandOutstandingTotal }}</td><td>{{ row.ledgerRunningBalance }}</td><td>{{ row.delta }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'phase3Audit' && feeV2FinanceRead" class="animate-in">
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v3AuditTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'fees.v3AuditDesc' | translate }}</p>
          <button type="button" class="btn-outline-erp btn-sm" (click)="loadPhase3Audit()">{{ 'fees.refresh' | translate }}</button>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.v3Action' | translate }}</th><th>{{ 'fees.v3Entity' | translate }}</th><th>{{ 'fees.v3Actor' | translate }}</th><th>{{ 'fees.v3Detail' | translate }}</th><th>{{ 'fees.v3When' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let a of v3AuditRows">
                  <td>{{ a.id }}</td><td>{{ a.actionCode }}</td><td>{{ a.entityType }} #{{ a.entityId }}</td><td>{{ a.actorUserId }}</td><td class="small text-break" style="max-width:220px">{{ a.detailJson }}</td><td>{{ a.createdAt }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'phase4LateFees' && (feeV2FinanceRead || feeV2ConfigWrite || feeV2BillingWrite)" class="animate-in">
        <div class="erp-card mb-3">
          <h4 class="fees-v2-panel-title">{{ 'fees.v4LateTitle' | translate }}</h4>
          <p class="text-muted small mb-0">{{ 'fees.v4LateDesc' | translate }}</p>
        </div>
        <div class="erp-card mb-3">
          <h5 class="fw-bold mb-2">{{ 'fees.v4PoliciesTitle' | translate }}</h5>
          <div class="row g-2 mb-3 align-items-end">
            <div class="col-12 col-md-2" *ngIf="!v4PolicyEditingId">
              <input class="erp-input w-100" [(ngModel)]="v4PolicyForm.policyCode" [placeholder]="'fees.v4PolicyCode' | translate" />
            </div>
            <div class="col-12 col-md-2" *ngIf="v4PolicyEditingId">
              <div class="small text-muted fw-semibold">{{ v4PolicyForm.policyCode }}</div>
            </div>
            <div class="col-12 col-md-2">
              <input class="erp-input w-100" [(ngModel)]="v4PolicyForm.policyName" [placeholder]="'fees.v4PolicyName' | translate" />
            </div>
            <div class="col-6 col-md-1">
              <input class="erp-input w-100" type="number" min="0" [(ngModel)]="v4PolicyForm.graceDays" [placeholder]="'fees.v4GraceDays' | translate" />
            </div>
            <div class="col-12 col-md-2">
              <select class="erp-select w-100" [(ngModel)]="v4PolicyForm.calculationMode">
                <option value="FLAT">{{ 'fees.v4ModeFlat' | translate }}</option>
                <option value="PERCENT_OF_PRINCIPAL">{{ 'fees.v4ModePercent' | translate }}</option>
              </select>
            </div>
            <div class="col-6 col-md-1" *ngIf="v4PolicyForm.calculationMode === 'FLAT'">
              <input class="erp-input w-100" type="number" min="0" step="0.01" [(ngModel)]="v4PolicyForm.flatAmount" [placeholder]="'fees.v4FlatAmount' | translate" />
            </div>
            <div class="col-6 col-md-1" *ngIf="v4PolicyForm.calculationMode === 'PERCENT_OF_PRINCIPAL'">
              <input class="erp-input w-100" type="number" min="0" step="0.0001" [(ngModel)]="v4PolicyForm.ratePercent" [placeholder]="'fees.v4RatePercent' | translate" />
            </div>
            <div class="col-6 col-md-1">
              <input class="erp-input w-100" type="number" min="0" step="0.01" [(ngModel)]="v4PolicyForm.maxLateAmount" [placeholder]="'fees.v4MaxLate' | translate" />
            </div>
            <div class="col-6 col-md-1 d-flex align-items-center">
              <label class="small d-flex align-items-center gap-1 mb-0"><input type="checkbox" [(ngModel)]="v4PolicyForm.isActive" /> {{ 'fees.v4Active' | translate }}</label>
            </div>
            <div class="col-12 col-md-2 d-flex gap-1 flex-wrap">
              <button type="button" class="btn-primary-erp btn-sm" (click)="saveV4LateFeePolicy()" [disabled]="v2Busy || !feeV2ConfigWrite">{{ 'fees.save' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-sm" *ngIf="v4PolicyEditingId" (click)="cancelEditV4LateFeePolicy()">{{ 'fees.cancel' | translate }}</button>
            </div>
          </div>
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>{{ 'fees.v2Code' | translate }}</th>
                  <th>{{ 'fees.v2Name' | translate }}</th>
                  <th>{{ 'fees.v4GraceDays' | translate }}</th>
                  <th>{{ 'fees.v4CalcMode' | translate }}</th>
                  <th>{{ 'fees.thAmount' | translate }}</th>
                  <th>{{ 'fees.v4MaxLate' | translate }}</th>
                  <th>{{ 'fees.thStatus' | translate }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of v4LatePolicies">
                  <td>{{ p.policyCode }}</td>
                  <td>{{ p.policyName }}</td>
                  <td>{{ p.graceDays }}</td>
                  <td>{{ p.calculationMode }}</td>
                  <td>{{ p.calculationMode === 'FLAT' ? p.flatAmount : p.ratePercent }}</td>
                  <td>{{ p.maxLateAmount }}</td>
                  <td>{{ p.isActive !== false ? ('fees.v4PolicyActive' | translate) : ('fees.v4PolicyInactive' | translate) }}</td>
                  <td class="text-end">
                    <button type="button" class="btn-outline-erp btn-xs me-1" (click)="startEditV4LateFeePolicy(p)">{{ 'fees.edit' | translate }}</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="deleteV4LateFeePolicy(p.id)">{{ 'fees.delete' | translate }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="erp-card">
          <h5 class="fw-bold mb-2">{{ 'fees.v4RunsTitle' | translate }}</h5>
          <p class="text-muted small mb-2">{{ 'fees.v4RunsDesc' | translate }}</p>
          <div class="row g-3 mb-3 align-items-end">
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small">{{ 'fees.v4RunPolicy' | translate }}</label>
              <select class="erp-select w-100" [(ngModel)]="v4RunForm.feeLateFeePolicyId">
                <option [ngValue]="0">{{ 'fees.v4PickPolicy' | translate }}</option>
                <option *ngFor="let pol of v4LatePolicies" [ngValue]="pol.id">{{ pol.policyCode }} — {{ pol.policyName }}</option>
              </select>
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small" for="feeV4RunAsOf">{{ 'fees.v4AsOfDate' | translate }}</label>
              <app-erp-date-picker [(ngModel)]="v4RunForm.asOfDate" inputId="feeV4RunAsOf" placeholderI18nKey="fees.datePlaceholder" />
            </div>
            <div class="col-12 col-md-4 col-lg-3 fees-form-field">
              <label class="erp-label small">{{ 'fees.v2Idempotency' | translate }}</label>
              <input class="erp-input w-100" [(ngModel)]="v4RunForm.idempotencyKey" [placeholder]="'fees.v2Idempotency' | translate" />
            </div>
            <div class="col-12 col-md-auto fees-form-field">
              <label class="erp-label small fees-field-label-spacer" aria-hidden="true">&nbsp;</label>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn-outline-erp btn-sm" (click)="generateV4RunIdempotencyKey()">{{ 'fees.v4GenIdem' | translate }}</button>
                <button type="button" class="btn-primary-erp btn-sm" (click)="submitV4LateFeeRun()" [disabled]="v2Busy || !feeV2BillingWrite">{{ 'fees.v4RunSubmit' | translate }}</button>
              </div>
            </div>
          </div>
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead>
                <tr>
                  <th>{{ 'fees.thRecordId' | translate }}</th>
                  <th>{{ 'fees.v4RunPolicy' | translate }}</th>
                  <th>{{ 'fees.v4AsOfDate' | translate }}</th>
                  <th>{{ 'fees.v4DemandsUpdated' | translate }}</th>
                  <th>{{ 'fees.thStatus' | translate }}</th>
                  <th>{{ 'fees.v2Idempotency' | translate }}</th>
                  <th>{{ 'fees.v3When' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of v4LateRuns">
                  <td>{{ r.id }}</td>
                  <td>{{ r.feeLateFeePolicyId }}</td>
                  <td>{{ r.asOfDate }}</td>
                  <td>{{ r.demandsUpdated }}</td>
                  <td>{{ r.status }}</td>
                  <td class="small text-break">{{ r.idempotencyKey }}</td>
                  <td class="small">{{ r.finishedAt || r.startedAt }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'ledgerV2' && feeV2FinanceRead" class="animate-in">
        <div class="erp-card mb-3">
          <h4 class="mb-2">{{ 'fees.v2LedgerTitle' | translate }}</h4>
          <p class="text-muted small mb-3">{{ 'fees.v2LedgerDesc' | translate }}</p>
          <div class="row g-2" *ngIf="feeV2BillingWrite">
            <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="v2PaymentForm.studentId" [placeholder]="'fees.thStudent' | translate" /></div>
            <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="v2PaymentForm.amount" [placeholder]="'fees.thAmount' | translate" /></div>
            <div class="col-md-2">
              <select class="erp-select" [(ngModel)]="v2PaymentForm.channelType"><option value="OFFLINE">OFFLINE</option><option value="ONLINE">ONLINE</option></select>
            </div>
            <div class="col-md-2">
              <select class="erp-select" [(ngModel)]="v2PaymentForm.paymentMode"><option value="CASH">CASH</option><option value="UPI">UPI</option><option value="CHEQUE">CHEQUE</option><option value="CARD">CARD</option><option value="NETBANKING">NETBANKING</option></select>
            </div>
            <div class="col-md-2"><input class="erp-input" [(ngModel)]="v2PaymentForm.idempotencyKey" [placeholder]="'fees.v2Idempotency' | translate" /></div>
            <div class="col-md-2 d-flex gap-2">
              <button type="button" class="btn-primary-erp btn-sm flex-fill" (click)="recordV2Payment()">{{ 'fees.collectConfirm' | translate }}</button>
            </div>
          </div>
          <ng-container *ngIf="v2PaymentResult as pay">
            <p class="small text-success mt-2" *ngIf="pay.receiptNo">{{ 'fees.v3LastReceipt' | translate }}: <strong>{{ pay.receiptNo }}</strong> ({{ pay.paymentNo }})</p>
          </ng-container>
          <div class="row g-2 mt-2">
            <div class="col-md-3"><input class="erp-input" type="number" [(ngModel)]="v2LedgerStudentId" [placeholder]="'fees.v2LedgerStudentId' | translate" /></div>
            <div class="col-md-2"><button type="button" class="btn-outline-erp btn-sm w-100" (click)="loadV2Ledger()">{{ 'fees.refresh' | translate }}</button></div>
          </div>
          <div class="fees-v2-subcard mt-3" *ngIf="feeV2RefundRequest">
            <h5 class="small fw-bold mb-2">{{ 'fees.v3RefundTitle' | translate }}</h5>
            <p class="text-muted small mb-2">{{ 'fees.v3RefundDesc' | translate }}</p>
            <div class="row g-2">
              <div class="col-12 col-md-2"><input class="erp-input w-100" type="number" [(ngModel)]="v3RefundForm.studentId" [placeholder]="'fees.v2StudentIdPh' | translate" /></div>
              <div class="col-12 col-md-2"><input class="erp-input w-100" type="number" [(ngModel)]="v3RefundForm.amount" [placeholder]="'fees.thAmount' | translate" /></div>
              <div class="col-12 col-md-3"><input class="erp-input w-100" [(ngModel)]="v3RefundForm.idempotencyKey" [placeholder]="'fees.v2Idempotency' | translate" /></div>
              <div class="col-12 col-md-2"><input class="erp-input w-100" type="number" [(ngModel)]="v3RefundRelatedPaymentId" [placeholder]="'fees.v3RelatedPaymentId' | translate" /></div>
              <div class="col-12 col-md-3"><input class="erp-input w-100" [(ngModel)]="v3RefundForm.reason" [placeholder]="'fees.v2Reason' | translate" /></div>
              <div class="col-12 col-md-3 d-flex align-items-center"><label class="small mb-0"><input type="checkbox" [(ngModel)]="v3RefundSubmitForApproval" /> {{ 'fees.v3RefundSubmitApproval' | translate }}</label></div>
              <div class="col-12 col-md-2 d-flex align-items-end"><button type="button" class="btn-outline-erp btn-sm w-100" [disabled]="v2Busy" (click)="recordV3Refund()">{{ 'fees.v3PostRefund' | translate }}</button></div>
            </div>
          </div>
          <div class="fees-v2-subcard mt-3" *ngIf="feeV2RefundApprove">
            <h5 class="small fw-bold mb-2">{{ 'fees.v3RefundApproveTitle' | translate }}</h5>
            <div class="row g-2 align-items-end">
              <div class="col-12 col-md-3"><input class="erp-input w-100" type="number" [(ngModel)]="v3RefundApproveId" [placeholder]="'fees.v3RefundIdPh' | translate" /></div>
              <div class="col-12 col-md-3"><button type="button" class="btn-primary-erp btn-sm w-100" [disabled]="v2Busy" (click)="approveV3PendingRefund()">{{ 'fees.v3RefundApprove' | translate }}</button></div>
            </div>
          </div>
        </div>
        <div class="erp-card">
          <div class="fees-table-wrap">
            <table class="erp-table">
              <thead><tr><th>{{ 'fees.thRecordId' | translate }}</th><th>{{ 'fees.v2Type' | translate }}</th><th>{{ 'fees.v2Source' | translate }}</th><th>{{ 'fees.thAmount' | translate }}</th><th>{{ 'fees.v2RunningBalance' | translate }}</th><th>{{ 'fees.thStatus' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let l of v2LedgerRows">
                  <td>{{ l.id }}</td><td>{{ l.entryType }}</td><td>{{ l.sourceType }}</td><td>{{ l.amount }}</td><td>{{ l.runningBalance }}</td><td>{{ l.sourceRefCode }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="structureModal" (click)="structureModal = false">
      <div class="modal-content-erp modal-lg" style="max-width: 640px;" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ (editingStructureId ? 'fees.modalEditTitle' : 'fees.modalNewTitle') | translate }}</h3>
          <button type="button" class="btn-icon" (click)="structureModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'fees.labelStructureName' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="structureForm.name" erpI18nPh="fees.structureNamePh" />

          <div class="row g-2">
            <div class="col-md-6">
              <label class="erp-label">{{ 'fees.labelClass' | translate }}</label>
              <select class="erp-select mb-2" [(ngModel)]="structureForm.classId" (ngModelChange)="syncClassName()">
                <option [ngValue]="null">{{ 'fees.selectClass' | translate }}</option>
                <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name | schoolClassName }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="erp-label">{{ 'fees.labelAcademicYear' | translate }}</label>
              <select class="erp-select mb-2" [(ngModel)]="structureForm.academicYearId">
                <option [ngValue]="null">{{ 'fees.selectYear' | translate }}</option>
                <option *ngFor="let y of academicYears" [ngValue]="y.id">{{ y.name }}</option>
              </select>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="erp-label mb-0">{{ 'fees.components' | translate }}</label>
            <button type="button" class="btn-outline-erp btn-xs" (click)="addComponentRow()"><i class="bi bi-plus"></i> {{ 'fees.addLine' | translate }}</button>
          </div>
          <div *ngFor="let row of structureForm.components; let i = index" class="row g-2 align-items-end mb-2">
            <div class="col-md-4">
              <input class="erp-input" [(ngModel)]="row.name" erpI18nPh="fees.labelPlaceholder" />
            </div>
            <div class="col-md-3">
              <select class="erp-select" [(ngModel)]="row.type">
                <option *ngFor="let t of componentTypeIds" [value]="t">{{ ('fees.componentType.' + t) | translate }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <input class="erp-input" type="number" min="0" step="1" [(ngModel)]="row.amount" placeholder="₹" />
            </div>
            <div class="col-md-2">
              <button type="button" class="btn-icon" [disabled]="structureForm.components.length < 2" (click)="removeComponentRow(i)" [title]="'fees.removeLineTitle' | translate"><i class="bi bi-trash text-danger"></i></button>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2 p-2 rounded-2" style="background: var(--clr-surface-muted); border: 1px solid var(--clr-border);">
            <strong>{{ 'fees.total' | translate }}</strong>
            <strong style="color: var(--clr-primary); font-size: 18px;">₹{{ draftTotal | number:'1.0-0':'en-IN' }}</strong>
          </div>
          <p *ngIf="structureError" class="text-danger small mt-2 mb-0">{{ structureError }}</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="structureModal = false">{{ 'fees.cancel' | translate }}</button>
          <button type="button" class="btn-primary-erp" [disabled]="savingStructure" (click)="saveStructure()">{{ savingStructure ? ('fees.saving' | translate) : ('fees.save' | translate) }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="bulkAssignModal" (click)="closeBulkAssignModal()">
      <div class="modal-content-erp modal-lg" style="max-width: 600px;" (click)="$event.stopPropagation()" data-testid="bulk-assign-modal">
        <div class="modal-header-erp">
          <h3>{{ 'fees.bulkModalTitle' | translate }}</h3>
          <button type="button" class="btn-icon" (click)="closeBulkAssignModal()" [attr.aria-label]="'fees.closeAria' | translate"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp" *ngIf="bulkTargetStructure as bfs">
          <div class="p-3 rounded-2 mb-3" style="background: var(--clr-surface-muted); border: 1px solid var(--clr-border);">
            <div class="small text-muted mb-1">{{ 'fees.bulkPlanLabel' | translate }}</div>
            <div style="font-weight: 700;">{{ bfs.name }}</div>
            <div class="small text-muted mt-1">
              {{ bfs.className | schoolClassName }} {{ 'fees.bulkPerStudent' | translate: { amount: (bfs.totalAmount | number:'1.0-0':'en-IN') } }}
            </div>
          </div>

          <div class="mb-4">
            <div class="erp-label mb-2">{{ 'fees.bulkWhatTitle' | translate }}</div>
            <ol class="small text-muted mb-0 ps-3" style="line-height: 1.55;">
              <li class="mb-1">{{ 'fees.bulkStep1' | translate }}</li>
              <li class="mb-1">{{ 'fees.bulkStep2' | translate }}</li>
              <li class="mb-1">{{ 'fees.bulkStep3' | translate }}</li>
              <li class="mb-1">{{ 'fees.bulkStep4' | translate }}</li>
              <li>{{ 'fees.bulkStep5' | translate }}</li>
            </ol>
          </div>

          <label class="erp-label" for="bulk-section-select">{{ 'fees.bulkWhichStudents' | translate }}</label>
          <select id="bulk-section-select" class="erp-select mb-1" [(ngModel)]="bulkSectionId">
            <option [ngValue]="null">{{ 'fees.bulkEveryone' | translate: { className: (bfs.className | schoolClassName) } }}</option>
            <option *ngFor="let sec of bulkSections" [ngValue]="sec.id">{{ 'fees.bulkOnlySection' | translate: { name: sec.name } }}</option>
          </select>
          <p class="text-muted small mb-3">{{ 'fees.bulkSectionHelp' | translate }}</p>

          <label class="erp-label" for="bulk-due-date">{{ 'fees.bulkDueLabel' | translate }}</label>
          <div class="mb-1">
            <app-erp-date-picker [(ngModel)]="bulkDueDate" inputId="bulk-due-date" placeholderI18nKey="fees.datePlaceholder" />
          </div>
          <p class="text-muted small mb-3">{{ 'fees.bulkDueHelp' | translate }}</p>

          <label class="d-flex align-items-start gap-2 mb-3" style="cursor: pointer;">
            <input type="checkbox" class="mt-1" [(ngModel)]="bulkSkipDuplicates" />
            <span class="small">{{ 'fees.bulkSkipLabel' | translate }}</span>
          </label>

          <div *ngIf="bulkAssignError" class="text-danger small mb-2">{{ bulkAssignError }}</div>
          <div *ngIf="bulkAssignResult as r" class="p-3 rounded-2 small mb-0" style="background: color-mix(in srgb, var(--clr-success) 8%, var(--clr-surface-muted)); border: 1px solid var(--clr-border);">
            <div class="fw-semibold mb-2">{{ 'fees.bulkDone' | translate }}</div>
            <div *ngIf="r.createdCount === 1">{{ 'fees.bulkCreatedOne' | translate: { n: r.createdCount } }}</div>
            <div *ngIf="r.createdCount !== 1">{{ 'fees.bulkCreatedMany' | translate: { n: r.createdCount } }}</div>
            <div *ngIf="r.skippedCount > 0" class="mt-1">
              <span *ngIf="r.skippedCount === 1">{{ 'fees.bulkSkippedOne' | translate: { n: r.skippedCount } }}</span>
              <span *ngIf="r.skippedCount !== 1">{{ 'fees.bulkSkippedMany' | translate: { n: r.skippedCount } }}</span>
            </div>
            <div *ngIf="r.skipped.length" class="mt-2 pt-2 text-muted" style="border-top: 1px solid var(--clr-border); max-height: 140px; overflow-y: auto;">
              <div class="small fw-semibold text-body mb-1">{{ 'fees.bulkDetailsSample' | translate }}</div>
              <div *ngFor="let s of r.skipped" class="mb-1">
                {{ 'fees.bulkStudentHash' | translate: { id: s.studentId, reason: friendlyBulkSkipLabel(s) } }}
              </div>
            </div>
            <p class="text-muted mb-0 mt-2 small">{{ 'fees.bulkOpenPayments' | translate }}</p>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="closeBulkAssignModal()">{{ bulkAssignResult ? ('fees.bulkClose' | translate) : ('fees.cancel' | translate) }}</button>
          <button type="button" class="btn-primary-erp" [disabled]="bulkAssignSaving || !bulkDueDate" (click)="submitBulkAssign()">
            {{ bulkAssignSaving ? ('fees.bulkAdding' | translate) : ('fees.bulkAddBtn' | translate) }}
          </button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="studentLedgerModal" (click)="closeStudentLedgerModal()">
      <div class="modal-content-erp modal-lg fees-ledger-modal" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ 'fees.ledgerTitle' | translate: { name: ledgerStudentName } }}</h3>
          <button type="button" class="btn-icon" (click)="closeStudentLedgerModal()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp fees-ledger-modal-body">
          <div *ngIf="ledgerLoading" class="small text-muted">{{ 'fees.loadingLedger' | translate }}</div>
          <div *ngIf="!ledgerLoading" class="fees-ledger-split">
            <div class="fees-ledger-block">
              <h5>{{ 'fees.ledgerSummaryTitle' | translate }}</h5>
              <div *ngIf="ledgerRows.length" class="fees-ledger-table-wrap">
                <table class="erp-table">
                  <thead>
                    <tr>
                      <th>{{ 'fees.thAmount' | translate }}</th>
                      <th>{{ 'fees.thPaid' | translate }}</th>
                      <th>{{ 'fees.thDue' | translate }}</th>
                      <th>{{ 'fees.thDueDate' | translate }}</th>
                      <th>{{ 'fees.thStatus' | translate }}</th>
                      <th>{{ 'fees.thReceipt' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of ledgerRows" (click)="selectLedgerRow(row)" [class.table-active]="ledgerSelectedPaymentId === row.id" style="cursor: pointer;">
                      <td>₹{{ row.amount | number:'1.0-0':'en-IN' }}</td>
                      <td>₹{{ row.paidAmount | number:'1.0-0':'en-IN' }}</td>
                      <td>₹{{ row.dueAmount | number:'1.0-0':'en-IN' }}</td>
                      <td>{{ formatDate(row.dueDate) }}</td>
                      <td>{{ feeStatusLabel(row.status) }}</td>
                      <td>{{ row.receiptNumber || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div *ngIf="!ledgerRows.length" class="fees-empty-state">
                <i class="bi bi-receipt-cutoff"></i>{{ 'fees.emptyLedger' | translate }}
              </div>
            </div>

            <div class="fees-ledger-block">
              <h5>{{ 'fees.txTimelineTitle' | translate }}</h5>
              <div class="fees-tx-filter" *ngIf="ledgerTransactions.length">
                <button type="button" class="btn-outline-erp btn-xs" [class.active]="txFilter === 'all'" (click)="setTxFilter('all')">{{ 'fees.txFilterAll' | translate }}</button>
                <button type="button" class="btn-outline-erp btn-xs" [class.active]="txFilter === 'payment'" (click)="setTxFilter('payment')">{{ 'fees.txFilterPayments' | translate }}</button>
                <button type="button" class="btn-outline-erp btn-xs" [class.active]="txFilter === 'refund'" (click)="setTxFilter('refund')">{{ 'fees.txFilterRefunds' | translate }}</button>
              </div>
              <div class="fees-tx-timeline" *ngIf="filteredLedgerTransactions.length; else emptyTimeline">
                <div class="fees-tx-item" *ngFor="let tx of filteredLedgerTransactions">
                  <div class="fees-tx-item__head">
                    <span class="fees-tx-item__title"><i class="bi" [ngClass]="txIconClass(tx)"></i><span>{{ txLabel(tx) }}</span></span>
                    <span>₹{{ tx.amount | number:'1.0-0':'en-IN' }}</span>
                  </div>
                  <div class="fees-tx-item__meta">
                    <div *ngIf="tx.eventStatus">{{ 'fees.txState' | translate }}: {{ tx.eventStatus }}</div>
                    <div *ngIf="tx.referenceId">{{ 'fees.txRef' | translate }}: {{ tx.referenceId }}</div>
                    <div *ngIf="tx.providerPaymentId">{{ 'fees.txProviderRef' | translate }}: {{ tx.providerPaymentId }}</div>
                    <div *ngIf="tx.occurredAt">{{ formatDate(tx.occurredAt) }}</div>
                    <div *ngIf="tx.note">{{ tx.note }}</div>
                  </div>
                  <div class="d-flex gap-2 mt-2" *ngIf="feeDeskOps">
                    <button
                      *ngIf="tx.eventType === 'REFUND_REQUESTED'"
                      type="button"
                      class="btn-outline-erp btn-xs"
                      (click)="approveRefund(tx)"
                    >{{ 'fees.refundApprove' | translate }}</button>
                    <button
                      *ngIf="tx.eventType === 'REFUND_APPROVED'"
                      type="button"
                      class="btn-outline-erp btn-xs"
                      (click)="executeRefund(tx)"
                    >{{ 'fees.refundExecute' | translate }}</button>
                  </div>
                </div>
              </div>
              <ng-template #emptyTimeline>
                <div class="fees-empty-state">
                  <i class="bi bi-clock-history"></i>{{ 'fees.txTimelineEmpty' | translate }}
                </div>
              </ng-template>

              <div class="fees-refund-panel" *ngIf="feeDeskOps && refundTargetPayment">
                <div *ngIf="refundNotice" class="fees-refund-toast" [class.fees-refund-toast--ok]="refundNoticeOk" [class.fees-refund-toast--err]="!refundNoticeOk">
                  {{ refundNotice }}
                </div>
                <label class="erp-label">{{ 'fees.refundAmountLabel' | translate }}</label>
                <input class="erp-input mb-2" type="number" min="1" step="1" [(ngModel)]="refundAmount" />
                <label class="erp-label">{{ 'fees.refundReasonLabel' | translate }}</label>
                <textarea class="erp-input erp-textarea mb-2" rows="2" [(ngModel)]="refundReason"></textarea>
                <p *ngIf="refundError" class="small text-danger mb-2">{{ refundError }}</p>
                <button type="button" class="btn-outline-erp btn-sm" [disabled]="refundSaving" (click)="requestRefund()">
                  {{ refundSaving ? ('fees.refundSaving' | translate) : ('fees.refundRequest' | translate) }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button *ngIf="ledgerRows.length" type="button" class="btn-outline-erp" (click)="exportStudentLedgerCsv()">{{ 'fees.exportLedger' | translate }}</button>
          <button type="button" class="btn-outline-erp" (click)="closeStudentLedgerModal()">{{ 'fees.close' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="collectPaymentModal" (click)="closeCollectPaymentModal()">
      <div class="modal-content-erp" style="max-width: 520px;" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ 'fees.collectTitle' | translate }}</h3>
          <button type="button" class="btn-icon" (click)="closeCollectPaymentModal()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp" *ngIf="collectTargetPayment as cp">
          <p class="small text-muted mb-2">{{ cp.studentName }}</p>
          <div class="small mb-3">
            <span class="text-muted">{{ 'fees.collectDueNow' | translate }}</span>
            <strong class="ms-1">₹{{ cp.dueAmount | number:'1.0-0':'en-IN' }}</strong>
          </div>
          <label class="erp-label">{{ 'fees.collectAmountLabel' | translate }}</label>
          <input class="erp-input mb-2" type="number" min="1" step="1" [(ngModel)]="collectAmount" />
          <label class="erp-label">{{ 'fees.collectMethodLabel' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="collectMethod">
            <option value="CASH">{{ 'fees.methodCash' | translate }}</option>
            <option value="UPI">{{ 'fees.methodUpi' | translate }}</option>
            <option value="ONLINE">{{ 'fees.methodOnline' | translate }}</option>
            <option value="CHEQUE">{{ 'fees.methodCheque' | translate }}</option>
          </select>
          <p *ngIf="collectError" class="text-danger small mb-0">{{ collectError }}</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="closeCollectPaymentModal()">{{ 'fees.cancel' | translate }}</button>
          <button type="button" class="btn-primary-erp" [disabled]="collectSaving" (click)="submitCollectPayment()">
            {{ collectSaving ? ('fees.collectSaving' | translate) : ('fees.collectConfirm' | translate) }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class FeesComponent implements OnInit {
  tab:
    | 'structures'
    | 'payments'
    | 'componentsV2'
    | 'structuresV2'
    | 'assignmentsV2'
    | 'rulesV2'
    | 'demandRunsV2'
    | 'demandsV2'
    | 'discountsV2'
    | 'phase3Reports'
    | 'phase3Payments'
    | 'phase3Audit'
    | 'phase3Recon'
    | 'phase4LateFees'
    | 'ledgerV2' = 'componentsV2';
  feeStructures: FeeStructure[] = [];
  paymentsPage: FeePayment[] = [];
  displayPaymentsPage: FeePayment[] = [];
  paymentsTotal = 0;
  paymentPageIndex = 0;
  paymentPageSize = DEFAULT_ERP_PAGE_SIZE;
  paymentSearch = '';
  paymentsLoading = false;
  private paymentSearchTimer: ReturnType<typeof setTimeout> | null = null;
  statusFilter = '';
  sortBy: 'dueDateAsc' | 'dueDateDesc' | 'dueAmountDesc' | 'studentAsc' = 'dueDateAsc';
  classFilterId: number | null = null;
  sectionFilterId: number | null = null;
  classes: SchoolClass[] = [];
  academicYears: AcademicYear[] = [];
  /** Fee collection, refunds, structures, reminders — mirrors fees read/write atoms + tenant/platform operators. */
  feeDeskOps = false;
  /** Razorpay settlement / finance profile banner — mirrors finance settings read/write envelope. */
  canManageFeeFinanceRouting = false;
  /** Phase-1 canonical fees-v2 desk tabs. */
  canAccessFeesV2Tabs = false;
  /** Granular lanes — mirror backend {@code RbacSpel} (JWT may carry coarse {@code SCHOOL_FEES_*} only). */
  feeV2FinanceRead = false;
  feeV2ConfigWrite = false;
  feeV2BillingWrite = false;
  feeV2RefundRequest = false;
  feeV2RefundApprove = false;
  feeV2OnlineCheckout = false;
  /** Clean rollout: use v2 tabs only in this phase. */
  showLegacyFeesTabs = false;
  v2Busy = false;
  v2Message = '';
  v2MessageOk = true;
  v2Components: FeeV2Component[] = [];
  v2ComponentEditingId: number | null = null;
  v2ComponentForm: FeeV2CreateComponentRequest = {
    code: '',
    name: '',
    componentType: 'RECURRING',
    frequency: 'MONTHLY',
    optionalComponent: false,
    refundable: false,
  };
  v2Rules: FeeV2Rule[] = [];
  v2RuleEditingId: number | null = null;
  v2RuleForm: FeeV2CreateRuleRequest = {
    ruleCode: '',
    ruleName: '',
    ruleType: 'ASSIGNMENT',
    priorityNo: 100,
    stopOnMatch: false,
  };
  v2DemandRuns: FeeV2DemandRun[] = [];
  v2DemandRunForm: FeeV2CreateDemandRunRequest = {
    runType: 'MONTHLY',
    periodKey: '',
    triggerSource: 'UI_ADMIN',
    idempotencyKey: '',
  };
  v2LedgerStudentId: number | null = null;
  v2LedgerRows: FeeV2LedgerEntry[] = [];
  v2PaymentForm: FeeV2RecordPaymentRequest = {
    studentId: 0,
    amount: 0,
    channelType: 'OFFLINE',
    paymentMode: 'CASH',
    idempotencyKey: '',
  };
  v2PaymentResult: FeeV2RecordPaymentResponse | null = null;
  v2Structures: FeeV2Structure[] = [];
  /** Cached students for display names and pickers (fee v2). */
  v2StudentsById = new Map<number, Student>();
  v2StudentDirectoryLoaded = false;
  v2SnapshotStudentsInClass: Student[] = [];
  v2StructureSaving = false;
  v2StructureForm: {
    classId: number | null;
    structureName: string;
    versionNo: number;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    lines: { feeComponentMasterId: number; amount: number }[];
  } = {
    classId: null,
    structureName: '',
    versionNo: 1,
    status: 'DRAFT',
    lines: [{ feeComponentMasterId: 0, amount: 0 }],
  };
  v2MapsFilterStudentId: number | null = null;
  v2FeeMaps: FeeV2StudentFeeMap[] = [];
  v2SnapshotForm = {
    studentId: 0,
    classId: null as number | null,
    feeStructureId: 0,
    frozenVersionNo: 1,
    assignmentSource: 'MANUAL_UI',
    validFrom: '',
    validTo: '',
  };
  v2DemandsClassId: number | null = null;
  v2DemandsStudentsInClass: Student[] = [];
  v2DemandsStudentId: number | null = null;
  v2Demands: FeeV2Demand[] = [];
  v2DiscountClassId: number | null = null;
  v2DiscountStudentsInClass: Student[] = [];
  v2DiscountStudentId: number | null = null;
  v2Discounts: FeeV2Discount[] = [];
  v2DiscountEditingId: number | null = null;
  v2DiscountForm: FeeV2CreateDiscountRequest = {
    studentId: 0,
    discountType: 'FLAT',
    discountValue: 0,
    componentScope: 'ALL',
    applicableComponentIdsJson: '',
    validFrom: '',
    validTo: '',
    reason: '',
  };
  v2RuleLogicRuleId: number | null = null;
  v2RuleLogicLoading = false;
  v2RuleConditionDrafts: FeeV2RuleConditionLine[] = [];
  v2RuleActionDrafts: FeeV2RuleActionLine[] = [];
  v3CollectionSummary: FeeV2CollectionSummary | null = null;
  v3Defaulters: FeeV2DefaulterRow[] = [];
  v3ClassOutstanding: FeeV2ClassOutstanding[] = [];
  v3ReportFrom = '';
  v3ReportTo = '';
  v3StatementClassId: number | null = null;
  v3StatementStudentsInClass: Student[] = [];
  v3StatementStudentId: number | null = null;
  v3Statement: FeeV2StudentStatement | null = null;
  v3PayRegClassId: number | null = null;
  v3PayRegStudentsInClass: Student[] = [];
  v3PayRegStudentId: number | null = null;
  v3PayRegFrom = '';
  v3PayRegTo = '';
  v3PaymentRegister: FeeV2PaymentRegisterRow[] = [];
  v3AuditRows: FeeV2AuditEvent[] = [];
  v2AssignPreviewClassId: number | null = null;
  v2AssignPreviewSectionId: number | null = null;
  v2AssignPreviewStudentIdsCsv = '';
  v2AssignPreviewResult: FeeAssignmentPreviewResponse | null = null;
  v2AssignExecValidFrom = '';
  v2AssignExecValidTo = '';
  v2AssignExecIdem = '';
  v2AssignExecForce = false;
  v3LedgerRecon: FeeV2LedgerReconciliationReport | null = null;
  v2AdminRzpClassId: number | null = null;
  v2AdminRzpStudentsInClass: Student[] = [];
  v2AdminRzpStudentId: number | null = null;
  v2AdminRzpAmount: number | null = null;
  v3RefundForm: FeeV2RecordRefundRequest = {
    studentId: 0,
    amount: 0,
    idempotencyKey: '',
    reason: '',
  };
  v3RefundRelatedPaymentId: number | null = null;
  v3RefundSubmitForApproval = false;
  v3RefundApproveId: number | null = null;
  v4LatePolicies: FeeV2LateFeePolicy[] = [];
  v4LateRuns: FeeV2LateFeeRun[] = [];
  v4PolicyEditingId: number | null = null;
  v4PolicyForm: {
    policyCode: string;
    policyName: string;
    graceDays: number;
    calculationMode: 'FLAT' | 'PERCENT_OF_PRINCIPAL';
    flatAmount: number | null;
    ratePercent: number | null;
    maxLateAmount: number | null;
    isActive: boolean;
  } = {
    policyCode: '',
    policyName: '',
    graceDays: 0,
    calculationMode: 'FLAT',
    flatAmount: null,
    ratePercent: null,
    maxLateAmount: null,
    isActive: true,
  };
  v4RunForm: { feeLateFeePolicyId: number; asOfDate: string; idempotencyKey: string } = {
    feeLateFeePolicyId: 0,
    asOfDate: '',
    idempotencyKey: '',
  };
  refreshing = false;
  structureModal = false;
  editingStructureId: number | null = null;
  structureError = '';
  savingStructure = false;
  /** Initialized in constructor so `TranslateService` exists before `emptyStructureForm()` runs. */
  structureForm!: {
    name: string;
    classId: number | null;
    className: string;
    academicYearId: number | null;
    components: { name: string; amount: number; type: string }[];
  };

  bulkAssignModal = false;
  bulkTargetStructure: FeeStructure | null = null;
  bulkSections: Section[] = [];
  bulkSectionId: number | null = null;
  bulkDueDate = '';
  bulkSkipDuplicates = true;
  bulkAssignSaving = false;
  bulkAssignError = '';
  bulkAssignResult: BulkAssignFeesResponse | null = null;
  collectionSummary: FeeCollectionSummary | null = null;
  studentLedgerModal = false;
  ledgerLoading = false;
  ledgerRows: FeePayment[] = [];
  ledgerStudentName = '';
  ledgerSelectedPaymentId: number | null = null;
  ledgerTransactions: FeeTransaction[] = [];
  txFilter: 'all' | 'payment' | 'refund' = 'all';
  refundTargetPayment: FeePayment | null = null;
  refundAmount = 0;
  refundReason = '';
  refundSaving = false;
  refundError = '';
  refundNotice = '';
  refundNoticeOk = true;
  collectPaymentModal = false;
  collectTargetPayment: FeePayment | null = null;
  collectAmount = 0;
  collectMethod = 'CASH';
  collectSaving = false;
  collectError = '';
  operationMessage = '';
  operationMessageOk = true;
  reminderMessage = '';
  reminderMessageOk = true;
  private reminderMessageTimer: ReturnType<typeof setTimeout> | null = null;
  /** After load: OFFLINE means counter collection; parent portal hides gateway checkout. */
  feeSettlementMode: string | null = null;

  componentTypeIds = ['tuition', 'transport', 'hostel', 'uniform', 'library', 'lab', 'sports', 'misc'] as const;

  private readonly destroyRef = inject(DestroyRef);

  formatDate(raw: string | null | undefined): string {
    return formatDateDdMmYyyy(raw);
  }
  private readonly uiAccess = inject(UiAccessService);

  constructor(
    private feeService: FeeService,
    private academicService: AcademicService,
    private studentService: StudentService,
    private auth: AuthService,
    private router: Router,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    private importExport: ImportExportService
  ) {
    this.structureForm = this.emptyStructureForm();
    this.destroyRef.onDestroy(() => {
      if (this.paymentSearchTimer) {
        clearTimeout(this.paymentSearchTimer);
      }
      if (this.reminderMessageTimer) {
        clearTimeout(this.reminderMessageTimer);
      }
    });
  }

  get draftTotal(): number {
    return this.structureForm.components.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  }

  get collectedAmount(): number {
    return this.paymentsPage.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  }

  get pendingAmount(): number {
    return this.paymentsPage.reduce((sum, p) => sum + (Number(p.dueAmount) || 0), 0);
  }

  get overdueCount(): number {
    return this.paymentsPage.filter(p => p.status === 'overdue').length;
  }

  get collectionRatePct(): number {
    const billed = this.paymentsPage.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    if (billed <= 0) {
      return 0;
    }
    return (this.collectedAmount / billed) * 100;
  }

  get effectiveCollected(): number {
    return this.collectionSummary?.totalCollected ?? this.collectedAmount;
  }

  get effectivePending(): number {
    return this.collectionSummary?.totalPending ?? this.pendingAmount;
  }

  get effectiveOverdueCount(): number {
    return this.collectionSummary?.overdueCount ?? this.overdueCount;
  }

  get effectiveCollectionRatePct(): number {
    if (this.collectionSummary) {
      return (this.collectionSummary.collectionRate || 0) * 100;
    }
    return this.collectionRatePct;
  }

  get feeFinanceBannerVisible(): boolean {
    return (this.feeSettlementMode || '').toUpperCase() === 'OFFLINE_SCHOOL_COLLECTION';
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    this.feeDeskOps = this.uiAccess.hasSchoolFeeOfficeDesk();
    this.canManageFeeFinanceRouting = this.uiAccess.hasSchoolSettingsFinanceAccess();
    this.canAccessFeesV2Tabs = this.uiAccess.hasSchoolFeeOfficeDesk();
    this.feeV2FinanceRead = this.uiAccess.hasFeeFinanceRead();
    this.feeV2ConfigWrite = this.uiAccess.hasFeeConfigWrite();
    this.feeV2BillingWrite = this.uiAccess.hasFeeBillingWrite();
    this.feeV2RefundRequest = this.uiAccess.hasFeeRefundRequest();
    this.feeV2RefundApprove = this.uiAccess.hasFeeRefundApprove();
    this.feeV2OnlineCheckout = this.uiAccess.hasFeeOnlineCheckout();
    if (this.canAccessFeesV2Tabs && this.feeV2FinanceRead && !this.feeV2ConfigWrite) {
      this.tab = 'phase3Reports';
      this.loadPhase3Reports();
    }
    this.academicService.getClasses().subscribe(c => (this.classes = c || []));
    this.academicService.getAcademicYears().subscribe(y => (this.academicYears = y || []));
    if (this.showLegacyFeesTabs) {
      this.loadStructures();
      this.loadPaymentsPage();
      this.loadCollectionSummary();
    }
    this.loadV2HomeData();
    this.refreshFeeFinanceBanner();
    if (this.canAccessFeesV2Tabs) {
      this.loadV2StudentDirectory();
    }
  }

  /** Deep link to Settings → Finance & payments → Fee settlement (Razorpay Route). */
  goToFeeSettlementSettings(): void {
    void this.router.navigate(['/app/settings'], {
      queryParams: { settingsTab: 'finance', financeHub: 'settlement' },
    });
  }

  /** Loads tenant finance flag for admin banner (parent online checkout). */
  private refreshFeeFinanceBanner(): void {
    if (!this.canManageFeeFinanceRouting) {
      this.feeSettlementMode = null;
      return;
    }
    this.settingsService.getFinanceProfile().subscribe({
      next: p => {
        this.feeSettlementMode = (p.feeSettlementMode || '').trim();
        this.cdr.markForCheck();
      },
      error: () => {
        this.feeSettlementMode = null;
        this.cdr.markForCheck();
      },
    });
  }

  refreshAll(): void {
    this.refreshing = true;
    this.academicService.getClasses().subscribe(c => (this.classes = c || []));
    this.academicService.getAcademicYears().subscribe(y => (this.academicYears = y || []));
    this.refreshFeeFinanceBanner();
    this.feeService.getFeeStructures().subscribe({
      next: fs => {
        this.feeStructures = fs;
        this.loadPaymentsPage();
        this.loadCollectionSummary();
        this.refreshing = false;
      },
      error: () => {
        this.refreshing = false;
      }
    });
  }

  private loadV2HomeData(): void {
    if (!this.canAccessFeesV2Tabs) {
      return;
    }
    if (this.feeV2ConfigWrite) {
      this.loadV2Components();
      this.loadV2Rules();
      this.loadV2Structures();
    }
    if (this.feeV2FinanceRead) {
      this.loadV2DemandRuns();
    }
  }

  onSelectV2Tab(
    next: 'structuresV2' | 'assignmentsV2' | 'demandsV2' | 'discountsV2'
  ): void {
    this.tab = next;
    if (next === 'assignmentsV2') {
      this.loadV2FeeMaps();
      this.loadV2Structures();
    }
  }

  loadV2Structures(): void {
    if (!this.canAccessFeesV2Tabs) {
      return;
    }
    this.feeService.getV2Structures().subscribe({
      next: rows => (this.v2Structures = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  addV2StructureLine(): void {
    this.v2StructureForm.lines.push({ feeComponentMasterId: 0, amount: 0 });
  }

  removeV2StructureLine(index: number): void {
    if (this.v2StructureForm.lines.length > 1) {
      this.v2StructureForm.lines.splice(index, 1);
    }
  }

  resetV2StructureForm(): void {
    this.v2StructureForm = {
      classId: null,
      structureName: '',
      versionNo: 1,
      status: 'DRAFT',
      lines: [{ feeComponentMasterId: 0, amount: 0 }],
    };
  }

  saveV2Structure(): void {
    if (this.v2StructureForm.classId == null || !this.v2StructureForm.structureName.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    const lines = this.v2StructureForm.lines.filter(l => l.feeComponentMasterId > 0 && Number(l.amount) > 0);
    if (!lines.length) {
      this.setV2Message(this.translate.instant('fees.v2StructureLinesInvalid'), false);
      return;
    }
    this.v2StructureSaving = true;
    this.feeService
      .createV2Structure({
        classId: Number(this.v2StructureForm.classId),
        structureName: this.v2StructureForm.structureName.trim(),
        versionNo: Number(this.v2StructureForm.versionNo || 1),
        status: this.v2StructureForm.status,
        components: lines.map(l => ({
          feeComponentMasterId: l.feeComponentMasterId,
          amount: Number(l.amount),
        })),
      })
      .subscribe({
        next: () => {
          this.v2StructureSaving = false;
          this.resetV2StructureForm();
          this.loadV2Structures();
          this.setV2Message(this.translate.instant('fees.v2Saved'), true);
        },
        error: (e: Error) => {
          this.v2StructureSaving = false;
          this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
        },
      });
  }

  loadV2FeeMaps(): void {
    this.feeService.getV2StudentFeeMaps(this.v2MapsFilterStudentId ?? undefined).subscribe({
      next: rows => (this.v2FeeMaps = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  private loadV2StudentDirectory(): void {
    if (this.v2StudentDirectoryLoaded) return;
    this.studentService.getStudents().subscribe({
      next: students => {
        this.v2StudentsById.clear();
        for (const s of students || []) {
          this.v2StudentsById.set(s.id, s);
        }
        this.v2StudentDirectoryLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private replenishClassRoster(classId: number | null, sink: (rows: Student[]) => void): void {
    if (classId == null || classId <= 0) {
      sink([]);
      this.cdr.markForCheck();
      return;
    }
    this.studentService.getStudentsByClass(classId).subscribe({
      next: students => {
        sink(this.sortActiveStudentsForPicker(students));
        this.cdr.markForCheck();
      },
      error: () => {
        sink([]);
        this.cdr.markForCheck();
      },
    });
  }

  private sortActiveStudentsForPicker(students: Student[] | null | undefined): Student[] {
    const rows = (students || []).filter(s => s.status === 'active');
    return rows.sort((a, b) => {
      const an = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
      const bn = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
      if (an !== bn) return an < bn ? -1 : 1;
      return a.id - b.id;
    });
  }

  get v2StructuresForSnapshotClass(): FeeV2Structure[] {
    const cid = this.v2SnapshotForm.classId;
    if (cid == null || cid <= 0) return [];
    return this.v2Structures
      .filter(s => s.classId === cid && s.status !== 'ARCHIVED')
      .sort((a, b) => a.structureName.localeCompare(b.structureName) || a.versionNo - b.versionNo);
  }

  get v2AssignPreviewSections(): Section[] {
    const cid = this.v2AssignPreviewClassId;
    if (cid == null || cid <= 0) return [];
    const c = this.classes.find(cl => cl.id === cid);
    return (c?.sections || []).filter(sec => sec.isActive !== false).sort((a, b) => a.name.localeCompare(b.name));
  }

  get v2StudentsSortedForPicker(): Student[] {
    return [...this.v2StudentsById.values()].sort((a, b) => {
      const an = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
      const bn = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
      if (an !== bn) return an < bn ? -1 : 1;
      return a.id - b.id;
    });
  }

  get v2SnapshotFrozenVersionLocked(): boolean {
    const sid = Number(this.v2SnapshotForm.feeStructureId || 0);
    if (!sid) return false;
    return this.v2StructuresForSnapshotClass.some(s => s.id === sid);
  }

  onV2SnapshotClassChange(classId: number | null): void {
    this.v2SnapshotForm.classId = classId;
    this.v2SnapshotForm.studentId = 0;
    this.v2SnapshotForm.feeStructureId = 0;
    this.v2SnapshotForm.frozenVersionNo = 1;
    if (classId == null || classId <= 0) {
      this.v2SnapshotStudentsInClass = [];
      this.cdr.markForCheck();
      return;
    }
    this.replenishClassRoster(classId, rows => (this.v2SnapshotStudentsInClass = rows));
  }

  onV2SnapshotPlanChange(structureId: number): void {
    this.v2SnapshotForm.feeStructureId = structureId;
    const s =
      this.v2StructuresForSnapshotClass.find(x => x.id === structureId) || this.v2Structures.find(x => x.id === structureId);
    this.v2SnapshotForm.frozenVersionNo = s ? s.versionNo : 1;
  }

  onV2SnapshotManualStructureIdChange(): void {
    const sid = Number(this.v2SnapshotForm.feeStructureId || 0);
    const s = this.v2Structures.find(x => x.id === sid);
    if (s) this.v2SnapshotForm.frozenVersionNo = s.versionNo;
  }

  onV2AssignPreviewClassChange(): void {
    this.v2AssignPreviewSectionId = null;
  }

  v2StudentOptionLabel(s: Student): string {
    const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
    const roll = s.rollNumber?.trim();
    const adm = s.admissionNumber?.trim();
    const base = name || this.translate.instant('fees.v2StudentUnnamed');
    const extra = [roll ? this.translate.instant('fees.v2RollShort', { r: roll }) : '', adm ? this.translate.instant('fees.v2AdmShort', { a: adm }) : '']
      .filter(Boolean)
      .join(' · ');
    return extra ? `${base} · ${extra}` : base;
  }

  v2StudentDisplayName(studentId: number): string {
    const s = this.v2StudentsById.get(studentId);
    if (!s) return this.translate.instant('fees.v2StudentIdFallback', { id: studentId });
    const name = `${s.firstName || ''} ${s.lastName || ''}`.trim();
    return name || this.translate.instant('fees.v2StudentIdFallback', { id: studentId });
  }

  v2ClassDisplayName(classId: number | null | undefined): string {
    if (classId == null) return '—';
    const c = this.classes.find(cl => cl.id === classId);
    if (!c) return String(classId);
    return formatSchoolClassName(c.name, this.translate) || c.name;
  }

  v2StructureDisplay(id?: number | null, ver?: number | null): string {
    if (id == null || id <= 0) return this.translate.instant('fees.v2NoPlanYet');
    const s = this.v2Structures.find(x => x.id === id);
    const v = ver ?? s?.versionNo;
    if (s) return `${s.structureName} (v${v ?? s.versionNo})`;
    return this.translate.instant('fees.v2PlanIdShort', { id, v: v ?? '?' });
  }

  v2FeeMapPlanName(feeStructureId: number): string {
    const s = this.v2Structures.find(x => x.id === feeStructureId);
    if (s) return s.structureName;
    return this.translate.instant('fees.v2PlanIdOnly', { id: feeStructureId });
  }

  v2WouldChangeLabel(v: boolean | undefined): string {
    return v ? this.translate.instant('fees.labelYesChange') : this.translate.instant('fees.labelNoChange');
  }

  onV2DemandsClassChange(classId: number | null): void {
    this.v2DemandsClassId = classId;
    this.v2DemandsStudentId = null;
    this.replenishClassRoster(classId, rows => (this.v2DemandsStudentsInClass = rows));
  }

  onV2DiscountClassChange(classId: number | null): void {
    this.v2DiscountClassId = classId;
    if (!this.v2DiscountEditingId) {
      this.v2DiscountStudentId = null;
      this.v2DiscountForm.studentId = 0;
    }
    this.replenishClassRoster(classId, rows => (this.v2DiscountStudentsInClass = rows));
  }

  onV2DiscountStudentPicked(id: number | null): void {
    const sid = id != null && id > 0 ? id : 0;
    this.v2DiscountStudentId = sid || null;
    if (!this.v2DiscountEditingId) {
      this.v2DiscountForm.studentId = sid;
    }
  }

  onV3StatementClassChange(classId: number | null): void {
    this.v3StatementClassId = classId;
    this.v3StatementStudentId = null;
    this.replenishClassRoster(classId, rows => (this.v3StatementStudentsInClass = rows));
  }

  onV3PayRegClassChange(classId: number | null): void {
    this.v3PayRegClassId = classId;
    this.v3PayRegStudentId = null;
    this.replenishClassRoster(classId, rows => (this.v3PayRegStudentsInClass = rows));
  }

  onV2AdminRzpClassChange(classId: number | null): void {
    this.v2AdminRzpClassId = classId;
    this.v2AdminRzpStudentId = null;
    this.replenishClassRoster(classId, rows => (this.v2AdminRzpStudentsInClass = rows));
  }

  saveV2Snapshot(): void {
    const studentId = Number(this.v2SnapshotForm.studentId || 0);
    const classId = Number(this.v2SnapshotForm.classId ?? 0);
    const feeStructureId = Number(this.v2SnapshotForm.feeStructureId || 0);
    const frozenVersionNo = Number(this.v2SnapshotForm.frozenVersionNo || 1);
    if (studentId <= 0 || classId <= 0 || feeStructureId <= 0 || !this.v2SnapshotForm.validFrom) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    const payload = {
      studentId,
      classId,
      feeStructureId,
      frozenVersionNo,
      assignmentSource: (this.v2SnapshotForm.assignmentSource || 'MANUAL_UI').trim(),
      validFrom: this.v2SnapshotForm.validFrom,
      validTo: this.v2SnapshotForm.validTo?.trim() || undefined,
    };
    this.feeService.createV2StudentFeeMapSnapshot(payload).subscribe({
      next: () => {
        this.loadV2FeeMaps();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false),
    });
  }

  loadV2Demands(): void {
    const studentId = Number(this.v2DemandsStudentId || 0);
    if (studentId <= 0) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.feeService.getV2StudentDemands(studentId).subscribe({
      next: rows => (this.v2Demands = rows || []),
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  loadV2Discounts(): void {
    const studentId = Number(this.v2DiscountStudentId || 0);
    if (studentId <= 0) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.feeService.getV2DiscountsForStudent(studentId).subscribe({
      next: rows => (this.v2Discounts = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  resetV2DiscountForm(): void {
    this.v2DiscountEditingId = null;
    this.v2DiscountForm = {
      studentId: Number(this.v2DiscountStudentId || 0) || 0,
      discountType: 'FLAT',
      discountValue: 0,
      componentScope: 'ALL',
      applicableComponentIdsJson: '',
      validFrom: '',
      validTo: '',
      reason: '',
    };
  }

  startEditV2Discount(row: FeeV2Discount): void {
    this.v2DiscountEditingId = row.id;
    this.v2DiscountStudentId = row.studentId;
    const st = this.v2StudentsById.get(row.studentId);
    this.v2DiscountClassId = st?.classId ?? null;
    if (this.v2DiscountClassId != null) {
      this.replenishClassRoster(this.v2DiscountClassId, rows => (this.v2DiscountStudentsInClass = rows));
    } else {
      this.v2DiscountStudentsInClass = [];
    }
    this.v2DiscountForm = {
      studentId: row.studentId,
      discountType: row.discountType,
      discountValue: row.discountValue,
      componentScope: row.componentScope || 'ALL',
      applicableComponentIdsJson: row.applicableComponentIdsJson || '',
      validFrom: (row.validFrom || '').slice(0, 10),
      validTo: row.validTo ? row.validTo.slice(0, 10) : '',
      reason: row.reason || '',
    };
  }

  saveV2Discount(): void {
    const studentId = Number(this.v2DiscountForm.studentId || 0);
    if (studentId <= 0 || !this.v2DiscountForm.validFrom) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.v2Busy = true;
    const base = {
      discountType: this.v2DiscountForm.discountType,
      discountValue: Number(this.v2DiscountForm.discountValue || 0),
      componentScope: (this.v2DiscountForm.componentScope || 'ALL').trim(),
      applicableComponentIdsJson: this.v2DiscountForm.applicableComponentIdsJson?.trim() || undefined,
      validFrom: this.v2DiscountForm.validFrom,
      validTo: this.v2DiscountForm.validTo?.trim() || undefined,
      reason: this.v2DiscountForm.reason?.trim() || undefined,
    };
    const req$ = this.v2DiscountEditingId
      ? this.feeService.updateV2Discount(this.v2DiscountEditingId, base)
      : this.feeService.createV2Discount({ ...base, studentId });
    req$.subscribe({
      next: () => {
        this.v2Busy = false;
        this.resetV2DiscountForm();
        this.loadV2Discounts();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  deleteV2Discount(id: number): void {
    this.feeService.deleteV2Discount(id).subscribe({
      next: () => {
        this.loadV2Discounts();
        this.setV2Message(this.translate.instant('fees.v2Deleted'), true);
      },
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2DeleteFailed'), false),
    });
  }

  openV2RuleLogic(rule: FeeV2Rule): void {
    this.v2RuleLogicRuleId = rule.id;
    this.v2RuleLogicLoading = true;
    this.v2RuleConditionDrafts = [];
    this.v2RuleActionDrafts = [];
    this.feeService.getV2RuleDefinition(rule.id).subscribe({
      next: def => {
        this.v2RuleLogicLoading = false;
        this.v2RuleConditionDrafts = (def.conditions || []).map(c => ({
          fieldName: c.fieldName,
          operator: c.operator,
          valueType: c.valueType,
          valueText: c.valueText,
          valueNumber: c.valueNumber,
          valueJson: c.valueJson,
          logicalJoin: c.logicalJoin || 'AND',
        }));
        this.v2RuleActionDrafts = (def.actions || []).map(a => ({
          actionType: a.actionType,
          targetScope: a.targetScope,
          valueType: a.valueType,
          valueNumber: a.valueNumber,
          valueText: a.valueText,
          valueJson: a.valueJson,
        }));
        if (!this.v2RuleConditionDrafts.length) {
          this.addV2RuleConditionDraft();
        }
        if (!this.v2RuleActionDrafts.length) {
          this.addV2RuleActionDraft();
        }
      },
      error: (e: Error) => {
        this.v2RuleLogicLoading = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2LoadFailed'), false);
      },
    });
  }

  closeV2RuleLogic(): void {
    this.v2RuleLogicRuleId = null;
    this.v2RuleConditionDrafts = [];
    this.v2RuleActionDrafts = [];
  }

  addV2RuleConditionDraft(): void {
    this.v2RuleConditionDrafts.push({
      fieldName: 'classId',
      operator: 'EQ',
      valueType: 'NUMBER',
      valueText: '',
      logicalJoin: 'AND',
    });
  }

  removeV2RuleConditionDraft(index: number): void {
    this.v2RuleConditionDrafts.splice(index, 1);
  }

  addV2RuleActionDraft(): void {
    this.v2RuleActionDrafts.push({
      actionType: 'ASSIGN_STRUCTURE',
      targetScope: 'DEFAULT',
      valueType: 'TEXT',
      valueText: '',
    });
  }

  removeV2RuleActionDraft(index: number): void {
    this.v2RuleActionDrafts.splice(index, 1);
  }

  saveV2RuleDefinition(): void {
    if (!this.v2RuleLogicRuleId) {
      return;
    }
    this.v2Busy = true;
    this.feeService
      .replaceV2RuleDefinition(this.v2RuleLogicRuleId, {
        conditions: this.v2RuleConditionDrafts.filter(c => c.fieldName?.trim() && c.operator?.trim() && c.valueType?.trim()),
        actions: this.v2RuleActionDrafts.filter(a => a.actionType?.trim()),
      })
      .subscribe({
        next: () => {
          this.v2Busy = false;
          this.setV2Message(this.translate.instant('fees.v2Saved'), true);
        },
        error: (e: Error) => {
          this.v2Busy = false;
          this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
        },
      });
  }

  selectPhase3Tab(next: 'phase3Reports' | 'phase3Payments' | 'phase3Audit'): void {
    this.tab = next;
    if (next === 'phase3Reports') {
      this.loadPhase3Reports();
    } else if (next === 'phase3Payments') {
      this.loadPhase3PaymentRegister();
    } else {
      this.loadPhase3Audit();
    }
  }

  selectPhase3ReconTab(): void {
    this.tab = 'phase3Recon';
    this.loadLedgerReconciliation();
  }

  loadLedgerReconciliation(): void {
    this.feeService.getV2LedgerReconciliation().subscribe({
      next: r => (this.v3LedgerRecon = r),
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  runV2AssignmentPreview(): void {
    const ids = this.v2AssignPreviewStudentIdsCsv
      .split(/[\s,]+/)
      .map(s => Number(s.trim()))
      .filter(n => n > 0);
    const body: {
      classId?: number;
      sectionId?: number;
      studentIds?: number[];
    } = {};
    if (ids.length) {
      body.studentIds = ids;
    } else {
      if (this.v2AssignPreviewClassId != null && this.v2AssignPreviewClassId > 0) {
        body.classId = this.v2AssignPreviewClassId;
      }
      if (this.v2AssignPreviewSectionId != null && this.v2AssignPreviewSectionId > 0) {
        body.sectionId = this.v2AssignPreviewSectionId;
      }
    }
    if (!body.studentIds?.length && body.classId == null) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.v2Busy = true;
    this.feeService.previewV2FeeAssignments(body).subscribe({
      next: r => {
        this.v2Busy = false;
        this.v2AssignPreviewResult = r;
        this.cdr.markForCheck();
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2LoadFailed'), false);
      },
    });
  }

  runV2AssignmentExecute(): void {
    if (!this.v2AssignExecValidFrom?.trim() || !this.v2AssignExecIdem?.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    const ids = this.v2AssignPreviewStudentIdsCsv
      .split(/[\s,]+/)
      .map(s => Number(s.trim()))
      .filter(n => n > 0);
    const body: FeeAssignmentExecuteRequest = {
      validFrom: this.v2AssignExecValidFrom.trim(),
      validTo: this.v2AssignExecValidTo?.trim() || undefined,
      idempotencyKey: this.v2AssignExecIdem.trim(),
      forceSnapshot: this.v2AssignExecForce,
      assignmentSource: 'RULE_ENGINE',
    };
    if (ids.length) {
      body.studentIds = ids;
    } else {
      if (this.v2AssignPreviewClassId != null && this.v2AssignPreviewClassId > 0) {
        body.classId = this.v2AssignPreviewClassId;
      }
      if (this.v2AssignPreviewSectionId != null && this.v2AssignPreviewSectionId > 0) {
        body.sectionId = this.v2AssignPreviewSectionId;
      }
    }
    this.v2Busy = true;
    this.feeService.executeV2FeeAssignments(body).subscribe({
      next: () => {
        this.v2Busy = false;
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
        this.loadV2FeeMaps();
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  createAdminV2RazorpayOrder(): void {
    const sid = Number(this.v2AdminRzpStudentId || 0);
    const amt = Number(this.v2AdminRzpAmount || 0);
    if (sid <= 0 || amt <= 0) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.v2Busy = true;
    this.feeService.createV2RazorpayOrder({ studentId: sid, amount: amt }).subscribe({
      next: r => {
        this.v2Busy = false;
        this.setV2Message(
          this.translate.instant('fees.v3RzpOrderCreated', { orderId: r.orderId || '' }),
          true
        );
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  approveV3PendingRefund(): void {
    const rid = Number(this.v3RefundApproveId || 0);
    if (rid <= 0) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.v2Busy = true;
    this.feeService.approveV2Refund(rid).subscribe({
      next: () => {
        this.v2Busy = false;
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  loadPhase3Reports(): void {
    const from = this.v3ReportFrom?.trim() || undefined;
    const to = this.v3ReportTo?.trim() || undefined;
    this.feeService.getV2CollectionSummary(from, to).subscribe({
      next: s => (this.v3CollectionSummary = s),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
    this.feeService.getV2Defaulters().subscribe({
      next: rows => (this.v3Defaulters = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
    this.feeService.getV2OutstandingByClass().subscribe({
      next: rows => (this.v3ClassOutstanding = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  loadV3Statement(): void {
    const sid = Number(this.v3StatementStudentId || 0);
    if (sid <= 0) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.feeService.getV2StudentStatement(sid).subscribe({
      next: s => (this.v3Statement = s),
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  loadPhase3PaymentRegister(): void {
    const sid = this.v3PayRegStudentId != null && this.v3PayRegStudentId > 0 ? this.v3PayRegStudentId : undefined;
    const from = this.v3PayRegFrom?.trim() || undefined;
    const to = this.v3PayRegTo?.trim() || undefined;
    this.feeService.getV2PaymentRegister({ studentId: sid, from, to }).subscribe({
      next: rows => (this.v3PaymentRegister = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  loadPhase3Audit(): void {
    this.feeService.getV2AuditEvents().subscribe({
      next: rows => (this.v3AuditRows = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  selectPhase4LateFeeTab(): void {
    this.tab = 'phase4LateFees';
    if (!this.v4RunForm.asOfDate) {
      this.v4RunForm.asOfDate = this.localIsoDate(new Date());
    }
    this.loadPhase4LateFeeData();
  }

  private localIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  loadPhase4LateFeeData(): void {
    this.feeService.getV2LateFeePolicies().subscribe({
      next: rows => (this.v4LatePolicies = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
    this.feeService.getV2LateFeeRuns().subscribe({
      next: rows => (this.v4LateRuns = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  resetV4PolicyForm(): void {
    this.v4PolicyEditingId = null;
    this.v4PolicyForm = {
      policyCode: '',
      policyName: '',
      graceDays: 0,
      calculationMode: 'FLAT',
      flatAmount: null,
      ratePercent: null,
      maxLateAmount: null,
      isActive: true,
    };
  }

  startEditV4LateFeePolicy(item: FeeV2LateFeePolicy): void {
    this.v4PolicyEditingId = item.id;
    this.v4PolicyForm = {
      policyCode: item.policyCode,
      policyName: item.policyName,
      graceDays: item.graceDays,
      calculationMode: item.calculationMode,
      flatAmount: item.flatAmount ?? null,
      ratePercent: item.ratePercent ?? null,
      maxLateAmount: item.maxLateAmount ?? null,
      isActive: item.isActive !== false,
    };
  }

  cancelEditV4LateFeePolicy(): void {
    this.resetV4PolicyForm();
  }

  saveV4LateFeePolicy(): void {
    const name = this.v4PolicyForm.policyName?.trim();
    if (!name) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    if (!this.v4PolicyEditingId && !this.v4PolicyForm.policyCode?.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    if (this.v4PolicyForm.calculationMode === 'FLAT') {
      const flat = Number(this.v4PolicyForm.flatAmount ?? 0);
      if (flat <= 0) {
        this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
        return;
      }
    } else {
      const rate = Number(this.v4PolicyForm.ratePercent ?? 0);
      if (rate <= 0) {
        this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
        return;
      }
    }
    this.v2Busy = true;
    const maxLate =
      this.v4PolicyForm.maxLateAmount != null && !Number.isNaN(Number(this.v4PolicyForm.maxLateAmount))
        ? Number(this.v4PolicyForm.maxLateAmount)
        : undefined;
    const req$ = this.v4PolicyEditingId
      ? this.feeService.updateV2LateFeePolicy(this.v4PolicyEditingId, this.buildV4UpdatePolicyBody(name, maxLate))
      : this.feeService.createV2LateFeePolicy(this.buildV4CreatePolicyBody(name, maxLate));
    req$.subscribe({
      next: () => {
        this.v2Busy = false;
        this.resetV4PolicyForm();
        this.loadPhase4LateFeeData();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  private buildV4CreatePolicyBody(policyName: string, maxLate: number | undefined): FeeV2CreateLateFeePolicyRequest {
    const base: FeeV2CreateLateFeePolicyRequest = {
      policyCode: this.v4PolicyForm.policyCode.trim(),
      policyName,
      graceDays: Math.max(0, Math.floor(Number(this.v4PolicyForm.graceDays ?? 0))),
      calculationMode: this.v4PolicyForm.calculationMode,
      isActive: this.v4PolicyForm.isActive,
    };
    if (maxLate != null && maxLate > 0) {
      base.maxLateAmount = maxLate;
    }
    if (this.v4PolicyForm.calculationMode === 'FLAT') {
      base.flatAmount = Number(this.v4PolicyForm.flatAmount ?? 0);
    } else {
      base.ratePercent = Number(this.v4PolicyForm.ratePercent ?? 0);
    }
    return base;
  }

  private buildV4UpdatePolicyBody(policyName: string, maxLate: number | undefined): FeeV2UpdateLateFeePolicyRequest {
    const base: FeeV2UpdateLateFeePolicyRequest = {
      policyName,
      graceDays: Math.max(0, Math.floor(Number(this.v4PolicyForm.graceDays ?? 0))),
      calculationMode: this.v4PolicyForm.calculationMode,
      isActive: this.v4PolicyForm.isActive,
    };
    if (maxLate != null && maxLate > 0) {
      base.maxLateAmount = maxLate;
    }
    if (this.v4PolicyForm.calculationMode === 'FLAT') {
      base.flatAmount = Number(this.v4PolicyForm.flatAmount ?? 0);
      base.ratePercent = undefined;
    } else {
      base.ratePercent = Number(this.v4PolicyForm.ratePercent ?? 0);
      base.flatAmount = undefined;
    }
    return base;
  }

  deleteV4LateFeePolicy(id: number): void {
    this.feeService.deleteV2LateFeePolicy(id).subscribe({
      next: () => {
        this.loadPhase4LateFeeData();
        this.setV2Message(this.translate.instant('fees.v2Deleted'), true);
      },
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2DeleteFailed'), false),
    });
  }

  generateV4RunIdempotencyKey(): void {
    this.v4RunForm.idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `lf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  submitV4LateFeeRun(): void {
    const policyId = Number(this.v4RunForm.feeLateFeePolicyId || 0);
    if (policyId <= 0 || !this.v4RunForm.asOfDate || !this.v4RunForm.idempotencyKey?.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.v2Busy = true;
    const body: FeeV2CreateLateFeeRunRequest = {
      feeLateFeePolicyId: policyId,
      asOfDate: this.v4RunForm.asOfDate,
      idempotencyKey: this.v4RunForm.idempotencyKey.trim(),
    };
    this.feeService.createV2LateFeeRun(body).subscribe({
      next: () => {
        this.v2Busy = false;
        this.loadPhase4LateFeeData();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  recordV3Refund(): void {
    const studentId = Number(this.v3RefundForm.studentId || 0);
    const amount = Number(this.v3RefundForm.amount || 0);
    if (studentId <= 0 || amount <= 0 || !this.v3RefundForm.idempotencyKey?.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    const rel = this.v3RefundRelatedPaymentId != null && this.v3RefundRelatedPaymentId > 0 ? this.v3RefundRelatedPaymentId : undefined;
    const payload: FeeV2RecordRefundRequest = {
      studentId,
      amount,
      idempotencyKey: this.v3RefundForm.idempotencyKey.trim(),
      reason: this.v3RefundForm.reason?.trim() || undefined,
      relatedPaymentId: rel,
      submitForApproval: this.v3RefundSubmitForApproval ? true : undefined,
    };
    this.v2Busy = true;
    this.feeService.recordV2Refund(payload).subscribe({
      next: () => {
        this.v2Busy = false;
        this.v2LedgerStudentId = studentId;
        this.loadV2Ledger();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  private setV2Message(message: string, ok: boolean): void {
    this.v2Message = message;
    this.v2MessageOk = ok;
  }

  clearV2Message(): void {
    this.v2Message = '';
    this.cdr.markForCheck();
  }

  loadV2Components(): void {
    this.feeService.getV2Components().subscribe({
      next: rows => (this.v2Components = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  startEditV2Component(item: FeeV2Component): void {
    this.v2ComponentEditingId = item.id;
    this.v2ComponentForm = {
      code: item.code,
      name: item.name,
      componentType: item.componentType,
      frequency: item.frequency,
      optionalComponent: item.optionalComponent,
      refundable: item.refundable,
    };
  }

  resetV2ComponentForm(): void {
    this.v2ComponentEditingId = null;
    this.v2ComponentForm = {
      code: '',
      name: '',
      componentType: 'RECURRING',
      frequency: 'MONTHLY',
      optionalComponent: false,
      refundable: false,
    };
  }

  saveV2Component(): void {
    if (!this.v2ComponentForm.code.trim() || !this.v2ComponentForm.name.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.v2Busy = true;
    const payload = {
      ...this.v2ComponentForm,
      code: this.v2ComponentForm.code.trim().toUpperCase(),
      name: this.v2ComponentForm.name.trim(),
    };
    const req$ = this.v2ComponentEditingId
      ? this.feeService.updateV2Component(this.v2ComponentEditingId, {
          name: payload.name,
          componentType: payload.componentType,
          frequency: payload.frequency,
          optionalComponent: payload.optionalComponent,
          refundable: payload.refundable,
        })
      : this.feeService.createV2Component(payload);
    req$.subscribe({
      next: () => {
        this.v2Busy = false;
        this.resetV2ComponentForm();
        this.loadV2Components();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  deleteV2Component(id: number): void {
    this.feeService.deleteV2Component(id).subscribe({
      next: () => {
        this.loadV2Components();
        this.setV2Message(this.translate.instant('fees.v2Deleted'), true);
      },
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2DeleteFailed'), false),
    });
  }

  loadV2Rules(): void {
    this.feeService.getV2Rules().subscribe({
      next: rows => (this.v2Rules = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  startEditV2Rule(item: FeeV2Rule): void {
    this.v2RuleEditingId = item.id;
    this.v2RuleForm = {
      ruleCode: item.ruleCode,
      ruleName: item.ruleName,
      ruleType: item.ruleType,
      priorityNo: item.priorityNo,
      stopOnMatch: false,
    };
  }

  resetV2RuleForm(): void {
    this.v2RuleEditingId = null;
    this.v2RuleForm = {
      ruleCode: '',
      ruleName: '',
      ruleType: 'ASSIGNMENT',
      priorityNo: 100,
      stopOnMatch: false,
    };
  }

  saveV2Rule(): void {
    if (!this.v2RuleForm.ruleCode.trim() || !this.v2RuleForm.ruleName.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.v2Busy = true;
    const payload: FeeV2CreateRuleRequest = {
      ruleCode: this.v2RuleForm.ruleCode.trim().toUpperCase(),
      ruleName: this.v2RuleForm.ruleName.trim(),
      ruleType: this.v2RuleForm.ruleType,
      priorityNo: Number(this.v2RuleForm.priorityNo || 100),
      stopOnMatch: !!this.v2RuleForm.stopOnMatch,
    };
    const req$ = this.v2RuleEditingId
      ? this.feeService.updateV2Rule(this.v2RuleEditingId, {
          ruleName: payload.ruleName,
          ruleType: payload.ruleType,
          priorityNo: payload.priorityNo,
          stopOnMatch: payload.stopOnMatch,
        })
      : this.feeService.createV2Rule(payload);
    req$.subscribe({
      next: () => {
        this.v2Busy = false;
        this.resetV2RuleForm();
        this.loadV2Rules();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => {
        this.v2Busy = false;
        this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false);
      },
    });
  }

  deleteV2Rule(id: number): void {
    this.feeService.deleteV2Rule(id).subscribe({
      next: () => {
        this.loadV2Rules();
        this.setV2Message(this.translate.instant('fees.v2Deleted'), true);
      },
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2DeleteFailed'), false),
    });
  }

  loadV2DemandRuns(): void {
    this.feeService.getV2DemandRuns().subscribe({
      next: rows => (this.v2DemandRuns = rows || []),
      error: () => this.setV2Message(this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  createV2DemandRun(): void {
    if (!this.v2DemandRunForm.periodKey.trim()) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    const payload: FeeV2CreateDemandRunRequest = {
      ...this.v2DemandRunForm,
      periodKey: this.v2DemandRunForm.periodKey.trim(),
      idempotencyKey: (this.v2DemandRunForm.idempotencyKey || `RUN-${Date.now()}`).trim(),
      triggerSource: (this.v2DemandRunForm.triggerSource || 'UI_ADMIN').trim(),
    };
    this.feeService.createV2DemandRun(payload).subscribe({
      next: () => {
        this.v2DemandRunForm.idempotencyKey = '';
        this.loadV2DemandRuns();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false),
    });
  }

  loadV2Ledger(): void {
    const studentId = Number(this.v2LedgerStudentId || 0);
    if (studentId <= 0) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    this.feeService.getV2StudentLedger(studentId).subscribe({
      next: rows => (this.v2LedgerRows = rows || []),
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2LoadFailed'), false),
    });
  }

  recordV2Payment(): void {
    const studentId = Number(this.v2PaymentForm.studentId || 0);
    const amount = Number(this.v2PaymentForm.amount || 0);
    if (studentId <= 0 || amount <= 0) {
      this.setV2Message(this.translate.instant('fees.v2ValidationRequired'), false);
      return;
    }
    const payload: FeeV2RecordPaymentRequest = {
      ...this.v2PaymentForm,
      studentId,
      amount,
      idempotencyKey: (this.v2PaymentForm.idempotencyKey || `PAY-${Date.now()}`).trim(),
    };
    this.feeService.recordV2Payment(payload).subscribe({
      next: r => {
        this.v2PaymentResult = r;
        this.v2LedgerStudentId = studentId;
        this.loadV2Ledger();
        this.setV2Message(this.translate.instant('fees.v2Saved'), true);
      },
      error: (e: Error) => this.setV2Message(e?.message || this.translate.instant('fees.v2SaveFailed'), false),
    });
  }

  exportCanonicalFeeStructuresCsv(): void {
    this.operationMessage = this.translate.instant('fees.exportQueued');
    this.operationMessageOk = true;
    this.importExport.createExportJob('FEE_STRUCTURES').subscribe({
      next: job => this.pollExportJob(job.id, 0),
      error: e => {
        this.operationMessage = e?.message || this.translate.instant('fees.exportFailed');
        this.operationMessageOk = false;
      },
    });
  }

  private pollExportJob(jobId: number, attempt: number): void {
    this.importExport.getExportJob(jobId).subscribe({
      next: job => {
        const status = (job.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          this.importExport.downloadExportJobCsv(jobId).subscribe(blob => {
            this.saveBlob(blob, `canonical-fee-structures-${new Date().toISOString().slice(0, 10)}-${jobId}.csv`);
            this.operationMessage = this.translate.instant('fees.exportDone');
            this.operationMessageOk = true;
          });
          return;
        }
        if (status === 'FAILED') {
          this.operationMessage = job.errorMessage || this.translate.instant('fees.exportFailed');
          this.operationMessageOk = false;
          return;
        }
        if (attempt > 80) {
          this.operationMessage = this.translate.instant('fees.exportTimeout');
          this.operationMessageOk = false;
          return;
        }
        setTimeout(() => this.pollExportJob(jobId, attempt + 1), 1500);
      },
      error: () => {
        this.operationMessage = this.translate.instant('fees.exportFailed');
        this.operationMessageOk = false;
      },
    });
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  loadStructures(): void {
    this.feeService.getFeeStructures().subscribe(fs => (this.feeStructures = fs));
  }

  loadPaymentsPage(): void {
    this.paymentsLoading = true;
    this.feeService
      .getPaymentsPage({
        page: this.paymentPageIndex,
        size: this.paymentPageSize,
        status: this.statusFilter || undefined,
        q: this.paymentSearch || undefined,
        classId: this.classFilterId ?? undefined,
        sectionId: this.sectionFilterId ?? undefined,
      })
      .subscribe({
        next: pr => {
          this.paymentsPage = pr.content;
          this.applyClientView();
          this.paymentsTotal = pr.totalElements;
          this.paymentPageIndex = pr.page;
          this.paymentsLoading = false;
          this.refreshing = false;
          this.loadCollectionSummary();
        },
        error: () => {
          this.paymentsLoading = false;
          this.refreshing = false;
        },
      });
  }

  applyClientView(): void {
    let rows = [...this.paymentsPage];
    rows.sort((a, b) => {
      if (this.sortBy === 'studentAsc') {
        return (a.studentName || '').localeCompare(b.studentName || '');
      }
      if (this.sortBy === 'dueAmountDesc') {
        return Number(b.dueAmount || 0) - Number(a.dueAmount || 0);
      }
      const ad = Date.parse(a.dueDate || '');
      const bd = Date.parse(b.dueDate || '');
      if (this.sortBy === 'dueDateDesc') {
        return (Number.isNaN(bd) ? 0 : bd) - (Number.isNaN(ad) ? 0 : ad);
      }
      return (Number.isNaN(ad) ? 0 : ad) - (Number.isNaN(bd) ? 0 : bd);
    });
    this.displayPaymentsPage = rows;
  }

  loadCollectionSummary(): void {
    this.feeService.getCollectionSummary().subscribe({
      next: s => (this.collectionSummary = s),
      error: () => (this.collectionSummary = null),
    });
  }

  schedulePaymentSearch(): void {
    if (this.paymentSearchTimer) {
      clearTimeout(this.paymentSearchTimer);
    }
    this.paymentSearchTimer = setTimeout(() => {
      this.paymentSearchTimer = null;
      this.paymentPageIndex = 0;
      this.loadPaymentsPage();
    }, 400);
  }

  onPaymentStatusChange(): void {
    this.paymentPageIndex = 0;
    this.loadPaymentsPage();
  }

  onPaymentPageIndexChange(idx: number): void {
    this.paymentPageIndex = idx;
    this.loadPaymentsPage();
  }

  onPaymentClassFilterChange(): void {
    const classExists = this.paymentFilterClasses.some(c => c.id === this.classFilterId);
    if (!classExists) {
      this.classFilterId = null;
    }
    if (this.sectionFilterId != null) {
      const sectionValid = this.paymentFilterSections.some(s => s.id === this.sectionFilterId);
      if (!sectionValid) {
        this.sectionFilterId = null;
      }
    }
    this.paymentPageIndex = 0;
    this.loadPaymentsPage();
  }

  onPaymentSectionFilterChange(): void {
    this.paymentPageIndex = 0;
    this.loadPaymentsPage();
  }

  get paymentFilterClasses(): SchoolClass[] {
    return [...this.classes].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  get paymentFilterSections(): Section[] {
    if (this.classFilterId == null) {
      return [];
    }
    const selectedClass = this.classes.find(c => c.id === this.classFilterId);
    return [...(selectedClass?.sections ?? [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  onPaymentPageSizeChange(size: number): void {
    this.paymentPageSize = size;
    this.paymentPageIndex = 0;
    this.loadPaymentsPage();
  }

  emptyStructureForm() {
    return {
      name: '',
      classId: null as number | null,
      className: '',
      academicYearId: null as number | null,
      components: [
        { name: this.translate.instant('fees.defaultCompTuition'), amount: 0, type: 'tuition' },
        { name: this.translate.instant('fees.defaultCompTransport'), amount: 0, type: 'transport' },
      ],
    };
  }

  syncClassName(): void {
    const c = this.classes.find(x => x.id === this.structureForm.classId);
    this.structureForm.className = c?.name ?? '';
  }

  openStructureModal(fs?: FeeStructure): void {
    this.structureError = '';
    this.editingStructureId = fs?.id ?? null;
    if (fs) {
      this.structureForm = {
        name: fs.name,
        classId: fs.classId,
        className: fs.className,
        academicYearId: fs.academicYearId,
        components: fs.components.map(c => ({ name: c.name, amount: c.amount, type: c.type || 'misc' }))
      };
    } else {
      this.structureForm = this.emptyStructureForm();
      this.structureForm.classId = this.classes[0]?.id ?? null;
      this.structureForm.academicYearId =
        this.academicYears.find(y => y.isCurrent)?.id ?? this.academicYears[0]?.id ?? null;
      this.syncClassName();
    }
    this.structureModal = true;
  }

  addComponentRow(): void {
    this.structureForm.components.push({ name: '', amount: 0, type: 'misc' });
  }

  removeComponentRow(i: number): void {
    this.structureForm.components.splice(i, 1);
  }

  saveStructure(): void {
    this.structureError = '';
    if (!this.structureForm.name.trim()) {
      this.structureError = this.translate.instant('fees.errName');
      return;
    }
    if (this.structureForm.classId == null) {
      this.structureError = this.translate.instant('fees.errClass');
      return;
    }
    if (this.structureForm.academicYearId == null) {
      this.structureError = this.translate.instant('fees.errYear');
      return;
    }
    const comps: FeeComponent[] = this.structureForm.components
      .filter(c => c.name.trim().length > 0)
      .map(c => ({ name: c.name.trim(), amount: Number(c.amount) || 0, type: c.type }));
    if (!comps.length) {
      this.structureError = this.translate.instant('fees.errComponents');
      return;
    }
    if (comps.some(c => Number(c.amount) < 0)) {
      this.structureError = this.translate.instant('fees.errComponentNegative');
      return;
    }
    if (comps.every(c => Number(c.amount) === 0)) {
      this.structureError = this.translate.instant('fees.errTotalZero');
      return;
    }
    const seen = new Set<string>();
    for (const c of comps) {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) {
        this.structureError = this.translate.instant('fees.errDuplicateComponent');
        return;
      }
      seen.add(key);
    }
    this.syncClassName();
    this.savingStructure = true;
    const body = {
      name: this.structureForm.name.trim(),
      classId: this.structureForm.classId as number,
      className: this.structureForm.className,
      academicYearId: this.structureForm.academicYearId as number,
      components: comps
    };
    const req$ = this.editingStructureId != null
      ? this.feeService.updateFeeStructure(this.editingStructureId, body)
      : this.feeService.addFeeStructure(body);
    req$.subscribe({
      next: () => {
        this.savingStructure = false;
        this.structureModal = false;
        this.loadStructures();
      },
      error: (e: Error) => {
        this.savingStructure = false;
        this.structureError = this.translate.instant('fees.saveFailed');
      }
    });
  }

  private defaultDueDateStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }

  openBulkAssignModal(fs: FeeStructure): void {
    this.bulkTargetStructure = fs;
    this.bulkSectionId = null;
    this.bulkDueDate = this.defaultDueDateStr();
    this.bulkSkipDuplicates = true;
    this.bulkAssignError = '';
    this.bulkAssignResult = null;
    this.academicService.getClassById(fs.classId).subscribe({
      next: c => {
        this.bulkSections = c?.sections ?? this.classes.find(cl => cl.id === fs.classId)?.sections ?? [];
        this.bulkAssignModal = true;
      },
      error: () => {
        this.bulkSections = this.classes.find(cl => cl.id === fs.classId)?.sections ?? [];
        this.bulkAssignModal = true;
      },
    });
  }

  closeBulkAssignModal(): void {
    this.bulkAssignModal = false;
    this.bulkTargetStructure = null;
    this.bulkSections = [];
  }

  /** Maps backend skip codes to short, admin-friendly text (results panel). */
  friendlyBulkSkipLabel(row: BulkAssignFeesSkipEntry): string {
    switch (row.code) {
      case 'STUDENT_INACTIVE':
        return this.translate.instant('fees.skipInactive');
      case 'DUPLICATE_OBLIGATION':
        return this.translate.instant('fees.skipDuplicate');
      default:
        return row.detail?.trim() || row.code.replace(/_/g, ' ').toLowerCase();
    }
  }

  submitBulkAssign(): void {
    const fs = this.bulkTargetStructure;
    if (!fs || !this.bulkDueDate) {
      return;
    }
    this.bulkAssignSaving = true;
    this.bulkAssignError = '';
    this.bulkAssignResult = null;
    this.feeService
      .bulkAssignFees({
        feeStructureId: fs.id,
        classId: fs.classId,
        sectionId: this.bulkSectionId,
        dueDate: this.bulkDueDate,
        skipIfDuplicate: this.bulkSkipDuplicates,
      })
      .subscribe({
        next: res => {
          this.bulkAssignResult = res;
          this.bulkAssignSaving = false;
          this.loadPaymentsPage();
        },
        error: (e: Error) => {
          this.bulkAssignSaving = false;
          this.bulkAssignError = this.translate.instant('fees.bulkError');
        },
      });
  }

  deleteStructure(fs: FeeStructure): void {
    this.confirmDialog
      .confirm({
        title: this.translate.instant('fees.confirmDeleteTitle'),
        message: this.translate.instant('fees.confirmDeleteMessage', { name: fs.name }),
        details: [
          this.translate.instant('fees.confirmDeleteDetailClass', {
            className: formatSchoolClassName(fs.className, this.translate) || fs.className,
          }),
          this.translate.instant('fees.confirmDeleteDetailYear', { id: fs.academicYearId }),
        ],
        variant: 'danger',
        confirmLabel: this.translate.instant('fees.confirmDeleteOk'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.feeService.deleteFeeStructure(fs.id).subscribe({
          next: () => this.loadStructures(),
          error: () => {
            this.operationMessage = this.translate.instant('fees.deleteFailed');
            this.operationMessageOk = false;
          },
        });
      });
  }

  feeStatusLabel(status: string): string {
    const k = (status || '').toLowerCase();
    const key = `students.enums.feeStatus.${k}`;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  openStudentLedgerModal(payment: FeePayment): void {
    this.ledgerStudentName = payment.studentName;
    this.studentLedgerModal = true;
    this.ledgerRows = [];
    this.ledgerTransactions = [];
    this.ledgerSelectedPaymentId = null;
    this.refundTargetPayment = null;
    this.ledgerLoading = true;
    this.feeService.getStudentPayments(payment.studentId).subscribe({
      next: rows => {
        this.ledgerRows = rows || [];
        if (this.ledgerRows.length) {
          this.selectLedgerRow(this.ledgerRows[0]);
        }
        this.ledgerLoading = false;
      },
      error: () => {
        this.ledgerRows = [];
        this.ledgerLoading = false;
      },
    });
  }

  private feeCsvMeta(documentTitleKey: string) {
    const sm = this.auth.getProfileSummarySnapshot();
    return {
      documentTitle: this.translate.instant(documentTitleKey),
      schoolLine: buildCsvSchoolLine(sm?.schoolName, sm?.schoolCode),
    };
  }

  exportPaymentsCsv(): void {
    const rows = this.displayPaymentsPage.map(r => [
      r.studentName,
      r.amount,
      r.paidAmount,
      r.dueAmount,
      r.dueDate,
      r.status,
      r.receiptNumber || '',
      r.paymentMethod || '',
    ]);
    const headers = ['student', 'amount', 'paid', 'due', 'dueDate', 'status', 'receipt', 'paymentMethod'];
    const table: string[][] = [headers, ...rows.map(r => r.map(c => String(c ?? '')))];
    downloadCsvDocument(
      `fees-payment-records-${new Date().toISOString().slice(0, 10)}.csv`,
      this.feeCsvMeta('fees.csvDocumentTitle.paymentRecords'),
      table
    );
  }

  exportStudentLedgerCsv(): void {
    const rows = this.ledgerRows.map(r => [
      r.studentName,
      r.amount,
      r.paidAmount,
      r.dueAmount,
      r.dueDate,
      r.status,
      r.receiptNumber || '',
      r.paymentMethod || '',
    ]);
    const headers = ['student', 'amount', 'paid', 'due', 'dueDate', 'status', 'receipt', 'paymentMethod'];
    const table: string[][] = [headers, ...rows.map(r => r.map(c => String(c ?? '')))];
    downloadCsvDocument(
      `student-payment-history-${(this.ledgerStudentName || 'student').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`,
      this.feeCsvMeta('fees.csvDocumentTitle.studentLedger'),
      table
    );
  }

  closeStudentLedgerModal(): void {
    this.studentLedgerModal = false;
    this.ledgerLoading = false;
    this.ledgerRows = [];
    this.ledgerTransactions = [];
    this.ledgerSelectedPaymentId = null;
    this.ledgerStudentName = '';
    this.refundTargetPayment = null;
    this.refundAmount = 0;
    this.refundReason = '';
    this.refundSaving = false;
    this.refundError = '';
    this.refundNotice = '';
    this.txFilter = 'all';
  }

  selectLedgerRow(row: FeePayment): void {
    this.ledgerSelectedPaymentId = row.id;
    this.refundTargetPayment = row;
    this.refundAmount = Math.max(0, Math.floor(Number(row.paidAmount || 0)));
    this.refundReason = '';
    this.refundError = '';
    this.refundNotice = '';
    this.feeService.getPaymentTransactions(row.id).subscribe({
      next: tx => {
        this.ledgerTransactions = tx || [];
      },
      error: () => {
        this.ledgerTransactions = [];
      },
    });
  }

  openRefundPanel(payment: FeePayment): void {
    this.openStudentLedgerModal(payment);
    this.refundTargetPayment = payment;
    this.refundAmount = Math.max(0, Math.floor(Number(payment.paidAmount || 0)));
    this.refundNotice = '';
  }

  requestRefund(): void {
    const payment = this.refundTargetPayment;
    if (!payment) return;
    const amount = Number(this.refundAmount) || 0;
    if (amount <= 0) {
      this.refundError = this.translate.instant('fees.refundAmountInvalid');
      return;
    }
    if (amount > Number(payment.paidAmount || 0)) {
      this.refundError = this.translate.instant('fees.refundAmountTooHigh');
      return;
    }
    const payload: FeeRefundRequest = {
      amount,
      reason: this.refundReason?.trim() || undefined,
      operationKey: this.nextOperationKey('refund-request', payment.id),
    };
    this.refundSaving = true;
    this.refundError = '';
    this.refundNotice = '';
    this.feeService.requestRefund(payment.id, payload).subscribe({
      next: () => {
        this.refundSaving = false;
        this.refundNotice = this.translate.instant('fees.refundRequestedToast');
        this.refundNoticeOk = true;
        this.selectLedgerRow(payment);
        this.loadPaymentsPage();
      },
      error: (e: Error) => {
        this.refundSaving = false;
        this.refundError = e?.message || this.translate.instant('fees.refundRequestFailed');
        this.refundNotice = this.translate.instant('fees.refundRequestFailed');
        this.refundNoticeOk = false;
      },
    });
  }

  approveRefund(tx: FeeTransaction): void {
    const payload: FeeRefundDecisionRequest = {
      operationKey: this.nextOperationKey('refund-approve', tx.id),
      note: this.translate.instant('fees.refundApprovedNote'),
    };
    this.feeService.approveRefund(tx.id, payload).subscribe({
      next: () => {
        this.refundNotice = this.translate.instant('fees.refundApprovedToast');
        this.refundNoticeOk = true;
        this.refreshLedgerTransactions();
      },
      error: () => {
        this.refundError = this.translate.instant('fees.refundApproveFailed');
        this.refundNotice = this.translate.instant('fees.refundApproveFailed');
        this.refundNoticeOk = false;
      },
    });
  }

  executeRefund(tx: FeeTransaction): void {
    const payload: FeeRefundExecuteRequest = {
      providerRefundId: `manual-${tx.id}-${Date.now()}`,
      operationKey: this.nextOperationKey('refund-execute', tx.id),
      note: this.translate.instant('fees.refundExecutedNote'),
    };
    this.feeService.executeRefund(tx.id, payload).subscribe({
      next: () => {
        this.refundNotice = this.translate.instant('fees.refundExecutedToast');
        this.refundNoticeOk = true;
        this.refreshLedgerTransactions();
        this.loadPaymentsPage();
      },
      error: () => {
        this.refundError = this.translate.instant('fees.refundExecuteFailed');
        this.refundNotice = this.translate.instant('fees.refundExecuteFailed');
        this.refundNoticeOk = false;
      },
    });
  }

  private refreshLedgerTransactions(): void {
    const selectedId = this.ledgerSelectedPaymentId;
    if (!selectedId) return;
    this.feeService.getPaymentTransactions(selectedId).subscribe({
      next: tx => (this.ledgerTransactions = tx || []),
      error: () => (this.ledgerTransactions = []),
    });
  }

  txLabel(tx: FeeTransaction): string {
    const key = `fees.txType.${(tx.eventType || '').toLowerCase()}`;
    const t = this.translate.instant(key);
    return t !== key ? t : tx.eventType;
  }

  setTxFilter(next: 'all' | 'payment' | 'refund'): void {
    this.txFilter = next;
  }

  get filteredLedgerTransactions(): FeeTransaction[] {
    if (this.txFilter === 'all') {
      return this.ledgerTransactions;
    }
    return this.ledgerTransactions.filter(tx => {
      const type = (tx.eventType || '').toUpperCase();
      const isRefund = type.startsWith('REFUND_');
      return this.txFilter === 'refund' ? isRefund : !isRefund;
    });
  }

  txIconClass(tx: FeeTransaction): string {
    const type = (tx.eventType || '').toUpperCase();
    if (type.startsWith('REFUND_')) return 'bi-arrow-counterclockwise';
    if (type === 'PAYMENT_CAPTURED') return 'bi-check-circle-fill';
    if (type === 'PAYMENT_MANUAL_POSTED') return 'bi-cash-stack';
    if (type === 'OBLIGATION_CREATED') return 'bi-receipt';
    return 'bi-dot';
  }

  private nextOperationKey(prefix: string, id: number): string {
    return `${prefix}:${id}:${Date.now()}`;
  }

  openCollectPaymentModal(payment: FeePayment): void {
    this.collectTargetPayment = payment;
    this.collectAmount = Math.max(0, Math.floor(payment.dueAmount));
    this.collectMethod = 'CASH';
    this.collectSaving = false;
    this.collectError = '';
    this.collectPaymentModal = true;
  }

  closeCollectPaymentModal(): void {
    this.collectPaymentModal = false;
    this.collectTargetPayment = null;
    this.collectAmount = 0;
    this.collectMethod = 'CASH';
    this.collectSaving = false;
    this.collectError = '';
  }

  submitCollectPayment(): void {
    const payment = this.collectTargetPayment;
    if (!payment) {
      return;
    }
    const amount = Number(this.collectAmount) || 0;
    if (amount <= 0) {
      this.collectError = this.translate.instant('fees.collectAmountInvalid');
      return;
    }
    if (amount > Number(payment.dueAmount || 0)) {
      this.collectError = this.translate.instant('fees.collectAmountTooHigh');
      return;
    }
    this.collectSaving = true;
    this.collectError = '';
    const body: FeePayment = {
      ...payment,
      paidAmount: amount,
      paymentMethod: this.collectMethod,
    };
    this.feeService.recordPayment(body).subscribe({
      next: () => {
        this.collectSaving = false;
        this.closeCollectPaymentModal();
        this.loadPaymentsPage();
      },
      error: (e: Error) => {
        this.collectSaving = false;
        this.collectError = this.translate.instant('fees.collectFailed');
      },
    });
  }

  sendReminder(payment: FeePayment): void {
    this.feeService
      .enqueueFeeReminder({
        studentId: payment.studentId,
        feePaymentId: payment.id,
        dueDate: payment.dueDate && payment.dueDate.trim() ? payment.dueDate : undefined,
        channel: 'SMS',
      })
      .subscribe({
        next: () => {
          this.setReminderMessage(this.translate.instant('fees.reminderSent', { name: payment.studentName }), true);
        },
        error: (e: unknown) => {
          const msg = (e as { message?: unknown })?.message;
          const message = typeof msg === 'string' && msg.trim()
            ? msg.trim()
            : this.translate.instant('fees.reminderFailed');
          this.setReminderMessage(message, false);
        },
      });
  }

  clearReminderMessage(): void {
    this.reminderMessage = '';
    if (this.reminderMessageTimer) {
      clearTimeout(this.reminderMessageTimer);
      this.reminderMessageTimer = null;
    }
  }

  clearOperationMessage(): void {
    this.operationMessage = '';
  }

  private setReminderMessage(message: string, isSuccess: boolean): void {
    this.reminderMessage = message;
    this.reminderMessageOk = isSuccess;
    if (this.reminderMessageTimer) {
      clearTimeout(this.reminderMessageTimer);
    }
    this.reminderMessageTimer = setTimeout(() => {
      this.reminderMessage = '';
      this.reminderMessageTimer = null;
    }, 10_000);
  }
}
