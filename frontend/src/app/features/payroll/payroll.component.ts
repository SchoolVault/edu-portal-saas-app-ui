import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Payslip, SalaryStructure, TeacherPaymentDetails } from '../../core/models/models';
import { filter } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { PayrollService } from '../../core/services/payroll.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { sliceToPage } from '../../core/utils/paginate';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpPaginationComponent],
  template: `
    <div data-testid="payroll-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'payroll.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            {{ isAdmin ? ('payroll.leadAdmin' | translate) : isTeacher ? ('payroll.leadTeacher' | translate) : ('payroll.leadDenied' | translate) }}
          </p>
        </div>
        <div *ngIf="isAdmin || isTeacher" class="d-flex gap-2 align-items-end flex-wrap">
          <div>
            <label class="erp-label d-block mb-1">{{ 'payroll.labelMonth' | translate }}</label>
            <select class="erp-select" [(ngModel)]="genMonth">
              <option *ngFor="let m of monthNames" [value]="m">{{ monthOptionLabel(m) }}</option>
            </select>
          </div>
          <div>
            <label class="erp-label d-block mb-1">{{ 'payroll.labelYear' | translate }}</label>
            <input class="erp-input" type="number" [(ngModel)]="genYear" style="width: 100px;" />
          </div>
          <button *ngIf="isAdmin" class="btn-primary-erp btn-sm align-self-end" data-testid="generate-payslips-btn" [disabled]="generating" (click)="runGenerate()">
            <i class="bi bi-file-earmark-text"></i> {{ generating ? ('payroll.generating' | translate) : ('payroll.generate' | translate) }}
          </button>
          <button class="btn-outline-erp btn-sm align-self-end" type="button" (click)="refreshPayroll()">{{ 'payroll.refresh' | translate }}</button>
        </div>
      </div>

      <div *ngIf="genError" class="alert alert-danger py-2 small mb-3">{{ genError }}</div>
      <div *ngIf="disburseInfo" class="alert alert-success py-2 small mb-3">
        {{ disburseInfo }}
        <div class="mt-2 pt-2 text-muted" style="font-size: 12px; border-top: 1px solid rgba(15, 23, 42, 0.12);">
          <strong>{{ 'payroll.disburseHowTitle' | translate }}</strong> {{ 'payroll.disburseHowBody' | translate }}
        </div>
      </div>

      <div *ngIf="isAdmin" class="row g-4 mb-4 animate-in animate-in-delay-1">
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

      <div *ngIf="isAdmin" class="erp-card animate-in animate-in-delay-2 mb-4 payroll-disburse-card">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 class="erp-card-title mb-1">{{ 'payroll.cardDisburseTitle' | translate }}</h4>
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
                  <ng-container *ngIf="payslipForTeacher(fd.teacherId) as ps">
                    <strong>₹{{ ps.netSalary | number:'1.0-0':'en-IN' }}</strong>
                    <span class="badge-erp ms-1" [class.badge-neutral]="ps.status === 'generated'" [class.badge-success]="ps.status === 'paid'">{{ payslipStatusLabel(ps.status) }}</span>
                  </ng-container>
                  <span *ngIf="!payslipForTeacher(fd.teacherId)" class="text-warning">{{ 'payroll.generateFirst' | translate }}</span>
                </div>
              </div>
              <div class="mt-3 d-flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-primary-erp btn-sm"
                  [disabled]="!canInitiateDisburse(fd) || disbursingTeacherId === fd.teacherId"
                  (click)="runDisburse(fd)"
                >
                  {{ disbursingTeacherId === fd.teacherId ? ('payroll.submitting' | translate) : ('payroll.initiateTransfer' | translate) }}
                </button>
                <span class="text-muted small align-self-center">{{ 'payroll.afterBankNote' | translate }}</span>
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
                </td>
                <td class="text-end">
                  <button
                    type="button"
                    class="btn-primary-erp btn-xs"
                    [disabled]="!canInitiateDisburse(d) || disbursingTeacherId === d.teacherId"
                    (click)="runDisburse(d)"
                    [title]="'payroll.initiateTitle' | translate"
                  >
                    {{ disbursingTeacherId === d.teacherId ? ('payroll.submitting' | translate) : ('payroll.initiate' | translate) }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="!paymentDetails.length"><td colspan="7" class="text-muted text-center py-3">{{ 'payroll.noStructures' | translate }}</td></tr>
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

      <div *ngIf="isAdmin" class="erp-card animate-in mb-4">
        <h4 class="erp-card-title mb-3">{{ 'payroll.structuresTitle' | translate }}</h4>
        <div class="table-responsive payroll-salary-table-wrap">
          <table class="erp-table payroll-salary-table" data-testid="salary-table">
            <thead
              ><tr
                ><th>{{ 'payroll.thTeacher' | translate }}</th
                ><th>{{ 'payroll.thBasic' | translate }}</th
                ><th>{{ 'payroll.thAllowances' | translate }}</th
                ><th>{{ 'payroll.thDeductions' | translate }}</th
                ><th>{{ 'payroll.thNet' | translate }}</th></tr
              ></thead
            >
            <tbody>
              <tr *ngFor="let s of pagedSalaryStructures">
                <td><strong>{{ s.teacherName }}</strong></td>
                <td>₹{{ s.basicSalary | number:'1.0-0':'en-IN' }}</td>
                <td style="color: var(--clr-success);">+₹{{ getAllowanceTotal(s) | number:'1.0-0':'en-IN' }}</td>
                <td style="color: var(--clr-danger);">-₹{{ getDeductionTotal(s) | number:'1.0-0':'en-IN' }}</td>
                <td><strong>₹{{ s.netSalary | number:'1.0-0':'en-IN' }}</strong></td>
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

      <div class="erp-card animate-in" *ngIf="isAdmin || isTeacher">
        <h4 class="erp-card-title mb-3">{{ isTeacher ? ('payroll.payslipsTitleTeacher' | translate) : ('payroll.payslipsTitleAdmin' | translate) }}</h4>
        <p class="text-muted small mb-2">{{ 'payroll.payslipsLead' | translate }}</p>
        <div class="table-responsive">
          <table class="erp-table">
            <thead>
              <tr>
                <th>{{ 'payroll.thTeacher' | translate }}</th
                ><th>{{ 'payroll.thPeriod' | translate }}</th
                ><th>{{ 'payroll.thNetSalary' | translate }}</th
                ><th>{{ 'payroll.thStatus' | translate }}</th
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
                <td>{{ p.paymentDate || ('exams.dash' | translate) }}</td>
                <td class="text-end text-nowrap">
                  <button type="button" class="btn-outline-erp btn-xs me-1" (click)="openPdf(p)" [disabled]="pdfLoadingId === p.id">
                    <i class="bi bi-file-pdf"></i> {{ 'payroll.pdf' | translate }}
                  </button>
                  <button *ngIf="isAdmin && p.status === 'generated'" type="button" class="btn-primary-erp btn-xs" (click)="markPaid(p)" [disabled]="markingId === p.id">{{ 'payroll.markPaid' | translate }}</button>
                </td>
              </tr>
              <tr *ngIf="payslips.length === 0"><td colspan="6" class="text-muted text-center py-4">{{ 'payroll.noPayslips' | translate }}</td></tr>
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

      <div *ngIf="!isAdmin && !isTeacher" class="erp-card text-muted text-center py-5">
        <i class="bi bi-lock" style="font-size: 2rem;"></i>
        <p class="mt-2 mb-0">{{ 'payroll.accessDenied' | translate }}</p>
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
      .payroll-salary-table-wrap {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      .payroll-salary-table {
        width: max-content;
        min-width: 100%;
      }
      .payroll-salary-table th,
      .payroll-salary-table td {
        white-space: nowrap;
      }
      @media (max-width: 767.98px) {
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
  genMonth = 'April';
  genYear = new Date().getFullYear();
  generating = false;
  genError = '';
  disburseInfo = '';
  disbursingTeacherId: number | null = null;
  pdfLoadingId: string | null = null;
  markingId: string | null = null;
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  isAdmin = false;
  isTeacher = false;
  payrollFocusTeacherId: number | null = null;
  /** NETBANKING | UPI | NEFT | IMPS — sent to backend for reference prefix + audit. */
  disbursePaymentMethod = 'NETBANKING';

  get bankReadyCount(): number {
    return this.paymentDetails.filter(d => d.bankDetailsComplete).length;
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

  constructor(
    private payrollService: PayrollService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    const r = (this.auth.getRole() ?? '').toLowerCase();
    this.isAdmin = r === 'admin';
    this.isTeacher = r === 'teacher';
    if (this.isAdmin) {
      this.loadAdminStructures();
      this.loadPaymentDetails();
    }
    this.refreshPayroll();
  }

  private loadAdminStructures(): void {
    if (!this.isAdmin) return;
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
    if (!this.isAdmin || runtimeConfig.useMocks) {
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
      this.isTeacher && !this.isAdmin
        ? this.payrollService.listMyPayslipsPage(this.payslipPageIndex, this.payslipPageSize, y, this.genMonth)
        : this.payrollService.listPayslipsPage(this.payslipPageIndex, this.payslipPageSize, y, this.genMonth);
    req$.subscribe(p => {
      this.payslipTotalFromServer = p.totalElements;
      this.pagedPayslips = p.content;
      this.payslipPageIndex = p.page;
    });
  }

  loadPaymentDetails(): void {
    if (!this.isAdmin) return;
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

  payslipForTeacher(teacherId: number): Payslip | undefined {
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
      },
      error: (e: Error) => {
        this.disbursingTeacherId = null;
        this.genError = e?.message || this.translate.instant('payroll.genDisburseError');
      }
    });
  }

  refreshPayroll(): void {
    this.genError = '';
    this.disburseInfo = '';
    const y = Number(this.genYear);
    if (this.isAdmin) {
      this.structPageIndex = 0;
      this.loadAdminStructures();
      this.loadPaymentDetails();
    }
    const full$ =
      this.isTeacher && !this.isAdmin
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
        this.isTeacher && !this.isAdmin
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
    this.generating = true;
    this.payrollService.generatePayslips(this.genMonth, this.genYear).subscribe({
      next: () => {
        this.generating = false;
        this.refreshPayroll();
      },
      error: (e: Error) => {
        this.generating = false;
        this.genError = e?.message || this.translate.instant('payroll.genPayslipError');
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
}
