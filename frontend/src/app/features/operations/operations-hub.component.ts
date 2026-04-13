import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  imports: [CommonModule, FormsModule, ErpDatePickerComponent, TranslateModule],
  template: `
    <div data-testid="operations-hub-page">
      <div class="mb-4 animate-in">
        <h2 style="font-size: 24px; font-weight: 800;">{{ 'operations.pageTitle' | translate }}</h2>
        <p class="text-muted mb-0" style="font-size: 13px;">{{ 'operations.lead' | translate }}</p>
      </div>
      <div class="erp-tabs mb-4">
        <button type="button" class="erp-tab" *ngFor="let t of tabs" [class.active]="tab === t.id" (click)="selectTab(t.id)">{{ ('operations.tab.' + t.id) | translate }}</button>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'covers'">
        <h4 class="erp-card-title mb-3">{{ 'operations.covers.title' | translate }}</h4>
        <div class="row g-3 align-items-end mb-3">
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelDate' | translate }}</label>
            <app-erp-date-picker [(ngModel)]="coverDate" [placeholder]="'operations.covers.phCoverDate' | translate" />
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelClass' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.classId" (change)="coverForm.sectionId = null">
              <option [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngFor="let c of classes" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelSection' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.sectionId">
              <option [ngValue]="null">{{ 'operations.covers.allSections' | translate }}</option>
              <option *ngFor="let s of coverSections" [ngValue]="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="erp-label">{{ 'operations.covers.labelPeriod' | translate }}</label>
            <input type="number" min="1" max="12" class="erp-input" [(ngModel)]="coverForm.periodNumber" [placeholder]="'operations.covers.phPeriod' | translate" [title]="'operations.covers.periodTitle' | translate" />
          </div>
          <div class="col-md-4">
            <label class="erp-label">{{ 'operations.covers.labelCoveringTeacher' | translate }}</label>
            <select class="erp-select" [(ngModel)]="coverForm.coveringTeacherId">
              <option [ngValue]="null">{{ 'operations.covers.select' | translate }}</option>
              <option *ngFor="let te of teachers" [ngValue]="te.id">{{ te.firstName }} {{ te.lastName }}</option>
            </select>
          </div>
        </div>
        <div class="erp-form-group mb-3">
          <label class="erp-label">{{ 'operations.covers.labelReason' | translate }}</label>
          <input type="text" class="erp-input" [(ngModel)]="coverForm.reason" [placeholder]="'operations.covers.phReason' | translate" />
        </div>
        <button type="button" class="btn-primary-erp btn-sm me-2" (click)="submitCover()">{{ 'operations.covers.addCover' | translate }}</button>
        <button type="button" class="btn-outline-erp btn-sm" (click)="reloadCovers()">{{ 'operations.covers.refreshList' | translate }}</button>
        <table class="erp-table mt-3 mb-0">
          <thead><tr><th>{{ 'operations.covers.thDate' | translate }}</th><th>{{ 'operations.covers.thClass' | translate }}</th><th>{{ 'operations.covers.thSection' | translate }}</th><th>{{ 'operations.covers.thCovering' | translate }}</th><th>{{ 'operations.covers.thStatus' | translate }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let c of covers">
              <td>{{ c.coverDate }}</td>
              <td>{{ c.classId }}</td>
              <td>{{ c.sectionId || ('transport.dash' | translate) }}</td>
              <td>{{ c.coveringTeacherId }}</td>
              <td>{{ c.status }}</td>
              <td><button *ngIf="c.status === 'ACTIVE'" type="button" class="btn-outline-erp btn-xs" (click)="cancelCover(c)">{{ 'operations.covers.cancel' | translate }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'staff'">
        <h4 class="erp-card-title mb-3">{{ 'operations.staff.title' | translate }}</h4>
        <p class="text-muted small mb-2">{{ 'operations.staff.hint' | translate }}</p>
        <div *ngIf="staffTabError" class="alert alert-danger py-2 px-3 small mb-2" style="border-radius: var(--radius-md);">{{ staffTabError }}</div>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><select class="erp-select" [(ngModel)]="staffForm.staffRole"><option *ngFor="let r of staffRoles" [value]="r">{{ staffRoleLabel(r) }}</option></select></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="staffForm.fullName" [placeholder]="'operations.staff.phFullName' | translate" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="staffForm.phone" [placeholder]="'operations.staff.phPhone' | translate" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="staffForm.employeeCode" [placeholder]="'operations.staff.phCode' | translate" /></div>
          <div class="col-md-2"><button type="button" class="btn-primary-erp w-100" (click)="addStaff()">{{ 'operations.staff.add' | translate }}</button></div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>{{ 'operations.staff.thRole' | translate }}</th><th>{{ 'operations.staff.thName' | translate }}</th><th>{{ 'operations.staff.thPhone' | translate }}</th><th>{{ 'operations.staff.thCode' | translate }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let s of staff">
              <td>{{ staffRoleLabel(s.staffRole) }}</td>
              <td>{{ s.fullName }}</td>
              <td>{{ s.phone }}</td>
              <td>{{ s.employeeCode }}</td>
              <td>
                <button type="button" class="btn-outline-erp btn-xs" (click)="removeStaff(s)">{{ 'operations.staff.remove' | translate }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'visitors'">
        <h4 class="erp-card-title mb-3">{{ 'operations.visitors.title' | translate }}</h4>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.visitorName" [placeholder]="'operations.visitors.phVisitorName' | translate" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="visitorForm.phone" [placeholder]="'operations.visitors.phPhone' | translate" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.hostName" [placeholder]="'operations.visitors.phHost' | translate" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.purpose" [placeholder]="'operations.visitors.phPurpose' | translate" /></div>
          <div class="col-md-1"><button class="btn-primary-erp w-100" (click)="checkIn()">{{ 'operations.visitors.checkIn' | translate }}</button></div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>{{ 'operations.visitors.thName' | translate }}</th><th>{{ 'operations.visitors.thBadge' | translate }}</th><th>{{ 'operations.visitors.thIn' | translate }}</th><th>{{ 'operations.visitors.thOut' | translate }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let v of visitors">
              <td>{{ v.visitorName }}</td><td>{{ v.badgeNo }}</td><td>{{ v.checkInAt | date:'short' }}</td><td>{{ v.checkOutAt ? (v.checkOutAt | date:'short') : ('transport.dash' | translate) }}</td>
              <td><button *ngIf="v.status === 'ON_PREMISES'" class="btn-outline-erp btn-xs" (click)="checkOut(v)">{{ 'operations.visitors.checkOut' | translate }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'gate'">
        <h4 class="erp-card-title mb-3">{{ 'operations.gate.title' | translate }}</h4>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="gateForm.issuedToName" [placeholder]="'operations.gate.phIssuedTo' | translate" /></div>
          <div class="col-md-2"><input type="date" class="erp-input" [(ngModel)]="gateForm.validFrom" /></div>
          <div class="col-md-2"><input type="date" class="erp-input" [(ngModel)]="gateForm.validTo" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="gateForm.purpose" [placeholder]="'operations.gate.phPurpose' | translate" /></div>
          <div class="col-md-2"><button class="btn-primary-erp w-100" (click)="addGate()">{{ 'operations.gate.issue' | translate }}</button></div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>{{ 'operations.gate.thTo' | translate }}</th><th>{{ 'operations.gate.thValid' | translate }}</th><th>{{ 'operations.gate.thStatus' | translate }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let g of gatePasses">
              <td>{{ g.issuedToName }}</td><td>{{ g.validFrom }} → {{ g.validTo }}</td><td>{{ g.status }}</td>
              <td><button *ngIf="g.status === 'ACTIVE'" class="btn-outline-erp btn-xs" (click)="revokeGate(g)">{{ 'operations.gate.revoke' | translate }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'inventory'">
        <h4 class="erp-card-title mb-3">{{ 'operations.inventory.title' | translate }}</h4>
        <p class="text-muted small mb-2">{{ 'operations.inventory.hint' | translate }}</p>
        <div *ngIf="inventoryTabError" class="alert alert-danger py-2 px-3 small mb-2" style="border-radius: var(--radius-md);">{{ inventoryTabError }}</div>
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelSku' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.sku" [placeholder]="'operations.inventory.phSku' | translate" [readOnly]="!!invEditingId" [title]="invEditingId ? ('operations.inventory.skuLockedTitle' | translate) : ''" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelName' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.name" [placeholder]="'operations.inventory.phName' | translate" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelCategory' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.category" [placeholder]="'operations.inventory.phCategory' | translate" />
          </div>
          <div class="col-lg-1 col-md-3">
            <label class="erp-label">{{ 'operations.inventory.labelQty' | translate }}</label>
            <input type="number" class="erp-input" [(ngModel)]="invForm.quantityOnHand" [placeholder]="'operations.inventory.phQty' | translate" />
          </div>
          <div class="col-lg-1 col-md-3">
            <label class="erp-label">{{ 'operations.inventory.labelReorder' | translate }}</label>
            <input type="number" class="erp-input" [(ngModel)]="invForm.reorderLevel" [placeholder]="'operations.inventory.phReorder' | translate" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelLocation' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.location" [placeholder]="'operations.inventory.phLocation' | translate" />
          </div>
          <div class="col-lg-1 col-md-3">
            <button type="button" class="btn-primary-erp w-100" (click)="saveInv()">{{ invEditingId ? ('operations.inventory.update' | translate) : ('operations.inventory.save' | translate) }}</button>
          </div>
          <div class="col-lg-1 col-md-3" *ngIf="invEditingId">
            <button type="button" class="btn-outline-erp w-100" (click)="clearInventoryForm()">{{ 'operations.inventory.clear' | translate }}</button>
          </div>
        </div>
        <table class="erp-table mb-0">
          <thead><tr><th>{{ 'operations.inventory.thSku' | translate }}</th><th>{{ 'operations.inventory.thName' | translate }}</th><th>{{ 'operations.inventory.thCategory' | translate }}</th><th>{{ 'operations.inventory.thQty' | translate }}</th><th>{{ 'operations.inventory.thReorder' | translate }}</th><th>{{ 'operations.inventory.thLocation' | translate }}</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let i of inventory">
              <td>{{ i.sku }}</td>
              <td>{{ i.name }}</td>
              <td>{{ i.category || ('transport.dash' | translate) }}</td>
              <td>{{ i.quantityOnHand }}</td>
              <td>{{ i.reorderLevel }}</td>
              <td>{{ i.location || ('transport.dash' | translate) }}</td>
              <td class="text-nowrap">
                <button type="button" class="btn-outline-erp btn-xs me-1" (click)="editInventoryRow(i)">{{ 'operations.inventory.edit' | translate }}</button>
                <button type="button" class="btn-outline-erp btn-xs" (click)="removeInventoryRow(i)">{{ 'operations.inventory.remove' | translate }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'reminders'">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h4 class="erp-card-title mb-1">{{ 'operations.reminders.title' | translate }}</h4>
            <p class="text-muted small mb-0" style="max-width: 640px;">{{ 'operations.reminders.lead' | translate }}</p>
          </div>
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadReminders()"><i class="bi bi-arrow-clockwise"></i> {{ 'operations.reminders.refresh' | translate }}</button>
        </div>
        <h5 class="erp-card-title mb-2" style="font-size: 14px;">{{ 'operations.reminders.outstandingTitle' | translate }}</h5>
        <table class="erp-table mb-4">
          <thead>
            <tr>
              <th>{{ 'operations.reminders.thStudent' | translate }}</th>
              <th>{{ 'operations.reminders.thDueDate' | translate }}</th>
              <th>{{ 'operations.reminders.thDueAmount' | translate }}</th>
              <th>{{ 'operations.reminders.thStatus' | translate }}</th>
              <th>{{ 'operations.reminders.thNotify' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pendingFees">
              <td><strong>{{ p.studentName }}</strong><span class="d-block small text-muted">#{{ p.studentId }}</span></td>
              <td>{{ p.dueDate || ('transport.dash' | translate) }}</td>
              <td>{{ p.dueAmount | number:'1.0-0' }}</td>
              <td>{{ p.status }}</td>
              <td>
                <div class="d-flex flex-wrap gap-1">
                  <button type="button" class="btn-outline-erp btn-xs" (click)="enqueueReminderForPayment(p, 'SMS')">{{ 'operations.reminders.channelSms' | translate }}</button>
                  <button type="button" class="btn-outline-erp btn-xs" (click)="enqueueReminderForPayment(p, 'WHATSAPP')">{{ 'operations.reminders.channelWhatsapp' | translate }}</button>
                  <button type="button" class="btn-outline-erp btn-xs" (click)="enqueueReminderForPayment(p, 'EMAIL')">{{ 'operations.reminders.channelEmail' | translate }}</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!pendingFees.length">
              <td colspan="5" class="text-muted small">{{ 'operations.reminders.emptyPending' | translate }}</td>
            </tr>
          </tbody>
        </table>
        <h5 class="erp-card-title mb-2" style="font-size: 14px;">{{ 'operations.reminders.queueTitle' | translate }}</h5>
        <table class="erp-table mb-0">
          <thead><tr><th>{{ 'operations.reminders.thStudent' | translate }}</th><th>{{ 'operations.reminders.thDue' | translate }}</th><th>{{ 'operations.reminders.thChannel' | translate }}</th><th>{{ 'operations.reminders.thStatus' | translate }}</th><th>{{ 'operations.reminders.thScheduled' | translate }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of reminders">
              <td>{{ r.studentId }}</td>
              <td>{{ r.dueDate || ('transport.dash' | translate) }}</td>
              <td>{{ r.channel }}</td>
              <td>{{ r.status }}</td>
              <td>{{ r.scheduledAt ? (r.scheduledAt | date:'short') : ('transport.dash' | translate) }}</td>
            </tr>
            <tr *ngIf="!reminders.length"><td colspan="5" class="text-muted small">{{ 'operations.reminders.emptyQueue' | translate }}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'payroll'">
        <h4 class="erp-card-title mb-3">{{ 'operations.payroll.title' | translate }}</h4>
        <button type="button" class="btn-outline-erp btn-sm mb-3" (click)="loadPayroll()">{{ 'operations.payroll.refreshSummary' | translate }}</button>
        <div *ngIf="payroll as p">
          <p class="mb-1"><strong>{{ 'operations.payroll.period' | translate }}</strong> {{ p.periodLabel }}</p>
          <p class="mb-1 small">{{ 'operations.payroll.summaryLine' | translate: { gross: p.grossAccrued, ded: p.deductionsAccrued, net: p.netAccrued, count: p.employeeCount } }}</p>
          <ul class="small text-muted mb-0"><li *ngFor="let n of (p.notes || [])">{{ n }}</li></ul>
        </div>
      </div>
    </div>
  `,
})
export class OperationsHubComponent implements OnInit {
  tab: OperationsTab = 'covers';
  tabs: { id: OperationsTab }[] = [
    { id: 'covers' },
    { id: 'staff' },
    { id: 'visitors' },
    { id: 'gate' },
    { id: 'inventory' },
    { id: 'reminders' },
    { id: 'payroll' },
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
  coverForm = {
    classId: null as number | null,
    sectionId: null as number | null,
    coveringTeacherId: null as number | null,
    reason: '',
    periodNumber: null as number | null,
  };
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
  invEditingId: string | null = null;
  staffTabError = '';
  inventoryTabError = '';
  constructor(
    private operations: OperationsService,
    private academic: AcademicService,
    private teacherService: TeacherService,
    private feeService: FeeService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService
  ) {}

  staffRoleLabel(code: string): string {
    const key = `operations.staff.staffRoleEnum.${code}`;
    const t = this.translate.instant(key);
    return t !== key ? t : code;
  }

  ngOnInit(): void {
    this.academic.getClasses().subscribe(c => (this.classes = c));
    this.teacherService.getTeachers().subscribe(t => (this.teachers = t));
    this.reloadCovers();
  }

  get coverSections(): { id: number; name: string }[] {
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
    if (this.coverForm.classId == null || this.coverForm.coveringTeacherId == null) return;
    this.operations
      .createAttendanceCover({
        coverDate: this.coverDate,
        classId: this.coverForm.classId,
        sectionId: this.coverForm.sectionId ?? undefined,
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
      this.staffTabError = this.translate.instant('operations.staff.errFullName');
      return;
    }
    if (!this.staffForm.staffRole?.trim()) {
      this.staffTabError = this.translate.instant('operations.staff.errRole');
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
          this.staffTabError = e?.message || this.translate.instant('operations.staff.errAddFailed');
        },
      });
  }

