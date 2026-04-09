import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { GuardianService } from '../../core/services/guardian.service';
import { Student, SchoolClass } from '../../core/models/models';
import { BLOOD_GROUPS, GENDERS } from '../../core/config/app-constants';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="student-form-page" class="animate-in">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-icon" (click)="goBack()" data-testid="back-btn"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></button>
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ isEdit ? 'Edit Student' : 'Add New Student' }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ isEdit ? 'Update student information' : 'Register a new student' }}</p>
        </div>
      </div>
      <div class="erp-card">
        <form (ngSubmit)="onSubmit()" data-testid="student-form">
          <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--clr-primary);">Personal Information</h4>
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">First Name *</label>
                <input type="text" class="erp-input" [(ngModel)]="student.firstName" name="firstName" required data-testid="student-firstName">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Last Name *</label>
                <input type="text" class="erp-input" [(ngModel)]="student.lastName" name="lastName" required data-testid="student-lastName">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Email</label>
                <input type="email" class="erp-input" [(ngModel)]="student.email" name="email" data-testid="student-email">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Phone</label>
                <input type="text" class="erp-input" [(ngModel)]="student.phone" name="phone" data-testid="student-phone">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Date of Birth *</label>
                <input type="date" class="erp-input" [(ngModel)]="student.dateOfBirth" name="dob" required data-testid="student-dob">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Gender *</label>
                <select class="erp-select" [(ngModel)]="student.gender" name="gender" required data-testid="student-gender">
                  <option value="">Select</option>
                  <option *ngFor="let g of genders" [value]="g">{{ g | titlecase }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Blood Group</label>
                <select class="erp-select" [(ngModel)]="student.bloodGroup" name="bloodGroup" data-testid="student-blood-group">
                  <option value="">Select</option>
                  <option *ngFor="let bg of bloodGroups" [value]="bg">{{ bg }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-8">
              <div class="erp-form-group"><label class="erp-label">Address</label>
                <input type="text" class="erp-input" [(ngModel)]="student.address" name="address" data-testid="student-address">
              </div>
            </div>
          </div>

          <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--clr-primary);">Academic Information</h4>
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Class *</label>
                <select class="erp-select" [(ngModel)]="student.classId" name="classId" required (change)="onClassChange()" data-testid="student-class">
                  <option value="">Select Class</option>
                  <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Section *</label>
                <select class="erp-select" [(ngModel)]="student.sectionId" name="sectionId" required data-testid="student-section">
                  <option value="">Select Section</option>
                  <option *ngFor="let sec of availableSections" [value]="sec.id">{{ sec.name }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Roll Number</label>
                <input type="text" class="erp-input" [(ngModel)]="student.rollNumber" name="rollNumber" data-testid="student-roll">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Admission Number</label>
                <input type="text" class="erp-input" [(ngModel)]="student.admissionNumber" name="admissionNumber" data-testid="student-admission-no">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Admission Date</label>
                <input type="date" class="erp-input" [(ngModel)]="student.admissionDate" name="admissionDate" data-testid="student-admission-date">
              </div>
            </div>
            <div class="col-md-4">
              <div class="erp-form-group"><label class="erp-label">Primary parent / guardian (legacy display)</label>
                <input type="text" class="erp-input" [(ngModel)]="student.parentName" name="parentName" data-testid="student-parent-name" placeholder="Optional if detailed below">
              </div>
            </div>
          </div>

          <h4 *ngIf="!isEdit" style="font-size: 15px; font-weight: 700; margin-bottom: 20px; color: var(--clr-primary);">Parents / guardians (API)</h4>
          <div *ngIf="!isEdit" class="row g-3 mb-4">
            <div class="col-12"><p class="text-muted small mb-0">Add up to two contacts (name + phone recommended). Saved as guardian records and linked to the student when not in mock mode.</p></div>
            <div class="col-md-6 erp-card p-3">
              <div class="erp-form-group"><label class="erp-label">Guardian 1 — name</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.fullName" name="g1name"></div>
              <div class="erp-form-group"><label class="erp-label">Phone</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.primaryPhone" name="g1phone"></div>
              <div class="erp-form-group"><label class="erp-label">Occupation</label>
                <input type="text" class="erp-input" [(ngModel)]="g1.occupation" name="g1job"></div>
              <div class="erp-form-group"><label class="erp-label">Relation</label>
                <select class="erp-select" [(ngModel)]="g1.relationType" name="g1rel">
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="OTHER">Other</option>
                </select></div>
            </div>
            <div class="col-md-6 erp-card p-3">
              <div class="erp-form-group"><label class="erp-label">Guardian 2 — name (optional)</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.fullName" name="g2name"></div>
              <div class="erp-form-group"><label class="erp-label">Phone</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.primaryPhone" name="g2phone"></div>
              <div class="erp-form-group"><label class="erp-label">Occupation</label>
                <input type="text" class="erp-input" [(ngModel)]="g2.occupation" name="g2job"></div>
              <div class="erp-form-group"><label class="erp-label">Relation</label>
                <select class="erp-select" [(ngModel)]="g2.relationType" name="g2rel">
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                  <option value="OTHER">Other</option>
                </select></div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-3">
            <button type="button" class="btn-outline-erp" (click)="goBack()" data-testid="cancel-btn">Cancel</button>
            <button type="submit" class="btn-primary-erp" [disabled]="saving" data-testid="save-student-btn">
              <span class="spinner" *ngIf="saving"></span>
              {{ saving ? 'Saving...' : (isEdit ? 'Update Student' : 'Add Student') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class StudentFormComponent implements OnInit {
  student: Partial<Student> = { status: 'active', tenantId: 't1', gender: '', classId: '', sectionId: '', bloodGroup: '' };
  classes: SchoolClass[] = [];
  availableSections: { id: string; name: string }[] = [];
  genders = GENDERS;
  bloodGroups = BLOOD_GROUPS;
  isEdit = false;
  saving = false;
  g1 = { fullName: '', primaryPhone: '', occupation: '', relationType: 'FATHER' as const };
  g2 = { fullName: '', primaryPhone: '', occupation: '', relationType: 'MOTHER' as const };

  constructor(
    private studentService: StudentService,
    private academicService: AcademicService,
    private guardianService: GuardianService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.academicService.getClasses().subscribe(classes => {
      this.classes = classes;
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.studentService.getStudentById(id).subscribe(s => {
        if (s) {
          this.student = { ...s };
          this.onClassChange();
        }
      });
    }
  }

  onClassChange(): void {
    const cls = this.classes.find(c => c.id === this.student.classId);
    this.availableSections = cls ? cls.sections.map(s => ({ id: s.id, name: s.name })) : [];
    if (cls) this.student.className = cls.name;
  }

  onSubmit(): void {
    if (!this.student.firstName || !this.student.lastName || !this.student.classId) return;
    this.saving = true;
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
}
