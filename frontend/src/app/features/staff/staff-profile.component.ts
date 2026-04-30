import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { OperationalStaffRow } from '../../core/models/operations.models';
import { OperationsService } from '../../core/services/operations.service';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="animate-in" *ngIf="staff as s">
      <div class="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button type="button" class="btn-icon" (click)="router.navigate(['/app/directory'])"><i class="bi bi-arrow-left"></i></button>
        <div class="flex-grow-1">
          <h2 style="font-size: 24px; font-weight: 800;">Staff profile</h2>
          <p class="text-muted small mb-0">Dedicated non-teaching staff profile and lifecycle controls.</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="load()">Refresh</button>
          <button type="button" class="btn-primary-erp btn-sm" (click)="editing = !editing">{{ editing ? 'Cancel edit' : 'Edit' }}</button>
          <button
            type="button"
            class="btn-outline-erp btn-sm"
            [style.border-color]="(s.isActive !== false) ? 'var(--clr-danger)' : 'var(--clr-success)'"
            [style.color]="(s.isActive !== false) ? 'var(--clr-danger)' : 'var(--clr-success)'"
            (click)="toggleStatus()"
          >
            {{ s.isActive !== false ? 'Deactivate' : 'Activate' }}
          </button>
        </div>
      </div>

      <div class="erp-card mb-3">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="erp-label">Full name</label>
            <input class="erp-input" [(ngModel)]="draft.fullName" [readOnly]="!editing" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">Role</label>
            <input class="erp-input" [(ngModel)]="draft.staffRole" [readOnly]="!editing" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">Email</label>
            <input class="erp-input" [(ngModel)]="draft.email" [readOnly]="!editing" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">Phone</label>
            <input class="erp-input" [(ngModel)]="draft.phone" [readOnly]="!editing" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">Employee code</label>
            <input class="erp-input" [(ngModel)]="draft.employeeCode" [readOnly]="!editing" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">Status</label>
            <div>
              <span class="badge-erp" [ngClass]="s.isActive !== false ? 'badge-success' : 'badge-neutral'">
                {{ s.isActive !== false ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          <div class="col-12">
            <label class="erp-label">Notes</label>
            <textarea class="erp-input" rows="3" [(ngModel)]="draft.notes" [readOnly]="!editing"></textarea>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-3" *ngIf="editing">
          <button type="button" class="btn-primary-erp btn-sm" (click)="save()">Save changes</button>
        </div>
      </div>
    </div>
    <div class="erp-card" *ngIf="!staff && error">
      <p class="text-danger mb-2">{{ error }}</p>
      <a routerLink="/app/directory" class="btn-outline-erp btn-sm">Back to Directory</a>
    </div>
  `,
})
export class StaffProfileComponent implements OnInit {
  staff: OperationalStaffRow | null = null;
  draft: Partial<OperationalStaffRow> = {};
  editing = false;
  error = '';
  private id = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly operationsService: OperationsService,
    public readonly router: Router
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.editing = this.route.snapshot.url.some(segment => segment.path === 'edit');
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.error = '';
    this.operationsService.getStaffById(this.id).subscribe({
      next: row => {
        this.staff = row;
        this.draft = { ...row };
      },
      error: (e: Error) => {
        this.error = e?.message || 'Unable to load staff record.';
      },
    });
  }

  save(): void {
    if (!this.staff) return;
    this.draft.phone = this.normalizeTenDigitPhone(this.draft.phone);
    if (this.draft.phone && !this.isValidTenDigitPhone(this.draft.phone)) {
      this.error = 'Phone number must be exactly 10 digits.';
      return;
    }
    this.operationsService.updateStaff(this.staff.id, this.draft).subscribe({
      next: row => {
        this.staff = row;
        this.draft = { ...row };
        this.editing = false;
      },
      error: (e: Error) => {
        this.error = e?.message || 'Unable to update staff record.';
      },
    });
  }

  toggleStatus(): void {
    if (!this.staff) return;
    const nextActive = this.staff.isActive === false;
    this.operationsService.updateStaffStatus(this.staff.id, nextActive).subscribe({
      next: row => {
        this.staff = row;
        this.draft = { ...row };
      },
      error: (e: Error) => {
        this.error = e?.message || 'Unable to update staff status.';
      },
    });
  }

  private normalizeTenDigitPhone(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '').slice(0, 10);
  }

  private isValidTenDigitPhone(value: string | null | undefined): boolean {
    return /^\d{10}$/.test((value ?? '').trim());
  }
}
