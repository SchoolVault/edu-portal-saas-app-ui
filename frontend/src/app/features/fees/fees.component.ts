import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeeService } from '../../core/services/fee.service';
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
  FeePayment,
  FeeStructure,
  SchoolClass,
  Section,
} from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SchoolClassNamePipe, ErpPaginationComponent, ErpI18nPhDirective],
  template: `
    <div data-testid="fees-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'fees.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'fees.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAll()" [disabled]="refreshing">
            <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? ('fees.refreshing' | translate) : ('fees.refresh' | translate) }}
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

      <div *ngIf="tab === 'structures'" class="animate-in">
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let fs of feeStructures">
            <div class="erp-card h-100" [attr.data-testid]="'fee-structure-' + fs.id">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h4 style="font-size: 15px; font-weight: 700;">{{ fs.name }}</h4>
                <span style="font-size: 18px; font-weight: 800; color: var(--clr-primary); font-family: var(--font-heading);">₹{{ fs.totalAmount | number:'1.0-0':'en-IN' }}</span>
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
        <div class="erp-card">
          <div class="d-flex flex-wrap gap-3 align-items-end mb-3">
            <div class="search-input-wrapper flex-grow-1" style="min-width: 200px; max-width: 360px;">
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
            <div>
              <label class="erp-label d-block mb-1 small">{{ 'fees.labelStatus' | translate }}</label>
              <select class="erp-select" style="min-width: 150px;" [(ngModel)]="statusFilter" (ngModelChange)="onPaymentStatusChange()">
                <option value="">{{ 'fees.allStatus' | translate }}</option>
                <option value="paid">{{ 'fees.statusPaid' | translate }}</option>
                <option value="partial">{{ 'fees.statusPartial' | translate }}</option>
                <option value="unpaid">{{ 'fees.statusUnpaid' | translate }}</option>
                <option value="overdue">{{ 'fees.statusOverdue' | translate }}</option>
              </select>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadPaymentsPage()"><i class="bi bi-arrow-clockwise"></i> {{ 'fees.refresh' | translate }}</button>
          </div>
          <div style="overflow-x: auto;" dir="ltr">
            <table class="erp-table" data-testid="payments-table">
              <thead>
                <tr
                  ><th>{{ 'fees.thStudent' | translate }}</th
                  ><th>{{ 'fees.thAmount' | translate }}</th
                  ><th>{{ 'fees.thPaid' | translate }}</th
                  ><th>{{ 'fees.thDue' | translate }}</th
                  ><th>{{ 'fees.thDueDate' | translate }}</th
                  ><th>{{ 'fees.thStatus' | translate }}</th
                  ><th>{{ 'fees.thReceipt' | translate }}</th></tr
                >
              </thead>
              <tbody>
                <tr *ngFor="let p of paymentsPage" [attr.data-testid]="'payment-row-' + p.id">
                  <td><strong>{{ p.studentName }}</strong></td>
                  <td>₹{{ p.amount | number:'1.0-0':'en-IN' }}</td>
                  <td style="color: var(--clr-success);">₹{{ p.paidAmount | number:'1.0-0':'en-IN' }}</td>
                  <td [style.color]="p.dueAmount > 0 ? 'var(--clr-danger)' : 'var(--clr-success)'">₹{{ p.dueAmount | number:'1.0-0':'en-IN' }}</td>
                  <td>{{ p.dueDate }}</td>
                  <td>
                    <span class="badge-erp" [ngClass]="{'badge-success': p.status === 'paid', 'badge-warning': p.status === 'partial', 'badge-danger': p.status === 'overdue', 'badge-neutral': p.status === 'unpaid'}">
                      {{ feeStatusLabel(p.status) }}
                    </span>
                  </td>
                  <td>{{ p.receiptNumber || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p *ngIf="!paymentsPage.length && !paymentsLoading" class="text-muted small mb-0">{{ 'fees.emptyPayments' | translate }}</p>
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
            <div *ngIf="r.skipped?.length" class="mt-2 pt-2 text-muted" style="border-top: 1px solid var(--clr-border); max-height: 140px; overflow-y: auto;">
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
  `
})
export class FeesComponent implements OnInit {
  tab = 'structures';
  feeStructures: FeeStructure[] = [];
  paymentsPage: FeePayment[] = [];
  paymentsTotal = 0;
  paymentPageIndex = 0;
  paymentPageSize = DEFAULT_ERP_PAGE_SIZE;
  paymentSearch = '';
  paymentsLoading = false;
  private paymentSearchTimer: ReturnType<typeof setTimeout> | null = null;
  statusFilter = '';
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

  componentTypeIds = ['tuition', 'transport', 'hostel', 'uniform', 'library', 'lab', 'sports', 'misc'] as const;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private feeService: FeeService,
    private academicService: AcademicService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    this.structureForm = this.emptyStructureForm();
  }

  get draftTotal(): number {
    return this.structureForm.components.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());

    this.isAdmin = this.auth.getNormalizedRole() === 'admin';
    this.academicService.getClasses().subscribe(c => (this.classes = c || []));
    this.academicService.getAcademicYears().subscribe(y => (this.academicYears = y || []));
    this.loadStructures();
    this.loadPaymentsPage();
  }

  refreshAll(): void {
    this.refreshing = true;
    this.academicService.getClasses().subscribe(c => (this.classes = c || []));
    this.academicService.getAcademicYears().subscribe(y => (this.academicYears = y || []));
    this.feeService.getFeeStructures().subscribe({
      next: fs => {
        this.feeStructures = fs;
        this.loadPaymentsPage();
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
          this.paymentsTotal = pr.totalElements;
          this.paymentPageIndex = pr.page;
          this.paymentsLoading = false;
          this.refreshing = false;
        },
        error: () => {
          this.paymentsLoading = false;
          this.refreshing = false;
        },
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
      .filter(c => c.name.trim() && (Number(c.amount) || 0) >= 0)
      .map(c => ({ name: c.name.trim(), amount: Number(c.amount) || 0, type: c.type }));
    if (!comps.length) {
      this.structureError = this.translate.instant('fees.errComponents');
      return;
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
        this.structureError = e?.message || this.translate.instant('fees.saveFailed');
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
          this.bulkAssignError = e?.message || this.translate.instant('fees.bulkError');
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
          error: (e: Error) => alert(e?.message || this.translate.instant('fees.deleteFailed')),
        });
      });
  }

  feeStatusLabel(status: string): string {
    const k = (status || '').toLowerCase();
    const key = `students.enums.feeStatus.${k}`;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }
}
