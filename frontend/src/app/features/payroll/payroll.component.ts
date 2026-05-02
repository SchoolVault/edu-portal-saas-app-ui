import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Payslip,
  PayrollDisbursementAttempt,
  PayrollDisbursementSummary,
  SalaryStructure,
  TeacherPaymentDetails,
} from '../../core/models/models';
import { TeacherService } from '../../core/services/teacher.service';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { filter } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { PayrollService } from '../../core/services/payroll.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { SettingsService } from '../../core/services/settings.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { runtimeConfig } from '../../core/config/runtime-config';
import { formatDateDdMmYyyy } from '../../core/utils/date-format';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent, ErpI18nPhDirective],
  template: `
    <div class="payroll-page" data-testid="payroll-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'payroll.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            {{ canManagePayrollDesk ? ('payroll.leadAdmin' | translate) : isTeacher ? ('payroll.leadTeacher' | translate) : ('payroll.leadDenied' | translate) }}
          </p>
        </div>
        <div *ngIf="canManagePayrollDesk || isTeacher" class="d-flex gap-2 align-items-end flex-wrap payroll-period-toolbar">
          <div class="payroll-period-field">
            <label class="erp-label d-block mb-1">{{ 'payroll.labelMonth' | translate }}</label>
            <select class="erp-select payroll-period-control" [(ngModel)]="genMonth" (ngModelChange)="onHeaderPeriodChanged()">
              <option *ngFor="let m of monthNames" [value]="m">{{ monthOptionLabel(m) }}</option>
            </select>
          </div>
          <div class="payroll-period-field payroll-period-field--year">
            <label class="erp-label d-block mb-1">{{ 'payroll.labelYear' | translate }}</label>
            <input class="erp-input payroll-period-control" type="number" [(ngModel)]="genYear" (ngModelChange)="onHeaderPeriodChanged()" />
          </div>
          <button *ngIf="canManagePayrollDesk" class="btn-primary-erp btn-sm align-self-end payroll-period-btn payroll-period-btn--primary" data-testid="generate-payslips-btn" [disabled]="generating" (click)="runGenerate()">
            <i class="bi bi-file-earmark-text"></i> {{ generating ? ('payroll.generating' | translate) : ('payroll.generate' | translate) }}
          </button>
          <button class="btn-outline-erp btn-sm align-self-end payroll-period-btn payroll-period-btn--secondary" type="button" (click)="refreshPayroll()">{{ 'payroll.refresh' | translate }}</button>
        </div>
      </div>
      <div *ngIf="canManagePayrollDesk || isTeacher" class="payroll-period-hint" [class.payroll-period-hint--warn]="!!payrollPeriodValidationMessage()">
        <i class="bi" [ngClass]="payrollPeriodValidationMessage() ? 'bi-exclamation-triangle' : 'bi-calendar-check'"></i>
        <span>{{ payrollPeriodValidationMessage() || ('payroll.periodHint' | translate) }}</span>
      </div>

      <div *ngIf="salaryStructureSuccess" class="alert alert-success py-2 small mb-3">{{ salaryStructureSuccess }}</div>
      <div *ngIf="genError" class="alert alert-danger py-2 small mb-3">{{ genError }}</div>
      <div *ngIf="queueError" class="alert alert-danger py-2 small mb-3">{{ queueError }}</div>
      <div *ngIf="disburseInfo" class="alert alert-success py-2 small mb-3">
        {{ disburseInfo }}
        <div class="mt-2 pt-2 text-muted" style="font-size: 12px; border-top: 1px solid rgba(15, 23, 42, 0.12);">
          <strong>{{ 'payroll.disburseHowTitle' | translate }}</strong> {{ 'payroll.disburseHowBody' | translate }}
        </div>
      </div>

      <div *ngIf="canManagePayrollDesk" class="erp-card mb-3 animate-in payroll-flow-card">
        <div class="small fw-semibold text-uppercase text-muted mb-2">{{ 'payroll.adminFlowTitle' | translate }}</div>
        <div class="d-flex flex-wrap gap-2">
          <span class="badge-erp badge-neutral">{{ 'payroll.adminFlowStep1' | translate }}</span>
          <span class="badge-erp badge-neutral">{{ 'payroll.adminFlowStep2' | translate }}</span>
          <span class="badge-erp badge-neutral">{{ 'payroll.adminFlowStep3' | translate }}</span>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-md-4">
            <div class="p-2 rounded-2 payroll-flow-step-card">
              <div class="small text-muted">{{ 'payroll.runStep1Title' | translate }}</div>
              <div class="fw-semibold">{{ bankReadyCount }}/{{ paymentDetails.length }} {{ 'payroll.runStep1Value' | translate }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-2 rounded-2 payroll-flow-step-card">
              <div class="small text-muted">{{ 'payroll.runStep2Title' | translate }}</div>
              <div class="fw-semibold">{{ generatedPayslipCount }} {{ 'payroll.runStep2Value' | translate }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-2 rounded-2 payroll-flow-step-card">
              <div class="small text-muted">{{ 'payroll.runStep3Title' | translate }}</div>
              <div class="fw-semibold">{{ paidPayslipCount }} {{ 'payroll.runStep3Value' | translate }}</div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="canManagePayrollDesk" class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"
            ><div class="stat-icon" style="background: rgba(27,58,48,0.1); color: #1B3A30;"><i class="bi bi-people-fill"></i></div
            ><div class="stat-value">{{ structCountForStat }}</div
            ><div class="stat-label">{{ 'payroll.statStructures' | translate }}</div></div
          >
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"
            ><div class="stat-icon" style="background: rgba(5,150,105,0.1); color: #059669;"><i class="bi bi-wallet-fill"></i></div
            ><div class="stat-value">₹{{ totalPayroll | number:'1.0-0':'en-IN' }}</div
            ><div class="stat-label">{{ 'payroll.statNetPayroll' | translate }}</div></div
          >
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"
            ><div class="stat-icon" style="background: rgba(2,132,199,0.1); color: #0284C7;"><i class="bi bi-receipt"></i></div
            ><div class="stat-value">{{ payslips.length }}</div
            ><div class="stat-label">{{ 'payroll.statPayslips' | translate }}</div></div
          >
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"
            ><div class="stat-icon" style="background: rgba(192,92,61,0.12); color: #C05C3D;"><i class="bi bi-bank"></i></div
            ><div class="stat-value">{{ bankReadyCount }}/{{ paymentDetails.length }}</div
            ><div class="stat-label">{{ 'payroll.statBankReady' | translate }}</div></div
          >
        </div>
      </div>

      <div
        *ngIf="canManagePayrollDesk && !financeProfileLoading && !payrollDigitalPayoutEnabled"
        class="erp-card animate-in mb-3 payroll-offline-payout-hint"
        role="status"
      >
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            <h4 class="erp-card-title mb-1">{{ 'payroll.digitalPayoutOffTitle' | translate }}</h4>
            <p class="text-muted small mb-0">{{ 'payroll.digitalPayoutOffBody' | translate }}</p>
          </div>
          <button type="button" class="btn-outline-erp btn-sm text-nowrap" (click)="goToPayrollFinanceSettings()">
            {{ 'payroll.digitalPayoutOffCta' | translate }}
          </button>
        </div>
      </div>

      <div
        *ngIf="canManagePayrollDesk && !financeProfileLoading && payrollDigitalPayoutEnabled"
        class="erp-card animate-in animate-in-delay-2 mb-4 payroll-disburse-card"
      >
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 class="erp-card-title mb-1">{{ 'payroll.cardDisburseTitle' | translate }}</h4>
            <p class="small fw-semibold text-primary mb-2 payroll-digital-on-status">
              <i class="bi bi-check2-circle me-1" aria-hidden="true"></i>{{ 'payroll.digitalPayoutOnStatus' | translate }}
            </p>
            <p class="text-muted small mb-0">{{ 'payroll.cardDisburseLead' | translate }}</p>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="loadPaymentDetails()"><i class="bi bi-arrow-clockwise"></i> {{ 'payroll.reloadBank' | translate }}</button>
        </div>
        <div class="row g-3 mb-4" *ngIf="paymentDetails.length">
          <div class="col-md-4">
            <label class="erp-label">{{ 'payroll.labelTeacherStep' | translate }}</label>
            <select class="erp-select" [(ngModel)]="payrollFocusTeacherId">
              <option [ngValue]="null">{{ 'payroll.chooseTeacher' | translate }}</option>
              <option *ngFor="let d of paymentDetails" [ngValue]="d.teacherId">{{ d.teacherName }}</option>
            </select>
            <label class="erp-label mt-2">{{ 'payroll.labelPaymentRail' | translate }}</label>
            <select class="erp-select" [(ngModel)]="disbursePaymentMethod">
              <option value="NETBANKING">{{ 'payroll.railNetbanking' | translate }}</option>
              <option value="UPI">{{ 'payroll.railUpi' | translate }}</option>
              <option value="NEFT">{{ 'payroll.railNeft' | translate }}</option>
              <option value="IMPS">{{ 'payroll.railImps' | translate }}</option>
            </select>
          </div>
          <div class="col-md-8" *ngIf="payrollFocusDetail as fd">
            <div class="p-3 rounded-3 payroll-focus-panel">
              <div class="row g-2 small">
                <div class="col-sm-6"><span class="text-muted">{{ 'payroll.payTo' | translate }}</span><br /><strong>{{ fd.bankAccountHolder || fd.teacherName }}</strong></div>
                <div class="col-sm-6"><span class="text-muted">{{ 'payroll.bank' | translate }}</span><br /><strong>{{ fd.bankName || ('exams.dash' | translate) }}</strong></div>
                <div class="col-sm-6"><span class="text-muted">{{ 'payroll.account' | translate }}</span><br /><code class="user-select-all">{{ fd.bankAccountMasked || ('exams.dash' | translate) }}</code></div>
                <div class="col-sm-6"><span class="text-muted">{{ 'payroll.ifsc' | translate }}</span><br /><code class="user-select-all">{{ fd.bankIfsc || ('exams.dash' | translate) }}</code></div>
                <div class="col-sm-6"><span class="text-muted">{{ 'payroll.salaryStructureNet' | translate }}</span><br /><strong>₹{{ fd.monthlyNetSalary | number:'1.0-0':'en-IN' }}</strong></div>
                <div class="col-sm-6">
                  <span class="text-muted">{{ 'payroll.payslipForPeriod' | translate: { month: monthOptionLabel(genMonth), year: genYear } }}</span><br />
                  <ng-container *ngIf="periodPayslipForTeacher(fd.teacherId) as ps">
                    <strong>₹{{ ps.netSalary | number:'1.0-0':'en-IN' }}</strong>
                    <span class="badge-erp ms-1" [class.badge-neutral]="ps.status === 'generated'" [class.badge-success]="ps.status === 'paid'">{{ payslipStatusLabel(ps.status) }}</span>
                    <div *ngIf="ps.status === 'paid'" class="small text-muted mt-1">
                      {{ 'payroll.focusSettlement' | translate }}: <span class="text-body fw-semibold">{{ payslipSettlementLabel(ps) }}</span>
                    </div>
                  </ng-container>
                  <span *ngIf="!periodPayslipForTeacher(fd.teacherId)" class="text-warning">{{ 'payroll.generateFirst' | translate }}</span>
                </div>
              </div>
              <div class="mt-3 d-flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-primary-erp btn-sm"
                  [disabled]="!canInitiateDisburse(fd) || disbursingTeacherId === fd.teacherId"
                  (click)="openDisbursePreview(fd)"
                >
                  {{ disbursingTeacherId === fd.teacherId ? ('payroll.submitting' | translate) : ('payroll.initiateTransfer' | translate) }}
                </button>
                <span class="text-muted small align-self-center">{{ 'payroll.afterBankNote' | translate }}</span>
              </div>
              <div class="payroll-disburse-checklist mt-3">
                <div class="small fw-semibold mb-1">{{ 'payroll.disburseChecklistTitle' | translate }}</div>
                <ul class="mb-0">
                  <li [class.is-ok]="hasBankBasics(fd)">{{ 'payroll.checkBankProfile' | translate }}</li>
                  <li [class.is-ok]="hasValidIfsc(fd)">{{ 'payroll.checkIfsc' | translate }}</li>
                  <li [class.is-ok]="!!periodPayslipForTeacher(fd.teacherId)">{{ 'payroll.checkPayslip' | translate }}</li>
                </ul>
                <p *ngIf="disburseReadinessIssues(fd).length" class="small mb-0 mt-2" [class.text-danger]="!isSalaryAlreadyDisbursed(fd)" [class.text-success]="isSalaryAlreadyDisbursed(fd)">
                  {{ 'payroll.disburseBlockedPrefix' | translate }} {{ disburseReadinessIssues(fd).join(' ') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>{{ 'payroll.thTeacher' | translate }}</th>
                <th>{{ 'payroll.thMonthlyNet' | translate }}</th>
                <th>{{ 'payroll.thBank' | translate }}</th>
                <th>{{ 'payroll.thAccount' | translate }}</th>
                <th>{{ 'payroll.thIfsc' | translate }}</th>
                <th>{{ 'payroll.thStatus' | translate }}</th>
                <th class="text-end">{{ 'payroll.thBankTransfer' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of pagedPaymentDetails">
                <td><strong>{{ d.teacherName }}</strong></td>
                <td>₹{{ d.monthlyNetSalary | number:'1.0-0':'en-IN' }}</td>
                <td>{{ d.bankName || ('exams.dash' | translate) }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ d.bankAccountMasked || ('exams.dash' | translate) }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ d.bankIfsc || ('exams.dash' | translate) }}</td>
                <td>
                  <span class="badge-erp" [class.badge-success]="d.bankDetailsComplete" [class.badge-warning]="!d.bankDetailsComplete">
                    {{ d.bankDetailsComplete ? ('payroll.statusReady' | translate) : ('payroll.statusIncomplete' | translate) }}
                  </span>
                  <div *ngIf="disburseReadinessIssues(d).length" class="small mt-1" [class.text-danger]="!isSalaryAlreadyDisbursed(d)" [class.text-success]="isSalaryAlreadyDisbursed(d)">
                    {{ disburseReadinessIssues(d).join(' ') }}
                  </div>
                </td>
                <td class="text-end">
                  <button
                    type="button"
                    class="btn-primary-erp btn-xs"
                    [disabled]="!canInitiateDisburse(d) || disbursingTeacherId === d.teacherId"
                    (click)="openDisbursePreview(d)"
                    [title]="'payroll.initiateTitle' | translate"
                  >
                    {{ disbursingTeacherId === d.teacherId ? ('payroll.submitting' | translate) : ('payroll.initiate' | translate) }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!paymentDetails.length"><td colspan="7" class="text-center py-3">
                <div class="payroll-empty-state"><i class="bi bi-bank2"></i>{{ 'payroll.noStructures' | translate }}</div>
              </td></tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="paymentDetails.length > 0"
            [totalElements]="paymentDetails.length"
            [pageIndex]="payDetPageIndex"
            [pageSize]="payDetPageSize"
            (pageIndexChange)="onPayDetPageIndexChange($event)"
            (pageSizeChange)="onPayDetPageSizeChange($event)"
          />
        </div>
      </div>

      <div
        *ngIf="canManagePayrollDesk && !financeProfileLoading && payrollDigitalPayoutEnabled"
        class="erp-card animate-in mb-4 payroll-queue-card"
      >
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 class="erp-card-title mb-1">{{ 'payroll.settlementTitle' | translate }}</h4>
            <p class="text-muted small mb-0">{{ 'payroll.disburseHowBody' | translate }}</p>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshDisbursementQueue()"><i class="bi bi-arrow-clockwise"></i> {{ 'payroll.refresh' | translate }}</button>
        </div>
        <div class="row g-2 mb-3">
          <div class="col-sm-6 col-lg-3"><div class="p-2 rounded-2 payroll-queue-stat-card"><div class="small text-muted">{{ 'payroll.queueSubmitted' | translate }}</div><div class="fw-semibold">{{ disbursementSummary.submittedCount }}</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="p-2 rounded-2 payroll-queue-stat-card"><div class="small text-muted">{{ 'payroll.queueCompleted' | translate }}</div><div class="fw-semibold">{{ disbursementSummary.completedCount }}</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="p-2 rounded-2 payroll-queue-stat-card"><div class="small text-muted">{{ 'payroll.queueFailed' | translate }}</div><div class="fw-semibold">{{ disbursementSummary.failedCount }}</div></div></div>
          <div class="col-sm-6 col-lg-3"><div class="p-2 rounded-2 payroll-queue-stat-card"><div class="small text-muted">{{ 'payroll.queueVariance' | translate }}</div><div class="fw-semibold">₹{{ queueVarianceAmount | number:'1.0-0':'en-IN' }}</div></div></div>
        </div>
        <div class="payroll-queue-filters mb-2">
          <button type="button" class="btn-outline-erp btn-xs" [class.active]="queueStatusFilter===''" (click)="setQueueFilter('')">{{ 'payroll.filterAll' | translate }}</button>
          <button type="button" class="btn-outline-erp btn-xs" [class.active]="queueStatusFilter==='SUBMITTED'" (click)="setQueueFilter('SUBMITTED')">{{ 'payroll.queueSubmitted' | translate }}</button>
          <button type="button" class="btn-outline-erp btn-xs" [class.active]="queueStatusFilter==='COMPLETED'" (click)="setQueueFilter('COMPLETED')">{{ 'payroll.queueCompleted' | translate }}</button>
          <button type="button" class="btn-outline-erp btn-xs" [class.active]="queueStatusFilter==='FAILED'" (click)="setQueueFilter('FAILED')">{{ 'payroll.queueFailed' | translate }}</button>
        </div>
        <div class="table-responsive">
          <table class="erp-table">
            <thead><tr>
              <th>{{ 'payroll.thTeacher' | translate }}</th>
              <th>{{ 'payroll.thPeriod' | translate }}</th>
              <th>{{ 'payroll.thNetSalary' | translate }}</th>
              <th>{{ 'payroll.labelPaymentRail' | translate }}</th>
              <th>{{ 'payroll.queueRef' | translate }}</th>
              <th>{{ 'payroll.thStatus' | translate }}</th>
              <th>{{ 'payroll.queueLastUpdate' | translate }}</th>
              <th class="text-end">{{ 'payroll.thActions' | translate }}</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let a of queueAttempts">
                <td><strong>{{ a.teacherName || ('exams.dash' | translate) }}</strong></td>
                <td>{{ a.periodLabel || ('exams.dash' | translate) }}</td>
                <td><strong>₹{{ a.amount | number:'1.0-0':'en-IN' }}</strong></td>
                <td>{{ a.paymentMethod }}</td>
                <td><code class="user-select-all">{{ a.referenceId }}</code></td>
                <td>
                  <span class="badge-erp" [class.badge-neutral]="a.status==='SUBMITTED'" [class.badge-success]="a.status==='COMPLETED'" [class.badge-warning]="a.status==='FAILED'">{{ disbursementStatusLabel(a.status) }}</span>
                  <span
                    *ngIf="isWebhookSyncedAttempt(a)"
                    class="payroll-webhook-chip ms-1"
                    [attr.title]="webhookStatusTooltip(a)"
                  >
                    <i class="bi bi-broadcast-pin"></i> {{ 'payroll.webhookSynced' | translate }}
                  </span>
                </td>
                <td class="small text-muted">{{ a.completedAt || a.createdAt || ('exams.dash' | translate) }}</td>
                <td class="text-end text-nowrap">
                  <button type="button" class="btn-outline-erp btn-xs me-1" [disabled]="queueUpdatingId===a.id || a.status==='COMPLETED'" (click)="updateQueueStatus(a, 'COMPLETED')">{{ 'payroll.markSettled' | translate }}</button>
                  <button type="button" class="btn-outline-erp btn-xs" [disabled]="queueUpdatingId===a.id || a.status==='FAILED'" (click)="updateQueueStatus(a, 'FAILED')">{{ 'payroll.markFailed' | translate }}</button>
                </td>
              </tr>
              <tr *ngIf="!queueAttempts.length"><td colspan="8" class="text-center py-3">
                <div class="payroll-empty-state"><i class="bi bi-hourglass-split"></i>{{ 'payroll.noQueueRows' | translate }}</div>
              </td></tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="queuePaginationTotal > 0"
            [totalElements]="queuePaginationTotal"
            [pageIndex]="queuePageIndex"
            [pageSize]="queuePageSize"
            (pageIndexChange)="onQueuePageIndexChange($event)"
            (pageSizeChange)="onQueuePageSizeChange($event)"
          />
        </div>
      </div>

      <div *ngIf="canManagePayrollDesk" class="erp-card animate-in mb-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <h4 class="erp-card-title mb-0">{{ 'payroll.structuresTitle' | translate }}</h4>
          <button type="button" class="btn-primary-erp btn-sm" (click)="openSalaryStructureModal()" data-testid="payroll-new-structure-btn">
            <i class="bi bi-plus-lg"></i> {{ 'payroll.newStructure' | translate }}
          </button>
        </div>
        <div class="table-responsive payroll-salary-table-wrap">
          <table class="erp-table payroll-salary-table" data-testid="salary-table">
            <thead
              ><tr
                ><th>{{ 'payroll.thTeacher' | translate }}</th
                ><th>{{ 'payroll.thBasic' | translate }}</th
                ><th>{{ 'payroll.thAllowances' | translate }}</th
                ><th>{{ 'payroll.thDeductions' | translate }}</th
                ><th>{{ 'payroll.thNet' | translate }}</th
                ><th class="text-end">{{ 'payroll.thActions' | translate }}</th></tr
              ></thead
            >
            <tbody>
              <tr *ngFor="let s of pagedSalaryStructures">
                <td><strong>{{ s.teacherName }}</strong></td>
                <td>₹{{ s.basicSalary | number:'1.0-0':'en-IN' }}</td>
                <td style="color: var(--clr-success);">+₹{{ getAllowanceTotal(s) | number:'1.0-0':'en-IN' }}</td>
                <td style="color: var(--clr-danger);">-₹{{ getDeductionTotal(s) | number:'1.0-0':'en-IN' }}</td>
                <td><strong>₹{{ s.netSalary | number:'1.0-0':'en-IN' }}</strong></td>
                <td class="text-end">
                  <button type="button" class="btn-outline-erp btn-xs" (click)="openSalaryStructureEdit(s)" data-testid="payroll-edit-structure-btn">
                    <i class="bi bi-pencil"></i> {{ 'payroll.editStructure' | translate }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-erp-pagination
          *ngIf="structPaginationTotal > 0"
          [totalElements]="structPaginationTotal"
          [pageIndex]="structPageIndex"
          [pageSize]="structPageSize"
          (pageIndexChange)="onStructPageIndexChange($event)"
          (pageSizeChange)="onStructPageSizeChange($event)"
        />
      </div>

      <div class="erp-card animate-in" *ngIf="canManagePayrollDesk || isTeacher">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
          <div>
            <h4 class="erp-card-title mb-1">{{ isTeacher ? ('payroll.payslipsTitleTeacher' | translate) : ('payroll.payslipsTitleAdmin' | translate) }}</h4>
            <p class="text-muted small mb-0">{{ 'payroll.payslipsLead' | translate }}</p>
          </div>
        </div>
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>{{ 'payroll.thTeacher' | translate }}</th
                ><th>{{ 'payroll.thPeriod' | translate }}</th
                >                <th>{{ 'payroll.thNetSalary' | translate }}</th
                ><th>{{ 'payroll.thStatus' | translate }}</th
                ><th>{{ 'payroll.thSettlementMode' | translate }}</th
                ><th>{{ 'payroll.thPaidOn' | translate }}</th
                ><th class="text-end">{{ 'payroll.thActions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of pagedPayslips">
                <td><strong>{{ p.teacherName }}</strong></td>
                <td>{{ monthOptionLabel(p.month || '') }} {{ p.year }}</td>
                <td><strong>₹{{ p.netSalary | number:'1.0-0':'en-IN' }}</strong></td>
                <td>
                  <span class="badge-erp" [class.badge-neutral]="p.status === 'generated'" [class.badge-success]="p.status === 'paid'">{{ payslipStatusLabel(p.status) }}</span>
                </td>
                <td>
                  <span
                    *ngIf="p.status === 'paid'"
                    class="badge-erp"
                    [ngClass]="payslipSettlementBadgeClass(p)"
                    [attr.title]="'payroll.settlementModeHint' | translate"
                    >{{ payslipSettlementLabel(p) }}</span
                  >
                  <span *ngIf="p.status !== 'paid'" class="text-muted small">{{ 'payroll.settlementModePending' | translate }}</span>
                </td>
                <td>{{ p.paymentDate ? formatDate(p.paymentDate) : ('exams.dash' | translate) }}</td>
                <td class="text-end text-nowrap">
                  <button
                    type="button"
                    class="btn-outline-erp btn-xs me-1"
                    (click)="openPdf(p)"
                    [disabled]="pdfLoadingId === p.id || !canDownloadPayslipPdf(p)"
                    [attr.title]="!canDownloadPayslipPdf(p) && isTeacher ? ('payroll.pdfTeacherRequiresPaid' | translate) : null"
                  >
                    <i class="bi bi-file-pdf"></i> {{ 'payroll.pdf' | translate }}
                  </button>
                  <button *ngIf="canManagePayrollDesk && p.status === 'generated'" type="button" class="btn-primary-erp btn-xs" (click)="markPaid(p)" [disabled]="markingId === p.id">{{ 'payroll.markPaid' | translate }}</button>
                </td>
              </tr>
              <tr *ngIf="payslips.length === 0"><td colspan="7" class="text-center py-4">
                <div class="payroll-empty-state"><i class="bi bi-file-earmark-text"></i>{{ 'payroll.noPayslips' | translate }}</div>
              </td></tr>
            </tbody>
          </table>
          <app-erp-pagination
            *ngIf="payslipPaginationTotal > 0"
            [totalElements]="payslipPaginationTotal"
            [pageIndex]="payslipPageIndex"
            [pageSize]="payslipPageSize"
            (pageIndexChange)="onPayslipPageIndexChange($event)"
            (pageSizeChange)="onPayslipPageSizeChange($event)"
          />
        </div>
      </div>

      <div *ngIf="!canManagePayrollDesk && !isTeacher" class="erp-card text-muted text-center py-5">
        <i class="bi bi-lock" style="font-size: 2rem;"></i>
        <p class="mt-2 mb-0">{{ 'payroll.accessDenied' | translate }}</p>
      </div>

      <div class="modal-overlay" *ngIf="salaryStructureModal" (click)="closeSalaryStructureModal()">
        <div class="modal-content-erp modal-lg" style="max-width: 640px;" (click)="$event.stopPropagation()" data-testid="payroll-structure-modal">
          <div class="modal-header-erp">
            <h3>{{ (editingStructureId != null ? 'payroll.structureModalTitleEdit' : 'payroll.structureModalTitle') | translate }}</h3>
            <button type="button" class="btn-icon" (click)="closeSalaryStructureModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <p class="text-muted small mb-3">{{ 'payroll.structureModalLead' | translate }}</p>
            <label class="erp-label">{{ 'payroll.structureLabelTeacher' | translate }}</label>
            <select class="erp-select mb-3" [(ngModel)]="structureForm.teacherId" [disabled]="structureTeachersLoading || editingStructureId != null">
              <option [ngValue]="null">{{ 'payroll.structureSelectTeacher' | translate }}</option>
              <option *ngFor="let opt of structureTeacherOptions" [ngValue]="opt.id">{{ opt.name }}</option>
            </select>
            <p *ngIf="structureTeachersLoading" class="small text-muted mb-2">{{ 'payroll.structureLoadingTeachers' | translate }}</p>
            <p *ngIf="!structureTeachersLoading && !structureTeacherOptions.length" class="small text-warning mb-2">{{ 'payroll.structureNoTeachersLeft' | translate }}</p>

            <label class="erp-label">{{ 'payroll.structureLabelBasic' | translate }}</label>
            <input class="erp-input mb-3" type="number" min="1" step="1" [(ngModel)]="structureForm.basicSalary" erpI18nPh="payroll.structureBasicPh" />

            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="erp-label mb-0">{{ 'payroll.structureAllowances' | translate }}</label>
              <button type="button" class="btn-outline-erp btn-xs" (click)="addStructureAllowanceRow()"><i class="bi bi-plus"></i> {{ 'payroll.structureAddLine' | translate }}</button>
            </div>
            <div *ngFor="let row of structureForm.allowances; let i = index" class="row g-2 align-items-end mb-2">
              <div class="col-md-7">
                <input class="erp-input" [(ngModel)]="row.name" erpI18nPh="payroll.structureComponentNamePh" />
              </div>
              <div class="col-md-3">
                <input class="erp-input" type="number" min="0" step="1" [(ngModel)]="row.amount" placeholder="₹" />
              </div>
              <div class="col-md-2">
                <button type="button" class="btn-icon" (click)="removeStructureAllowanceRow(i)" [title]="'payroll.structureRemoveLine' | translate"><i class="bi bi-trash text-danger"></i></button>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2 mt-3">
              <label class="erp-label mb-0">{{ 'payroll.structureDeductions' | translate }}</label>
              <button type="button" class="btn-outline-erp btn-xs" (click)="addStructureDeductionRow()"><i class="bi bi-plus"></i> {{ 'payroll.structureAddLine' | translate }}</button>
            </div>
            <div *ngFor="let row of structureForm.deductions; let j = index" class="row g-2 align-items-end mb-2">
              <div class="col-md-7">
                <input class="erp-input" [(ngModel)]="row.name" erpI18nPh="payroll.structureComponentNamePh" />
              </div>
              <div class="col-md-3">
                <input class="erp-input" type="number" min="0" step="1" [(ngModel)]="row.amount" placeholder="₹" />
              </div>
              <div class="col-md-2">
                <button type="button" class="btn-icon" (click)="removeStructureDeductionRow(j)" [title]="'payroll.structureRemoveLine' | translate"><i class="bi bi-trash text-danger"></i></button>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-2 p-2 rounded-2" style="background: var(--clr-surface-muted); border: 1px solid var(--clr-border);">
              <strong>{{ 'payroll.structureDraftNet' | translate }}</strong>
              <strong style="color: var(--clr-primary); font-size: 18px;">₹{{ structureDraftNet | number:'1.0-0':'en-IN' }}</strong>
            </div>
            <p *ngIf="structureFormError" class="text-danger small mt-2 mb-0">{{ structureFormError }}</p>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closeSalaryStructureModal()">{{ 'payroll.structureCancel' | translate }}</button>
            <button
              type="button"
              class="btn-primary-erp"
              [disabled]="structureSaving || structureTeachersLoading || !structureTeacherOptions.length"
              (click)="saveSalaryStructure()"
            >
              {{ structureSaving ? ('payroll.structureSaving' | translate) : ('payroll.structureSave' | translate) }}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="payoutPreviewModal" (click)="closePayoutPreview()">
        <div class="modal-content-erp payroll-payout-modal" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ 'payroll.previewTitle' | translate }}</h3>
            <button type="button" class="btn-icon" (click)="closePayoutPreview()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp" *ngIf="payoutPreviewTarget as t">
            <p class="text-muted small mb-3">{{ 'payroll.previewLead' | translate }}</p>
            <div class="payroll-preview-steps mb-3">
              <div class="payroll-preview-step">
                <div class="payroll-preview-step__idx">1</div>
                <div>
                  <div class="fw-semibold">{{ 'payroll.previewStep1Title' | translate }}</div>
                  <div class="small text-muted">{{ 'payroll.previewStep1Body' | translate }}</div>
                </div>
              </div>
              <div class="payroll-preview-step">
                <div class="payroll-preview-step__idx">2</div>
                <div>
                  <div class="fw-semibold">{{ 'payroll.previewStep2Title' | translate }}</div>
                  <div class="small text-muted">{{ 'payroll.previewStep2Body' | translate }}</div>
                </div>
              </div>
              <div class="payroll-preview-step">
                <div class="payroll-preview-step__idx">3</div>
                <div>
                  <div class="fw-semibold">{{ 'payroll.previewStep3Title' | translate }}</div>
                  <div class="small text-muted">{{ 'payroll.previewStep3Body' | translate }}</div>
                </div>
              </div>
            </div>
            <div class="payroll-preview-summary">
              <div><span>{{ 'payroll.thTeacher' | translate }}:</span><strong>{{ t.teacherName }}</strong></div>
              <div><span>{{ 'payroll.payslipForPeriod' | translate: { month: monthOptionLabel(genMonth), year: genYear } }}:</span><strong>₹{{ (periodPayslipForTeacher(t.teacherId)?.netSalary || 0) | number:'1.0-0':'en-IN' }}</strong></div>
              <div><span>{{ 'payroll.labelPaymentRail' | translate }}:</span><strong>{{ disbursePaymentMethod }}</strong></div>
              <div><span>{{ 'payroll.account' | translate }}:</span><strong>{{ t.bankAccountMasked || ('exams.dash' | translate) }}</strong></div>
            </div>
            <label class="payroll-preview-ack mt-3">
              <input type="checkbox" [(ngModel)]="payoutPreviewAcknowledge" />
              <span>{{ 'payroll.previewAck' | translate }}</span>
            </label>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="closePayoutPreview()">{{ 'payroll.cancelPreview' | translate }}</button>
            <button type="button" class="btn-primary-erp" [disabled]="!payoutPreviewAcknowledge || !payoutPreviewTarget || disbursingTeacherId===payoutPreviewTarget.teacherId" (click)="confirmPayoutPreview()">
              {{ (payoutPreviewTarget && disbursingTeacherId===payoutPreviewTarget.teacherId) ? ('payroll.submitting' | translate) : ('payroll.confirmStartPayout' | translate) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .payroll-page {
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }
      .payroll-disburse-card {
        border: 1px solid color-mix(in srgb, var(--clr-primary) 18%, var(--clr-border));
        background: linear-gradient(135deg, color-mix(in srgb, var(--clr-surface) 92%, var(--clr-primary) 8%), var(--clr-surface));
        border-radius: 16px;
        box-shadow: var(--shadow-sm);
      }
      .payroll-period-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 10px;
      }
      .payroll-period-hint {
        margin: -10px 0 12px;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 8px;
        font-size: 12px;
        color: var(--clr-text-muted);
        max-width: 100%;
      }
      .payroll-period-hint--warn {
        color: color-mix(in srgb, var(--clr-danger) 82%, var(--clr-text) 18%);
      }
      .payroll-period-field {
        min-width: 160px;
      }
      .payroll-payslip-filter {
        width: 220px;
        min-width: 220px;
      }
      .payroll-period-field--year {
        min-width: 124px;
        max-width: 124px;
      }
      .payroll-period-control {
        width: 100%;
        height: 42px;
        min-height: 42px;
        border-radius: 14px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .payroll-period-btn {
        height: 42px;
        min-height: 42px;
        border-radius: 999px;
        padding: 0 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
      }
      .payroll-period-btn--primary {
        min-width: 218px;
      }
      .payroll-period-btn--secondary {
        min-width: 120px;
      }
      .payroll-flow-card {
        border: 1px solid color-mix(in srgb, var(--clr-border) 86%, var(--clr-primary) 14%);
        border-radius: 14px;
        box-shadow: var(--shadow-sm);
      }
      .payroll-flow-step-card,
      .payroll-queue-stat-card {
        border: 1px solid var(--clr-border-light);
        background: color-mix(in srgb, var(--clr-surface) 96%, var(--clr-primary) 4%);
      }
      .payroll-focus-panel {
        border: 1px solid var(--clr-border);
        background: var(--clr-surface-muted);
        border-radius: 14px;
      }
      .payroll-disburse-checklist {
        border-top: 1px dashed var(--clr-border);
        padding-top: 10px;
      }
      .payroll-disburse-checklist ul {
        margin: 0;
        padding-left: 1.1rem;
        display: grid;
        gap: 3px;
        font-size: 12px;
        color: var(--clr-text-muted);
      }
      .payroll-disburse-checklist li {
        line-height: 1.4;
      }
      .payroll-disburse-checklist li.is-ok {
        color: color-mix(in srgb, var(--clr-success) 84%, var(--clr-text) 16%);
      }
      .payroll-queue-card {
        border: 1px solid color-mix(in srgb, var(--clr-border) 84%, var(--clr-primary) 16%);
        border-radius: 16px;
        box-shadow: var(--shadow-sm);
      }
      .payroll-queue-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        width: 100%;
        max-width: 100%;
      }
      .payroll-queue-filters .btn-outline-erp.btn-xs {
        border-radius: 999px;
        font-weight: 700;
      }
      .payroll-queue-filters .btn-outline-erp.btn-xs.active {
        background: color-mix(in srgb, var(--clr-primary) 14%, var(--clr-surface));
        border-color: color-mix(in srgb, var(--clr-primary) 34%, var(--clr-border));
        color: color-mix(in srgb, var(--clr-primary) 78%, var(--clr-text));
      }
      .payroll-queue-filters .btn-outline-erp.btn-xs,
      .btn-outline-erp.btn-sm,
      .btn-primary-erp.btn-sm,
      .btn-primary-erp.btn-xs,
      .btn-outline-erp.btn-xs {
        transition: transform 140ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease;
      }
      .payroll-queue-filters .btn-outline-erp.btn-xs:hover,
      .btn-outline-erp.btn-sm:hover,
      .btn-primary-erp.btn-sm:hover,
      .btn-primary-erp.btn-xs:hover,
      .btn-outline-erp.btn-xs:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }
      .payroll-queue-filters .btn-outline-erp.btn-xs:active,
      .btn-outline-erp.btn-sm:active,
      .btn-primary-erp.btn-sm:active,
      .btn-primary-erp.btn-xs:active,
      .btn-outline-erp.btn-xs:active {
        transform: translateY(0);
      }
      .payroll-queue-filters .btn-outline-erp.btn-xs:focus-visible,
      .btn-outline-erp.btn-sm:focus-visible,
      .btn-primary-erp.btn-sm:focus-visible,
      .btn-primary-erp.btn-xs:focus-visible,
      .btn-outline-erp.btn-xs:focus-visible {
        outline: 0;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary) 34%, transparent);
      }
      .payroll-webhook-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 10.5px;
        border-radius: 999px;
        padding: 2px 8px;
        border: 1px solid color-mix(in srgb, var(--clr-info) 35%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-info) 10%, var(--clr-surface));
        color: color-mix(in srgb, var(--clr-info) 80%, var(--clr-text));
      }
      [data-theme='dark'] .payroll-disburse-card,
      [data-theme='dark'] .payroll-flow-card {
        border-color: color-mix(in srgb, var(--clr-primary) 22%, var(--clr-border));
        background: linear-gradient(
          145deg,
          color-mix(in srgb, var(--clr-surface) 95%, #0b1220),
          color-mix(in srgb, var(--clr-surface-alt) 96%, #0b1220)
        );
      }
      [data-theme='dark'] .payroll-flow-step-card,
      [data-theme='dark'] .payroll-queue-stat-card {
        border-color: color-mix(in srgb, var(--clr-primary) 22%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-surface) 94%, #0b1220);
      }
      [data-theme='dark'] .payroll-queue-filters .btn-outline-erp.btn-xs.active {
        background: color-mix(in srgb, var(--clr-primary) 24%, var(--clr-surface));
        border-color: color-mix(in srgb, var(--clr-primary) 40%, var(--clr-border));
        color: color-mix(in srgb, #ffffff 78%, var(--clr-primary) 22%);
      }
      [data-theme='dark'] .payroll-webhook-chip {
        border-color: color-mix(in srgb, var(--clr-info) 45%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-info) 22%, var(--clr-surface));
        color: color-mix(in srgb, #ffffff 78%, var(--clr-info) 22%);
      }
      .user-select-all {
        user-select: all;
        font-size: 12px;
      }
      .payroll-salary-table-wrap {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border: 1px solid var(--clr-border-light);
        border-radius: 12px;
      }
      .payroll-salary-table {
        width: max-content;
        min-width: 100%;
      }
      .payroll-salary-table th,
      .payroll-salary-table td {
        white-space: nowrap;
      }
      .erp-card-title {
        font-weight: 800;
        letter-spacing: 0.01em;
      }
      .table-responsive .erp-table thead th {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.035em;
        font-weight: 800;
      }
      .table-responsive .erp-table tbody td {
        font-size: 13px;
      }
      .btn-primary-erp.btn-xs,
      .btn-outline-erp.btn-xs {
        border-radius: 999px;
        font-weight: 700;
      }
      .payroll-empty-state {
        border: 1px dashed var(--clr-border);
        border-radius: 12px;
        padding: 12px 10px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 12.5px;
        color: var(--clr-text-muted);
        background: color-mix(in srgb, var(--clr-surface-muted) 68%, var(--clr-surface) 32%);
      }
      .payroll-empty-state i {
        color: color-mix(in srgb, var(--clr-primary) 72%, var(--clr-text-muted) 28%);
      }
      .payroll-payout-modal {
        width: min(96vw, 720px);
        max-width: 720px !important;
      }
      .payroll-preview-steps {
        display: grid;
        gap: 10px;
      }
      .payroll-preview-step {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 10px;
        align-items: start;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid var(--clr-border-light);
        background: color-mix(in srgb, var(--clr-surface) 96%, var(--clr-surface-muted) 4%);
      }
      .payroll-preview-step__idx {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
        border: 1px solid color-mix(in srgb, var(--clr-primary) 35%, var(--clr-border));
        background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
      }
      .payroll-preview-summary {
        border: 1px solid var(--clr-border-light);
        border-radius: 12px;
        padding: 10px 12px;
        background: var(--clr-surface);
        display: grid;
        gap: 6px;
      }
      .payroll-preview-summary > div {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 13px;
      }
      .payroll-preview-summary span {
        color: var(--clr-text-muted);
      }
      .payroll-preview-ack {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        font-size: 12.5px;
      }
      @media (max-width: 767.98px) {
        .payroll-period-toolbar {
          width: 100%;
        }
        .payroll-period-field,
        .payroll-period-field--year {
          min-width: 100%;
          max-width: 100%;
        }
        .payroll-period-btn,
        .payroll-period-btn--primary,
        .payroll-period-btn--secondary {
          width: 100%;
          min-width: 100%;
        }
        .payroll-payslip-filter {
          width: 100%;
          min-width: 100%;
        }
        .payroll-queue-filters .btn-outline-erp.btn-xs {
          flex: 1 1 calc(50% - 4px);
          justify-content: center;
          min-width: 0;
        }
        .payroll-offline-payout-hint .btn-outline-erp,
        .payroll-disburse-card .d-flex.justify-content-between .btn-outline-erp {
          width: 100%;
        }
        .payroll-salary-table th,
        .payroll-salary-table td {
          font-size: 12px;
          padding: 8px 10px;
        }
      }
    `
  ]
})
export class PayrollComponent implements OnInit {
  /** Full structures from API (or mocks) for payroll totals; table may be server-paged when live API. */
  private structuresForTotals: SalaryStructure[] = [];
  structTotalFromServer = 0;
  payslipTotalFromServer = 0;
  salaryStructures: SalaryStructure[] = [];
  pagedSalaryStructures: SalaryStructure[] = [];
  structPageIndex = 0;
  structPageSize = DEFAULT_ERP_PAGE_SIZE;
  paymentDetails: TeacherPaymentDetails[] = [];
  pagedPaymentDetails: TeacherPaymentDetails[] = [];
  payDetPageIndex = 0;
  payDetPageSize = DEFAULT_ERP_PAGE_SIZE;
  payslips: Payslip[] = [];
  pagedPayslips: Payslip[] = [];
  payslipPageIndex = 0;
  payslipPageSize = DEFAULT_ERP_PAGE_SIZE;
  genMonth = '';
  genYear = new Date().getFullYear();
  generating = false;
  genError = '';
  disburseInfo = '';
  queueError = '';
  disbursingTeacherId: number | null = null;
  queueUpdatingId: number | null = null;
  pdfLoadingId: string | null = null;
  markingId: string | null = null;
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  currentMonthYm = '';
  payslipFilterYm = '';

