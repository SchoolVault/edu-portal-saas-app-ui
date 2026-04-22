import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TenantModuleGateService } from '../../core/services/tenant-module-gate.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { ParentService } from '../../core/services/parent.service';
import { PersonalProfileDetails, SchoolBranch, Student } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';
import { UserLocaleService, type UiLanguage } from '../../core/i18n/user-locale.service';
import { ParentSelectionService } from '../../core/services/parent-selection.service';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

type SettingsFeatureToggleView = {
  enabled: boolean;
  persistKey: string;
  platformOnly?: boolean;
  nameLabel: string;
  descriptionLabel: string;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ProfilePhotoPickerComponent, SchoolClassNamePipe],
  template: `
    <div data-testid="settings-page">
      <div class="mb-4 animate-in d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ (isTenantAdmin ? 'settings.pageTitle' : 'settings.pageTitleUserShell') | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">
            <ng-container *ngIf="isTenantAdmin">{{ 'settings.leadAdmin' | translate }}</ng-container>
            <ng-container *ngIf="!isTenantAdmin">{{ 'settings.leadUser' | translate }}</ng-container>
          </p>
        </div>
        <button type="button" class="btn-outline-erp btn-sm align-self-center" (click)="reloadSettings()" [disabled]="settingsRefreshing">
          <i class="bi bi-arrow-clockwise"></i> {{ settingsRefreshing ? ('settings.refreshing' | translate) : ('settings.refresh' | translate) }}
        </button>
      </div>
      <div class="erp-tabs animate-in">
        <button type="button" class="erp-tab" [class.active]="tab === 'general'" (click)="selectSettingsTab('general')">{{ isTenantAdmin ? ('settings.tabGeneralAdmin' | translate) : ('settings.tabGeneralUser' | translate) }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'preferences'" (click)="selectSettingsTab('preferences')">{{ 'prefs.tab' | translate }}</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'branding'" (click)="tab = 'branding'">{{ 'settings.tabBranding' | translate }}</button>
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'roles'" (click)="tab = 'roles'">{{ 'settings.tabRoles' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'profile'" (click)="selectSettingsTab('profile')">{{ 'settings.tabProfile' | translate }}</button>
      </div>

      <div *ngIf="tab === 'preferences'" class="erp-card animate-in settings-prefs-card">
        <header class="settings-prefs-card__header">
          <h3 class="settings-prefs-card__title">{{ 'prefs.heading' | translate }}</h3>
          <p class="settings-prefs-card__lead">{{ 'prefs.lead' | translate }}</p>
        </header>
        <div class="settings-prefs-card__body">
          <div class="erp-form-group">
            <label class="erp-label" for="settings-ui-lang">{{ 'prefs.fieldLabel' | translate }}</label>
            <select
              id="settings-ui-lang"
              class="erp-select settings-prefs-card__select"
              name="prefsLang"
              [(ngModel)]="prefsLang"
              (ngModelChange)="onPrefsLangDraftChange()"
              [attr.aria-label]="'prefs.fieldLabel' | translate">
              <option *ngFor="let o of userLocale.supported" [value]="o.code">{{ o.nativeLabel }}</option>
            </select>
            <p class="text-muted small mb-0 mt-1">{{ 'prefs.fieldHelp' | translate }}</p>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
            <button type="button" class="btn-primary-erp" (click)="savePreferences()" [disabled]="prefsSaving">
              {{ prefsSaving ? ('prefs.saving' | translate) : ('prefs.save' | translate) }}
            </button>
            <span *ngIf="prefsSaved" class="text-success small">{{ 'prefs.saved' | translate }}</span>
            <span *ngIf="prefsErr" class="text-danger small">{{ prefsErr }}</span>
          </div>
        </div>
      </div>

      <div *ngIf="tab === 'profile'" class="erp-card animate-in settings-profile-root">
        <header class="settings-profile-root__header">
          <h3 class="settings-profile-root__title">{{ 'settings.profileTitle' | translate }}</h3>
          <p class="settings-profile-root__lead">
            {{ 'settings.profileLead' | translate }}
          </p>
        </header>

        <div class="settings-profile-shell">
          <!-- Editable portrait: single focal avatar (picker) + account details — no duplicate image -->
          <section
            *ngIf="canEditOwnPhoto && profileUser as u"
            class="settings-profile-unified"
            [attr.data-role]="profileVisualRole"
            [attr.aria-label]="'settings.ariaProfilePhoto' | translate"
          >
            <div class="settings-profile-hero">
              <div class="settings-profile-hero__visual">
                <app-profile-photo-picker
                  [previewUrl]="profilePreviewUrl"
                  [initials]="profileInitials"
                  [frameAriaLabel]="'settings.uploadPhotoAria' | translate"
                  size="hero"
                  layout="stacked"
                  statusMode="none"
                  (photoPicked)="onOwnPhotoPicked($event)"
                  (photoRemoved)="onOwnPhotoRemoved()"
                />
              </div>
              <div class="settings-profile-hero__details">
                <div class="settings-profile-hero__titleblock">
                  <div class="settings-profile-hero__name">{{ u.name }}</div>
                  <div class="settings-profile-hero__email">{{ u.email }}</div>
                  <div class="settings-profile-hero__badges">
                    <span class="settings-profile-role">{{ roleDisplayLabel }}</span>
                  </div>
                </div>
                <dl class="settings-profile-hero__meta">
                  <div class="settings-profile-hero__meta-row">
                    <dt>{{ 'settings.labelSchool' | translate }}</dt>
                    <dd>{{ schoolName || ('exams.dash' | translate) }}</dd>
                  </div>
                  <div class="settings-profile-hero__meta-row" *ngIf="schoolCode">
                    <dt>{{ 'settings.labelCode' | translate }}</dt>
                    <dd><code class="settings-profile-code">{{ schoolCode }}</code></dd>
                  </div>
                  <div class="settings-profile-hero__meta-row">
                    <dt>{{ 'settings.labelContactPhone' | translate }}</dt>
                    <dd>{{ u.phone || ('exams.dash' | translate) }}</dd>
                  </div>
                </dl>
                <p class="settings-profile-hero__hint">{{ photoHintLine }}</p>
              </div>
            </div>
          </section>

          <!-- Parent: read-only identity (one avatar) + linked children note -->
          <section
            *ngIf="!canEditOwnPhoto && isParentOnlyChildren && profileUser as u"
            class="settings-profile-unified"
            [attr.data-role]="profileVisualRole"
            [attr.aria-label]="'settings.ariaAccount' | translate"
          >
            <div class="settings-profile-hero settings-profile-hero--readonly">
              <div class="settings-profile-hero__visual">
                <div *ngIf="!profilePreviewUrl" class="settings-profile-hero__avatar-fallback" aria-hidden="true">{{ profileInitials }}</div>
                <img
                  *ngIf="profilePreviewUrl"
                  [src]="profilePreviewUrl"
                  alt=""
                  class="settings-profile-hero__avatar-img"
                />
              </div>
              <div class="settings-profile-hero__details">
                <div class="settings-profile-hero__titleblock">
                  <div class="settings-profile-hero__name">{{ u.name }}</div>
                  <div class="settings-profile-hero__email">{{ u.email }}</div>
                  <div class="settings-profile-hero__badges">
                    <span class="settings-profile-role">{{ roleDisplayLabel }}</span>
                  </div>
                </div>
                <dl class="settings-profile-hero__meta">
                  <div class="settings-profile-hero__meta-row">
                    <dt>{{ 'settings.labelSchool' | translate }}</dt>
                    <dd>{{ schoolName || ('exams.dash' | translate) }}</dd>
                  </div>
                  <div class="settings-profile-hero__meta-row" *ngIf="schoolCode">
                    <dt>{{ 'settings.labelCode' | translate }}</dt>
                    <dd><code class="settings-profile-code">{{ schoolCode }}</code></dd>
                  </div>
                  <div class="settings-profile-hero__meta-row">
                    <dt>{{ 'settings.labelContactPhone' | translate }}</dt>
                    <dd>{{ u.phone || ('exams.dash' | translate) }}</dd>
                  </div>
                </dl>
                <p class="settings-profile-footnote mb-0" *ngIf="myChildren.length">
                  <i class="bi bi-people me-1"></i>{{ myChildren.length === 1 ? ('settings.linkedChildrenOne' | translate: { n: myChildren.length }) : ('settings.linkedChildrenMany' | translate: { n: myChildren.length }) }}
                </p>
              </div>
            </div>
          </section>

          <!-- Roles without self-serve photo: identity + directory policy -->
          <ng-container *ngIf="!canEditOwnPhoto && !isParentOnlyChildren && profileUser as u">
            <section class="settings-profile-unified" [attr.data-role]="profileVisualRole" [attr.aria-label]="'settings.ariaProfileReadonly' | translate">
              <div class="settings-profile-hero settings-profile-hero--readonly">
                <div class="settings-profile-hero__visual">
                  <div *ngIf="!profilePreviewUrl" class="settings-profile-hero__avatar-fallback" aria-hidden="true">{{ profileInitials }}</div>
                  <img
                    *ngIf="profilePreviewUrl"
                    [src]="profilePreviewUrl"
                    alt=""
                    class="settings-profile-hero__avatar-img"
                  />
                </div>
                <div class="settings-profile-hero__details">
                  <div class="settings-profile-hero__titleblock">
                    <div class="settings-profile-hero__name">{{ u.name }}</div>
                    <div class="settings-profile-hero__email">{{ u.email }}</div>
                    <div class="settings-profile-hero__badges">
                      <span class="settings-profile-role">{{ roleDisplayLabel }}</span>
                    </div>
                  </div>
                  <dl class="settings-profile-hero__meta">
                    <div class="settings-profile-hero__meta-row">
                      <dt>{{ 'settings.labelSchool' | translate }}</dt>
                      <dd>{{ schoolName || ('exams.dash' | translate) }}</dd>
                    </div>
                    <div class="settings-profile-hero__meta-row" *ngIf="schoolCode">
                      <dt>{{ 'settings.labelCode' | translate }}</dt>
                      <dd><code class="settings-profile-code">{{ schoolCode }}</code></dd>
                    </div>
                    <div class="settings-profile-hero__meta-row">
                      <dt>{{ 'settings.labelContactPhone' | translate }}</dt>
                      <dd>{{ u.phone || ('exams.dash' | translate) }}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
            <section class="settings-profile-panel settings-profile-panel--note settings-profile-follow" aria-labelledby="settings-profile-dir-h">
              <div class="settings-profile-panel__head" id="settings-profile-dir-h">
                <span class="settings-profile-panel__icon"><i class="bi bi-info-circle"></i></span>
                <span class="settings-profile-panel__head-text">{{ 'settings.directoryPhotoHeading' | translate }}</span>
              </div>
              <div class="settings-profile-panel__body">
                <p class="settings-profile-hint mb-2">{{ 'settings.photoHintManaged' | translate }}</p>
                <ul class="settings-profile-bullets">
                  <li>{{ 'settings.directoryPhotoBullet1' | translate }}</li>
                  <li>{{ 'settings.directoryPhotoBullet2' | translate }}</li>
                </ul>
              </div>
            </section>
          </ng-container>

          <!-- Parent: school record + optional portal-only photo -->
          <section
            *ngIf="isParentOnlyChildren"
            class="settings-profile-panel settings-profile-child-section"
            aria-labelledby="settings-profile-child-h"
          >
            <div class="settings-profile-panel__head" id="settings-profile-child-h">
              <span class="settings-profile-panel__icon"><i class="bi bi-person-hearts"></i></span>
              <span class="settings-profile-panel__head-text">{{ 'settings.linkedChildrenHeading' | translate }}</span>
            </div>
            <div class="settings-profile-panel__body">
              <p class="settings-profile-hint">{{ 'settings.linkedChildrenHintLong' | translate }}</p>
              <label class="erp-label d-block mb-2">{{ 'settings.labelChildSelect' | translate }}</label>
              <select class="erp-select mb-3" [(ngModel)]="childPhotoTargetId" (ngModelChange)="syncChildPhotoPreview()">
                <option [ngValue]="null">{{ 'settings.selectChildOption' | translate }}</option>
                <option *ngFor="let s of myChildren" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
              </select>

              <div *ngIf="selectedChildForProfile as ch" class="settings-child-school-card mb-4">
                <div class="settings-child-school-card__title">{{ 'settings.schoolRecordTitle' | translate }}</div>
                <dl class="settings-child-school-card__grid">
                  <div><dt>{{ 'settings.dtClassSection' | translate }}</dt><dd>{{ ch.className | schoolClassName }} · {{ 'settings.sectionLabel' | translate: { name: ch.sectionName } }}</dd></div>
                  <div><dt>{{ 'settings.dtRollAdmission' | translate }}</dt><dd>{{ ch.rollNumber }} · {{ ch.admissionNumber }}</dd></div>
                  <div><dt>{{ 'settings.dtAdmissionDate' | translate }}</dt><dd>{{ ch.admissionDate || ('exams.dash' | translate) }}</dd></div>
                  <div><dt>{{ 'settings.dtStatus' | translate }}</dt><dd class="text-capitalize">{{ ch.status }}</dd></div>
                  <div><dt>{{ 'settings.dtHomeroomTeacher' | translate }}</dt><dd>{{ ch.homeroomTeacherName || ('exams.dash' | translate) }}</dd></div>
                  <div><dt>{{ 'settings.labelSchoolEmail' | translate }}</dt><dd>{{ ch.email || ('exams.dash' | translate) }}</dd></div>
                </dl>
              </div>

              <p *ngIf="!childPhotoTargetId" class="settings-profile-placeholder mb-3">{{ 'settings.selectChildForDetails' | translate }}</p>

              <div *ngIf="childPhotoTargetId" class="settings-child-photo-block">
                <label class="erp-label d-block mb-2">{{ 'settings.optionalPortalPhoto' | translate }}</label>
                <p class="settings-profile-hint small mb-2">{{ 'settings.optionalPortalPhotoHint' | translate }}</p>
                <app-profile-photo-picker
                  [previewUrl]="childPhotoPreview"
                  [initials]="childPhotoInitials"
                  [frameAriaLabel]="'settings.frameAriaOptionalChildPhoto' | translate"
                  size="comfortable"
                  statusMode="minimal"
                  (photoPicked)="onChildPhotoPicked($event)"
                  (photoRemoved)="onChildPhotoRemoved()"
                />
              </div>
              <p class="settings-profile-footnote settings-profile-footnote--below mb-0">{{ 'settings.directoryPhotosUpdatedByStaff' | translate }}</p>
            </div>
          </section>

          <section
            *ngIf="profileUser as account"
            class="settings-profile-panel settings-profile-follow"
            aria-labelledby="settings-profile-account-h"
          >
            <div class="settings-profile-panel__head d-flex flex-wrap justify-content-between align-items-center gap-2" id="settings-profile-account-h">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <span class="settings-profile-panel__icon"><i class="bi bi-person-badge"></i></span>
                <span class="settings-profile-panel__head-text">{{ 'settings.accountDetailsTitle' | translate }}</span>
              </div>
              <div class="d-flex flex-wrap gap-2 flex-shrink-0" *ngIf="!accountDetailsEditing">
                <button type="button" class="btn-outline-erp btn-sm" (click)="beginAccountDetailsEdit()">{{ 'settings.editAccountDetails' | translate }}</button>
              </div>
              <div class="d-flex flex-wrap gap-2 flex-shrink-0" *ngIf="accountDetailsEditing">
                <button type="button" class="btn-outline-erp btn-sm" (click)="cancelAccountDetailsEdit()">{{ 'settings.cancelAccountEdit' | translate }}</button>
              </div>
            </div>
            <div class="settings-profile-panel__body">
              <p class="settings-profile-hint mb-3" *ngIf="!accountDetailsEditing">{{ 'settings.accountDetailsViewLead' | translate }}</p>
              <p class="settings-profile-hint mb-3" *ngIf="accountDetailsEditing">{{ 'settings.accountDetailsLead' | translate }}</p>
              <div class="row g-3 mb-1" *ngIf="!accountDetailsEditing">
                <div class="col-12">
                  <p class="mb-1"><strong>{{ 'settings.profileFullNameLabel' | translate }}:</strong> {{ account.name }}</p>
                  <p class="mb-1"><strong>{{ 'settings.profileContactPhoneLabel' | translate }}:</strong> {{ account.phone || ('exams.dash' | translate) }}</p>
                  <p class="mb-1"><strong>{{ 'settings.labelEmail' | translate }}:</strong> {{ account.email }}</p>
                  <p class="text-muted small mb-0">{{ 'settings.profileEmailReadonlyHint' | translate }}</p>
                  <ng-container *ngIf="isTeacherProfileEditable">
                    <p class="mb-1 mt-2"><strong>{{ 'settings.teacherQualificationLabel' | translate }}:</strong> {{ profileDetails?.qualification || ('exams.dash' | translate) }}</p>
                    <p class="mb-1"><strong>{{ 'settings.teacherSpecializationLabel' | translate }}:</strong> {{ profileDetails?.specialization || ('exams.dash' | translate) }}</p>
                    <p class="mb-1"><strong>{{ 'settings.bankAccountHolderLabel' | translate }}:</strong> {{ profileDetails?.bankAccountHolder || ('exams.dash' | translate) }}</p>
                    <p class="mb-1"><strong>{{ 'settings.bankNameLabel' | translate }}:</strong> {{ profileDetails?.bankName || ('exams.dash' | translate) }}</p>
                    <p class="mb-1"><strong>{{ 'settings.bankAccountNumberLabel' | translate }}:</strong> {{ profileDetails?.bankAccountNumber || ('exams.dash' | translate) }}</p>
                    <p class="mb-0"><strong>{{ 'settings.bankIfscLabel' | translate }}:</strong> {{ profileDetails?.bankIfsc || ('exams.dash' | translate) }}</p>
                  </ng-container>
                </div>
              </div>
              <div class="row g-3" *ngIf="accountDetailsEditing">
                <div class="col-md-6">
                  <div class="erp-form-group">
                    <label class="erp-label" for="settings-acct-name">{{ 'settings.profileFullNameLabel' | translate }}</label>
                    <input
                      id="settings-acct-name"
                      type="text"
                      class="erp-input"
                      name="profileDraftName"
                      [(ngModel)]="profileDraftName"
                      autocomplete="name"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="erp-form-group">
                    <label class="erp-label" for="settings-acct-phone">{{ 'settings.profileContactPhoneLabel' | translate }}</label>
                    <input
                      id="settings-acct-phone"
                      type="tel"
                      class="erp-input"
                      name="profileDraftPhone"
                      [(ngModel)]="profileDraftPhone"
                      autocomplete="tel"
                    />
                  </div>
                </div>
                <div class="col-12">
                  <div class="erp-form-group mb-0">
                    <label class="erp-label" for="settings-acct-email-ro">{{ 'settings.labelEmail' | translate }}</label>
                    <input
                      id="settings-acct-email-ro"
                      type="email"
                      class="erp-input"
                      [value]="account.email"
                      readonly
                      tabindex="-1"
                      [attr.aria-label]="'settings.profileEmailReadonlyAria' | translate"
                    />
                    <p class="text-muted small mb-0 mt-1">{{ 'settings.profileEmailReadonlyHint' | translate }}</p>
                  </div>
                </div>
                <ng-container *ngIf="isTeacherProfileEditable">
                  <div class="col-md-6">
                    <div class="erp-form-group">
                      <label class="erp-label" for="settings-qualification">{{ 'settings.teacherQualificationLabel' | translate }}</label>
                      <input id="settings-qualification" type="text" class="erp-input" name="profileDraftQualification" [(ngModel)]="profileDraftQualification" />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="erp-form-group">
                      <label class="erp-label" for="settings-specialization">{{ 'settings.teacherSpecializationLabel' | translate }}</label>
                      <input id="settings-specialization" type="text" class="erp-input" name="profileDraftSpecialization" [(ngModel)]="profileDraftSpecialization" />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="erp-form-group">
                      <label class="erp-label" for="settings-bank-holder">{{ 'settings.bankAccountHolderLabel' | translate }}</label>
                      <input id="settings-bank-holder" type="text" class="erp-input" name="profileDraftBankAccountHolder" [(ngModel)]="profileDraftBankAccountHolder" />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="erp-form-group">
                      <label class="erp-label" for="settings-bank-name">{{ 'settings.bankNameLabel' | translate }}</label>
                      <input id="settings-bank-name" type="text" class="erp-input" name="profileDraftBankName" [(ngModel)]="profileDraftBankName" />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="erp-form-group">
                      <label class="erp-label" for="settings-bank-number">{{ 'settings.bankAccountNumberLabel' | translate }}</label>
                      <input id="settings-bank-number" type="text" class="erp-input" name="profileDraftBankAccountNumber" [(ngModel)]="profileDraftBankAccountNumber" />
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="erp-form-group mb-0">
                      <label class="erp-label" for="settings-bank-ifsc">{{ 'settings.bankIfscLabel' | translate }}</label>
                      <input id="settings-bank-ifsc" type="text" class="erp-input" name="profileDraftBankIfsc" [(ngModel)]="profileDraftBankIfsc" />
                    </div>
                  </div>
                </ng-container>
              </div>
              <div class="d-flex flex-wrap align-items-center gap-2 mt-3" *ngIf="accountDetailsEditing">
                <button type="button" class="btn-primary-erp" (click)="saveProfileAccount()" [disabled]="profileAccountSaving">
                  {{ profileAccountSaving ? ('settings.profileSaving' | translate) : ('settings.saveProfileDetails' | translate) }}
                </button>
                <span *ngIf="profileAccountMsg" class="text-success small">{{ profileAccountMsg }}</span>
                <span *ngIf="profileAccountErr" class="text-danger small">{{ profileAccountErr }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div *ngIf="tab === 'general'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">{{ 'settings.schoolInfoTitle' | translate }}</h4>
        <ng-container *ngIf="isTenantAdmin">
          <div class="row g-3">
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelSchoolName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolName" data-testid="school-name-input"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelSchoolCode' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolCode" disabled [title]="'settings.schoolCodeTitle' | translate"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelEmail' | translate }}</label><input type="email" class="erp-input" [(ngModel)]="schoolEmail"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelPhone' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolPhone"></div></div>
            <div class="col-12"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelAddress' | translate }}</label><textarea class="erp-input erp-textarea" [(ngModel)]="schoolAddress" style="min-height: 80px;"></textarea></div></div>
          </div>
          <div class="d-flex justify-content-end align-items-center flex-wrap gap-2 mt-3">
            <span *ngIf="generalSaveMsg" class="text-success small">{{ generalSaveMsg }}</span>
            <span *ngIf="generalSaveError" class="text-danger small">{{ generalSaveError }}</span>
            <button class="btn-primary-erp" data-testid="save-settings-btn" type="button" (click)="saveGeneral()" [disabled]="saving">{{ saving ? ('settings.savingEllipsis' | translate) : ('settings.saveChanges' | translate) }}</button>
          </div>
        </ng-container>
        <ng-container *ngIf="!isTenantAdmin">
          <p class="text-muted small mb-3">{{ 'settings.contactOfficeForUpdates' | translate }}</p>
          <dl class="settings-readonly-grid row g-3 mb-0">
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelSchoolName' | translate }}</dt><dd class="settings-ro-value">{{ schoolName }}</dd></div>
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelSchoolCode' | translate }}</dt><dd class="settings-ro-value"><code class="settings-profile-code">{{ schoolCode }}</code></dd></div>
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelEmail' | translate }}</dt><dd class="settings-ro-value">{{ schoolEmail || ('exams.dash' | translate) }}</dd></div>
            <div class="col-md-6"><dt class="erp-label">{{ 'settings.labelPhone' | translate }}</dt><dd class="settings-ro-value">{{ schoolPhone || ('exams.dash' | translate) }}</dd></div>
            <div class="col-12"><dt class="erp-label">{{ 'settings.labelAddress' | translate }}</dt><dd class="settings-ro-value" style="white-space: pre-wrap;">{{ schoolAddress || ('exams.dash' | translate) }}</dd></div>
          </dl>
        </ng-container>

        <div *ngIf="isTenantAdmin" class="mt-4 pt-4" style="border-top: 1px solid var(--clr-border-light);">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">{{ 'settings.branchesHeading' | translate }}</h4>
              <p class="text-muted small mb-0">{{ 'settings.branchesLead' | translate }}</p>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadBranches()" [disabled]="branchesLoading">
              {{ branchesLoading ? ('settings.loadingEllipsis' | translate) : ('settings.fetchBranches' | translate) }}
            </button>
          </div>
          <div *ngIf="branchesError" class="alert alert-danger py-2 small">{{ branchesError }}</div>
          <div *ngIf="branches.length" class="row g-3">
            <div class="col-md-6 col-lg-4" *ngFor="let br of branches">
              <div class="p-3 rounded-3 h-100" style="border: 1px solid var(--clr-border); background: var(--clr-surface-muted);">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <strong style="font-size: 14px;">{{ br.schoolName }}</strong>
                  <span *ngIf="br.currentTenant" class="badge-erp badge-success">{{ 'settings.youAreHere' | translate }}</span>
                </div>
                <div class="small text-muted mb-1"><i class="bi bi-hash me-1"></i>{{ br.schoolCode }}</div>
                <div class="small mb-1" *ngIf="br.address"><i class="bi bi-geo-alt me-1 text-muted"></i>{{ br.address }}</div>
                <div class="small mb-1" *ngIf="br.phone"><i class="bi bi-telephone me-1 text-muted"></i>{{ br.phone }}</div>
                <div class="small" *ngIf="br.email"><i class="bi bi-envelope me-1 text-muted"></i>{{ br.email }}</div>
              </div>
            </div>
          </div>
          <p *ngIf="!branches.length && !branchesLoading && branchesFetched" class="text-muted small mb-0">{{ 'settings.noOtherBranches' | translate }}</p>
        </div>
      </div>

      <div *ngIf="tab === 'branding'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">{{ 'settings.themeBrandingHeading' | translate }}</h4>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">{{ 'settings.labelPrimaryColor' | translate }}</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="primaryColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="primaryColor" style="flex: 1;">
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">{{ 'settings.labelAccentColor' | translate }}</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" [(ngModel)]="accentColor" style="width: 50px; height: 40px; border: 1px solid var(--clr-border); border-radius: var(--radius-md); cursor: pointer;">
                <input type="text" class="erp-input" [(ngModel)]="accentColor" style="flex: 1;">
              </div>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-end mt-3 gap-2 flex-wrap">
          <button type="button" class="btn-outline-erp" (click)="resetBranding()">{{ 'settings.resetBranding' | translate }}</button>
          <button type="button" class="btn-primary-erp" (click)="applyBranding()">{{ 'settings.applyBranding' | translate }}</button>
        </div>
        <p class="text-muted small mt-2 mb-0">{{ 'settings.brandingPersistNote' | translate }}</p>
      </div>

      <div *ngIf="tab === 'roles'" class="erp-card animate-in">
        <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 20px;">{{ 'settings.rolesHeading' | translate }}</h4>
        <table class="erp-table">
          <thead><tr><th>{{ 'settings.thRole' | translate }}</th><th>{{ 'settings.thDescription' | translate }}</th><th>{{ 'settings.thUsers' | translate }}</th><th>{{ 'settings.thStatus' | translate }}</th></tr></thead>
          <tbody>
            <tr><td><strong>{{ 'settings.roleAdminLabel' | translate }}</strong></td><td>{{ 'settings.roleAdminDesc' | translate }}</td><td>1</td><td><span class="badge-erp badge-success">{{ 'settings.statusActive' | translate }}</span></td></tr>
            <tr><td><strong>{{ 'settings.roleTeacherLabel' | translate }}</strong></td><td>{{ 'settings.roleTeacherDesc' | translate }}</td><td>8</td><td><span class="badge-erp badge-success">{{ 'settings.statusActive' | translate }}</span></td></tr>
            <tr><td><strong>{{ 'settings.roleParentLabel' | translate }}</strong></td><td>{{ 'settings.roleParentDesc' | translate }}</td><td>12</td><td><span class="badge-erp badge-success">{{ 'settings.statusActive' | translate }}</span></td></tr>
          </tbody>
        </table>
      </div>

    </div>
  `,
  styles: [
    `
      .settings-profile-root__header {
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
      }
      .settings-profile-root__title {
        font-size: 1.125rem;
        font-weight: 800;
        margin: 0 0 0.4rem;
        color: var(--clr-text-primary, #0f172a);
        letter-spacing: -0.02em;
      }
      .settings-profile-root__lead {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        line-height: 1.55;
        max-width: none;
      }
      .settings-profile-shell {
        width: 100%;
      }
      .settings-profile-unified {
        position: relative;
        border-radius: var(--radius-lg, 12px);
        border: 1px solid var(--clr-border-light, #e8eef0);
        background: linear-gradient(
          152deg,
          color-mix(in srgb, var(--clr-primary, #1b3a30) 10%, var(--clr-surface-muted, #f1f5f9)) 0%,
          var(--clr-surface, #fff) 42%,
          var(--clr-surface, #fff) 100%
        );
        padding: 1.1rem 1.2rem 1.2rem;
        margin: 0;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.045);
      }
      .settings-profile-unified[data-role='admin'] {
        border-left: 4px solid var(--clr-primary, #1b3a30);
      }
      .settings-profile-unified[data-role='teacher'] {
        border-left: 4px solid color-mix(in srgb, var(--clr-primary, #1b3a30) 55%, var(--clr-accent, #c05c3d) 45%);
      }
      .settings-profile-unified[data-role='parent'] {
        border-left: 4px solid var(--clr-accent, #c05c3d);
      }
      .settings-profile-unified[data-role='super_admin'] {
        border-left: 4px solid var(--clr-accent, #0ea5e9);
      }
      .settings-profile-unified[data-role='student'] {
        border-left: 4px solid #6366f1;
      }
      .settings-profile-unified[data-role='other'] {
        border-left: 4px solid var(--clr-border, #cbd5e1);
      }
      .settings-profile-hero {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem 1.35rem;
        align-items: center;
        padding: 0;
      }
      .settings-profile-hero--readonly {
        align-items: center;
      }
      @media (max-width: 599.98px) {
        .settings-profile-hero {
          grid-template-columns: 1fr;
          justify-items: start;
          gap: 1rem;
        }
        .settings-profile-hero--readonly {
          align-items: start;
        }
      }
      .settings-profile-hero__visual {
        min-width: 0;
      }
      .settings-profile-hero__details {
        min-width: 0;
      }
      .settings-profile-hero__titleblock {
        margin-bottom: 0.5rem;
      }
      .settings-profile-hero__name {
        font-size: clamp(1.2rem, 2.2vw, 1.4rem);
        font-weight: 800;
        color: var(--clr-text-primary, #0f172a);
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .settings-profile-hero__email {
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        margin-top: 5px;
        word-break: break-word;
      }
      .settings-profile-hero__badges {
        margin-top: 8px;
      }
      .settings-profile-hero__meta {
        margin: 0.65rem 0 0;
        padding: 0.65rem 0 0;
        border-top: 1px solid color-mix(in srgb, var(--clr-border, #e2e8f0) 85%, transparent);
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.25rem;
      }
      .settings-profile-hero__meta-row {
        display: inline-flex;
        gap: 0.45rem;
        align-items: baseline;
        margin: 0;
        padding: 0;
        font-size: 13px;
      }
      .settings-profile-hero__meta-row dt {
        margin: 0;
        color: var(--clr-text-secondary, #475569);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .settings-profile-hero__meta-row dt::after {
        content: ':';
        margin-left: 1px;
        font-weight: 600;
      }
      .settings-profile-hero__meta-row dd {
        margin: 0;
        color: var(--clr-text-primary, #1e293b);
        font-weight: 600;
      }
      .settings-profile-hero__hint {
        font-size: 12px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        margin: 12px 0 0;
        line-height: 1.55;
        max-width: 36rem;
      }
      .settings-profile-hero__avatar-fallback {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        border: 2px solid color-mix(in srgb, var(--clr-border, #e2e8f0) 90%, var(--clr-primary, #1b3a30) 10%);
        background: var(--clr-surface-muted, #f1f5f9);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 36px;
        color: var(--clr-text-secondary, #475569);
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      }
      .settings-profile-hero__avatar-img {
        width: 128px;
        height: 128px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid color-mix(in srgb, var(--clr-border, #e2e8f0) 85%, var(--clr-primary, #1b3a30) 15%);
        display: block;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      }
      .settings-profile-follow {
        margin-top: 1.1rem;
      }
      .settings-profile-child-section {
        margin-top: 1.25rem;
      }
      .settings-child-school-card {
        border: 1px solid var(--clr-border-light, #e8eef0);
        border-radius: var(--radius-md, 10px);
        padding: 14px 16px;
        background: var(--clr-surface-alt, #f8fafc);
      }
      .settings-child-school-card__title {
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--clr-text-muted, #64748b);
        margin-bottom: 12px;
      }
      .settings-child-school-card__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px 20px;
        margin: 0;
      }
      .settings-child-school-card__grid dt {
        font-size: 11px;
        font-weight: 700;
        color: var(--clr-text-muted, #64748b);
        margin: 0 0 2px;
      }
      .settings-child-school-card__grid dd {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--clr-text, #0f172a);
      }
      .settings-child-photo-block {
        padding-top: 8px;
        border-top: 1px dashed var(--clr-border-light, #e8eef0);
      }
      .settings-profile-panel {
        border: 1px solid var(--clr-border, #e2e8f0);
        border-radius: var(--radius-lg, 12px);
        background: var(--clr-surface, #fff);
        overflow: hidden;
      }
      .settings-profile-panel--emphasis {
        border-color: color-mix(in srgb, var(--clr-primary, #1b3a30) 22%, var(--clr-border, #e2e8f0));
        box-shadow: 0 1px 0 color-mix(in srgb, var(--clr-primary, #1b3a30) 8%, transparent);
      }
      .settings-profile-panel--note {
        background: var(--clr-surface-muted, #f8fafc);
        border-style: dashed;
      }
      .settings-profile-panel__head {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: var(--clr-surface-muted, #f8fafc);
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
        font-size: 13px;
        font-weight: 700;
        color: var(--clr-text-secondary, #475569);
      }
      .settings-profile-panel__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--clr-primary, #1b3a30) 10%, transparent);
        color: var(--clr-primary, #1b3a30);
        font-size: 16px;
      }
      .settings-profile-panel--note .settings-profile-panel__icon {
        background: color-mix(in srgb, var(--clr-accent, #c05c3d) 12%, transparent);
        color: var(--clr-accent, #c05c3d);
      }
      .settings-profile-panel__body {
        padding: 16px;
      }
      .settings-profile-role {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        background: color-mix(in srgb, var(--clr-primary, #1b3a30) 12%, transparent);
        color: var(--clr-primary, #1b3a30);
      }
      .settings-profile-code {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--clr-surface-muted, #f1f5f9);
        color: var(--clr-text-secondary, #475569);
      }
      .settings-profile-hint {
        font-size: 12px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        margin: 0 0 14px;
        line-height: 1.5;
      }
      .settings-profile-placeholder {
        font-size: 13px;
        color: var(--clr-text-secondary, #64748b);
        font-style: italic;
      }
      .settings-profile-footnote {
        font-size: 11px;
        font-weight: 500;
        color: var(--clr-text-secondary, #64748b);
        margin: 12px 0 0;
        line-height: 1.45;
      }
      .settings-profile-footnote--below {
        margin-top: 1rem;
        margin-bottom: 0;
      }
      .settings-profile-bullets {
        margin: 0;
        padding-left: 1.15rem;
        font-size: 12px;
        color: var(--clr-text-secondary, #475569);
        line-height: 1.55;
      }
      .settings-profile-bullets li + li {
        margin-top: 0.35rem;
      }
      .settings-readonly-grid dt {
        margin-bottom: 4px;
      }
      .settings-readonly-grid dd {
        margin: 0 0 12px;
      }
      .settings-ro-value {
        font-size: 14px;
        color: var(--clr-text-primary, #0f172a);
        font-weight: 500;
        line-height: 1.45;
      }
      .settings-prefs-card__header {
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--clr-border-light, #e8eef0);
      }
      .settings-prefs-card__title {
        font-size: 1.125rem;
        font-weight: 800;
        margin: 0 0 0.4rem;
        color: var(--clr-text-primary, #0f172a);
        letter-spacing: -0.02em;
      }
      .settings-prefs-card__lead {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary, #475569);
        line-height: 1.55;
      }
      .settings-prefs-card__body {
        max-width: 28rem;
      }
      .settings-prefs-card__select {
        max-width: 16rem;
        font-weight: 600;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly profilePerfDebugEnabled = this.isProfilePerfDebugEnabled();

  tab = 'general';
  schoolName = 'SchoolVault Academy';
  schoolCode = 'SCH001';
  schoolEmail = 'info@schoolvault.edu';
  schoolPhone = '+1-555-0100';
  schoolAddress = '123 Education Lane, Knowledge City, KS 12345';
  primaryColor = '#1B3A30';
  accentColor = '#C05C3D';
  saving = false;
  generalSaveMsg = '';
  generalSaveError = '';
  tenantId = '';
  branches: SchoolBranch[] = [];
  branchesLoading = false;
  branchesError = '';
  branchesFetched = false;
  profilePreviewUrl: string | null = null;
  profileInitials = '';
  myChildren: Student[] = [];
  childPhotoTargetId: number | null = null;
  childPhotoPreview: string | null = null;
  childPhotoInitials = '';
  selectedChildForProfile: Student | null = null;
  settingsRefreshing = false;

  featureFlagsSaving = false;
  featureFlagsMsg = '';
  featureFlagsErr = '';

  prefsLang: UiLanguage = 'en';
  prefsSaving = false;
  prefsSaved = false;
  prefsErr = '';

  profileDraftName = '';
  profileDraftPhone = '';
  profileDraftQualification = '';
  profileDraftSpecialization = '';
  profileDraftBankAccountHolder = '';
  profileDraftBankName = '';
  profileDraftBankAccountNumber = '';
  profileDraftBankIfsc = '';
  profileDetails: PersonalProfileDetails | null = null;
  profileAccountSaving = false;
  profileAccountMsg = '';
  profileAccountErr = '';
  /** View vs edit for account fields — reduces confusion with read-only profile hero above. */
  accountDetailsEditing = false;

  /** Role/profile values are cached for template performance (avoid getters in hot render paths). */
  isTenantAdmin = false;
  profileVisualRole = 'other';
  canEditOwnPhoto = false;
  isParentOnlyChildren = false;
  profileUser: ReturnType<AuthService['getCurrentUser']> = null;
  roleDisplayLabel = '';
  photoHintLine = '';

  /** Feature toggles: labels come from `settings.features.<persistKey>.{name,description}` for i18n. */
  features: SettingsFeatureToggleView[] = [
    { enabled: true, persistKey: 'chat', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'transport', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'library', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'hostel', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'audit', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'operationsHub', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'importExport', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'directory', platformOnly: true, nameLabel: '', descriptionLabel: '' },
    { enabled: false, persistKey: 'feeReminderAutomation', nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'payroll', nameLabel: '', descriptionLabel: '' },
    { enabled: true, persistKey: 'documents', nameLabel: '', descriptionLabel: '' },
    { enabled: false, persistKey: 'smsNotifications', nameLabel: '', descriptionLabel: '' },
    { enabled: false, persistKey: 'onlinePayments', nameLabel: '', descriptionLabel: '' },
  ];

  platformManagedFeatures: SettingsFeatureToggleView[] = [];
  tenantAdminFeatures: SettingsFeatureToggleView[] = [];

  constructor(
    private settingsService: SettingsService,
    private themeService: ThemeService,
    private auth: AuthService,
    private parentService: ParentService,
    private parentSelection: ParentSelectionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    readonly userLocale: UserLocaleService,
    private translate: TranslateService,
    private tenantModuleGate: TenantModuleGateService,
    private confirmDialog: ConfirmDialogService
  ) {}

  private resolveRoleDisplayLabel(roleRaw: string): string {
    const r = roleRaw.toLowerCase();
    const key =
      r === 'super_admin'
        ? 'header.role.superAdmin'
        : r === 'library_staff'
          ? 'header.role.libraryStaff'
          : r === 'admin'
            ? 'header.role.admin'
            : r === 'teacher'
              ? 'header.role.teacher'
              : r === 'parent'
                ? 'header.role.parent'
                : r === 'student'
                  ? 'header.role.student'
                  : '';
    if (key) {
      const t = this.translate.instant(key);
      if (t !== key) return t;
    }
    return r ? r.replace(/_/g, ' ') : this.translate.instant('header.role.user');
  }

  ngOnInit(): void {
    this.refreshProfileContext();
    this.hydrateFeatureToggleLabels();
    this.recomputeFeatureBuckets();
    this.applySettingsTabFromQuery(this.route.snapshot.queryParamMap);
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(q => {
      this.applySettingsTabFromQuery(q);
      this.cdr.markForCheck();
    });
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshProfileContext();
      this.hydrateFeatureToggleLabels();
      this.cdr.markForCheck();
    });
    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshProfileContext();
      this.cdr.markForCheck();
    });
    this.prefsLang = this.userLocale.readStored();
    const u = this.profileUser;
    if (u?.interfaceLocale === 'hi' || u?.interfaceLocale === 'en') {
      this.prefsLang = u.interfaceLocale === 'hi' ? 'hi' : 'en';
    }
    this.syncAccountDrafts();
    this.refreshProfilePreview();
    this.loadPersonalProfileDetails();
    this.reloadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Syncs visible tab with {@code ?settingsTab=school|preferences|profile} for deep links from the header. */
  selectSettingsTab(next: 'general' | 'preferences' | 'profile'): void {
    const startedAt = this.profilePerfDebugEnabled && next === 'profile' ? performance.now() : 0;
    this.tab = next;
    this.profileAccountMsg = '';
    this.profileAccountErr = '';
    if (next === 'profile') {
      this.syncAccountDrafts();
    }
    const settingsTab = next === 'general' ? 'school' : next === 'preferences' ? 'preferences' : 'profile';
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { settingsTab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.profilePerfTrace('profile-tab-selected', startedAt, { role: this.profileVisualRole });
  }

  private applySettingsTabFromQuery(q: ParamMap): void {
    const raw = (q.get('settingsTab') || '').toLowerCase();
    if (raw === 'preferences') {
      this.tab = 'preferences';
      return;
    }
    if (raw === 'profile') {
      this.tab = 'profile';
      this.syncAccountDrafts();
      return;
    }
    if (raw === 'school') {
      this.tab = 'general';
      return;
    }
    if (!this.isTenantAdmin && !raw) {
      this.tab = 'preferences';
    }
  }

  beginAccountDetailsEdit(): void {
    this.syncAccountDrafts();
    this.accountDetailsEditing = true;
    this.profileAccountMsg = '';
    this.profileAccountErr = '';
  }

  cancelAccountDetailsEdit(): void {
    this.syncAccountDrafts();
    this.accountDetailsEditing = false;
    this.profileAccountMsg = '';
    this.profileAccountErr = '';
  }

  private syncAccountDrafts(): void {
    const u = this.profileUser ?? this.auth.getCurrentUser();
    this.profileDraftName = u?.name ?? '';
    this.profileDraftPhone = u?.phone ?? '';
    this.profileDraftQualification = this.profileDetails?.qualification ?? '';
    this.profileDraftSpecialization = this.profileDetails?.specialization ?? '';
    this.profileDraftBankAccountHolder = this.profileDetails?.bankAccountHolder ?? '';
    this.profileDraftBankName = this.profileDetails?.bankName ?? '';
    this.profileDraftBankAccountNumber = this.profileDetails?.bankAccountNumber ?? '';
    this.profileDraftBankIfsc = this.profileDetails?.bankIfsc ?? '';
  }

  get isTeacherProfileEditable(): boolean {
    return this.profileVisualRole === 'teacher';
  }

  private loadPersonalProfileDetails(): void {
    this.auth.fetchMyProfileDetails().subscribe({
      next: details => {
        this.profileDetails = details;
        this.syncAccountDrafts();
        this.cdr.markForCheck();
      },
      error: () => {
        this.profileDetails = null;
      },
    });
  }

  saveProfileAccount(): void {
    const name = (this.profileDraftName ?? '').trim();
    if (!name) {
      this.profileAccountErr = this.translate.instant('settings.profileNameRequired');
      this.profileAccountMsg = '';
      return;
    }
    this.profileAccountMsg = '';
    this.profileAccountErr = '';
    const updatePayload = {
      name,
      phone: this.profileDraftPhone ?? '',
      qualification: this.isTeacherProfileEditable ? (this.profileDraftQualification || '').trim() : undefined,
      specialization: this.isTeacherProfileEditable ? (this.profileDraftSpecialization || '').trim() : undefined,
      bankAccountHolder: this.isTeacherProfileEditable ? (this.profileDraftBankAccountHolder || '').trim() : undefined,
      bankName: this.isTeacherProfileEditable ? (this.profileDraftBankName || '').trim() : undefined,
      bankAccountNumber: this.isTeacherProfileEditable ? (this.profileDraftBankAccountNumber || '').trim() : undefined,
      bankIfsc: this.isTeacherProfileEditable ? (this.profileDraftBankIfsc || '').trim().toUpperCase() : undefined,
    };
    const criticalChangeDetails = this.buildCriticalProfileChangeDetails(updatePayload);
    if (criticalChangeDetails.length) {
      this.confirmDialog
        .confirm({
          title: this.translate.instant('settings.profileConfirmTitle'),
          message: this.translate.instant('settings.profileConfirmBody'),
          details: criticalChangeDetails,
          variant: 'warning',
          confirmLabel: this.translate.instant('settings.profileConfirmProceed'),
          cancelLabel: this.translate.instant('settings.profileConfirmCancel'),
        })
        .subscribe(confirmed => {
          if (!confirmed) {
            this.syncAccountDrafts();
            this.accountDetailsEditing = false;
            this.cdr.markForCheck();
            return;
          }
          this.persistProfileAccountUpdate(updatePayload);
        });
      return;
    }
    this.persistProfileAccountUpdate(updatePayload);
  }

  private buildCriticalProfileChangeDetails(updatePayload: {
    name: string;
    phone: string;
    qualification?: string;
    specialization?: string;
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  }): string[] {
    const previous = this.profileDetails;
    const roleSensitiveFields: Array<{ label: string; before: string; after: string }> = [
      {
        label: this.translate.instant('settings.profileFullNameLabel'),
        before: (this.profileUser?.name ?? '').trim(),
        after: updatePayload.name.trim(),
      },
      {
        label: this.translate.instant('settings.profileContactPhoneLabel'),
        before: (this.profileUser?.phone ?? '').trim(),
        after: (updatePayload.phone ?? '').trim(),
      },
    ];
    if (this.isTeacherProfileEditable) {
      roleSensitiveFields.push(
        {
          label: this.translate.instant('settings.teacherQualificationLabel'),
          before: (previous?.qualification ?? '').trim(),
          after: (updatePayload.qualification ?? '').trim(),
        },
        {
          label: this.translate.instant('settings.teacherSpecializationLabel'),
          before: (previous?.specialization ?? '').trim(),
          after: (updatePayload.specialization ?? '').trim(),
        },
        {
          label: this.translate.instant('settings.bankAccountHolderLabel'),
          before: (previous?.bankAccountHolder ?? '').trim(),
          after: (updatePayload.bankAccountHolder ?? '').trim(),
        },
        {
          label: this.translate.instant('settings.bankNameLabel'),
          before: (previous?.bankName ?? '').trim(),
          after: (updatePayload.bankName ?? '').trim(),
        },
        {
          label: this.translate.instant('settings.bankAccountNumberLabel'),
          before: this.maskSensitiveAccountNumber(previous?.bankAccountNumber ?? ''),
          after: this.maskSensitiveAccountNumber(updatePayload.bankAccountNumber ?? ''),
        },
        {
          label: this.translate.instant('settings.bankIfscLabel'),
          before: (previous?.bankIfsc ?? '').trim().toUpperCase(),
          after: (updatePayload.bankIfsc ?? '').trim().toUpperCase(),
        }
      );
    }
    const emptyText = this.translate.instant('settings.profileConfirmNoValue');
    return roleSensitiveFields
      .filter(change => change.before !== change.after)
      .map(change =>
        this.translate.instant('settings.profileConfirmChangeLine', {
          field: change.label,
          before: change.before || emptyText,
          after: change.after || emptyText,
        })
      );
  }

  private maskSensitiveAccountNumber(raw: string): string {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) {
      return '';
    }
    const visibleTail = trimmed.slice(-4);
    return `****${visibleTail}`;
  }

  private persistProfileAccountUpdate(updatePayload: {
    name: string;
    phone: string;
    qualification?: string;
    specialization?: string;
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  }): void {
    this.profileAccountSaving = true;
    this.profileAccountMsg = '';
    this.profileAccountErr = '';
    this.auth.updateMyProfileDetails(updatePayload).subscribe({
      next: () => {
        this.profileAccountSaving = false;
        this.accountDetailsEditing = false;
        this.profileAccountMsg = this.translate.instant(
          runtimeConfig.useMocks ? 'settings.profileSavedMock' : 'settings.profileSaved'
        );
        this.syncAccountDrafts();
        this.refreshProfilePreview();
        this.loadPersonalProfileDetails();
        this.auth.fetchProfileSummary().subscribe({ error: () => void 0 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.profileAccountSaving = false;
        this.profileAccountErr = this.translate.instant('settings.profileSaveErr');
        this.cdr.markForCheck();
      },
    });
  }

  onPrefsLangDraftChange(): void {
    this.prefsSaved = false;
    this.prefsErr = '';
  }

  savePreferences(): void {
    this.prefsSaving = true;
    this.prefsSaved = false;
    this.prefsErr = '';
    this.auth.updateInterfacePreferences(this.prefsLang).subscribe({
      next: () => {
        this.prefsSaving = false;
        this.prefsSaved = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.prefsSaving = false;
        this.prefsErr = this.translate.instant('prefs.saveFailed');
        this.cdr.markForCheck();
      },
    });
  }

  private applyFeatureFlagsFromServer(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.settingsService.getFeatures().subscribe({
      next: flags => {
        for (const f of this.features) {
          if (f.persistKey != null && flags[f.persistKey] !== undefined) {
            f.enabled = !!flags[f.persistKey];
          }
        }
        this.recomputeFeatureBuckets();
        this.cdr.markForCheck();
      },
      error: () => {
        /* non-fatal */
      },
    });
  }

  saveFeatureFlags(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.featureFlagsSaving = true;
    this.featureFlagsMsg = '';
    this.featureFlagsErr = '';
    this.settingsService.getFeatures().subscribe({
      next: flags => {
        const merged = { ...flags };
        for (const f of this.tenantAdminFeatures) {
          if (f.persistKey) {
            merged[f.persistKey] = f.enabled;
          }
        }
        this.settingsService.updateFeatures(merged).subscribe({
          next: () => {
            this.featureFlagsSaving = false;
            this.featureFlagsMsg = this.translate.instant(
              runtimeConfig.useMocks ? 'settings.featureFlagsSavedMock' : 'settings.featureFlagsSaved'
            );
            this.tenantModuleGate.refresh().subscribe({ error: () => void 0 });
            this.cdr.markForCheck();
          },
          error: () => {
            this.featureFlagsSaving = false;
            this.featureFlagsErr = this.translate.instant('settings.featureFlagsSaveErr');
            this.cdr.markForCheck();
          },
        });
      },
      error: () => {
        this.featureFlagsSaving = false;
        this.featureFlagsErr = this.translate.instant('settings.featureFlagsLoadErr');
        this.cdr.markForCheck();
      },
    });
  }

  reloadSettings(): void {
    const startedAt = this.profilePerfDebugEnabled ? performance.now() : 0;
    this.settingsRefreshing = true;
    if (this.isParentOnlyChildren) {
      this.parentService.getChildren().subscribe(list => {
        this.myChildren = list ?? [];
        const pref = this.parentSelection.readPreferredChildId();
        if (pref != null && this.myChildren.some(s => s.id === pref)) {
          this.childPhotoTargetId = pref;
        }
        this.syncChildPhotoPreview();
        this.profilePerfTrace('children-loaded', startedAt, { count: this.myChildren.length });
        this.cdr.markForCheck();
      });
    }
    this.settingsService.get().subscribe({
      next: cfg => {
        this.schoolName = cfg.schoolName ?? this.schoolName;
        this.schoolCode = cfg.schoolCode ?? this.schoolCode;
        this.schoolEmail = cfg.email ?? this.schoolEmail;
        this.schoolPhone = cfg.phone ?? this.schoolPhone;
        this.schoolAddress = cfg.address ?? this.schoolAddress;
        this.primaryColor = cfg.primaryColor || this.primaryColor;
        this.accentColor = cfg.secondaryColor || this.accentColor;
        this.tenantId = cfg.tenantId ?? '';
        const td = this.auth.readTenantDisplayOverrides();
        if (td.schoolName) this.schoolName = td.schoolName;
        if (td.schoolEmail) this.schoolEmail = td.schoolEmail;
        if (td.schoolPhone) this.schoolPhone = td.schoolPhone;
        if (td.schoolAddress) this.schoolAddress = td.schoolAddress;
        this.settingsRefreshing = false;
        this.applyFeatureFlagsFromServer();
        const afterHydrate = () => {
          this.refreshProfileContext();
          this.syncAccountDrafts();
          this.profilePerfTrace('settings-loaded', startedAt, { role: this.profileVisualRole });
          this.cdr.markForCheck();
        };
        if (!runtimeConfig.useMocks) {
          this.auth.syncProfileFromServer().subscribe({
            next: () => afterHydrate(),
            error: () => afterHydrate(),
          });
        } else {
          afterHydrate();
        }
      },
      error: () => {
        this.settingsRefreshing = false;
        this.profilePerfTrace('settings-load-failed', startedAt);
      }
    });
    this.refreshProfilePreview();
  }

  private refreshProfilePreview(): void {
    const url = this.auth.getStoredAvatarDataUrl();
    this.profilePreviewUrl = url;
    this.profileInitials = this.auth.getUserInitials();
  }

  onOwnPhotoPicked(ev: ProfilePhotoPickEvent): void {
    this.auth.setMyProfileAvatarDataUrl(ev.dataUrl);
    this.refreshProfilePreview();
    this.cdr.markForCheck();
  }

  onOwnPhotoRemoved(): void {
    this.auth.clearMyProfileAvatarDataUrl();
    this.refreshProfilePreview();
    this.cdr.markForCheck();
  }

  syncChildPhotoPreview(): void {
    if (this.childPhotoTargetId == null) {
      this.childPhotoPreview = null;
      this.childPhotoInitials = '';
      this.selectedChildForProfile = null;
      return;
    }
    const s = this.myChildren.find(x => x.id === this.childPhotoTargetId);
    this.selectedChildForProfile = s ?? null;
    this.childPhotoInitials = s ? (s.firstName[0] + s.lastName[0]).toUpperCase() : '';
    this.childPhotoPreview = this.auth.getChildAvatarDataUrl(this.childPhotoTargetId);
  }

  private refreshProfileContext(): void {
    this.profileUser = this.auth.getCurrentUser();
    const roleRaw = (this.auth.getRole() || '').toLowerCase().trim();
    const normalizedRole = roleRaw.startsWith('role_') ? roleRaw.slice(5) : roleRaw;
    this.isTenantAdmin = normalizedRole === 'admin';
    this.isParentOnlyChildren = normalizedRole === 'parent';
    this.canEditOwnPhoto = ['admin', 'teacher', 'super_admin', 'student', 'parent'].includes(normalizedRole);
    this.profileVisualRole = ['admin', 'teacher', 'parent', 'super_admin', 'student'].includes(normalizedRole) ? normalizedRole : 'other';
    this.roleDisplayLabel = this.resolveRoleDisplayLabel(normalizedRole);
    this.photoHintLine = this.translate.instant(runtimeConfig.useMocks ? 'settings.photoHintMock' : 'settings.photoHintLive');
  }

  private recomputeFeatureBuckets(): void {
    this.platformManagedFeatures = this.features.filter(f => !!f.platformOnly);
    this.tenantAdminFeatures = this.features.filter(f => !f.platformOnly);
  }

  private hydrateFeatureToggleLabels(): void {
    for (const f of this.features) {
      f.nameLabel = this.translate.instant(`settings.features.${f.persistKey}.name`);
      f.descriptionLabel = this.translate.instant(`settings.features.${f.persistKey}.description`);
    }
  }

  private isProfilePerfDebugEnabled(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return window.localStorage.getItem('sv.profilePerfDebug') === '1';
  }

  private profilePerfTrace(label: string, startedAt: number, context?: Record<string, unknown>): void {
    if (!this.profilePerfDebugEnabled || !startedAt) {
      return;
    }
    const elapsedMs = Math.round(performance.now() - startedAt);
    const payload = context ? { elapsedMs, ...context } : { elapsedMs };
    // Opt-in profiling: enable with localStorage `sv.profilePerfDebug=1`.
    console.debug(`[profile-perf] ${label}`, payload);
  }

  onChildPhotoPicked(ev: ProfilePhotoPickEvent): void {
    if (this.childPhotoTargetId == null) return;
    this.auth.setChildAvatarDataUrl(this.childPhotoTargetId, ev.dataUrl);
    this.syncChildPhotoPreview();
    this.cdr.markForCheck();
  }

  onChildPhotoRemoved(): void {
    if (this.childPhotoTargetId == null) return;
    this.auth.clearChildAvatarDataUrl(this.childPhotoTargetId);
    this.syncChildPhotoPreview();
    this.cdr.markForCheck();
  }

  loadBranches(): void {
    this.branchesError = '';
    this.branchesLoading = true;
    this.branchesFetched = true;
    this.settingsService.listBranches(this.schoolCode).subscribe({
      next: list => {
        this.branches = list ?? [];
        this.branchesLoading = false;
      },
      error: () => {
        this.branchesLoading = false;
        this.branchesError = this.translate.instant('settings.branchesLoadErr');
      }
    });
  }

  saveGeneral(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.generalSaveMsg = '';
    this.generalSaveError = '';
    this.auth.saveTenantDisplay({
      schoolName: this.schoolName,
      schoolEmail: this.schoolEmail,
      schoolPhone: this.schoolPhone,
      schoolAddress: this.schoolAddress
    });
    const payload = {
      schoolName: this.schoolName,
      email: this.schoolEmail,
      phone: this.schoolPhone,
      address: this.schoolAddress,
      primaryColor: this.primaryColor,
      secondaryColor: this.accentColor,
      tenantId: this.tenantId,
      schoolCode: this.schoolCode
    };
    this.saving = true;
    this.settingsService.update(payload).subscribe({
      next: () => {
        this.saving = false;
        this.generalSaveMsg = this.translate.instant(
          runtimeConfig.useMocks ? 'settings.generalSavedMock' : 'settings.generalSaved'
        );
        this.auth.fetchProfileSummary().subscribe();
      },
      error: () => {
        this.saving = false;
        this.generalSaveError = this.translate.instant('settings.generalSaveErr');
      }
    });
    this.themeService.applySchoolBranding(this.primaryColor, this.accentColor);
  }

  applyBranding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.themeService.applySchoolBranding(this.primaryColor, this.accentColor);
    if (!runtimeConfig.useMocks) {
      this.settingsService.update({
        primaryColor: this.primaryColor,
        secondaryColor: this.accentColor,
        tenantId: this.tenantId
      }).subscribe();
    }
  }

  resetBranding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.primaryColor = ThemeService.DEFAULT_PRIMARY;
    this.accentColor = ThemeService.DEFAULT_ACCENT;
    this.themeService.resetBrandingToDefault();
    if (!runtimeConfig.useMocks && this.tenantId) {
      this.settingsService
        .update({
          primaryColor: this.primaryColor,
          secondaryColor: this.accentColor,
          tenantId: this.tenantId
        })
        .subscribe();
    }
  }
}
