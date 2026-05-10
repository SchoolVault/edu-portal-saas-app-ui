import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OperationsService } from '../../core/services/operations.service';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { TimetableService } from '../../core/services/timetable.service';
import { FeeService } from '../../core/services/fee.service';
import { FeePayment, SchoolClass, Teacher } from '../../core/models/models';
import {
  AttendanceCoverAuditRow,
  AttendanceCoverConflictPayload,
  AttendanceCoverRow,
  FeeReminderRow,
  GatePassRow,
  InventoryRow,
  OperationalStaffRow,
  OperationsTab,
  OperationsSearchActivityRow,
  OperationsSearchResultRow,
  PayrollAccrualSummary,
  VisitorLogRow,
} from '../../core/models/operations.models';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { filter } from 'rxjs/operators';
import { SchedulingConflictError } from '../../core/errors/scheduling-conflict.error';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { runtimeConfig } from '../../core/config/runtime-config';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { formatSchoolClassDisplayName } from '../../core/i18n/school-class-display';
import { isValidIndiaMobileTen } from '../../core/validation/phone.validation';
import { formatDateDdMmYyyy } from '../../core/utils/date-format';
import { UiAccessService } from '../../core/services/ui-access.service';
import { finalize } from 'rxjs/operators';

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
  templateUrl: './operations-hub.component.html',
  styleUrls: ['./operations-hub.component.css'],
})
export class OperationsHubComponent implements OnInit {
  private static readonly ALL_TABS: { id: OperationsTab }[] = [
    { id: 'search' },
    { id: 'staff' },
    { id: 'visitors' },
    { id: 'gate' },
    { id: 'inventory' },
    { id: 'reminders' },
    { id: 'payroll' },
  ];

  tab: OperationsTab = 'staff';
  tabs: { id: OperationsTab }[] = [...OperationsHubComponent.ALL_TABS];
  globalSearchQuery = '';
  globalSearchScopesAll: Array<'staff' | 'visitors' | 'gate' | 'inventory' | 'reminders'> = ['staff', 'visitors', 'gate', 'inventory', 'reminders'];
  globalSearchScopesSelected = new Set<string>(this.globalSearchScopesAll);
  globalSearchRows: OperationsSearchResultRow[] = [];
  globalSearchRowsFiltered: OperationsSearchResultRow[] = [];
  globalSearchStatusFilter = 'ALL';
  globalSearchActivity: OperationsSearchActivityRow[] = [];
  globalSearchActivityTotal = 0;
  globalSearchActivityPageIndex = 0;
  globalSearchActivityPageSize = 10;
  globalSearchError = '';
  globalSearchActivityError = '';
  globalSearchBusy = false;
  globalSearchActivityBusy = false;
  private readonly searchScopeStorageKey = 'ops.search.savedScopes.v1';

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
  coverDate = new Date().toISOString().split('T')[0];
  coverForm = {
    classId: null as number | null,
    sectionId: null as number | null,
    coveringTeacherId: null as number | null,
    reason: '',
    periodNumber: null as number | null,
  };
  coversAdmin: AttendanceCoverRow[] = [];
  coversTotal = 0;
  coversPageIndex = 0;
  coversPageSize = DEFAULT_ERP_PAGE_SIZE;
  coverAuditRows: AttendanceCoverAuditRow[] = [];
  coverAuditTotal = 0;
  coverAuditPageIndex = 0;
  coverAuditPageSize = DEFAULT_ERP_PAGE_SIZE;
  coverSlotRegularTeacherId: number | null = null;
  coverPeriodOptions: number[] = [];

  staffRoles = ['DRIVER', 'SECURITY', 'OFFICE', 'NURSE', 'MAINTENANCE', 'LAB_ASSISTANT', 'OTHER'];
  staffForm = { staffRole: 'DRIVER', fullName: '', phone: '', employeeCode: '', createPortal: true as boolean };
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
  visitorsTabError = '';
  gateTabError = '';
  remindersTabError = '';
  inventoryTabError = '';
  coversTabError = '';
  private readonly destroyRef = inject(DestroyRef);
  canManageOperationsLifecycle = false;
  get coverSections(): { id: number; name: string }[] {
    const cls = this.classes.find(c => c.id === this.coverForm.classId);
    return cls?.sections?.map(s => ({ id: s.id, name: s.name })) ?? [];
  }

