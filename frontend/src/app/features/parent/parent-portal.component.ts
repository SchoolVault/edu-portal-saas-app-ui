import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { ParentService } from '../../core/services/parent.service';
import { openRazorpaySchoolFeeCheckout, PAYMENT_PROVIDER_IDS } from '../../core/payment';
import { runtimeConfig } from '../../core/config/runtime-config';
import {
  AttendanceRecord,
  AttendanceStats,
  CheckoutSession,
  FeePayment,
  MarkRecord,
  ParentFeeObligation,
  PaymentReceipt,
  Student,
} from '../../core/models/models';
import { coerceApiLongId } from '../../core/utils/coerce-api-long-id';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpMonthPickerComponent } from '../../shared/erp-month-picker/erp-month-picker.component';
import {
  parentFeePaymentMethodOptions,
  type ParentFeePaymentMethodOption,
} from './parent-fee-payment.providers';
import {
  cssClassForTone,
  toneClassForAmountHigherWorse,
  toneClassForCountHigherBetter,
  toneClassForPercent,
} from '../../core/ui/metric-tone';

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ErpDatePickerComponent,
    ErpMonthPickerComponent,
    TranslateModule,
  ],
  styles: [
    `
      .parent-payment-activity .parent-receipt-scroll {
        max-height: 320px;
        overflow-y: auto;
        border: 1px solid var(--clr-border-light);
        border-radius: var(--radius-md);
        background: var(--clr-surface-alt);
      }
      .parent-receipt-row {
        padding: 10px 12px;
        border-bottom: 1px solid var(--clr-border-light);
        background: var(--clr-surface);
      }
      .parent-receipt-row:last-child {
        border-bottom: none;
      }
      .payment-method-tile {
        cursor: pointer;
        border: 2px solid var(--clr-border-light);
        border-radius: var(--radius-lg);
        background: var(--clr-surface);
        box-shadow: var(--shadow-sm);
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        width: 100%;
        text-align: left;
        padding: 1rem;
        color: inherit;
        font: inherit;
      }
      .payment-method-tile:hover {
        border-color: color-mix(in srgb, var(--clr-text-muted) 55%, var(--clr-border-light));
      }
      .payment-method-tile:focus-visible {
        outline: 2px solid var(--clr-accent);
        outline-offset: 2px;
      }
      .payment-method-tile--selected {
        border-color: var(--clr-accent);
        background: color-mix(in srgb, var(--clr-accent) 10%, var(--clr-surface));
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-accent) 45%, transparent), var(--shadow-sm);
      }
      [data-theme='dark'] .payment-method-tile--selected {
        background: color-mix(in srgb, var(--clr-accent) 18%, var(--clr-surface));
      }
      .payment-method-tile__check {
        color: var(--clr-accent);
        font-size: 1.25rem;
        line-height: 1;
      }
      .erp-input--invalid {
        border-color: var(--clr-danger) !important;
      }
      .stat-card.metric-tone--danger .stat-value {
        color: var(--clr-danger);
        font-weight: 800;
      }
      .stat-card.metric-tone--warn .stat-value {
        color: var(--clr-warning);
        font-weight: 800;
      }
      .stat-card.metric-tone--ok .stat-value {
        color: var(--clr-success);
        font-weight: 800;
      }
      a.stat-card.stat-card--clickable:hover {
        border-color: color-mix(in srgb, var(--clr-accent) 35%, var(--clr-border-light));
        box-shadow: var(--shadow-md);
      }
    `,
  ],
  template: `
    <div data-testid="parent-portal-page">
      <div class="d-flex justify-content-between align-items-start mb-4 animate-in flex-wrap gap-2">
        <div class="flex-grow-1 min-w-0">
          <h2 class="mb-1 lh-sm" style="font-size: 24px; font-weight: 800;">{{ 'parentPortal.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0 lh-sm" style="font-size: 13px;">{{ 'parentPortal.childrenPageSubtitle' | translate }}</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm flex-shrink-0 align-self-start" (click)="refreshPortal()"><i class="bi bi-arrow-clockwise"></i> {{ 'parentPortal.refresh' | translate }}</button>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="erp-label">{{ 'parentPortal.labelChild' | translate }}</label>
            <select class="erp-select" [(ngModel)]="selectedStudentId" (change)="onStudentChange()">
              <option [ngValue]="null">{{ 'parentPortal.selectChild' | translate }}</option>
              <option *ngFor="let child of children" [ngValue]="child.id">
                {{ child.firstName }} {{ child.lastName }} - {{ child.className || (('parentPortal.classFallback' | translate: { id: child.classId })) }}
              </option>
            </select>
          </div>
          <div class="col-md-5 col-lg-4">
            <label class="erp-label">{{ 'parentPortal.labelAttendanceMonth' | translate }}</label>
            <app-erp-month-picker
              class="w-100"
              [placeholder]="'parentPortal.attendanceMonthPlaceholder' | translate"
              [(ngModel)]="attendanceMonthYm"
              (ngModelChange)="onAttendanceMonthChange()"
              [maxYm]="maxAttendanceMonthYm"
            />
          </div>
        </div>
      </div>

      <div *ngIf="selectedChild" class="animate-in animate-in-delay-2">
        <div class="row g-4 mb-4">
          <div class="col-md-3">
            <div class="stat-card" [ngClass]="attendancePctToneClass()">
              <div class="stat-value">{{ attendanceStats.attendancePercentage | number:'1.0-1' }}%</div>
              <div class="stat-label">{{ 'parentPortal.statAttendanceRate' | translate }}</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card" [ngClass]="presentDaysToneClass()">
              <div class="stat-value">{{ attendanceStats.present }}</div>
              <div class="stat-label">{{ 'parentPortal.statDaysPresent' | translate }}</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card" [ngClass]="feesPendingToneClass()">
              <div class="stat-value">{{ totalPending | number:'1.0-0' }}</div>
              <div class="stat-label">{{ 'parentPortal.statFeesPending' | translate }}</div>
            </div>
          </div>
          <div class="col-md-3">
            <a
              class="stat-card stat-card--clickable text-decoration-none text-reset d-block h-100"
              [ngClass]="publishedResultsToneClass()"
              [routerLink]="['/app/exams']"
              [queryParams]="examsDeepLinkParams"
              [attr.aria-label]="'parentPortal.resultsTileAria' | translate"
            >
              <div class="stat-value">{{ marks.length }}</div>
              <div class="stat-label">{{ 'parentPortal.resultsTitle' | translate }}</div>
            </a>
          </div>
        </div>

        <div class="erp-card mb-3 p-3 d-flex flex-wrap align-items-center justify-content-between gap-2" style="background: var(--clr-surface-alt); border: 1px solid var(--clr-border-light);">
          <p class="small text-muted mb-0" style="max-width: 42rem;">
            <strong>{{ 'parentPortal.examsBannerBefore' | translate }}</strong> <strong>{{ 'parentPortal.leadExams' | translate }}</strong>{{ 'parentPortal.examsBannerMid' | translate }}
            <strong>{{ 'parentPortal.examsBannerTimetable' | translate }}</strong> {{ 'parentPortal.examsBannerAnd' | translate }}
            <strong>{{ 'parentPortal.examsBannerResults' | translate }}</strong> {{ 'parentPortal.examsBannerAfter' | translate }}
          </p>
          <a [routerLink]="['/app/exams']" [queryParams]="examsDeepLinkParams" class="btn-primary-erp btn-sm text-decoration-none">{{ 'parentPortal.openExams' | translate }}</a>
        </div>

        <div class="erp-tabs mb-3">
          <button class="erp-tab" [class.active]="tab === 'attendance'" (click)="tab = 'attendance'">{{ 'parentPortal.tabAttendance' | translate }}</button>
          <button class="erp-tab" [class.active]="tab === 'fees'" (click)="tab = 'fees'">{{ 'parentPortal.tabFees' | translate }}</button>
        </div>

        <div class="erp-card" *ngIf="tab === 'attendance'">
          <div class="row text-center mb-4">
            <div class="col-md-3"><strong>{{ attendanceStats.totalDays }}</strong><div class="text-muted">{{ 'parentPortal.totalDays' | translate }}</div></div>
            <div class="col-md-3"><strong style="color: var(--clr-success);">{{ attendanceStats.present }}</strong><div class="text-muted">{{ 'parentPortal.present' | translate }}</div></div>
            <div class="col-md-3"><strong style="color: var(--clr-danger);">{{ attendanceStats.absent }}</strong><div class="text-muted">{{ 'parentPortal.absent' | translate }}</div></div>
            <div class="col-md-3"><strong style="color: var(--clr-warning);">{{ attendanceStats.late }}</strong><div class="text-muted">{{ 'parentPortal.late' | translate }}</div></div>
          </div>
          <table class="erp-table" *ngIf="paginatedAttendanceRecords.length">
            <thead><tr><th>{{ 'parentPortal.thDate' | translate }}</th><th>{{ 'parentPortal.thStatus' | translate }}</th><th>{{ 'parentPortal.thRemarks' | translate }}</th></tr></thead>
            <tbody>
              <tr *ngFor="let record of paginatedAttendanceRecords">
                <td>{{ record.date }}</td>
                <td><span class="badge-erp badge-neutral">{{ attendanceRowStatusLabel(record.status) }}</span></td>
                <td>{{ getAttendanceRemarks(record) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="pagination-wrapper" *ngIf="attendanceRecords.length > attendancePageSize">
            <span>{{ 'parentPortal.attendancePageSummary' | translate: { from: attendancePageFrom, to: attendancePageTo, total: attendanceRecords.length } }}</span>
            <div class="pagination-controls">
              <button type="button" class="page-btn" [disabled]="attendancePage === 1" (click)="setAttendancePage(attendancePage - 1)">
                <i class="bi bi-chevron-left"></i>
              </button>
              <button
                type="button"
                *ngFor="let p of attendancePageButtons"
                class="page-btn"
                [class.active]="p === attendancePage"
                (click)="setAttendancePage(p)"
              >{{ p }}</button>
              <button type="button" class="page-btn" [disabled]="attendancePage === attendanceTotalPages" (click)="setAttendancePage(attendancePage + 1)">
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
          <div *ngIf="!attendanceRecords.length" class="empty-state"><h3>{{ 'parentPortal.emptyAttendance' | translate }}</h3></div>
        </div>

        <div class="erp-card" *ngIf="tab === 'fees'">
          <div *ngIf="feeObligations.length" class="row g-4">
            <div class="col-lg-7">
              <div *ngFor="let obligation of feeObligations" class="erp-card mb-3" style="border: 1px solid var(--clr-border-light); box-shadow: none;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 800; margin-bottom: 6px;">{{ obligation.feeStructureName }}</h4>
                    <p class="text-muted mb-0" style="font-size: 12px;">
                      {{ obligation.className || ('exams.dash' | translate) }}
                      <ng-container *ngIf="obligation.dueDate">{{ 'parentPortal.obligationDuePrefix' | translate: { date: obligation.dueDate } }}</ng-container>
                      <ng-container *ngIf="obligation.daysUntilDue != null && obligation.daysUntilDue > 0 && obligation.status !== 'paid'">
                        · {{ 'parentPortal.dueInDays' | translate: { n: obligation.daysUntilDue } }}
                      </ng-container>
                      <ng-container *ngIf="obligation.daysUntilDue != null && obligation.daysUntilDue <= 0 && obligation.status !== 'paid'">
                        · {{ 'parentPortal.dueNow' | translate }}
                      </ng-container>
                    </p>
                  </div>
                  <span class="badge-erp" [ngClass]="{'badge-success': obligation.status === 'paid', 'badge-warning': obligation.status === 'partial', 'badge-danger': obligation.status === 'overdue', 'badge-neutral': obligation.status === 'unpaid'}">
                    {{ obligationStatusLabel(obligation.status) }}
                  </span>
                </div>
                <div class="row g-3 mb-3">
                  <div class="col-md-4">
                    <div class="insight-card">
                      <div class="insight-label">{{ 'parentPortal.insightTotal' | translate }}</div>
                      <div class="insight-value">{{ obligation.totalAmount | currency:obligation.currency:'symbol':'1.0-0' }}</div>
                      <div class="insight-subtext">{{ 'parentPortal.insightAcademicPlan' | translate }}</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="insight-card">
                      <div class="insight-label">{{ 'parentPortal.insightPaid' | translate }}</div>
                      <div class="insight-value" style="color: var(--clr-success);">{{ obligation.paidAmount | currency:obligation.currency:'symbol':'1.0-0' }}</div>
                      <div class="insight-subtext">{{ 'parentPortal.insightReceivedSoFar' | translate }}</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="insight-card">
                      <div class="insight-label">{{ 'parentPortal.insightPayableNow' | translate }}</div>
                      <div class="insight-value" style="color: var(--clr-danger);">{{ obligation.payableNow | currency:obligation.currency:'symbol':'1.0-0' }}</div>
                      <div class="insight-subtext">{{ 'parentPortal.insightIncludingLateFee' | translate }}</div>
                    </div>
                  </div>
                </div>
                <div class="erp-card" style="background: var(--clr-surface-alt); box-shadow: none; border: 1px solid var(--clr-border-light);">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 style="font-size: 14px; font-weight: 700; margin: 0;">{{ 'parentPortal.feeBreakdown' | translate }}</h5>
                    <span style="font-size: 12px; color: var(--clr-text-muted);">{{ 'parentPortal.lateFeeLabel' | translate: { amount: (obligation.lateFee | currency:obligation.currency:'symbol':'1.0-0') } }}</span>
                  </div>
                  <div *ngFor="let line of obligation.lineItems" class="d-flex justify-content-between align-items-center" style="padding: 8px 0; border-bottom: 1px solid var(--clr-border-light); font-size: 13px;">
                    <span>{{ line.name }}</span>
                    <strong>{{ line.amount | currency:obligation.currency:'symbol':'1.0-0' }}</strong>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <div style="font-size: 12px; color: var(--clr-text-muted);">
                    {{ 'parentPortal.outstandingLine' | translate: {
                      outstanding: (obligation.dueAmount | currency:obligation.currency:'symbol':'1.0-0'),
                      discount: (obligation.discount | currency:obligation.currency:'symbol':'1.0-0')
                    } }}
                  </div>
                  <div class="d-flex gap-2">
                    <button type="button" class="btn-outline-erp btn-sm" *ngIf="latestReceiptForPayment(obligation.paymentId) as rec" (click)="downloadReceipt(rec)"><i class="bi bi-download me-1"></i>{{ 'parentPortal.receiptBtn' | translate }}</button>
                    <button class="btn-primary-erp btn-sm" [disabled]="obligation.payableNow <= 0 || processingPayment" (click)="openPayment(obligation)">
                      {{ obligation.payableNow > 0 ? ('parentPortal.payNow' | translate) : ('parentPortal.settled' | translate) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="erp-card parent-payment-activity">
                <div class="erp-card-header d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <h3 class="erp-card-title mb-0">{{ 'parentPortal.paymentActivityTitle' | translate }}</h3>
                    <p class="text-muted small mb-0 mt-1">{{ 'parentPortal.paymentActivityLead' | translate }}</p>
                  </div>
                </div>
                <div class="row g-2 mb-3">
                  <div class="col-sm-6">
                    <label class="erp-label small mb-1">{{ 'parentPortal.receiptsFrom' | translate }}</label>
                    <app-erp-date-picker [(ngModel)]="receiptFrom" (ngModelChange)="reloadReceiptHistory()" [placeholder]="'parentPortal.phFrom' | translate" />
                  </div>
                  <div class="col-sm-6">
                    <label class="erp-label small mb-1">{{ 'parentPortal.receiptsTo' | translate }}</label>
                    <app-erp-date-picker [(ngModel)]="receiptTo" (ngModelChange)="reloadReceiptHistory()" [placeholder]="'parentPortal.phTo' | translate" />
                  </div>
                  <div class="col-12 d-flex flex-wrap gap-1">
                    <button type="button" class="btn-outline-erp btn-xs" (click)="setReceiptPreset(30)">{{ 'parentPortal.preset30' | translate }}</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="setReceiptPreset(90)">{{ 'parentPortal.preset90' | translate }}</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="setReceiptPreset(365)">{{ 'parentPortal.preset12m' | translate }}</button>
                  </div>
                </div>
                <div *ngIf="latestReceipt" class="insight-card mb-3">
                  <div class="insight-label">{{ 'parentPortal.latestInRange' | translate }}</div>
                  <div class="insight-value" style="font-size: 15px;">{{ latestReceipt.receiptNumber }}</div>
                  <div class="insight-subtext">{{ latestReceipt.paymentDate }} · {{ latestReceipt.amountPaid | currency:latestReceipt.currency:'symbol':'1.0-0' }}</div>
                  <button type="button" class="btn-outline-erp btn-xs mt-2" (click)="downloadReceipt(latestReceipt)"><i class="bi bi-download me-1"></i>{{ 'parentPortal.download' | translate }}</button>
                </div>
                <div *ngIf="!receiptHistory.length && !receiptsLoading" class="empty-state" style="padding: 20px 12px;">
                  <i class="bi bi-receipt-cutoff"></i>
                  <h3>{{ 'parentPortal.emptyReceiptsTitle' | translate }}</h3>
                  <p class="small mb-0">{{ 'parentPortal.emptyReceiptsLead' | translate }}</p>
                </div>
                <div *ngIf="receiptsLoading" class="text-muted small py-2">{{ 'parentPortal.loadingReceipts' | translate }}</div>
                <div class="parent-receipt-scroll" *ngIf="receiptHistory.length">
                  <div
                    *ngFor="let r of receiptHistory"
                    class="parent-receipt-row d-flex flex-wrap justify-content-between align-items-center gap-2"
                  >
                    <div style="min-width: 0;">
                      <div class="fw-bold" style="font-size: 13px;">{{ r.receiptNumber }}</div>
                      <div class="text-muted small">{{ r.paymentDate }} · {{ r.amountPaid | currency:r.currency:'symbol':'1.0-0' }} · {{ receiptLedgerStatusLabel(r) }}</div>
                    </div>
                    <button type="button" class="btn-outline-erp btn-xs flex-shrink-0" (click)="downloadReceipt(r)"><i class="bi bi-download"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="!feeObligations.length" class="empty-state"><h3>{{ 'parentPortal.emptyFeesTitle' | translate }}</h3></div>
        </div>

      </div>

      <div class="modal-overlay" *ngIf="showPaymentModal && selectedObligation" (click)="closePaymentModal()">
        <div class="modal-content-erp" style="max-width: 720px;" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>{{ 'parentPortal.modalPayTitle' | translate }}</h3>
            <button class="btn-icon" (click)="closePaymentModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="d-flex gap-2 mb-3 small text-muted">
              <span [style.fontWeight]="paymentStep === 'review' ? '700' : '400'">{{ 'parentPortal.stepReview' | translate }}</span>
              <span>→</span>
              <span [style.fontWeight]="paymentStep === 'method' ? '700' : '400'">{{ 'parentPortal.stepMethod' | translate }}</span>
              <span>→</span>
              <span [style.fontWeight]="paymentStep === 'confirm' ? '700' : '400'">{{ 'parentPortal.stepPay' | translate }}</span>
            </div>
            <div class="row g-4" *ngIf="paymentStep === 'review'">
              <div class="col-md-7">
                <div class="insight-card mb-3">
                  <div class="insight-label">{{ 'parentPortal.childFeePlan' | translate }}</div>
                  <div class="insight-value">{{ selectedChild?.firstName }} {{ selectedChild?.lastName }}</div>
                  <div class="insight-subtext">{{ selectedObligation.studentName }} · {{ selectedObligation.feeStructureName }} · {{ selectedObligation.className }}</div>
                </div>
                <div *ngFor="let line of selectedObligation.lineItems" class="d-flex justify-content-between align-items-center" style="padding: 8px 0; border-bottom: 1px solid var(--clr-border-light);">
                  <span>{{ line.name }}</span>
                  <strong>{{ line.amount | currency:selectedObligation.currency:'symbol':'1.0-0' }}</strong>
                </div>
              </div>
              <div class="col-md-5">
                <div class="erp-form-group">
                  <label class="erp-label">{{ 'parentPortal.labelAmountToPay' | translate }}</label>
                  <input
                    type="number"
                    class="erp-input"
                    [class.erp-input--invalid]="paymentAmountError"
                    [(ngModel)]="paymentAmount"
                    (ngModelChange)="onPaymentAmountChange()"
                    (blur)="refreshPaymentAmountError()"
                    min="0.01"
                    step="0.01"
                    [attr.max]="selectedObligation.payableNow"
                  />
                  <p class="text-muted small mb-1">{{ 'parentPortal.maxPayableNow' | translate: { amount: (selectedObligation.payableNow | currency:selectedObligation.currency:'symbol':'1.2-2') } }}</p>
                  <p *ngIf="paymentAmountError" class="small mb-0" style="color: var(--clr-danger);">{{ paymentAmountError }}</p>
                </div>
                <div class="insight-card">
                  <div class="insight-label">{{ 'parentPortal.currentPayable' | translate }}</div>
                  <div class="insight-value" style="color: var(--clr-danger);">{{ selectedObligation.payableNow | currency:selectedObligation.currency:'symbol':'1.0-0' }}</div>
                  <div class="insight-subtext">{{ 'parentPortal.payableSubtext' | translate }}</div>
                </div>
              </div>
            </div>
            <div *ngIf="paymentStep === 'method'" class="row g-3">
              <div class="col-12">
                <label class="erp-label">{{ 'parentPortal.chooseHowToPay' | translate }}</label>
                <p class="text-muted small">
                  <ng-container *ngIf="useMocks">
                    <span [innerHTML]="'parentPortal.payHintMocksHtml' | translate"></span>
                  </ng-container>
                  <ng-container *ngIf="!useMocks">
                    {{ 'parentPortal.payHintProd' | translate }}
                  </ng-container>
                </p>
              </div>
              <div class="col-md-4" *ngFor="let m of paymentMethodOptions">
                <button
                  type="button"
                  class="payment-method-tile"
                  [class.payment-method-tile--selected]="paymentProvider === m.id"
                  [attr.aria-pressed]="paymentProvider === m.id"
                  (click)="paymentProvider = m.id"
                >
                  <div class="d-flex justify-content-between align-items-start gap-2">
                    <div class="flex-grow-1 min-w-0">
                      <div class="fw-bold">{{ m.labelKey | translate }}</div>
                      <div class="text-muted small">{{ m.hintKey | translate }}</div>
                    </div>
                    <i *ngIf="paymentProvider === m.id" class="bi bi-check-circle-fill payment-method-tile__check flex-shrink-0" aria-hidden="true"></i>
                  </div>
                </button>
              </div>
            </div>
            <div *ngIf="paymentStep === 'confirm'" class="text-center py-3">
              <p class="small mb-2" style="color: var(--clr-danger);" *ngIf="paymentGatewayMessage">{{ paymentGatewayMessage }}</p>
              <p class="mb-2" *ngIf="processingPayment"><span class="spinner me-2"></span>{{ 'parentPortal.processing' | translate }}</p>
              <p class="text-muted small mb-0" *ngIf="lastOrderPreview && paymentProvider === PAYMENT_PROVIDER_IDS.RAZORPAY">
                {{ 'parentPortal.orderPreview' | translate: { id: lastOrderPreview.providerOrderId, amount: (lastOrderPreview.amount | currency:selectedObligation!.currency:'symbol':'1.0-0') } }}
              </p>
              <ng-container *ngIf="paymentProvider === PAYMENT_PROVIDER_IDS.RAZORPAY && currentCheckoutSession">
                <p class="text-muted small mt-2 mb-0" *ngIf="!currentCheckoutSession.publicKeyId" [innerHTML]="'parentPortal.razorpayMissingKeys' | translate"></p>
                <p class="text-muted small mt-2 mb-0" *ngIf="currentCheckoutSession.publicKeyId">
                  {{ 'parentPortal.razorpayWindowHint' | translate }}
                </p>
                <button
                  *ngIf="currentCheckoutSession.publicKeyId && !processingPayment"
                  type="button"
                  class="btn-primary-erp mt-3"
                  (click)="openRazorpayWidget()"
                >
                  {{ 'parentPortal.openRazorpayAgain' | translate }}
                </button>
              </ng-container>
              <p class="text-muted small mt-2" *ngIf="showCompleteTestPaymentButton() && usesLocalPortalDemoFeePayment()">
                {{ 'parentPortal.devMockHint' | translate }}
              </p>
              <button
                *ngIf="showCompleteTestPaymentButton()"
                type="button"
                class="btn-primary-erp mt-3"
                (click)="completeFeePaymentThroughApi()"
              >
                {{ 'parentPortal.completeTestPayment' | translate }}
              </button>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button class="btn-outline-erp" (click)="closePaymentModal()">{{ 'parentPortal.cancel' | translate }}</button>
            <button *ngIf="paymentStep === 'review'" class="btn-primary-erp" [disabled]="!canContinueFromPaymentReview" (click)="continuePaymentReview()">{{ 'parentPortal.continue' | translate }}</button>
            <button *ngIf="paymentStep === 'method'" class="btn-outline-erp me-auto" (click)="backToPaymentReview()">{{ 'parentPortal.back' | translate }}</button>
            <button *ngIf="paymentStep === 'method'" class="btn-primary-erp" [disabled]="!canSubmitPaymentMethod" (click)="goToPaymentConfirm()">{{ 'parentPortal.openPayScreen' | translate }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ParentPortalComponent implements OnInit, OnDestroy {
  /** Expose for template comparisons (canonical provider ids). */
  readonly PAYMENT_PROVIDER_IDS = PAYMENT_PROVIDER_IDS;

  private readonly destroy$ = new Subject<void>();

  children: Student[] = [];
  selectedStudentId: number | null = null;
  selectedChild: Student | null = null;
  tab: 'attendance' | 'fees' = 'attendance';
  fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  toDate = new Date().toISOString().split('T')[0];
  /** `YYYY-MM` — drives {@link fromDate}/{@link toDate} for attendance (and overview) fetch. */
  attendanceMonthYm = ParentPortalComponent.currentCalendarYm();
  attendanceStats: AttendanceStats = { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0, attendancePercentage: 0 };
  attendanceRecords: AttendanceRecord[] = [];
  /** Sorted slice for the current page (server/mock returns full month; UI pages locally). */
  paginatedAttendanceRecords: AttendanceRecord[] = [];
  attendancePage = 1;
  readonly attendancePageSize = 10;
  attendanceTotalPages = 1;
  attendancePageButtons: number[] = [];
  fees: FeePayment[] = [];
  feeObligations: ParentFeeObligation[] = [];
  marks: MarkRecord[] = [];
  totalPending = 0;
  selectedObligation: ParentFeeObligation | null = null;
  showPaymentModal = false;
  paymentProvider: string = PAYMENT_PROVIDER_IDS.MOCKPAY;
  paymentAmount = 0;
  processingPayment = false;
  latestReceipt: PaymentReceipt | null = null;
  receiptHistory: PaymentReceipt[] = [];
  /** Latest receipt per fee payment (wide date range) so obligation actions work even when the UI filter is narrow. */
  receiptLookupByPaymentId = new Map<string, PaymentReceipt>();
  receiptsLoading = false;
  receiptFrom = ParentPortalComponent.defaultReceiptFromIso();
  receiptTo = new Date().toISOString().split('T')[0];
  currentCheckoutSession: CheckoutSession | null = null;
  paymentStep: 'review' | 'method' | 'confirm' = 'review';
  lastOrderPreview: { providerOrderId: string; amount: number } | null = null;
  /** Inline error for gateway (Stripe unsupported, Razorpay config, etc.). */
  paymentGatewayMessage: string | null = null;
  /** Review-step validation for amount vs payable. */
  paymentAmountError: string | null = null;
  readonly useMocks = runtimeConfig.useMocks;

  /** Deep-link into Examinations with the selected child and Results tab when published. */
  get examsDeepLinkParams(): Record<string, string> {
    const sid = this.selectedStudentId;
    if (sid == null) {
      return { tab: 'results' };
    }
    return { studentId: String(sid), tab: 'results' };
  }

  attendancePctToneClass(): string {
    return cssClassForTone(toneClassForPercent(this.attendanceStats.attendancePercentage));
  }

  presentDaysToneClass(): string {
    const max = Math.max(1, this.attendanceStats.totalDays || 0);
    return cssClassForTone(toneClassForCountHigherBetter(this.attendanceStats.present, max));
  }

  feesPendingToneClass(): string {
    return cssClassForTone(toneClassForAmountHigherWorse(this.totalPending));
  }

  publishedResultsToneClass(): string {
    const n = this.marks.length;
    return cssClassForTone(n > 0 ? 'ok' : 'neutral');
  }

  get maxAttendanceMonthYm(): string {
    return ParentPortalComponent.currentCalendarYm();
  }

  get attendancePageFrom(): number {
    if (!this.attendanceRecords.length) {
      return 0;
    }
    return (this.attendancePage - 1) * this.attendancePageSize + 1;
  }

  get attendancePageTo(): number {
    return Math.min(this.attendancePage * this.attendancePageSize, this.attendanceRecords.length);
  }

  private static currentCalendarYm(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  constructor(
    private parentService: ParentService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  get paymentMethodOptions(): ReadonlyArray<ParentFeePaymentMethodOption> {
    return parentFeePaymentMethodOptions(this.useMocks);
  }

  /** Mock portal: only Instant (demo) uses the in-browser complete button. */
  showCompleteTestPaymentButton(): boolean {
    if (this.processingPayment || this.paymentStep !== 'confirm') {
      return false;
    }
    return this.useMocks && this.paymentProvider === PAYMENT_PROVIDER_IDS.MOCKPAY;
  }

  usesLocalPortalDemoFeePayment(): boolean {
    return ParentService.usesLocalPortalFeeSimulation(this.paymentProvider);
  }

  get canContinueFromPaymentReview(): boolean {
    return !this.computePaymentAmountError();
  }

  get canSubmitPaymentMethod(): boolean {
    return !this.computePaymentAmountError();
  }

  private computePaymentAmountError(): string | null {
    const ob = this.selectedObligation;
    if (!ob) {
      return this.translate.instant('parentPortal.err.noFee');
    }
    const raw = Number(this.paymentAmount);
    if (!Number.isFinite(raw)) {
      return this.translate.instant('parentPortal.err.invalidNumber');
    }
    if (raw <= 0) {
      return this.translate.instant('parentPortal.err.amountPositive');
    }
    const max = Number(ob.payableNow);
    if (!Number.isFinite(max) || max <= 0) {
      return this.translate.instant('parentPortal.err.nothingPayable');
    }
    const rounded = Math.round(raw * 100) / 100;
    const maxRounded = Math.round(max * 100) / 100;
    if (rounded > maxRounded) {
      return this.translate.instant('parentPortal.err.exceedsPayable', {
        currency: ob.currency || 'INR',
        max: maxRounded.toFixed(2),
      });
    }
    if (rounded < 0.01) {
      return this.translate.instant('parentPortal.err.minPayment');
    }
    return null;
  }

  onPaymentAmountChange(): void {
    this.paymentAmountError = null;
  }

  refreshPaymentAmountError(): void {
    this.paymentAmountError = this.computePaymentAmountError();
  }

  continuePaymentReview(): void {
    this.refreshPaymentAmountError();
    if (this.paymentAmountError) {
      return;
    }
    this.paymentStep = 'method';
  }

  backToPaymentReview(): void {
    this.paymentStep = 'review';
    this.refreshPaymentAmountError();
  }

  private static readonly RECEIPT_LOOKUP_FROM = '2020-01-01';

  private static defaultReceiptFromIso(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.applyAttendanceRangeForSelectedMonth(false);
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(qp => {
      this.applyParentRouteQuery(qp);
      this.cdr.markForCheck();
    });
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck());
    this.refreshPortal();
  }

  /** Maps {@link attendanceMonthYm} to inclusive {@link fromDate}/{@link toDate} (capped at today for the current month). */
  onAttendanceMonthChange(): void {
    if (!/^\d{4}-\d{2}$/.test(this.attendanceMonthYm)) {
      this.attendanceMonthYm = ParentPortalComponent.currentCalendarYm();
    }
    this.attendancePage = 1;
    this.applyAttendanceRangeForSelectedMonth(true);
  }

  private applyAttendanceRangeForSelectedMonth(reload: boolean): void {
    const ym = this.attendanceMonthYm;
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      return;
    }
    const [y, m] = ym.split('-').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    const first = `${y}-${pad(m)}-01`;
    const lastDom = new Date(y, m, 0).getDate();
    const last = `${y}-${pad(m)}-${pad(lastDom)}`;
    const todayIso = new Date().toISOString().split('T')[0];
    this.fromDate = first;
    this.toDate = todayIso < last ? todayIso : last;
    if (reload) {
      this.reloadSelectedChild();
    }
  }

  private rebuildAttendancePagination(): void {
    const sorted = [...this.attendanceRecords].sort((a, b) => a.date.localeCompare(b.date));
    this.attendanceTotalPages = Math.max(1, Math.ceil(sorted.length / this.attendancePageSize));
    if (this.attendancePage > this.attendanceTotalPages) {
      this.attendancePage = this.attendanceTotalPages;
    }
    if (this.attendancePage < 1) {
      this.attendancePage = 1;
    }
    this.attendancePageButtons = Array.from({ length: this.attendanceTotalPages }, (_, i) => i + 1);
    const start = (this.attendancePage - 1) * this.attendancePageSize;
    this.paginatedAttendanceRecords = sorted.slice(start, start + this.attendancePageSize);
  }

  setAttendancePage(p: number): void {
    if (p < 1 || p > this.attendanceTotalPages) {
      return;
    }
    this.attendancePage = p;
    this.rebuildAttendancePagination();
  }

  /** Deep links e.g. dashboard “Pay now” → {@code /app/parent/children?tab=fees&child=12}. */
  private applyParentRouteQuery(qp: ParamMap): void {
    const tab = qp.get('tab');
    if (tab === 'fees') {
      this.tab = 'fees';
    } else if (tab === 'attendance') {
      this.tab = 'attendance';
    }
    const child = qp.get('child');
    if (child && /^\d+$/.test(child)) {
      this.selectedStudentId = Number(child);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshPortal(): void {
    this.parentService.getChildren().subscribe(children => {
      this.children = children;
      if (this.selectedStudentId != null && !children.some(c => c.id === this.selectedStudentId)) {
        this.selectedStudentId = children.length ? children[0].id : null;
      }
      if (this.selectedStudentId == null && children.length) {
        this.selectedStudentId = children[0].id;
      }
      if (this.selectedStudentId != null) {
        this.onStudentChange();
      }
    });
  }

  onStudentChange(): void {
    this.selectedChild = this.children.find(child => child.id === this.selectedStudentId) ?? null;
    this.attendancePage = 1;
    this.reloadSelectedChild();
  }

  reloadSelectedChild(): void {
    if (this.selectedStudentId == null) {
      this.receiptHistory = [];
      this.latestReceipt = null;
      this.receiptLookupByPaymentId = new Map();
      this.attendanceRecords = [];
      this.paginatedAttendanceRecords = [];
      this.attendancePageButtons = [];
      return;
    }
    this.parentService.getChildOverview(this.selectedStudentId, this.fromDate, this.toDate).subscribe(data => {
      this.marks = data.marks;
      this.fees = data.fees;
      this.attendanceStats = data.attendance;
      this.attendanceRecords = data.attendanceRecords;
      this.attendancePage = 1;
      this.rebuildAttendancePagination();
      this.totalPending = this.fees.reduce((sum, fee) => sum + fee.dueAmount, 0);
      this.cdr.markForCheck();
    });
    this.parentService.getChildFeeObligations(this.selectedStudentId).subscribe(items => {
      this.feeObligations = items;
    });
    this.reloadReceiptHistory();
    this.reloadReceiptLookup();
  }

  /** Build paymentId → latest receipt (by payment date) for the whole ledger window. */
  reloadReceiptLookup(): void {
    if (this.selectedStudentId == null) {
      this.receiptLookupByPaymentId = new Map();
      return;
    }
    const end = new Date();
    end.setDate(end.getDate() + 1);
    const toIso = end.toISOString().split('T')[0];
    this.parentService.listChildReceipts(this.selectedStudentId, ParentPortalComponent.RECEIPT_LOOKUP_FROM, toIso).subscribe({
      next: list => {
        const map = new Map<string, PaymentReceipt>();
        for (const r of list) {
          const key = String(r.paymentId);
          if (!map.has(key)) {
            map.set(key, r);
          }
        }
        this.receiptLookupByPaymentId = map;
      },
      error: () => {
        this.receiptLookupByPaymentId = new Map();
      }
    });
  }

  reloadReceiptHistory(): void {
    if (!this.selectedStudentId) {
      this.receiptHistory = [];
      this.latestReceipt = null;
      return;
    }
    this.receiptsLoading = true;
    this.parentService.listChildReceipts(this.selectedStudentId, this.receiptFrom, this.receiptTo).subscribe({
      next: list => {
        this.receiptHistory = list;
        this.latestReceipt = list.length ? list[0] : null;
        this.receiptsLoading = false;
      },
      error: () => {
        this.receiptHistory = [];
        this.latestReceipt = null;
        this.receiptsLoading = false;
      }
    });
  }

  setReceiptPreset(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    this.receiptTo = end.toISOString().split('T')[0];
    this.receiptFrom = start.toISOString().split('T')[0];
    this.reloadReceiptHistory();
  }

  latestReceiptForPayment(paymentId: string | number): PaymentReceipt | null {
    return this.receiptLookupByPaymentId.get(String(paymentId)) ?? null;
  }

  receiptLedgerStatusLabel(r: PaymentReceipt): string {
    const due = r.dueAmount ?? 0;
    if (due <= 0) {
      return this.translate.instant('parentPortal.receiptStatus.paid');
    }
    if ((r.paidAmount ?? 0) > 0) {
      return this.translate.instant('parentPortal.receiptStatus.partial');
    }
    return this.translate.instant('parentPortal.receiptStatus.posted');
  }

  obligationStatusLabel(status: string): string {
    const c = (status || '').toLowerCase();
    const key = `parentPortal.obligationStatus.${c}`;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  attendanceRowStatusLabel(status: string): string {
    const c = (status || '').toLowerCase();
    const key = `parentPortal.attendanceRow.${c}`;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  getAttendanceRemarks(record: AttendanceRecord): string {
    const remarks = (record as AttendanceRecord & { remarks?: string }).remarks;
    return remarks && remarks.trim() ? remarks : this.translate.instant('exams.dash');
  }

  openPayment(obligation: ParentFeeObligation): void {
    this.selectedObligation = obligation;
    this.paymentAmount = obligation.payableNow;
    this.paymentProvider = this.pickDefaultPaymentProvider();
    this.paymentStep = 'review';
    this.lastOrderPreview = null;
    this.paymentGatewayMessage = null;
    this.paymentAmountError = null;
    this.showPaymentModal = true;
  }

  /** Mock portal defaults to the only working tile; production defaults to Razorpay. */
  private pickDefaultPaymentProvider(): string {
    const opts = this.paymentMethodOptions;
    if (this.useMocks && opts.some(m => m.id === PAYMENT_PROVIDER_IDS.MOCKPAY)) {
      return PAYMENT_PROVIDER_IDS.MOCKPAY;
    }
    return opts.find(m => m.id === PAYMENT_PROVIDER_IDS.RAZORPAY)?.id ?? opts[0]?.id ?? PAYMENT_PROVIDER_IDS.RAZORPAY;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedObligation = null;
    this.paymentAmount = 0;
    this.processingPayment = false;
    this.currentCheckoutSession = null;
    this.paymentStep = 'review';
    this.lastOrderPreview = null;
    this.paymentGatewayMessage = null;
    this.paymentAmountError = null;
  }

  goToPaymentConfirm(): void {
    this.paymentGatewayMessage = null;
    if (!this.selectedObligation || !this.selectedChild) {
      return;
    }
    const amountErr = this.computePaymentAmountError();
    if (amountErr) {
      this.paymentGatewayMessage = amountErr;
      return;
    }

    if (this.paymentProvider === PAYMENT_PROVIDER_IDS.RAZORPAY) {
      if (this.useMocks) {
        this.paymentGatewayMessage = this.translate.instant('parentPortal.err.razorpayPreviewMock');
        return;
      }
      this.processingPayment = true;
      const returnUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/app/parent/children` : '/app/parent/children';
      const amount = Math.round(Number(this.paymentAmount) * 100) / 100;
      this.parentService
        .createCheckoutSession({
          paymentId: this.selectedObligation.paymentId,
          studentId: coerceApiLongId(this.selectedChild.id, 'student'),
          amount,
          provider: PAYMENT_PROVIDER_IDS.RAZORPAY,
          returnUrl,
        })
        .subscribe({
          next: session => {
            this.currentCheckoutSession = session;
            this.lastOrderPreview = { providerOrderId: session.providerOrderId, amount: session.amount };
            this.processingPayment = false;
            this.paymentStep = 'confirm';
            if (session.publicKeyId) {
              setTimeout(() => this.openRazorpayWidget(), 0);
            } else {
              this.paymentGatewayMessage = this.translate.instant('parentPortal.err.orderNoKey');
            }
          },
          error: () => {
            this.processingPayment = false;
            this.paymentGatewayMessage = this.translate.instant('parentPortal.err.checkoutFailed');
          },
        });
      return;
    }

    if (this.useMocks && this.paymentProvider === PAYMENT_PROVIDER_IDS.MOCKPAY) {
      this.paymentStep = 'confirm';
      return;
    }

    this.paymentGatewayMessage = this.translate.instant('parentPortal.err.methodUnavailable');
  }

  /** Mock portal: create local checkout session then confirm (Instant / demo only). */
  completeFeePaymentThroughApi(): void {
    this.startPayment();
  }

  /** Opens Razorpay Checkout.js after {@link #goToPaymentConfirm} created a server order. */
  openRazorpayWidget(): void {
    const session = this.currentCheckoutSession;
    const ob = this.selectedObligation;
    const child = this.selectedChild;
    if (!session || !ob || session.provider !== PAYMENT_PROVIDER_IDS.RAZORPAY) {
      return;
    }
    const key = session.publicKeyId;
    if (!key) {
      this.paymentGatewayMessage = this.translate.instant('parentPortal.err.missingRzpKey');
      return;
    }
    const currency = (ob.currency || 'INR').toUpperCase();
    if (currency !== 'INR') {
      this.paymentGatewayMessage = this.translate.instant('parentPortal.err.rzpInrOnly');
      return;
    }
    const paise = Math.round(Number(session.amount) * 100);
    openRazorpaySchoolFeeCheckout({
      keyId: key,
      orderId: session.providerOrderId,
      amountPaise: paise,
      currency,
      name: this.translate.instant('parentPortal.checkoutMerchantName'),
      description: `${ob.feeStructureName} (${child?.firstName ?? ''} ${child?.lastName ?? ''})`.trim(),
      onLoadError: msg => {
        this.paymentGatewayMessage = msg;
        this.processingPayment = false;
      },
      onSuccess: resp => {
        this.processingPayment = true;
        this.paymentGatewayMessage = null;
        this.parentService
          .confirmCheckout(session.attemptId, session.checkoutToken, resp.razorpay_payment_id, resp.razorpay_signature)
          .subscribe({
            next: receipt => {
              this.latestReceipt = receipt;
              this.processingPayment = false;
              this.closePaymentModal();
              this.reloadSelectedChild();
              this.reloadReceiptHistory();
              this.reloadReceiptLookup();
            },
            error: () => {
              this.processingPayment = false;
              this.paymentGatewayMessage = this.translate.instant('parentPortal.err.confirmFailed');
            },
          });
      },
      onDismiss: () => {
        this.processingPayment = false;
      },
    });
  }

  /** Instant (demo): in-browser checkout token then confirm (mock portal only). */
  startPayment(): void {
    if (!this.selectedObligation || !this.selectedChild) {
      return;
    }
    if (this.computePaymentAmountError()) {
      return;
    }
    this.processingPayment = true;
    this.paymentGatewayMessage = null;
    const amount = Math.round(Number(this.paymentAmount) * 100) / 100;
    this.parentService
      .createCheckoutSession({
        paymentId: this.selectedObligation.paymentId,
        studentId: coerceApiLongId(this.selectedChild.id, 'student'),
        amount,
        provider: this.paymentProvider,
        returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/app/parent/children` : '/app/parent/children',
      })
      .subscribe({
        next: session => {
          this.currentCheckoutSession = session;
          this.parentService
            .confirmCheckout(session.attemptId, session.checkoutToken, session.providerOrderId + '-SUCCESS')
            .subscribe({
              next: receipt => {
                this.latestReceipt = receipt;
                this.processingPayment = false;
                this.closePaymentModal();
                this.reloadSelectedChild();
                this.reloadReceiptHistory();
                this.reloadReceiptLookup();
              },
              error: () => {
                this.processingPayment = false;
                this.paymentGatewayMessage = this.translate.instant('parentPortal.err.paymentConfirmFailed');
              },
            });
        },
        error: () => {
          this.processingPayment = false;
          this.paymentGatewayMessage = this.translate.instant('parentPortal.err.sessionStartFailed');
        },
      });
  }

  downloadReceipt(receipt: PaymentReceipt): void {
    const t = (key: string, params?: Record<string, string | number>) => this.translate.instant(key, params);
    const dash = this.translate.instant('exams.dash');
    const html = `
      <html><head><title>${t('parentPortal.receiptHtml.docTitle', { no: receipt.receiptNumber })}</title></head><body style="font-family: Arial, sans-serif; padding: 24px;">
      <h1>${t('parentPortal.receiptHtml.heading')}</h1>
      <p><strong>${t('parentPortal.receiptHtml.receipt')}</strong> ${receipt.receiptNumber}</p>
      <p><strong>${t('parentPortal.receiptHtml.student')}</strong> ${receipt.studentName}</p>
      <p><strong>${t('parentPortal.receiptHtml.feePlan')}</strong> ${receipt.feeStructureName}</p>
      <p><strong>${t('parentPortal.receiptHtml.paymentDate')}</strong> ${receipt.paymentDate || dash}</p>
      <p><strong>${t('parentPortal.receiptHtml.amountPaid')}</strong> ${receipt.currency} ${receipt.amountPaid}</p>
      <hr />
      ${receipt.lineItems.map(line => `<div style="display:flex;justify-content:space-between;padding:6px 0;"><span>${line.name}</span><strong>${receipt.currency} ${line.amount}</strong></div>`).join('')}
      </body></html>
    `;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${receipt.receiptNumber}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
