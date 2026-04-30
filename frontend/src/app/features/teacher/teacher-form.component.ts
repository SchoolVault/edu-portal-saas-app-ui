import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TeacherService } from '../../core/services/teacher.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { SubjectCatalogItem, Teacher } from '../../core/models/models';
import { canAdminSetTeacherDirectoryPhoto } from '../../core/policy/profile-photo-upload.policy';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { SubjectCatalogChipsComponent } from '../../shared/subject-catalog-chips/subject-catalog-chips.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProfilePhotoPickerComponent,
    ErpDatePickerComponent,
    SubjectCatalogChipsComponent,
    TranslateModule,
    ErpI18nPhDirective,
  ],
  styles: [
    `
      .teacher-catalog {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-top: 8px;
      }
      .teacher-catalog__cat {
        border: 1px solid var(--clr-border-light);
        border-radius: var(--radius-lg);
        background: color-mix(in srgb, var(--clr-surface-muted) 88%, var(--clr-surface));
        padding: 14px 16px 16px;
        box-shadow: 0 1px 0 color-mix(in srgb, var(--clr-border) 35%, transparent);
      }
      .teacher-catalog__cat-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--clr-primary);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--clr-border-light);
      }
    `,
  ],
  template: `
    <div data-testid="teacher-form-page" class="animate-in">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-icon" (click)="goBack()"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></button>
        <h2 style="font-size: 24px; font-weight: 800;">{{ isEdit ? ('teachers.form.editTitle' | translate) : ('teachers.form.addTitle' | translate) }}</h2>
      </div>
      <div class="erp-card">
        <form (ngSubmit)="onSubmit()" data-testid="teacher-form">
          <div class="row g-3 mb-4">
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.firstName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="teacher.firstName" name="firstName" required></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.lastName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="teacher.lastName" name="lastName" required></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.email' | translate }}</label><input type="email" class="erp-input" [(ngModel)]="teacher.email" name="email" required></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.phone' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="teacher.phone" name="phone" required inputmode="numeric" maxlength="10" pattern="[0-9]{10}"></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.qualification' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="teacher.qualification" name="qualification"></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.specialization' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="teacher.specialization" name="specialization"></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.joinDate' | translate }}</label><app-erp-date-picker [(ngModel)]="teacher.joinDate" name="joinDate" placeholderI18nKey="teachers.form.joinDatePh" /></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">{{ 'teachers.form.salary' | translate }}</label><input type="number" class="erp-input" [(ngModel)]="teacher.salary" name="salary"></div></div>
            <div class="col-12">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'teachers.form.subjectsCatalog' | translate }}</label>
                <p class="text-muted small mb-2" *ngIf="catalogLoading">{{ 'teachers.form.loadingCatalog' | translate }}</p>
                <div *ngIf="!catalogLoading && subjectGroupEntries.length === 0" class="text-muted small">{{ 'teachers.form.noSubjects' | translate }}</div>
                <div class="teacher-catalog">
                  <div *ngFor="let group of subjectGroupEntries; trackBy: trackCategoryGroup" class="teacher-catalog__cat">
                    <div class="teacher-catalog__cat-title">{{ catalogCategoryLabel(group[0]) }}</div>
                    <app-subject-catalog-chips
                      [items]="group[1]"
                      [selectedNames]="teacher.subjects ?? []"
                      (selectedChange)="onSubjectChipSelectionChange($event)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="erp-form-group">
                <label class="erp-label">{{ 'teachers.form.additionalSubjects' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="additionalSubjectsRaw" name="additionalSubjects" erpI18nPh="teachers.form.additionalSubjectsPh">
                <div class="small text-muted mt-1">{{ 'teachers.form.additionalSubjectsHelp' | translate }}</div>
              </div>
            </div>
            <div class="col-12" *ngIf="canSetTeacherDirectoryPhoto()">
              <div class="pt-3 mt-2" style="border-top: 1px solid var(--clr-border-light);">
                <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 8px; color: var(--clr-primary);">{{ 'teachers.form.directoryPhoto' | translate }}</h4>
                <p class="text-muted small mb-3">{{ 'teachers.form.directoryPhotoLead' | translate }}</p>
                <app-profile-photo-picker
                  [previewUrl]="teacherDirectoryPreview"
                  [initials]="teacherDirectoryInitials()"
                  [frameAriaLabel]="'teachers.form.directoryPhotoAria' | translate"
                  statusMode="none"
                  (photoPicked)="onTeacherDirPhotoPicked($event)"
                  (photoRemoved)="onTeacherDirPhotoRemoved()"
                />
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-end gap-3">
            <button type="button" class="btn-outline-erp" (click)="goBack()">{{ 'teachers.form.cancel' | translate }}</button>
            <button type="submit" class="btn-primary-erp" [disabled]="saving || catalogLoading" data-testid="save-teacher-btn">
              {{ saving ? ('teachers.form.saving' | translate) : (isEdit ? ('teachers.form.saveUpdate' | translate) : ('teachers.form.saveAdd' | translate)) }}
            </button>
          </div>
          <p class="small text-danger mt-2 mb-0" *ngIf="saveError">{{ saveError }}</p>
        </form>
      </div>
    </div>
  `,
})
export class TeacherFormComponent implements OnInit, OnDestroy {
  teacher: Partial<Teacher> = { status: 'active', tenantId: 't1', subjects: [], classIds: [], salary: 0 };
  subjectCatalog: SubjectCatalogItem[] = [];
  /** Stable rows for *ngFor (avoid rebuilding identities every CD cycle). */
  subjectGroupEntries: [string, SubjectCatalogItem[]][] = [];
  catalogLoading = true;
  additionalSubjectsRaw = '';
  isEdit = false;
  saving = false;
  saveError = '';
  teacherDirectoryPreview: string | null = null;
  private initialTeacherEmail = '';
  private initialTeacherPhone = '';
  private readonly categoryOrder = ['STEM', 'Languages', 'Social', 'Arts', 'Other'];
  private langSub?: Subscription;

