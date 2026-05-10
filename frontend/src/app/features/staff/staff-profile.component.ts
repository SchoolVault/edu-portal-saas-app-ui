import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { OperationalStaffRow } from '../../core/models/operations.models';
import { resolveStaffSaveError } from '../../core/operations/staff-api.error';
import { OperationsService } from '../../core/services/operations.service';
import { digitsOnlyIndiaMobile, isValidIndiaMobileTen } from '../../core/validation/phone.validation';
import { ErpI18nPhDirective, ErpI18nTextDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, ErpI18nTextDirective, ErpI18nPhDirective],
  template: `
    <div class="animate-in" *ngIf="isCreate || staff">
      <div class="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button type="button" class="btn-icon" (click)="navigateBackToStaffTab()"><i class="bi bi-arrow-left"></i></button>
        <div class="flex-grow-1">
          <h2 style="font-size: 24px; font-weight: 800;">{{ isCreate ? ('staff.profile.titleNew' | translate) : ('staff.profile.title' | translate) }}</h2>
          <p class="text-muted small mb-0">{{ isCreate ? ('staff.profile.leadNew' | translate) : ('staff.profile.lead' | translate) }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap" *ngIf="!isCreate && staff as st">
          <button type="button" class="btn-outline-erp btn-sm" (click)="load()">{{ 'staff.profile.refresh' | translate }}</button>
          <button type="button" class="btn-primary-erp btn-sm" (click)="editing = !editing">{{ editing ? ('staff.profile.cancelEdit' | translate) : ('staff.profile.edit' | translate) }}</button>
          <button
            type="button"
            class="btn-outline-erp btn-sm"
            [style.border-color]="(st.isActive !== false) ? 'var(--clr-danger)' : 'var(--clr-success)'"
            [style.color]="(st.isActive !== false) ? 'var(--clr-danger)' : 'var(--clr-success)'"
            (click)="toggleStatus()"
          >
            {{ st.isActive !== false ? ('staff.profile.deactivate' | translate) : ('staff.profile.activate' | translate) }}
          </button>
        </div>
      </div>

      <div *ngIf="error && (isCreate || staff)" class="alert alert-danger py-2 px-3 small mb-3 d-flex justify-content-between align-items-start gap-2" role="alert">
        <span>{{ error }}</span>
        <button type="button" class="btn-close flex-shrink-0 mt-0" [attr.aria-label]="'staff.profile.dismissAlert' | translate" (click)="clearError()"></button>
      </div>

      <div class="erp-card mb-3" [class.erp-readonly-profile]="!editing && !isCreate">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="erp-label">{{ 'staff.profile.fullName' | translate }}</label>
            <input class="erp-input" [(ngModel)]="draft.fullName" [readOnly]="!editing && !isCreate" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">{{ 'staff.profile.role' | translate }}</label>
            <input class="erp-input" [(ngModel)]="draft.staffRole" [readOnly]="!editing && !isCreate" [placeholder]="'staff.profile.rolePlaceholder' | translate" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">{{ 'staff.profile.email' | translate }}</label>
            <input class="erp-input" [(ngModel)]="draft.email" [readOnly]="!editing && !isCreate" type="text" inputmode="email" autocomplete="email" spellcheck="false" />
          </div>
          <div class="col-md-6">
            <label class="erp-label">{{ 'staff.profile.phone' | translate }}</label>
            <input class="erp-input" [(ngModel)]="draft.phone" [readOnly]="!editing && !isCreate" inputmode="numeric" maxlength="10" pattern="[6-9][0-9]{9}" />
            <p *ngIf="isCreate || editing" class="text-muted small mb-0 mt-1">{{ 'auth.phoneIndiaTenDigitHint' | translate }}</p>
          </div>
          <div class="col-md-6">
            <label class="erp-label">{{ 'staff.profile.employeeCode' | translate }}</label>
            <input class="erp-input" [(ngModel)]="draft.employeeCode" [readOnly]="!editing && !isCreate" />
          </div>
          <div class="col-md-6" *ngIf="!isCreate && staff">
            <label class="erp-label">{{ 'staff.profile.status' | translate }}</label>
            <div>
              <span class="badge-erp" [ngClass]="staff.isActive !== false ? 'badge-success' : 'badge-neutral'">
                {{ staff.isActive !== false ? ('directory.staffActive' | translate) : ('directory.staffInactive' | translate) }}
              </span>
            </div>
          </div>
          <div class="col-12 col-lg-8" *ngIf="portalStatusRowVisible">
            <label class="erp-label" [erpI18nText]="'staff.profile.portalLogin'"></label>
            <div class="d-flex flex-wrap align-items-center gap-2">
              <span *ngIf="staff?.userId" class="badge-erp badge-success" [erpI18nText]="'staff.profile.portalLinkedBadge'"></span>
              <span
                *ngIf="staff && !staff.userId && !showPortalProvisionBlock"
                class="text-muted small mb-0"
                [erpI18nText]="'staff.profile.portalNotLinkedHint'"
              ></span>
            </div>
          </div>
          <div class="col-12 border-top pt-3 mt-1" *ngIf="showPortalProvisionBlock" style="border-color: rgba(14, 30, 50, 0.08);">
            <p class="text-muted small mb-2" [erpI18nText]="'staff.profile.portalProvisionIntro'"></p>
            <label class="d-inline-flex align-items-start gap-2 mb-2">
              <input type="checkbox" class="mt-1" [(ngModel)]="createPortalDraft" name="staffCreatePortal" />
              <span class="small" [erpI18nText]="'staff.profile.createPortalCheckbox'"></span>
            </label>
            <div *ngIf="createPortalDraft" class="col-12 col-md-8 px-0">
              <label class="erp-label" [erpI18nText]="'staff.profile.portalPasswordOptional'"></label>
              <input
                type="password"
                class="erp-input"
                name="staffPortalPwd"
                [(ngModel)]="portalPasswordDraft"
                autocomplete="new-password"
                erpI18nPh="staff.profile.portalPasswordPlaceholder"
              />
              <p class="text-muted small mb-0 mt-1" [erpI18nText]="'staff.profile.portalPasswordHelp'"></p>
            </div>
          </div>
          <div class="col-12">
            <label class="erp-label">{{ 'staff.profile.notes' | translate }}</label>
            <textarea class="erp-input" rows="3" [(ngModel)]="draft.notes" [readOnly]="!editing && !isCreate"></textarea>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-3" *ngIf="editing || isCreate">
          <button type="button" class="btn-primary-erp btn-sm" (click)="save()" [disabled]="saving">
            {{ saving ? ('staff.profile.saving' | translate) : (isCreate ? ('staff.profile.create' | translate) : ('staff.profile.save' | translate)) }}
          </button>
        </div>
      </div>
    </div>
    <div class="erp-card" *ngIf="!isCreate && !staff && error">
      <p class="text-danger mb-2">{{ error }}</p>
      <a routerLink="/app/directory" [queryParams]="{ tab: 'staff' }" class="btn-outline-erp btn-sm">{{ 'staff.profile.back' | translate }}</a>
    </div>
  `,
})
export class StaffProfileComponent implements OnInit {
  staff: OperationalStaffRow | null = null;
  draft: Partial<OperationalStaffRow> = {};
  /** Mirrors student “create portal for guardian”: default on for new staff; edit without portal stays opt-in. */
  createPortalDraft = false;
  portalPasswordDraft = '';
  editing = false;
  error = '';
  saving = false;
  private id = '';
  get isCreate(): boolean {
    return this.id === 'new';
  }