  canManagePayrollDesk = false;
  isTeacher = false;
  payrollFocusTeacherId: number | null = null;
  /** NETBANKING | UPI | NEFT | IMPS — sent to backend for reference prefix + audit. */
  disbursePaymentMethod = 'NETBANKING';
  queueAttempts: PayrollDisbursementAttempt[] = [];
  disbursementSummary: PayrollDisbursementSummary = {
    totalAttempts: 0,
    submittedCount: 0,
    completedCount: 0,
    failedCount: 0,
    submittedAmount: 0,
    completedAmount: 0,
    failedAmount: 0,
  };
  queueStatusFilter: '' | 'SUBMITTED' | 'COMPLETED' | 'FAILED' = '';
  queuePageIndex = 0;
  queuePageSize = DEFAULT_ERP_PAGE_SIZE;
  queuePaginationTotal = 0;
  payoutPreviewModal = false;
  payoutPreviewAcknowledge = false;
  payoutPreviewTarget: TeacherPaymentDetails | null = null;
  /** Mirrors Settings → Finance; when false, in-app transfer is hidden (backend also blocks). */
  payrollDigitalPayoutEnabled = false;
  financeProfileLoading = true;

  /** Fee-style modal: define basic + optional allowance/deduction lines for one teacher (per backend contract). */
  salaryStructureModal = false;
  /** When set, modal saves via {@link PayrollService.updateSalaryStructure} instead of create. */
  editingStructureId: number | null = null;
  salaryStructureSuccess = '';
  structureTeachersLoading = false;
  structureSaving = false;
  structureFormError = '';
  structureTeacherOptions: { id: number; name: string }[] = [];
  structureForm: {
    teacherId: number | null;
    basicSalary: number | null;
    allowances: { name: string; amount: number }[];
    deductions: { name: string; amount: number }[];
  } = {
    teacherId: null,
    basicSalary: null,
    allowances: [],
    deductions: [],
  };