  constructor(
    private teacherService: TeacherService,
    private academicService: AcademicService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
    this.auth.fetchProfileSummary().subscribe({ error: () => void 0 });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.isEdit = true;

    this.academicService.getSubjectCatalog().subscribe({
      next: cat => {
        this.subjectCatalog = cat;
        this.rebuildSubjectGroupEntries();
        this.catalogLoading = false;
        if (this.isEdit && id) {
          const nid = Number(id);
          if (Number.isFinite(nid)) {
            this.teacherService.getTeacherById(nid).subscribe(t => {
              if (t) this.applyTeacherFromApi(t);
            });
          }
        }
      },
      error: () => {
        this.subjectCatalog = [];
        this.subjectGroupEntries = [];
        this.catalogLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  catalogCategoryLabel(cat: string): string {
    const norm = cat.trim();
    if (norm === 'Other') {
      return this.translate.instant('teachers.category.other');
    }
    const key = 'teachers.catalogCategory.' + norm;
    const t = this.translate.instant(key);
    return t !== key ? t : norm;
  }

  trackCategoryGroup(_index: number, group: [string, SubjectCatalogItem[]]): string {
    return group[0];
  }

  /** Recompute when `subjectCatalog` changes (not on every selection — keeps DOM stable). */
  private rebuildSubjectGroupEntries(): void {
    const m = new Map<string, SubjectCatalogItem[]>();
    for (const s of this.subjectCatalog) {
      const c = s.category?.trim() || 'Other';
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(s);
    }
    for (const [, items] of m) {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    const rank = (cat: string) => {
      const i = this.categoryOrder.indexOf(cat);
      return i >= 0 ? i : 999;
    };
    this.subjectGroupEntries = [...m.entries()].sort((a, b) => {
      const ra = rank(a[0]);
      const rb = rank(b[0]);
      if (ra !== rb) return ra - rb;
      return a[0].localeCompare(b[0]);
    });
  }

  onSubjectChipSelectionChange(names: string[]): void {
    this.teacher = { ...this.teacher, subjects: [...names] };
    this.cdr.markForCheck();
  }

  canSetTeacherDirectoryPhoto(): boolean {
    return (
      this.isEdit &&
      !!this.teacher.id &&
      canAdminSetTeacherDirectoryPhoto(this.auth.getRole())
    );
  }

  teacherDirectoryInitials(): string {
    const a = (this.teacher.firstName?.[0] || '').toUpperCase();
    const b = (this.teacher.lastName?.[0] || '').toUpperCase();
    return (a + b) || '?';
  }

  refreshTeacherDirectoryPreview(): void {
    if (!this.teacher.id) {
      this.teacherDirectoryPreview = null;
      return;
    }
    this.teacherDirectoryPreview =
      this.auth.getDirectoryTeacherAvatarDataUrl(this.teacher.id) || this.teacher.avatar || null;
  }

  onTeacherDirPhotoPicked(ev: ProfilePhotoPickEvent): void {
    if (!this.teacher.id) return;
    this.auth.setDirectoryTeacherAvatarDataUrl(this.teacher.id, ev.dataUrl);
    this.refreshTeacherDirectoryPreview();
  }

  onTeacherDirPhotoRemoved(): void {
    if (!this.teacher.id) return;
    this.auth.clearDirectoryTeacherAvatar(this.teacher.id);
    this.refreshTeacherDirectoryPreview();
  }

  private applyTeacherFromApi(t: Teacher): void {
    const catNames = new Set(this.subjectCatalog.map(s => s.name));
    const all = [...(t.subjects ?? [])];
    this.teacher = { ...t, subjects: [...all.filter(s => catNames.has(s))] };
    this.additionalSubjectsRaw = all.filter(s => !catNames.has(s)).join(', ');
    this.initialTeacherEmail = (t.email ?? '').trim().toLowerCase();
    this.initialTeacherPhone = (t.phone ?? '').trim();
    this.refreshTeacherDirectoryPreview();
  }

  private mergeSubjectsForSave(): string[] {
    const extra = this.additionalSubjectsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const fromCatalog = [...(this.teacher.subjects ?? [])];
    return [...new Set([...fromCatalog, ...extra])];
  }

  onSubmit(): void {
    this.teacher.phone = this.normalizeTenDigitPhone(this.teacher.phone ?? '');
    if (!this.teacher.firstName || !this.teacher.lastName || !this.teacher.email || !this.teacher.phone?.trim()) return;
    if (!this.isValidTenDigitPhone(this.teacher.phone)) {
      this.saveError = this.translate.instant('teachers.form.phoneInvalidTenDigits');
      return;
    }
    this.saving = true;
    this.saveError = '';
    const payload = { ...this.teacher, subjects: this.mergeSubjectsForSave() };
    if (this.isEdit && payload.id) {
      this.teacherService.updateTeacher(payload.id, payload).subscribe({
        next: () => {
          this.saving = false;
          const emailChanged = (payload.email ?? '').trim().toLowerCase() !== this.initialTeacherEmail;
          const phoneChanged = (payload.phone ?? '').trim() !== this.initialTeacherPhone;
          if (emailChanged || phoneChanged) {
            this.showNextLoginCredentialDialog(payload.email ?? '', payload.phone ?? '');
          }
          this.router.navigate(['/app/teachers']);
        },
        error: (err) => {
          this.saving = false;
          this.saveError = err?.message || this.translate.instant('teachers.form.saveError');
        }
      });
    } else {
      this.teacherService.addTeacher(payload as Omit<Teacher, 'id'>).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/app/teachers']); },
        error: (err) => {
          this.saving = false;
          this.saveError = err?.message || this.translate.instant('teachers.form.saveError');
        }
      });
    }
  }

  private showNextLoginCredentialDialog(email: string, phone: string): void {
    const details: string[] = [];
    if (email.trim()) {
      details.push(`${this.translate.instant('settings.labelEmail')}: ${email}`);
    }
    if (phone.trim()) {
      details.push(`${this.translate.instant('settings.profileContactPhoneLabel')}: ${phone}`);
    }
    this.confirmDialog.confirm({
      title: this.translate.instant('settings.credentialsUpdatedDialogTitle'),
      message: this.translate.instant('settings.credentialsUpdatedDialogBody'),
      details,
      variant: 'warning',
      confirmLabel: this.translate.instant('settings.dialogOk'),
      cancelLabel: this.translate.instant('settings.dialogClose'),
    }).subscribe();
  }

  goBack(): void { this.router.navigate(['/app/teachers']); }

  private normalizeTenDigitPhone(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '').slice(0, 10);
  }

  private isValidTenDigitPhone(value: string | null | undefined): boolean {
    return /^\d{10}$/.test((value ?? '').trim());
  }
}
