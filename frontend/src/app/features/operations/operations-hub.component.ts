import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperationsService } from '../../core/services/operations.service';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { FeeService } from '../../core/services/fee.service';
import { FeePayment, SchoolClass, Teacher } from '../../core/models/models';
import {
  AttendanceCoverRow,
  FeeReminderRow,
  GatePassRow,
  InventoryRow,
  OperationalStaffRow,
  OperationsTab,
  PayrollAccrualSummary,
  VisitorLogRow,
} from '../../core/models/operations.models';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-operations-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent],
  template: `
    <div data-testid="operations-hub-page">
      <div class="mb-4 animate-in">
        <h2 style="font-size: 24px; font-weight: 800;">School operations</h2>
        <p class="text-muted mb-0" style="font-size: 13px;">Covers, non-teaching staff, visitors, gate passes, inventory, fee reminders, payroll accrual (stub)</p>
      </div>
      <div class="erp-tabs mb-4">
        <button type="button" class="erp-tab" *ngFor="let t of tabs" [class.active]="tab === t.id" (click)="selectTab(t.id)">{{ t.label }}</button>
      </div>

      <!-- Covers -->
      <div class="erp-card mb-4" *ngIf="tab === 'covers'">
        <h4 class="erp-card-title mb-3">Attendance cover</h4>
        <div class="row g-3 align-items-end mb-3">
          <div class="col-md-2">
            <label class="erp-label">Date</label>
            <app-erp-date-picker [(ngModel)]="coverDate" placeholder="Cover date" />
          </div>
          <div class="col-md-2">
            <label class="erp-label">Class</label>
            <select class="erp-select" [(ngModel)]="coverForm.classId">
              <option value="">Select</option>
              <option *ngFor="let c of classes" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">Section (optional)</label>
            <select class="erp-select" [(ngModel)]="coverForm.sectionId">
              <option value="">All sections</option>
              <option *ngFor="let s of coverSections" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">Period (optional)</label>
            <input type="number" min="1" max="12" class="erp-input" [(ngModel)]="coverForm.periodNumber" placeholder="e.g. 3" title="Helps place the cover on the teacher timetable when the class grid has no regular teacher slot" />
          </div>
          <div class="col-md-4">
            <label class="erp-label">Covering teacher</label>
            <select class="erp-select" [(ngModel)]="coverForm.coveringTeacherId">
              <option value="">Select</option>
              <option *ngFor="let te of teachers" [value]="te.id">{{ te.firstName }} {{ te.lastName }}</option>
            </select>
          </div>
        </div>
        <div class="erp-form-group mb-3">
          <label class="erp-label">Reason</label>
          <input type="text" class="erp-input" [(ngModel)]="coverForm.reason" placeholder="e.g. Class teacher on leave" />
        </div>
        <button type="button" class="btn-primary-erp btn-sm me-2" (click)="submitCover()">Add cover</button>
        <button type="button" class="btn-outline-erp btn-sm" (click)="reloadCovers()">Refresh list for date</button>
        <table class="erp-table mt-3 mb-0">
          <thead><tr><th>Date</th><th>Class</th><th>Section</th><th>Covering</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let c of covers">
              <td>{{ c.coverDate }}</td>
              <td>{{ c.classId }}</td>
              <td>{{ c.sectionId || '—' }}</td>
              <td>{{ c.coveringTeacherId }}</td>
              <td>{{ c.status }}</td>
              <td><button *ngIf="c.status === 'ACTIVE'" type="button" class="btn-outline-erp btn-xs" (click)="cancelCover(c)">Cancel</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Staff -->
      <div class="erp-card mb-4" *ngIf="tab === 'staff'">
        <h4 class="erp-card-title mb-3">Operational staff</h4>
        <p class="text-muted small mb-2">Non-teaching roles (security, drivers, office). Same payload is sent to the API when mocks are off.</p>
        <div *ngIf="staffTabError" class="alert alert-danger py-2 px-3 small mb-2" style="border-radius: var(--radius-md);">{{ staffTabError }}</div>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><select class="erp-select" [(ngModel)]="staffForm.staffRole"><option *ngFor="let r of staffRoles" [value]="r">{{ r }}</option></select></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="staffForm.fullName" placeholder="Full name" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="staffForm.phone" placeholder="Phone" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="staffForm.employeeCode" placeholder="Code" /></div>
          <div class="col-md-2"><button type="button" class="btn-primary-erp w-100" (click)="addStaff()">Add</button></div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>Role</th><th>Name</th><th>Phone</th><th>Code</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let s of staff">
              <td>{{ s.staffRole }}</td>
              <td>{{ s.fullName }}</td>
              <td>{{ s.phone }}</td>
              <td>{{ s.employeeCode }}</td>
              <td>
                <button type="button" class="btn-outline-erp btn-xs" (click)="removeStaff(s)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Visitors -->
      <div class="erp-card mb-4" *ngIf="tab === 'visitors'">
        <h4 class="erp-card-title mb-3">Visitor log</h4>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.visitorName" placeholder="Visitor name" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="visitorForm.phone" placeholder="Phone" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.hostName" placeholder="Host" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.purpose" placeholder="Purpose" /></div>
          <div class="col-md-1"><button class="btn-primary-erp w-100" (click)="checkIn()">In</button></div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>Name</th><th>Badge</th><th>In</th><th>Out</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let v of visitors">
              <td>{{ v.visitorName }}</td><td>{{ v.badgeNo }}</td><td>{{ v.checkInAt | date:'short' }}</td><td>{{ v.checkOutAt ? (v.checkOutAt | date:'short') : '—' }}</td>
              <td><button *ngIf="v.status === 'ON_PREMISES'" class="btn-outline-erp btn-xs" (click)="checkOut(v)">Out</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Gate -->
      <div class="erp-card mb-4" *ngIf="tab === 'gate'">
        <h4 class="erp-card-title mb-3">Gate passes</h4>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="gateForm.issuedToName" placeholder="Issued to" /></div>
          <div class="col-md-2"><input type="date" class="erp-input" [(ngModel)]="gateForm.validFrom" /></div>
          <div class="col-md-2"><input type="date" class="erp-input" [(ngModel)]="gateForm.validTo" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="gateForm.purpose" placeholder="Purpose" /></div>
          <div class="col-md-2"><button class="btn-primary-erp w-100" (click)="addGate()">Issue</button></div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>To</th><th>Valid</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let g of gatePasses">
              <td>{{ g.issuedToName }}</td><td>{{ g.validFrom }} → {{ g.validTo }}</td><td>{{ g.status }}</td>
              <td><button *ngIf="g.status === 'ACTIVE'" class="btn-outline-erp btn-xs" (click)="revokeGate(g)">Revoke</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Inventory -->
      <div class="erp-card mb-4" *ngIf="tab === 'inventory'">
        <h4 class="erp-card-title mb-3">Inventory</h4>
        <p class="text-muted small mb-2">
          Create and update rows by SKU (server upsert). Edit loads the row; SKU stays fixed until you clear the form. Remove soft-deletes on the server when not using mocks.
        </p>
        <div *ngIf="inventoryTabError" class="alert alert-danger py-2 px-3 small mb-2" style="border-radius: var(--radius-md);">{{ inventoryTabError }}</div>
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">SKU</label>
            <input class="erp-input" [(ngModel)]="invForm.sku" placeholder="SKU" [readOnly]="!!invEditingId" [title]="invEditingId ? 'Clear form to use a different SKU' : ''" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">Name</label>
            <input class="erp-input" [(ngModel)]="invForm.name" placeholder="Name" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">Category</label>
            <input class="erp-input" [(ngModel)]="invForm.category" placeholder="Category" />
          </div>
          <div class="col-lg-1 col-md-3">
            <label class="erp-label">Qty</label>
            <input type="number" class="erp-input" [(ngModel)]="invForm.quantityOnHand" placeholder="0" />
          </div>
          <div class="col-lg-1 col-md-3">
            <label class="erp-label">Reorder</label>
            <input type="number" class="erp-input" [(ngModel)]="invForm.reorderLevel" placeholder="0" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">Location</label>
            <input class="erp-input" [(ngModel)]="invForm.location" placeholder="Location" />
          </div>
          <div class="col-lg-1 col-md-3">
            <button type="button" class="btn-primary-erp w-100" (click)="saveInv()">{{ invEditingId ? 'Update' : 'Save' }}</button>
          </div>
          <div class="col-lg-1 col-md-3" *ngIf="invEditingId">
            <button type="button" class="btn-outline-erp w-100" (click)="clearInventoryForm()">Clear</button>
          </div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Qty</th><th>Reorder</th><th>Location</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let i of inventory">
              <td>{{ i.sku }}</td>
              <td>{{ i.name }}</td>
              <td>{{ i.category || '—' }}</td>
              <td>{{ i.quantityOnHand }}</td>
              <td>{{ i.reorderLevel }}</td>
              <td>{{ i.location || '—' }}</td>
              <td class="text-nowrap">
                <button type="button" class="btn-outline-erp btn-xs me-1" (click)="editInventoryRow(i)">Edit</button>
                <button type="button" class="btn-outline-erp btn-xs" (click)="removeInventoryRow(i)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Reminders -->
      <div class="erp-card mb-4" *ngIf="tab === 'reminders'">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 class="erp-card-title mb-1">Fee reminders</h4>
            <p class="text-muted small mb-0" style="max-width: 640px;">
              Outstanding balances are listed below. In production, a scheduled job sends SMS/WhatsApp/email when due dates approach; this screen mirrors that queue and allows manual enqueue.
            </p>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadReminders()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
        </div>
        <h5 class="erp-card-title mb-2" style="font-size: 14px;">Outstanding fee balances</h5>
        <table class="erp-table mb-4">
          <thead>
            <tr>
              <th>Student</th>
              <th>Due date</th>
              <th>Due amount</th>
              <th>Status</th>
              <th>Notify</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pendingFees">
              <td><strong>{{ p.studentName }}</strong><span class="d-block small text-muted">#{{ p.studentId }}</span></td>
              <td>{{ p.dueDate || '—' }}</td>
              <td>{{ p.dueAmount | number:'1.0-0' }}</td>
              <td>{{ p.status }}</td>
              <td>
                <div class="d-flex flex-wrap gap-1">
                  <button type="button" class="btn-outline-erp btn-xs" (click)="enqueueReminderForPayment(p, 'SMS')">SMS</button>
                  <button type="button" class="btn-outline-erp btn-xs" (click)="enqueueReminderForPayment(p, 'WHATSAPP')">WhatsApp</button>
                  <button type="button" class="btn-outline-erp btn-xs" (click)="enqueueReminderForPayment(p, 'EMAIL')">Email</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!pendingFees.length">
              <td colspan="5" class="text-muted small">No pending fee balances in the current fee ledger.</td>
            </tr>
          </tbody>
        </table>
        <h5 class="erp-card-title mb-2" style="font-size: 14px;">Reminder queue</h5>
        <table class="erp-table mb-0">
          <thead><tr><th>Student</th><th>Due</th><th>Channel</th><th>Status</th><th>Scheduled</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of reminders">
              <td>{{ r.studentId }}</td>
              <td>{{ r.dueDate || '—' }}</td>
              <td>{{ r.channel }}</td>
              <td>{{ r.status }}</td>
              <td>{{ r.scheduledAt ? (r.scheduledAt | date:'short') : '—' }}</td>
            </tr>
            <tr *ngIf="!reminders.length"><td colspan="5" class="text-muted small">No rows in the queue yet. Open this tab again to run the mock auto-scheduler for dues within 14 days.</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Payroll -->
      <div class="erp-card mb-4" *ngIf="tab === 'payroll'">
        <h4 class="erp-card-title mb-3">Payroll accrual (stub)</h4>
        <button type="button" class="btn-outline-erp btn-sm mb-3" (click)="loadPayroll()">Refresh summary</button>
        <div *ngIf="payroll as p">
          <p class="mb-1"><strong>Period:</strong> {{ p.periodLabel }}</p>
          <p class="mb-1 small">Gross: {{ p.grossAccrued }} | Deductions: {{ p.deductionsAccrued }} | Net: {{ p.netAccrued }} | Employees: {{ p.employeeCount }}</p>
          <ul class="small text-muted mb-0"><li *ngFor="let n of (p.notes || [])">{{ n }}</li></ul>
        </div>
      </div>
    </div>
  `,
})
export class OperationsHubComponent implements OnInit {
  tab: OperationsTab = 'covers';
  tabs: { id: OperationsTab; label: string }[] = [
    { id: 'covers', label: 'Covers' },
    { id: 'staff', label: 'Staff' },
    { id: 'visitors', label: 'Visitors' },
    { id: 'gate', label: 'Gate pass' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'reminders', label: 'Fee reminders' },
    { id: 'payroll', label: 'Payroll accrual' },
  ];