  /** Show checkbox/password when creating or editing a row that still has no linked portal user. */
  get showPortalProvisionBlock(): boolean {
    return this.isCreate || (!!this.staff && this.editing && !this.staff.userId);
  }

  /** Read-only portal state; hidden while the provision checkbox block is shown to avoid duplicate messaging. */
  get portalStatusRowVisible(): boolean {
    return !this.isCreate && !!this.staff && !this.showPortalProvisionBlock;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly operationsService: OperationsService,
    private readonly translate: TranslateService,
    public readonly router: Router
  ) {}

  ngOnInit(): void {
    // `staff/new` is a static route (no `:id` param); `staff/:id` supplies `id`.
    const paramId = this.route.snapshot.paramMap.get('id');
    const staticNewPath = this.route.snapshot.routeConfig?.path === 'staff/new';
    this.id = paramId || (staticNewPath ? 'new' : '');
    if (!this.id && this.router.url.replace(/\/+$/, '').endsWith('/staff/new')) {
      this.id = 'new';
    }
    this.editing = this.route.snapshot.url.some(segment => segment.path === 'edit') || this.isCreate;
    if (this.isCreate) {
      this.staff = null;
      this.createPortalDraft = true;
      this.portalPasswordDraft = '';
      this.draft = {
        fullName: '',
        staffRole: 'SCHOOL_STAFF',
        email: '',
        phone: '',
        employeeCode: '',
        notes: '',
      };
      return;
    }
    this.load();
  }