  get structureDraftNet(): number {
    const b = Number(this.structureForm.basicSalary);
    if (!Number.isFinite(b) || b < 0) {
      return 0;
    }
    const allow = this.structureForm.allowances.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const ded = this.structureForm.deductions.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return Math.round(b + allow - ded);
  }

  get queueVarianceAmount(): number {
    return Math.max(0, (this.disbursementSummary.submittedAmount || 0) - (this.disbursementSummary.completedAmount || 0));
  }

  formatDate(raw: string | null | undefined): string {
    return formatDateDdMmYyyy(raw);
  }

  get bankReadyCount(): number {
    return this.paymentDetails.filter(d => d.bankDetailsComplete).length;
  }

  get generatedPayslipCount(): number {
    return this.payslips.filter(p => p.status === 'generated').length;
  }

  get paidPayslipCount(): number {
    return this.payslips.filter(p => p.status === 'paid').length;
  }

  get structPaginationTotal(): number {
    return runtimeConfig.useMocks ? this.salaryStructures.length : this.structTotalFromServer;
  }

  get structCountForStat(): number {
    return runtimeConfig.useMocks ? this.salaryStructures.length : this.structTotalFromServer;
  }

  get payslipPaginationTotal(): number {
    return runtimeConfig.useMocks ? this.payslips.length : this.payslipTotalFromServer;
  }

