import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TeacherService } from '../../core/services/teacher.service';
import { AcademicService } from '../../core/services/academic.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { Teacher, SchoolClass } from '../../core/models/models';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { formatSchoolClassName } from '../../core/i18n/school-class-display';
import { formatDateDdMmYyyy } from '../../core/utils/date-format';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  styles: [
    `
      .teacher-profile-page {
        color: var(--clr-text);
      }
      .teacher-profile-page .erp-card {
        border: 1px solid color-mix(in srgb, var(--clr-border) 82%, var(--clr-primary) 18%);
        border-radius: 14px;
        box-shadow: 0 8px 22px color-mix(in srgb, var(--clr-primary) 8%, transparent);
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--clr-surface) 97%, var(--clr-primary) 3%) 0%,
          var(--clr-surface) 100%
        );
      }
      .teacher-profile-title {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: color-mix(in srgb, var(--clr-text) 92%, var(--clr-primary));
      }
      .teacher-profile-banner {
        border-left: 4px solid var(--clr-primary);
        padding: 14px 18px;
      }
      .teacher-profile-card--identity {
        padding: 28px;
      }
      .teacher-profile-section-title {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: color-mix(in srgb, var(--clr-text) 88%, var(--clr-primary) 12%);
      }
      @media (max-width: 576px) {
        .teacher-profile-card--identity {
          padding: 20px;
        }
        .teacher-profile-title {
          font-size: 21px;
        }
      }
    `,
  ],
  template: `
    <div class="teacher-profile-page erp-readonly-profile animate-in" data-testid="teacher-profile-page" *ngIf="teacher">
      <div *ngIf="!isSchoolAdmin" class="erp-card teacher-profile-banner mb-4">
        <div class="d-flex align-items-start gap-2 mb-0">
          <i class="bi bi-info-circle" style="color: var(--clr-primary); margin-top: 2px;"></i>
          <p class="mb-0 small" style="color: var(--clr-text-secondary); line-height: 1.5;">{{ 'teachers.profile.colleagueReadOnlyHint' | translate }}</p>
        </div>
      </div>
      <div class="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button type="button" class="btn-icon" (click)="router.navigate(['/app/teachers'])" data-testid="back-teachers">
          <i class="bi bi-arrow-left" style="font-size: 20px;"></i>
        </button>
        <div class="flex-grow-1">
          <h2 class="teacher-profile-title">{{ 'teachers.profile.title' | translate }}</h2>
          <p *ngIf="!isSchoolAdmin" class="text-muted small mb-0" style="max-width: 640px;">{{ 'teachers.profile.leadColleague' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()">
            <i class="bi bi-arrow-clockwise"></i> {{ 'teachers.profile.refresh' | translate }}
          </button>
          <a *ngIf="isSchoolAdmin" [routerLink]="['/app/teachers', teacher.id, 'edit']" class="btn-primary-erp btn-sm" data-testid="teacher-edit-btn">
            <i class="bi bi-pencil"></i> {{ 'teachers.profile.edit' | translate }}
          </a>
          <button
            *ngIf="isSchoolAdmin && teacher.status === 'active'"
            type="button"
            class="btn-outline-erp btn-sm"
            style="border-color: var(--clr-danger); color: var(--clr-danger);"
            [disabled]="lifecycleBusy"
            (click)="deactivateTeacher()"
          >
            {{ 'teachers.profile.deactivate' | translate }}
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="erp-card teacher-profile-card--identity text-center">
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
            <span class="badge-erp" [ngClass]="teacher.status === 'active' ? 'badge-success' : 'badge-neutral'">{{ statusLabel(teacher.status) }}</span>
            <hr style="border-color: var(--clr-border); margin: 20px 0;" />
            <div style="text-align: left;">
              <div class="mb-3" *ngIf="isSchoolAdmin && teacher.email">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.email' | translate }}</span>
                <strong>{{ teacher.email }}</strong>
              </div>
              <div class="mb-3" *ngIf="isSchoolAdmin && teacher.phone">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.phone' | translate }}</span>
                <strong>{{ teacher.phone }}</strong>
              </div>
              <div class="mb-3" *ngIf="isSchoolAdmin && teacher.qualification">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.form.qualification' | translate }}</span>
                <strong>{{ teacher.qualification }}</strong>
              </div>
              <div class="mb-3">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.joined' | translate }}</span>
                <strong>{{ formatDisplayDate(teacher.joinDate) }}</strong>
              </div>
              <div class="mb-3" *ngIf="isSchoolAdmin">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.salary' | translate }}</span>
                <strong>{{ teacher.salary | number:'1.0-0' }}</strong>
              </div>
              <div class="mb-3" *ngIf="isSchoolAdmin">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.teacherRecordId' | translate }}</span>
                <strong>{{ teacher.id }}</strong>
              </div>
              <div *ngIf="isSchoolAdmin && teacher.userId">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.linkedLogin' | translate }}</span>
                <strong>{{ 'teachers.profile.linkedYes' | translate }}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="erp-card mb-4">
            <h4 class="teacher-profile-section-title mb-3">{{ 'teachers.profile.teaching' | translate }}</h4>
            <p class="text-muted small mb-3" style="line-height: 1.55;">{{ 'teachers.profile.teachingLead' | translate }}</p>
            <div class="row g-3">
              <div class="col-md-6">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.subjects' | translate }}</span>
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <span class="badge-erp badge-subject-pill" *ngFor="let s of teacher.subjects">{{ s }}</span>
                  <span *ngIf="!teacher.subjects.length" class="text-muted small">{{ 'directory.emDash' | translate }}</span>
                </div>
              </div>
              <div class="col-md-6">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.homeroomClasses' | translate }}</span>
                <strong>{{ homeroomLabel || ('directory.emDash' | translate) }}</strong>
              </div>
            </div>
          </div>
          <div class="erp-card" *ngIf="teacher.libraryStaffRole">
            <h4 class="teacher-profile-section-title mb-2">{{ 'teachers.profile.library' | translate }}</h4>
            <p class="text-muted small mb-0">{{ 'teachers.profile.libraryDesk' | translate }} <strong>{{ teacher.libraryStaffRole }}</strong></p>
          </div>
          <div class="erp-card mt-4" *ngIf="isSchoolAdmin && hasAdminMetadata()">
            <h4 class="teacher-profile-section-title mb-2">{{ 'teachers.profile.adminMetadata' | translate }}</h4>
            <p class="text-muted small mb-3">{{ 'teachers.profile.adminMetadataLead' | translate }}</p>
            <div class="row g-3">
              <div class="col-md-6" *ngIf="teacher.bankAccountHolder">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.bankAccountHolder' | translate }}</span>
                <strong>{{ teacher.bankAccountHolder }}</strong>
              </div>
              <div class="col-md-6" *ngIf="teacher.bankName">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.bankName' | translate }}</span>
                <strong>{{ teacher.bankName }}</strong>
              </div>
              <div class="col-md-6" *ngIf="teacher.bankAccountNumber">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.bankAccountNumber' | translate }}</span>
                <strong>{{ maskedBankAccount(teacher.bankAccountNumber) }}</strong>
              </div>
              <div class="col-md-6" *ngIf="teacher.bankIfsc">
                <span style="font-size: 12px; color: var(--clr-text-muted); display: block;">{{ 'teachers.profile.bankIfsc' | translate }}</span>
                <strong>{{ teacher.bankIfsc }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div *ngIf="!teacher && loadError" class="erp-card empty-state">
      <h3>{{ 'teachers.profile.notFoundTitle' | translate }}</h3>
      <p>{{ loadError }}</p>
      <a routerLink="/app/teachers" class="btn-outline-erp btn-sm">{{ 'teachers.profile.backToList' | translate }}</a>
    </div>
  `,
})
export class TeacherProfileComponent implements OnInit, OnDestroy {
  teacher: Teacher | null = null;
  loadError = '';
  lifecycleBusy = false;
  classes: SchoolClass[] = [];
  homeroomLabel = '';
  private langSub?: Subscription;
  private routeSub?: Subscription;
  private lastLoadedTeacherId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private teacherService: TeacherService,
    private academicService: AcademicService,
    private auth: AuthService,
    private uiAccess: UiAccessService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Homeroom class names (class teacher), localized; falls back to academic class list if API omitted names. */
  private computeHomeroomLabel(): string {
    if (!this.teacher) return '';
    const fromApi = this.teacher.homeroomClassNames ?? [];
    const sep = this.translate.instant('teachers.list.homeroomSeparator');
    if (fromApi.length) {
      return fromApi.map(n => formatSchoolClassName(n, this.translate)).join(sep);
    }
    const names = (this.classes || []).filter(c => c.classTeacherId === this.teacher!.id).map(c => c.name);
    if (!names.length) return '';
    return names.map(n => formatSchoolClassName(n, this.translate)).join(sep);
  }

