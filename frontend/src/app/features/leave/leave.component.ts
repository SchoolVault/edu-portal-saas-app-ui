import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveBalanceSummary, LeaveDayUnit, LeaveRequestRow, LeaveService } from '../../core/services/leave.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-in leave-page">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-1">
        <h2 style="font-size: 24px; font-weight: 800;">Leave</h2>
        <button type="button" class="btn-outline-erp btn-sm" (click)="refresh()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
      </div>
      <p class="text-muted" style="font-size: 13px;">
        Request time off with full or half-day options. Track balances and history. Admins approve; teachers can review all requests.
      </p>

      <div class="erp-card mt-3 mb-4" *ngIf="balance as b">
        <h3 style="font-size: 15px; font-weight: 700;">Your balance (policy snapshot)</h3>
        <div class="row g-3 mt-1">
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">Annual</div>
              <div class="balance-val">{{ b.annualEntitled - b.annualUsed }} <span class="text-muted small">/ {{ b.annualEntitled }} left</span></div>
              <div class="small text-muted">Used {{ b.annualUsed }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">Sick</div>
              <div class="balance-val">{{ b.sickEntitled - b.sickUsed }} <span class="text-muted small">/ {{ b.sickEntitled }}</span></div>
              <div class="small text-muted">Used {{ b.sickUsed }}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="balance-pill">
              <div class="small text-muted">Casual</div>
              <div class="balance-val">{{ b.casualEntitled - b.casualUsed }} <span class="text-muted small">/ {{ b.casualEntitled }}</span></div>
              <div class="small text-muted">Used {{ b.casualUsed }}</div>
            </div>
          </div>
        </div>
        <p class="small text-muted mb-0 mt-2">Balances follow leave type names (e.g. &quot;Sick leave&quot; counts toward sick). HR policies can refine this later.</p>
      </div>

      <div class="erp-card mt-3 mb-4">
        <h3 style="font-size: 15px; font-weight: 700;">New request</h3>
        <div class="row g-2 mt-1">
          <div class="col-md-4">
            <label class="erp-label">Type</label>
            <select class="erp-select" [(ngModel)]="form.leaveType">
              <option value="">Select type</option>
              <option value="Annual">Annual</option>
              <option value="Sick">Sick</option>
              <option value="Casual">Casual</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="erp-label">Day coverage</label>
            <select class="erp-select" [(ngModel)]="form.dayUnit">
              <option value="FULL_DAY">Full day(s)</option>
              <option value="FIRST_HALF">Half day — morning</option>
              <option value="SECOND_HALF">Half day — afternoon</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="erp-label">From</label>
            <input type="date" class="erp-input" [(ngModel)]="form.startDate" />
          </div>
          <div class="col-md-4">
            <label class="erp-label">To</label>
            <input type="date" class="erp-input" [(ngModel)]="form.endDate" />
          </div>
          <div class="col-12">
            <label class="erp-label">Reason</label>
            <textarea class="erp-input erp-textarea" rows="2" [(ngModel)]="form.reason"></textarea>
          </div>
          <div class="col-12">
            <button class="btn-primary-erp" type="button" (click)="submit()" [disabled]="!canSubmit">Submit request</button>
          </div>
        </div>
      </div>

      <h3 style="font-size: 16px; font-weight: 700;">My requests</h3>
      <p *ngIf="!mine.length" class="text-muted small">No requests yet.</p>
      <div *ngFor="let r of mine" class="erp-card mb-2">
        <div class="d-flex justify-content-between flex-wrap gap-2">
          <span class="fw-semibold">{{ r.leaveType }}</span>
          <span class="badge-erp" [class.badge-info]="r.status === 'PENDING'" [class.badge-success]="r.status === 'APPROVED'" [class.badge-danger]="r.status === 'REJECTED'">{{ r.status }}</span>
        </div>
        <div class="small text-muted">{{ r.startDate }} → {{ r.endDate }} · {{ dayUnitLabel(r.dayUnit) }}</div>
        <div *ngIf="r.reason" class="small mt-1">{{ r.reason }}</div>
        <div *ngIf="r.approverRemarks" class="small text-muted mt-1">Approver: {{ r.approverRemarks }}</div>
      </div>

      <ng-container *ngIf="canSeeDirectory">
        <h3 class="mt-4" style="font-size: 16px; font-weight: 700;">All requests (team)</h3>
        <p *ngIf="!all.length" class="text-muted small">No requests in the system.</p>
        <div *ngFor="let r of all" class="erp-card mb-2">
          <div class="d-flex justify-content-between flex-wrap gap-2">
            <div>
              <span class="fw-semibold">{{ r.leaveType }}</span>
              <span class="text-muted small ms-2">User {{ r.applicantUserId }} ({{ r.applicantRole }})</span>
            </div>
            <span class="badge-erp badge-info">{{ r.status }}</span>
          </div>
          <div class="small text-muted">{{ r.startDate }} → {{ r.endDate }} · {{ dayUnitLabel(r.dayUnit) }}</div>
          <div *ngIf="r.status === 'PENDING' && isApprover" class="mt-2 d-flex gap-2 flex-wrap">
            <button type="button" class="btn-primary-erp btn-sm" (click)="decide(r, true)">Approve</button>
            <button type="button" class="btn-outline-erp btn-sm" (click)="decide(r, false)">Reject</button>
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
    return !!(this.form.leaveType && this.form.startDate && this.form.endDate);
  }

  ngOnInit(): void {
    this.refresh();
  }

  dayUnitLabel(u?: LeaveDayUnit): string {
    if (u === 'FIRST_HALF') return 'Half · morning';
    if (u === 'SECOND_HALF') return 'Half · afternoon';
    return 'Full day';
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
    this.leave
      .submit({
        leaveType: this.form.leaveType,
        startDate: this.form.startDate,
        endDate: this.form.endDate,
        reason: this.form.reason,
        dayUnit: this.form.dayUnit
      })
      .subscribe(() => {
        this.form = { leaveType: '', startDate: '', endDate: '', reason: '', dayUnit: 'FULL_DAY' };
        this.refresh();
      });
  }

  decide(r: LeaveRequestRow, approve: boolean): void {
    this.leave.decide(r.id, approve).subscribe(() => this.refresh());
  }
}
