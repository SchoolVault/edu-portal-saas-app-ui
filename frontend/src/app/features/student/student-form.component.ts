import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { GuardianService } from '../../core/services/guardian.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { Student, SchoolClass } from '../../core/models/models';
import { BLOOD_GROUPS, GENDERS, STUDENT_STATUS } from '../../core/config/app-constants';
import { runtimeConfig } from '../../core/config/runtime-config';
import { canUploadStudentDirectoryPhoto } from '../../core/policy/profile-photo-upload.policy';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';
import { UserFacingHttpError } from '../../core/http/user-facing-http-error';
import { StudentGuardianMapping } from '../../core/models/models';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePhotoPickerComponent, ErpDatePickerComponent, TranslateModule, ErpI18nPhDirective],
  template: `
    <div data-testid="student-form-page" class="animate-in">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-icon" (click)="goBack()" data-testid="back-btn"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></button>
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ isEdit ? ('students.form.editTitle' | translate) : ('students.form.addTitle' | translate) }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ isEdit ? ('students.form.editSubtitle' | translate) : ('students.form.addSubtitle' | translate) }}</p>
        </div>
      </div>
      <div class="erp-card">
        <div class="login-error mb-3" *ngIf="submitErrorKey || saveApiMessage" role="alert" data-testid="student-form-error">
          <i class="bi bi-exclamation-circle"></i>
          <span *ngIf="submitErrorKey">{{ submitErrorKey | translate }}</span>
          <span *ngIf="saveApiMessage">{{ saveApiMessage }}</span>
        </div>
        <form (ngSubmit)="onSubmit()" data-testid="student-form">
          <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--clr-primary);">{{ 'students.form.sectionPersonal' | translate }}</h4>
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.firstName' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="student.firstName" name="firstName" required data-testid="student-firstName">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.lastName' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="student.lastName" name="lastName" required data-testid="student-lastName">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.email' | translate }}</label>
                <input type="email" class="erp-input" [(ngModel)]="student.email" name="email" data-testid="student-email">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.phone' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="student.phone" name="phone" data-testid="student-phone" inputmode="numeric" maxlength="10" pattern="[0-9]{10}">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.dob' | translate }}</label>
                <app-erp-date-picker
                  [(ngModel)]="student.dateOfBirth"
                  name="dob"
                  dataTestId="student-dob"
                  placeholderI18nKey="students.form.dobPh"
                  required
                />
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.gender' | translate }}</label>
                <select class="erp-select" [(ngModel)]="student.gender" name="gender" required data-testid="student-gender">
                  <option value="">{{ 'students.form.select' | translate }}</option>
                  <option *ngFor="let g of genders" [value]="g">{{ ('students.enums.gender.' + g) | translate }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.bloodGroup' | translate }}</label>
                <select class="erp-select" [(ngModel)]="student.bloodGroup" name="bloodGroup" data-testid="student-blood-group">
                  <option value="">{{ 'students.form.select' | translate }}</option>
                  <option *ngFor="let bg of bloodGroups" [value]="bg">{{ bg }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-8">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.address' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="student.address" name="address" data-testid="student-address">
              </div>
            </div>
            <div class="col-12" *ngIf="showStudentDirectoryPhoto()">
              <div class="pt-3 mt-2" style="border-top: 1px solid var(--clr-border-light);">
                <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 8px; color: var(--clr-primary);">{{ 'students.form.sectionDirectoryPhoto' | translate }}</h4>
                <p class="text-muted small mb-3">{{ 'students.form.directoryPhotoLead' | translate }}</p>
                <app-profile-photo-picker
                  [previewUrl]="studentDirectoryPreview"
                  [initials]="studentDirectoryInitials()"
                  [frameAriaLabel]="'students.form.directoryPhotoAria' | translate"
                  statusMode="none"
                  (photoPicked)="onStudentDirPhotoPicked($event)"
                  (photoRemoved)="onStudentDirPhotoRemoved()"
                />
              </div>
            </div>
          </div>

          <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--clr-primary);">{{ 'students.form.sectionAcademic' | translate }}</h4>
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.class' | translate }}</label>
                <select class="erp-select" [(ngModel)]="student.classId" name="classId" required (change)="onClassChange()" data-testid="student-class">
                  <option [ngValue]="null">{{ 'students.form.selectClass' | translate }}</option>
                  <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ classDisplayName(cls.name) }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.section' | translate }}<span *ngIf="sectionRequired">{{ 'students.form.sectionReq' | translate }}</span></label>
                <select class="erp-select" [(ngModel)]="student.sectionId" name="sectionId" [required]="sectionRequired"
                  [disabled]="!sectionRequired" data-testid="student-section">
                  <ng-container *ngIf="sectionRequired">
                    <option [ngValue]="null">{{ 'students.form.selectSection' | translate }}</option>
                    <option *ngFor="let sec of availableSections" [ngValue]="sec.id">{{ sec.name }}</option>
                  </ng-container>
                  <ng-container *ngIf="!sectionRequired">
                    <option [ngValue]="0">{{ 'students.form.wholeClass' | translate }}</option>
                  </ng-container>
                </select>
                <p *ngIf="student.classId != null && student.classId !== 0 && !sectionRequired" class="text-muted small mb-0 mt-1">{{ 'students.form.noSectionsHint' | translate }}</p>
              </div>
            </div>
            <div class="col-md-4" *ngIf="isEdit && isAdmin">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.enrolmentStatus' | translate }}</label>
                <select class="erp-select" [(ngModel)]="student.status" name="status" data-testid="student-status">
                  <option *ngFor="let st of studentStatuses" [value]="st">{{ ('students.enums.status.' + st) | translate }}</option>
                </select>
                <p class="text-muted small mb-0 mt-1">{{ 'students.form.statusHelp' | translate }}</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.rollNumber' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="student.rollNumber" name="rollNumber" data-testid="student-roll">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.admissionNumber' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="student.admissionNumber" name="admissionNumber" data-testid="student-admission-no">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.admissionDate' | translate }}</label>
                <app-erp-date-picker
                  [(ngModel)]="student.admissionDate"
                  name="admissionDate"
                  dataTestId="student-admission-date"
                  placeholderI18nKey="students.form.admissionDatePh"
                />
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.parentLegacy' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="student.parentName" name="parentName" data-testid="student-parent-name" erpI18nPh="students.form.parentPlaceholder">
              </div>
            </div>
          </div>

      <h4 *ngIf="!isEdit" style="font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--clr-primary);">{{ 'students.form.sectionGuardians' | translate }}</h4>
          <div *ngIf="!isEdit" class="row g-3 mb-4">
            <div class="col-12"><p class="text-muted small mb-0">{{ 'students.form.guardiansIntro' | translate }}</p></div>
            <div class="col-md-6 erp-card p-3">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.g1name' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.fullName" name="g1name" required></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.phone' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.primaryPhone" (ngModelChange)="onPrimaryGuardianPhoneChanged()" (blur)="onPrimaryGuardianPhoneBlur()" name="g1phone" required inputmode="numeric" maxlength="10" pattern="[0-9]{10}">
                <div class="mt-2" *ngIf="showExistingParentChip()">
                  <div class="small text-muted" *ngIf="parentLookupLoading">{{ 'students.form.parentLookupChecking' | translate }}</div>
                  <div class="small d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2" style="background: rgba(13,110,253,0.12); color: #0b5ed7;" *ngIf="!parentLookupLoading && existingParentMatch">
                    <i class="bi bi-link-45deg"></i>
                    <span>{{ 'students.form.parentAlreadyLinkedChip' | translate:{ name: existingParentMatch.fullName, phone: existingParentMatch.primaryPhone || g1.primaryPhone } }}</span>
                  </div>
                  <div class="small d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2" style="background: rgba(25,135,84,0.12); color: #146c43;" *ngIf="!parentLookupLoading && !existingParentMatch && parentLookupChecked">
                    <i class="bi bi-person-plus"></i>
                    <span>{{ 'students.form.parentWillBeCreatedChip' | translate }}</span>
                  </div>
                </div>
              </div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.email' | translate }}</label>
                <input type="email" class="erp-input" [(ngModel)]="g1.email" name="g1email"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.occupation' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.occupation" name="g1job"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.relation' | translate }}</label>
                <select class="erp-select" [(ngModel)]="g1.relationType" name="g1rel">
                  <option value="FATHER">{{ 'students.enums.guardianRelation.FATHER' | translate }}</option>
                  <option value="MOTHER">{{ 'students.enums.guardianRelation.MOTHER' | translate }}</option>
                  <option value="GUARDIAN">{{ 'students.enums.guardianRelation.GUARDIAN' | translate }}</option>
                  <option value="OTHER">{{ 'students.enums.guardianRelation.OTHER' | translate }}</option>
                </select></div>
              <label class="small d-flex align-items-center gap-2">
                <input type="checkbox" [(ngModel)]="g1.createPortal" name="g1CreatePortal">
                <span>{{ 'students.form.createPortalForPrimary' | translate }}</span>
              </label>
            </div>
            <div class="col-md-6 erp-card p-3" *ngIf="includeSecondGuardian">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.g2name' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.fullName" name="g2name"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.phone' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.primaryPhone" name="g2phone" inputmode="numeric" maxlength="10" pattern="[0-9]{10}"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.email' | translate }}</label>
                <input type="email" class="erp-input" [(ngModel)]="g2.email" name="g2email"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.occupation' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.occupation" name="g2job"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.relation' | translate }}</label>
                <select class="erp-select" [(ngModel)]="g2.relationType" name="g2rel">
                  <option value="FATHER">{{ 'students.enums.guardianRelation.FATHER' | translate }}</option>
                  <option value="MOTHER">{{ 'students.enums.guardianRelation.MOTHER' | translate }}</option>
                  <option value="GUARDIAN">{{ 'students.enums.guardianRelation.GUARDIAN' | translate }}</option>
                  <option value="OTHER">{{ 'students.enums.guardianRelation.OTHER' | translate }}</option>
                </select></div>
              <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeSecondGuardianDraft()">{{ 'students.form.removeSecondaryGuardian' | translate }}</button>
            </div>
            <div class="col-12" *ngIf="!includeSecondGuardian">
              <button type="button" class="btn-outline-erp" (click)="includeSecondGuardian = true">{{ 'students.form.addSecondaryGuardian' | translate }}</button>
            </div>
          </div>

          <h4 *ngIf="isEdit" style="font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--clr-primary);">{{ 'students.form.sectionGuardians' | translate }}</h4>
          <div *ngIf="isEdit" class="row g-3 mb-4">
            <div class="col-12"><p class="text-muted small mb-0">{{ 'students.form.guardiansEditIntro' | translate }}</p></div>
            <div class="col-md-6 erp-card p-3" *ngFor="let guardian of editGuardians; let i = index">
              <div class="erp-form-group">
                <label class="erp-label">{{ (i === 0 ? 'students.form.g1name' : 'students.form.g2name') | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="guardian.fullName" [name]="'editGuardianName' + i">
              </div>
              <div class="erp-form-group">
                <label class="erp-label">{{ 'students.form.phone' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="guardian.primaryPhone" [name]="'editGuardianPhone' + i" inputmode="numeric" maxlength="10" pattern="[0-9]{10}">
              </div>
              <div class="erp-form-group">
                <label class="erp-label">{{ 'students.form.email' | translate }}</label>
                <input type="email" class="erp-input" [(ngModel)]="guardian.email" [name]="'editGuardianEmail' + i">
              </div>
              <div class="erp-form-group">
                <label class="erp-label">{{ 'students.form.occupation' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="guardian.occupation" [name]="'editGuardianOccupation' + i">
              </div>
              <div class="erp-form-group">
                <label class="erp-label">{{ 'students.form.relation' | translate }}</label>
                <select class="erp-select" [(ngModel)]="guardian.relationType" [name]="'editGuardianRelation' + i">
                  <option value="FATHER">{{ 'students.enums.guardianRelation.FATHER' | translate }}</option>
                  <option value="MOTHER">{{ 'students.enums.guardianRelation.MOTHER' | translate }}</option>
                  <option value="GUARDIAN">{{ 'students.enums.guardianRelation.GUARDIAN' | translate }}</option>
                  <option value="OTHER">{{ 'students.enums.guardianRelation.OTHER' | translate }}</option>
                </select>
              </div>
              <div class="d-flex gap-3 flex-wrap mt-2">
                <label class="small d-flex align-items-center gap-2">
                  <input type="checkbox" [(ngModel)]="guardian.isPrimary" (ngModelChange)="onPrimaryGuardianToggle(i)" [name]="'editGuardianPrimary' + i">
                  <span>{{ 'students.form.guardianPrimary' | translate }}</span>
                </label>
                <label class="small d-flex align-items-center gap-2">
                  <input type="checkbox" [(ngModel)]="guardian.isEmergencyContact" [name]="'editGuardianEmergency' + i">
                  <span>{{ 'students.form.guardianEmergency' | translate }}</span>
                </label>
                <button type="button" class="btn btn-sm btn-outline-danger" *ngIf="i > 0" (click)="removeGuardianRow(i)">
                  {{ 'students.form.removeSecondaryGuardian' | translate }}
                </button>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-3">
            <button type="button" class="btn-outline-erp" (click)="goBack()" data-testid="cancel-btn">{{ 'students.form.cancel' | translate }}</button>
            <button type="submit" class="btn-primary-erp" [disabled]="saving" data-testid="save-student-btn">
              <span class="spinner" *ngIf="saving"></span>
              {{ saving ? ('students.form.saving' | translate) : (isEdit ? ('students.form.saveUpdate' | translate) : ('students.form.saveAdd' | translate)) }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class StudentFormComponent implements OnInit, OnDestroy {
  student: Partial<Student> = { status: 'active', tenantId: 't1', gender: '', bloodGroup: '' };
  classes: SchoolClass[] = [];
  availableSections: { id: number; name: string }[] = [];
  genders = GENDERS;
  bloodGroups = BLOOD_GROUPS;
  studentStatuses = [...STUDENT_STATUS];
  isEdit = false;
  saving = false;
  /** i18n key for client-side validation (guardians). */
  submitErrorKey: string | null = null;
  /** Server-safe message from API (already user-facing). */
  saveApiMessage: string | null = null;
  studentDirectoryPreview: string | null = null;
  g1 = { fullName: '', primaryPhone: '', email: '', occupation: '', relationType: 'FATHER' as const, createPortal: true };
  g2 = { fullName: '', primaryPhone: '', email: '', occupation: '', relationType: 'MOTHER' as const };
  includeSecondGuardian = false;
  existingParentMatch: { id: string; fullName: string; primaryPhone?: string } | null = null;
  parentLookupLoading = false;
  parentLookupChecked = false;
  editGuardians: Array<{
    mappingId: number | null;
    guardianId: number | null;
    fullName: string;
    primaryPhone: string;
    email: string;
    occupation: string;
    relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
    isPrimary: boolean;
    isEmergencyContact: boolean;
  }> = [];
  private langSub?: Subscription;

  get isAdmin(): boolean {
    return this.uiAccess.hasStudentMasterWriteAccess();
  }

  constructor(
    private studentService: StudentService,
    private academicService: AcademicService,
    private guardianService: GuardianService,
    private auth: AuthService,
    private uiAccess: UiAccessService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  classDisplayName(raw: string | null | undefined): string {
    return formatSchoolClassName(raw, this.translate);
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
    this.auth.fetchProfileSummary().subscribe({ error: () => void 0 });
    this.academicService.getClasses().subscribe(classes => {
      this.classes = classes;
    });
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw && raw !== 'new') {
      const id = Number(raw);
      if (!Number.isFinite(id)) return;
      this.isEdit = true;
      this.studentService.getStudentById(id).subscribe(s => {
        if (s) {
          this.student = { ...s };
          this.onClassChange();
          this.refreshStudentDirectoryPreview();
          this.loadGuardianEditorRows(id);
        }
      });
    }
  }

  private loadGuardianEditorRows(studentId: number): void {
    this.studentService.getGuardianMappings(studentId).subscribe({
      next: rows => {
        this.editGuardians = this.toEditGuardianRows(rows);
      },
      error: () => {
        this.editGuardians = this.buildFallbackEditRows();
      },
    });
  }

  private toEditGuardianRows(rows: StudentGuardianMapping[]): Array<{
    mappingId: number | null;
    guardianId: number | null;
    fullName: string;
    primaryPhone: string;
    email: string;
    occupation: string;
    relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
    isPrimary: boolean;
    isEmergencyContact: boolean;
  }> {
    const toRelation = (v: string | null | undefined): 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER' => {
      const normalized = (v ?? '').toUpperCase();
      return normalized === 'FATHER' || normalized === 'MOTHER' || normalized === 'GUARDIAN' ? normalized : 'OTHER';
    };
    const mapped: Array<{
      mappingId: number | null;
      guardianId: number | null;
      fullName: string;
      primaryPhone: string;
      email: string;
      occupation: string;
      relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
      isPrimary: boolean;
      isEmergencyContact: boolean;
    }> = rows.slice(0, 2).map(r => ({
      mappingId: r.id ?? null,
      guardianId: r.guardianId ?? null,
      fullName: r.guardianName ?? '',
      primaryPhone: r.primaryPhone ?? '',
      email: r.email ?? '',
      occupation: r.occupation ?? '',
      relationType: toRelation(r.relationType),
      isPrimary: !!r.isPrimary,
      isEmergencyContact: !!r.isEmergencyContact,
    }));
    while (mapped.length < 2) {
      mapped.push({
        mappingId: null,
        guardianId: null,
        fullName: '',
        primaryPhone: '',
        email: '',
        occupation: '',
        relationType: mapped.length === 0 ? 'FATHER' : 'MOTHER',
        isPrimary: mapped.length === 0,
        isEmergencyContact: mapped.length === 0,
      });
    }
    return mapped;
  }

  private buildFallbackEditRows(): Array<{
    mappingId: number | null;
    guardianId: number | null;
    fullName: string;
    primaryPhone: string;
    email: string;
    occupation: string;
    relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
    isPrimary: boolean;
    isEmergencyContact: boolean;
  }> {
    return [
      {
        mappingId: null,
        guardianId: null,
        fullName: this.student.parentName ?? '',
        primaryPhone: '',
        email: '',
        occupation: '',
        relationType: 'FATHER',
        isPrimary: true,
        isEmergencyContact: true,
      },
      {
        mappingId: null,
        guardianId: null,
        fullName: '',
        primaryPhone: '',
        email: '',
        occupation: '',
        relationType: 'MOTHER',
        isPrimary: false,
        isEmergencyContact: false,
      },
    ];
  }

  showStudentDirectoryPhoto(): boolean {
    return (
      this.isEdit &&
      !!this.student.id &&
      canUploadStudentDirectoryPhoto({
        viewerRole: this.auth.getRole(),
        studentClassId: this.student.classId,
        classTeacherOf: this.auth.getProfileSummarySnapshot()?.classTeacherOf,
      })
    );
  }

  studentDirectoryInitials(): string {
    const a = (this.student.firstName?.[0] || '').toUpperCase();
    const b = (this.student.lastName?.[0] || '').toUpperCase();
    return (a + b) || '?';
  }

  refreshStudentDirectoryPreview(): void {
    if (!this.student.id) {
      this.studentDirectoryPreview = null;
      return;
    }
    this.studentDirectoryPreview =
      this.auth.getDirectoryStudentAvatarDataUrl(this.student.id) || this.student.avatar || null;
  }

  onStudentDirPhotoPicked(ev: ProfilePhotoPickEvent): void {
    if (!this.student.id) return;
    this.auth.setDirectoryStudentAvatarDataUrl(this.student.id, ev.dataUrl);
    this.refreshStudentDirectoryPreview();
  }

  onStudentDirPhotoRemoved(): void {
    if (!this.student.id) return;
    this.auth.clearDirectoryStudentAvatar(this.student.id);
    this.refreshStudentDirectoryPreview();
  }

  onClassChange(): void {
    const cls = this.classes.find(c => c.id === this.student.classId);
    this.availableSections = cls ? cls.sections.map(s => ({ id: s.id, name: s.name })) : [];
    if (cls) this.student.className = cls.name;
    if (cls && cls.sections.length === 0) {
      this.student.sectionId = 0;
      this.student.sectionName = '';
    } else if (
      cls &&
      this.student.sectionId != null &&
      this.student.sectionId !== 0 &&
      !this.availableSections.some(s => s.id === this.student.sectionId)
    ) {
      delete this.student.sectionId;
      this.student.sectionName = '';
    }
  }

  /** False when the selected class has no sections (whole-class enrollment). */
  get sectionRequired(): boolean {
    const cls = this.classes.find(c => c.id === this.student.classId);
    return !!cls && cls.sections.length > 0;
  }

  async onSubmit(): Promise<void> {
    this.submitErrorKey = null;
    this.saveApiMessage = null;
    this.student.phone = this.normalizeTenDigitPhone(this.student.phone ?? '');
    if (this.student.phone && !this.isValidTenDigitPhone(this.student.phone)) {
      this.submitErrorKey = 'students.form.phoneInvalidTenDigits';
      return;
    }
    if (!this.student.firstName || !this.student.lastName || this.student.classId == null || this.student.classId === 0) {
      return;
    }
    if (this.sectionRequired && (this.student.sectionId == null || this.student.sectionId === 0)) return;
    if (!this.isEdit && !this.validateGuardianPairs()) {
      return;
    }
    if (!this.isEdit && !(await this.confirmLinkToExistingParentIfAny())) {
      return;
    }
    this.saving = true;
    if (!this.sectionRequired) {
      this.student.sectionId = 0;
      this.student.sectionName = '';
    }
    const sec = this.availableSections.find(s => s.id === this.student.sectionId);
    if (sec) this.student.sectionName = sec.name;

    const fillLegacyParentName = (): void => {
      if (this.student.parentName?.trim()) return;
      if (this.g1.fullName.trim()) this.student.parentName = this.g1.fullName.trim();
      else if (this.g2.fullName.trim()) this.student.parentName = this.g2.fullName.trim();
    };

    if (this.isEdit && this.student.id) {
      const primaryGuardian = this.editGuardians.find(g => g.isPrimary && g.fullName.trim());
      if (primaryGuardian) {
        this.student.parentName = primaryGuardian.fullName.trim();
      }
      this.studentService.updateStudent(this.student.id, this.student).subscribe({
        next: async () => {
          try {
            await this.syncGuardianMetadataForEdit();
          } catch {
            // Student update already succeeded; keep the flow resilient.
          }
          this.saving = false;
          this.router.navigate(['/app/students']);
        },
        error: (err: unknown) => {
          this.saving = false;
          if (err instanceof UserFacingHttpError) {
            this.saveApiMessage = err.message;
          } else {
            this.submitErrorKey = 'students.form.saveError';
          }
        }
      });
    } else {
      fillLegacyParentName();
      this.student.parentPhone = this.g1.primaryPhone.trim() || undefined;
      this.student.parentEmail = this.g1.email.trim() || undefined;
      this.student.createParentPortal = !!this.g1.createPortal;
      this.student.admissionNumber = this.student.admissionNumber || ('ADM' + Date.now().toString().slice(-6));
      this.studentService.addStudent(this.student as Omit<Student, 'id'>).subscribe({
        next: async created => {
          const secondaryDrafts = this.includeSecondGuardian ? [this.g2] : [];
          // Backend createStudent auto-links parent (by phone/email/create flag) and syncs one primary guardian mapping.
          // Keep manual-create behavior aligned with import: avoid creating a second primary guardian row for g1.
          const draftsToPersist = created.parentId ? secondaryDrafts : [this.g1, ...secondaryDrafts];
          const extras = draftsToPersist.filter(g => g.fullName.trim().length > 0);
          if (!runtimeConfig.useMocks && extras.length > 0) {
            try {
              for (let i = 0; i < extras.length; i++) {
                const g = extras[i];
                const gr = await firstValueFrom(this.guardianService.createGuardian({
                  fullName: g.fullName.trim(),
                  primaryPhone: g.primaryPhone?.trim() || undefined,
                  occupation: g.occupation?.trim() || undefined,
                  emailsJson: g.email?.trim() ? JSON.stringify([g.email.trim()]) : undefined
                }));
                await firstValueFrom(this.guardianService.addStudentMapping(created.id, {
                  guardianId: gr.id,
                  relationType: g.relationType,
                  isPrimary: i === 0,
                  isEmergencyContact: i === 0
                }));
              }
            } catch {
              /* student created; guardians failed — still land on list */
            }
          }
          this.saving = false;
          this.router.navigate(['/app/students']);
        },
        error: (err: unknown) => {
          this.saving = false;
          if (err instanceof UserFacingHttpError) {
            this.saveApiMessage = err.message;
          } else {
            this.submitErrorKey = 'students.form.saveError';
          }
        }
      });
    }
  }

  private async syncGuardianMetadataForEdit(): Promise<void> {
    if (!this.isEdit || !this.student.id || runtimeConfig.useMocks) {
      return;
    }
    const activeRows = this.editGuardians
      .map(row => ({ ...row, fullName: row.fullName.trim(), primaryPhone: this.normalizeTenDigitPhone(row.primaryPhone), email: row.email.trim(), occupation: row.occupation.trim() }))
      .filter(row => row.fullName || row.primaryPhone || row.email || row.occupation);
    if (!activeRows.length) {
      return;
    }
    const primaryIndex = activeRows.findIndex(r => r.isPrimary);
    if (primaryIndex === -1) {
      activeRows[0].isPrimary = true;
    }
    for (const row of activeRows) {
      if (!row.fullName || !row.primaryPhone) {
        continue;
      }
      if (!this.isValidTenDigitPhone(row.primaryPhone)) {
        throw new Error('Invalid guardian phone');
      }
      const emailsJson = row.email ? JSON.stringify([row.email]) : undefined;
      const phonesJson = row.primaryPhone ? JSON.stringify([row.primaryPhone]) : undefined;
      if (row.guardianId != null) {
        await firstValueFrom(
          this.guardianService.updateGuardian(row.guardianId, {
            fullName: row.fullName,
            primaryPhone: row.primaryPhone,
            occupation: row.occupation || undefined,
            emailsJson,
            phonesJson,
          })
        );
      } else {
        const created = await firstValueFrom(
          this.guardianService.createGuardian({
            fullName: row.fullName,
            primaryPhone: row.primaryPhone,
            occupation: row.occupation || undefined,
            emailsJson,
            phonesJson,
          })
        );
        row.guardianId = Number(created.id);
      }

      if (row.mappingId != null) {
        await firstValueFrom(
          this.guardianService.updateStudentMapping(this.student.id, row.mappingId, {
            relationType: row.relationType,
            isPrimary: row.isPrimary,
            isEmergencyContact: row.isEmergencyContact,
          })
        );
      } else if (row.guardianId != null) {
        await firstValueFrom(
          this.guardianService.addStudentMapping(this.student.id, {
            guardianId: String(row.guardianId),
            relationType: row.relationType,
            isPrimary: row.isPrimary,
            isEmergencyContact: row.isEmergencyContact,
          })
        );
      }
    }
  }

  onPrimaryGuardianToggle(index: number): void {
    if (!this.editGuardians[index]?.isPrimary) {
      return;
    }
    this.editGuardians = this.editGuardians.map((row, i) => ({
      ...row,
      isPrimary: i === index,
    }));
  }

  removeSecondGuardianDraft(): void {
    this.includeSecondGuardian = false;
    this.g2 = { fullName: '', primaryPhone: '', email: '', occupation: '', relationType: 'MOTHER' as const };
  }

  async removeGuardianRow(index: number): Promise<void> {
    if (!this.isEdit || !this.student.id || index <= 0 || index >= this.editGuardians.length) {
      return;
    }
    const row = this.editGuardians[index];
    if (row.mappingId != null && !runtimeConfig.useMocks) {
      await firstValueFrom(this.guardianService.removeStudentMapping(this.student.id, row.mappingId));
    }
    this.editGuardians.splice(index, 1);
  }

  onPrimaryGuardianPhoneChanged(): void {
    this.existingParentMatch = null;
    this.parentLookupChecked = false;
  }

  async onPrimaryGuardianPhoneBlur(): Promise<void> {
    if (runtimeConfig.useMocks) {
      return;
    }
    const phone = this.g1.primaryPhone?.trim();
    if (!phone) {
      this.existingParentMatch = null;
      this.parentLookupChecked = false;
      return;
    }
    this.parentLookupLoading = true;
    try {
      const matches = await firstValueFrom(this.guardianService.searchByPhone(phone));
      this.existingParentMatch = matches.length ? matches[0] : null;
      this.parentLookupChecked = true;
    } catch {
      this.existingParentMatch = null;
      this.parentLookupChecked = false;
    } finally {
      this.parentLookupLoading = false;
    }
  }

  private validateGuardianPairs(): boolean {
    this.g1.primaryPhone = this.normalizeTenDigitPhone(this.g1.primaryPhone);
    this.g2.primaryPhone = this.normalizeTenDigitPhone(this.g2.primaryPhone);
    if (!this.g1.fullName.trim() || !this.g1.primaryPhone.trim()) {
      this.submitErrorKey = 'students.form.primaryGuardianRequired';
      return false;
    }
    if (!this.isValidTenDigitPhone(this.g1.primaryPhone)) {
      this.submitErrorKey = 'students.form.phoneInvalidTenDigits';
      return false;
    }
    const rows = [this.g1, ...(this.includeSecondGuardian ? [this.g2] : [])];
    for (const g of rows) {
      const hasName = g.fullName.trim().length > 0;
      const hasPhone = (g.primaryPhone ?? '').trim().length > 0;
      if (hasName !== hasPhone) {
        this.submitErrorKey = 'students.form.guardianNamePhonePair';
        return false;
      }
      if (hasPhone && !this.isValidTenDigitPhone(g.primaryPhone)) {
        this.submitErrorKey = 'students.form.phoneInvalidTenDigits';
        return false;
      }
    }
    const p1 = (this.g1.primaryPhone ?? '').trim();
    const p2 = (this.g2.primaryPhone ?? '').trim();
    if (this.includeSecondGuardian && this.g1.fullName.trim() && this.g2.fullName.trim() && p1 && p2 && p1 === p2) {
      this.submitErrorKey = 'students.form.guardianDuplicatePhone';
      return false;
    }
    return true;
  }

  private async confirmLinkToExistingParentIfAny(): Promise<boolean> {
    if (runtimeConfig.useMocks) {
      return true;
    }
    const phone = this.g1.primaryPhone?.trim();
    if (!phone) {
      return true;
    }
    try {
      if (!this.parentLookupChecked) {
        await this.onPrimaryGuardianPhoneBlur();
      }
      const existing = this.existingParentMatch;
      if (!existing) {
        return true;
      }
      const message = this.translate.instant('students.form.parentPhoneExistsPrompt', {
        name: existing.fullName || this.translate.instant('students.form.existingParentFallbackName'),
        phone: existing.primaryPhone || phone,
      });
      return window.confirm(message);
    } catch {
      return true;
    }
  }

  showExistingParentChip(): boolean {
    if (runtimeConfig.useMocks) {
      return false;
    }
    const phone = this.g1.primaryPhone?.trim();
    return !!phone && (this.parentLookupLoading || this.parentLookupChecked || !!this.existingParentMatch);
  }

  goBack(): void { this.router.navigate(['/app/students']); }

  private normalizeTenDigitPhone(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '').slice(0, 10);
  }

  private isValidTenDigitPhone(value: string | null | undefined): boolean {
    return /^\d{10}$/.test((value ?? '').trim());
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }
}