  statusLabel(status: string): string {
    const key = 'teachers.enums.status.' + status;
    const t = this.translate.instant(key);
    return t !== key ? t : status;
  }

  formatDisplayDate(raw: string | null | undefined): string {
    return formatDateDdMmYyyy(raw);
  }

  hasAdminMetadata(): boolean {
    if (!this.teacher) return false;
    return !!(
      this.teacher.bankAccountHolder ||
      this.teacher.bankName ||
      this.teacher.bankAccountNumber ||
      this.teacher.bankIfsc
    );
  }

  maskedBankAccount(account: string): string {
    const raw = String(account || '').trim();
    if (!raw) return '';
    const tail = raw.slice(-4);
    return '••••' + tail;
  }

  get isSchoolAdmin(): boolean {
    return this.uiAccess.hasAcademicDeskAdminAccess();
  }

  get portraitUrl(): string | null {
    if (!this.teacher) return null;
    return this.auth.getDirectoryTeacherAvatarDataUrl(this.teacher.id) || this.teacher.avatar || null;
  }

  ngOnInit(): void {
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.homeroomLabel = this.computeHomeroomLabel();
      this.cdr.markForCheck();
    });
    this.routeSub = this.route.paramMap.subscribe(pm => {
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
      this.loadError = this.translate.instant('teachers.profile.invalidId');
      return;
    }
    if (this.lastLoadedTeacherId === nid && this.teacher?.id === nid) {
      return;
    }
    this.lastLoadedTeacherId = nid;
    this.teacherService.getTeacherById(nid).subscribe({
      next: t => {
        this.teacher = t ?? null;
        if (!this.teacher) this.loadError = this.translate.instant('teachers.profile.noRecord');
        else this.refreshHomeroom();
      },
      error: () => {
        this.teacher = null;
        this.loadError = this.translate.instant('teachers.profile.loadFailed');
        this.homeroomLabel = '';
        this.lastLoadedTeacherId = null;
      },
    });
  }

  private refreshHomeroom(): void {
    if (!this.teacher) return;
    if (this.teacher.homeroomClassNames?.length) {
      this.classes = [];
      this.homeroomLabel = this.computeHomeroomLabel();
      this.cdr.markForCheck();
      return;
    }
    this.academicService.getClasses().subscribe(list => {
      this.classes = list || [];
      this.homeroomLabel = this.computeHomeroomLabel();
      this.cdr.markForCheck();
    });
  }

  deactivateTeacher(): void {
    if (!this.isSchoolAdmin || !this.teacher) return;
    const name = `${this.teacher.firstName} ${this.teacher.lastName}`;
    this.confirmDialog
      .confirm({
        title: this.translate.instant('teachers.profile.confirmDeactivate.title'),
        message: this.translate.instant('teachers.profile.confirmDeactivate.message', { name }),
        variant: 'danger',
        confirmLabel: this.translate.instant('teachers.profile.confirmDeactivate.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.lifecycleBusy = true;
        this.teacherService.updateTeacherStatus(this.teacher!.id, 'inactive').subscribe({
          next: () => {
            this.lifecycleBusy = false;
            this.router.navigate(['/app/teachers']);
          },
          error: () => (this.lifecycleBusy = false),
        });
      });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }
}
