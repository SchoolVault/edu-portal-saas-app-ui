import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService } from '../../core/services/student.service';
import { AcademicService } from '../../core/services/academic.service';
import { Student, SchoolClass } from '../../core/models/models';
import { BLOOD_GROUPS, GENDERS } from '../../core/config/app-constants';

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
              <div class="erp-form-group"><label class="erp-label">Parent Name</label>
                <input type="text" class="erp-input" [(ngModel)]="student.parentName" name="parentName" data-testid="student-parent-name">
              </div>
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

  constructor(
    private studentService: StudentService,
    private academicService: AcademicService,
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

    if (this.isEdit && this.student.id) {
      this.studentService.updateStudent(this.student.id, this.student).subscribe(() => {
        this.saving = false;
        this.router.navigate(['/app/students']);
      });
    } else {
      this.student.admissionNumber = this.student.admissionNumber || ('ADM' + Date.now().toString().slice(-6));
      this.studentService.addStudent(this.student as Omit<Student, 'id'>).subscribe(() => {
        this.saving = false;
        this.router.navigate(['/app/students']);
      });
    }
  }

  goBack(): void { this.router.navigate(['/app/students']); }
}
