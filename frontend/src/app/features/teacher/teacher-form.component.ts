import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TeacherService } from '../../core/services/teacher.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { SubjectCatalogItem, Teacher } from '../../core/models/models';
import { canAdminSetTeacherDirectoryPhoto } from '../../core/policy/profile-photo-upload.policy';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePhotoPickerComponent],
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
            <div class="col-12">
              <div class="erp-form-group">
                <label class="erp-label">Subjects (from school catalog)</label>
                <p class="text-muted small mb-2" *ngIf="catalogLoading">Loading catalog…</p>
                <div *ngIf="!catalogLoading && subjectsByCategory().length === 0" class="text-muted small">No subjects configured for this school.</div>
                <div *ngFor="let group of subjectsByCategory()" class="mb-3">
                  <div class="fw-semibold small text-uppercase text-muted mb-1">{{ group[0] }}</div>
                  <div class="d-flex flex-wrap gap-3">
                    <label *ngFor="let s of group[1]" class="d-flex align-items-center gap-2 small mb-0" style="cursor: pointer;">
                      <input type="checkbox" [checked]="catalogSubjectSelected(s.name)" (change)="toggleCatalogSubject(s.name)">
                      <span>{{ s.name }}<span *ngIf="s.code" class="text-muted"> ({{ s.code }})</span></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12">
              <div class="erp-form-group">
                <label class="erp-label">Additional subjects (optional)</label>
                <input type="text" class="erp-input" [(ngModel)]="additionalSubjectsRaw" name="additionalSubjects" placeholder="e.g. Music, Drama — comma-separated">
                <div class="small text-muted mt-1">Use for subjects not yet in the catalog; admins can add them to the master list later.</div>
              </div>
            </div>
            <div class="col-12" *ngIf="canSetTeacherDirectoryPhoto()">
              <div class="pt-3 mt-2" style="border-top: 1px solid var(--clr-border-light);">
                <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 8px; color: var(--clr-primary);">Directory photo</h4>
                <p class="text-muted small mb-3">Admin-only in this release. Demo storage matches future teacher avatar API.</p>
                <app-profile-photo-picker
                  [previewUrl]="teacherDirectoryPreview"
                  [initials]="teacherDirectoryInitials()"
                  [frameAriaLabel]="'Set teacher directory photo'"
                  (photoPicked)="onTeacherDirPhotoPicked($event)"
                  (photoRemoved)="onTeacherDirPhotoRemoved()"
                />
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-end gap-3">
            <button type="button" class="btn-outline-erp" (click)="goBack()">Cancel</button>
            <button type="submit" class="btn-primary-erp" [disabled]="saving || catalogLoading" data-testid="save-teacher-btn">
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
  subjectCatalog: SubjectCatalogItem[] = [];
  catalogLoading = true;
  additionalSubjectsRaw = '';
  isEdit = false;
  saving = false;
  teacherDirectoryPreview: string | null = null;

  constructor(
    private teacherService: TeacherService,
    private academicService: AcademicService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.auth.fetchProfileSummary().subscribe({ error: () => void 0 });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.isEdit = true;

    this.academicService.getSubjectCatalog().subscribe({
      next: cat => {
        this.subjectCatalog = cat;
        this.catalogLoading = false;
        if (this.isEdit && id) {
          this.teacherService.getTeacherById(id).subscribe(t => {
            if (t) this.applyTeacherFromApi(t);
          });
        }
      },
      error: () => {
        this.subjectCatalog = [];
        this.catalogLoading = false;
      }
    });
  }

  subjectsByCategory(): [string, SubjectCatalogItem[]][] {
    const m = new Map<string, SubjectCatalogItem[]>();
    for (const s of this.subjectCatalog) {
      const c = s.category?.trim() || 'Other';
      if (!m.has(c)) m.set(c, []);
      m.get(c)!.push(s);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  catalogSubjectSelected(name: string): boolean {
    return (this.teacher.subjects ?? []).includes(name);
  }

  toggleCatalogSubject(name: string): void {
    if (!this.teacher.subjects) this.teacher.subjects = [];
    const i = this.teacher.subjects.indexOf(name);
    if (i >= 0) this.teacher.subjects.splice(i, 1);
    else this.teacher.subjects.push(name);
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
      this.auth.getDirectoryTeacherAvatarDataUrl(String(this.teacher.id)) || this.teacher.avatar || null;
  }

  onTeacherDirPhotoPicked(ev: ProfilePhotoPickEvent): void {
    if (!this.teacher.id) return;
    this.auth.setDirectoryTeacherAvatarDataUrl(String(this.teacher.id), ev.dataUrl);
    this.refreshTeacherDirectoryPreview();
  }

  onTeacherDirPhotoRemoved(): void {
    if (!this.teacher.id) return;
    this.auth.clearDirectoryTeacherAvatar(String(this.teacher.id));
    this.refreshTeacherDirectoryPreview();
  }

  private applyTeacherFromApi(t: Teacher): void {
    const catNames = new Set(this.subjectCatalog.map(s => s.name));
    const all = [...(t.subjects ?? [])];
    this.teacher = { ...t, subjects: all.filter(s => catNames.has(s)) };
    this.additionalSubjectsRaw = all.filter(s => !catNames.has(s)).join(', ');
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
    if (!this.teacher.firstName || !this.teacher.lastName || !this.teacher.email) return;
    this.saving = true;
    const payload = { ...this.teacher, subjects: this.mergeSubjectsForSave() };
    if (this.isEdit && payload.id) {
      this.teacherService.updateTeacher(payload.id, payload).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/app/teachers']); },
        error: () => { this.saving = false; }
      });
    } else {
      this.teacherService.addTeacher(payload as Omit<Teacher, 'id'>).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/app/teachers']); },
        error: () => { this.saving = false; }
      });
    }
  }

  goBack(): void { this.router.navigate(['/app/teachers']); }
}
