import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TeacherService } from '../../core/services/teacher.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { Teacher, SchoolClass } from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div data-testid="teacher-profile-page" class="animate-in" *ngIf="teacher">
      <div class="d-flex align-items-center gap-3 mb-4">
        <button type="button" class="btn-icon" (click)="router.navigate(['/app/teachers'])" data-testid="back-teachers">
          <i class="bi bi-arrow-left" style="font-size: 20px;"></i>
        </button>
        <div class="flex-grow-1">
          <h2 style="font-size: 24px; font-weight: 800;">Teacher profile</h2>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
          <a *ngIf="isAdmin" [routerLink]="['/app/teachers', teacher.id, 'edit']" class="btn-primary-erp btn-sm">
            <i class="bi bi-pencil"></i> Edit
          </a>
          <button
            *ngIf="isAdmin && teacher.status === 'active'"
            type="button"
            class="btn-outline-erp btn-sm"
            style="border-color: var(--clr-danger); color: var(--clr-danger);"
            [disabled]="lifecycleBusy"
            (click)="deactivateTeacher()"
          >
            Deactivate
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="erp-card text-center" style="padding: 28px;">
            <img
              *ngIf="portraitUrl as src"
              [src]="src"
              alt=""
              class="mx-auto mb-3 d-block rounded-circle"
              style="width: 80px; height: 80px; object-fit: cover; border: 2px solid var(--clr-border);"
            />
            <div
              *ngIf="!portraitUrl"
              class="profile-avatar mx-auto mb-3"
              style="width: 80px; height: 80px; font-size: 28px; background: var(--clr-primary); color: #fff;"
            >
              {{ teacher.firstName[0] }}{{ teacher.lastName[0] }}
            </div>
            <h3 style="font-size: 20px; font-weight: 700;">{{ teacher.firstName }} {{ teacher.lastName }}</h3>
            <p class="text-muted" style="font-size: 13px;">{{ teacher.specialization }}</p>
            <span class="badge-erp" [ngClass]="teacher.status === 'active' ? 'badge-success' : 'badge-neutral'">{{ teacher.status }}</span>
            <hr style="border-color: var(--clr-border); margin: 20px 0;" />
            <div style="text-align: left;">
              <div class="mb-3">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Email</span>
                <strong>{{ teacher.email }}</strong>
              </div>
              <div class="mb-3">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Phone</span>
                <strong>{{ teacher.phone }}</strong>
              </div>
              <div class="mb-3">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Qualification</span>
                <strong>{{ teacher.qualification }}</strong>
              </div>
              <div class="mb-3">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Joined</span>
                <strong>{{ teacher.joinDate }}</strong>
              </div>
              <div *ngIf="teacher.userId">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Linked login</span>
                <strong>Yes (staff portal)</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="erp-card mb-4">
            <h4 class="erp-card-title mb-3">Teaching</h4>
            <div class="row g-3">
              <div class="col-md-6">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Subjects</span>
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <span class="badge-erp badge-neutral" *ngFor="let s of teacher.subjects">{{ s }}</span>
                </div>
              </div>
              <div class="col-md-6">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Assigned classes (IDs)</span>
                <strong>{{ teacher.classIds.join(', ') || '—' }}</strong>
              </div>
              <div class="col-12" *ngIf="homeroomLines.length">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">Homeroom</span>
                <ul class="mb-0 ps-3 small">
                  <li *ngFor="let line of homeroomLines">{{ line }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="erp-card" *ngIf="teacher.libraryStaffRole">
            <h4 class="erp-card-title mb-2">Library</h4>
            <p class="text-muted small mb-0">Desk role: <strong>{{ teacher.libraryStaffRole }}</strong></p>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="!teacher && loadError" class="erp-card empty-state">
      <h3>Teacher not found</h3>
      <p>{{ loadError }}</p>
      <a routerLink="/app/teachers" class="btn-outline-erp btn-sm">Back to list</a>
    </div>
  `,
})
export class TeacherProfileComponent implements OnInit {
  teacher: Teacher | null = null;
  loadError = '';
  lifecycleBusy = false;
  homeroomLines: string[] = [];
  classes: SchoolClass[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private teacherService: TeacherService,
    private academicService: AcademicService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService
  ) {}

  get isAdmin(): boolean {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'admin' || r === 'super_admin';
  }

  get portraitUrl(): string | null {
    if (!this.teacher) return null;
    return this.auth.getDirectoryTeacherAvatarDataUrl(this.teacher.id) || this.teacher.avatar || null;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (!id) return;
      this.load(id);
    });
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  private load(id: string): void {
    this.loadError = '';
    const nid = Number(id);
    if (!Number.isFinite(nid)) {
      this.loadError = 'Invalid teacher id.';
      return;
    }
    this.teacherService.getTeacherById(nid).subscribe({
      next: t => {
        this.teacher = t ?? null;
        if (!this.teacher) this.loadError = 'No record for this id.';
        else this.refreshHomeroom();
      },
      error: () => {
        this.teacher = null;
        this.loadError = 'Could not load teacher.';
      },
    });
  }

  private refreshHomeroom(): void {
    if (!this.teacher) return;
    this.academicService.getClasses().subscribe(list => {
      this.classes = list || [];
      const tid = this.teacher!.id;
      this.homeroomLines = (list || [])
        .filter(c => c.classTeacherId === tid)
        .map(c => `${c.name} (${c.sections?.length || 0} section(s))`);
    });
  }

  deactivateTeacher(): void {
    if (!this.teacher) return;
    const name = `${this.teacher.firstName} ${this.teacher.lastName}`;
    this.confirmDialog
      .confirm({
        title: 'Deactivate teacher?',
        message: `${name} will be removed from active teaching lists and homeroom assignments may be cleared in the backend.`,
        variant: 'danger',
        confirmLabel: 'Yes, deactivate',
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.lifecycleBusy = true;
        this.teacherService.deleteTeacher(this.teacher!.id).subscribe({
          next: () => {
            this.lifecycleBusy = false;
            this.router.navigate(['/app/teachers']);
          },
          error: () => (this.lifecycleBusy = false),
        });
      });
  }
}
