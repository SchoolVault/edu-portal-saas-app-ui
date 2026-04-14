import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { GuardianService } from '../../core/services/guardian.service';
import { AuthService } from '../../core/services/auth.service';
import { Student, SchoolClass } from '../../core/models/models';
import { BLOOD_GROUPS, GENDERS, STUDENT_STATUS } from '../../core/config/app-constants';
import { runtimeConfig } from '../../core/config/runtime-config';
import { canUploadStudentDirectoryPhoto } from '../../core/policy/profile-photo-upload.policy';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

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
                <input type="text" class="erp-input" [(ngModel)]="student.phone" name="phone" data-testid="student-phone">
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
                <input type="text" class="erp-input" [(ngModel)]="g1.fullName" name="g1name"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.phone' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.primaryPhone" name="g1phone"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.occupation' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.occupation" name="g1job"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.relation' | translate }}</label>
                <select class="erp-select" [(ngModel)]="g1.relationType" name="g1rel">
                  <option value="FATHER">{{ 'students.enums.guardianRelation.FATHER' | translate }}</option>
                  <option value="MOTHER">{{ 'students.enums.guardianRelation.MOTHER' | translate }}</option>
                  <option value="GUARDIAN">{{ 'students.enums.guardianRelation.GUARDIAN' | translate }}</option>
                  <option value="OTHER">{{ 'students.enums.guardianRelation.OTHER' | translate }}</option>
                </select></div>
            </div>
            <div class="col-md-6 erp-card p-3">
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.g2name' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.fullName" name="g2name"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.phone' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.primaryPhone" name="g2phone"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.occupation' | translate }}</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.occupation" name="g2job"></div>
              <div class="erp-form-group"><label class="erp-label">{{ 'students.form.relation' | translate }}</label>
                <select class="erp-select" [(ngModel)]="g2.relationType" name="g2rel">
                  <option value="FATHER">{{ 'students.enums.guardianRelation.FATHER' | translate }}</option>
                  <option value="MOTHER">{{ 'students.enums.guardianRelation.MOTHER' | translate }}</option>
                  <option value="GUARDIAN">{{ 'students.enums.guardianRelation.GUARDIAN' | translate }}</option>
                  <option value="OTHER">{{ 'students.enums.guardianRelation.OTHER' | translate }}</option>
                </select></div>
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
  studentDirectoryPreview: string | null = null;
  g1 = { fullName: '', primaryPhone: '', occupation: '', relationType: 'FATHER' as const };
  g2 = { fullName: '', primaryPhone: '', occupation: '', relationType: 'MOTHER' as const };
  private langSub?: Subscription;

  get isAdmin(): boolean {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  constructor(
    private studentService: StudentService,
    private academicService: AcademicService,
    private guardianService: GuardianService,
    private auth: AuthService,
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
        }
      });
    }
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

  onSubmit(): void {
    if (!this.student.firstName || !this.student.lastName || this.student.classId == null || this.student.classId === 0) {
      return;
    }
    if (this.sectionRequired && (this.student.sectionId == null || this.student.sectionId === 0)) return;
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
      this.studentService.updateStudent(this.student.id, this.student).subscribe(() => {
        this.saving = false;
        this.router.navigate(['/app/students']);
      });
    } else {
      fillLegacyParentName();
      this.student.admissionNumber = this.student.admissionNumber || ('ADM' + Date.now().toString().slice(-6));
      this.studentService.addStudent(this.student as Omit<Student, 'id'>).subscribe({
        next: async created => {
          const extras = [this.g1, this.g2].filter(g => g.fullName.trim().length > 0);
          if (!runtimeConfig.useMocks && extras.length > 0) {
            try {
              for (let i = 0; i < extras.length; i++) {
                const g = extras[i];
                const gr = await firstValueFrom(this.guardianService.createGuardian({
                  fullName: g.fullName.trim(),
                  primaryPhone: g.primaryPhone?.trim() || undefined,
                  occupation: g.occupation?.trim() || undefined
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
        error: () => { this.saving = false; }
      });
    }
  }

  goBack(): void { this.router.navigate(['/app/students']); }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }
}