  removeStaff(s: OperationalStaffRow): void {
    const canHard = !s.userId && !s.transportRouteId;
    const detail = this.translate.instant(canHard ? 'operations.staff.detailCanHard' : 'operations.staff.detailCannotHard');
    const details: string[] = [
      this.staffRoleLabel(s.staffRole),
      s.employeeCode ? this.translate.instant('operations.staff.detailCode', { code: s.employeeCode }) : '',
    ].filter(Boolean);
    this.confirmDialog
      .confirm({
        title: this.translate.instant('operations.staff.confirmRemoveTitle'),
        message: this.translate.instant('operations.staff.confirmRemoveMessage', { name: s.fullName, detail }),
        details,
        variant: 'danger',
        confirmLabel: this.translate.instant('operations.staff.confirmSoftDelete'),
        cancelLabel: this.translate.instant('operations.staff.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.operations.deleteStaff(s.id, false).subscribe(() => {
          this.operations.listStaff().subscribe(list => (this.staff = list));
        });
      });
  }

  checkIn(): void {
    this.operations.checkInVisitor(this.visitorForm).subscribe(() => this.operations.listVisitors().subscribe(v => (this.visitors = v)));
  }

  checkOut(v: VisitorLogRow): void {
    this.operations.checkOutVisitor(v.id).subscribe(() => this.operations.listVisitors().subscribe(x => (this.visitors = x)));
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
      this.inventoryTabError = this.translate.instant('operations.inventory.errSkuName');
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
          this.inventoryTabError = e?.message || this.translate.instant('operations.inventory.errSaveFailed');
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
        title: this.translate.instant('operations.inventory.confirmRemoveTitle'),
        message: this.translate.instant('operations.inventory.confirmRemoveMessage', { name: row.name, sku: row.sku }),
        variant: 'danger',
        confirmLabel: this.translate.instant('operations.inventory.confirmRemove'),
        cancelLabel: this.translate.instant('operations.inventory.cancel'),
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
            this.inventoryTabError = e?.message || this.translate.instant('operations.inventory.errRemoveFailed');
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
