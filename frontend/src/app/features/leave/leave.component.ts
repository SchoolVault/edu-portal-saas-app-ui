import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import {
  BulkLeaveAllocationRequest,
  LeaveBalanceSummary,
  LeaveDayUnit,
  LeaveLedgerEntry,
  LeaveRequestRow,
  LeaveService
} from '../../core/services/leave.service';
import {
  LEAVE_OTHER_REASON_MIN_LEN,
  leaveStatusI18nKey,
  leaveTypeI18nKey,
  translateLeaveLookup,
} from '../../core/leave/leave-api.contract';
import { resolveLeaveSubmitError } from '../../core/leave/leave-api.error';
import { readLeaveEntitlementPolicy, writeLeaveEntitlementPolicy, type LeaveEntitlementPolicy } from '../../core/leave/leave-policy.storage';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ErpPaginationComponent } from '../../shared/erp-pagination/erp-pagination.component';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { sliceToPage } from '../../core/utils/paginate';
import { DEFAULT_ERP_PAGE_SIZE } from '../../core/constants/pagination.constants';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ErpDatePickerComponent,
    ErpPaginationComponent,
    TranslateModule,
    ErpI18nPhDirective,
    ErpI18nTextDirective,
  ],
  template: `
    <div class="animate-in leave-page">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1">
        <h2 style="font-size: 24px; font-weight: 800;">{{ 'leave.pageTitle' | translate }}</h2>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refresh()"><i class="bi bi-arrow-clockwise"></i> {{ 'leave.refresh' | translate }}</button>
      </div>
      <p class="text-muted" style="font-size: 13px;">{{ 'leave.lead' | translate }}</p>

      <div class="erp-card mt-3 mb-4" *ngIf="isApprover">
        <h3 style="font-size: 15px; font-weight: 700;">{{ 'leave.policyCardTitle' | translate }}</h3>
        <p class="small text-muted mb-2">{{ 'leave.policyCardHint' | translate }}</p>
        <div class="row g-2 align-items-end">
          <div class="col-6 col-md-3">
            <label class="erp-label">{{ 'leave.policyAnnual' | translate }}</label>
            <input type="number" min="0" class="erp-input" [(ngModel)]="policyDraft.annualEntitled" />
          </div>
          <div class="col-6 col-md-3">
            <label class="erp-label">{{ 'leave.policySick' | translate }}</label>
            <input type="number" min="0" class="erp-input" [(ngModel)]="policyDraft.sickEntitled" />
          </div>
          <div class="col-6 col-md-3">
            <label class="erp-label">{{ 'leave.policyCasual' | translate }}</label>
            <input type="number" min="0" class="erp-input" [(ngModel)]="policyDraft.casualEntitled" />
          </div>
          <div class="col-12 col-md-3">
            <label class="erp-label">{{ 'leave.policyYearLabel' | translate }}</label>
            <input type="text" class="erp-input" [(ngModel)]="policyDraft.policyYearLabel" />
          </div>
        </div>
        <p *ngIf="policySaveError" class="text-danger small mb-0 mt-2">{{ policySaveError }}</p>
        <button type="button" class="btn-primary-erp mt-3" (click)="saveLeavePolicy()">{{ 'leave.policySave' | translate }}</button>
      </div>

      <div class="erp-card mt-3 mb-4" *ngIf="isApprover">
        <h3 style="font-size: 15px; font-weight: 700;">{{ 'leave.bulkAllocationTitle' | translate }}</h3>
        <p class="small text-muted mb-2">{{ 'leave.bulkAllocationHint' | translate }}</p>
        <div class="row g-2 align-items-end">
          <div class="col-6 col-md-3">
            <label class="erp-label">{{ 'leave.policyYearLabel' | translate }}</label>
            <input type="text" class="erp-input" [(ngModel)]="allocationDraft.policyYearLabel" />
          </div>
          <div class="col-6 col-md-3">
            <label class="erp-label">{{ 'leave.policyAnnual' | translate }}</label>
            <input type="number" min="0" class="erp-input" [(ngModel)]="allocationDraft.annualOpening" />
          </div>
          <div class="col-6 col-md-3">
            <label class="erp-label">{{ 'leave.policySick' | translate }}</label>
            <input type="number" min="0" class="erp-input" [(ngModel)]="allocationDraft.sickOpening" />
          </div>
          <div class="col-6 col-md-3">
            <label class="erp-label">{{ 'leave.policyCasual' | translate }}</label>
            <input type="number" min="0" class="erp-input" [(ngModel)]="allocationDraft.casualOpening" />
          </div>
          <div class="col-12 col-md-6">
            <label class="erp-label">{{ 'leave.bulkRoleFilter' | translate }}</label>
            <select class="erp-select" [(ngModel)]="allocationDraft.roleFilters">
              <option [ngValue]="['TEACHER']">{{ 'leave.bulkRoleTeachers' | translate }}</option>
              <option [ngValue]="['TEACHER','SCHOOL_STAFF','LIBRARY_STAFF']">{{ 'leave.bulkRoleAllStaff' | translate }}</option>
            </select>
          </div>
          <div class="col-12 col-md-6">
            <label class="erp-label">{{ 'leave.labelReason' | translate }}</label>
            <input type="text" class="erp-input" [(ngModel)]="allocationDraft.notes" />
          </div>
        </div>
        <div class="form-check mt-2">
          <input class="form-check-input" type="checkbox" id="leaveOverwriteYear" [(ngModel)]="allocationDraft.overwriteExistingYear" />
          <label class="form-check-label small" for="leaveOverwriteYear">{{ 'leave.bulkOverwrite' | translate }}</label>
        </div>
        <p *ngIf="allocationSaveError" class="text-danger small mb-0 mt-2">{{ allocationSaveError }}</p>
        <p *ngIf="allocationSaveInfo" class="text-success small mb-0 mt-2">{{ allocationSaveInfo }}</p>
        <button type="button" class="btn-primary-erp mt-3" (click)="allocateEntitlements()">{{ 'leave.bulkAllocateAction' | translate }}</button>
      </div>

      <div class="erp-card mt-3 mb-4" *ngIf="balance as b">
        <h3 style="font-size: 15px; font-weight: 700;">{{ 'leave.balanceTitle' | translate }}</h3>
        <p *ngIf="policyPeriodLine" class="small text-muted mb-2">{{ policyPeriodLine }}</p>
        <div class="row g-3 mt-1">
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">{{ 'leave.annual' | translate }}</div>
              <div class="balance-val">{{ b.annualRemaining ?? (b.annualEntitled - b.annualUsed) }} <span class="text-muted small">/ {{ b.annualEntitled }} {{ 'leave.leftSuffix' | translate }}</span></div>
              <div class="small text-muted">{{ 'leave.usedLine' | translate: { n: b.annualUsed } }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">{{ 'leave.sick' | translate }}</div>
              <div class="balance-val">{{ b.sickRemaining ?? (b.sickEntitled - b.sickUsed) }} <span class="text-muted small">/ {{ b.sickEntitled }}</span></div>
              <div class="small text-muted">{{ 'leave.usedLine' | translate: { n: b.sickUsed } }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">{{ 'leave.casual' | translate }}</div>
              <div class="balance-val">{{ b.casualRemaining ?? (b.casualEntitled - b.casualUsed) }} <span class="text-muted small">/ {{ b.casualEntitled }}</span></div>
              <div class="small text-muted">{{ 'leave.usedLine' | translate: { n: b.casualUsed } }}</div>
            </div>
          </div>
        </div>
        <p class="small text-muted mb-0 mt-2">{{ 'leave.balanceFootnote' | translate }}</p>
      </div>

      <div class="erp-card mt-3 mb-4">
        <h3 style="font-size: 15px; font-weight: 700;">{{ 'leave.ledgerTitle' | translate }}</h3>
        <p class="small text-muted mb-2">{{ 'leave.ledgerHint' | translate }}</p>
        <p *ngIf="!ledgerRows.length" class="text-muted small mb-0">{{ 'leave.ledgerEmpty' | translate }}</p>
        <div class="leave-scroll-region leave-scroll-region--ledger">
          <div *ngFor="let e of ledgerRows" class="ledger-row">
            <div class="d-flex justify-content-between align-items-center gap-2">
              <div>
                <div class="fw-semibold">{{ e.leaveType }} · {{ e.entryType }}</div>
                <div class="small text-muted">{{ e.policyYearLabel || 'CURRENT' }} · {{ e.effectiveDate || e.createdAt }}</div>
              </div>
              <span class="badge-erp" [class.badge-success]="(e.signedUnits || 0) > 0" [class.badge-danger]="(e.signedUnits || 0) < 0">
                {{ (e.signedUnits || 0) > 0 ? '+' : '' }}{{ e.signedUnits }}
              </span>
            </div>
            <div *ngIf="e.notes" class="small text-muted mt-1">{{ e.notes }}</div>
          </div>
        </div>
      </div>

      <div class="erp-card mt-3 mb-4">
        <h3 style="font-size: 15px; font-weight: 700;">{{ 'leave.newRequest' | translate }}</h3>
        <div class="row g-2 mt-1">
          <div class="col-md-4">
            <label class="erp-label">{{ 'leave.labelType' | translate }}</label>
            <select class="erp-select" [(ngModel)]="form.leaveType" (ngModelChange)="submitError = ''">
              <option value="">{{ 'leave.selectType' | translate }}</option>
              <option value="ANNUAL">{{ 'leave.type.ANNUAL' | translate }}</option>
              <option value="SICK">{{ 'leave.type.SICK' | translate }}</option>
              <option value="CASUAL">{{ 'leave.type.CASUAL' | translate }}</option>
              <option value="EMERGENCY">{{ 'leave.type.EMERGENCY' | translate }}</option>
              <option value="OTHER">{{ 'leave.type.OTHER' | translate }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="erp-label">{{ 'leave.labelDayCoverage' | translate }}</label>
            <select class="erp-select" [(ngModel)]="form.dayUnit">
              <option value="FULL_DAY">{{ 'leave.dayUnit.FULL_DAY' | translate }}</option>
              <option value="FIRST_HALF">{{ 'leave.dayUnit.FIRST_HALF' | translate }}</option>
              <option value="SECOND_HALF">{{ 'leave.dayUnit.SECOND_HALF' | translate }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="erp-label">{{ 'leave.labelFrom' | translate }}</label>
            <app-erp-date-picker [(ngModel)]="form.startDate" placeholderI18nKey="leave.placeholderFrom" />
          </div>
          <div class="col-md-4">
            <label class="erp-label">{{ 'leave.labelTo' | translate }}</label>
            <app-erp-date-picker [(ngModel)]="form.endDate" placeholderI18nKey="leave.placeholderTo" />
          </div>
          <div class="col-12">
            <label class="erp-label">{{ 'leave.labelReason' | translate }}</label>
            <textarea class="erp-input erp-textarea" rows="3" [(ngModel)]="form.reason" (ngModelChange)="submitError = ''"></textarea>
            <p *ngIf="form.leaveType === 'OTHER'" class="small text-muted mb-0 mt-1">{{ 'leave.helpOtherReason' | translate: { min: otherReasonMin } }}</p>
          </div>
          <div class="col-12" *ngIf="submitError">
            <p class="text-danger small mb-0">{{ submitError }}</p>
          </div>
          <div class="col-12">
            <button class="btn-primary-erp" type="button" (click)="submit()" [disabled]="!canSubmit">{{ 'leave.submitRequest' | translate }}</button>
          </div>
        </div>
      </div>

      <h3 style="font-size: 16px; font-weight: 700;">{{ 'leave.myRequests' | translate }}</h3>
      <div class="row g-2 align-items-end mb-2" *ngIf="mineFilteredTotal > 0 || mineSearch">
        <div class="col-md-6">
          <label class="erp-label small mb-1" erpI18nText="leave.searchMine"></label>
          <input type="search" class="erp-input" erpI18nPh="leave.searchMinePh" [(ngModel)]="mineSearch" (ngModelChange)="onMineSearchChange()" />
        </div>
      </div>
      <p *ngIf="mineFilteredTotal === 0 && !mineSearch" class="text-muted small">{{ 'leave.emptyMine' | translate }}</p>
      <p *ngIf="mineFilteredTotal === 0 && mineSearch" class="text-muted small">{{ 'leave.noMatches' | translate }}</p>
      <div class="leave-scroll-region leave-scroll-region--mine">
        <div *ngFor="let r of pagedMine" class="erp-card mb-2">
          <div class="d-flex justify-content-between flex-wrap gap-2">
            <span class="fw-semibold">{{ leaveTypeLabel(r.leaveType) }}</span>
            <span class="badge-erp" [class.badge-info]="r.status === 'PENDING'" [class.badge-success]="r.status === 'APPROVED'" [class.badge-danger]="r.status === 'REJECTED'" [class.badge-neutral]="r.status === 'CANCELLED'">{{ leaveStatusLabel(r.status) }}</span>
          </div>
          <div class="small text-muted">{{ r.startDate }} → {{ r.endDate }} · {{ dayUnitLabel(r.dayUnit) }}</div>
          <div class="small text-muted" *ngIf="r.approvalStep && r.approvalStepTotal">
            {{ 'leave.stepProgress' | translate:{ step: r.approvalStep, total: r.approvalStepTotal } }}
            <span *ngIf="r.approvalSlaDueAt"> · {{ 'leave.slaDue' | translate:{ dt: (r.approvalSlaDueAt | date:'medium') } }}</span>
          </div>
          <div *ngIf="r.reason" class="small mt-1">{{ r.reason }}</div>
          <div *ngIf="r.approverRemarks" class="small text-muted mt-1">{{ 'leave.approverLabel' | translate }}: {{ r.approverRemarks }}</div>
          <div *ngIf="r.status === 'PENDING'" class="mt-2">
            <button type="button" class="btn-outline-erp btn-sm" (click)="cancelMine(r)">{{ 'leave.cancelRequest' | translate }}</button>
          </div>
        </div>
      </div>
      <app-erp-pagination
        *ngIf="mineFilteredTotal > 0"
        class="d-block mt-2"
        [totalElements]="mineFilteredTotal"
        [pageIndex]="minePageIndex"
        [pageSize]="minePageSize"
        (pageIndexChange)="onMinePageIndex($event)"
        (pageSizeChange)="onMinePageSize($event)"
      />

      <ng-container *ngIf="canSeeDirectory">
        <h3 class="mt-4" style="font-size: 16px; font-weight: 700;">{{ 'leave.teamTitle' | translate }}</h3>
        <div class="row g-2 align-items-end mb-2" *ngIf="allFilteredTotal > 0 || allSearch">
          <div class="col-md-6">
            <label class="erp-label small mb-1" erpI18nText="leave.searchTeam"></label>
            <input type="search" class="erp-input" erpI18nPh="leave.searchTeamPh" [(ngModel)]="allSearch" (ngModelChange)="onAllSearchChange()" />
          </div>
        </div>
        <p *ngIf="allFilteredTotal === 0 && !allSearch" class="text-muted small">{{ 'leave.emptyAll' | translate }}</p>
        <p *ngIf="allFilteredTotal === 0 && allSearch" class="text-muted small">{{ 'leave.noMatches' | translate }}</p>
        <div class="leave-scroll-region leave-scroll-region--team">
          <div *ngFor="let r of pagedAll" class="erp-card mb-2">
            <div class="d-flex justify-content-between flex-wrap gap-2">
              <div>
                <span class="fw-semibold">{{ leaveTypeLabel(r.leaveType) }}</span>
                <span class="text-muted small ms-2">{{ applicantLine(r) }}</span>
              </div>
              <span class="badge-erp" [class.badge-info]="r.status === 'PENDING'" [class.badge-success]="r.status === 'APPROVED'" [class.badge-danger]="r.status === 'REJECTED'" [class.badge-neutral]="r.status === 'CANCELLED'">{{ leaveStatusLabel(r.status) }}</span>
            </div>
            <div class="small text-muted">{{ r.startDate }} → {{ r.endDate }} · {{ dayUnitLabel(r.dayUnit) }}</div>
            <div class="small text-muted" *ngIf="r.approvalStep && r.approvalStepTotal">
              {{ 'leave.stepProgress' | translate:{ step: r.approvalStep, total: r.approvalStepTotal } }}
              <span *ngIf="r.approvalEscalationCount && r.approvalEscalationCount > 0"> · {{ 'leave.escalationCount' | translate:{ n: r.approvalEscalationCount } }}</span>
            </div>
            <div *ngIf="r.status === 'PENDING' && isApprover" class="mt-2 d-flex gap-2 flex-wrap">
              <button type="button" class="btn-primary-erp btn-sm" (click)="decide(r, true)">{{ approveLabel(r) }}</button>
              <button type="button" class="btn-outline-erp btn-sm" (click)="decide(r, false)">{{ 'leave.reject' | translate }}</button>
            </div>
          </div>
        </div>
        <app-erp-pagination
          *ngIf="allFilteredTotal > 0"
          class="d-block mt-2"
          [totalElements]="allFilteredTotal"
          [pageIndex]="allPageIndex"
          [pageSize]="allPageSize"
          (pageIndexChange)="onAllPageIndex($event)"
          (pageSizeChange)="onAllPageSize($event)"
        />
      </ng-container>
    </div>
  `,
  styles: [
    `
      .leave-page { max-width: 920px; margin: 0 auto; }
      .balance-pill {
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-lg);
        padding: 12px 14px;
        background: var(--clr-surface-muted);
      }
      .balance-val { font-size: 20px; font-weight: 800; color: var(--clr-text); }
      .ledger-row {
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-md);
        padding: 10px 12px;
        background: var(--clr-surface-muted);
        margin-bottom: 8px;
      }
      .leave-scroll-region {
        overflow-y: auto;
        padding-right: 2px;
      }
      .leave-scroll-region--mine { max-height: 360px; }
      .leave-scroll-region--team { max-height: 420px; }
      .leave-scroll-region--ledger { max-height: 300px; }
    `
  ]
})
export class LeaveComponent implements OnInit {
  readonly useServerPaging = !runtimeConfig.useMocks;

