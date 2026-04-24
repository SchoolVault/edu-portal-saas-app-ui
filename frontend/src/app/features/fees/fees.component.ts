import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeeService } from '../../core/services/fee.service';
import { SettingsService } from '../../core/services/settings.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
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
  SchoolClass,
  Section,
} from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { buildCsvSchoolLine, downloadCsvDocument } from '../../core/utils/csv-export.util';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SchoolClassNamePipe, ErpPaginationComponent, ErpI18nPhDirective],
  styles: [`
    .fees-page {
      width: 100%;
      max-width: 100%;
      min-width: 0;
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
        {{ operationMessage }}
      </div>
      <div
        *ngIf="isAdmin && feeFinanceBannerVisible"
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
          <button *ngIf="isAdmin" type="button" class="btn-outline-erp btn-sm" (click)="goToFeeSettlementSettings()">
            <i class="bi bi-bank2 me-1"></i>{{ 'fees.linkPaymentSettlement' | translate }}
          </button>
          <button *ngIf="isAdmin" type="button" class="btn-primary-erp btn-sm" (click)="openStructureModal()">
            <i class="bi bi-plus-lg"></i> {{ 'fees.newStructure' | translate }}
          </button>
        </div>
      </div>

      <div class="erp-tabs animate-in">
        <button type="button" class="erp-tab" [class.active]="tab === 'structures'" (click)="tab = 'structures'" data-testid="tab-structures">{{ 'fees.tabStructures' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'payments'" (click)="tab = 'payments'" data-testid="tab-payments">{{ 'fees.tabPayments' | translate }}</button>
      </div>

      <div *ngIf="tab === 'structures'" class="animate-in fees-structures-shell">
        <div class="erp-card mb-3" *ngIf="isAdmin">
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
              <div *ngIf="isAdmin" class="d-flex flex-wrap gap-2 mt-3 pt-2" style="border-top: 1px solid var(--clr-border-light);">
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

      <div *ngIf="tab === 'payments'" class="animate-in">
        <div *ngIf="reminderMessage" class="alert py-2 small mb-2 fees-reminder-alert" [class.alert-success]="reminderMessageOk" [class.alert-danger]="!reminderMessageOk">
          <span class="fees-reminder-alert__text">{{ reminderMessage }}</span>
          <button type="button" class="fees-reminder-alert__close" (click)="clearReminderMessage()" [attr.aria-label]="'fees.close' | translate">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="row g-2 mb-3 fees-kpi-grid" *ngIf="isAdmin">
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
                  <td>{{ p.dueDate }}</td>
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
                      *ngIf="isAdmin && p.paidAmount > 0"
                      type="button"
                      class="btn-outline-erp btn-xs fees-btn-refund"
                      (click)="openRefundPanel(p)"
                    >
                      {{ 'fees.refund' | translate }}
                    </button>
                    <button
                      *ngIf="isAdmin && p.dueAmount > 0"
                      type="button"
                      class="btn-primary-erp btn-xs fees-btn-collect"
                      (click)="openCollectPaymentModal(p)"
                    >
                      {{ 'fees.collectNow' | translate }}
                    </button>
                    <button
                      *ngIf="isAdmin && p.dueAmount > 0"
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
          <input id="bulk-due-date" class="erp-input mb-1" type="date" [(ngModel)]="bulkDueDate" />
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
                      <td>{{ row.dueDate }}</td>
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
                    <div *ngIf="tx.occurredAt">{{ tx.occurredAt | date:'medium' }}</div>
                    <div *ngIf="tx.note">{{ tx.note }}</div>
                  </div>
                  <div class="d-flex gap-2 mt-2" *ngIf="isAdmin">
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

              <div class="fees-refund-panel" *ngIf="isAdmin && refundTargetPayment">
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
  tab = 'structures';
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
  classes: SchoolClass[] = [];
  academicYears: AcademicYear[] = [];
  isAdmin = false;
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

  constructor(
    private feeService: FeeService,
    private academicService: AcademicService,
    private auth: AuthService,
    private router: Router,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private settingsService: SettingsService
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

    this.isAdmin = this.auth.getNormalizedRole() === 'admin';
    this.academicService.getClasses().subscribe(c => (this.classes = c || []));
    this.academicService.getAcademicYears().subscribe(y => (this.academicYears = y || []));
    this.loadStructures();
    this.loadPaymentsPage();
    this.loadCollectionSummary();
    this.refreshFeeFinanceBanner();
  }

  /** Deep link to Settings → Finance & payments → Fee settlement (Razorpay Route). */
  goToFeeSettlementSettings(): void {
    void this.router.navigate(['/app/settings'], {
      queryParams: { settingsTab: 'finance', financeHub: 'settlement' },
    });
  }

  /** Loads tenant finance flag for admin banner (parent online checkout). */
  private refreshFeeFinanceBanner(): void {
    if (!this.isAdmin) {
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