  private readonly destroyRef = inject(DestroyRef);
  private readonly uiAccess = inject(UiAccessService);

  private resolveUiErrorMessage(error: unknown, fallbackI18nKey: string): string {
    const fallback = this.translate.instant(fallbackI18nKey);
    if (!error || typeof error !== 'object') {
      return fallback;
    }
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
    return fallback;
  }

  constructor(
    private payrollService: PayrollService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    private router: Router,
    private teacherService: TeacherService
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.initializePeriodDefaults();

    const r = (this.auth.getNormalizedRole() ?? '').toLowerCase();
    this.isTeacher = r === 'teacher';
    this.canManagePayrollDesk = this.uiAccess.hasSchoolPayrollOfficeDesk();
    if (this.canManagePayrollDesk) {
      this.loadPayrollFinanceGate(true);
      this.loadAdminStructures();
      this.loadPaymentDetails();
      this.refreshDisbursementQueue();
    } else {
      this.financeProfileLoading = false;
    }
    this.refreshPayroll();
  }

  /**
   * @param showLoader only on first page load; refresh runs silently to avoid hiding payroll cards.
   */
  private loadPayrollFinanceGate(showLoader: boolean): void {
    if (showLoader) {
      this.financeProfileLoading = true;
    }
    this.settingsService.getFinanceProfile().subscribe({
      next: p => {
        this.payrollDigitalPayoutEnabled = !!p.payrollDigitalPayoutEnabled;
        this.financeProfileLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.payrollDigitalPayoutEnabled = false;
        this.financeProfileLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  goToPayrollFinanceSettings(): void {
    void this.router.navigate(['/app/settings'], { queryParams: { settingsTab: 'finance' } });
  }

  private initializePeriodDefaults(): void {
    const now = new Date();
    this.genMonth = this.monthNames[now.getMonth()];
    this.genYear = now.getFullYear();
    this.currentMonthYm = this.toYm(this.genYear, now.getMonth());
    this.payslipFilterYm = this.currentMonthYm;
  }

  onHeaderPeriodChanged(): void {
    this.payslipFilterYm = this.toYm(Number(this.genYear), this.monthNames.findIndex(m => m === this.genMonth));
  }

  onPayslipFilterMonthChange(ym: string): void {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      return;
    }
    const [yy, mm] = ym.split('-');
    const y = Number(yy);
    const mIdx = Number(mm) - 1;
    if (!Number.isInteger(y) || mIdx < 0 || mIdx > 11) {
      return;
    }
    this.genYear = y;
    this.genMonth = this.monthNames[mIdx];
    this.payslipPageIndex = 0;
    this.refreshPayroll();
  }

  private toYm(year: number, monthIndex: number): string {
    if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) {
      return '';
    }
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  }

  private loadAdminStructures(): void {
    if (!this.canManagePayrollDesk) return;
    if (runtimeConfig.useMocks) {
      this.payrollService.getStructures().subscribe(s => {
        this.salaryStructures = s;
        this.structuresForTotals = s;
        this.structPageIndex = 0;
        this.applyStructPage();
      });
      return;
    }
    forkJoin({
      totals: this.payrollService.getStructures(),
      page: this.payrollService.getStructuresPage(this.structPageIndex, this.structPageSize),
    }).subscribe({
      next: ({ totals, page }) => {
        this.structuresForTotals = totals;
        this.structTotalFromServer = page.totalElements;
        this.pagedSalaryStructures = page.content;
        this.structPageIndex = page.page;
        this.salaryStructures = totals;
      },
    });
  }

  private fetchStructuresPage(): void {
    if (!this.canManagePayrollDesk || runtimeConfig.useMocks) {
      this.applyStructPage();
      return;
    }
    this.payrollService.getStructuresPage(this.structPageIndex, this.structPageSize).subscribe(p => {
      this.structTotalFromServer = p.totalElements;
      this.pagedSalaryStructures = p.content;
      this.structPageIndex = p.page;
    });
  }

  private fetchPayslipsPage(): void {
    const y = Number(this.genYear);
    const req$ =
      this.isTeacher && !this.canManagePayrollDesk
        ? this.payrollService.listMyPayslipsPage(this.payslipPageIndex, this.payslipPageSize, y, this.genMonth)
        : this.payrollService.listPayslipsPage(this.payslipPageIndex, this.payslipPageSize, y, this.genMonth);
    req$.subscribe(p => {
      this.payslipTotalFromServer = p.totalElements;
      this.pagedPayslips = p.content;
      this.payslipPageIndex = p.page;
    });
  }

  loadPaymentDetails(): void {
    if (!this.canManagePayrollDesk) return;
    this.payrollService.getTeacherPaymentDetails().subscribe(d => {
      this.paymentDetails = d;
      this.payDetPageIndex = 0;
      this.applyPayDetPage();
      if (this.payrollFocusTeacherId != null && !d.some(x => x.teacherId === this.payrollFocusTeacherId)) {
        this.payrollFocusTeacherId = null;
      }
    });
  }

  private applyStructPage(): void {
    const slice = sliceToPage(this.salaryStructures, this.structPageIndex, this.structPageSize);
    this.pagedSalaryStructures = slice.content;
    this.structPageIndex = slice.page;
  }

  onStructPageIndexChange(idx: number): void {
    this.structPageIndex = idx;
    if (runtimeConfig.useMocks) this.applyStructPage();
    else this.fetchStructuresPage();
  }

  onStructPageSizeChange(size: number): void {
    this.structPageSize = size;
    this.structPageIndex = 0;
    if (runtimeConfig.useMocks) this.applyStructPage();
    else this.fetchStructuresPage();
  }

  private applyPayDetPage(): void {
    const slice = sliceToPage(this.paymentDetails, this.payDetPageIndex, this.payDetPageSize);
    this.pagedPaymentDetails = slice.content;
    this.payDetPageIndex = slice.page;
  }

  onPayDetPageIndexChange(idx: number): void {
    this.payDetPageIndex = idx;
    this.applyPayDetPage();
  }

  onPayDetPageSizeChange(size: number): void {
    this.payDetPageSize = size;
    this.payDetPageIndex = 0;
    this.applyPayDetPage();
  }

  private applyPayslipPage(): void {
    const slice = sliceToPage(this.payslips, this.payslipPageIndex, this.payslipPageSize);
    this.pagedPayslips = slice.content;
    this.payslipPageIndex = slice.page;
  }

  onPayslipPageIndexChange(idx: number): void {
    this.payslipPageIndex = idx;
    if (runtimeConfig.useMocks) this.applyPayslipPage();
    else this.fetchPayslipsPage();
  }

  onPayslipPageSizeChange(size: number): void {
    this.payslipPageSize = size;
    this.payslipPageIndex = 0;
    if (runtimeConfig.useMocks) this.applyPayslipPage();
    else this.fetchPayslipsPage();
  }

  get payrollFocusDetail(): TeacherPaymentDetails | null {
    if (this.payrollFocusTeacherId == null) return null;
    return this.paymentDetails.find(d => d.teacherId === this.payrollFocusTeacherId) ?? null;
  }

  get totalPayroll(): number {
    const src = runtimeConfig.useMocks ? this.salaryStructures : this.structuresForTotals;
    return src.reduce((sum, s) => sum + s.netSalary, 0);
  }

  getAllowanceTotal(s: SalaryStructure): number {
    return s.allowances.reduce((sum, a) => sum + a.amount, 0);
  }

  getDeductionTotal(s: SalaryStructure): number {
    return s.deductions.reduce((sum, d) => sum + d.amount, 0);
  }

  periodPayslipForTeacher(teacherId: number): Payslip | undefined {
    const y = Number(this.genYear);
    const m = this.genMonth.trim().toLowerCase();
    return this.payslips.find(
      p =>
        p.teacherId === teacherId &&
        p.year === y &&
        (p.month || '').trim().toLowerCase() === m
    );
  }

  private generatedPayslipForTeacher(teacherId: number): Payslip | undefined {
    const period = this.periodPayslipForTeacher(teacherId);
    return period?.status === 'generated' ? period : undefined;
  }

  canInitiateDisburse(d: TeacherPaymentDetails): boolean {
    if (!this.payrollDigitalPayoutEnabled || this.financeProfileLoading) {
      return false;
    }
    if (!d.bankDetailsComplete) return false;
    if (!this.hasBankBasics(d) || !this.hasValidIfsc(d)) return false;
    return !!this.generatedPayslipForTeacher(d.teacherId);
  }

  runDisburse(d: TeacherPaymentDetails): void {
    this.disburseInfo = '';
    this.genError = '';
    const periodError = this.payrollActionPeriodError();
    if (periodError) {
      this.genError = periodError;
      return;
    }
    if (!this.canInitiateDisburse(d)) return;
    this.disbursingTeacherId = d.teacherId;
    this.payrollService
      .initiateDisbursement(d.teacherId, this.genMonth, Number(this.genYear), this.disbursePaymentMethod)
      .subscribe({
      next: res => {
        this.disbursingTeacherId = null;
        const rail = res.paymentMethod ? `${res.paymentMethod} · ` : '';
        this.disburseInfo = this.translate.instant('payroll.disburseSuccess', {
          rail,
          referenceId: res.referenceId,
          amount: res.amount.toLocaleString('en-IN'),
          name: res.teacherName,
        });
        this.refreshDisbursementQueue();
      },
      error: (error: unknown) => {
        this.disbursingTeacherId = null;
        this.genError = this.resolveDisburseErrorMessage(error);
      }
    });
  }

  openDisbursePreview(d: TeacherPaymentDetails): void {
    this.genError = '';
    const periodError = this.payrollActionPeriodError();
    if (periodError) {
      this.genError = periodError;
      return;
    }
    if (!this.canInitiateDisburse(d)) {
      this.genError = `${this.translate.instant('payroll.disburseBlockedPrefix')} ${this.disburseReadinessIssues(d).join(' ')}`.trim();
      return;
    }
    this.payoutPreviewTarget = d;
    this.payoutPreviewAcknowledge = false;
    this.payoutPreviewModal = true;
  }

  closePayoutPreview(): void {
    this.payoutPreviewModal = false;
    this.payoutPreviewAcknowledge = false;
    this.payoutPreviewTarget = null;
  }

  confirmPayoutPreview(): void {
    if (!this.payoutPreviewTarget || !this.payoutPreviewAcknowledge) {
      return;
    }
    const target = this.payoutPreviewTarget;
    this.closePayoutPreview();
    this.runDisburse(target);
  }

  hasBankBasics(d: TeacherPaymentDetails): boolean {
    return !!(d.bankAccountHolder?.trim() && d.bankName?.trim() && d.bankAccountMasked?.trim());
  }

  hasValidIfsc(d: TeacherPaymentDetails): boolean {
    const ifsc = (d.bankIfsc || '').trim().toUpperCase();
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  }

  disburseReadinessIssues(d: TeacherPaymentDetails): string[] {
    const issues: string[] = [];
    if (!this.hasBankBasics(d)) {
      issues.push(this.translate.instant('payroll.disburseFixBankHint'));
    }
    if (!this.hasValidIfsc(d)) {
      issues.push(this.translate.instant('payroll.disburseFixIfscHint'));
    }
    const periodPayslip = this.periodPayslipForTeacher(d.teacherId);
    if (!periodPayslip) {
      issues.push(this.translate.instant('payroll.generateFirst'));
    } else if (periodPayslip.status === 'paid') {
      issues.push(this.translate.instant('payroll.salaryAlreadyDisbursed'));
    }
    return issues;
  }

  isSalaryAlreadyDisbursed(d: TeacherPaymentDetails): boolean {
    return this.periodPayslipForTeacher(d.teacherId)?.status === 'paid';
  }

  private resolveDisburseErrorMessage(error: unknown): string {
    const raw = this.resolveUiErrorMessage(error, 'payroll.genDisburseError');
    const msg = raw.toLowerCase();
    if (msg.includes('bank account number')) {
      return `${raw} ${this.translate.instant('payroll.disburseInvalidAccountHint')}`;
    }
    if (msg.includes('ifsc')) {
      return `${raw} ${this.translate.instant('payroll.disburseFixIfscHint')}`;
    }
    return raw;
  }

  refreshPayroll(): void {
    this.genError = '';
    this.disburseInfo = '';
    const y = Number(this.genYear);
    if (this.canManagePayrollDesk) {
      this.loadPayrollFinanceGate(false);
      this.structPageIndex = 0;
      this.loadAdminStructures();
      this.loadPaymentDetails();
      this.refreshDisbursementQueue();
    }
    const full$ =
      this.isTeacher && !this.canManagePayrollDesk
        ? this.payrollService.listMyPayslips(y, this.genMonth)
        : this.payrollService.listPayslips(y, this.genMonth);
    if (runtimeConfig.useMocks) {
      full$.subscribe(p => {
        this.payslips = p;
        this.payslipPageIndex = 0;
        this.applyPayslipPage();
      });
      return;
    }
    this.payslipPageIndex = 0;
    forkJoin({
      full: full$,
      page:
        this.isTeacher && !this.canManagePayrollDesk
          ? this.payrollService.listMyPayslipsPage(0, this.payslipPageSize, y, this.genMonth)
          : this.payrollService.listPayslipsPage(0, this.payslipPageSize, y, this.genMonth),
    }).subscribe({
      next: ({ full, page }) => {
        this.payslips = full;
        this.payslipTotalFromServer = page.totalElements;
        this.pagedPayslips = page.content;
        this.payslipPageIndex = page.page;
      },
    });
  }

  runGenerate(): void {
    this.genError = '';
    if (!this.genMonth || !this.genMonth.trim()) {
      this.genError = this.translate.instant('payroll.errMonthRequired');
      return;
    }
    const periodError = this.payrollActionPeriodError();
    if (periodError) {
      this.genError = periodError;
      return;
    }
    this.generating = true;
    this.payrollService.generatePayslips(this.genMonth, this.genYear).subscribe({
      next: () => {
        this.generating = false;
        this.refreshPayroll();
      },
      error: (error: unknown) => {
        this.generating = false;
        this.genError = this.resolveUiErrorMessage(error, 'payroll.genPayslipError');
      }
    });
  }

  /** Admin generate / disburse: backend only allows current or previous calendar month. */
  private isValidPayrollActionPeriod(month: string, year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    if (!month || !month.trim()) {
      return false;
    }
    if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
      return false;
    }
    const monthKey = month.trim().toLowerCase();
    const monthIdx = this.monthNames.findIndex(m => m.toLowerCase() === monthKey);
    if (monthIdx < 0) {
      return false;
    }
    const selectedSerial = year * 12 + monthIdx;
    const currentSerial = currentYear * 12 + currentMonthIndex;
    const minAllowedSerial = currentSerial - 1;
    return selectedSerial <= currentSerial && selectedSerial >= minAllowedSerial;
  }

  /** Month filter for payslip grid: any past month up to today. */
  private isValidListingPayrollPeriod(month: string, year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    if (!month || !month.trim()) {
      return false;
    }
    if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
      return false;
    }
    const monthKey = month.trim().toLowerCase();
    const monthIdx = this.monthNames.findIndex(m => m.toLowerCase() === monthKey);
    if (monthIdx < 0) {
      return false;
    }
    const selectedSerial = year * 12 + monthIdx;
    const currentSerial = currentYear * 12 + now.getMonth();
    return selectedSerial <= currentSerial;
  }