  classes: SchoolClass[] = [];
  teachers: Teacher[] = [];
  covers: AttendanceCoverRow[] = [];
  staff: OperationalStaffRow[] = [];
  visitors: VisitorLogRow[] = [];
  gatePasses: GatePassRow[] = [];
  inventory: InventoryRow[] = [];
  reminders: FeeReminderRow[] = [];
  pendingFees: FeePayment[] = [];
  payroll: PayrollAccrualSummary | null = null;

  coverDate = new Date().toISOString().split('T')[0];
  coverForm = { classId: '', sectionId: '', coveringTeacherId: '', reason: '', periodNumber: null as number | null };
  staffRoles = ['DRIVER', 'SECURITY', 'OFFICE', 'NURSE', 'MAINTENANCE', 'LAB_ASSISTANT', 'OTHER'];
  staffForm = { staffRole: 'DRIVER', fullName: '', phone: '', employeeCode: '' };
  visitorForm = { visitorName: '', phone: '', hostName: '', purpose: '' };
  gateForm = {
    issuedToName: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date().toISOString().split('T')[0],
    purpose: '',
  };
  invForm = { sku: '', name: '', category: '', quantityOnHand: 0, reorderLevel: 0, location: '' };
  /** When set, SKU is read-only; POST upserts this tenant row. */
  invEditingId: string | null = null;
  staffTabError = '';
  inventoryTabError = '';
  constructor(
    private operations: OperationsService,
    private academic: AcademicService,
    private teacherService: TeacherService,
    private feeService: FeeService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.academic.getClasses().subscribe(c => (this.classes = c));
    this.teacherService.getTeachers().subscribe(t => (this.teachers = t));
    this.reloadCovers();
  }

