import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeeService } from '../../core/services/fee.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';
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

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="fees-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Fee Management</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            Structures define per-class components (tuition, transport, hostel, uniform, …). Parents see the same breakdown when paying.
          </p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="refreshAll()" [disabled]="refreshing">
            <i class="bi bi-arrow-clockwise"></i> {{ refreshing ? 'Refreshing…' : 'Refresh' }}
          </button>
          <button *ngIf="isAdmin" type="button" class="btn-primary-erp btn-sm" (click)="openStructureModal()">
            <i class="bi bi-plus-lg"></i> New fee structure
          </button>
        </div>
      </div>

      <div class="erp-tabs animate-in">
        <button type="button" class="erp-tab" [class.active]="tab === 'structures'" (click)="tab = 'structures'" data-testid="tab-structures">Fee Structures</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'payments'" (click)="tab = 'payments'" data-testid="tab-payments">Payments</button>
      </div>

      <div *ngIf="tab === 'structures'" class="animate-in">
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let fs of feeStructures">
            <div class="erp-card h-100" [attr.data-testid]="'fee-structure-' + fs.id">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h4 style="font-size: 15px; font-weight: 700;">{{ fs.name }}</h4>
                <span style="font-size: 18px; font-weight: 800; color: var(--clr-primary); font-family: var(--font-heading);">₹{{ fs.totalAmount | number:'1.0-0':'en-IN' }}</span>
              </div>
              <div class="text-muted small mb-2">{{ fs.className }} · Year {{ fs.academicYearId }}</div>
              <div *ngFor="let comp of fs.components" class="d-flex justify-content-between align-items-center" style="padding: 6px 0; border-bottom: 1px solid var(--clr-border-light); font-size: 13px;">
                <span>
                  <span class="badge-erp badge-neutral me-1" style="font-size: 10px;">{{ comp.type }}</span>
                  {{ comp.name }}
                </span>
                <strong>₹{{ comp.amount | number:'1.0-0':'en-IN' }}</strong>
              </div>
              <div *ngIf="isAdmin" class="d-flex flex-wrap gap-2 mt-3 pt-2" style="border-top: 1px solid var(--clr-border-light);">
                <button type="button" class="btn-outline-erp btn-xs" (click)="openStructureModal(fs)">Edit</button>
                <button
                  type="button"
                  class="btn-outline-erp btn-xs"
                  (click)="openBulkAssignModal(fs)"
                  data-testid="bulk-assign-open"
                  title="Create a fee record for many students at once (e.g. new term or new admission batch)">
                  <i class="bi bi-people"></i> Add for students
                </button>
                <button type="button" class="btn-outline-erp btn-xs" style="color: var(--clr-danger); border-color: color-mix(in srgb, var(--clr-danger) 35%, var(--clr-border));" (click)="deleteStructure(fs)">Delete</button>
              </div>
            </div>
          </div>
        </div>
        <p *ngIf="!feeStructures.length" class="text-muted">No fee structures. Create one for each class band.</p>
      </div>

      <div *ngIf="tab === 'payments'" class="animate-in">
        <div class="erp-card">
          <div class="d-flex flex-wrap gap-2 align-items-end mb-3">
            <div>
              <label class="erp-label d-block mb-1 small">Status</label>
              <select class="erp-select" style="width: 150px;" [(ngModel)]="statusFilter" (change)="filterPayments()">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadPayments()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
          </div>
          <table class="erp-table" data-testid="payments-table">
            <thead>
              <tr><th>Student</th><th>Amount</th><th>Paid</th><th>Due</th><th>Due Date</th><th>Status</th><th>Receipt</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filteredPayments" [attr.data-testid]="'payment-row-' + p.id">
                <td><strong>{{ p.studentName }}</strong></td>
                <td>₹{{ p.amount | number:'1.0-0':'en-IN' }}</td>
                <td style="color: var(--clr-success);">₹{{ p.paidAmount | number:'1.0-0':'en-IN' }}</td>
                <td [style.color]="p.dueAmount > 0 ? 'var(--clr-danger)' : 'var(--clr-success)'">₹{{ p.dueAmount | number:'1.0-0':'en-IN' }}</td>
                <td>{{ p.dueDate }}</td>
                <td>
                  <span class="badge-erp" [ngClass]="{'badge-success': p.status === 'paid', 'badge-warning': p.status === 'partial', 'badge-danger': p.status === 'overdue', 'badge-neutral': p.status === 'unpaid'}">
                    {{ p.status }}
                  </span>
                </td>
                <td>{{ p.receiptNumber || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="structureModal" (click)="structureModal = false">
      <div class="modal-content-erp modal-lg" style="max-width: 640px;" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ editingStructureId ? 'Edit fee structure' : 'New fee structure' }}</h3>
          <button type="button" class="btn-icon" (click)="structureModal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <label class="erp-label">Structure name</label>
          <input class="erp-input mb-2" [(ngModel)]="structureForm.name" placeholder="e.g. Annual fee — Class 8">

          <div class="row g-2">
            <div class="col-md-6">
              <label class="erp-label">Class</label>
              <select class="erp-select mb-2" [(ngModel)]="structureForm.classId" (ngModelChange)="syncClassName()">
                <option [ngValue]="null">Select class</option>
                <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="erp-label">Academic year</label>
              <select class="erp-select mb-2" [(ngModel)]="structureForm.academicYearId">
                <option [ngValue]="null">Select year</option>
                <option *ngFor="let y of academicYears" [ngValue]="y.id">{{ y.name }}</option>
              </select>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="erp-label mb-0">Components</label>
            <button type="button" class="btn-outline-erp btn-xs" (click)="addComponentRow()"><i class="bi bi-plus"></i> Add line</button>
          </div>
          <div *ngFor="let row of structureForm.components; let i = index" class="row g-2 align-items-end mb-2">
            <div class="col-md-4">
              <input class="erp-input" [(ngModel)]="row.name" placeholder="Label">
            </div>
            <div class="col-md-3">
              <select class="erp-select" [(ngModel)]="row.type">
                <option *ngFor="let t of componentTypes" [value]="t.id">{{ t.label }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <input class="erp-input" type="number" min="0" step="1" [(ngModel)]="row.amount" placeholder="₹">
            </div>
            <div class="col-md-2">
              <button type="button" class="btn-icon" [disabled]="structureForm.components.length < 2" (click)="removeComponentRow(i)" title="Remove line"><i class="bi bi-trash text-danger"></i></button>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2 p-2 rounded-2" style="background: var(--clr-surface-muted); border: 1px solid var(--clr-border);">
            <strong>Total</strong>
            <strong style="color: var(--clr-primary); font-size: 18px;">₹{{ draftTotal | number:'1.0-0':'en-IN' }}</strong>
          </div>
          <p *ngIf="structureError" class="text-danger small mt-2 mb-0">{{ structureError }}</p>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="structureModal = false">Cancel</button>
          <button type="button" class="btn-primary-erp" [disabled]="savingStructure" (click)="saveStructure()">{{ savingStructure ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="bulkAssignModal" (click)="closeBulkAssignModal()">
      <div class="modal-content-erp modal-lg" style="max-width: 600px;" (click)="$event.stopPropagation()" data-testid="bulk-assign-modal">
        <div class="modal-header-erp">
          <h3>Add this fee for many students</h3>
          <button type="button" class="btn-icon" (click)="closeBulkAssignModal()" aria-label="Close"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp" *ngIf="bulkTargetStructure as bfs">
          <div class="p-3 rounded-2 mb-3" style="background: var(--clr-surface-muted); border: 1px solid var(--clr-border);">
            <div class="small text-muted mb-1">Fee plan you are adding</div>
            <div style="font-weight: 700;">{{ bfs.name }}</div>
            <div class="small text-muted mt-1">{{ bfs.className }} · total ₹{{ bfs.totalAmount | number:'1.0-0':'en-IN' }} per student</div>
          </div>

          <div class="mb-4">
            <div class="erp-label mb-2">What happens when you click &quot;Add fees for students&quot;?</div>
            <ol class="small text-muted mb-0 ps-3" style="line-height: 1.55;">
              <li class="mb-1">The system finds <strong>active</strong> students in the class (or section) you choose below.</li>
              <li class="mb-1">For each of those students it adds <strong>one fee row</strong> with this plan’s amount and the due date you pick.</li>
              <li class="mb-1">Those rows appear on the <strong>Payments</strong> tab and in the parent portal as amounts the family needs to pay.</li>
              <li class="mb-1">No money is collected here—this step only <strong>records who owes what</strong>. You record payments later as usual.</li>
              <li>If your school uses automated fee reminders, families may get a notice when a new fee is added (according to your settings).</li>
            </ol>
          </div>

          <label class="erp-label" for="bulk-section-select">Which students?</label>
          <select id="bulk-section-select" class="erp-select mb-1" [(ngModel)]="bulkSectionId">
            <option [ngValue]="null">Everyone in {{ bfs.className }} (all sections)</option>
            <option *ngFor="let sec of bulkSections" [ngValue]="sec.id">Only section {{ sec.name }}</option>
          </select>
          <p class="text-muted small mb-3">Pick one section if you are rolling this fee out to part of the class; otherwise leave “everyone” selected.</p>

          <label class="erp-label" for="bulk-due-date">When should this fee be paid by?</label>
          <input id="bulk-due-date" class="erp-input mb-1" type="date" [(ngModel)]="bulkDueDate" />
          <p class="text-muted small mb-3">This due date is stored on each student’s fee row. You can use it for reports, reminders, and overdue status.</p>

          <label class="d-flex align-items-start gap-2 mb-3" style="cursor: pointer;">
            <input type="checkbox" class="mt-1" [(ngModel)]="bulkSkipDuplicates" />
            <span class="small">
              <strong>Skip students who already have this fee</strong> for the same due date (recommended). Turn off only if you intend to allow duplicate rows.
            </span>
          </label>

          <div *ngIf="bulkAssignError" class="text-danger small mb-2">{{ bulkAssignError }}</div>
          <div *ngIf="bulkAssignResult as r" class="p-3 rounded-2 small mb-0" style="background: color-mix(in srgb, var(--clr-success) 8%, var(--clr-surface-muted)); border: 1px solid var(--clr-border);">
            <div class="fw-semibold mb-2">Done</div>
            <div><strong>{{ r.createdCount }}</strong> student fee {{ r.createdCount === 1 ? 'record was' : 'records were' }} added.</div>
            <div *ngIf="r.skippedCount > 0" class="mt-1">
              <strong>{{ r.skippedCount }}</strong> {{ r.skippedCount === 1 ? 'student was' : 'students were' }} not given a new row (see reasons below).
            </div>
            <div *ngIf="r.skipped?.length" class="mt-2 pt-2 text-muted" style="border-top: 1px solid var(--clr-border); max-height: 140px; overflow-y: auto;">
              <div class="small fw-semibold text-body mb-1">Details (sample)</div>
              <div *ngFor="let s of r.skipped" class="mb-1">
                Student #{{ s.studentId }} — {{ friendlyBulkSkipLabel(s) }}
              </div>
            </div>
            <p class="text-muted mb-0 mt-2 small">Open the <strong>Payments</strong> tab to see the new rows.</p>
          </div>
        </div>
        <div class="modal-footer-erp">
          <button type="button" class="btn-outline-erp" (click)="closeBulkAssignModal()">{{ bulkAssignResult ? 'Close' : 'Cancel' }}</button>
          <button type="button" class="btn-primary-erp" [disabled]="bulkAssignSaving || !bulkDueDate" (click)="submitBulkAssign()">
            {{ bulkAssignSaving ? 'Adding…' : 'Add fees for students' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class FeesComponent implements OnInit {
  tab = 'structures';
  feeStructures: FeeStructure[] = [];
  payments: FeePayment[] = [];
  filteredPayments: FeePayment[] = [];
  statusFilter = '';
  classes: SchoolClass[] = [];
  academicYears: AcademicYear[] = [];
  isAdmin = false;
  refreshing = false;
  structureModal = false;
  editingStructureId: number | null = null;
  structureError = '';
  savingStructure = false;
  structureForm: {
    name: string;
    classId: number | null;
    className: string;
    academicYearId: number | null;
    components: { name: string; amount: number; type: string }[];
  } = this.emptyStructureForm();

  bulkAssignModal = false;
  bulkTargetStructure: FeeStructure | null = null;
  bulkSections: Section[] = [];
  bulkSectionId: number | null = null;
  bulkDueDate = '';
  bulkSkipDuplicates = true;
  bulkAssignSaving = false;
  bulkAssignError = '';
  bulkAssignResult: BulkAssignFeesResponse | null = null;

  componentTypes = [
    { id: 'tuition', label: 'Tuition' },
    { id: 'transport', label: 'Transport' },
    { id: 'hostel', label: 'Hostel' },
    { id: 'uniform', label: 'Uniform' },
    { id: 'library', label: 'Library' },
    { id: 'lab', label: 'Lab' },
    { id: 'sports', label: 'Sports' },
    { id: 'misc', label: 'Other' }
  ];

  constructor(
    private feeService: FeeService,
    private academicService: AcademicService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService
  ) {}

  get draftTotal(): number {
    return this.structureForm.components.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  }

  ngOnInit(): void {
    const r = (this.auth.getRole() ?? '').toLowerCase();
    this.isAdmin = r === 'admin' || r === 'super_admin';
    this.academicService.getClasses().subscribe(c => (this.classes = c || []));
    this.academicService.getAcademicYears().subscribe(y => (this.academicYears = y || []));
    this.loadStructures();
    this.loadPayments();
  }

  refreshAll(): void {
    this.refreshing = true;
    this.academicService.getClasses().subscribe(c => (this.classes = c || []));
    this.academicService.getAcademicYears().subscribe(y => (this.academicYears = y || []));
    this.feeService.getFeeStructures().subscribe({
      next: fs => {
        this.feeStructures = fs;
        this.loadPayments();
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

  loadPayments(): void {
    this.feeService.getPayments().subscribe(p => {
      this.payments = p;
      this.filterPayments();
      this.refreshing = false;
    });
  }

  filterPayments(): void {
    this.filteredPayments = this.statusFilter ? this.payments.filter(p => p.status === this.statusFilter) : [...this.payments];
  }

  emptyStructureForm() {
    return {
      name: '',
      classId: null as number | null,
      className: '',
      academicYearId: null as number | null,
      components: [
        { name: 'Tuition', amount: 0, type: 'tuition' },
        { name: 'Transport', amount: 0, type: 'transport' }
      ]
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
      this.structureError = 'Name is required.';
      return;
    }
    if (this.structureForm.classId == null) {
      this.structureError = 'Select a class.';
      return;
    }
    if (this.structureForm.academicYearId == null) {
      this.structureError = 'Select an academic year.';
      return;
    }
    const comps: FeeComponent[] = this.structureForm.components
      .filter(c => c.name.trim() && (Number(c.amount) || 0) >= 0)
      .map(c => ({ name: c.name.trim(), amount: Number(c.amount) || 0, type: c.type }));
    if (!comps.length) {
      this.structureError = 'Add at least one component with a name and amount.';
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
        this.structureError = e?.message || 'Save failed.';
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
        return 'inactive student — fee not added';
      case 'DUPLICATE_OBLIGATION':
        return 'already has this fee with the same due date';
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
          this.loadPayments();
        },
        error: (e: Error) => {
          this.bulkAssignSaving = false;
          this.bulkAssignError = e?.message || 'Could not add fees. Please try again or contact support.';
        },
      });
  }

  deleteStructure(fs: FeeStructure): void {
    this.confirmDialog
      .confirm({
        title: 'Delete fee structure?',
        message: `Structure "${fs.name}" will be removed from configuration. Existing fee payment rows in the ledger are not deleted.`,
        details: [`Class: ${fs.className}`, `Academic year id: ${fs.academicYearId}`],
        variant: 'danger',
        confirmLabel: 'Yes, delete structure',
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.feeService.deleteFeeStructure(fs.id).subscribe({
          next: () => this.loadStructures(),
          error: (e: Error) => alert(e?.message || 'Delete failed'),
        });
      });
  }
}