  payrollPeriodValidationMessage(): string {
    if (!this.genMonth || !this.genMonth.trim()) {
      return this.translate.instant('payroll.errMonthRequired');
    }
    const year = Number(this.genYear);
    if (!Number.isInteger(year) || year < 2000) {
      return this.translate.instant('payroll.errYearRange');
    }
    if (this.isValidListingPayrollPeriod(this.genMonth, year)) {
      return '';
    }
    const selectedMonthIdx = this.monthNames.findIndex(m => m.toLowerCase() === this.genMonth.trim().toLowerCase());
    if (selectedMonthIdx < 0) {
      return this.translate.instant('payroll.errPeriodInvalid');
    }
    const now = new Date();
    const selectedSerial = year * 12 + selectedMonthIdx;
    const currentSerial = now.getFullYear() * 12 + now.getMonth();
    if (selectedSerial > currentSerial) {
      return this.translate.instant('payroll.errFuturePeriodNotAllowed');
    }
    return this.translate.instant('payroll.errYearRange');
  }

  payrollActionPeriodError(): string {
    if (!this.genMonth || !this.genMonth.trim()) {
      return this.translate.instant('payroll.errMonthRequired');
    }
    const year = Number(this.genYear);
    if (!Number.isInteger(year) || year < 2000) {
      return this.translate.instant('payroll.errYearRange');
    }
    if (this.isValidPayrollActionPeriod(this.genMonth, year)) {
      return '';
    }
    const selectedMonthIdx = this.monthNames.findIndex(m => m.toLowerCase() === this.genMonth.trim().toLowerCase());
    if (selectedMonthIdx < 0) {
      return this.translate.instant('payroll.errPeriodInvalid');
    }
    const now = new Date();
    const selectedSerial = year * 12 + selectedMonthIdx;
    const currentSerial = now.getFullYear() * 12 + now.getMonth();
    if (selectedSerial > currentSerial) {
      return this.translate.instant('payroll.errFuturePeriodNotAllowed');
    }
    return this.translate.instant('payroll.errHistoryWindow');
  }

