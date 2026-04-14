import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AcademicService } from '../../core/services/academic.service';
import { TeacherService } from '../../core/services/teacher.service';
import { AuthService } from '../../core/services/auth.service';
import { AcademicYear, PromotionPreview, PromotionSplitPreview, SchoolClass, Teacher } from '../../core/models/models';
import { filter } from 'rxjs/operators';
import { ErpDatePickerComponent } from '../../shared/erp-date-picker/erp-date-picker.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

@Component({
  selector: 'app-academic',
  standalone: true,
  imports: [CommonModule, FormsModule, ErpDatePickerComponent, RouterLink, TranslateModule, ErpI18nPhDirective],
  styles: [
    `
      .academic-help-text {
        color: var(--clr-text-secondary);
      }
      .academic-homeroom-strip {
        border-left: 4px solid var(--clr-warning);
        background: color-mix(in srgb, var(--clr-warning) 14%, var(--clr-surface));
      }
      .academic-homeroom-strip__title {
        color: var(--clr-text);
      }
      .academic-homeroom-strip__text {
        color: var(--clr-text-secondary);
        max-width: 720px;
      }
      .academic-class-card--needs-homeroom {
        border: 1px solid color-mix(in srgb, var(--clr-warning) 35%, var(--clr-border));
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-warning) 15%, transparent);
      }
      .academic-homeroom-missing-callout {
        font-size: 13px;
        line-height: 1.45;
        color: var(--clr-text-secondary);
        background: color-mix(in srgb, var(--clr-warning) 10%, var(--clr-surface));
        border: 1px solid color-mix(in srgb, var(--clr-warning) 35%, var(--clr-border));
        border-radius: var(--radius-md);
        padding: 10px 12px;
        margin-bottom: 10px;
      }
    `,
  ],
  template: `
    <div data-testid="academic-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'academic.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'academic.pageLead' | translate }}</p>
        </div>
      </div>
      <div class="erp-tabs animate-in">
        <button *ngIf="canManageAcademic" type="button" class="erp-tab" [class.active]="tab === 'years'" (click)="tab = 'years'">{{ 'academic.tab.years' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'classes'" (click)="tab = 'classes'">{{ 'academic.tab.classes' | translate }}</button>
        <button *ngIf="canManageAcademic" type="button" class="erp-tab" [class.active]="tab === 'promotion'" (click)="activatePromotionTab()">{{ 'academic.tab.promotion' | translate }}</button>
      </div>

      <div *ngIf="tab === 'years' && canManageAcademic" class="animate-in">
        <div class="d-flex justify-content-end mb-3">
          <button type="button" class="btn-primary-erp btn-sm" (click)="showAddYear = true"><i class="bi bi-plus-lg"></i> {{ 'academic.years.add' | translate }}</button>
        </div>
        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let ay of academicYears">
            <div class="erp-card">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 style="font-size: 18px; font-weight: 700;">{{ ay.name }}</h4>
                <span class="badge-erp" [ngClass]="ay.isCurrent ? 'badge-success' : 'badge-neutral'">{{ ay.isCurrent ? ('academic.year.current' | translate) : ('academic.year.past' | translate) }}</span>
              </div>
              <div style="font-size: 13px; color: var(--clr-text-secondary);">
                <div class="mb-1"><i class="bi bi-calendar3 me-2"></i>{{ 'academic.year.start' | translate }}: {{ ay.startDate }}</div>
                <div><i class="bi bi-calendar3 me-2"></i>{{ 'academic.year.end' | translate }}: {{ ay.endDate }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'classes'" class="animate-in">
        <p *ngIf="!canManageAcademic" class="text-muted mb-3" style="font-size: 13px;">
          <i class="bi bi-info-circle me-1"></i> {{ 'academic.classes.viewOnlyHint' | translate }}
        </p>

        <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
          <div class="d-flex flex-wrap align-items-end gap-3">
            <div>
              <label class="erp-label mb-1">{{ 'academic.classes.filterYear' | translate }}</label>
              <select class="erp-select" style="min-width: 180px;" [(ngModel)]="filterYearId">
                <option [ngValue]="null">{{ 'academic.classes.allYears' | translate }}</option>
                <option *ngFor="let ay of academicYears" [ngValue]="ay.id">{{ ay.name }}</option>
              </select>
            </div>
            <a routerLink="/app/students" class="btn-outline-erp btn-sm" style="text-decoration: none;"><i class="bi bi-people me-1"></i> {{ 'academic.classes.studentsLink' | translate }}</a>
          </div>
          <button *ngIf="canManageAcademic" type="button" class="btn-primary-erp btn-sm" (click)="openCreateClassModal()"><i class="bi bi-plus-lg"></i> {{ 'academic.classes.create' | translate }}</button>
        </div>

        <div *ngIf="canManageAcademic && classesMissingHomeroom.length" class="erp-card mb-3 academic-homeroom-strip">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <strong class="academic-homeroom-strip__title"><i class="bi bi-person-exclamation me-1"></i> {{ 'academic.homeroom.bannerTitle' | translate }}</strong>
              <p class="academic-homeroom-strip__text mb-0 small">
                {{ 'academic.homeroom.bannerLead' | translate: { count: classesMissingHomeroom.length } }}
              </p>
            </div>
          </div>
        </div>

        <div class="erp-card mb-4" *ngIf="canManageAcademic" id="academic-assign-class-teacher-panel">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h4 class="erp-card-title mb-1">{{ 'academic.assign.title' | translate }}</h4>
              <p class="academic-help-text mb-0" style="font-size: 12px;">{{ 'academic.assign.help' | translate }}</p>
              <p class="academic-help-text mb-0 mt-1" style="font-size: 11px;">{{ 'academic.assign.rules' | translate }}</p>
            </div>
          </div>
          <p *ngIf="assignConflictClass as prev" class="small mt-2 mb-0" style="color: var(--clr-warning);">
            <i class="bi bi-info-circle me-1"></i>{{ 'academic.assign.willMoveFrom' | translate: { class: prev.name } }}
          </p>
          <div class="row g-3 align-items-end mt-2">
            <div class="col-md-5">
              <label class="erp-label">{{ 'academic.assign.class' | translate }}</label>
              <select class="erp-select" [(ngModel)]="assignClassId">
                <option [ngValue]="null">{{ 'academic.assign.selectClass' | translate }}</option>
                <option *ngFor="let cls of classes" [ngValue]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-5">
              <label class="erp-label">{{ 'academic.assign.teacher' | translate }}</label>
              <select class="erp-select" [(ngModel)]="assignTeacherId">
                <option [ngValue]="null">{{ 'academic.assign.unassigned' | translate }}</option>
                <option *ngFor="let t of teachersForHomeroom" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
              </select>
            </div>
            <div class="col-md-2">
              <button type="button" class="btn-primary-erp" style="width: 100%;" [disabled]="assignClassId == null || assigningTeacher" (click)="saveClassTeacher()">
                <span class="spinner" *ngIf="assigningTeacher"></span>
                {{ assigningTeacher ? ('academic.assign.saving' | translate) : ('academic.assign.save' | translate) }}
              </button>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-6 col-lg-4" *ngFor="let cls of filteredClasses">
            <div class="erp-card academic-class-card" [class.academic-class-card--needs-homeroom]="canManageAcademic && !cls.classTeacherId">
              <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                <div>
                  <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 2px;">{{ cls.name }}</h4>
                  <span class="academic-help-text" style="font-size: 12px;">{{ 'academic.card.grade' | translate: { grade: cls.grade } }}</span>
                </div>
                <div class="d-flex flex-column align-items-end gap-1">
                  <span class="badge-erp" [ngClass]="cls.sections.length ? 'badge-info' : 'badge-neutral'">{{ cls.sections.length ? ('academic.card.sectionsCount' | translate: { count: cls.sections.length }) : ('academic.card.wholeClass' | translate) }}</span>
                  <span *ngIf="canManageAcademic && !cls.classTeacherId" class="badge-erp" style="background: color-mix(in srgb, var(--clr-warning) 22%, transparent); color: var(--clr-warning); border: 1px solid color-mix(in srgb, var(--clr-warning) 45%, transparent);">{{ 'academic.card.homeroomTbd' | translate }}</span>
                  <button *ngIf="canManageAcademic" type="button" class="btn-outline-erp btn-xs" (click)="openEditClassModal(cls)">{{ 'academic.card.editClass' | translate }}</button>
                </div>
              </div>
              <div *ngIf="cls.classTeacherName" style="font-size: 13px; color: var(--clr-text-secondary); margin-bottom: 10px;">
                <i class="bi bi-person-badge me-1"></i> {{ 'academic.card.classTeacher' | translate }} <strong>{{ cls.classTeacherName }}</strong>
                <button *ngIf="canManageAcademic" type="button" class="btn-outline-erp btn-xs ms-2" (click)="prefillAssignClassTeacher(cls)">{{ 'academic.card.changeHomeroom' | translate }}</button>
              </div>
              <div *ngIf="!cls.classTeacherName" class="academic-homeroom-missing-callout">
                <i class="bi bi-person-x me-1"></i>
                <span><strong>{{ 'academic.card.noTeacherTitle' | translate }}</strong> — {{ 'academic.card.noTeacherBody' | translate }}</span>
                <button *ngIf="canManageAcademic" type="button" class="btn-primary-erp btn-xs mt-2" (click)="prefillAssignClassTeacher(cls)">{{ 'academic.card.assignTeacher' | translate }}</button>
              </div>
              <div *ngIf="cls.sections.length === 0" class="text-muted mb-2" style="font-size: 12px;">{{ 'academic.card.noSections' | translate }}</div>
              <div class="d-flex flex-wrap gap-2">
                <div *ngFor="let sec of cls.sections" class="d-flex align-items-center gap-1" style="flex: 1; min-width: 100px; background: var(--clr-surface-muted); border: 1px solid var(--clr-border-light); border-radius: var(--radius-md); padding: 8px 10px;">
                  <div style="flex: 1; text-align: center;">
                    <div style="font-weight: 700; font-size: 15px;">{{ sec.name }}</div>
                    <div style="font-size: 12px; color: var(--clr-text-muted);">{{ sec.studentCount }}/{{ sec.capacity }}</div>
                  </div>
                  <div *ngIf="canManageAcademic" class="d-flex flex-column gap-1">
                    <button type="button" class="btn-icon btn-xs p-0" style="font-size: 14px;" (click)="openEditSectionModal(cls, sec)" [attr.title]="'academic.card.editTitle' | translate"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn-icon btn-xs p-0" style="font-size: 14px; color: var(--clr-danger);" [disabled]="sec.studentCount > 0 || sectionBusy" (click)="removeSection(cls, sec)" [attr.title]="'academic.card.removeTitle' | translate"><i class="bi bi-trash"></i></button>
                  </div>
                </div>
              </div>
              <div *ngIf="canManageAcademic" class="mt-2">
                <button type="button" class="btn-outline-erp btn-xs" [disabled]="sectionBusy" (click)="openAddSectionModal(cls)"><i class="bi bi-plus"></i> {{ 'academic.modal.addSectionTitle' | translate }}</button>
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--clr-border-light); font-size: 12px; color: var(--clr-text-muted);">
                {{ 'academic.card.totalStudents' | translate }} <strong style="color: var(--clr-text);">{{ getTotalStudents(cls) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'promotion' && canManageAcademic" class="animate-in">
        <div class="erp-card mb-4">
          <h4 class="erp-card-title mb-3">{{ 'academic.promotion.title' | translate }}</h4>
          <p style="font-size: 13px; color: var(--clr-text-secondary); margin-bottom: 16px;">{{ 'academic.promotion.lead' | translate }}</p>
          <div class="row g-3 align-items-end mb-4">
            <div class="col-md-4">
              <label class="erp-label">{{ 'academic.promotion.fromClass' | translate }}</label>
              <select
                class="erp-select"
                [(ngModel)]="promoFromClass"
                (change)="loadPromotionPreview()"
                title="Source grade: students currently enrolled here are candidates for promotion to the configured next class."
              >
                <option [ngValue]="null">{{ 'academic.promotion.selectClass' | translate }}</option>
                <option *ngFor="let cls of promotableClasses" [ngValue]="cls.id">{{ cls.name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="erp-label">{{ 'academic.promotion.toClass' | translate }}</label>
              <input
                type="text"
                class="erp-input"
                [value]="promotionPreview?.targetClassName || ''"
                disabled
                title="Target grade after promotion — determined by academic rules (usually the next grade up)."
              />
            </div>
            <div class="col-md-4">
              <button
                class="btn-primary-erp"
                style="width: 100%;"
                [disabled]="selectedForPromo === 0 || promoting"
                (click)="promoteStudents()"
                title="Moves selected eligible students from the source class to the target class (and section if chosen). Ineligible rows stay behind."
              >
                <span class="spinner" *ngIf="promoting"></span>
                {{ promoting ? ('academic.promotion.promoting' | translate) : ('academic.promotion.promoteSelected' | translate) }}
              </button>
            </div>
          </div>
          <div class="row g-3 mb-4" *ngIf="promotionPreview?.targetSections?.length">
            <div class="col-md-6">
              <label class="erp-label">{{ 'academic.promotion.targetSection' | translate }}</label>
              <select
                class="erp-select"
                [(ngModel)]="promoTargetSectionId"
                title="Homeroom section in the target class. Capacity hints help balance strength; split preview suggests counts per section."
              >
                <option *ngFor="let sec of promotionPreview!.targetSections!" [ngValue]="sec.id">{{ sec.name }}<ng-container *ngIf="sec.capacity != null">{{ 'academic.promotion.capSuffix' | translate: { cap: sec.capacity } }}</ng-container></option>
              </select>
              <p class="text-muted mt-1 mb-0" style="font-size: 12px;">{{ 'academic.promotion.targetSectionHelp' | translate }}</p>
            </div>
          </div>

          <div *ngIf="promotionLoading" class="empty-state">
            <i class="bi bi-hourglass-split"></i><h3>{{ 'academic.promotion.loadingTitle' | translate }}</h3><p>{{ 'academic.promotion.loadingLead' | translate }}</p>
          </div>

          <div *ngIf="promotionPreview?.sectionPlacementNote" class="alert alert-warning py-2 px-3 small mb-3" style="border-radius: var(--radius-md);">
            {{ promotionPreview!.sectionPlacementNote }}
          </div>
          <div class="d-flex flex-wrap gap-2 mb-3" *ngIf="promotionPreview">
            <button
              type="button"
              class="btn-outline-erp btn-sm"
              [disabled]="splitLoading"
              (click)="loadSplitPreview()"
              title="Estimates how many promoted students could go into each target section based on capacity and current counts — planning aid only until you confirm promotion."
            >
              {{ splitLoading ? ('academic.promotion.splitLoading' | translate) : ('academic.promotion.splitPreview' | translate) }}
            </button>
          </div>
          <div *ngIf="splitPreview" class="mb-4 p-3" style="border: 1px solid var(--clr-border-light); border-radius: var(--radius-lg); background: rgba(0,0,0,0.02);">
            <div class="small text-muted mb-2">{{ 'academic.promotion.splitSummary' | translate: { hint: splitPreview.hint, count: splitPreview.eligibleStudentCount } }}</div>
            <table class="erp-table mb-0" *ngIf="splitPreview.sections.length">
              <thead><tr><th>{{ 'academic.promotion.thSection' | translate }}</th><th>{{ 'academic.promotion.thCapacity' | translate }}</th><th>{{ 'academic.promotion.thSuggested' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of splitPreview.sections">
                  <td>{{ s.sectionName }}</td>
                  <td>{{ s.capacity ?? ('academic.promotion.dash' | translate) }}</td>
                  <td><strong>{{ s.suggestedAssignCount }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="promotionPreview && promotionPreview.students.length > 0">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span style="font-size: 13px; font-weight: 600;">{{ 'academic.promotion.selected' | translate: { selected: selectedForPromo, total: promotionPreview.students.length } }}</span>
              <button class="btn-outline-erp btn-xs" (click)="toggleAllPromo()">{{ allSelected ? ('academic.promotion.deselectAll' | translate) : ('academic.promotion.selectAll' | translate) }}</button>
            </div>
            <table class="erp-table">
              <thead><tr><th style="width: 40px;"><input type="checkbox" [checked]="allSelected" (change)="toggleAllPromo()"></th><th>{{ 'academic.promotion.thStudent' | translate }}</th><th>{{ 'academic.promotion.thRoll' | translate }}</th><th>{{ 'academic.promotion.thCurrentClass' | translate }}</th><th>{{ 'academic.promotion.thPromotedTo' | translate }}</th><th>{{ 'academic.promotion.thAvgScore' | translate }}</th><th>{{ 'academic.promotion.thStatus' | translate }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let student of promotionPreview.students">
                  <td><input type="checkbox" [(ngModel)]="student.selected" [disabled]="!student.eligible"></td>
                  <td><strong>{{ student.firstName }} {{ student.lastName }}</strong></td>
                  <td>{{ student.rollNumber }}</td>
                  <td>{{ student.currentClassName }}</td>
                  <td style="color: var(--clr-success); font-weight: 600;">{{ promotionPreview.targetClassName }}</td>
                  <td>{{ student.averageScore | number:'1.0-1' }}%</td>
                  <td><span class="badge-erp" [ngClass]="student.eligible ? 'badge-success' : 'badge-danger'">{{ student.eligible ? ('academic.promotion.eligible' | translate) : ('academic.promotion.detained' | translate) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="promotionPreview && promotionPreview.students.length === 0" class="empty-state">
            <i class="bi bi-people"></i><h3>{{ 'academic.promotion.emptyTitle' | translate }}</h3><p>{{ 'academic.promotion.emptyLead' | translate }}</p>
          </div>

          <div *ngIf="promotionDone" style="margin-top: 16px; padding: 16px; background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2); border-radius: var(--radius-lg);">
            <div style="color: var(--clr-success); font-weight: 700;"><i class="bi bi-check-circle-fill me-2"></i>{{ 'academic.promotion.successTitle' | translate }}</div>
            <p style="font-size: 13px; margin: 4px 0 0 0; color: var(--clr-text-secondary);">{{ promotionDone }}</p>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showAddYear" (click)="showAddYear = false">
        <div class="modal-content-erp" (click)="$event.stopPropagation()">
          <div class="modal-header-erp"><h3>{{ 'academic.modal.newYearTitle' | translate }}</h3><button class="btn-icon" (click)="showAddYear = false"><i class="bi bi-x-lg"></i></button></div>
          <div class="modal-body-erp">
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.yearName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="newYear.name" erpI18nPh="academic.modal.yearNamePh"></div>
            <div class="row g-3">
              <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.startDate' | translate }}</label><app-erp-date-picker [(ngModel)]="newYear.startDate" placeholderI18nKey="academic.modal.phStart" /></div></div>
              <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.endDate' | translate }}</label><app-erp-date-picker [(ngModel)]="newYear.endDate" placeholderI18nKey="academic.modal.phEnd" /></div></div>
            </div>
          </div>
          <div class="modal-footer-erp">
            <button class="btn-outline-erp" (click)="showAddYear = false">{{ 'academic.modal.cancel' | translate }}</button>
            <button class="btn-primary-erp" (click)="addYear()">{{ 'academic.modal.create' | translate }}</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showCreateClass" (click)="showCreateClass = false">
        <div class="modal-content-erp" (click)="$event.stopPropagation()">
          <div class="modal-header-erp"><h3>{{ 'academic.modal.createClassTitle' | translate }}</h3><button type="button" class="btn-icon" (click)="showCreateClass = false"><i class="bi bi-x-lg"></i></button></div>
          <div class="modal-body-erp">
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.academicYearReq' | translate }}</label>
              <select class="erp-select" [(ngModel)]="newClass.academicYearId"><option *ngFor="let ay of academicYears" [ngValue]="ay.id">{{ ay.name }}</option></select></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.displayNameReq' | translate }}</label>
              <input type="text" class="erp-input" [(ngModel)]="newClass.name" erpI18nPh="academic.modal.displayNamePh"></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.gradeReq' | translate }}</label>
              <input type="number" class="erp-input" [(ngModel)]="newClass.grade" min="0" max="20"></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.initialSections' | translate }}</label>
              <input type="text" class="erp-input" [(ngModel)]="newClass.sectionNamesText" erpI18nPh="academic.modal.initialSectionsPh"></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.defaultCapacity' | translate }}</label>
              <input type="number" class="erp-input" [(ngModel)]="newClass.sectionCapacity" min="1"></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.classTeacherOpt' | translate }}</label>
              <select class="erp-select" [(ngModel)]="newClass.classTeacherId"><option [ngValue]="null">{{ 'academic.modal.later' | translate }}</option><option *ngFor="let t of teachersForHomeroom" [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option></select></div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="showCreateClass = false">{{ 'academic.modal.cancel' | translate }}</button>
            <button type="button" class="btn-primary-erp" [disabled]="savingClass" (click)="submitCreateClass()"><span class="spinner" *ngIf="savingClass"></span>{{ savingClass ? ('academic.modal.saving' | translate) : ('academic.modal.create' | translate) }}</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showEditClass" (click)="showEditClass = false">
        <div class="modal-content-erp" (click)="$event.stopPropagation()">
          <div class="modal-header-erp"><h3>{{ 'academic.modal.editClassTitle' | translate }}</h3><button type="button" class="btn-icon" (click)="showEditClass = false"><i class="bi bi-x-lg"></i></button></div>
          <div class="modal-body-erp">
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.nameReq' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="editClassForm.name"></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.gradeReq' | translate }}</label><input type="number" class="erp-input" [(ngModel)]="editClassForm.grade" min="0" max="20"></div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="showEditClass = false">{{ 'academic.modal.cancel' | translate }}</button>
            <button type="button" class="btn-primary-erp" [disabled]="savingClass" (click)="submitEditClass()">{{ savingClass ? ('academic.modal.saving' | translate) : ('academic.modal.save' | translate) }}</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showAddSection" (click)="showAddSection = false">
        <div class="modal-content-erp" (click)="$event.stopPropagation()">
          <div class="modal-header-erp"><h3>{{ 'academic.modal.addSectionTitle' | translate }}</h3><button type="button" class="btn-icon" (click)="showAddSection = false"><i class="bi bi-x-lg"></i></button></div>
          <div class="modal-body-erp">
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.sectionNameReq' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="newSection.name" erpI18nPh="academic.modal.sectionNamePh"></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.capacity' | translate }}</label><input type="number" class="erp-input" [(ngModel)]="newSection.capacity" min="1"></div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="showAddSection = false">{{ 'academic.modal.cancel' | translate }}</button>
            <button type="button" class="btn-primary-erp" [disabled]="sectionBusy" (click)="submitAddSection()">{{ sectionBusy ? ('academic.modal.saving' | translate) : ('academic.modal.add' | translate) }}</button>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showEditSection" (click)="showEditSection = false">
        <div class="modal-content-erp" (click)="$event.stopPropagation()">
          <div class="modal-header-erp"><h3>{{ 'academic.modal.editSectionTitle' | translate }}</h3><button type="button" class="btn-icon" (click)="showEditSection = false"><i class="bi bi-x-lg"></i></button></div>
          <div class="modal-body-erp">
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.sectionNameReq' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="editSectionForm.name"></div>
            <div class="erp-form-group"><label class="erp-label">{{ 'academic.modal.capacity' | translate }}</label><input type="number" class="erp-input" [(ngModel)]="editSectionForm.capacity" min="1"></div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" (click)="showEditSection = false">{{ 'academic.modal.cancel' | translate }}</button>
            <button type="button" class="btn-primary-erp" [disabled]="sectionBusy" (click)="submitEditSection()">{{ sectionBusy ? ('academic.modal.saving' | translate) : ('academic.modal.save' | translate) }}</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AcademicComponent implements OnInit {
  tab: 'years' | 'classes' | 'promotion' = 'classes';
  academicYears: AcademicYear[] = [];
  classes: SchoolClass[] = [];
  teachers: Teacher[] = [];
  canManageAcademic = false;
  filterYearId: number | null = null;
  assignClassId: number | null = null;
  assignTeacherId: number | null = null;
  assigningTeacher = false;
  showAddYear = false;
  showCreateClass = false;
  showEditClass = false;
  editClassTarget: SchoolClass | null = null;
  newClass: {
    name: string;
    grade: number;
    academicYearId: number | null;
    sectionNamesText: string;
    sectionCapacity: number;
    classTeacherId: number | null;
  } = { name: '', grade: 1, academicYearId: null, sectionNamesText: '', sectionCapacity: 40, classTeacherId: null };
  editClassForm = { name: '', grade: 1 };
  showAddSection = false;
  sectionClassId: number | null = null;
  newSection = { name: '', capacity: 40 };
  showEditSection = false;
  editSectionClassId: number | null = null;
  editSectionId: number | null = null;
  editSectionForm = { name: '', capacity: 40 };
  savingClass = false;
  sectionBusy = false;
  newYear = { name: '', startDate: '', endDate: '' };
  promoFromClass: number | null = null;
  promotionPreview: PromotionPreview | null = null;
  promotionLoading = false;
  promoting = false;
  promotionDone = '';
  allSelected = true;
  /** Chosen target section for bulk promotion (API targetSectionId). */
  promoTargetSectionId: number | null = null;
  splitPreview: PromotionSplitPreview | null = null;
  splitLoading = false;

  constructor(
    private academicService: AcademicService,
    private teacherService: TeacherService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const r = this.auth.getRole();
    this.canManageAcademic = r === 'admin' || r === 'super_admin';
    if (this.canManageAcademic) {
      this.tab = 'classes';
    }
    this.reloadData();
    this.teacherService.getTeachers().subscribe(list => (this.teachers = list));
  }

  get filteredClasses(): SchoolClass[] {
    if (this.filterYearId == null) return this.classes;
    return this.classes.filter(c => c.academicYearId === this.filterYearId);
  }

  get classesMissingHomeroom(): SchoolClass[] {
    return this.filteredClasses.filter(c => !c.classTeacherId);
  }

  /** Teacher is already homeroom on another class (backend/mock will clear the other class when saving). */
  get assignConflictClass(): SchoolClass | null {
    if (this.assignClassId == null || this.assignTeacherId == null) return null;
    return this.classes.find(c => c.classTeacherId === this.assignTeacherId && c.id !== this.assignClassId) ?? null;
  }

  get teachersForHomeroom(): Teacher[] {
    return this.teachers.filter(t => t.status === 'active');
  }

  prefillAssignClassTeacher(cls: SchoolClass): void {
    this.assignClassId = cls.id;
    this.assignTeacherId = cls.classTeacherId ?? null;
    setTimeout(() => {
      document.getElementById('academic-assign-class-teacher-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  get promotableClasses(): SchoolClass[] {
    return this.classes.filter(cls => cls.grade < 12);
  }

  get selectedForPromo(): number {
    return this.promotionPreview?.students.filter(student => student.selected).length ?? 0;
  }

  getTotalStudents(cls: SchoolClass): number {
    if (cls.sections.length === 0) {
      return cls.totalStudents ?? 0;
    }
    return cls.sections.reduce((sum, section) => sum + section.studentCount, 0);
  }

  openCreateClassModal(): void {
    const cur = this.academicYears.find(y => y.isCurrent);
    this.newClass = {
      name: '',
      grade: 1,
      academicYearId: cur?.id ?? this.academicYears[0]?.id ?? null,
      sectionNamesText: '',
      sectionCapacity: 40,
      classTeacherId: null,
    };
    this.showCreateClass = true;
  }

  submitCreateClass(): void {
    const n = this.newClass.name.trim();
    if (!n || this.newClass.academicYearId == null) return;
    const names = this.newClass.sectionNamesText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    const t =
      this.newClass.classTeacherId != null
        ? this.teachers.find(x => x.id === this.newClass.classTeacherId)
        : undefined;
    this.savingClass = true;
    this.academicService
      .createClass({
        name: n,
        grade: Number(this.newClass.grade),
        academicYearId: this.newClass.academicYearId,
        sectionNames: names,
        sectionCapacity: this.newClass.sectionCapacity,
        classTeacherId: this.newClass.classTeacherId ?? null,
        classTeacherName: t ? `${t.firstName} ${t.lastName}` : undefined,
      })
      .subscribe({
        next: () => {
          this.academicService.getClasses().subscribe({
            next: list => {
              this.classes = list;
              this.savingClass = false;
              this.showCreateClass = false;
            },
            error: () => {
              this.savingClass = false;
            },
          });
        },
        error: () => {
          this.savingClass = false;
        },
      });
  }

  openEditClassModal(cls: SchoolClass): void {
    this.editClassTarget = cls;
    this.editClassForm = { name: cls.name, grade: cls.grade };
    this.showEditClass = true;
  }

  submitEditClass(): void {
    if (!this.editClassTarget) return;
    const name = this.editClassForm.name.trim();
    if (!name) return;
    this.savingClass = true;
    this.academicService.updateClass(this.editClassTarget.id, name, Number(this.editClassForm.grade)).subscribe({
      next: updated => {
        this.classes = this.classes.map(c => (c.id === updated.id ? updated : c));
        this.savingClass = false;
        this.showEditClass = false;
        this.editClassTarget = null;
      },
      error: () => {
        this.savingClass = false;
      },
    });
  }

  openAddSectionModal(cls: SchoolClass): void {
    this.sectionClassId = cls.id;
    this.newSection = { name: '', capacity: 40 };
    this.showAddSection = true;
  }

  submitAddSection(): void {
    const name = this.newSection.name.trim();
    if (!name || this.sectionClassId == null) return;
    this.sectionBusy = true;
    this.academicService.addSectionToClass(this.sectionClassId, name, Number(this.newSection.capacity) || 40).subscribe({
      next: updated => {
        this.classes = this.classes.map(c => (c.id === updated.id ? updated : c));
        this.sectionBusy = false;
        this.showAddSection = false;
      },
      error: () => {
        this.sectionBusy = false;
      },
    });
  }

  openEditSectionModal(cls: SchoolClass, sec: { id: number; name: string; capacity: number }): void {
    this.editSectionClassId = cls.id;
    this.editSectionId = sec.id;
    this.editSectionForm = { name: sec.name, capacity: sec.capacity };
    this.showEditSection = true;
  }

  submitEditSection(): void {
    const name = this.editSectionForm.name.trim();
    if (!name || this.editSectionClassId == null || this.editSectionId == null) return;
    this.sectionBusy = true;
    this.academicService
      .updateSection(this.editSectionClassId, this.editSectionId, name, Number(this.editSectionForm.capacity) || 40)
      .subscribe({
        next: updated => {
          this.classes = this.classes.map(c => (c.id === updated.id ? updated : c));
          this.sectionBusy = false;
          this.showEditSection = false;
        },
        error: () => {
          this.sectionBusy = false;
        },
      });
  }

  removeSection(cls: SchoolClass, sec: { id: number; name: string; studentCount: number }): void {
    if (sec.studentCount > 0) return;
    this.confirmDialog
      .confirm({
        title: this.translate.instant('academic.confirm.removeSection.title'),
        message: this.translate.instant('academic.confirm.removeSection.message', {
          section: sec.name,
          class: cls.name,
        }),
        details: [
          this.translate.instant('academic.confirm.removeSection.detailClass', {
            name: cls.name,
            grade: cls.grade ?? this.translate.instant('academic.promotion.dash'),
          }),
          this.translate.instant('academic.confirm.removeSection.detailRule'),
        ],
        variant: 'danger',
        confirmLabel: this.translate.instant('academic.confirm.removeSection.confirm'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.sectionBusy = true;
        this.academicService.deleteSection(cls.id, sec.id).subscribe({
          next: updated => {
            if (updated) {
              this.classes = this.classes.map(c => (c.id === updated.id ? updated : c));
            }
            this.sectionBusy = false;
          },
          error: () => {
            this.sectionBusy = false;
          },
        });
      });
  }

  saveClassTeacher(): void {
    if (!this.canManageAcademic || this.assignClassId == null) return;
    const cls = this.classes.find(c => c.id === this.assignClassId);
    if (!cls) return;
    const currentId = cls.classTeacherId ?? null;
    const nextId = this.assignTeacherId ?? null;
    if (currentId === nextId) return;

    const t = nextId != null ? this.teachers.find(x => x.id === nextId) : undefined;
    const nextName = t ? `${t.firstName} ${t.lastName}` : '';
    const currentName =
      cls.classTeacherName?.trim() ||
      this.translate.instant('academic.confirm.classTeacher.unknownTeacher');

    const conflict = this.assignConflictClass;
    const details: string[] = [];
    if (conflict) {
      details.push(
        this.translate.instant('academic.confirm.classTeacher.detailWillMoveFrom', {
          teacher: nextName,
          otherClass: conflict.name,
        })
      );
    }

    let title: string;
    let message: string;
    let variant: 'warning' | 'danger' | 'primary' = 'warning';

    if (nextId == null) {
      title = this.translate.instant('academic.confirm.classTeacher.removeTitle');
      message = this.translate.instant('academic.confirm.classTeacher.removeMessage', { class: cls.name });
      details.unshift(
        this.translate.instant('academic.confirm.classTeacher.removeDetailCurrent', { name: currentName })
      );
      variant = 'warning';
    } else if (currentId == null) {
      title = this.translate.instant('academic.confirm.classTeacher.assignTitle');
      message = this.translate.instant('academic.confirm.classTeacher.assignMessage', {
        teacher: nextName,
        class: cls.name,
      });
      variant = 'primary';
    } else {
      title = this.translate.instant('academic.confirm.classTeacher.changeTitle');
      message = this.translate.instant('academic.confirm.classTeacher.changeMessage', {
        class: cls.name,
        current: currentName,
        next: nextName,
      });
      variant = 'warning';
    }

    this.confirmDialog
      .confirm({
        title,
        message,
        details: details.length ? details : undefined,
        variant,
        confirmLabel: this.translate.instant('academic.confirm.classTeacher.confirm'),
        cancelLabel: this.translate.instant('academic.confirm.classTeacher.cancel'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.executeSaveClassTeacher());
  }

  private executeSaveClassTeacher(): void {
    if (this.assignClassId == null) return;
    const t =
      this.assignTeacherId != null ? this.teachers.find(x => x.id === this.assignTeacherId) : undefined;
    this.assigningTeacher = true;
    this.academicService
      .assignClassTeacher(
        this.assignClassId,
        this.assignTeacherId ?? null,
        t ? `${t.firstName} ${t.lastName}` : undefined
      )
      .subscribe({
        next: () => {
          this.academicService.getClasses().subscribe({
            next: list => {
              this.classes = list;
              this.assigningTeacher = false;
            },
            error: () => {
              this.assigningTeacher = false;
            },
          });
        },
        error: () => {
          this.assigningTeacher = false;
        },
      });
  }

  activatePromotionTab(): void {
    this.tab = 'promotion';
    this.promotionDone = '';
  }

  loadPromotionPreview(): void {
    this.promotionDone = '';
    this.promotionPreview = null;
    this.splitPreview = null;
    this.promoTargetSectionId = null;
    if (this.promoFromClass == null) {
      return;
    }
    this.promotionLoading = true;
    this.academicService.previewPromotion(this.promoFromClass).subscribe({
      next: preview => {
        this.promotionPreview = preview;
        this.promoTargetSectionId =
          preview.defaultSectionId ?? (preview.targetSections?.length ? preview.targetSections[0].id : null);
        this.allSelected = preview.students.every(student => student.selected);
        this.promotionLoading = false;
      },
      error: () => {
        this.promotionLoading = false;
      }
    });
  }

  loadSplitPreview(): void {
    if (!this.promotionPreview) {
      return;
    }
    this.splitLoading = true;
    this.academicService
      .promotionSplitPreview(this.promotionPreview.sourceClassId, this.promotionPreview.targetClassId)
      .subscribe({
        next: sp => {
          this.splitPreview = sp;
          this.splitLoading = false;
        },
        error: () => {
          this.splitLoading = false;
        },
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
    const targetSection = this.promoTargetSectionId ?? this.promotionPreview.defaultSectionId ?? undefined;
    this.academicService.executePromotion(
      this.promotionPreview.sourceClassId,
      this.promotionPreview.targetClassId,
      studentIds,
      targetSection
    ).subscribe({
      next: result => {
        this.promoting = false;
        const sectionPart = result.targetSectionName
          ? this.translate.instant('academic.promotion.sectionPart', { name: result.targetSectionName })
          : '';
        this.promotionDone = this.translate.instant('academic.promotion.doneMessage', {
          count: result.promotedCount,
          className: result.targetClassName,
          sectionPart,
        });
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
    const nextAyId = this.academicYears.reduce((m, y) => Math.max(m, y.id), 0) + 1;
    const academicYear: AcademicYear = {
      id: nextAyId,
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