  get coverSections(): { id: string; name: string }[] {
    const cls = this.classes.find(c => c.id === this.coverForm.classId);
    return cls?.sections?.map(s => ({ id: s.id, name: s.name })) ?? [];
  }

  selectTab(t: OperationsTab): void {
    this.tab = t;
    if (t === 'covers') this.reloadCovers();
    if (t === 'staff') {
      this.staffTabError = '';
      this.operations.listStaff().subscribe(s => (this.staff = s));
    }
    if (t === 'visitors') this.operations.listVisitors().subscribe(s => (this.visitors = s));
    if (t === 'gate') this.operations.listGatePasses().subscribe(s => (this.gatePasses = s));
    if (t === 'inventory') {
      this.inventoryTabError = '';
      this.operations.listInventory().subscribe(s => (this.inventory = s));
    }
    if (t === 'reminders') this.reloadReminders();
    if (t === 'payroll') this.loadPayroll();
  }

  reloadCovers(): void {
    this.operations.listAttendanceCoversAdmin(this.coverDate).subscribe(s => (this.covers = s));
  }

  submitCover(): void {
    if (!this.coverForm.classId || !this.coverForm.coveringTeacherId) return;
    this.operations
      .createAttendanceCover({
        coverDate: this.coverDate,
        classId: this.coverForm.classId,
        sectionId: this.coverForm.sectionId || undefined,
        coveringTeacherId: this.coverForm.coveringTeacherId,
        reason: this.coverForm.reason,
        periodNumber: this.coverForm.periodNumber != null && this.coverForm.periodNumber > 0 ? this.coverForm.periodNumber : undefined,
      })
      .subscribe(() => this.reloadCovers());
  }

