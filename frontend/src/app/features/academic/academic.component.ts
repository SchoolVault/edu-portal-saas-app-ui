import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicService } from '../../core/services/academic.service';
import { AcademicYear, SchoolClass } from '../../core/models/models';

@Component({
  selector: 'app-academic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="academic-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">Academic Management</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Manage academic years, classes, and sections</p>
        </div>
      </div>
      <div class="erp-tabs animate-in">
        <button class="erp-tab" [class.active]="tab === 'years'" (click)="tab = 'years'" data-testid="tab-years">Academic Years</button>
        <button class="erp-tab" [class.active]="tab === 'classes'" (click)="tab = 'classes'" data-testid="tab-classes">Classes & Sections</button>
      </div>

      <div *ngIf="tab === 'years'" class="animate-in">
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let ay of academicYears">
            <div class="erp-card">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 style="font-size: 18px; font-weight: 700;">{{ ay.name }}</h4>
                <span class="badge-erp" [ngClass]="ay.isCurrent ? 'badge-success' : 'badge-neutral'">
                  {{ ay.isCurrent ? 'Current' : 'Past' }}
                </span>
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
            </div>
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

  constructor(private academicService: AcademicService) {}

  ngOnInit(): void {
    this.academicService.getAcademicYears().subscribe(years => this.academicYears = years);
    this.academicService.getClasses().subscribe(classes => this.classes = classes);
  }
}
