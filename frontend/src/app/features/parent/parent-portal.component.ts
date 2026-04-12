import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import {
  parentFeePaymentMethodOptions,
  type ParentFeePaymentMethodOption,
} from './parent-fee-payment.providers';

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ErpDatePickerComponent],
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
    `,
  ],
  template: `
    <div data-testid="parent-portal-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Parent Portal</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Track attendance, fees, and performance. Exams, timetables, and published grades live under <strong>Examinations</strong> in the sidebar. Fee payments are per selected child.</p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refreshPortal()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="erp-label">Child</label>
            <select class="erp-select" [(ngModel)]="selectedStudentId" (change)="onStudentChange()">
              <option [ngValue]="null">Select Child</option>
              <option *ngFor="let child of children" [ngValue]="child.id">
                {{ child.firstName }} {{ child.lastName }} - {{ child.className || ('Class ' + child.classId) }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">From</label>
            <app-erp-date-picker [(ngModel)]="fromDate" (ngModelChange)="reloadSelectedChild()" placeholder="From" />
          </div>
          <div class="col-md-3">
            <label class="erp-label">To</label>
            <app-erp-date-picker [(ngModel)]="toDate" (ngModelChange)="reloadSelectedChild()" placeholder="To" />
          </div>
        </div>
      </div>

      <div *ngIf="selectedChild" class="animate-in animate-in-delay-2">
        <div class="row g-4 mb-4">
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-value">{{ attendanceStats.attendancePercentage | number:'1.0-1' }}%</div>
              <div class="stat-label">Attendance Rate</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-value">{{ attendanceStats.present }}</div>
              <div class="stat-label">Days Present</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-value">{{ totalPending | number:'1.0-0' }}</div>
              <div class="stat-label">Fees Pending</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card">
              <div class="stat-value">{{ marks.length }}</div>
              <div class="stat-label">Marks Entries</div>
            </div>
          </div>
        </div>

        <div class="erp-card mb-3 p-3 d-flex flex-wrap align-items-center justify-content-between gap-2" style="background: var(--clr-surface-alt); border: 1px solid var(--clr-border-light);">
          <p class="small text-muted mb-0" style="max-width: 42rem;">
            <strong>Exams &amp; grades</strong> — open <strong>Examinations</strong>: pick your child, then each exam’s <strong>Timetable</strong> and <strong>Results</strong> (when published) in one place.
          </p>
          <a routerLink="/app/exams" class="btn-primary-erp btn-sm text-decoration-none">Open Examinations</a>
        </div>

        <div class="erp-tabs mb-3">
          <button class="erp-tab" [class.active]="tab === 'attendance'" (click)="tab = 'attendance'">Attendance</button>
          <button class="erp-tab" [class.active]="tab === 'fees'" (click)="tab = 'fees'">Fees</button>
        </div>

        <div class="erp-card" *ngIf="tab === 'attendance'">
          <div class="row text-center mb-4">
            <div class="col-md-3"><strong>{{ attendanceStats.totalDays }}</strong><div class="text-muted">Total Days</div></div>
            <div class="col-md-3"><strong style="color: var(--clr-success);">{{ attendanceStats.present }}</strong><div class="text-muted">Present</div></div>
            <div class="col-md-3"><strong style="color: var(--clr-danger);">{{ attendanceStats.absent }}</strong><div class="text-muted">Absent</div></div>
            <div class="col-md-3"><strong style="color: var(--clr-warning);">{{ attendanceStats.late }}</strong><div class="text-muted">Late</div></div>
          </div>
          <table class="erp-table" *ngIf="attendanceRecords.length">
            <thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
            <tbody>
              <tr *ngFor="let record of attendanceRecords">
                <td>{{ record.date }}</td>
                <td><span class="badge-erp badge-neutral">{{ record.status }}</span></td>
                <td>{{ getAttendanceRemarks(record) }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!attendanceRecords.length" class="empty-state"><h3>No attendance records</h3></div>
        </div>

        <div class="erp-card" *ngIf="tab === 'fees'">
          <div *ngIf="feeObligations.length" class="row g-4">
            <div class="col-lg-7">
              <div *ngFor="let obligation of feeObligations" class="erp-card mb-3" style="border: 1px solid var(--clr-border-light); box-shadow: none;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h4 style="font-size: 16px; font-weight: 800; margin-bottom: 6px;">{{ obligation.feeStructureName }}</h4>
                    <p class="text-muted mb-0" style="font-size: 12px;">
                      {{ obligation.className || '—' }}
                      <ng-container *ngIf="obligation.dueDate"> · Due {{ obligation.dueDate }}</ng-container>
                      <ng-container *ngIf="obligation.daysUntilDue != null && obligation.daysUntilDue > 0 && obligation.status !== 'paid'">
                        · {{ obligation.daysUntilDue }} day(s) left
                      </ng-container>
                      <ng-container *ngIf="obligation.daysUntilDue != null && obligation.daysUntilDue <= 0 && obligation.status !== 'paid'">
                        · Due now / overdue
                      </ng-container>
                    </p>
                  </div>
                  <span class="badge-erp" [ngClass]="{'badge-success': obligation.status === 'paid', 'badge-warning': obligation.status === 'partial', 'badge-danger': obligation.status === 'overdue', 'badge-neutral': obligation.status === 'unpaid'}">
                    {{ obligation.status }}
                  </span>
                </div>
                <div class="row g-3 mb-3">
                  <div class="col-md-4">
                    <div class="insight-card">
                      <div class="insight-label">Total</div>
                      <div class="insight-value">{{ obligation.totalAmount | currency:obligation.currency:'symbol':'1.0-0' }}</div>
                      <div class="insight-subtext">Academic billing plan</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="insight-card">
                      <div class="insight-label">Paid</div>
                      <div class="insight-value" style="color: var(--clr-success);">{{ obligation.paidAmount | currency:obligation.currency:'symbol':'1.0-0' }}</div>
                      <div class="insight-subtext">Received so far</div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="insight-card">
                      <div class="insight-label">Payable Now</div>
                      <div class="insight-value" style="color: var(--clr-danger);">{{ obligation.payableNow | currency:obligation.currency:'symbol':'1.0-0' }}</div>
                      <div class="insight-subtext">Including late fee</div>
                    </div>
                  </div>
                </div>
                <div class="erp-card" style="background: var(--clr-surface-alt); box-shadow: none; border: 1px solid var(--clr-border-light);">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 style="font-size: 14px; font-weight: 700; margin: 0;">Fee Breakdown</h5>
                    <span style="font-size: 12px; color: var(--clr-text-muted);">Late fee {{ obligation.lateFee | currency:obligation.currency:'symbol':'1.0-0' }}</span>
                  </div>
                  <div *ngFor="let line of obligation.lineItems" class="d-flex justify-content-between align-items-center" style="padding: 8px 0; border-bottom: 1px solid var(--clr-border-light); font-size: 13px;">
                    <span>{{ line.name }}</span>
                    <strong>{{ line.amount | currency:obligation.currency:'symbol':'1.0-0' }}</strong>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <div style="font-size: 12px; color: var(--clr-text-muted);">
                    Outstanding {{ obligation.dueAmount | currency:obligation.currency:'symbol':'1.0-0' }} · Discount {{ obligation.discount | currency:obligation.currency:'symbol':'1.0-0' }}
                  </div>
                  <div class="d-flex gap-2">
                    <button type="button" class="btn-outline-erp btn-sm" *ngIf="latestReceiptForPayment(obligation.paymentId) as rec" (click)="downloadReceipt(rec)"><i class="bi bi-download me-1"></i>Receipt</button>
                    <button class="btn-primary-erp btn-sm" [disabled]="obligation.payableNow <= 0 || processingPayment" (click)="openPayment(obligation)">
                      {{ obligation.payableNow > 0 ? 'Pay Now' : 'Settled' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="erp-card parent-payment-activity">
                <div class="erp-card-header d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <h3 class="erp-card-title mb-0">Payment Activity</h3>
                    <p class="text-muted small mb-0 mt-1">Official receipts for the selected period (download HTML for your records).</p>
                  </div>
                </div>
                <div class="row g-2 mb-3">
                  <div class="col-sm-6">
                    <label class="erp-label small mb-1">Receipts from</label>
                    <app-erp-date-picker [(ngModel)]="receiptFrom" (ngModelChange)="reloadReceiptHistory()" placeholder="From" />
                  </div>
                  <div class="col-sm-6">
                    <label class="erp-label small mb-1">Receipts to</label>
                    <app-erp-date-picker [(ngModel)]="receiptTo" (ngModelChange)="reloadReceiptHistory()" placeholder="To" />
                  </div>
                  <div class="col-12 d-flex flex-wrap gap-1">
                    <button type="button" class="btn-outline-erp btn-xs" (click)="setReceiptPreset(30)">Last 30 days</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="setReceiptPreset(90)">Last 90 days</button>
                    <button type="button" class="btn-outline-erp btn-xs" (click)="setReceiptPreset(365)">Last 12 months</button>
                  </div>
                </div>
                <div *ngIf="latestReceipt" class="insight-card mb-3">
                  <div class="insight-label">Latest in range</div>
                  <div class="insight-value" style="font-size: 15px;">{{ latestReceipt.receiptNumber }}</div>
                  <div class="insight-subtext">{{ latestReceipt.paymentDate }} · {{ latestReceipt.amountPaid | currency:latestReceipt.currency:'symbol':'1.0-0' }}</div>
                  <button type="button" class="btn-outline-erp btn-xs mt-2" (click)="downloadReceipt(latestReceipt)"><i class="bi bi-download me-1"></i>Download</button>
                </div>
                <div *ngIf="!receiptHistory.length && !receiptsLoading" class="empty-state" style="padding: 20px 12px;">
                  <i class="bi bi-receipt-cutoff"></i>
                  <h3>No receipts in this range</h3>
                  <p class="small mb-0">Adjust dates or complete a payment — ledger receipts appear here.</p>
                </div>
                <div *ngIf="receiptsLoading" class="text-muted small py-2">Loading receipts…</div>
                <div class="parent-receipt-scroll" *ngIf="receiptHistory.length">
                  <div
                    *ngFor="let r of receiptHistory"
                    class="parent-receipt-row d-flex flex-wrap justify-content-between align-items-center gap-2"
                  >
                    <div style="min-width: 0;">
                      <div class="fw-bold" style="font-size: 13px;">{{ r.receiptNumber }}</div>
                      <div class="text-muted small">{{ r.paymentDate }} · {{ r.amountPaid | currency:r.currency:'symbol':'1.0-0' }} · {{ receiptLedgerStatus(r) }}</div>
                    </div>
                    <button type="button" class="btn-outline-erp btn-xs flex-shrink-0" (click)="downloadReceipt(r)"><i class="bi bi-download"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="!feeObligations.length" class="empty-state"><h3>No fee records</h3></div>
        </div>

      </div>

      <div class="modal-overlay" *ngIf="showPaymentModal && selectedObligation" (click)="closePaymentModal()">
        <div class="modal-content-erp" style="max-width: 720px;" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>Pay School Fees</h3>
            <button class="btn-icon" (click)="closePaymentModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="d-flex gap-2 mb-3 small text-muted">
              <span [style.fontWeight]="paymentStep === 'review' ? '700' : '400'">1. Review</span>
              <span>→</span>
              <span [style.fontWeight]="paymentStep === 'method' ? '700' : '400'">2. Method</span>
              <span>→</span>
              <span [style.fontWeight]="paymentStep === 'confirm' ? '700' : '400'">3. Pay</span>
            </div>
            <div class="row g-4" *ngIf="paymentStep === 'review'">
              <div class="col-md-7">
                <div class="insight-card mb-3">
                  <div class="insight-label">Child &amp; fee plan</div>
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
                  <label class="erp-label">Amount to Pay</label>
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
                  <p class="text-muted small mb-1">Maximum you can pay now: {{ selectedObligation.payableNow | currency:selectedObligation.currency:'symbol':'1.2-2' }}</p>
                  <p *ngIf="paymentAmountError" class="small mb-0" style="color: var(--clr-danger);">{{ paymentAmountError }}</p>
                </div>
                <div class="insight-card">
                  <div class="insight-label">Current Payable</div>
                  <div class="insight-value" style="color: var(--clr-danger);">{{ selectedObligation.payableNow | currency:selectedObligation.currency:'symbol':'1.0-0' }}</div>
                  <div class="insight-subtext">Includes overdue balance and late fee.</div>
                </div>
              </div>
            </div>
            <div *ngIf="paymentStep === 'method'" class="row g-3">
              <div class="col-12">
                <label class="erp-label">Choose how to pay</label>
                <p class="text-muted small">
                  <ng-container *ngIf="useMocks">
                    <strong>Instant (demo)</strong> records a payment in-browser. <strong>Razorpay</strong> is a preview tile — use a real parent login (<code>useMocks: false</code>) to run checkout.
                  </ng-container>
                  <ng-container *ngIf="!useMocks">
                    Card, UPI, and netbanking run in Razorpay’s secure window. The school is notified only after your bank authorizes the payment.
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
                      <div class="fw-bold">{{ m.label }}</div>
                      <div class="text-muted small">{{ m.hint }}</div>
                    </div>
                    <i *ngIf="paymentProvider === m.id" class="bi bi-check-circle-fill payment-method-tile__check flex-shrink-0" aria-hidden="true"></i>
                  </div>
                </button>
              </div>
            </div>
            <div *ngIf="paymentStep === 'confirm'" class="text-center py-3">
              <p class="small mb-2" style="color: var(--clr-danger);" *ngIf="paymentGatewayMessage">{{ paymentGatewayMessage }}</p>
              <p class="mb-2" *ngIf="processingPayment"><span class="spinner me-2"></span>Processing…</p>
              <p class="text-muted small mb-0" *ngIf="lastOrderPreview && paymentProvider === PAYMENT_PROVIDER_IDS.RAZORPAY">
                Order {{ lastOrderPreview.providerOrderId }} · {{ lastOrderPreview.amount | currency:selectedObligation!.currency:'symbol':'1.0-0' }}
              </p>
              <ng-container *ngIf="paymentProvider === PAYMENT_PROVIDER_IDS.RAZORPAY && currentCheckoutSession">
                <p class="text-muted small mt-2 mb-0" *ngIf="!currentCheckoutSession.publicKeyId">
                  Razorpay is not configured on the server (set <code>RAZORPAY_KEY</code> / <code>RAZORPAY_SECRET</code> on the API).
                </p>
                <p class="text-muted small mt-2 mb-0" *ngIf="currentCheckoutSession.publicKeyId">
                  A secure Razorpay window opens for card, UPI, or netbanking (including bank OTP). If it did not appear, allow pop-ups or use the button below.
                </p>
                <button
                  *ngIf="currentCheckoutSession.publicKeyId && !processingPayment"
                  type="button"
                  class="btn-primary-erp mt-3"
                  (click)="openRazorpayWidget()"
                >
                  Open Razorpay again
                </button>
              </ng-container>
              <p class="text-muted small mt-2" *ngIf="showCompleteTestPaymentButton() && usesLocalPortalDemoFeePayment()">
                Dev: completing here updates in-browser mock fee state only (mock login is not a JWT).
              </p>
              <button
                *ngIf="showCompleteTestPaymentButton()"
                type="button"
                class="btn-primary-erp mt-3"
                (click)="completeFeePaymentThroughApi()"
              >
                Complete test payment
              </button>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button class="btn-outline-erp" (click)="closePaymentModal()">Cancel</button>
            <button *ngIf="paymentStep === 'review'" class="btn-primary-erp" [disabled]="!canContinueFromPaymentReview" (click)="continuePaymentReview()">Continue</button>
            <button *ngIf="paymentStep === 'method'" class="btn-outline-erp me-auto" (click)="backToPaymentReview()">Back</button>
            <button *ngIf="paymentStep === 'method'" class="btn-primary-erp" [disabled]="!canSubmitPaymentMethod" (click)="goToPaymentConfirm()">Open pay screen</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ParentPortalComponent implements OnInit {
  /** Expose for template comparisons (canonical provider ids). */
  readonly PAYMENT_PROVIDER_IDS = PAYMENT_PROVIDER_IDS;

  children: Student[] = [];
  selectedStudentId: number | null = null;
  selectedChild: Student | null = null;
  tab: 'attendance' | 'fees' = 'attendance';
  fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  toDate = new Date().toISOString().split('T')[0];
  attendanceStats: AttendanceStats = { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0, attendancePercentage: 0 };
  attendanceRecords: AttendanceRecord[] = [];
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

  constructor(private parentService: ParentService) {}

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
      return 'No fee selected.';
    }
    const raw = Number(this.paymentAmount);
    if (!Number.isFinite(raw)) {
      return 'Enter a valid number.';
    }
    if (raw <= 0) {
      return 'Amount must be greater than zero.';
    }
    const max = Number(ob.payableNow);
    if (!Number.isFinite(max) || max <= 0) {
      return 'Nothing is payable for this fee right now.';
    }
    const rounded = Math.round(raw * 100) / 100;
    const maxRounded = Math.round(max * 100) / 100;
    if (rounded > maxRounded) {
      return `Amount cannot exceed current payable (${ob.currency} ${maxRounded.toFixed(2)}).`;
    }
    if (rounded < 0.01) {
      return 'Minimum payment is 0.01.';
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
    this.refreshPortal();
  }

  refreshPortal(): void {
    this.parentService.getChildren().subscribe(children => {
      this.children = children;
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
    this.reloadSelectedChild();
  }

  reloadSelectedChild(): void {
    if (this.selectedStudentId == null) {
      this.receiptHistory = [];
      this.latestReceipt = null;
      this.receiptLookupByPaymentId = new Map();
      return;
    }
    this.parentService.getChildOverview(this.selectedStudentId, this.fromDate, this.toDate).subscribe(data => {
      this.marks = data.marks;
      this.fees = data.fees;
      this.attendanceStats = data.attendance;
      this.attendanceRecords = data.attendanceRecords;
      this.totalPending = this.fees.reduce((sum, fee) => sum + fee.dueAmount, 0);
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

  receiptLedgerStatus(r: PaymentReceipt): string {
    const due = r.dueAmount ?? 0;
    if (due <= 0) {
      return 'Paid';
    }
    if ((r.paidAmount ?? 0) > 0) {
      return 'Partial';
    }
    return 'Posted';
  }

  getAttendanceRemarks(record: AttendanceRecord): string {
    const remarks = (record as AttendanceRecord & { remarks?: string }).remarks;
    return remarks && remarks.trim() ? remarks : '-';
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
        this.paymentGatewayMessage =
          'Razorpay is preview-only in mock portal. Choose Instant (demo) to record a payment, or set useMocks to false for real checkout.';
        return;
      }
      this.processingPayment = true;
      const returnUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/app/parent` : '/app/parent';
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
              this.paymentGatewayMessage =
                'Order created but Razorpay publishable key is missing on the API. Set app.payments.razorpay.key or RAZORPAY_KEY, then try again.';
            }
          },
          error: () => {
            this.processingPayment = false;
            this.paymentGatewayMessage =
              'Could not create checkout. Use valid Razorpay keys on the API, amount ≤ payable, and a real parent login.';
          },
        });
      return;
    }

    if (this.useMocks && this.paymentProvider === PAYMENT_PROVIDER_IDS.MOCKPAY) {
      this.paymentStep = 'confirm';
      return;
    }

    this.paymentGatewayMessage = 'This payment method is not available.';
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
      this.paymentGatewayMessage = 'Missing Razorpay key on server (RAZORPAY_KEY).';
      return;
    }
    const currency = (ob.currency || 'INR').toUpperCase();
    if (currency !== 'INR') {
      this.paymentGatewayMessage = 'Razorpay checkout supports INR only in this integration.';
      return;
    }
    const paise = Math.round(Number(session.amount) * 100);
    openRazorpaySchoolFeeCheckout({
      keyId: key,
      orderId: session.providerOrderId,
      amountPaise: paise,
      currency,
      name: 'SchoolVault',
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
              this.paymentGatewayMessage =
                'Confirmation failed. If your account was debited, contact the school with your bank reference.';
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
        returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/app/parent` : '/app/parent',
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
                this.paymentGatewayMessage = 'Payment confirmation failed.';
              },
            });
        },
        error: () => {
          this.processingPayment = false;
          this.paymentGatewayMessage = 'Could not start payment session.';
        },
      });
  }

  downloadReceipt(receipt: PaymentReceipt): void {
    const html = `
      <html><head><title>${receipt.receiptNumber}</title></head><body style="font-family: Arial, sans-serif; padding: 24px;">
      <h1>School Fee Receipt</h1>
      <p><strong>Receipt:</strong> ${receipt.receiptNumber}</p>
      <p><strong>Student:</strong> ${receipt.studentName}</p>
      <p><strong>Fee Plan:</strong> ${receipt.feeStructureName}</p>
      <p><strong>Payment Date:</strong> ${receipt.paymentDate || '-'}</p>
      <p><strong>Amount Paid:</strong> ${receipt.currency} ${receipt.amountPaid}</p>
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
