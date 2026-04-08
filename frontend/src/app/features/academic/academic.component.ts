import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { StudentService } from '../../core/services/student.service';
import { AcademicYear, SchoolClass, Student } from '../../core/models/models';

@Component({
  selector: 'app-academic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="academic-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Academic Management</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage academic years, classes, sections & promotions</p>
        </div>
      </div>
      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'years'" (click)="tab = 'years'" data-testid="tab-years">Academic Years</button>
        <button class="erp-tab" [class.active]="tab === 'classes'" (click)="tab = 'classes'" data-testid="tab-classes">Classes & Sections</button>
        <button class="erp-tab" [class.active]="tab === 'promotion'" (click)="tab = 'promotion'; loadPromotionData()" data-testid="tab-promotion">Class Promotion</button>
      </div>

      <div *ngIf="tab === 'years'" class="animate-in">
        <div class="d-flex justify-content-end mb-3">
          <button class="btn-primary-erp btn-sm" (click)="showAddYear = true" data-testid="add-year-btn"><i class="bi bi-plus-lg"></i> Add Academic Year</button>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let ay of academicYears">
            <div class="erp-card">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 style="font-size: 18px; font-weight: 700;">{{ ay.name }}</h4>
                <span class="badge-erp" [ngClass]="ay.isCurrent ? 'badge-success' : 'badge-neutral'">{{ ay.isCurrent ? 'Current' : 'Past' }}</span>
              </div>
              <div style="font-size: 13px; color: var(--clr-text-secondary);">
                <div class="mb-1"><i class="bi bi-calendar3 me-2"></i>Start: {{ ay.startDate }}</div>
                <div><i class="bi bi-calendar3 me-2"></i>End: {{ ay.endDate }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'classes'" class="animate-in">
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let cls of classes">
            <div class="erp-card" [attr.data-testid]="'class-card-' + cls.id">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 style="font-size: 16px; font-weight: 700;">{{ cls.name }}</h4>
                <span class="badge-erp badge-info">{{ cls.sections.length }} Sections</span>
              </div>
              <div *ngIf="cls.classTeacherName" style="font-size: 13px; color: var(--clr-text-secondary); margin-bottom: 12px;">
                <i class="bi bi-person-badge me-1"></i> Class Teacher: <strong>{{ cls.classTeacherName }}</strong>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <div *ngFor="let sec of cls.sections" style="flex: 1; min-width: 80px; background: var(--clr-bg); border-radius: var(--radius-md); padding: 10px; text-align: center;">
                  <div style="font-weight: 700; font-size: 15px;">{{ sec.name }}</div>
                  <div style="font-size: 12px; color: var(--clr-text-muted);">{{ sec.studentCount }}/{{ sec.capacity }}</div>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--clr-border-light); font-size: 12px; color: var(--clr-text-muted);">
                Total Students: <strong style="color: var(--clr-text);">{{ getTotalStudents(cls) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'promotion'" class="animate-in">
        <div class="erp-card mb-4">
          <h4 class="erp-card-title mb-3">Bulk Student Promotion</h4>
          <p style="font-size: 13px; color: var(--clr-text-muted); margin-bottom: 16px;">Promote students from one class to the next at the end of the academic year. Select source class and review students before confirming.</p>
          <div class="row g-3 align-items-end mb-4">
            <div class="col-md-3">
              <label class="erp-label">From Class</label>
              <select class="erp-select" [(ngModel)]="promoFromClass" (change)="loadPromotionStudents()" data-testid="promo-from-class">
                <option value="">Select Class</option>
                <option *ngFor="let cls of promotableClasses" [value]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="erp-label">To Class</label>
              <input type="text" class="erp-input" [value]="promoToClassName" disabled data-testid="promo-to-class">
            </div>
            <div class="col-md-3">
              <label class="erp-label">Academic Year</label>
              <input type="text" class="erp-input" value="2026-2027" disabled>
            </div>
            <div class="col-md-3">
              <button class="btn-primary-erp" style="width: 100%;" [disabled]="promoStudents.length === 0 || promoting" (click)="promoteStudents()" data-testid="promote-btn">
                <span class="spinner" *ngIf="promoting"></span>
                {{ promoting ? 'Promoting...' : 'Promote Selected' }}
              </button>
            </div>
          </div>
          <div *ngIf="promoStudents.length > 0">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span style="font-size: 13px; font-weight: 600;">{{ selectedForPromo }} / {{ promoStudents.length }} students selected</span>
              <button class="btn-outline-erp btn-xs" (click)="toggleAllPromo()">{{ allSelected ? 'Deselect All' : 'Select All' }}</button>
            </div>
            <table class="erp-table" data-testid="promotion-table">
              <thead><tr><th style="width: 40px;"><input type="checkbox" [checked]="allSelected" (change)="toggleAllPromo()"></th><th>Student</th><th>Roll No</th><th>Current Class</th><th>Promoted To</th><th>Avg Score</th><th>Status</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of promoStudents">
                  <td><input type="checkbox" [(ngModel)]="s.selected"></td>
                  <td><strong>{{ s.firstName }} {{ s.lastName }}</strong></td>
                  <td>{{ s.rollNumber }}</td>
                  <td>{{ s.className }}</td>
                  <td style="color: var(--clr-success); font-weight: 600;">{{ promoToClassName }}</td>
                  <td>{{ s.avgScore }}%</td>
                  <td><span class="badge-erp" [ngClass]="s.avgScore >= 40 ? 'badge-success' : 'badge-danger'">{{ s.avgScore >= 40 ? 'Eligible' : 'Detained' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="promoStudents.length === 0 && promoFromClass" class="empty-state">
            <i class="bi bi-people"></i><h3>No Students Found</h3><p>No students found in the selected class</p>
          </div>
          <div *ngIf="promotionDone" style="margin-top: 16px; padding: 16px; background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2); border-radius: var(--radius-lg);">
            <div style="color: var(--clr-success); font-weight: 700;"><i class="bi bi-check-circle-fill me-2"></i>Promotion Successful!</div>
            <p style="font-size: 13px; margin: 4px 0 0 0; color: var(--clr-text-secondary);">{{ selectedForPromo }} students promoted to {{ promoToClassName }}.</p>
          </div>
        </div>
      </div>

      <!-- Add Year Modal -->
      <div class="modal-overlay" *ngIf="showAddYear" (click)="showAddYear = false">
        <div class="modal-content-erp" (click)="$event.stopPropagation()">
          <div class="modal-header-erp"><h3>New Academic Year</h3><button class="btn-icon" (click)="showAddYear = false"><i class="bi bi-x-lg"></i></button></div>
          <div class="modal-body-erp">
            <div class="erp-form-group"><label class="erp-label">Year Name</label><input type="text" class="erp-input" [(ngModel)]="newYear.name" placeholder="e.g. 2026-2027"></div>
            <div class="row g-3">
              <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">Start Date</label><input type="date" class="erp-input" [(ngModel)]="newYear.startDate"></div></div>
              <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">End Date</label><input type="date" class="erp-input" [(ngModel)]="newYear.endDate"></div></div>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button class="btn-outline-erp" (click)="showAddYear = false">Cancel</button>
            <button class="btn-primary-erp" (click)="addYear()">Create</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AcademicComponent implements OnInit {
  tab = 'years';
  academicYears: AcademicYear[] = [];
  classes: SchoolClass[] = [];
  showAddYear = false;
  newYear = { name: '', startDate: '', endDate: '' };

  // Promotion
  promoFromClass = '';
  promoToClassName = '';
  promoStudents: any[] = [];
  promoting = false;
  promotionDone = false;
  allSelected = true;

  constructor(private academicService: AcademicService, private studentService: StudentService) {}

  ngOnInit(): void {
    this.academicService.getAcademicYears().subscribe(years => this.academicYears = years);
    this.academicService.getClasses().subscribe(classes => this.classes = classes);
  }

  get promotableClasses(): SchoolClass[] { return this.classes.filter(c => c.grade < 12); }
  get selectedForPromo(): number { return this.promoStudents.filter(s => s.selected).length; }

  getTotalStudents(cls: SchoolClass): number { return cls.sections.reduce((sum, s) => sum + s.studentCount, 0); }

  loadPromotionData(): void { /* no-op, classes already loaded */ }

  loadPromotionStudents(): void {
    this.promotionDone = false;
    if (!this.promoFromClass) { this.promoStudents = []; return; }
    const fromCls = this.classes.find(c => c.id === this.promoFromClass);
    const toGrade = fromCls ? fromCls.grade + 1 : 0;
    const toCls = this.classes.find(c => c.grade === toGrade);
    this.promoToClassName = toCls ? toCls.name : 'Class ' + toGrade;
    this.studentService.getStudentsByClass(this.promoFromClass).subscribe(students => {
      this.promoStudents = students.map(s => ({ ...s, selected: true, avgScore: 40 + Math.floor(Math.random() * 55) }));
      this.allSelected = true;
    });
  }

  toggleAllPromo(): void {
    this.allSelected = !this.allSelected;
    this.promoStudents.forEach(s => s.selected = this.allSelected);
  }

  promoteStudents(): void {
    this.promoting = true;
    setTimeout(() => {
      this.promoting = false;
      this.promotionDone = true;
    }, 1500);
  }

  addYear(): void {
    if (!this.newYear.name) return;
    const ay: AcademicYear = { id: 'ay' + Date.now(), name: this.newYear.name, startDate: this.newYear.startDate, endDate: this.newYear.endDate, isCurrent: false, tenantId: 't1' };
    this.academicService.addAcademicYear(ay).subscribe(a => {
      this.academicYears.push(a);
      this.showAddYear = false;
      this.newYear = { name: '', startDate: '', endDate: '' };
    });
  }
}
