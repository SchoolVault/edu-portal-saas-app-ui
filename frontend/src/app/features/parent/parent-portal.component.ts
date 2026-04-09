import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../../core/services/parent.service';
import { AttendanceRecord, AttendanceStats, CheckoutSession, FeePayment, MarkRecord, ParentFeeObligation, PaymentReceipt, Student } from '../../core/models/models';

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="parent-portal-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Parent Portal</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Track your child’s attendance, fees, and performance</p>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="erp-label">Child</label>
            <select class="erp-select" [(ngModel)]="selectedStudentId" (change)="onStudentChange()">
              <option value="">Select Child</option>
              <option *ngFor="let child of children" [value]="child.id">
                {{ child.firstName }} {{ child.lastName }} - {{ child.className || ('Class ' + child.classId) }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="erp-label">From</label>
            <input type="date" class="erp-input" [(ngModel)]="fromDate" (change)="reloadSelectedChild()">
          </div>
          <div class="col-md-3">
            <label class="erp-label">To</label>
            <input type="date" class="erp-input" [(ngModel)]="toDate" (change)="reloadSelectedChild()">
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
                    <button class="btn-outline-erp btn-sm" *ngIf="latestReceipt?.paymentId === obligation.paymentId && latestReceipt" (click)="downloadReceipt(latestReceipt!)">Download Receipt</button>
                    <button class="btn-primary-erp btn-sm" [disabled]="obligation.payableNow <= 0 || processingPayment" (click)="openPayment(obligation)">
                      {{ obligation.payableNow > 0 ? 'Pay Now' : 'Settled' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="erp-card" style="height: 100%;">
                <div class="erp-card-header"><h3 class="erp-card-title">Payment Activity</h3></div>
                <div *ngIf="latestReceipt; else paymentHelp" class="insight-card" style="margin-bottom: 16px;">
                  <div class="insight-label">Latest Receipt</div>
                  <div class="insight-value">{{ latestReceipt.receiptNumber }}</div>
                  <div class="insight-subtext">{{ latestReceipt.paymentDate }} · {{ latestReceipt.amountPaid | currency:latestReceipt.currency:'symbol':'1.0-0' }}</div>
                </div>
                <ng-template #paymentHelp>
                  <div class="empty-state" style="padding: 32px 16px;">
                    <i class="bi bi-receipt-cutoff"></i>
                    <h3>No recent receipt</h3>
                    <p>Once a payment is confirmed, receipt details will appear here.</p>
                  </div>
                </ng-template>
                <table class="erp-table" *ngIf="fees.length">
                  <thead><tr><th>Receipt</th><th>Paid</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr *ngFor="let fee of fees">
                      <td>{{ fee.receiptNumber || '-' }}</td>
                      <td>{{ fee.paidAmount | number:'1.0-0' }}</td>
                      <td>{{ fee.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div *ngIf="!feeObligations.length" class="empty-state"><h3>No fee records</h3></div>
        </div>

        <div class="erp-card" *ngIf="tab === 'marks'">
          <table class="erp-table" *ngIf="marks.length">
            <thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th></tr></thead>
            <tbody>
              <tr *ngFor="let mark of marks">
                <td>{{ mark.subjectName }}</td>
                <td>{{ mark.marksObtained }}</td>
                <td>{{ mark.maxMarks }}</td>
                <td>{{ mark.grade }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="!marks.length" class="empty-state"><h3>No marks published yet</h3></div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showPaymentModal && selectedObligation" (click)="closePaymentModal()">
        <div class="modal-content-erp" style="max-width: 720px;" (click)="$event.stopPropagation()">
          <div class="modal-header-erp">
            <h3>Pay School Fees</h3>
            <button class="btn-icon" (click)="closePaymentModal()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body-erp">
            <div class="row g-4">
              <div class="col-md-7">
                <div class="insight-card mb-3">
                  <div class="insight-label">Payment For</div>
                  <div class="insight-value">{{ selectedObligation.studentName }}</div>
                  <div class="insight-subtext">{{ selectedObligation.feeStructureName }} · {{ selectedObligation.className }}</div>
                </div>
                <div *ngFor="let line of selectedObligation.lineItems" class="d-flex justify-content-between align-items-center" style="padding: 8px 0; border-bottom: 1px solid var(--clr-border-light);">
                  <span>{{ line.name }}</span>
                  <strong>{{ line.amount | currency:selectedObligation.currency:'symbol':'1.0-0' }}</strong>
                </div>
              </div>
              <div class="col-md-5">
                <div class="erp-form-group">
                  <label class="erp-label">Payment Provider</label>
                  <select class="erp-select" [(ngModel)]="paymentProvider">
                    <option value="mockpay">MockPay Gateway</option>
                    <option value="razorpay">Razorpay Adapter</option>
                    <option value="stripe">Stripe Adapter</option>
                  </select>
                </div>
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
          </div>
          <div class="modal-footer-erp">
            <button class="btn-outline-erp" (click)="closePaymentModal()">Cancel</button>
            <button class="btn-primary-erp" [disabled]="processingPayment || paymentAmount <= 0" (click)="startPayment()">
              {{ processingPayment ? 'Processing...' : 'Proceed to Pay' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ParentPortalComponent implements OnInit {
  children: Student[] = [];
  selectedStudentId = '';
  selectedChild: Student | null = null;
  tab: 'attendance' | 'fees' | 'marks' = 'attendance';
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
  currentCheckoutSession: CheckoutSession | null = null;

  constructor(private parentService: ParentService) {}

  ngOnInit(): void {
    this.parentService.getChildren().subscribe(children => {
      this.children = children;
      if (children.length) {
        this.selectedStudentId = children[0].id;
        this.onStudentChange();
      }
    });
  }

  onStudentChange(): void {
    this.selectedChild = this.children.find(child => child.id === this.selectedStudentId) ?? null;
    this.reloadSelectedChild();
  }

  reloadSelectedChild(): void {
    if (!this.selectedStudentId) return;
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
  }

  getAttendanceRemarks(record: AttendanceRecord): string {
    const remarks = (record as AttendanceRecord & { remarks?: string }).remarks;
    return remarks && remarks.trim() ? remarks : '-';
  }

  openPayment(obligation: ParentFeeObligation): void {
    this.selectedObligation = obligation;
    this.paymentAmount = obligation.payableNow;
    this.paymentProvider = 'mockpay';
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedObligation = null;
    this.paymentAmount = 0;
    this.processingPayment = false;
    this.currentCheckoutSession = null;
  }

  startPayment(): void {
    if (!this.selectedObligation || !this.selectedChild || this.paymentAmount <= 0) {
      return;
    }
    this.processingPayment = true;
    this.parentService.createCheckoutSession({
      paymentId: this.selectedObligation.paymentId,
      studentId: this.selectedChild.id,
      amount: this.paymentAmount,
      provider: this.paymentProvider,
      returnUrl: '/app/parent'
    }).subscribe(session => {
      this.currentCheckoutSession = session;
      this.parentService.confirmCheckout(session.attemptId, session.checkoutToken, session.providerOrderId + '-SUCCESS').subscribe(receipt => {
        this.latestReceipt = receipt;
        this.processingPayment = false;
        this.closePaymentModal();
        this.reloadSelectedChild();
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