  cancelCover(c: AttendanceCoverRow): void {
    this.operations.cancelAttendanceCover(c.id).subscribe(() => this.reloadCovers());
  }

  addStaff(): void {
    this.staffTabError = '';
    const fullName = this.staffForm.fullName?.trim();
    if (!fullName) {
      this.staffTabError = 'Full name is required.';
      return;
    }
    if (!this.staffForm.staffRole?.trim()) {
      this.staffTabError = 'Role is required.';
      return;
    }
    this.operations
      .createStaff({
        staffRole: this.staffForm.staffRole.trim(),
        fullName,
        phone: this.staffForm.phone?.trim() || undefined,
        employeeCode: this.staffForm.employeeCode?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.staffForm = { staffRole: this.staffForm.staffRole, fullName: '', phone: '', employeeCode: '' };
          this.operations.listStaff().subscribe(s => (this.staff = s));
        },
        error: (e: Error) => {
          this.staffTabError = e?.message || 'Could not add staff.';
        },
      });
  }

  removeStaff(s: OperationalStaffRow): void {
    const canHard = !s.userId && !s.transportRouteId;
    this.confirmDialog
      .confirm({
        title: 'Remove operational staff?',
        message: `${s.fullName} will be deactivated (soft delete). ${canHard ? 'You may permanently delete this row because there is no linked user or transport route.' : 'Permanent delete is blocked until user and transport links are cleared.'}`,
        details: [s.staffRole, s.employeeCode ? `Code: ${s.employeeCode}` : undefined].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: canHard ? 'Soft delete' : 'Soft delete',
        cancelLabel: 'Cancel',
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.operations.deleteStaff(s.id, false).subscribe(() => {
          this.operations.listStaff().subscribe(list => (this.staff = list));
        });
      });
  }

  checkIn(): void {
    this.operations.checkInVisitor(this.visitorForm).subscribe(() => this.operations.listVisitors().subscribe(s => (this.visitors = s)));
  }

  checkOut(v: VisitorLogRow): void {
    this.operations.checkOutVisitor(v.id).subscribe(() => this.operations.listVisitors().subscribe(s => (this.visitors = s)));
  }

  addGate(): void {
    if (!this.gateForm.issuedToName || !this.gateForm.validFrom || !this.gateForm.validTo) return;
    this.operations.createGatePass(this.gateForm as any).subscribe(() => this.operations.listGatePasses().subscribe(s => (this.gatePasses = s)));
  }

  revokeGate(g: GatePassRow): void {
    this.operations.revokeGatePass(g.id).subscribe(() => this.operations.listGatePasses().subscribe(s => (this.gatePasses = s)));
  }

  saveInv(): void {
    this.inventoryTabError = '';
    const sku = this.invForm.sku?.trim();
    const name = this.invForm.name?.trim();
    if (!sku || !name) {
      this.inventoryTabError = 'SKU and name are required.';
      return;
    }
    this.operations
      .upsertInventory({
        sku,
        name,
        category: this.invForm.category?.trim() || undefined,
        quantityOnHand: this.invForm.quantityOnHand ?? 0,
        reorderLevel: this.invForm.reorderLevel ?? 0,
        location: this.invForm.location?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.clearInventoryForm();
          this.operations.listInventory().subscribe(s => (this.inventory = s));
        },
        error: (e: Error) => {
          this.inventoryTabError = e?.message || 'Could not save inventory.';
        },
      });
  }

  editInventoryRow(row: InventoryRow): void {
    this.inventoryTabError = '';
    this.invEditingId = row.id;
    this.invForm = {
      sku: row.sku,
      name: row.name,
      category: row.category ?? '',
      quantityOnHand: row.quantityOnHand ?? 0,
      reorderLevel: row.reorderLevel ?? 0,
      location: row.location ?? '',
    };
  }

  clearInventoryForm(): void {
    this.invEditingId = null;
    this.invForm = { sku: '', name: '', category: '', quantityOnHand: 0, reorderLevel: 0, location: '' };
  }

  removeInventoryRow(row: InventoryRow): void {
    this.inventoryTabError = '';
    this.confirmDialog
      .confirm({
        title: 'Remove inventory item?',
        message: `This will remove “${row.name}” (${row.sku}) from the active catalogue.`,
        variant: 'danger',
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.operations.deleteInventory(row.id).subscribe({
          next: () => {
            if (this.invEditingId === row.id) {
              this.clearInventoryForm();
            }
            this.operations.listInventory().subscribe(s => (this.inventory = s));
          },
          error: (e: Error) => {
            this.inventoryTabError = e?.message || 'Could not remove item.';
          },
        });
      });
  }

  reloadReminders(): void {
    this.feeService.getPayments().subscribe(pays => {
      this.pendingFees = (pays || []).filter(p => (p.dueAmount ?? 0) > 0);
      const slim = this.pendingFees.map(p => ({
        id: p.id,
        studentId: p.studentId,
        dueDate: p.dueDate,
        dueAmount: p.dueAmount ?? 0,
      }));
      this.operations.syncAutoRemindersForOutstandingFees(slim).subscribe(() => {
        this.operations.listFeeReminders('PENDING').subscribe(rows => (this.reminders = rows || []));
      });
    });
  }

  enqueueReminderForPayment(p: FeePayment, channel: string): void {
    this.operations
      .enqueueFeeReminder({
        studentId: p.studentId,
        feePaymentId: p.id,
        dueDate: p.dueDate,
        channel,
      })
      .subscribe(() => this.reloadReminders());
  }

  loadPayroll(): void {
    this.operations.payrollAccrualSummary().subscribe(p => (this.payroll = p));
  }
}
