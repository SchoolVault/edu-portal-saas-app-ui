import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TeacherService } from '../../core/services/teacher.service';
import { Teacher } from '../../core/models/models';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div data-testid="teacher-form-page" class="animate-in">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn-icon" (click)="goBack()"><i class="bi bi-arrow-left" style="font-size: 20px;"></i></button>
        <h2 style="font-size: 24px; font-weight: 800;">{{ isEdit ? 'Edit Teacher' : 'Add Teacher' }}</h2>
      </div>
      <div class="erp-card">
        <form (ngSubmit)="onSubmit()" data-testid="teacher-form">
          <div class="row g-3 mb-4">
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">First Name *</label><input type="text" class="erp-input" [(ngModel)]="teacher.firstName" name="firstName" required></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">Last Name *</label><input type="text" class="erp-input" [(ngModel)]="teacher.lastName" name="lastName" required></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">Email *</label><input type="email" class="erp-input" [(ngModel)]="teacher.email" name="email" required></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">Phone</label><input type="text" class="erp-input" [(ngModel)]="teacher.phone" name="phone"></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">Qualification</label><input type="text" class="erp-input" [(ngModel)]="teacher.qualification" name="qualification"></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">Specialization</label><input type="text" class="erp-input" [(ngModel)]="teacher.specialization" name="specialization"></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">Join Date</label><input type="date" class="erp-input" [(ngModel)]="teacher.joinDate" name="joinDate"></div></div>
            <div class="col-md-4"><div class="erp-form-group"><label class="erp-label">Salary</label><input type="number" class="erp-input" [(ngModel)]="teacher.salary" name="salary"></div></div>
          </div>
          <div class="d-flex justify-content-end gap-3">
            <button type="button" class="btn-outline-erp" (click)="goBack()">Cancel</button>
            <button type="submit" class="btn-primary-erp" [disabled]="saving" data-testid="save-teacher-btn">
              {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Add Teacher') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class TeacherFormComponent implements OnInit {
  teacher: Partial<Teacher> = { status: 'active', tenantId: 't1', subjects: [], classIds: [], salary: 0 };
  isEdit = false;
  saving = false;

  constructor(private teacherService: TeacherService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.teacherService.getTeacherById(id).subscribe(t => { if (t) this.teacher = { ...t }; });
    }
  }

  onSubmit(): void {
    if (!this.teacher.firstName || !this.teacher.lastName || !this.teacher.email) return;
    this.saving = true;
    if (this.isEdit && this.teacher.id) {
      this.teacherService.updateTeacher(this.teacher.id, this.teacher).subscribe(() => { this.saving = false; this.router.navigate(['/app/teachers']); });
    } else {
      this.teacherService.addTeacher(this.teacher as Omit<Teacher, 'id'>).subscribe(() => { this.saving = false; this.router.navigate(['/app/teachers']); });
    }
  }

  goBack(): void { this.router.navigate(['/app/teachers']); }
}
