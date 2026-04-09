import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { AcademicYear, PromotionPreview, SchoolClass, Teacher } from '../../core/models/models';

@Component({
  selector: 'app-academic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="academic-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Academic Management</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage academic years, classes, sections, and promotion workflows</p>
        </div>
      </div>
      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'years'" (click)="tab = 'years'">Academic Years</button>
        <button class="erp-tab" [class.active]="tab === 'classes'" (click)="tab = 'classes'">Classes & Sections</button>
        <button class="erp-tab" [class.active]="tab === 'promotion'" (click)="activatePromotionTab()">Class Promotion</button>
      </div>

      <div *ngIf="tab === 'years'" class="animate-in">
        <div class="d-flex justify-content-end mb-3">
          <button class="btn-primary-erp btn-sm" (click)="showAddYear = true"><i class="bi bi-plus-lg"></i> Add Academic Year</button>
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
        <div class="erp-card mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h4 class="erp-card-title mb-1">Class Teacher Assignment</h4>
              <p class="text-muted mb-0" style="font-size: 12px;">Every class can have one class teacher. Sections are optional.</p>
            </div>
          </div>
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="erp-label">Class</label>
              <select class="erp-select" [(ngModel)]="assignClassId">
                <option value="">Select class</option>
                <option *ngFor="let cls of classes" [value]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-5">
              <label class="erp-label">Teacher</label>
              <select class="erp-select" [(ngModel)]="assignTeacherId">
                <option value="">Unassigned</option>
                <option *ngFor="let t of teachers" [value]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn-primary-erp" style="width: 100%;" [disabled]="!assignClassId || assigningTeacher" (click)="saveClassTeacher()">
                <span class="spinner" *ngIf="assigningTeacher"></span>
                {{ assigningTeacher ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let cls of classes">
            <div class="erp-card">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 style="font-size: 16px; font-weight: 700;">{{ cls.name }}</h4>
                <span class="badge-erp badge-info">{{ cls.sections.length }} Sections</span>
              </div>
              <div *ngIf="cls.classTeacherName" style="font-size: 13px; color: var(--clr-text-secondary); margin-bottom: 12px;">
                <i class="bi bi-person-badge me-1"></i> Class Teacher: <strong>{{ cls.classTeacherName }}</strong>
              </div>
              <div *ngIf="!cls.classTeacherName" style="font-size: 13px; color: var(--clr-text-muted); margin-bottom: 12px;">
                <i class="bi bi-person-badge me-1"></i> Class Teacher: <strong>Not assigned</strong>
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
          <p style="font-size: 13px; color: var(--clr-text-muted); margin-bottom: 16px;">Preview the next class, review eligible students, and run promotion against real academic records.</p>
          <div class="row g-3 align-items-end mb-4">
            <div class="col-md-4">
              <label class="erp-label">From Class</label>
              <select class="erp-select" [(ngModel)]="promoFromClass" (change)="loadPromotionPreview()">
                <option value="">Select Class</option>
                <option *ngFor="let cls of promotableClasses" [value]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">To Class</label>
              <input type="text" class="erp-input" [value]="promotionPreview?.targetClassName || ''" disabled>
            </div>
            <div class="col-md-4">
              <button class="btn-primary-erp" style="width: 100%;" [disabled]="selectedForPromo === 0 || promoting" (click)="promoteStudents()">
                <span class="spinner" *ngIf="promoting"></span>
                {{ promoting ? 'Promoting...' : 'Promote Selected' }}
              </button>
            </div>
          </div>

          <div *ngIf="promotionLoading" class="empty-state">
            <i class="bi bi-hourglass-split"></i><h3>Loading Preview</h3><p>Fetching live promotion data</p>
          </div>

          <div *ngIf="promotionPreview && promotionPreview.students.length > 0">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span style="font-size: 13px; font-weight: 600;">{{ selectedForPromo }} / {{ promotionPreview.students.length }} students selected</span>
              <button class="btn-outline-erp btn-xs" (click)="toggleAllPromo()">{{ allSelected ? 'Deselect All' : 'Select All' }}</button>
            </div>
            <table class="erp-table">
              <thead><tr><th style="width: 40px;"><input type="checkbox" [checked]="allSelected" (change)="toggleAllPromo()"></th><th>Student</th><th>Roll No</th><th>Current Class</th><th>Promoted To</th><th>Avg Score</th><th>Status</th></tr></thead>
              <tbody>
                <tr *ngFor="let student of promotionPreview.students">
                  <td><input type="checkbox" [(ngModel)]="student.selected" [disabled]="!student.eligible"></td>
                  <td><strong>{{ student.firstName }} {{ student.lastName }}</strong></td>
                  <td>{{ student.rollNumber }}</td>
                  <td>{{ student.currentClassName }}</td>
                  <td style="color: var(--clr-success); font-weight: 600;">{{ promotionPreview.targetClassName }}</td>
                  <td>{{ student.averageScore | number:'1.0-1' }}%</td>
                  <td><span class="badge-erp" [ngClass]="student.eligible ? 'badge-success' : 'badge-danger'">{{ student.eligible ? 'Eligible' : 'Detained' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="promotionPreview && promotionPreview.students.length === 0" class="empty-state">
            <i class="bi bi-people"></i><h3>No Students Found</h3><p>No students are available for promotion in the selected class</p>
          </div>

          <div *ngIf="promotionDone" style="margin-top: 16px; padding: 16px; background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2); border-radius: var(--radius-lg);">
            <div style="color: var(--clr-success); font-weight: 700;"><i class="bi bi-check-circle-fill me-2"></i>Promotion Successful</div>
            <p style="font-size: 13px; margin: 4px 0 0 0; color: var(--clr-text-secondary);">{{ promotionDone }}</p>
          </div>
        </div>
      </div>

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
  teachers: Teacher[] = [];
  assignClassId = '';
  assignTeacherId = '';
  assigningTeacher = false;
  showAddYear = false;
  newYear = { name: '', startDate: '', endDate: '' };
  promoFromClass = '';
  promotionPreview: PromotionPreview | null = null;
  promotionLoading = false;
  promoting = false;
  promotionDone = '';
  allSelected = true;

  constructor(private academicService: AcademicService, private teacherService: TeacherService) {}

  ngOnInit(): void {
    this.reloadData();
    this.teacherService.getTeachers().subscribe(list => (this.teachers = list));
  }

  get promotableClasses(): SchoolClass[] {
    return this.classes.filter(cls => cls.grade < 12);
  }

  get selectedForPromo(): number {
    return this.promotionPreview?.students.filter(student => student.selected).length ?? 0;
  }

  getTotalStudents(cls: SchoolClass): number {
    return cls.sections.reduce((sum, section) => sum + section.studentCount, 0);
  }

  saveClassTeacher(): void {
    if (!this.assignClassId) return;
    const t = this.teachers.find(x => x.id === this.assignTeacherId);
    this.assigningTeacher = true;
    this.academicService.assignClassTeacher(this.assignClassId, this.assignTeacherId || null, t ? `${t.firstName} ${t.lastName}` : undefined).subscribe({
      next: updated => {
        this.classes = this.classes.map(c => (c.id === updated.id ? updated : c));
        this.assigningTeacher = false;
      },
      error: () => {
        this.assigningTeacher = false;
      }
    });
  }

  activatePromotionTab(): void {
    this.tab = 'promotion';
    this.promotionDone = '';
  }

  loadPromotionPreview(): void {
    this.promotionDone = '';
    this.promotionPreview = null;
    if (!this.promoFromClass) {
      return;
    }
    this.promotionLoading = true;
    this.academicService.previewPromotion(this.promoFromClass).subscribe({
      next: preview => {
        this.promotionPreview = preview;
        this.allSelected = preview.students.every(student => student.selected);
        this.promotionLoading = false;
      },
      error: () => {
        this.promotionLoading = false;
      }
    });
  }

  toggleAllPromo(): void {
    if (!this.promotionPreview) {
      return;
    }
    this.allSelected = !this.allSelected;
    this.promotionPreview.students.forEach(student => {
      if (student.eligible) {
        student.selected = this.allSelected;
      }
    });
  }

  promoteStudents(): void {
    if (!this.promotionPreview) {
      return;
    }
    const studentIds = this.promotionPreview.students.filter(student => student.selected).map(student => student.studentId);
    if (!studentIds.length) {
      return;
    }
    this.promoting = true;
    this.academicService.executePromotion(
      this.promotionPreview.sourceClassId,
      this.promotionPreview.targetClassId,
      studentIds,
      this.promotionPreview.defaultSectionId
    ).subscribe({
      next: result => {
        this.promoting = false;
        this.promotionDone = `${result.promotedCount} students promoted to ${result.targetClassName}${result.targetSectionName ? ' - Section ' + result.targetSectionName : ''}.`;
        this.reloadData();
        this.loadPromotionPreview();
      },
      error: () => {
        this.promoting = false;
      }
    });
  }

  addYear(): void {
    if (!this.newYear.name) {
      return;
    }
    const academicYear: AcademicYear = {
      id: '',
      name: this.newYear.name,
      startDate: this.newYear.startDate,
      endDate: this.newYear.endDate,
      isCurrent: false,
      tenantId: ''
    };
    this.academicService.addAcademicYear(academicYear).subscribe(created => {
      this.academicYears = [...this.academicYears, created];
      this.showAddYear = false;
      this.newYear = { name: '', startDate: '', endDate: '' };
    });
  }

  private reloadData(): void {
    this.academicService.getAcademicYears().subscribe(years => this.academicYears = years);
    this.academicService.getClasses().subscribe(classes => this.classes = classes);
  }
}