  form = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    dayUnit: 'FULL_DAY' as LeaveDayUnit
  };
  mine: LeaveRequestRow[] = [];
  all: LeaveRequestRow[] = [];
  mineSearch = '';
  allSearch = '';
  minePageIndex = 0;
  minePageSize = DEFAULT_ERP_PAGE_SIZE;
  allPageIndex = 0;
  allPageSize = DEFAULT_ERP_PAGE_SIZE;
  pagedMine: LeaveRequestRow[] = [];
  pagedAll: LeaveRequestRow[] = [];
  mineFilteredTotal = 0;
  allFilteredTotal = 0;
  balance: LeaveBalanceSummary | null = null;
  policyDraft: LeaveEntitlementPolicy = readLeaveEntitlementPolicy();
  policySaveError = '';
  allocationSaveError = '';
  allocationSaveInfo = '';
  submitError = '';
  ledgerRows: LeaveLedgerEntry[] = [];
  allocationDraft: BulkLeaveAllocationRequest = {
    roleFilters: ['TEACHER'],
    overwriteExistingYear: false,
    notes: 'Academic year opening allocation'
  };
  readonly otherReasonMin = LEAVE_OTHER_REASON_MIN_LEN;

  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uiAccess = inject(UiAccessService);
  private readonly mineSearch$ = new Subject<void>();
  private readonly allSearch$ = new Subject<void>();
  private readonly subs = new Subscription();
  private mineReqSeq = 0;
  private allReqSeq = 0;

  constructor(
    private leave: LeaveService,
    private auth: AuthService
  ) {}

  get isApprover(): boolean {
    return this.uiAccess.hasLeaveApprovalAccess();
  }

  /** Shown under balance title when a policy year label is configured (mock or API). */
  get policyPeriodLine(): string {
    const y = this.policyDraft?.policyYearLabel?.trim();
    if (!y) {
      return '';
    }
    return this.translate.instant('leave.policyPeriodLine', { y });
  }

  /** Team queue is for school admins only; teachers use “My requests”. */
  get canSeeDirectory(): boolean {
    return this.uiAccess.hasLeaveApprovalAccess();
  }

  applicantLine(r: LeaveRequestRow): string {
    const name = (r.applicantDisplayName || '').trim();
    if (name) {
      return this.translate.instant('leave.applicantMetaName', { name, role: r.applicantRole });
    }
    return this.translate.instant('leave.applicantMeta', { id: r.applicantUserId, role: r.applicantRole });
  }

  get canSubmit(): boolean {
    if (!this.form.leaveType || !this.form.startDate || !this.form.endDate) {
      return false;
    }
    if (this.form.leaveType === 'OTHER') {
      return this.form.reason.trim().length >= LEAVE_OTHER_REASON_MIN_LEN;
    }
    return true;
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.subs.add(
      this.mineSearch$.pipe(debounceTime(300)).subscribe(() => {
        if (!this.useServerPaging) return;
        this.minePageIndex = 0;
        this.fetchMinePage();
      })
    );
    this.subs.add(
      this.allSearch$.pipe(debounceTime(300)).subscribe(() => {
        if (!this.useServerPaging) return;
        this.allPageIndex = 0;
        this.fetchAllPage();
      })
    );
    this.destroyRef.onDestroy(() => this.subs.unsubscribe());
    this.refresh();
  }

  saveLeavePolicy(): void {
    this.policySaveError = '';
    const payload: LeaveEntitlementPolicy = {
      annualEntitled: Math.max(0, Math.floor(Number(this.policyDraft.annualEntitled) || 0)),
      sickEntitled: Math.max(0, Math.floor(Number(this.policyDraft.sickEntitled) || 0)),
      casualEntitled: Math.max(0, Math.floor(Number(this.policyDraft.casualEntitled) || 0)),
      policyYearLabel: (this.policyDraft.policyYearLabel ?? '').trim() || undefined,
    };
    if (runtimeConfig.useMocks) {
      writeLeaveEntitlementPolicy(payload);
      this.policyDraft = { ...readLeaveEntitlementPolicy() };
      this.refresh();
      return;
    }
    this.leave.updateEntitlementPolicy(payload).subscribe({
      next: () => this.refresh(),
      error: (e: unknown) => {
        this.policySaveError = resolveLeaveSubmitError(e, this.translate);
        this.cdr.markForCheck();
      },
    });
  }

  allocateEntitlements(): void {
    this.allocationSaveError = '';
    this.allocationSaveInfo = '';
    this.leave.bulkAllocateEntitlements(this.allocationDraft).subscribe({
      next: res => {
        this.allocationSaveInfo = this.translate.instant('leave.bulkAllocationSaved', {
          allocated: res.allocatedUsers,
          skipped: res.skippedUsers
        });
        this.refresh();
      },
      error: (e: unknown) => {
        this.allocationSaveError = resolveLeaveSubmitError(e, this.translate);
        this.cdr.markForCheck();
      }
    });
  }

  dayUnitLabel(u?: LeaveDayUnit): string {
    const unit = u ?? 'FULL_DAY';
    const shortKey = `leave.dayUnit._short_${unit}`;
    const short = this.translate.instant(shortKey);
    if (short !== shortKey) {
      return short;
    }
    return this.translate.instant(`leave.dayUnit.${unit}`);
  }

  leaveStatusLabel(status: string): string {
    return translateLeaveLookup(this.translate, leaveStatusI18nKey(status), status);
  }

  leaveTypeLabel(code: string): string {
    const key = leaveTypeI18nKey(code);
    if (!key) {
      return code || '';
    }
    return translateLeaveLookup(this.translate, key, code);
  }

  refresh(): void {
    this.leave.getEntitlementPolicy().subscribe(p => {
      this.policyDraft = {
        annualEntitled: p.annualEntitled,
        sickEntitled: p.sickEntitled,
        casualEntitled: p.casualEntitled,
        policyYearLabel: p.policyYearLabel,
      };
      this.cdr.markForCheck();
    });
    this.leave.getBalance().subscribe(b => {
      this.balance = b;
      this.cdr.markForCheck();
    });
    this.leave.listMyLedger().subscribe(rows => {
      this.ledgerRows = rows || [];
      this.cdr.markForCheck();
    });
    if (this.useServerPaging) {
      this.minePageIndex = 0;
      this.fetchMinePage();
      if (this.canSeeDirectory) {
        this.allPageIndex = 0;
        this.fetchAllPage();
      } else {
        this.pagedAll = [];
        this.allFilteredTotal = 0;
      }
      return;
    }
    this.leave.listMine().subscribe(x => {
      this.mine = x || [];
      this.minePageIndex = 0;
      this.applyMinePaging();
    });
    if (this.canSeeDirectory) {
      this.leave.listAll().subscribe(x => {
        this.all = x || [];
        this.allPageIndex = 0;
        this.applyAllPaging();
      });
    } else {
      this.all = [];
      this.pagedAll = [];
      this.allFilteredTotal = 0;
    }
  }

  private fetchMinePage(): void {
    const seq = ++this.mineReqSeq;
    this.leave
      .listMinePaged({ page: this.minePageIndex, size: this.minePageSize, q: this.mineSearch.trim() || undefined })
      .subscribe(p => {
        if (seq !== this.mineReqSeq) return;
        this.pagedMine = p.content;
        this.mineFilteredTotal = p.totalElements;
        this.minePageIndex = p.page;
        this.minePageSize = p.size;
        this.cdr.markForCheck();
      });
  }

  private fetchAllPage(): void {
    const seq = ++this.allReqSeq;
    this.leave
      .listAllPaged({ page: this.allPageIndex, size: this.allPageSize, q: this.allSearch.trim() || undefined })
      .subscribe(p => {
        if (seq !== this.allReqSeq) return;
        this.pagedAll = p.content;
        this.allFilteredTotal = p.totalElements;
        this.allPageIndex = p.page;
        this.allPageSize = p.size;
        this.cdr.markForCheck();
      });
  }

  private leaveRowHaystack(r: LeaveRequestRow): string {
    return [
      r.leaveType,
      r.reason,
      r.startDate,
      r.endDate,
      r.status,
      String(r.applicantUserId),
      r.applicantRole,
      r.applicantDisplayName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private filterMine(): LeaveRequestRow[] {
    const q = this.mineSearch.trim().toLowerCase();
    if (!q) {
      return this.mine;
    }
    return this.mine.filter(r => this.leaveRowHaystack(r).includes(q));
  }

  private filterAll(): LeaveRequestRow[] {
    const q = this.allSearch.trim().toLowerCase();
    if (!q) {
      return this.all;
    }
    return this.all.filter(r => this.leaveRowHaystack(r).includes(q));
  }

  applyMinePaging(): void {
    const pg = sliceToPage(this.filterMine(), this.minePageIndex, this.minePageSize);
    this.pagedMine = pg.content;
    this.minePageIndex = pg.page;
    this.mineFilteredTotal = pg.totalElements;
  }

  applyAllPaging(): void {
    const pg = sliceToPage(this.filterAll(), this.allPageIndex, this.allPageSize);
    this.pagedAll = pg.content;
    this.allPageIndex = pg.page;
    this.allFilteredTotal = pg.totalElements;
  }

  onMineSearchChange(): void {
    if (this.useServerPaging) {
      this.mineSearch$.next();
    } else {
      this.minePageIndex = 0;
      this.applyMinePaging();
    }
  }

  onAllSearchChange(): void {
    if (this.useServerPaging) {
      this.allSearch$.next();
    } else {
      this.allPageIndex = 0;
      this.applyAllPaging();
    }
  }

  onMinePageIndex(i: number): void {
    this.minePageIndex = i;
    if (this.useServerPaging) this.fetchMinePage();
    else this.applyMinePaging();
  }

  onMinePageSize(s: number): void {
    this.minePageSize = s;
    this.minePageIndex = 0;
    if (this.useServerPaging) this.fetchMinePage();
    else this.applyMinePaging();
  }

  onAllPageIndex(i: number): void {
    this.allPageIndex = i;
    if (this.useServerPaging) this.fetchAllPage();
    else this.applyAllPaging();
  }

  onAllPageSize(s: number): void {
    this.allPageSize = s;
    this.allPageIndex = 0;
    if (this.useServerPaging) this.fetchAllPage();
    else this.applyAllPaging();
  }

  submit(): void {
    this.submitError = '';
    if (this.form.startDate && this.form.endDate) {
      const start = new Date(this.form.startDate).getTime();
      const end = new Date(this.form.endDate).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
        this.submitError = this.translate.instant('leave.errDateRange');
        this.cdr.markForCheck();
        return;
      }
    }
    this.leave
      .submit({
        leaveType: this.form.leaveType,
        startDate: this.form.startDate,
        endDate: this.form.endDate,
        reason: this.form.reason,
        dayUnit: this.form.dayUnit
      })
      .subscribe({
        next: () => {
          this.form = { leaveType: '', startDate: '', endDate: '', reason: '', dayUnit: 'FULL_DAY' };
          this.submitError = '';
          this.refresh();
        },
        error: (e: unknown) => {
          this.submitError = resolveLeaveSubmitError(e, this.translate);
          this.cdr.markForCheck();
        },
      });
  }

  decide(r: LeaveRequestRow, approve: boolean): void {
    this.leave.decide(r.id, approve).subscribe(() => this.refresh());
  }

  approveLabel(r: LeaveRequestRow): string {
    const step = Number(r.approvalStep ?? 1);
    const total = Number(r.approvalStepTotal ?? 1);
    if (total > 1 && step < total) {
      return this.translate.instant('leave.approveStep');
    }
    return this.translate.instant('leave.approveFinal');
  }

  cancelMine(r: LeaveRequestRow): void {
    this.leave.cancel(r.id).subscribe(() => this.refresh());
  }
}
