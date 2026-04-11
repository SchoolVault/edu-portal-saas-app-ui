import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../../core/services/parent.service';
import { PaymentCheckoutService } from '../../core/services/payment-checkout.service';
import { runtimeConfig } from '../../core/config/runtime-config';
import {
  AttendanceRecord,
  AttendanceStats,
  CheckoutSession,
  ExamScheduleSlot,
  FeePayment,
  MarkRecord,
  ParentExamSummary,
  ParentFeeObligation,
  PaymentReceipt,
  Student,
} from '../../core/models/models';
import { coerceApiLongId } from '../../core/utils/coerce-api-long-id';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent],
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
    `,
  ],
  template: `
    <div data-testid="parent-portal-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Parent Portal</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Track attendance, fees, exams (timetable + published results), and performance. Fee payments are per selected child.</p>
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

        <div class="erp-tabs mb-3">
          <button class="erp-tab" [class.active]="tab === 'attendance'" (click)="tab = 'attendance'">Attendance</button>
          <button class="erp-tab" [class.active]="tab === 'fees'" (click)="tab = 'fees'">Fees</button>
          <button class="erp-tab" [class.active]="tab === 'exams'" (click)="onExamsTab()">Exams</button>
          <button class="erp-tab" [class.active]="tab === 'marks'" (click)="tab = 'marks'">Marks</button>
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
                    <p class="text-muted mb-0" style="font-size: 12px;">{{ obligation.className }} · Due {{ obligation.dueDate || '-' }}</p>
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

        <div class="erp-card" *ngIf="tab === 'exams'">
          <p class="text-muted small mb-3">
            Only exams that include your child’s <strong>class and section</strong> appear here. Timetable shows their papers only; results appear after the school publishes them.
          </p>
          <div class="row g-3 align-items-end mb-3" *ngIf="examSummaries.length">
            <div class="col-md-6">
              <label class="erp-label">Exam</label>
              <select class="erp-select" [(ngModel)]="selectedExamId" (ngModelChange)="loadSelectedExamDetail()">
                <option *ngFor="let ex of examSummaries" [ngValue]="ex.id">{{ examOptionLabel(ex) }}</option>
              </select>
            </div>
            <div class="col-md-6 text-md-end">
              <span class="badge-erp" [class.badge-success]="selectedExam?.resultsPublished" [class.badge-neutral]="!selectedExam?.resultsPublished">
                {{ selectedExam?.resultsPublished ? 'Results published' : 'Results not published' }}
              </span>
            </div>
          </div>
          <div *ngIf="!examSummaries.length" class="empty-state"><h3>No exams for this class</h3><p class="small mb-0">When the school schedules assessments for this class or section, they will show here.</p></div>

          <ng-container *ngIf="selectedExam && examSummaries.length">
            <h4 class="mt-4 mb-2" style="font-size: 15px; font-weight: 800;">Timetable (your child)</h4>
            <table class="erp-table mb-4" *ngIf="examSchedule.length">
              <thead>
                <tr><th>Date</th><th>Time</th><th>Subject</th><th>Room</th><th>Notes</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of examSchedule">
                  <td>{{ row.examDate }}</td>
                  <td>{{ formatExamTime(row.startTime) }} – {{ formatExamTime(row.endTime) }}</td>
                  <td>{{ row.subjectName }}</td>
                  <td>{{ row.room || '—' }}</td>
                  <td>{{ row.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p *ngIf="!examSchedule.length" class="text-muted small mb-4">No timetable rows for your child’s section yet.</p>

            <h4 class="mb-2" style="font-size: 15px; font-weight: 800;">Results (this exam)</h4>
            <table class="erp-table" *ngIf="examMarks.length">
              <thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th></tr></thead>
              <tbody>
                <tr *ngFor="let mark of examMarks">
                  <td>{{ mark.subjectName }}</td>
                  <td>{{ mark.marksObtained }}</td>
                  <td>{{ mark.maxMarks }}</td>
                  <td>{{ mark.grade }}</td>
                </tr>
              </tbody>
            </table>
            <p *ngIf="!examMarks.length" class="text-muted small mb-0">
              <ng-container *ngIf="selectedExam.resultsPublished">No mark rows for your child in this exam yet.</ng-container>
              <ng-container *ngIf="!selectedExam.resultsPublished">The school has not published results for this exam yet.</ng-container>
            </p>
          </ng-container>
        </div>

        <div class="erp-card" *ngIf="tab === 'marks'">
          <p class="text-muted small mb-2">All <strong>published</strong> results across exams for your child’s class/section (same data as the Exams tab, aggregated).</p>
          <table class="erp-table" *ngIf="marks.length">
            <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th></tr></thead>
            <tbody>
              <tr *ngFor="let mark of marks">
                <td>{{ examNameForMark(mark.examId) }}</td>
                <td>{{ mark.subjectName }}</td>
                <td>{{ mark.marksObtained }}</td>
                <td>{{ mark.maxMarks }}</td>
                <td>{{ mark.grade }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!marks.length" class="empty-state"><h3>No published marks yet</h3></div>
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
                  <input type="number" class="erp-input" [(ngModel)]="paymentAmount" min="1" [max]="selectedObligation.payableNow">
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
                <p class="text-muted small">India rails: UPI and netbanking typically go through Razorpay (or similar) Checkout. Bank transfer uses NEFT/IMPS references from your ERP. Demo providers below all hit the same mock gateway with distinct labels for QA.</p>
              </div>
              <div class="col-md-4" *ngFor="let m of paymentMethods">
                <button type="button" class="erp-card w-100 text-start p-3 border-0" style="cursor: pointer; border: 2px solid transparent;" [style.borderColor]="paymentProvider === m.id ? 'var(--clr-accent)' : 'var(--clr-border-light)'" (click)="paymentProvider = m.id">
                  <div style="font-weight: 800;">{{ m.label }}</div>
                  <div class="text-muted small">{{ m.hint }}</div>
                </button>
              </div>
            </div>
            <div *ngIf="paymentStep === 'confirm'" class="text-center py-3">
              <p class="mb-2" *ngIf="processingPayment"><span class="spinner me-2"></span>Talking to gateway…</p>
              <p class="text-muted small mb-0" *ngIf="lastOrderPreview">Order {{ lastOrderPreview.providerOrderId }} · {{ lastOrderPreview.amount | currency:selectedObligation!.currency:'symbol':'1.0-0' }}</p>
              <p class="text-muted small mt-2" *ngIf="useMocks">Demo: no script loaded — click Complete to simulate a successful authorization.</p>
              <button *ngIf="useMocks && !processingPayment" type="button" class="btn-primary-erp mt-3" (click)="simulateGatewaySuccess()">Simulate successful payment</button>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button class="btn-outline-erp" (click)="closePaymentModal()">Cancel</button>
            <button *ngIf="paymentStep === 'review'" class="btn-primary-erp" [disabled]="paymentAmount <= 0" (click)="paymentStep = 'method'">Continue</button>
            <button *ngIf="paymentStep === 'method'" class="btn-outline-erp me-auto" (click)="paymentStep = 'review'">Back</button>
            <button *ngIf="paymentStep === 'method'" class="btn-primary-erp" (click)="goToPaymentConfirm()">Open pay screen</button>
            <button *ngIf="paymentStep === 'confirm' && !useMocks" class="btn-primary-erp" [disabled]="processingPayment" (click)="startPayment()">
              {{ processingPayment ? 'Processing...' : 'Confirm paid' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ParentPortalComponent implements OnInit {
  children: Student[] = [];
  selectedStudentId: number | null = null;
  selectedChild: Student | null = null;
  tab: 'attendance' | 'fees' | 'marks' | 'exams' = 'attendance';
  examSummaries: ParentExamSummary[] = [];
  selectedExamId: number | null = null;
  examSchedule: ExamScheduleSlot[] = [];
  examMarks: MarkRecord[] = [];
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
  paymentProvider = 'mockpay';
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
  readonly useMocks = runtimeConfig.useMocks;
  paymentMethods = [
    { id: 'mockpay', label: 'Instant (demo)', hint: 'Local mock — no external call' },
    { id: 'upi', label: 'UPI', hint: 'Mock UPI intent / Razorpay in prod' },
    { id: 'netbanking', label: 'Netbanking', hint: 'Mock bank redirect / Razorpay in prod' },
    { id: 'banktransfer', label: 'Bank transfer', hint: 'NEFT/IMPS reference (manual reconcile)' },
    { id: 'razorpay', label: 'Razorpay', hint: 'UPI · Cards · Netbanking (SDK in prod)' },
    { id: 'stripe', label: 'Stripe', hint: 'Cards · Wallets (Payment Element)' },
  ];

  constructor(
    private parentService: ParentService,
    private paymentCheckout: PaymentCheckoutService
  ) {}

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
      this.examSummaries = [];
      this.selectedExamId = null;
      this.examSchedule = [];
      this.examMarks = [];
      return;
    }
    this.parentService.getChildOverview(this.selectedStudentId, this.fromDate, this.toDate).subscribe(data => {
      this.marks = data.marks;
      this.fees = data.fees;
      this.attendanceStats = data.attendance;
      this.attendanceRecords = data.attendanceRecords;
      this.totalPending = this.fees.reduce((sum, fee) => sum + fee.dueAmount, 0);
    });
    this.parentService.getChildExams(this.selectedStudentId).subscribe(list => {
      this.examSummaries = list;
      if (this.tab === 'exams') {
        if (!list.length) {
          this.selectedExamId = null;
          this.examSchedule = [];
          this.examMarks = [];
          return;
        }
        const stillValid = this.selectedExamId != null && list.some(e => e.id === this.selectedExamId);
        if (!stillValid) {
          this.selectedExamId = list[0].id;
        }
        this.loadSelectedExamDetail();
      }
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

  get selectedExam(): ParentExamSummary | null {
    if (this.selectedExamId == null) {
      return null;
    }
    return this.examSummaries.find(e => e.id === this.selectedExamId) ?? null;
  }

  onExamsTab(): void {
    this.tab = 'exams';
    if (this.selectedStudentId == null) {
      return;
    }
    if (!this.examSummaries.length) {
      this.parentService.getChildExams(this.selectedStudentId).subscribe(list => {
        this.examSummaries = list;
        this.selectedExamId = list.length ? list[0].id : null;
        this.loadSelectedExamDetail();
      });
      return;
    }
    const stillValid = this.selectedExamId != null && this.examSummaries.some(e => e.id === this.selectedExamId);
    if (!stillValid) {
      this.selectedExamId = this.examSummaries[0].id;
    }
    this.loadSelectedExamDetail();
  }

  loadSelectedExamDetail(): void {
    if (this.selectedStudentId == null || this.selectedExamId == null) {
      this.examSchedule = [];
      this.examMarks = [];
      return;
    }
    const eid = this.selectedExamId;
    this.parentService.getChildExamSchedule(this.selectedStudentId, eid).subscribe(rows => (this.examSchedule = rows));
    this.parentService.getChildExamMarks(this.selectedStudentId, eid).subscribe(rows => (this.examMarks = rows));
  }

  examOptionLabel(ex: ParentExamSummary): string {
    const tail = ex.resultsPublished ? ' · Results out' : '';
    return `${ex.name} · ${ex.startDate} → ${ex.endDate}${tail}`;
  }

  examNameForMark(examId: number): string {
    return this.examSummaries.find(e => e.id === examId)?.name ?? `Exam #${examId}`;
  }

  /** Show HH:MM for API times like "09:00:00". */
  formatExamTime(t: string): string {
    if (!t) {
      return '—';
    }
    const parts = t.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
  }

  getAttendanceRemarks(record: AttendanceRecord): string {
    const remarks = (record as AttendanceRecord & { remarks?: string }).remarks;
    return remarks && remarks.trim() ? remarks : '-';
  }

  openPayment(obligation: ParentFeeObligation): void {
    this.selectedObligation = obligation;
    this.paymentAmount = obligation.payableNow;
    this.paymentProvider = 'mockpay';
    this.paymentStep = 'review';
    this.lastOrderPreview = null;
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedObligation = null;
    this.paymentAmount = 0;
    this.processingPayment = false;
    this.currentCheckoutSession = null;
    this.paymentStep = 'review';
    this.lastOrderPreview = null;
  }

  goToPaymentConfirm(): void {
    if (!this.selectedObligation || !this.selectedChild || this.paymentAmount <= 0) {
      return;
    }
    if (this.paymentProvider === 'mockpay' || this.paymentProvider === 'upi' || this.paymentProvider === 'netbanking' || this.paymentProvider === 'banktransfer') {
      this.paymentStep = 'confirm';
      this.simulateGatewaySuccess();
      return;
    }
    const prov = this.paymentProvider === 'stripe' ? 'STRIPE' : 'RAZORPAY';
    this.processingPayment = true;
    this.paymentCheckout
      .createOrder({
        purpose: 'SCHOOL_FEE',
        feePaymentId: this.selectedObligation.paymentId,
        studentId: coerceApiLongId(this.selectedChild.id, 'student'),
        amount: this.paymentAmount,
        currency: this.selectedObligation.currency || 'INR',
        provider: prov,
        returnUrl: '/app/parent',
      })
      .subscribe({
        next: ord => {
          this.lastOrderPreview = { providerOrderId: ord.providerOrderId, amount: ord.amount };
          this.processingPayment = false;
          this.paymentStep = 'confirm';
        },
        error: () => {
          this.processingPayment = false;
        },
      });
  }

  simulateGatewaySuccess(): void {
    this.startPayment();
  }

  startPayment(): void {
    if (!this.selectedObligation || !this.selectedChild || this.paymentAmount <= 0) {
      return;
    }
    this.processingPayment = true;
    this.parentService
      .createCheckoutSession({
        paymentId: this.selectedObligation.paymentId,
        studentId: coerceApiLongId(this.selectedChild.id, 'student'),
        amount: this.paymentAmount,
        provider: this.paymentProvider,
        returnUrl: '/app/parent',
      })
      .subscribe(session => {
        this.currentCheckoutSession = session;
        this.parentService.confirmCheckout(session.attemptId, session.checkoutToken, session.providerOrderId + '-SUCCESS').subscribe(receipt => {
          this.latestReceipt = receipt;
          this.processingPayment = false;
          this.closePaymentModal();
          this.reloadSelectedChild();
          this.reloadReceiptHistory();
          this.reloadReceiptLookup();
        });
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
