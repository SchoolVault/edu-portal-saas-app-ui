import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
import { Teacher } from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div data-testid="teacher-list-page">
      <header class="erp-page-header animate-in">
        <div>
          <h1 class="erp-page-header__title">{{ 'teachers.list.title' | translate }}</h1>
          <p class="erp-page-header__lead">{{ 'teachers.list.lead' | translate }}</p>
        </div>
        <div class="erp-page-header__actions">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reloadTeachers()"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> {{ 'teachers.list.refresh' | translate }}</button>
          <a routerLink="/app/teachers/new" class="btn-primary-erp btn-sm" data-testid="add-teacher-btn">
            <i class="bi bi-plus-lg" aria-hidden="true"></i><span>{{ 'teachers.list.add' | translate }}</span>
          </a>
        </div>
      </header>
      <div class="erp-card animate-in animate-in-delay-1">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="search-input-wrapper" style="min-width: 300px;">
            <i class="bi bi-search"></i>
            <input type="text" class="erp-input" [placeholder]="'teachers.list.searchPlaceholder' | translate" [(ngModel)]="searchTerm" (input)="filter()" data-testid="teacher-search">
          </div>
        </div>
        <div style="overflow-x: auto;" dir="ltr">
          <table class="erp-table" data-testid="teacher-table">
            <thead>
              <tr><th>{{ 'teachers.list.thTeacher' | translate }}</th><th>{{ 'teachers.list.thSpecialization' | translate }}</th><th>{{ 'teachers.list.thSubjects' | translate }}</th><th>{{ 'teachers.list.thHomeroom' | translate }}</th><th>{{ 'teachers.list.thJoinDate' | translate }}</th><th>{{ 'teachers.list.thStatus' | translate }}</th><th>{{ 'teachers.list.thActions' | translate }}</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of filtered" [attr.data-testid]="'teacher-row-' + t.id">
                <td>
                  <div class="d-flex align-items-center">
                    <img
                      *ngIf="teacherPortraitUrl(t) as src"
                      [src]="src"
                      alt=""
                      class="table-avatar"
                      width="36"
                      height="36"
                    />
                    <div *ngIf="!teacherPortraitUrl(t)" class="table-avatar">{{ t.firstName[0] }}{{ t.lastName[0] }}</div>
                    <div>
                      <div style="font-weight: 600; color: var(--clr-text);">{{ t.firstName }} {{ t.lastName }}</div>
                      <div style="font-size: 12px; color: var(--clr-text-secondary);">{{ t.email }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ t.specialization }}</td>
                <td>
                  <ng-container *ngIf="t.subjects?.length; else noSubjectsCell">
                    <span class="badge-erp badge-subject-pill me-1" *ngFor="let s of t.subjects!.slice(0, 2)">{{ s }}</span>
                  </ng-container>
                  <ng-template #noSubjectsCell><span class="text-muted small">—</span></ng-template>
                </td>
                <td>
                  <ng-container *ngIf="t.homeroomClassNames?.length; else noHomeroom">
                    <span class="text-body">{{ homeroomLine(t) }}</span>
                  </ng-container>
                  <ng-template #noHomeroom><span class="text-muted small">{{ 'teachers.list.homeroomNone' | translate }}</span></ng-template>
                </td>
                <td>{{ t.joinDate }}</td>
                <td><span class="badge-erp badge-success">{{ statusLabel(t.status) }}</span></td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/app/teachers', t.id]" class="btn-icon" [attr.title]="'teachers.list.viewProfile' | translate" [attr.data-testid]="'view-teacher-' + t.id">
                      <i class="bi bi-eye"></i>
                    </a>
                    <a [routerLink]="['/app/teachers', t.id, 'edit']" class="btn-icon" [attr.title]="'teachers.list.edit' | translate"><i class="bi bi-pencil"></i></a>
                    <button type="button" class="btn-icon" (click)="deleteTeacher(t.id)" [attr.title]="'teachers.list.deactivate' | translate"><i class="bi bi-trash" style="color: var(--clr-danger);"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TeacherListComponent implements OnInit, OnDestroy {
  teachers: Teacher[] = [];
  filtered: Teacher[] = [];
  searchTerm = '';
  private langSub?: Subscription;

  constructor(
    private teacherService: TeacherService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Localized class names, comma-separated (homeroom / class teacher only). */
  homeroomLine(t: Teacher): string {
    const names = t.homeroomClassNames ?? [];
    if (!names.length) return '';
    const sep = this.translate.instant('teachers.list.homeroomSeparator');
    return names.map(n => formatSchoolClassName(n, this.translate)).join(sep);
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  statusLabel(status: string): string {
    const key = 'teachers.enums.status.' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  teacherPortraitUrl(t: Teacher): string | null {
    return this.auth.getDirectoryTeacherAvatarDataUrl(t.id) || t.avatar || null;
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
    this.reloadTeachers();
  }

  reloadTeachers(): void {
    this.teacherService.getTeachers().subscribe(t => {
      this.teachers = t;
      this.filtered = t;
    });
  }

  filter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.teachers.filter(t =>
      (t.firstName + ' ' + t.lastName).toLowerCase().includes(term) || (t.specialization || '').toLowerCase().includes(term)
    );
  }

  deleteTeacher(id: number): void {
    const t = this.teachers.find(x => x.id === id);
    const name = t
      ? `${t.firstName} ${t.lastName}`
      : this.translate.instant('teachers.list.confirmDelete.fallbackName');
    this.confirmDialog
      .confirm({
        title: this.translate.instant('teachers.list.confirmDelete.title'),
        message: this.translate.instant('teachers.list.confirmDelete.message', { name }),
        details: [
          t?.email ? this.translate.instant('teachers.list.confirmDelete.detailEmail', { email: t.email }) : undefined,
          t?.specialization
            ? this.translate.instant('teachers.list.confirmDelete.detailFocus', { focus: t.specialization })
            : undefined,
          this.translate.instant('teachers.list.confirmDelete.detailSoft'),
        ].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: this.translate.instant('teachers.list.confirmDelete.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.teacherService.deleteTeacher(id).subscribe(() => {
          this.teachers = this.teachers.filter(x => x.id !== id);
          this.filter();
        });
      });
  }
}