  load(): void {
    if (!this.id || this.isCreate) return;
    this.error = '';
    this.operationsService.getStaffById(this.id).subscribe({
      next: row => {
        this.staff = row;
        this.draft = { ...row };
        this.createPortalDraft = false;
        this.portalPasswordDraft = '';
      },
      error: (e: Error) => {
        this.error = e?.message || 'Unable to load staff record.';
      },
    });
  }

  save(): void {
    this.error = '';
    this.draft.phone = this.normalizeTenDigitPhone(this.draft.phone);
    const phoneKey = this.phoneValidationMessage(this.draft.phone);
    if (phoneKey) {
      this.error = this.translate.instant(phoneKey);
      return;
    }
    const portalPwd = (this.portalPasswordDraft ?? '').trim();
    if (this.createPortalDraft && portalPwd && portalPwd.length < 8) {
      this.error = this.translate.instant('staff.profile.errPortalPasswordMin', { min: 8 });
      return;
    }
    if (this.createPortalDraft) {
      const digits = (this.draft.phone ?? '').trim();
      if (!digits) {
        this.error = this.translate.instant('staff.profile.errPortalPhoneRequired');
        return;
      }
    }
    if (this.isCreate) {
      const name = (this.draft.fullName ?? '').trim();
      if (!name) {
        this.error = this.translate.instant('staff.profile.validationNameRequired');
        return;
      }
      const emailOptional = this.sanitizedOptionalEmail(this.draft.email);
      this.saving = true;
      this.operationsService
        .createStaff({
          fullName: name,
          staffRole: (this.draft.staffRole ?? 'SCHOOL_STAFF').trim() || 'SCHOOL_STAFF',
          email: emailOptional,
          phone: this.draft.phone || undefined,
          employeeCode: (this.draft.employeeCode ?? '').trim() || undefined,
          notes: (this.draft.notes ?? '').trim() || undefined,
          createPortal: this.createPortalDraft,
          portalPassword: portalPwd || undefined,
        })
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: row => {
            void this.router.navigate(['/app/staff', row.id]);
          },
          error: (e: unknown) => {
            this.error = resolveStaffSaveError(e, this.translate);
          },
        });
      return;
    }
    if (!this.staff) return;
    const emailOut = this.sanitizedOptionalEmail(this.draft.email);
    const provisioning = this.createPortalDraft && !this.staff.userId;
    this.saving = true;
    this.operationsService
      .updateStaff(this.staff.id, {
        staffRole: this.draft.staffRole,
        fullName: this.draft.fullName,
        phone: this.draft.phone,
        email: emailOut,
        employeeCode: this.draft.employeeCode,
        notes: this.draft.notes,
        createPortal: provisioning ? true : undefined,
        portalPassword: provisioning && portalPwd ? portalPwd : undefined,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: row => {
          this.staff = row;
          this.draft = { ...row };
          this.createPortalDraft = false;
          this.portalPasswordDraft = '';
          this.editing = false;
        },
        error: (e: unknown) => {
          this.error = resolveStaffSaveError(e, this.translate);
        },
      });
  }

  clearError(): void {
    this.error = '';
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

  /** National 10-digit mobile after stripping country code / separators (consistent with imports). */
  private normalizeTenDigitPhone(value: string | null | undefined): string {
    return digitsOnlyIndiaMobile(value);
  }

  /** When phone empty → skip; when present → must be 10 digits and valid India mobile (6–9…). */
  private phoneValidationMessage(digits: string | null | undefined): string | null {
    const d = (digits ?? '').trim();
    if (!d) return null;
    if (!/^\d{10}$/.test(d)) return 'staff.profile.validationPhoneTenDigits';
    if (!isValidIndiaMobileTen(d)) return 'staff.profile.validationPhoneIndiaMobile';
    return null;
  }

  /** Treat common “no email” placeholders as absent so the API does not receive invalid addresses. */
  private sanitizedOptionalEmail(raw: string | null | undefined): string | undefined {
    const t = (raw ?? '').trim();
    if (!t) return undefined;
    const u = t.toUpperCase();
    if (u === 'NA' || u === 'N/A' || u === 'NONE' || u === '—' || u === '-') return undefined;
    return t;
  }

  navigateBackToStaffTab(): void {
    void this.router.navigate(['/app/directory'], { queryParams: { tab: 'staff' } });
  }
}
