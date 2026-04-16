import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationsService } from '../../core/services/operations.service';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { FeeService } from '../../core/services/fee.service';
import { FeePayment, SchoolClass, Teacher } from '../../core/models/models';
import {
  FeeReminderRow,
  GatePassRow,
  InventoryRow,
  OperationalStaffRow,
  OperationsTab,
  PayrollAccrualSummary,
  VisitorLogRow,
} from '../../core/models/operations.models';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { filter } from 'rxjs/operators';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { runtimeConfig } from '../../core/config/runtime-config';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-operations-hub',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ErpPaginationComponent,
    TranslateModule,
    ErpI18nPhDirective,
    ErpI18nTextDirective,
  ],
  template: `
    <div data-testid="operations-hub-page">
      <div class="mb-4 animate-in">
        <h2 style="font-size: 24px; font-weight: 800;">{{ 'operations.pageTitle' | translate }}</h2>
        <p class="text-muted mb-0" style="font-size: 13px;">{{ 'operations.lead' | translate }}</p>
      </div>
      <div class="erp-tabs mb-4">
        <button type="button" class="erp-tab" *ngFor="let t of tabs" [class.active]="tab === t.id" (click)="selectTab(t.id)">{{ ('operations.tab.' + t.id) | translate }}</button>
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'staff'">
        <h4 class="erp-card-title mb-3">{{ 'operations.staff.title' | translate }}</h4>
        <p class="text-muted small mb-2">{{ 'operations.staff.hint' | translate }}</p>
        <div *ngIf="staffTabError" class="alert alert-danger py-2 px-3 small mb-2" style="border-radius: var(--radius-md);">{{ staffTabError }}</div>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><select class="erp-select" [(ngModel)]="staffForm.staffRole"><option *ngFor="let r of staffRoles" [value]="r">{{ staffRoleLabel(r) }}</option></select></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="staffForm.fullName" erpI18nPh="operations.staff.phFullName" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="staffForm.phone" erpI18nPh="operations.staff.phPhone" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="staffForm.employeeCode" erpI18nPh="operations.staff.phCode" /></div>
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
        <app-erp-pagination
          *ngIf="staffTotal > 0"
          class="d-block mt-2"
          [totalElements]="staffTotal"
          [pageIndex]="staffPageIndex"
          [pageSize]="staffPageSize"
          (pageIndexChange)="onStaffPageIndex($event)"
          (pageSizeChange)="onStaffPageSize($event)"
        />
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'visitors'">
        <h4 class="erp-card-title mb-3">{{ 'operations.visitors.title' | translate }}</h4>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.visitorName" erpI18nPh="operations.visitors.phVisitorName" /></div>
          <div class="col-md-2"><input class="erp-input" [(ngModel)]="visitorForm.phone" erpI18nPh="operations.visitors.phPhone" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.hostName" erpI18nPh="operations.visitors.phHost" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="visitorForm.purpose" erpI18nPh="operations.visitors.phPurpose" /></div>
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
        <app-erp-pagination
          *ngIf="visitorsTotal > 0"
          class="d-block mt-2"
          [totalElements]="visitorsTotal"
          [pageIndex]="visitorPageIndex"
          [pageSize]="visitorPageSize"
          (pageIndexChange)="onVisitorPageIndex($event)"
          (pageSizeChange)="onVisitorPageSize($event)"
        />
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'gate'">
        <h4 class="erp-card-title mb-3">{{ 'operations.gate.title' | translate }}</h4>
        <div class="row g-2 mb-3">
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="gateForm.issuedToName" erpI18nPh="operations.gate.phIssuedTo" /></div>
          <div class="col-md-2"><input type="date" class="erp-input" [(ngModel)]="gateForm.validFrom" /></div>
          <div class="col-md-2"><input type="date" class="erp-input" [(ngModel)]="gateForm.validTo" /></div>
          <div class="col-md-3"><input class="erp-input" [(ngModel)]="gateForm.purpose" erpI18nPh="operations.gate.phPurpose" /></div>
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
        <app-erp-pagination
          *ngIf="gateTotal > 0"
          class="d-block mt-2"
          [totalElements]="gateTotal"
          [pageIndex]="gatePageIndex"
          [pageSize]="gatePageSize"
          (pageIndexChange)="onGatePageIndex($event)"
          (pageSizeChange)="onGatePageSize($event)"
        />
      </div>

      <div class="erp-card mb-4" *ngIf="tab === 'inventory'">
        <h4 class="erp-card-title mb-3">{{ 'operations.inventory.title' | translate }}</h4>
        <p class="text-muted small mb-2">{{ 'operations.inventory.hint' | translate }}</p>
        <div *ngIf="inventoryTabError" class="alert alert-danger py-2 px-3 small mb-2" style="border-radius: var(--radius-md);">{{ inventoryTabError }}</div>
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelSku' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.sku" erpI18nPh="operations.inventory.phSku" [readOnly]="!!invEditingId" [title]="invEditingId ? ('operations.inventory.skuLockedTitle' | translate) : ''" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelName' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.name" erpI18nPh="operations.inventory.phName" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelCategory' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.category" erpI18nPh="operations.inventory.phCategory" />
          </div>
          <div class="col-lg-1 col-md-3">
            <label class="erp-label">{{ 'operations.inventory.labelQty' | translate }}</label>
            <input type="number" class="erp-input" [(ngModel)]="invForm.quantityOnHand" erpI18nPh="operations.inventory.phQty" />
          </div>
          <div class="col-lg-1 col-md-3">
            <label class="erp-label">{{ 'operations.inventory.labelReorder' | translate }}</label>
            <input type="number" class="erp-input" [(ngModel)]="invForm.reorderLevel" erpI18nPh="operations.inventory.phReorder" />
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="erp-label">{{ 'operations.inventory.labelLocation' | translate }}</label>
            <input class="erp-input" [(ngModel)]="invForm.location" erpI18nPh="operations.inventory.phLocation" />
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
        <app-erp-pagination
          *ngIf="invTotal > 0"
          class="d-block mt-2"
          [totalElements]="invTotal"
          [pageIndex]="invPageIndex"
          [pageSize]="invPageSize"
          (pageIndexChange)="onInvPageIndex($event)"
          (pageSizeChange)="onInvPageSize($event)"
        />
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
        <div class="row g-2 align-items-end mb-2" *ngIf="pendingFees.length">
          <div class="col-md-6">
            <label class="erp-label small mb-1" erpI18nText="operations.reminders.searchOutstanding"></label>
            <input type="search" class="erp-input" erpI18nPh="operations.reminders.searchOutstandingPh" [(ngModel)]="pendingFeesSearch" (ngModelChange)="onPendingFeesSearchChange()" />
          </div>
        </div>
        <p *ngIf="pendingFees.length && !pendingFeesFilteredTotal" class="text-muted small mb-2">{{ 'operations.reminders.noOutstandingMatches' | translate }}</p>
        <table class="erp-table mb-2" *ngIf="pendingFeesFilteredTotal">
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
            <tr *ngFor="let p of pagedPendingFees">
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
          </tbody>
        </table>
        <app-erp-pagination
          *ngIf="pendingFeesFilteredTotal > pendingFeesPageSize"
          class="d-block mb-4"
          [totalElements]="pendingFeesFilteredTotal"
          [pageIndex]="pendingFeesPageIndex"
          [pageSize]="pendingFeesPageSize"
          (pageIndexChange)="onPendingFeesPageIndex($event)"
          (pageSizeChange)="onPendingFeesPageSize($event)"
        />
        <p *ngIf="!pendingFees.length" class="text-muted small mb-4">{{ 'operations.reminders.emptyPending' | translate }}</p>
        <h5 class="erp-card-title mb-2" style="font-size: 14px;">{{ 'operations.reminders.queueTitle' | translate }}</h5>
        <div class="row g-2 align-items-end mb-2" *ngIf="reminders.length && remindersQueueClientFilter">
          <div class="col-md-6">
            <label class="erp-label small mb-1" erpI18nText="operations.reminders.searchQueue"></label>
            <input type="search" class="erp-input" erpI18nPh="operations.reminders.searchQueuePh" [(ngModel)]="remindersSearch" (ngModelChange)="onRemindersSearchChange()" />
          </div>
        </div>
        <p *ngIf="reminders.length && !remindersFilteredTotal" class="text-muted small mb-2">{{ 'operations.reminders.noQueueMatches' | translate }}</p>
        <table class="erp-table mb-0" *ngIf="remindersFilteredTotal">
          <thead><tr><th>{{ 'operations.reminders.thStudent' | translate }}</th><th>{{ 'operations.reminders.thDue' | translate }}</th><th>{{ 'operations.reminders.thChannel' | translate }}</th><th>{{ 'operations.reminders.thStatus' | translate }}</th><th>{{ 'operations.reminders.thScheduled' | translate }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of pagedReminders">
              <td><strong>{{ reminderStudentLabel(r) }}</strong><span class="d-block small text-muted">#{{ r.studentId }}</span></td>
              <td>{{ r.dueDate || ('transport.dash' | translate) }}</td>
              <td>{{ r.channel }}</td>
              <td>{{ r.status }}</td>
              <td>{{ r.scheduledAt ? (r.scheduledAt | date:'short') : ('transport.dash' | translate) }}</td>
            </tr>
          </tbody>
        </table>
        <app-erp-pagination
          *ngIf="remindersFilteredTotal > remindersPageSize"
          class="d-block mt-2"
          [totalElements]="remindersFilteredTotal"
          [pageIndex]="remindersPageIndex"
          [pageSize]="remindersPageSize"
          (pageIndexChange)="onRemindersPageIndex($event)"
          (pageSizeChange)="onRemindersPageSize($event)"
        />
        <p *ngIf="!reminders.length" class="text-muted small mb-0">{{ 'operations.reminders.emptyQueue' | translate }}</p>
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
  private static readonly ALL_TABS: { id: OperationsTab }[] = [
    { id: 'staff' },
    { id: 'visitors' },
    { id: 'gate' },
    { id: 'inventory' },
    { id: 'reminders' },
    { id: 'payroll' },
  ];

  tab: OperationsTab = 'staff';
  tabs: { id: OperationsTab }[] = [...OperationsHubComponent.ALL_TABS];

  classes: SchoolClass[] = [];
  teachers: Teacher[] = [];
  staff: OperationalStaffRow[] = [];
  staffTotal = 0;
  staffPageIndex = 0;
  staffPageSize = DEFAULT_ERP_PAGE_SIZE;
  visitors: VisitorLogRow[] = [];
  visitorsTotal = 0;
  visitorPageIndex = 0;
  visitorPageSize = DEFAULT_ERP_PAGE_SIZE;
  gatePasses: GatePassRow[] = [];
  gateTotal = 0;
  gatePageIndex = 0;
  gatePageSize = DEFAULT_ERP_PAGE_SIZE;
  inventory: InventoryRow[] = [];
  invTotal = 0;
  invPageIndex = 0;
  invPageSize = DEFAULT_ERP_PAGE_SIZE;
  reminders: FeeReminderRow[] = [];
  readonly remindersQueueClientFilter = runtimeConfig.useMocks;
  pendingFees: FeePayment[] = [];
  private studentNameById: Record<number, string> = {};
  pendingFeesSearch = '';
  pendingFeesPageIndex = 0;
  pendingFeesPageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedPendingFees: FeePayment[] = [];
  pendingFeesFilteredTotal = 0;
  remindersSearch = '';
  remindersPageIndex = 0;
  remindersPageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedReminders: FeeReminderRow[] = [];
  remindersFilteredTotal = 0;
  payroll: PayrollAccrualSummary | null = null;

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
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private operations: OperationsService,
    private academic: AcademicService,
    private teacherService: TeacherService,
    private feeService: FeeService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private settings: SettingsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  staffRoleLabel(code: string): string {
    const key = `operations.staff.staffRoleEnum.${code}`;
    const t = this.translate.instant(key);
    return t !== key ? t : code;
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    const tabSnap = this.route.snapshot.queryParamMap.get('tab');
    if (tabSnap === 'covers') {
      void this.router.navigate(['/app/timetable'], { queryParams: { section: 'covers' }, replaceUrl: true });
    }
    this.academic.getClasses().subscribe(c => (this.classes = c));
    this.teacherService.getTeachers().subscribe(t => (this.teachers = t));
    this.settings.getFeatures().subscribe(() => {
      this.tabs = [...OperationsHubComponent.ALL_TABS];
      this.cdr.markForCheck();
    });
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(q => {
      const raw = (q['tab'] || '').toString();
      if (!raw) {
        return;
      }
      const allowed = new Set(OperationsHubComponent.ALL_TABS.map(x => x.id));
      if (allowed.has(raw as OperationsTab)) {
        this.selectTab(raw as OperationsTab);
      }
    });
  }

  selectTab(t: OperationsTab): void {
    this.tab = t;
    if (t === 'staff') {
      this.staffTabError = '';
      this.staffPageIndex = 0;
      this.loadStaffPage();
    }
    if (t === 'visitors') {
      this.visitorPageIndex = 0;
      this.loadVisitorsPage();
    }
    if (t === 'gate') {
      this.gatePageIndex = 0;
      this.loadGatePage();
    }
    if (t === 'inventory') {
      this.inventoryTabError = '';
      this.invPageIndex = 0;
      this.loadInventoryPage();
    }
    if (t === 'reminders') this.reloadReminders();
    if (t === 'payroll') this.loadPayroll();
  }

  loadStaffPage(): void {
    this.operations.listStaffPage(this.staffPageIndex, this.staffPageSize).subscribe(p => {
      this.staff = p.content;
      this.staffTotal = p.totalElements;
      this.staffPageIndex = p.page;
    });
  }

  onStaffPageIndex(i: number): void {
    this.staffPageIndex = i;
    this.loadStaffPage();
  }

  onStaffPageSize(s: number): void {
    this.staffPageSize = s;
    this.staffPageIndex = 0;
    this.loadStaffPage();
  }

  loadVisitorsPage(): void {
    this.operations.listVisitorsPage(this.visitorPageIndex, this.visitorPageSize).subscribe(p => {
      this.visitors = p.content;
      this.visitorsTotal = p.totalElements;
      this.visitorPageIndex = p.page;
    });
  }

  onVisitorPageIndex(i: number): void {
    this.visitorPageIndex = i;
    this.loadVisitorsPage();
  }

  onVisitorPageSize(s: number): void {
    this.visitorPageSize = s;
    this.visitorPageIndex = 0;
    this.loadVisitorsPage();
  }

  loadGatePage(): void {
    this.operations.listGatePassesPage(this.gatePageIndex, this.gatePageSize).subscribe(p => {
      this.gatePasses = p.content;
      this.gateTotal = p.totalElements;
      this.gatePageIndex = p.page;
    });
  }

  onGatePageIndex(i: number): void {
    this.gatePageIndex = i;
    this.loadGatePage();
  }

  onGatePageSize(s: number): void {
    this.gatePageSize = s;
    this.gatePageIndex = 0;
    this.loadGatePage();
  }

  loadInventoryPage(): void {
    this.operations.listInventoryPage(this.invPageIndex, this.invPageSize).subscribe(p => {
      this.inventory = p.content;
      this.invTotal = p.totalElements;
      this.invPageIndex = p.page;
    });
  }

  onInvPageIndex(i: number): void {
    this.invPageIndex = i;
    this.loadInventoryPage();
  }

  onInvPageSize(s: number): void {
    this.invPageSize = s;
    this.invPageIndex = 0;
    this.loadInventoryPage();
  }

  private fetchRemindersQueuePage(): void {
    this.operations.listFeeRemindersPage(this.remindersPageIndex, this.remindersPageSize, 'PENDING').subscribe(p => {
      this.reminders = p.content;
      this.pagedReminders = p.content;
      this.remindersFilteredTotal = p.totalElements;
      this.remindersPageIndex = p.page;
    });
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
          this.staffPageIndex = 0;
          this.loadStaffPage();
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
        this.operations.deleteStaff(s.id, false).subscribe(() => this.loadStaffPage());
      });
  }

  checkIn(): void {
    this.operations.checkInVisitor(this.visitorForm).subscribe(() => this.loadVisitorsPage());
  }

  checkOut(v: VisitorLogRow): void {
    this.operations.checkOutVisitor(v.id).subscribe(() => this.loadVisitorsPage());
  }

  addGate(): void {
    if (!this.gateForm.issuedToName || !this.gateForm.validFrom || !this.gateForm.validTo) return;
    this.operations.createGatePass(this.gateForm as any).subscribe(() => {
      this.gatePageIndex = 0;
      this.loadGatePage();
    });
  }

  revokeGate(g: GatePassRow): void {
    this.operations.revokeGatePass(g.id).subscribe(() => this.loadGatePage());
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
          this.invPageIndex = 0;
          this.loadInventoryPage();
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
            this.loadInventoryPage();
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
      this.studentNameById = Object.fromEntries(this.pendingFees.map(p => [p.studentId, p.studentName]));
      this.pendingFeesPageIndex = 0;
      this.applyPendingFeesPaging();
      const slim = this.pendingFees.map(p => ({
        id: p.id,
        studentId: p.studentId,
        dueDate: p.dueDate,
        dueAmount: p.dueAmount ?? 0,
      }));
      if (runtimeConfig.useMocks) {
        this.operations.syncAutoRemindersForOutstandingFees(slim).subscribe(() => {
          this.operations.listFeeReminders('PENDING').subscribe(rows => {
            this.reminders = rows || [];
            this.remindersPageIndex = 0;
            this.applyRemindersPaging();
          });
        });
        return;
      }
      this.operations.syncAutoRemindersForOutstandingFees(slim).subscribe(() => {
        this.remindersPageIndex = 0;
        this.fetchRemindersQueuePage();
      });
    });
  }

  reminderStudentLabel(r: FeeReminderRow): string {
    return this.studentNameById[r.studentId] || '';
  }

  private filterPendingFees(): FeePayment[] {
    const q = this.pendingFeesSearch.trim().toLowerCase();
    if (!q) {
      return this.pendingFees;
    }
    return this.pendingFees.filter(
      p =>
        p.studentName.toLowerCase().includes(q) ||
        String(p.studentId).includes(q) ||
        (p.status || '').toLowerCase().includes(q)
    );
  }

  applyPendingFeesPaging(): void {
    const pg = sliceToPage(this.filterPendingFees(), this.pendingFeesPageIndex, this.pendingFeesPageSize);
    this.pagedPendingFees = pg.content;
    this.pendingFeesPageIndex = pg.page;
    this.pendingFeesFilteredTotal = pg.totalElements;
  }

  onPendingFeesSearchChange(): void {
    this.pendingFeesPageIndex = 0;
    this.applyPendingFeesPaging();
  }

  onPendingFeesPageIndex(i: number): void {
    this.pendingFeesPageIndex = i;
    this.applyPendingFeesPaging();
  }

  onPendingFeesPageSize(s: number): void {
    this.pendingFeesPageSize = s;
    this.pendingFeesPageIndex = 0;
    this.applyPendingFeesPaging();
  }

  private filterReminders(): FeeReminderRow[] {
    const q = this.remindersSearch.trim().toLowerCase();
    if (!q) {
      return this.reminders;
    }
    return this.reminders.filter(r => {
      const name = this.reminderStudentLabel(r).toLowerCase();
      return (
        name.includes(q) ||
        String(r.studentId).includes(q) ||
        (r.channel || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      );
    });
  }

  applyRemindersPaging(): void {
    if (!this.remindersQueueClientFilter) {
      this.pagedReminders = this.reminders;
      return;
    }
    const pg = sliceToPage(this.filterReminders(), this.remindersPageIndex, this.remindersPageSize);
    this.pagedReminders = pg.content;
    this.remindersPageIndex = pg.page;
    this.remindersFilteredTotal = pg.totalElements;
  }

  onRemindersSearchChange(): void {
    this.remindersPageIndex = 0;
    if (this.remindersQueueClientFilter) this.applyRemindersPaging();
  }

  onRemindersPageIndex(i: number): void {
    this.remindersPageIndex = i;
    if (this.remindersQueueClientFilter) this.applyRemindersPaging();
    else this.fetchRemindersQueuePage();
  }

  onRemindersPageSize(s: number): void {
    this.remindersPageSize = s;
    this.remindersPageIndex = 0;
    if (this.remindersQueueClientFilter) this.applyRemindersPaging();
    else this.fetchRemindersQueuePage();
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