  get coverTeachersForDropdown(): Teacher[] {
    const skip = this.coverSlotRegularTeacherId;
    if (skip == null) {
      return this.teachers;
    }
    return this.teachers.filter(t => Number(t.id) !== Number(skip));
  }

  get coverSlotRegularTeacherName(): string {
    if (this.coverSlotRegularTeacherId == null) {
      return this.translate.instant('operations.covers.notAvailable');
    }
    const t = this.teachers.find(x => Number(x.id) === Number(this.coverSlotRegularTeacherId));
    return t ? `${t.firstName} ${t.lastName}`.trim() : this.translate.instant('operations.covers.notAvailable');
  }

  formatCoverTableDate(raw: string | null | undefined): string {
    return formatDateDdMmYyyy(raw) || '—';
  }

  onCoverClassChanged(): void {
    const cls = this.classes.find(c => c.id === this.coverForm.classId);
    const secs = cls?.sections ?? [];
    if (secs.length === 1) {
      this.coverForm.sectionId = secs[0].id;
    } else {
      this.coverForm.sectionId = null;
    }
    this.refreshCoverRegularTeacher();
  }

  compareCoverSectionIds(a: number | null | undefined, b: number | null | undefined): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
  }


  constructor(
    private operations: OperationsService,
    private academic: AcademicService,
    private teacherService: TeacherService,
    private timetableService: TimetableService,
    private feeService: FeeService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private settings: SettingsService,
    private auth: AuthService,
    private uiAccess: UiAccessService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  staffRoleLabel(code: string): string {
    const key = `operations.staff.staffRoleEnum.${code}`;
    const t = this.translate.instant(key);
    return t !== key ? t : code;
  }

  ngOnInit(): void {
    this.canManageOperationsLifecycle = this.uiAccess.hasOperationsDeskWriteAccess();
    this.restoreSearchScopes();
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    const tabSnap = this.route.snapshot.queryParamMap.get('tab');
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
    this.operations.attendanceCoverMutations$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(mutation => {
      if (this.tab !== 'covers' || mutation.coverDate !== this.coverDate) {
        return;
      }
      this.loadCoversPage();
      this.loadCoverAuditPage();
    });
  }

  selectTab(t: OperationsTab): void {
    this.tab = t;
    if (t === 'search') {
      this.runGlobalSearch();
    }
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
    if (t === 'covers') {
      this.coversTabError = '';
      this.coversPageIndex = 0;
      this.coverAuditPageIndex = 0;
      this.loadCoversPage();
      this.loadCoverAuditPage();
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

  private buildCoverConflictLocationLine(c: AttendanceCoverConflictPayload): string {
    const classId = c.classId ?? this.coverForm.classId;
    const className = classId == null
      ? '—'
      : formatSchoolClassDisplayName(classId, this.classes.find(x => x.id === classId)?.name, this.translate);
    const sectionText =
      c.sectionId == null
        ? this.translate.instant('operations.covers.allSections')
        : this.classes
            .find(x => x.id === (c.classId ?? this.coverForm.classId))
            ?.sections.find(s => s.id === c.sectionId)?.name ?? String(c.sectionId);
    const periodText =
      c.periodNumber != null ? this.translate.instant('timetable.gridPeriod', { n: c.periodNumber }) : this.translate.instant('transport.dash');
    return this.translate.instant('operations.covers.conflictDetailScope', {
      location: `${className} · ${sectionText} · ${periodText}`,
    });
  }

  loadCoversPage(): void {
    this.refreshCoverRegularTeacher();
    this.operations.listAttendanceCoversAdmin(this.coverDate).subscribe({
      next: rows => {
        const page = sliceToPage(rows || [], this.coversPageIndex, this.coversPageSize);
        this.coversAdmin = page.content;
        this.coversPageIndex = page.page;
        this.coversTotal = page.totalElements;
      },
      error: (e: Error) => {
        this.coversTabError = e?.message || this.translate.instant('attendance.errors.saveFailed');
      },
    });
  }

  onCoversPageIndex(i: number): void {
    this.coversPageIndex = i;
    this.loadCoversPage();
  }

  onCoversPageSize(s: number): void {
    this.coversPageSize = s;
    this.coversPageIndex = 0;
    this.loadCoversPage();
  }

  loadCoverAuditPage(): void {
    this.operations.listAttendanceCoverAuditPage(this.coverDate, this.coverAuditPageIndex, this.coverAuditPageSize).subscribe({
      next: p => {
        this.coverAuditRows = p.content || [];
        this.coverAuditPageIndex = p.page;
        this.coverAuditTotal = p.totalElements;
      },
      error: () => {
        this.coverAuditRows = [];
        this.coverAuditTotal = 0;
      },
    });
  }

  onCoverAuditPageIndex(i: number): void {
    this.coverAuditPageIndex = i;
    this.loadCoverAuditPage();
  }

  onCoverAuditPageSize(s: number): void {
    this.coverAuditPageSize = s;
    this.coverAuditPageIndex = 0;
    this.loadCoverAuditPage();
  }

  onCoverDateChange(): void {
    this.coversPageIndex = 0;
    this.coverAuditPageIndex = 0;
    this.loadCoversPage();
    this.loadCoverAuditPage();
  }

  refreshCoverRegularTeacher(): void {
    this.coverSlotRegularTeacherId = null;
    this.coverPeriodOptions = [];
    const cid = this.coverForm.classId;
    if (cid == null) {
      this.clearCoverTeacherIfInvalid();
      return;
    }
    const cls = this.classes.find(c => c.id === cid);
    const hasSecs = (cls?.sections?.length ?? 0) > 0;
    if (hasSecs && this.coverForm.sectionId == null) {
      this.clearCoverTeacherIfInvalid();
      return;
    }
    const secParam = hasSecs ? this.coverForm.sectionId! : undefined;
    this.timetableService.getByClassAndSection(cid, secParam).subscribe({
      next: entries => {
        this.coverPeriodOptions = this.timetableService.listPeriodsForCoverDate(entries, this.coverDate);
        const currentPeriod = this.coverForm.periodNumber != null ? Number(this.coverForm.periodNumber) : null;
        if (currentPeriod == null || !this.coverPeriodOptions.includes(currentPeriod)) {
          this.coverForm.periodNumber = this.coverPeriodOptions.length === 1 ? this.coverPeriodOptions[0] : null;
        }
        const period = Number(this.coverForm.periodNumber);
        const tid = Number.isFinite(period) && period > 0
          ? this.timetableService.findRegularTeacherIdForCoverSlot(entries, this.coverDate, period)
          : null;
        this.coverSlotRegularTeacherId = tid;
        if (tid != null && Number(this.coverForm.coveringTeacherId) === Number(tid)) {
          this.coverForm.coveringTeacherId = null;
        }
        this.clearCoverTeacherIfInvalid();
        this.cdr.markForCheck();
      },
      error: () => {
        this.coverSlotRegularTeacherId = null;
        this.coverPeriodOptions = [];
        this.coverForm.periodNumber = null;
        this.clearCoverTeacherIfInvalid();
        this.cdr.markForCheck();
      },
    });
  }

  private clearCoverTeacherIfInvalid(): void {
    const allowed = new Set(this.coverTeachersForDropdown.map(t => Number(t.id)));
    const cur = this.coverForm.coveringTeacherId;
    if (cur != null && !allowed.has(Number(cur))) {
      this.coverForm.coveringTeacherId = null;
    }
  }

  /** Local calendar “today” for min-date validation (cover assignments are forward-looking). */
  get todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  submitCover(): void {
    this.coversTabError = '';
    if (this.coverDate && this.coverDate < this.todayIso) {
      this.coversTabError = this.translate.instant('operations.covers.pastDateNotAllowed');
      return;
    }
    if (this.coverForm.classId == null || this.coverForm.coveringTeacherId == null) {
      this.coversTabError = this.translate.instant('operations.covers.errRequired');
      return;
    }
    const cls = this.classes.find(c => c.id === this.coverForm.classId);
    const secId = this.coverForm.sectionId;
    const sectionChosen = secId != null && Number(secId) > 0;
    if ((cls?.sections?.length ?? 0) > 0 && !sectionChosen) {
      this.coversTabError = this.translate.instant('operations.covers.sectionRequired');
      return;
    }
    if (this.coverForm.periodNumber == null) {
      this.coversTabError = this.translate.instant('operations.covers.periodRequired');
      return;
    }
    if (
      this.coverSlotRegularTeacherId != null &&
      Number(this.coverForm.coveringTeacherId) === Number(this.coverSlotRegularTeacherId)
    ) {
      this.coversTabError = this.translate.instant('operations.covers.sameAsAbsentTeacher');
      return;
    }
    if (!this.coverPeriodOptions.includes(Number(this.coverForm.periodNumber))) {
      this.coversTabError = this.translate.instant('operations.covers.periodUnavailable');
      return;
    }
    this.createCoverWithOptionalReplace(undefined);
  }

  private createCoverWithOptionalReplace(replaceCoverAssignmentId: number | undefined): void {
    const period =
      this.coverForm.periodNumber != null && this.coverForm.periodNumber > 0 ? this.coverForm.periodNumber : undefined;
    this.operations
      .createAttendanceCover({
        coverDate: this.coverDate,
        classId: this.coverForm.classId!,
        sectionId: this.coverForm.sectionId ?? undefined,
        regularTeacherId: this.coverSlotRegularTeacherId ?? undefined,
        coveringTeacherId: this.coverForm.coveringTeacherId!,
        reason: this.coverForm.reason,
        periodNumber: period,
        replaceCoverAssignmentId,
      }, {
        actorUserId: this.auth.getCurrentUser()?.id ?? null,
        actorName: this.auth.getCurrentUser()?.name ?? undefined,
      })
      .subscribe({
        next: () => {
          this.coverForm.reason = '';
          this.coversPageIndex = 0;
          this.coverAuditPageIndex = 0;
          this.loadCoversPage();
          this.loadCoverAuditPage();
        },
        error: (e: unknown) => {
          if (e instanceof SchedulingConflictError) {
            const c = e.conflict;
            const otherName = c.existingCoveringTeacherName?.trim() || `Teacher #${c.existingCoveringTeacherId}`;
            this.confirmDialog
              .confirm({
                title: this.translate.instant('operations.covers.conflictTitle'),
                message: this.translate.instant('operations.covers.conflictMessage', { name: otherName }),
                details: [
                  this.translate.instant('operations.covers.conflictDetailDate', { date: this.coverDate }),
                  this.buildCoverConflictLocationLine(c),
                ],
                variant: 'warning',
                confirmLabel: this.translate.instant('operations.covers.conflictConfirmReplace'),
                cancelLabel: this.translate.instant('operations.covers.conflictKeep'),
              })
              .pipe(filter(Boolean))
              .subscribe(() => this.createCoverWithOptionalReplace(c.existingCoverAssignmentId));
            return;
          }
          this.coversTabError = e instanceof Error ? e.message : this.translate.instant('attendance.errors.saveFailed');
        },
      });
  }

  cancelCoverAdmin(c: AttendanceCoverRow): void {
    this.confirmDialog
      .confirm({
        title: this.translate.instant('operations.covers.cancelConfirmTitle'),
        message: this.translate.instant('operations.covers.cancelConfirmMessage'),
        variant: 'danger',
        confirmLabel: this.translate.instant('operations.covers.cancelConfirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() =>
        this.operations
          .cancelAttendanceCover(c.id, {
            coverDate: c.coverDate,
            classId: c.classId,
            sectionId: c.sectionId ?? null,
          }, {
            actorUserId: this.auth.getCurrentUser()?.id ?? null,
            actorName: this.auth.getCurrentUser()?.name ?? undefined,
          })
          .subscribe({
            next: () => {
              this.loadCoversPage();
              this.loadCoverAuditPage();
            },
            error: (e: Error) => {
              this.coversTabError = e?.message || this.translate.instant('attendance.errors.saveFailed');
            },
          })
      );
  }

  coverRowClassDisplay(row: AttendanceCoverRow): string {
    return formatSchoolClassDisplayName(row.classId, this.classes.find(x => x.id === row.classId)?.name, this.translate);
  }

  coverRowSectionDisplay(row: AttendanceCoverRow): string {
    const cls = this.classes.find(x => x.id === row.classId);
    if (!cls?.sections?.length) {
      return this.translate.instant('timetable.sectionWholeClass');
    }
    if (row.sectionId == null) {
      return this.translate.instant('operations.covers.allSections');
    }
    return cls.sections.find(s => s.id === row.sectionId)?.name ?? String(row.sectionId);
  }

  coverRowTeacherDisplay(row: AttendanceCoverRow): string {
    const t = this.teachers.find(x => x.id === row.coveringTeacherId);
    return t ? `${t.firstName} ${t.lastName}`.trim() : String(row.coveringTeacherId);
  }

  coverRowRegularTeacherDisplay(row: AttendanceCoverRow): string {
    if (row.regularTeacherId == null) {
      return this.translate.instant('operations.covers.notAvailable');
    }
    const t = this.teachers.find(x => x.id === row.regularTeacherId);
    return t ? `${t.firstName} ${t.lastName}`.trim() : String(row.regularTeacherId);
  }

  coverAuditActionLabel(action: AttendanceCoverAuditRow['action']): string {
    const key = `operations.covers.auditAction.${action}`;
    const tr = this.translate.instant(key);
    return tr !== key ? tr : action;
  }

  auditClassDisplay(a: AttendanceCoverAuditRow): string {
    return formatSchoolClassDisplayName(a.classId, this.classes.find(c => c.id === a.classId)?.name, this.translate);
  }

  auditSectionDisplay(a: AttendanceCoverAuditRow): string {
    const cls = this.classes.find(c => c.id === a.classId);
    if (!cls?.sections?.length) {
      return this.translate.instant('timetable.sectionWholeClass');
    }
    if (a.sectionId == null) {
      return this.translate.instant('operations.covers.allSections');
    }
    return cls.sections.find(s => s.id === a.sectionId)?.name ?? String(a.sectionId);
  }

  auditTeacherDisplay(a: AttendanceCoverAuditRow): string {
    if (!a.coveringTeacherId) {
      return this.translate.instant('transport.dash');
    }
    const t = this.teachers.find(x => x.id === a.coveringTeacherId);
    return t ? `${t.firstName} ${t.lastName}`.trim() : String(a.coveringTeacherId);
  }

  auditChangeSummary(a: AttendanceCoverAuditRow): string {
    const beforeTeacher = a.before?.coveringTeacherId ?? null;
    const afterTeacher = a.after?.coveringTeacherId ?? a.coveringTeacherId ?? null;
    const beforeReason = (a.before?.reason ?? '').trim();
    const afterReason = (a.after?.reason ?? a.reason ?? '').trim();
    const beforeTeacherName = beforeTeacher != null ? this.auditTeacherDisplay({ ...a, coveringTeacherId: beforeTeacher }) : '';
    const afterTeacherName = afterTeacher != null ? this.auditTeacherDisplay({ ...a, coveringTeacherId: afterTeacher }) : '';
    if (a.action === 'CREATED') {
      return this.translate.instant('operations.covers.auditSummaryCreated', {
        teacher: afterTeacherName || this.translate.instant('transport.dash'),
        reason: afterReason || this.translate.instant('transport.dash'),
      });
    }
    if (a.action === 'CANCELLED') {
      return this.translate.instant('operations.covers.auditSummaryCancelled', {
        teacher: beforeTeacherName || this.translate.instant('transport.dash'),
        reason: beforeReason || this.translate.instant('transport.dash'),
      });
    }
    return this.translate.instant('operations.covers.auditSummaryReplaced', {
      beforeTeacher: beforeTeacherName || this.translate.instant('transport.dash'),
      afterTeacher: afterTeacherName || this.translate.instant('transport.dash'),
      beforeReason: beforeReason || this.translate.instant('transport.dash'),
      afterReason: afterReason || this.translate.instant('transport.dash'),
    });
  }

  addStaff(): void {
    if (!this.canManageOperationsLifecycle) return;
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
    this.staffForm.phone = this.normalizeTenDigitPhone(this.staffForm.phone);
    if (this.staffForm.phone && !this.isValidTenDigitPhone(this.staffForm.phone)) {
      this.staffTabError = this.translate.instant('operations.staff.errPhoneInvalidTenDigits');
      return;
    }
    if (this.staffForm.createPortal && !this.staffForm.phone?.trim()) {
      this.staffTabError = this.translate.instant('staff.profile.errPortalPhoneRequired');
      return;
    }
    this.operations
      .createStaff({
        staffRole: this.staffForm.staffRole.trim(),
        fullName,
        phone: this.staffForm.phone?.trim() || undefined,
        employeeCode: this.staffForm.employeeCode?.trim() || undefined,
        createPortal: this.staffForm.createPortal,
      })
      .subscribe({
        next: () => {
          this.staffForm = { staffRole: this.staffForm.staffRole, fullName: '', phone: '', employeeCode: '', createPortal: this.staffForm.createPortal };
          this.staffPageIndex = 0;
          this.loadStaffPage();
        },
        error: (e: Error) => {
          this.staffTabError = e?.message || this.translate.instant('operations.staff.errAddFailed');
        },
      });
  }

  removeStaff(s: OperationalStaffRow): void {
    if (!this.canManageOperationsLifecycle) return;
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
    this.visitorsTabError = '';
    const visitorName = this.visitorForm.visitorName?.trim();
    if (!visitorName) {
      this.visitorsTabError = this.translate.instant('operations.visitors.errVisitorNameRequired');
      return;
    }
    this.visitorForm.phone = this.normalizeTenDigitPhone(this.visitorForm.phone);
    if (this.visitorForm.phone && !this.isValidTenDigitPhone(this.visitorForm.phone)) {
      this.visitorsTabError = this.translate.instant('operations.visitors.errPhoneInvalidTenDigits');
      return;
    }
    this.operations.checkInVisitor({ ...this.visitorForm, visitorName }).subscribe({
      next: () => {
        this.visitorForm = { visitorName: '', phone: '', hostName: '', purpose: '' };
        this.loadVisitorsPage();
      },
      error: (e: Error) => {
        this.visitorsTabError = e?.message || this.translate.instant('operations.visitors.errCheckInFailed');
      },
    });
  }

  checkOut(v: VisitorLogRow): void {
    this.operations.checkOutVisitor(v.id).subscribe(() => this.loadVisitorsPage());
  }

  addGate(): void {
    this.gateTabError = '';
    const issuedToName = this.gateForm.issuedToName?.trim();
    if (!issuedToName || !this.gateForm.validFrom || !this.gateForm.validTo) {
      this.gateTabError = this.translate.instant('operations.gate.errIssuedToAndDatesRequired');
      return;
    }
    if (this.gateForm.validTo < this.gateForm.validFrom) {
      this.gateTabError = this.translate.instant('operations.gate.errValidToBeforeValidFrom');
      return;
    }
    this.operations.createGatePass({ ...this.gateForm, issuedToName } as any).subscribe({
      next: () => {
        this.gateForm = {
          issuedToName: '',
          validFrom: this.gateForm.validFrom,
          validTo: this.gateForm.validTo,
          purpose: '',
        };
        this.gatePageIndex = 0;
        this.loadGatePage();
      },
      error: (e: Error) => {
        this.gateTabError = e?.message || this.translate.instant('operations.gate.errIssueFailed');
      },
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
    if ((this.invForm.quantityOnHand ?? 0) < 0 || (this.invForm.reorderLevel ?? 0) < 0) {
      this.inventoryTabError = this.translate.instant('operations.inventory.errNegativeQtyOrReorder');
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
    this.remindersTabError = '';
    const duplicatePending = this.reminders.some(
      r =>
        r.status === 'PENDING' &&
        r.studentId === p.studentId &&
        (r.feePaymentId ?? null) === (p.id ?? null) &&
        (r.channel || '').toUpperCase() === channel.toUpperCase()
    );
    if (duplicatePending) {
      this.remindersTabError = this.translate.instant('operations.reminders.errDuplicatePendingReminder');
      return;
    }
    this.operations
      .enqueueFeeReminder({
        studentId: p.studentId,
        feePaymentId: p.id,
        dueDate: p.dueDate,
        channel,
      })
      .subscribe({
        next: () => this.reloadReminders(),
        error: (e: Error) => {
          this.remindersTabError = e?.message || this.translate.instant('operations.reminders.errEnqueueFailed');
        },
      });
  }

  loadPayroll(): void {
    this.operations.payrollAccrualSummary().subscribe(p => (this.payroll = p));
  }

  isGlobalScopeActive(scope: string): boolean {
    return this.globalSearchScopesSelected.has(scope);
  }

  toggleGlobalScope(scope: string): void {
    if (this.globalSearchScopesSelected.has(scope)) {
      if (this.globalSearchScopesSelected.size === 1) {
        return;
      }
      this.globalSearchScopesSelected.delete(scope);
    } else {
      this.globalSearchScopesSelected.add(scope);
    }
  }

  runGlobalSearch(): void {
    this.globalSearchError = '';
    this.globalSearchBusy = true;
    const scopes = Array.from(this.globalSearchScopesSelected);
    this.operations
      .globalSearch(this.globalSearchQuery, scopes, 8)
      .pipe(finalize(() => (this.globalSearchBusy = false)))
      .subscribe({
        next: r => {
          this.globalSearchRows = r.rows || [];
          this.applyGlobalSearchFilters();
        },
        error: (e: Error) => {
          this.globalSearchRows = [];
          this.globalSearchRowsFiltered = [];
          this.globalSearchError = e?.message || this.translate.instant('operations.search.errSearchFailed');
        },
      });
  }

  openSearchResult(row: OperationsSearchResultRow): void {
    if (row.routeHint) {
      this.router.navigateByUrl(row.routeHint);
      return;
    }
    this.selectTab(row.scope as OperationsTab);
  }

  applyGlobalSearchFilters(): void {
    this.globalSearchRowsFiltered = this.globalSearchRows.filter(row => {
      if (this.globalSearchStatusFilter === 'ALL') return true;
      return (row.status || '').toUpperCase() === this.globalSearchStatusFilter;
    });
  }

  saveSearchScopes(): void {
    localStorage.setItem(this.searchScopeStorageKey, JSON.stringify(Array.from(this.globalSearchScopesSelected)));
  }

  restoreSearchScopes(): void {
    const raw = localStorage.getItem(this.searchScopeStorageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        const valid = parsed.filter((x: unknown) => typeof x === 'string' && this.globalSearchScopesAll.includes(x as any));
        if (valid.length) {
          this.globalSearchScopesSelected = new Set(valid);
        }
      }
    } catch {
      // ignore malformed storage payload
    }
  }

  selectAllSearchScopes(): void {
    this.globalSearchScopesSelected = new Set(this.globalSearchScopesAll);
    this.runGlobalSearch();
  }

  loadGlobalSearchActivity(): void {
    this.globalSearchActivityError = '';
    this.globalSearchActivityBusy = true;
    this.operations
      .globalSearchActivity(this.globalSearchActivityPageIndex, this.globalSearchActivityPageSize)
      .pipe(finalize(() => (this.globalSearchActivityBusy = false)))
      .subscribe({
        next: p => {
          this.globalSearchActivity = p.content || [];
          this.globalSearchActivityTotal = p.totalElements;
          this.globalSearchActivityPageIndex = p.page;
        },
        error: (e: Error) => {
          this.globalSearchActivity = [];
          this.globalSearchActivityTotal = 0;
          this.globalSearchActivityError = e?.message || this.translate.instant('operations.search.errActivityLoadFailed');
        },
      });
  }

  onGlobalSearchActivityPageIndex(i: number): void {
    this.globalSearchActivityPageIndex = i;
    this.loadGlobalSearchActivity();
  }

  onGlobalSearchActivityPageSize(s: number): void {
    this.globalSearchActivityPageSize = s;
    this.globalSearchActivityPageIndex = 0;
    this.loadGlobalSearchActivity();
  }

  private normalizeTenDigitPhone(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '').slice(0, 10);
  }

  private isValidTenDigitPhone(value: string | null | undefined): boolean {
    return isValidIndiaMobileTen(value);
  }
}
