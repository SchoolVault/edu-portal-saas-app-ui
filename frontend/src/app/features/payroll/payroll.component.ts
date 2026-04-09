import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Payslip, SalaryStructure, TeacherPaymentDetails } from '../../core/models/models';
import { PayrollService } from '../../core/services/payroll.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="payroll-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Payroll</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            {{ isAdmin ? 'Salary structures, bank disbursement, payslips & PDFs' : isTeacher ? 'Your payslips and PDF downloads' : 'Payroll is available to administrators and teachers.' }}
          </p>
        </div>
        <div *ngIf="isAdmin || isTeacher" class="d-flex gap-2 align-items-end flex-wrap">
          <div>
            <label class="erp-label d-block mb-1">Month</label>
            <select class="erp-select" [(ngModel)]="genMonth">
              <option *ngFor="let m of monthNames" [value]="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="erp-label d-block mb-1">Year</label>
            <input class="erp-input" type="number" [(ngModel)]="genYear" style="width: 100px;">
          </div>
          <button *ngIf="isAdmin" class="btn-primary-erp btn-sm align-self-end" data-testid="generate-payslips-btn" [disabled]="generating" (click)="runGenerate()">
            <i class="bi bi-file-earmark-text"></i> {{ generating ? 'Generating…' : 'Generate payslips' }}
          </button>
          <button class="btn-outline-erp btn-sm align-self-end" type="button" (click)="refreshPayroll()">Refresh</button>
        </div>
      </div>

        <div *ngIf="genError" class="alert alert-danger py-2 small mb-3">{{ genError }}</div>
        <div *ngIf="disburseInfo" class="alert alert-success py-2 small mb-3">{{ disburseInfo }}</div>

      <div *ngIf="isAdmin" class="row g-4 mb-4 animate-in animate-in-delay-1">
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(27,58,48,0.1); color: #1B3A30;"><i class="bi bi-people-fill"></i></div><div class="stat-value">{{ salaryStructures.length }}</div><div class="stat-label">Salary structures</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(5,150,105,0.1); color: #059669;"><i class="bi bi-wallet-fill"></i></div><div class="stat-value">₹{{ totalPayroll | number:'1.0-0':'en-IN' }}</div><div class="stat-label">Net payroll (structures)</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(2,132,199,0.1); color: #0284C7;"><i class="bi bi-receipt"></i></div><div class="stat-value">{{ payslips.length }}</div><div class="stat-label">Payslips (filter)</div></div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card"><div class="stat-icon" style="background: rgba(192,92,61,0.12); color: #C05C3D;"><i class="bi bi-bank"></i></div><div class="stat-value">{{ bankReadyCount }}/{{ paymentDetails.length }}</div><div class="stat-label">Bank profiles ready</div></div>
        </div>
      </div>

      <div *ngIf="isAdmin" class="erp-card animate-in animate-in-delay-2 mb-4 payroll-disburse-card">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 class="erp-card-title mb-1">Salary disbursement</h4>
            <p class="text-muted small mb-0">Pick a teacher for a simple payment checklist, or use the table for everyone. Generate payslips for the month first, then initiate bank transfer.</p>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="loadPaymentDetails()"><i class="bi bi-arrow-clockwise"></i> Reload bank list</button>
        </div>

        <div class="row g-3 mb-4" *ngIf="paymentDetails.length">
          <div class="col-md-4">
            <label class="erp-label">Teacher (step-by-step)</label>
            <select class="erp-select" [(ngModel)]="payrollFocusTeacherId">
              <option value="">— Choose teacher —</option>
              <option *ngFor="let d of paymentDetails" [value]="d.teacherId">{{ d.teacherName }}</option>
            </select>
          </div>
          <div class="col-md-8" *ngIf="payrollFocusDetail as fd">
            <div class="p-3 rounded-3 payroll-focus-panel">
              <div class="row g-2 small">
                <div class="col-sm-6"><span class="text-muted">Pay to</span><br><strong>{{ fd.bankAccountHolder || fd.teacherName }}</strong></div>
                <div class="col-sm-6"><span class="text-muted">Bank</span><br><strong>{{ fd.bankName || '—' }}</strong></div>
                <div class="col-sm-6"><span class="text-muted">Account</span><br><code class="user-select-all">{{ fd.bankAccountMasked || '—' }}</code></div>
                <div class="col-sm-6"><span class="text-muted">IFSC</span><br><code class="user-select-all">{{ fd.bankIfsc || '—' }}</code></div>
                <div class="col-sm-6"><span class="text-muted">Salary structure (monthly net)</span><br><strong>₹{{ fd.monthlyNetSalary | number:'1.0-0':'en-IN' }}</strong></div>
                <div class="col-sm-6"><span class="text-muted">Payslip ({{ genMonth }} {{ genYear }})</span><br>
                  <ng-container *ngIf="payslipForTeacher(fd.teacherId) as ps">
                    <strong>₹{{ ps.netSalary | number:'1.0-0':'en-IN' }}</strong>
                    <span class="badge-erp ms-1" [class.badge-neutral]="ps.status === 'generated'" [class.badge-success]="ps.status === 'paid'">{{ ps.status }}</span>
                  </ng-container>
                  <span *ngIf="!payslipForTeacher(fd.teacherId)" class="text-warning">Generate payslips for this period first.</span>
                </div>
              </div>
              <div class="mt-3 d-flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-primary-erp btn-sm"
                  [disabled]="!canInitiateDisburse(fd) || disbursingTeacherId === fd.teacherId"
                  (click)="runDisburse(fd)"
                >
                  {{ disbursingTeacherId === fd.teacherId ? 'Submitting…' : 'Initiate transfer for this teacher' }}
                </button>
                <span class="text-muted small align-self-center">After your bank confirms, mark the payslip paid in the table below.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Monthly net (structure)</th>
                <th>Bank</th>
                <th>Account</th>
                <th>IFSC</th>
                <th>Status</th>
                <th class="text-end">Bank transfer</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of paymentDetails">
                <td><strong>{{ d.teacherName }}</strong></td>
                <td>₹{{ d.monthlyNetSalary | number:'1.0-0':'en-IN' }}</td>
                <td>{{ d.bankName || '—' }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ d.bankAccountMasked || '—' }}</td>
                <td style="font-family: monospace; font-size: 12px;">{{ d.bankIfsc || '—' }}</td>
                <td>
                  <span class="badge-erp" [class.badge-success]="d.bankDetailsComplete" [class.badge-warning]="!d.bankDetailsComplete">
                    {{ d.bankDetailsComplete ? 'Ready' : 'Incomplete' }}
                  </span>
                </td>
                <td class="text-end">
                  <button
                    type="button"
                    class="btn-primary-erp btn-xs"
                    [disabled]="!canInitiateDisburse(d) || disbursingTeacherId === d.teacherId"
                    (click)="runDisburse(d)"
                    title="Uses net from generated payslip for selected month/year"
                  >
                    {{ disbursingTeacherId === d.teacherId ? 'Submitting…' : 'Initiate' }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!paymentDetails.length"><td colspan="7" class="text-muted text-center py-3">No salary structures yet.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="isAdmin" class="erp-card animate-in mb-4">
        <h4 class="erp-card-title mb-3">Salary structures</h4>
        <table class="erp-table" data-testid="salary-table">
          <thead><tr><th>Teacher</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net</th></tr></thead>
          <tbody>
            <tr *ngFor="let s of salaryStructures">
              <td><strong>{{ s.teacherName }}</strong></td>
              <td>₹{{ s.basicSalary | number:'1.0-0':'en-IN' }}</td>
              <td style="color: var(--clr-success);">+₹{{ getAllowanceTotal(s) | number:'1.0-0':'en-IN' }}</td>
              <td style="color: var(--clr-danger);">-₹{{ getDeductionTotal(s) | number:'1.0-0':'en-IN' }}</td>
              <td><strong>₹{{ s.netSalary | number:'1.0-0':'en-IN' }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card animate-in" *ngIf="isAdmin || isTeacher">
        <h4 class="erp-card-title mb-3">{{ isTeacher ? 'My payslips' : 'Generated payslips' }}</h4>
        <p class="text-muted small mb-2">Filtered by month/year above. PDF opens in a new tab; mark paid after you confirm the bank transfer (admin only).</p>
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>Teacher</th><th>Period</th><th>Net</th><th>Status</th><th>Paid on</th><th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payslips">
                <td><strong>{{ p.teacherName }}</strong></td>
                <td>{{ p.month }} {{ p.year }}</td>
                <td><strong>₹{{ p.netSalary | number:'1.0-0':'en-IN' }}</strong></td>
                <td>
                  <span class="badge-erp" [class.badge-neutral]="p.status === 'generated'" [class.badge-success]="p.status === 'paid'">{{ p.status }}</span>
                </td>
                <td>{{ p.paymentDate || '—' }}</td>
                <td class="text-end text-nowrap">
                  <button type="button" class="btn-outline-erp btn-xs me-1" (click)="openPdf(p)" [disabled]="pdfLoadingId === p.id">
                    <i class="bi bi-file-pdf"></i> PDF
                  </button>
                  <button *ngIf="isAdmin && p.status === 'generated'" type="button" class="btn-primary-erp btn-xs" (click)="markPaid(p)" [disabled]="markingId === p.id">Mark paid</button>
                </td>
              </tr>
              <tr *ngIf="payslips.length === 0"><td colspan="6" class="text-muted text-center py-4">No payslips for this period.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="!isAdmin && !isTeacher" class="erp-card text-muted text-center py-5">
        <i class="bi bi-lock" style="font-size: 2rem;"></i>
        <p class="mt-2 mb-0">You do not have access to payroll details.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .payroll-disburse-card {
        border: 1px solid color-mix(in srgb, var(--clr-primary) 18%, var(--clr-border));
        background: linear-gradient(135deg, color-mix(in srgb, var(--clr-surface) 92%, var(--clr-primary) 8%), var(--clr-surface));
      }
      .payroll-focus-panel {
        border: 1px solid var(--clr-border);
        background: var(--clr-surface-muted);
      }
      .user-select-all {
        user-select: all;
        font-size: 12px;
      }
    `
  ]
})
export class PayrollComponent implements OnInit {
  salaryStructures: SalaryStructure[] = [];
  paymentDetails: TeacherPaymentDetails[] = [];
  payslips: Payslip[] = [];
  genMonth = 'April';
  genYear = new Date().getFullYear();
  generating = false;
  genError = '';
  disburseInfo = '';
  disbursingTeacherId: string | null = null;
  pdfLoadingId: string | null = null;
  markingId: string | null = null;
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  isAdmin = false;
  isTeacher = false;
  payrollFocusTeacherId = '';

  get bankReadyCount(): number {
    return this.paymentDetails.filter(d => d.bankDetailsComplete).length;
  }

  constructor(
    private payrollService: PayrollService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const r = (this.auth.getRole() ?? '').toLowerCase();
    this.isAdmin = r === 'admin';
    this.isTeacher = r === 'teacher';
    if (this.isAdmin) {
      this.payrollService.getStructures().subscribe(s => (this.salaryStructures = s));
      this.loadPaymentDetails();
    }
    this.refreshPayroll();
  }

  loadPaymentDetails(): void {
    if (!this.isAdmin) return;
    this.payrollService.getTeacherPaymentDetails().subscribe(d => {
      this.paymentDetails = d;
      if (this.payrollFocusTeacherId && !d.some(x => x.teacherId === this.payrollFocusTeacherId)) {
        this.payrollFocusTeacherId = '';
      }
    });
  }

  get payrollFocusDetail(): TeacherPaymentDetails | null {
    if (!this.payrollFocusTeacherId) return null;
    return this.paymentDetails.find(d => d.teacherId === this.payrollFocusTeacherId) ?? null;
  }

  get totalPayroll(): number {
    return this.salaryStructures.reduce((sum, s) => sum + s.netSalary, 0);
  }

  getAllowanceTotal(s: SalaryStructure): number {
    return s.allowances.reduce((sum, a) => sum + a.amount, 0);
  }

  getDeductionTotal(s: SalaryStructure): number {
    return s.deductions.reduce((sum, d) => sum + d.amount, 0);
  }

  payslipForTeacher(teacherId: string): Payslip | undefined {
    const y = Number(this.genYear);
    const m = this.genMonth.trim().toLowerCase();
    return this.payslips.find(
      p =>
        p.teacherId === teacherId &&
        p.year === y &&
        (p.month || '').trim().toLowerCase() === m &&
        p.status === 'generated'
    );
  }

  canInitiateDisburse(d: TeacherPaymentDetails): boolean {
    if (!d.bankDetailsComplete) return false;
    return !!this.payslipForTeacher(d.teacherId);
  }

  runDisburse(d: TeacherPaymentDetails): void {
    this.disburseInfo = '';
    this.genError = '';
    if (!this.canInitiateDisburse(d)) return;
    this.disbursingTeacherId = d.teacherId;
    this.payrollService.initiateDisbursement(d.teacherId, this.genMonth, Number(this.genYear)).subscribe({
      next: res => {
        this.disbursingTeacherId = null;
        this.disburseInfo = `Transfer queued: ${res.referenceId} · ₹${res.amount.toLocaleString('en-IN')} for ${res.teacherName}.`;
      },
      error: (e: Error) => {
        this.disbursingTeacherId = null;
        this.genError = e?.message || 'Could not initiate disbursement.';
      }
    });
  }

  refreshPayroll(): void {
    this.genError = '';
    this.disburseInfo = '';
    const y = Number(this.genYear);
    if (this.isAdmin) {
      this.payrollService.getStructures().subscribe(s => (this.salaryStructures = s));
      this.loadPaymentDetails();
    }
    const req$ =
      this.isTeacher && !this.isAdmin
        ? this.payrollService.listMyPayslips(y, this.genMonth)
        : this.payrollService.listPayslips(y, this.genMonth);
    req$.subscribe(p => (this.payslips = p));
  }

  runGenerate(): void {
    this.genError = '';
    this.generating = true;
    this.payrollService.generatePayslips(this.genMonth, this.genYear).subscribe({
      next: () => {
        this.generating = false;
        this.refreshPayroll();
      },
      error: (e: Error) => {
        this.generating = false;
        this.genError = e?.message || 'Could not generate payslips.';
      }
    });
  }

  openPdf(p: Payslip): void {
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

  markPaid(p: Payslip): void {
    if (!confirm(`Mark payslip for ${p.teacherName} (${p.month} ${p.year}) as paid?`)) return;
    this.markingId = p.id;
    this.payrollService.markPayslipPaid(p.id).subscribe({
      next: () => {
        this.markingId = null;
        this.refreshPayroll();
      },
      error: () => (this.markingId = null)
    });
  }
}
