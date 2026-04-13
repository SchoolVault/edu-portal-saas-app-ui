import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LeaveBalanceSummary, LeaveDayUnit, LeaveRequestRow, LeaveService } from '../../core/services/leave.service';
import {
  LEAVE_OTHER_REASON_MIN_LEN,
  leaveStatusI18nKey,
  leaveTypeI18nKey,
  translateLeaveLookup,
} from '../../core/leave/leave-api.contract';
import { resolveLeaveSubmitError } from '../../core/leave/leave-api.error';
import { AuthService } from '../../core/services/auth.service';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent, TranslateModule],
  template: `
    <div class="animate-in leave-page">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1">
        <h2 style="font-size: 24px; font-weight: 800;">{{ 'leave.pageTitle' | translate }}</h2>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refresh()"><i class="bi bi-arrow-clockwise"></i> {{ 'leave.refresh' | translate }}</button>
      </div>
      <p class="text-muted" style="font-size: 13px;">{{ 'leave.lead' | translate }}</p>

      <div class="erp-card mt-3 mb-4" *ngIf="balance as b">
        <h3 style="font-size: 15px; font-weight: 700;">{{ 'leave.balanceTitle' | translate }}</h3>
        <div class="row g-3 mt-1">
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">{{ 'leave.annual' | translate }}</div>
              <div class="balance-val">{{ b.annualEntitled - b.annualUsed }} <span class="text-muted small">/ {{ b.annualEntitled }} {{ 'leave.leftSuffix' | translate }}</span></div>
              <div class="small text-muted">{{ 'leave.usedLine' | translate: { n: b.annualUsed } }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">{{ 'leave.sick' | translate }}</div>
              <div class="balance-val">{{ b.sickEntitled - b.sickUsed }} <span class="text-muted small">/ {{ b.sickEntitled }}</span></div>
              <div class="small text-muted">{{ 'leave.usedLine' | translate: { n: b.sickUsed } }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">{{ 'leave.casual' | translate }}</div>
              <div class="balance-val">{{ b.casualEntitled - b.casualUsed }} <span class="text-muted small">/ {{ b.casualEntitled }}</span></div>
              <div class="small text-muted">{{ 'leave.usedLine' | translate: { n: b.casualUsed } }}</div>
            </div>
          </div>
        </div>
        <p class="small text-muted mb-0 mt-2">{{ 'leave.balanceFootnote' | translate }}</p>
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
            <app-erp-date-picker [(ngModel)]="form.startDate" [placeholder]="'leave.placeholderFrom' | translate" />
          </div>
          <div class="col-md-4">
            <label class="erp-label">{{ 'leave.labelTo' | translate }}</label>
            <app-erp-date-picker [(ngModel)]="form.endDate" [placeholder]="'leave.placeholderTo' | translate" />
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
      <p *ngIf="!mine.length" class="text-muted small">{{ 'leave.emptyMine' | translate }}</p>
      <div *ngFor="let r of mine" class="erp-card mb-2">
        <div class="d-flex justify-content-between flex-wrap gap-2">
          <span class="fw-semibold">{{ leaveTypeLabel(r.leaveType) }}</span>
          <span class="badge-erp" [class.badge-info]="r.status === 'PENDING'" [class.badge-success]="r.status === 'APPROVED'" [class.badge-danger]="r.status === 'REJECTED'" [class.badge-neutral]="r.status === 'CANCELLED'">{{ leaveStatusLabel(r.status) }}</span>
        </div>
        <div class="small text-muted">{{ r.startDate }} → {{ r.endDate }} · {{ dayUnitLabel(r.dayUnit) }}</div>
        <div *ngIf="r.reason" class="small mt-1">{{ r.reason }}</div>
        <div *ngIf="r.approverRemarks" class="small text-muted mt-1">{{ 'leave.approverLabel' | translate }}: {{ r.approverRemarks }}</div>
      </div>

      <ng-container *ngIf="canSeeDirectory">
        <h3 class="mt-4" style="font-size: 16px; font-weight: 700;">{{ 'leave.teamTitle' | translate }}</h3>
        <p *ngIf="!all.length" class="text-muted small">{{ 'leave.emptyAll' | translate }}</p>
        <div *ngFor="let r of all" class="erp-card mb-2">
          <div class="d-flex justify-content-between flex-wrap gap-2">
            <div>
              <span class="fw-semibold">{{ leaveTypeLabel(r.leaveType) }}</span>
              <span class="text-muted small ms-2">{{ 'leave.applicantMeta' | translate: { id: r.applicantUserId, role: r.applicantRole } }}</span>
            </div>
            <span class="badge-erp" [class.badge-info]="r.status === 'PENDING'" [class.badge-success]="r.status === 'APPROVED'" [class.badge-danger]="r.status === 'REJECTED'" [class.badge-neutral]="r.status === 'CANCELLED'">{{ leaveStatusLabel(r.status) }}</span>
          </div>
          <div class="small text-muted">{{ r.startDate }} → {{ r.endDate }} · {{ dayUnitLabel(r.dayUnit) }}</div>
          <div *ngIf="r.status === 'PENDING' && isApprover" class="mt-2 d-flex gap-2 flex-wrap">
            <button type="button" class="btn-primary-erp btn-sm" (click)="decide(r, true)">{{ 'leave.approve' | translate }}</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="decide(r, false)">{{ 'leave.reject' | translate }}</button>
          </div>
        </div>
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
    `
  ]
})
export class LeaveComponent implements OnInit {
  form = {
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    dayUnit: 'FULL_DAY' as LeaveDayUnit
  };
  mine: LeaveRequestRow[] = [];
  all: LeaveRequestRow[] = [];
  balance: LeaveBalanceSummary | null = null;
  submitError = '';
  readonly otherReasonMin = LEAVE_OTHER_REASON_MIN_LEN;

  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private leave: LeaveService,
    private auth: AuthService
  ) {}

  get isApprover(): boolean {
    return this.auth.getRole() === 'admin';
  }

  get canSeeDirectory(): boolean {
    const r = this.auth.getRole();
    return r === 'admin' || r === 'teacher';
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
    this.refresh();
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
    this.leave.listMine().subscribe(x => (this.mine = x || []));
    this.leave.getBalance().subscribe(b => (this.balance = b));
    if (this.canSeeDirectory) {
      this.leave.listAll().subscribe(x => (this.all = x || []));
    } else {
      this.all = [];
    }
  }

  submit(): void {
    this.submitError = '';
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
}