  canDownloadPayslipPdf(p: Payslip): boolean {
    if (this.canManagePayrollDesk) {
      return true;
    }
    if (this.isTeacher) {
      return (p.status || '').toLowerCase() === 'paid';
    }
    return true;
  }

  openPdf(p: Payslip): void {
    if (!this.canDownloadPayslipPdf(p)) {
      return;
    }
    this.pdfLoadingId = p.id;
    this.payrollService.downloadPayslipPdf(p.id).subscribe({
      next: blob => {
        this.pdfLoadingId = null;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => (this.pdfLoadingId = null)
    });
  }

  monthOptionLabel(monthEn: string): string {
    const key = 'payroll.months.' + monthEn.trim().toLowerCase();
    const t = this.translate.instant(key);
    return t !== key ? t : monthEn;
  }

  payslipStatusLabel(status: string | undefined): string {
    const k = (status ?? '').toLowerCase();
    const key = `payroll.payslip.${k}`;
    const t = this.translate.instant(key);
    return t !== key ? t : (status ?? '');
  }

  payslipSettlementLabel(p: Payslip): string {
    if (p.status !== 'paid') {
      return '';
    }
    const m = (p.salarySettlementMode || '').toUpperCase();
    if (m === 'DIGITAL_PAYOUT') {
      return this.translate.instant('payroll.settlementModeDigital');
    }
    if (m === 'OFFLINE_RECORDED') {
      return this.translate.instant('payroll.settlementModeOffline');
    }
    return this.translate.instant('payroll.settlementModeLegacy');
  }

  payslipSettlementBadgeClass(p: Payslip): string {
    const m = (p.salarySettlementMode || '').toUpperCase();
    if (m === 'DIGITAL_PAYOUT') {
      return 'badge-success';
    }
    if (m === 'OFFLINE_RECORDED') {
      return 'badge-info';
    }
    return 'badge-warning';
  }

  markPaid(p: Payslip): void {
    this.confirmDialog
      .confirm({
        title: this.translate.instant('payroll.confirmMarkPaidTitle'),
        message: this.translate.instant('payroll.confirmMarkPaidMessage', {
          name: p.teacherName,
          month: this.monthOptionLabel(p.month || ''),
          year: p.year,
        }),
        details: [
          p.netSalary != null
            ? this.translate.instant('payroll.detailNet', { amount: String(p.netSalary) })
            : undefined,
          p.status ? this.translate.instant('payroll.detailStatus', { status: this.payslipStatusLabel(p.status) }) : undefined,
          this.translate.instant('payroll.confirmMarkPaidDetailOffline'),
        ].filter((x): x is string => !!x),
        variant: 'primary',
        confirmLabel: this.translate.instant('payroll.confirmMarkPaidOk'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.markingId = p.id;
        this.payrollService.markPayslipPaid(p.id).subscribe({
          next: () => {
            this.markingId = null;
            this.refreshPayroll();
          },
          error: () => (this.markingId = null),
        });
      });
  }

  refreshDisbursementQueue(): void {
    if (!this.canManagePayrollDesk) return;
    this.queueError = '';
    this.fetchQueueSummary();
    this.fetchQueueAttempts();
  }

  setQueueFilter(next: '' | 'SUBMITTED' | 'COMPLETED' | 'FAILED'): void {
    this.queueStatusFilter = next;
    this.queuePageIndex = 0;
    this.fetchQueueAttempts();
  }

  onQueuePageIndexChange(idx: number): void {
    this.queuePageIndex = idx;
    this.fetchQueueAttempts();
  }

  onQueuePageSizeChange(size: number): void {
    this.queuePageSize = size;
    this.queuePageIndex = 0;
    this.fetchQueueAttempts();
  }

  private fetchQueueSummary(): void {
    this.payrollService.getDisbursementSummary().subscribe({
      next: summary => (this.disbursementSummary = summary),
    });
  }

  private fetchQueueAttempts(): void {
    this.payrollService.getDisbursementAttemptsPage(this.queuePageIndex, this.queuePageSize, this.queueStatusFilter || undefined).subscribe({
      next: page => {
        this.queueAttempts = page.content || [];
        this.queuePaginationTotal = page.totalElements || 0;
        this.queuePageIndex = page.page || 0;
      },
      error: (error: unknown) => {
        this.queueError = this.resolveUiErrorMessage(error, 'payroll.queueUpdateFailed');
        this.queueAttempts = [];
      },
    });
  }

  updateQueueStatus(attempt: PayrollDisbursementAttempt, next: 'COMPLETED' | 'FAILED'): void {
    const isComplete = next === 'COMPLETED';
    this.confirmDialog
      .confirm({
        title: isComplete ? this.translate.instant('payroll.confirmSettleTitle') : this.translate.instant('payroll.confirmFailTitle'),
        message: isComplete
          ? this.translate.instant('payroll.confirmSettleMessage', { name: attempt.teacherName || '-' })
          : this.translate.instant('payroll.confirmFailMessage', { name: attempt.teacherName || '-' }),
        details: [
          this.translate.instant('payroll.queueRef') + `: ${attempt.referenceId || '-'}`,
          this.translate.instant('payroll.thNetSalary') + `: ₹${Number(attempt.amount || 0).toLocaleString('en-IN')}`,
        ],
        variant: isComplete ? 'primary' : 'warning',
        confirmLabel: isComplete ? this.translate.instant('payroll.markSettled') : this.translate.instant('payroll.markFailed'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.queueUpdatingId = attempt.id;
        this.payrollService.updateDisbursementStatus(attempt.id, next).subscribe({
          next: () => {
            this.queueUpdatingId = null;
            this.refreshDisbursementQueue();
            this.refreshPayroll();
          },
          error: (error: unknown) => {
            this.queueUpdatingId = null;
            this.queueError = this.resolveUiErrorMessage(error, 'payroll.queueUpdateFailed');
          },
        });
      });
  }

  openSalaryStructureModal(): void {
    if (!this.canManagePayrollDesk) {
      return;
    }
    this.editingStructureId = null;
    this.salaryStructureSuccess = '';
    this.structureFormError = '';
    this.resetSalaryStructureForm();
    this.salaryStructureModal = true;
    this.structureTeachersLoading = true;
    this.structureTeacherOptions = [];
    const assigned = new Set([...this.structuresForTotals, ...this.salaryStructures].map(s => s.teacherId));
    this.teacherService.getTeachers().subscribe({
      next: teachers => {
        this.structureTeacherOptions = (teachers || [])
          .filter(t => (t.status || 'active') === 'active')
          .filter(t => !assigned.has(t.id))
          .map(t => ({
            id: t.id,
            name:
              `${(t.firstName || '').trim()} ${(t.lastName || '').trim()}`.trim() ||
              (t.email || '').trim() ||
              `Teacher #${t.id}`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        this.structureTeachersLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.structureTeachersLoading = false;
        this.structureFormError = this.translate.instant('payroll.structureLoadTeachersError');
        this.cdr.markForCheck();
      },
    });
    this.cdr.markForCheck();
  }

  closeSalaryStructureModal(): void {
    this.salaryStructureModal = false;
    this.editingStructureId = null;
    this.structureFormError = '';
    this.structureTeachersLoading = false;
  }

  openSalaryStructureEdit(row: SalaryStructure): void {
    if (!this.canManagePayrollDesk) {
      return;
    }
    this.salaryStructureSuccess = '';
    this.structureFormError = '';
    this.editingStructureId = row.id;
    this.structureForm = {
      teacherId: row.teacherId,
      basicSalary: row.basicSalary,
      allowances: (row.allowances ?? []).map(a => ({ name: a.name, amount: a.amount })),
      deductions: (row.deductions ?? []).map(d => ({ name: d.name, amount: d.amount })),
    };
    this.structureTeacherOptions = [
      {
        id: row.teacherId,
        name: row.teacherName?.trim() || `Teacher #${row.teacherId}`,
      },
    ];
    this.structureTeachersLoading = false;
    this.salaryStructureModal = true;
    this.cdr.markForCheck();
  }

  private resetSalaryStructureForm(): void {
    this.structureForm = {
      teacherId: null,
      basicSalary: null,
      allowances: [],
      deductions: [],
    };
  }

  addStructureAllowanceRow(): void {
    this.structureForm.allowances = [...this.structureForm.allowances, { name: '', amount: 0 }];
  }

  addStructureDeductionRow(): void {
    this.structureForm.deductions = [...this.structureForm.deductions, { name: '', amount: 0 }];
  }

  removeStructureAllowanceRow(index: number): void {
    this.structureForm.allowances = this.structureForm.allowances.filter((_, i) => i !== index);
  }

  removeStructureDeductionRow(index: number): void {
    this.structureForm.deductions = this.structureForm.deductions.filter((_, i) => i !== index);
  }

  saveSalaryStructure(): void {
    this.structureFormError = '';
    const tid = this.structureForm.teacherId;
    if (tid == null) {
      this.structureFormError = this.translate.instant('payroll.structureErrTeacher');
      return;
    }
    const basic = Number(this.structureForm.basicSalary);
    if (!Number.isFinite(basic) || basic <= 0) {
      this.structureFormError = this.translate.instant('payroll.structureErrBasic');
      return;
    }
    const pick = this.structureTeacherOptions.find(o => o.id === tid);
    const teacherName = pick?.name?.trim() || '';
    const allow = this.structureForm.allowances
      .map(r => ({ name: (r.name || '').trim(), amount: Number(r.amount) || 0 }))
      .filter(r => r.name.length > 0 && r.amount >= 0);
    const ded = this.structureForm.deductions
      .map(r => ({ name: (r.name || '').trim(), amount: Number(r.amount) || 0 }))
      .filter(r => r.name.length > 0 && r.amount >= 0);
    for (const r of allow) {
      if (r.amount < 0) {
        this.structureFormError = this.translate.instant('payroll.structureErrNegative');
        return;
      }
    }
    for (const r of ded) {
      if (r.amount < 0) {
        this.structureFormError = this.translate.instant('payroll.structureErrNegative');
        return;
      }
    }
    this.structureSaving = true;
    const payload = {
      teacherId: tid,
      teacherName,
      basicSalary: basic,
      allowances: allow,
      deductions: ded,
    };
    const req =
      this.editingStructureId != null
        ? this.payrollService.updateSalaryStructure(this.editingStructureId, payload)
        : this.payrollService.createSalaryStructure(payload);
    req.subscribe({
      next: () => {
        this.structureSaving = false;
        this.salaryStructureModal = false;
        this.editingStructureId = null;
        this.salaryStructureSuccess = this.translate.instant('payroll.structureSaved');
        this.refreshPayroll();
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.structureSaving = false;
        this.structureFormError = this.resolveUiErrorMessage(err, 'payroll.structureSaveFailed');
        this.cdr.markForCheck();
      },
    });
  }

  disbursementStatusLabel(status: string): string {
    const key = `payroll.disbursementStatus.${(status || '').toUpperCase()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : status;
  }

  isWebhookSyncedAttempt(attempt: PayrollDisbursementAttempt): boolean {
    const msg = (attempt.lastMessage || '').toLowerCase();
    return msg.includes('event') || msg.includes('razorpayx') || msg.includes('payload');
  }

  webhookStatusTooltip(attempt: PayrollDisbursementAttempt): string {
    const detail = (attempt.lastMessage || '').trim();
    const prefix = this.translate.instant('payroll.webhookSyncedTooltip');
    if (!detail) return prefix;
    return `${prefix}: ${detail.length > 120 ? detail.slice(0, 120) + '...' : detail}`;
  }

}
