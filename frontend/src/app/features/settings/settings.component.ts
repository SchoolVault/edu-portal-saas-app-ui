import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TenantModuleGateService } from '../../core/services/tenant-module-gate.service';
import { LibraryBorrowerPolicy, LibraryBorrowerType, SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { UiAccessService } from '../../core/services/ui-access.service';
import { ParentService } from '../../core/services/parent.service';
import { PersonalProfileDetails, SchoolBranch, Student } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { ProfilePhotoPickerComponent, ProfilePhotoPickEvent } from '../../shared/profile-photo-picker/profile-photo-picker.component';
import { UserLocaleService, type UiLanguage } from '../../core/i18n/user-locale.service';
import { ParentSelectionService } from '../../core/services/parent-selection.service';
import { SchoolClassNamePipe } from '../../core/i18n/school-class-name.pipe';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { SettingsRbacPanelComponent } from './settings-rbac-panel.component';

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
  imports: [CommonModule, FormsModule, TranslateModule, ProfilePhotoPickerComponent, SchoolClassNamePipe, SettingsRbacPanelComponent],
  template: `
    <div class="settings-page" data-testid="settings-page">
      <div class="settings-page__hero mb-4 animate-in d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h1 class="settings-page__h1">{{ (isTenantAdmin ? 'settings.pageTitle' : 'settings.pageTitleUserShell') | translate }}</h1>
          <p class="settings-page__intro">
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
        <button type="button" *ngIf="isTenantAdmin" class="erp-tab" [class.active]="tab === 'finance'" (click)="selectFinanceTab()">{{ 'settings.tabFinance' | translate }}</button>
        <button type="button" *ngIf="canManageStaffRbacAccess" class="erp-tab" [class.active]="tab === 'roles'" (click)="tab = 'roles'">{{ 'settings.tabRoles' | translate }}</button>
        <button type="button" class="erp-tab" [class.active]="tab === 'profile'" (click)="selectSettingsTab('profile')">{{ 'settings.tabProfile' | translate }}</button>
      </div>

      <div *ngIf="tab === 'preferences'" class="erp-card animate-in settings-prefs-card">
        <header class="settings-prefs-card__header settings-page__section-head">
          <h2 class="settings-page__section-title settings-page__section-title--flush">{{ 'prefs.heading' | translate }}</h2>
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
        <header class="settings-profile-root__header settings-page__section-head">
          <h2 class="settings-page__section-title settings-page__section-title--flush">{{ 'settings.profileTitle' | translate }}</h2>
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
              <div class="settings-account-overview" *ngIf="!accountDetailsEditing">
                <div class="settings-account-overview__grid">
                  <div class="settings-account-overview__item">
                    <span class="settings-account-overview__label">{{ 'settings.profileFullNameLabel' | translate }}</span>
                    <strong class="settings-account-overview__value">{{ account.name }}</strong>
                  </div>
                  <div class="settings-account-overview__item">
                    <span class="settings-account-overview__label">{{ 'settings.profileContactPhoneLabel' | translate }}</span>
                    <div class="d-flex align-items-center flex-wrap gap-2">
                      <strong class="settings-account-overview__value">{{ account.phone || ('exams.dash' | translate) }}</strong>
                      <span class="badge rounded-pill" [class.text-bg-success]="profilePhoneVerified" [class.text-bg-warning]="!profilePhoneVerified">
                        {{ (profilePhoneVerified ? 'settings.phoneVerifiedBadge' : 'settings.phoneUnverifiedBadge') | translate }}
                      </span>
                    </div>
                  </div>
                  <div class="settings-account-overview__item">
                    <span class="settings-account-overview__label">{{ 'settings.labelEmail' | translate }}</span>
                    <div class="d-flex align-items-center flex-wrap gap-2">
                      <strong class="settings-account-overview__value">{{ account.email || ('exams.dash' | translate) }}</strong>
                      <span class="badge rounded-pill" [class.text-bg-success]="profileEmailVerified" [class.text-bg-warning]="!profileEmailVerified">
                        {{ (profileEmailVerified ? 'settings.emailVerifiedBadge' : 'settings.emailUnverifiedBadge') | translate }}
                      </span>
                    </div>
                  </div>
                </div>
                <p class="text-muted small mb-0">{{ 'settings.profileIdentityFlowHint' | translate }}</p>
                <div class="settings-account-overview__status">
                  <div
                    *ngIf="account.email && !profileEmailVerified"
                    class="mt-2 p-3 rounded border settings-page__subpanel"
                  >
                    <div class="fw-semibold small mb-2">{{ 'settings.emailVerifyTitle' | translate }}</div>
                    <p class="small text-muted mb-2">{{ 'settings.emailVerifyLead' | translate }}</p>
                    <div class="d-flex flex-wrap gap-2 align-items-center">
                      <button
                        type="button"
                        class="btn-outline-erp btn-sm"
                        (click)="requestEmailVerificationClick()"
                        [disabled]="emailVerifyBusy"
                      >
                        {{ emailVerifyBusy ? ('settings.emailVerifyRequesting' | translate) : ('settings.emailVerifyRequest' | translate) }}
                      </button>
                      <span *ngIf="emailVerifyMessage" class="small text-body">{{ emailVerifyMessage }}</span>
                    </div>
                    <div class="mt-2" *ngIf="emailVerifyDevTokenHint">
                      <label class="erp-label small mb-1">{{ 'settings.emailVerifyTokenLabel' | translate }}</label>
                      <div class="d-flex flex-wrap gap-2">
                        <input
                          type="text"
                          class="erp-input settings-page__input-verify"
                          [(ngModel)]="emailVerifyTokenDraft"
                          [placeholder]="'settings.emailVerifyTokenPh' | translate"
                          name="emailVerifyTokenDraft"
                        />
                        <button type="button" class="btn-primary-erp btn-sm" (click)="confirmEmailVerificationClick()" [disabled]="emailVerifyBusy">
                          {{ 'settings.emailVerifyConfirm' | translate }}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p *ngIf="account.phone && !profilePhoneVerified" class="text-warning small mb-0 mt-2">
                    <i class="bi bi-phone me-1" aria-hidden="true"></i>{{ 'settings.phoneVerifyViaOtpHint' | translate }}
                  </p>
                </div>
                <ng-container *ngIf="isTeacherProfileEditable">
                  <div class="settings-account-overview__grid settings-account-overview__grid--teacher mt-3">
                    <div class="settings-account-overview__item">
                      <span class="settings-account-overview__label">{{ 'settings.teacherQualificationLabel' | translate }}</span>
                      <strong class="settings-account-overview__value">{{ profileDetails?.qualification || ('exams.dash' | translate) }}</strong>
                    </div>
                    <div class="settings-account-overview__item">
                      <span class="settings-account-overview__label">{{ 'settings.teacherSpecializationLabel' | translate }}</span>
                      <strong class="settings-account-overview__value">{{ profileDetails?.specialization || ('exams.dash' | translate) }}</strong>
                    </div>
                    <div class="settings-account-overview__item">
                      <span class="settings-account-overview__label">{{ 'settings.bankAccountHolderLabel' | translate }}</span>
                      <strong class="settings-account-overview__value">{{ profileDetails?.bankAccountHolder || ('exams.dash' | translate) }}</strong>
                    </div>
                    <div class="settings-account-overview__item">
                      <span class="settings-account-overview__label">{{ 'settings.bankNameLabel' | translate }}</span>
                      <strong class="settings-account-overview__value">{{ profileDetails?.bankName || ('exams.dash' | translate) }}</strong>
                    </div>
                    <div class="settings-account-overview__item">
                      <span class="settings-account-overview__label">{{ 'settings.bankAccountNumberLabel' | translate }}</span>
                      <strong class="settings-account-overview__value">{{ profileDetails?.bankAccountNumber || ('exams.dash' | translate) }}</strong>
                    </div>
                    <div class="settings-account-overview__item">
                      <span class="settings-account-overview__label">{{ 'settings.bankIfscLabel' | translate }}</span>
                      <strong class="settings-account-overview__value">{{ profileDetails?.bankIfsc || ('exams.dash' | translate) }}</strong>
                    </div>
                  </div>
                </ng-container>
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
                <div class="col-md-6">
                  <div class="erp-form-group">
                    <label class="erp-label" for="settings-acct-email-edit">{{ 'settings.labelEmail' | translate }}</label>
                    <input
                      id="settings-acct-email-edit"
                      type="email"
                      class="erp-input"
                      name="profileDraftEmail"
                      [(ngModel)]="profileDraftEmail"
                      autocomplete="email"
                    />
                    <p class="text-muted small mb-0 mt-1">{{ 'settings.profileEditableEmailHint' | translate }}</p>
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
              <div class="mt-3 p-3 rounded border settings-page__subpanel">
                <div class="fw-semibold small mb-2">{{ 'settings.securityActionsTitle' | translate }}</div>
                <p class="small text-muted mb-3">{{ 'settings.securityActionsLead' | translate }}</p>
                <div class="row g-2">
                  <div class="col-md-5">
                    <div class="settings-password-reveal">
                      <input
                        id="settings-security-new-password"
                        [type]="showSetPasswordNew ? 'text' : 'password'"
                        class="erp-input settings-password-reveal__input"
                        [(ngModel)]="profileDraftNewPassword"
                        [placeholder]="'settings.setPasswordPh' | translate"
                        autocomplete="new-password"
                      />
                      <button
                        type="button"
                        class="btn-outline-erp btn-sm settings-password-reveal__toggle"
                        (click)="showSetPasswordNew = !showSetPasswordNew"
                        [attr.aria-pressed]="showSetPasswordNew"
                        [attr.aria-label]="
                          (showSetPasswordNew ? 'settings.setPasswordHideNew' : 'settings.setPasswordShowNew') | translate
                        "
                      >
                        <i class="bi" [ngClass]="showSetPasswordNew ? 'bi-eye-slash' : 'bi-eye'" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-5">
                    <div class="settings-password-reveal">
                      <input
                        id="settings-security-confirm-password"
                        [type]="showSetPasswordConfirm ? 'text' : 'password'"
                        class="erp-input settings-password-reveal__input"
                        [(ngModel)]="profileDraftConfirmPassword"
                        [placeholder]="'settings.setPasswordConfirmPh' | translate"
                        autocomplete="new-password"
                      />
                      <button
                        type="button"
                        class="btn-outline-erp btn-sm settings-password-reveal__toggle"
                        (click)="showSetPasswordConfirm = !showSetPasswordConfirm"
                        [attr.aria-pressed]="showSetPasswordConfirm"
                        [attr.aria-label]="
                          (showSetPasswordConfirm ? 'settings.setPasswordHideConfirm' : 'settings.setPasswordShowConfirm')
                            | translate
                        "
                      >
                        <i
                          class="bi"
                          [ngClass]="showSetPasswordConfirm ? 'bi-eye-slash' : 'bi-eye'"
                          aria-hidden="true"
                        ></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-md-2 d-grid">
                    <button type="button" class="btn-primary-erp btn-sm" (click)="setPasswordAfterVerificationClick()" [disabled]="identityActionBusy">
                      {{ identityActionBusy ? ('settings.profileSaving' | translate) : ('settings.setPasswordAction' | translate) }}
                    </button>
                  </div>
                </div>
                <p *ngIf="identityActionMsg" class="text-success small mt-2 mb-0">{{ identityActionMsg }}</p>
                <p *ngIf="identityActionErr" class="text-danger small mt-2 mb-0">{{ identityActionErr }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div *ngIf="tab === 'general'" class="erp-card animate-in">
        <h2 class="settings-page__section-title">{{ 'settings.schoolInfoTitle' | translate }}</h2>
        <ng-container *ngIf="isTenantAdmin">
          <div class="row g-3">
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelSchoolName' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolName" data-testid="school-name-input"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelSchoolCode' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolCode" disabled [title]="'settings.schoolCodeTitle' | translate"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelEmail' | translate }}</label><input type="email" class="erp-input" [(ngModel)]="schoolEmail"></div></div>
            <div class="col-md-6"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelPhone' | translate }}</label><input type="text" class="erp-input" [(ngModel)]="schoolPhone"></div></div>
            <div class="col-12"><div class="erp-form-group"><label class="erp-label">{{ 'settings.labelAddress' | translate }}</label><textarea class="erp-input erp-textarea settings-page__textarea-address" [(ngModel)]="schoolAddress"></textarea></div></div>
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
            <div class="col-12"><dt class="erp-label">{{ 'settings.labelAddress' | translate }}</dt><dd class="settings-ro-value settings-page__prewrap">{{ schoolAddress || ('exams.dash' | translate) }}</dd></div>
          </dl>
        </ng-container>

        <div *ngIf="isTenantAdmin" class="mt-4 pt-4 settings-page__split-block">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <h3 class="settings-page__section-title settings-page__section-title--sm settings-page__section-title--flush">{{ 'settings.branchesHeading' | translate }}</h3>
              <p class="text-muted small mb-0">{{ 'settings.branchesLead' | translate }}</p>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadBranches()" [disabled]="branchesLoading">
              {{ branchesLoading ? ('settings.loadingEllipsis' | translate) : ('settings.fetchBranches' | translate) }}
            </button>
          </div>
          <div *ngIf="branchesError" class="alert alert-danger py-2 small">{{ branchesError }}</div>
          <div *ngIf="branches.length" class="row g-3">
            <div class="col-md-6 col-lg-4" *ngFor="let br of branches">
              <div class="p-3 rounded-3 h-100 settings-page__branch-card">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <strong class="settings-page__branch-name">{{ br.schoolName }}</strong>
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
        <h2 class="settings-page__section-title">{{ 'settings.themeBrandingHeading' | translate }}</h2>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">{{ 'settings.labelPrimaryColor' | translate }}</label>
              <div class="d-flex gap-2 align-items-center settings-page__color-row">
                <input type="color" class="settings-page__color-swatch" [(ngModel)]="primaryColor" />
                <input type="text" class="erp-input settings-page__color-hex" [(ngModel)]="primaryColor" />
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="erp-form-group"><label class="erp-label">{{ 'settings.labelAccentColor' | translate }}</label>
              <div class="d-flex gap-2 align-items-center settings-page__color-row">
                <input type="color" class="settings-page__color-swatch" [(ngModel)]="accentColor" />
                <input type="text" class="erp-input settings-page__color-hex" [(ngModel)]="accentColor" />
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

      <div *ngIf="tab === 'finance'" class="animate-in settings-finance-hub">
        <div class="erp-card animate-in settings-finance-card">
          <header class="settings-finance-card__head mb-3">
            <h2 class="settings-page__section-title settings-page__section-title--flush mb-1">{{ 'settings.financeHubTitle' | translate }}</h2>
            <p class="text-muted small mb-0 settings-page__intro--tight">{{ 'settings.financeHubLead' | translate }}</p>
          </header>

          <section class="settings-finance-section" aria-labelledby="fin-section-fees">
            <h3 id="fin-section-fees" class="settings-finance-section__title">{{ 'settings.financeSettlementTitle' | translate }}</h3>
            <p class="text-muted small mb-3">{{ 'settings.financeSettlementLead' | translate }}</p>
          <div class="erp-form-group">
            <label class="erp-label" for="fin-mode">{{ 'settings.financeSettlementModeLabel' | translate }}</label>
            <select id="fin-mode" class="erp-select settings-page__input-wide" [(ngModel)]="financeSettlementMode" name="finMode" [disabled]="financeCoreSettlementLocked">
              <option value="OFFLINE_SCHOOL_COLLECTION">{{ 'settings.financeModeOffline' | translate }}</option>
              <option value="PLATFORM_MERCHANT">{{ 'settings.financeModePlatform' | translate }}</option>
              <option value="ROUTE_LINKED_ACCOUNT">{{ 'settings.financeModeRoute' | translate }}</option>
            </select>
            <p class="text-muted small mb-0 mt-1">{{ 'settings.financeSettlementModeHelp' | translate }}</p>
          </div>
          <div
            *ngIf="financeSettlementMode === 'OFFLINE_SCHOOL_COLLECTION'"
            class="settings-page__callout settings-page__callout--info py-2 small mb-3"
            role="status"
          >
            {{ 'settings.financeModeOfflineExplain' | translate }}
          </div>
          <div
            *ngIf="financeSettlementMode === 'PLATFORM_MERCHANT'"
            class="settings-page__callout settings-page__callout--primary py-2 small mb-3"
            role="status"
          >
            {{ 'settings.financeModePlatformExplain' | translate }}
          </div>
          <div *ngIf="financeSettlementMode === 'ROUTE_LINKED_ACCOUNT' && !financeLoading" class="settings-finance-onb mb-3">
            <p class="small fw-semibold mb-2">{{ 'settings.financeOnbWizardTitle' | translate }}</p>
            <ol class="settings-finance-onb__steps small text-muted mb-3 ps-3">
              <li>{{ 'settings.financeOnbStep1' | translate }}</li>
              <li>{{ 'settings.financeOnbStep2' | translate }}</li>
              <li>{{ 'settings.financeOnbStep3' | translate }}</li>
            </ol>
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span class="text-muted small text-uppercase fw-bold">{{ 'settings.financeOnbStatusLabel' | translate }}</span>
              <span class="badge-erp" [ngClass]="financeOnboardingBadgeClass()">{{ financeOnboardingStatusKey | translate }}</span>
            </div>
            <p *ngIf="financeLinkedDisplayLine" class="small text-muted mb-2 font-monospace">{{ financeLinkedDisplayLine }}</p>
            <p *ngIf="financePaymentRoutingOnboardingStatus === 'SUBMITTED'" class="small text-muted mb-2">{{ 'settings.financeOnbSubmittedLead' | translate }}</p>
            <p *ngIf="financePaymentRoutingOnboardingStatus === 'LIVE'" class="small mb-2 settings-page__status--success">{{ 'settings.financeOnbLiveLead' | translate }}</p>
            <p *ngIf="financePaymentRoutingOnboardingStatus === 'PENDING_CHANGES'" class="small mb-2 settings-page__status--warning">{{ 'settings.financeOnbPendingLead' | translate }}</p>
            <div class="erp-form-group" *ngIf="financeShowDeclarationBlock">
              <label class="erp-label" for="fin-decl">{{ 'settings.financeOnbDeclarationLabel' | translate }}</label>
              <textarea
                id="fin-decl"
                class="erp-input settings-page__input-xwide"
                rows="4"
                [(ngModel)]="financeDeclarationDraft"
                name="finDecl"
                [placeholder]="'settings.financeOnbDeclarationPh' | translate"
              ></textarea>
              <p class="text-muted small mb-0 mt-1">{{ 'settings.financeOnbDeclarationHint' | translate }}</p>
            </div>
            <div class="d-flex flex-wrap gap-2 mb-2" *ngIf="financeSettlementMode === 'ROUTE_LINKED_ACCOUNT'">
              <button
                type="button"
                class="btn-primary-erp btn-sm"
                *ngIf="financeShowDeclarationBlock"
                (click)="submitFinanceOnboarding()"
                [disabled]="financeSubmitting || financeDeclarationDraft.trim().length < 30"
              >
                {{ financeSubmitting ? ('settings.financeOnbSubmitting' | translate) : ('settings.financeOnbSubmit' | translate) }}
              </button>
              <button
                type="button"
                class="btn-outline-erp btn-sm"
                *ngIf="financePaymentRoutingOnboardingStatus === 'SUBMITTED'"
                (click)="withdrawFinanceOnboarding()"
                [disabled]="financeWithdrawing"
              >
                {{ financeWithdrawing ? ('settings.financeOnbWithdrawing' | translate) : ('settings.financeOnbWithdraw' | translate) }}
              </button>
            </div>
          </div>
          <div
            *ngIf="financeLiveRouteReadonlyBanner"
            class="settings-finance-live-banner settings-page__callout settings-page__callout--info py-2 small mb-3"
            role="status"
          >
            <div class="d-flex flex-wrap align-items-start justify-content-between gap-2">
              <div>
                <strong class="d-block mb-1">{{ 'settings.financeLiveLockedTitle' | translate }}</strong>
                <span class="text-muted">{{ 'settings.financeLiveLockedBody' | translate }}</span>
              </div>
              <button type="button" class="btn-outline-erp btn-sm text-nowrap" (click)="unlockFinanceRouteSettlementForEdit()">
                {{ 'settings.financeLiveUnlockButton' | translate }}
              </button>
            </div>
          </div>
          <div
            *ngIf="financeRouteEditUnlocked && financePaymentRoutingOnboardingStatus === 'LIVE' && financeSettlementMode === 'ROUTE_LINKED_ACCOUNT'"
            class="settings-finance-live-banner settings-page__callout settings-page__callout--warning py-2 small mb-3"
            role="alert"
          >
            <div class="d-flex flex-wrap align-items-start justify-content-between gap-2">
              <div>
                <strong class="d-block mb-1">{{ 'settings.financeLiveEditModeTitle' | translate }}</strong>
                <span class="text-muted">{{ 'settings.financeLiveEditModeBody' | translate }}</span>
              </div>
              <button type="button" class="btn-outline-erp btn-sm text-nowrap" (click)="cancelFinanceRouteSettlementEdit()" [disabled]="financeSaving">
                {{ 'settings.financeLiveCancelEditButton' | translate }}
              </button>
            </div>
          </div>
          <div class="erp-form-group" *ngIf="financeSettlementMode === 'ROUTE_LINKED_ACCOUNT'">
            <label class="erp-label" for="fin-acc">{{ 'settings.financeLinkedAccount' | translate }}</label>
            <input id="fin-acc" type="text" class="erp-input settings-page__input-wide" [(ngModel)]="financeLinkedAccountId" name="finAcc" autocomplete="off" [placeholder]="'settings.financeLinkedPh' | translate" [disabled]="financeCoreSettlementLocked" />
          </div>
          <div class="erp-form-group" *ngIf="financeSettlementMode === 'ROUTE_LINKED_ACCOUNT'">
            <label class="erp-label" for="fin-bps">{{ 'settings.financeCommissionBps' | translate }}</label>
            <input id="fin-bps" type="number" min="0" max="10000" class="erp-input settings-page__input-narrow" [(ngModel)]="financeCommissionBps" name="finBps" [disabled]="financeCoreSettlementLocked" />
            <p class="text-muted small mb-0 mt-1">{{ 'settings.financeCommissionHelp' | translate }}</p>
          </div>
          <div class="erp-form-group">
            <label class="erp-label" for="fin-notes">{{ 'settings.financeInternalNotes' | translate }}</label>
            <textarea id="fin-notes" class="erp-input settings-page__input-xwide" rows="2" [(ngModel)]="financeNotes" name="finNotes"></textarea>
          </div>
          </section>

          <section class="settings-finance-section" aria-labelledby="fin-section-payroll">
            <h3 id="fin-section-payroll" class="settings-finance-section__title">{{ 'settings.financePayrollPayoutTitle' | translate }}</h3>
            <p class="text-muted small mb-3">{{ 'settings.financePayrollPayoutLead' | translate }}</p>
            <div class="settings-finance-toggle">
              <input
                type="checkbox"
                class="erp-check settings-finance-toggle__input"
                id="fin-payroll-digital"
                [(ngModel)]="financePayrollDigitalPayout"
                name="finPayrollPayout"
              />
              <div class="settings-finance-toggle__body">
                <label class="settings-finance-toggle__label mb-0" for="fin-payroll-digital">{{
                  'settings.financePayrollPayoutToggle' | translate
                }}</label>
                <p class="text-muted small mb-0 mt-1" *ngIf="!financePayrollDigitalPayout">
                  {{ 'settings.financePayrollPayoutHelpWhenOff' | translate }}
                </p>
                <p class="text-muted small mb-0 mt-1" *ngIf="financePayrollDigitalPayout">
                  {{ 'settings.financePayrollPayoutHelpWhenOn' | translate }}
                </p>
              </div>
            </div>
            <div
              *ngIf="!financePayrollDigitalPayout"
              class="settings-page__callout settings-page__callout--info py-2 small mt-3"
              role="status"
            >
              {{ 'settings.financePayrollPayoutOffHint' | translate }}
            </div>
            <div
              *ngIf="financePayrollDigitalPayout"
              class="settings-page__callout settings-page__callout--primary py-2 small mt-3"
              role="status"
            >
              {{ 'settings.financePayrollPayoutOnHint' | translate }}
            </div>
          </section>

          <section class="settings-finance-section" aria-labelledby="fin-section-library-policy" *ngIf="showLibraryBorrowerPolicyPanel">
            <h3 id="fin-section-library-policy" class="settings-finance-section__title">Library borrower policy</h3>
            <p class="text-muted small mb-3">
              Control which borrower types are allowed for this school. Circulation desk users can issue only for enabled borrower types.
            </p>
            <div class="d-flex flex-wrap gap-3 align-items-center">
              <label class="settings-rbac__check small mb-0">
                <input type="checkbox" [(ngModel)]="libraryBorrowerSelection.STUDENT" [disabled]="libraryBorrowerPolicySaving || libraryBorrowerPolicyLoading" />
                <span class="settings-rbac__check-text">Student</span>
              </label>
              <label class="settings-rbac__check small mb-0">
                <input type="checkbox" [(ngModel)]="libraryBorrowerSelection.STAFF" [disabled]="libraryBorrowerPolicySaving || libraryBorrowerPolicyLoading" />
                <span class="settings-rbac__check-text">Staff (teacher/non-teaching/admin)</span>
              </label>
              <label class="settings-rbac__check small mb-0">
                <input type="checkbox" [(ngModel)]="libraryBorrowerSelection.GUARDIAN" [disabled]="libraryBorrowerPolicySaving || libraryBorrowerPolicyLoading" />
                <span class="settings-rbac__check-text">Guardian</span>
              </label>
              <label class="settings-rbac__check small mb-0">
                <input type="checkbox" [(ngModel)]="libraryBorrowerSelection.OTHER" [disabled]="libraryBorrowerPolicySaving || libraryBorrowerPolicyLoading" />
                <span class="settings-rbac__check-text">Other (ad-hoc)</span>
              </label>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center mt-3">
              <button type="button" class="btn-outline-erp btn-sm" (click)="loadLibraryBorrowerPolicy()" [disabled]="libraryBorrowerPolicyLoading || libraryBorrowerPolicySaving">
                {{ libraryBorrowerPolicyLoading ? 'Loading...' : 'Reload policy' }}
              </button>
              <button type="button" class="btn-primary-erp btn-sm" (click)="saveLibraryBorrowerPolicy()" [disabled]="libraryBorrowerPolicySaving || libraryBorrowerPolicyLoading">
                {{ libraryBorrowerPolicySaving ? 'Saving...' : 'Save borrower policy' }}
              </button>
            </div>
            <p *ngIf="libraryBorrowerPolicyMsg" class="text-success small mt-2 mb-0">{{ libraryBorrowerPolicyMsg }}</p>
            <p *ngIf="libraryBorrowerPolicyErr" class="text-danger small mt-2 mb-0">{{ libraryBorrowerPolicyErr }}</p>
          </section>

          <footer class="settings-finance-card__footer d-flex flex-wrap gap-2 align-items-center pt-3 mt-3">
            <button type="button" class="btn-outline-erp btn-sm" (click)="loadFinanceProfile()" [disabled]="financeLoading">{{ financeLoading ? ('settings.financeLoading' | translate) : ('settings.financeReload' | translate) }}</button>
            <button
              type="button"
              class="btn-primary-erp btn-sm"
              (click)="saveFinanceProfile()"
              [disabled]="financeSaving || financeSaveButtonDisabled"
            >
              {{ financeSaving ? ('settings.financeSaving' | translate) : ('settings.financeSave' | translate) }}
            </button>
          </footer>
          <p *ngIf="financeMsg" class="text-success small mt-2 mb-0">{{ financeMsg }}</p>
          <p *ngIf="financeErr" class="text-danger small mt-2 mb-0">{{ financeErr }}</p>
        </div>
      </div>

      <div *ngIf="tab === 'roles'" class="erp-card animate-in-fade settings-page__roles-card">
        <header class="settings-page__section-head settings-page__section-head--tight">
          <h2 class="settings-page__section-title settings-page__section-title--flush">{{ 'settings.rolesHeading' | translate }}</h2>
        </header>
        <app-settings-rbac-panel *ngIf="canManageStaffRbacAccess"></app-settings-rbac-panel>
        <p *ngIf="!canManageStaffRbacAccess && isTenantAdmin" class="text-muted small mb-0">
          {{ 'settings.rbacDeskNoAssignmentPrivilege' | translate }}
        </p>
        <p *ngIf="!canManageStaffRbacAccess && !isTenantAdmin" class="text-muted small mb-0">{{ 'settings.rbacUserShellNote' | translate }}</p>
      </div>

    </div>
  `,
  styles: [
    `
      /* Tabs: use global .erp-tabs / .erp-tab (accent active state — same as Fees and the rest of the app). */

      .settings-page__h1 {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0;
        color: var(--clr-text-primary);
        font-family: var(--font-heading);
        letter-spacing: -0.02em;
        line-height: 1.25;
      }
      .settings-page__intro {
        margin: 0.4rem 0 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary);
        line-height: 1.55;
        max-width: 42rem;
      }
      .settings-page__intro--tight {
        margin-top: 0.35rem;
        line-height: 1.5;
      }
      .settings-page__section-title {
        font-size: 1.125rem;
        font-weight: 800;
        margin: 0 0 1.1rem;
        color: var(--clr-text-primary);
        font-family: var(--font-heading);
        letter-spacing: -0.02em;
        line-height: 1.3;
      }
      .settings-page__section-title--flush {
        margin-bottom: 0.4rem;
      }
      .settings-page__section-title--sm {
        font-size: 1.02rem;
        font-weight: 800;
        margin: 0 0 0.4rem;
      }
      .settings-page__section-head {
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--clr-border);
      }
      .settings-page__section-head--tight {
        margin-bottom: 1rem;
        padding-bottom: 0.65rem;
      }
      .settings-page__split-block {
        border-top: 1px solid var(--clr-border);
        margin-top: 1.5rem;
        padding-top: 1.5rem;
      }
      .settings-page__textarea-address {
        min-height: 5.5rem;
      }
      .settings-page__prewrap {
        white-space: pre-wrap;
      }
      .settings-page__branch-card {
        border: 1px solid var(--clr-border);
        background: var(--clr-surface-muted);
        border-radius: var(--radius-lg);
      }
      .settings-page__branch-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--clr-text-primary);
      }
      .settings-page__color-swatch {
        width: 50px;
        height: 40px;
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-md);
        cursor: pointer;
        padding: 0;
        background: var(--clr-surface);
        flex-shrink: 0;
      }
      .settings-page__color-hex {
        flex: 1;
        min-width: 0;
      }
      .settings-page__input-wide {
        max-width: 28rem;
      }
      .settings-page__input-xwide {
        max-width: 36rem;
        width: 100%;
      }
      .settings-page__input-narrow {
        max-width: 10rem;
      }
      .settings-page__callout {
        border-radius: var(--radius-md);
        color: var(--clr-text-secondary);
      }
      .settings-page__callout--info {
        background: color-mix(in srgb, var(--clr-info) 10%, var(--clr-surface));
        border: 1px solid color-mix(in srgb, var(--clr-info) 26%, var(--clr-border));
      }
      .settings-page__callout--primary {
        background: color-mix(in srgb, var(--clr-primary) 8%, var(--clr-surface));
        border: 1px solid color-mix(in srgb, var(--clr-primary) 22%, var(--clr-border));
        color: var(--clr-text-secondary);
      }
      .settings-page__callout--warning {
        background: color-mix(in srgb, var(--clr-warning) 14%, var(--clr-surface));
        border: 1px solid color-mix(in srgb, var(--clr-warning) 35%, var(--clr-border));
        color: var(--clr-text-secondary);
      }
      .settings-page__status--success {
        color: var(--clr-success);
        font-weight: 600;
      }
      .settings-page__status--warning {
        color: var(--clr-warning);
        font-weight: 600;
      }
      .settings-page__roles-card {
        display: block;
      }
      .settings-page__subpanel {
        background: var(--clr-surface-muted);
        border-color: var(--clr-border) !important;
      }
      .settings-password-reveal {
        display: flex;
        align-items: stretch;
        gap: 6px;
        width: 100%;
      }
      .settings-password-reveal__input {
        flex: 1 1 auto;
        min-width: 0;
      }
      .settings-password-reveal__toggle {
        flex-shrink: 0;
        min-width: 2.5rem;
        padding-left: 10px;
        padding-right: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .settings-password-reveal__toggle .bi {
        font-size: 1.05rem;
        line-height: 1;
      }
      .settings-page__input-verify {
        max-width: 22rem;
      }

      .settings-profile-root__header {
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--clr-border);
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
      .settings-account-overview {
        display: grid;
        gap: 12px;
      }
      .settings-account-overview__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 10px;
      }
      .settings-account-overview__grid--teacher {
        border-top: 1px dashed var(--clr-border-light, #e8eef0);
        padding-top: 12px;
      }
      .settings-account-overview__item {
        border: 1px solid color-mix(in srgb, var(--clr-border-light, #e8eef0) 88%, transparent);
        border-radius: var(--radius-md, 10px);
        padding: 10px 12px;
        background: color-mix(in srgb, var(--clr-surface, #fff) 92%, var(--clr-primary, #1b3a30) 8%);
        min-height: 62px;
      }
      .settings-account-overview__label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--clr-text-muted, #64748b);
        margin-bottom: 4px;
      }
      .settings-account-overview__value {
        font-size: 14px;
        font-weight: 650;
        color: var(--clr-text, #0f172a);
        word-break: break-word;
      }
      .settings-account-overview__status {
        margin-top: 2px;
      }
      @media (max-width: 640px) {
        .settings-account-overview__grid {
          grid-template-columns: 1fr;
        }
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
      .settings-finance-hub__section-title {
        margin-bottom: 0.5rem;
      }
      .settings-finance-card {
        padding: 1.25rem 1.35rem 1.35rem;
      }
      .settings-finance-card__head {
        padding-bottom: 0.15rem;
      }
      .settings-finance-card__footer {
        border-top: 1px solid var(--clr-border);
      }
      .settings-finance-section__title {
        font-size: 1.05rem;
        font-weight: 800;
        margin: 0 0 0.5rem;
        color: var(--clr-text-primary);
        font-family: var(--font-heading);
        letter-spacing: -0.02em;
      }
      .settings-finance-section + .settings-finance-section {
        margin-top: 1.5rem;
        padding-top: 1.35rem;
        border-top: 1px solid var(--clr-border);
      }
      .settings-finance-toggle {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        padding: 12px 14px;
        border-radius: var(--radius-md);
        background: var(--clr-surface-muted);
        border: 1px solid var(--clr-border);
        max-width: 40rem;
      }
      .settings-finance-toggle__input {
        margin-top: 0.2rem;
        flex-shrink: 0;
      }
      .settings-finance-toggle__label {
        font-weight: 700;
        font-size: 14px;
        color: var(--clr-text-primary);
        cursor: pointer;
        line-height: 1.4;
      }
      .settings-finance-onb {
        border: 1px solid var(--clr-border);
        border-radius: var(--radius-lg);
        padding: 14px 16px;
        background: color-mix(in srgb, var(--clr-surface-muted) 70%, var(--clr-surface));
      }
      .settings-finance-onb__steps li + li {
        margin-top: 0.35rem;
      }
      .settings-prefs-card__header {
        margin-bottom: 1rem;
        padding-bottom: 0.85rem;
        border-bottom: 1px solid var(--clr-border);
      }
      .settings-prefs-card__lead {
        margin: 0.5rem 0 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--clr-text-secondary);
        line-height: 1.55;
        max-width: 36rem;
      }
      .settings-prefs-card__body {
        max-width: 28rem;
      }
      .settings-prefs-card__select {
        max-width: 16rem;
        font-weight: 600;
      }

      .settings-page {
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }
      @media (max-width: 767.98px) {
        .settings-page__h1 {
          font-size: 1.2rem;
        }
        .settings-page__intro {
          max-width: none;
          font-size: 12.5px;
        }
        .settings-page__hero {
          flex-direction: column;
          align-items: stretch !important;
        }
        .settings-page__hero .btn-outline-erp {
          width: 100%;
          align-self: stretch;
        }
        .settings-finance-card {
          padding: 1rem 1rem 1.1rem;
        }
        .settings-finance-toggle {
          max-width: none;
        }
        .settings-prefs-card__body,
        .settings-prefs-card__select {
          max-width: none;
          width: 100%;
        }
        .settings-prefs-card__lead {
          max-width: none;
        }
        .settings-page__input-wide,
        .settings-page__input-xwide {
          max-width: none;
        }
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
  financeSettlementMode: 'OFFLINE_SCHOOL_COLLECTION' | 'PLATFORM_MERCHANT' | 'ROUTE_LINKED_ACCOUNT' =
    'OFFLINE_SCHOOL_COLLECTION';
  financeLinkedAccountId = '';
  financeCommissionBps = 0;
  financeNotes = '';
  financeLoading = false;
  financeSaving = false;
  financeMsg = '';
  financeErr = '';
  financePaymentRoutingOnboardingStatus = '';
  financeMaskedLinked = '';
  financeDeclarationDraft = '';
  financeSubmitting = false;
  financeWithdrawing = false;
  /**
   * When Route is LIVE, settlement fields are read-only until admin explicitly unlocks (ERP-style guard).
   * Internal notes stay editable without unlocking.
   */
  financeRouteEditUnlocked = false;
  financeSnapMode: 'OFFLINE_SCHOOL_COLLECTION' | 'PLATFORM_MERCHANT' | 'ROUTE_LINKED_ACCOUNT' =
    'OFFLINE_SCHOOL_COLLECTION';
  financeSnapAcc = '';
  financeSnapBps = 0;
  financeSnapNotes = '';
  /** In-app salary transfer via payout API; default off (same contract as backend). */
  financePayrollDigitalPayout = false;
  financeSnapPayrollDigitalPayout = false;
  libraryBorrowerPolicyLoading = false;
  libraryBorrowerPolicySaving = false;
  libraryBorrowerPolicyMsg = '';
  libraryBorrowerPolicyErr = '';
  libraryBorrowerPolicy: LibraryBorrowerPolicy = { allowedBorrowerTypes: ['STUDENT', 'STAFF'] };
  libraryBorrowerSelection: Record<LibraryBorrowerType, boolean> = {
    STUDENT: true,
    STAFF: true,
    GUARDIAN: false,
    OTHER: false,
  };
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
  profileDraftEmail = '';
  profileDraftNewPassword = '';
  profileDraftConfirmPassword = '';
  /** Toggle visibility for Security actions password fields (independent per field). */
  showSetPasswordNew = false;
  showSetPasswordConfirm = false;
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
  emailVerifyBusy = false;
  emailVerifyTokenDraft = '';
  emailVerifyMessage = '';
  identityActionBusy = false;
  identityActionMsg = '';
  identityActionErr = '';
  /** When backend exposes a dev token in the request response, user pastes it here to confirm. */
  emailVerifyDevTokenHint: string | null = null;
  /** View vs edit for account fields — reduces confusion with read-only profile hero above. */
  accountDetailsEditing = false;

  /** Role/profile values are cached for template performance (avoid getters in hot render paths). */
  isTenantAdmin = false;
  /** Duty assignment UI — not part of narrow {@code TENANT_SETTINGS} desk (requires portal admin or {@code TENANT_ADMIN}). */
  canManageStaffRbacAccess = false;
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
    private uiAccess: UiAccessService,
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
          : r === 'school_staff'
            ? 'header.role.schoolStaff'
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
    if (raw === 'finance' && this.isTenantAdmin) {
      this.tab = 'finance';
      this.loadFinanceProfile();
      return;
    }
    if (raw === 'roles') {
      if (this.canManageStaffRbacAccess) {
        this.tab = 'roles';
        return;
      }
      this.tab = this.isTenantAdmin ? 'general' : 'preferences';
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { settingsTab: this.isTenantAdmin ? 'school' : 'preferences' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }
    if (!this.isTenantAdmin && !raw) {
      this.tab = 'preferences';
    }
  }

  selectFinanceTab(): void {
    this.tab = 'finance';
    this.financeMsg = '';
    this.financeErr = '';
    this.loadFinanceProfile();
    this.loadLibraryBorrowerPolicy();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { settingsTab: 'finance', financeHub: 'settlement' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  loadFinanceProfile(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.financeLoading = true;
    this.financeErr = '';
    this.settingsService.getFinanceProfile().subscribe({
      next: p => {
        const m = (p.feeSettlementMode || '').toUpperCase();
        this.financeSettlementMode =
          m === 'ROUTE_LINKED_ACCOUNT'
            ? 'ROUTE_LINKED_ACCOUNT'
            : m === 'PLATFORM_MERCHANT'
              ? 'PLATFORM_MERCHANT'
              : 'OFFLINE_SCHOOL_COLLECTION';
        this.financeLinkedAccountId = (p.razorpayRouteLinkedAccountId ?? '').trim();
        this.financeCommissionBps = p.platformCommissionBps ?? 0;
        this.financeNotes = p.financeNotes ?? '';
        this.financePaymentRoutingOnboardingStatus = (p.paymentRoutingOnboardingStatus || '').trim();
        this.financeMaskedLinked = (p.razorpayRouteLinkedAccountMasked || '').trim();
        this.financeRouteEditUnlocked = false;
        this.financeSnapMode = this.financeSettlementMode;
        this.financeSnapAcc = this.financeLinkedAccountId;
        this.financeSnapBps = Number(this.financeCommissionBps) || 0;
        this.financeSnapNotes = (this.financeNotes ?? '').trim();
        this.financePayrollDigitalPayout = !!p.payrollDigitalPayoutEnabled;
        this.financeSnapPayrollDigitalPayout = this.financePayrollDigitalPayout;
        this.financeLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.financeLoading = false;
        this.financeErr = this.translate.instant('settings.financeLoadErr');
        this.cdr.markForCheck();
      },
    });
  }

  saveFinanceProfile(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.financeMsg = '';
    this.financeErr = '';
    const validation = this.validateFinanceSettlementForm();
    if (validation) {
      this.financeErr = validation;
      return;
    }
    this.confirmPayrollPayoutChangeIfNeeded(() => this.saveFinanceProfileCore());
  }

  /** Persists finance profile after validation; use {@link #saveFinanceProfile} so payroll toggle changes can be confirmed. */
  private saveFinanceProfileCore(): void {
    const st = (this.financePaymentRoutingOnboardingStatus || '').toUpperCase();
    const route = this.financeSettlementMode === 'ROUTE_LINKED_ACCOUNT';
    const liveLocked = route && st === 'LIVE' && !this.financeRouteEditUnlocked;
    if (liveLocked) {
      const nextNotes = this.financeNotes.trim();
      const notesSame = nextNotes === (this.financeSnapNotes || '').trim();
      const payrollSame = this.financePayrollDigitalPayout === this.financeSnapPayrollDigitalPayout;
      if (notesSame && payrollSame) {
        this.financeErr = this.translate.instant('settings.financeNoChangesNotes');
        return;
      }
      this.persistFinanceProfileLiveLockedEdits(nextNotes || null, this.financePayrollDigitalPayout);
      return;
    }
    const liveUnlocked = route && st === 'LIVE' && this.financeRouteEditUnlocked;
    if (
      liveUnlocked &&
      !this.financeCoreFieldsDirty() &&
      this.financeNotes.trim() === (this.financeSnapNotes || '').trim() &&
      this.financePayrollDigitalPayout === this.financeSnapPayrollDigitalPayout
    ) {
      this.financeErr = this.translate.instant('settings.financeNoChangesAll');
      return;
    }
    const modeChanged = this.financeSettlementMode !== this.financeSnapMode;
    const proceedAfterModeConfirm = () => {
      if (liveUnlocked && this.financeCoreFieldsDirty()) {
        this.confirmDialog
          .confirm({
            title: this.translate.instant('settings.financeLiveEditConfirmTitle'),
            message: this.translate.instant('settings.financeLiveEditConfirmBody'),
            variant: 'warning',
            confirmLabel: this.translate.instant('settings.financeLiveEditConfirmProceed'),
            cancelLabel: this.translate.instant('settings.financeLiveEditConfirmCancel'),
          })
          .subscribe(confirmed => {
            if (!confirmed) {
              this.cdr.markForCheck();
              return;
            }
            this.persistFinanceProfileFull();
          });
        return;
      }
      this.persistFinanceProfileFull();
    };
    if (modeChanged) {
      const modeKey = `settings.financeSaveConfirmBody.${this.financeSettlementMode}`;
      this.confirmDialog
        .confirm({
          title: this.translate.instant('settings.financeSaveConfirmTitle'),
          message: this.translate.instant(modeKey),
          variant: 'primary',
          confirmLabel: this.translate.instant('settings.financeSaveConfirmOk'),
          cancelLabel: this.translate.instant('settings.financeSaveConfirmCancel'),
        })
        .subscribe(confirmed => {
          if (!confirmed) {
            this.cdr.markForCheck();
            return;
          }
          proceedAfterModeConfirm();
        });
      return;
    }
    proceedAfterModeConfirm();
  }

  /**
   * Non-technical admins get a plain-language confirmation when toggling in-app salary transfer;
   * fee settlement mode already has its own confirm flow.
   */
  private confirmPayrollPayoutChangeIfNeeded(proceed: () => void): void {
    if (this.financePayrollDigitalPayout === this.financeSnapPayrollDigitalPayout) {
      proceed();
      return;
    }
    const enabling = this.financePayrollDigitalPayout;
    this.confirmDialog
      .confirm({
        title: this.translate.instant('settings.financePayrollPayoutConfirmTitle'),
        message: enabling
          ? this.translate.instant('settings.financePayrollPayoutEnableConfirmMsg')
          : this.translate.instant('settings.financePayrollPayoutDisableConfirmMsg'),
        details: enabling
          ? [
              this.translate.instant('settings.financePayrollPayoutEnableDetail1'),
              this.translate.instant('settings.financePayrollPayoutEnableDetail2'),
              this.translate.instant('settings.financePayrollPayoutEnableDetail3'),
            ]
          : [
              this.translate.instant('settings.financePayrollPayoutDisableDetail1'),
              this.translate.instant('settings.financePayrollPayoutDisableDetail2'),
              this.translate.instant('settings.financePayrollPayoutDisableDetail3'),
            ],
        variant: 'primary',
        confirmLabel: this.translate.instant('settings.financePayrollPayoutConfirmSave'),
        cancelLabel: this.translate.instant('settings.financePayrollPayoutConfirmCancel'),
      })
      .subscribe(confirmed => {
        if (!confirmed) {
          this.cdr.markForCheck();
          return;
        }
        proceed();
      });
  }

  unlockFinanceRouteSettlementForEdit(): void {
    this.financeRouteEditUnlocked = true;
    this.financeMsg = '';
    this.financeErr = '';
    this.cdr.markForCheck();
  }

  cancelFinanceRouteSettlementEdit(): void {
    this.financeRouteEditUnlocked = false;
    this.financeMsg = '';
    this.financeErr = '';
    this.loadFinanceProfile();
  }

  get financeLiveRouteReadonlyBanner(): boolean {
    return (
      this.financeSettlementMode === 'ROUTE_LINKED_ACCOUNT' &&
      (this.financePaymentRoutingOnboardingStatus || '').toUpperCase() === 'LIVE' &&
      !this.financeRouteEditUnlocked
    );
  }

  get financeSaveButtonDisabled(): boolean {
    if (this.financeLiveRouteReadonlyBanner) {
      const notesSame = (this.financeNotes ?? '').trim() === (this.financeSnapNotes || '').trim();
      const payrollSame = this.financePayrollDigitalPayout === this.financeSnapPayrollDigitalPayout;
      return notesSame && payrollSame;
    }
    return false;
  }

  private financeCoreFieldsDirty(): boolean {
    const acc = (this.financeLinkedAccountId || '').trim();
    const snapAcc = (this.financeSnapAcc || '').trim();
    return (
      this.financeSettlementMode !== this.financeSnapMode ||
      acc !== snapAcc ||
      (Number(this.financeCommissionBps) || 0) !== (Number(this.financeSnapBps) || 0)
    );
  }

  private validateFinanceSettlementForm(): string | null {
    if (this.financeSettlementMode === 'ROUTE_LINKED_ACCOUNT') {
      const acc = (this.financeLinkedAccountId || '').trim();
      if (!acc) {
        return this.translate.instant('settings.financeValidationRouteRequiresAcc');
      }
      if (!/^acc_[A-Za-z0-9]+$/.test(acc) || acc.length < 12) {
        return this.translate.instant('settings.financeValidationAccFormat');
      }
      const bps = Number(this.financeCommissionBps);
      if (Number.isNaN(bps) || bps < 0 || bps > 10000) {
        return this.translate.instant('settings.financeValidationBpsRange');
      }
    }
    return null;
  }

  private persistFinanceProfileFull(): void {
    this.financeSaving = true;
    const mode = this.financeSettlementMode;
    this.settingsService
      .updateFinanceProfile({
        feeSettlementMode: mode,
        razorpayRouteLinkedAccountId: mode === 'ROUTE_LINKED_ACCOUNT' ? this.financeLinkedAccountId.trim() || null : null,
        platformCommissionBps: mode === 'ROUTE_LINKED_ACCOUNT' ? Number(this.financeCommissionBps) || 0 : 0,
        financeNotes: this.financeNotes.trim() || null,
        payrollDigitalPayoutEnabled: this.financePayrollDigitalPayout,
      })
      .subscribe({
        next: () => {
          this.financeSaving = false;
          this.financeRouteEditUnlocked = false;
          this.financeMsg = this.translate.instant('settings.financeSaved');
          this.loadFinanceProfile();
          this.cdr.markForCheck();
        },
        error: (e: { message?: string }) => {
          this.financeSaving = false;
          this.financeErr = e?.message || this.translate.instant('settings.financeSaveErr');
          this.cdr.markForCheck();
        },
      });
  }

  /** When Route is LIVE and settlement fields are locked, school can still edit internal notes and payroll payout flag. */
  private persistFinanceProfileLiveLockedEdits(notes: string | null, payrollDigitalPayout: boolean): void {
    this.financeSaving = true;
    this.settingsService
      .updateFinanceProfile({
        financeNotes: notes,
        payrollDigitalPayoutEnabled: payrollDigitalPayout,
      })
      .subscribe({
        next: () => {
          this.financeSaving = false;
          this.financeMsg = this.translate.instant('settings.financeNotesSaved');
          this.loadFinanceProfile();
          this.cdr.markForCheck();
        },
        error: (e: { message?: string }) => {
          this.financeSaving = false;
          this.financeErr = e?.message || this.translate.instant('settings.financeSaveErr');
          this.cdr.markForCheck();
        },
      });
  }

  financeOnboardingBadgeClass(): string {
    const s = (this.financePaymentRoutingOnboardingStatus || '').toUpperCase();
    if (s === 'LIVE') {
      return 'badge-success';
    }
    if (s === 'SUBMITTED') {
      return 'badge-info';
    }
    if (s === 'PENDING_CHANGES') {
      return 'badge-warning';
    }
    return 'badge-secondary';
  }

  get financeOnboardingStatusKey(): string {
    const s = (this.financePaymentRoutingOnboardingStatus || 'NOT_REQUIRED').toUpperCase();
    return `settings.financeOnbStatus.${s}`;
  }

  get financeLinkedDisplayLine(): string {
    const plain = (this.financeLinkedAccountId || '').trim();
    if (plain) {
      return '';
    }
    const m = (this.financeMaskedLinked || '').trim();
    if (!m) {
      return '';
    }
    return this.translate.instant('settings.financeOnbMaskedLine', { value: m });
  }

  get financeShowDeclarationBlock(): boolean {
    return (
      this.financeSettlementMode === 'ROUTE_LINKED_ACCOUNT' &&
      (this.financePaymentRoutingOnboardingStatus === 'DRAFT' ||
        this.financePaymentRoutingOnboardingStatus === 'PENDING_CHANGES')
    );
  }

  get financeCoreSettlementLocked(): boolean {
    if (this.financeSettlementMode !== 'ROUTE_LINKED_ACCOUNT') {
      return false;
    }
    const st = (this.financePaymentRoutingOnboardingStatus || '').toUpperCase();
    if (st === 'SUBMITTED') {
      return true;
    }
    if (st === 'LIVE' && !this.financeRouteEditUnlocked) {
      return true;
    }
    return false;
  }

  submitFinanceOnboarding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.financeSubmitting = true;
    this.financeMsg = '';
    this.financeErr = '';
    const decl = (this.financeDeclarationDraft || '').trim();
    this.settingsService.submitFinanceProfileForReview(decl).subscribe({
      next: () => {
        this.financeSubmitting = false;
        this.financeDeclarationDraft = '';
        this.financeMsg = this.translate.instant('settings.financeOnbSubmitOk');
        this.loadFinanceProfile();
        this.cdr.markForCheck();
      },
      error: (e: { message?: string }) => {
        this.financeSubmitting = false;
        this.financeErr = e?.message || this.translate.instant('settings.financeOnbSubmitErr');
        this.cdr.markForCheck();
      },
    });
  }

  withdrawFinanceOnboarding(): void {
    if (!this.isTenantAdmin) {
      return;
    }
    this.financeWithdrawing = true;
    this.financeMsg = '';
    this.financeErr = '';
    this.settingsService.withdrawFinanceProfileSubmission().subscribe({
      next: () => {
        this.financeWithdrawing = false;
        this.financeMsg = this.translate.instant('settings.financeOnbWithdrawOk');
        this.loadFinanceProfile();
        this.cdr.markForCheck();
      },
      error: (e: { message?: string }) => {
        this.financeWithdrawing = false;
        this.financeErr = e?.message || this.translate.instant('settings.financeOnbWithdrawErr');
        this.cdr.markForCheck();
      },
    });
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
    this.profileDraftEmail = u?.email ?? '';
    this.profileDraftNewPassword = '';
    this.profileDraftConfirmPassword = '';
    this.showSetPasswordNew = false;
    this.showSetPasswordConfirm = false;
    this.identityActionMsg = '';
    this.identityActionErr = '';
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

  get profileEmailVerified(): boolean {
    const fromUser = this.profileUser?.emailVerified;
    if (fromUser !== undefined && fromUser !== null) {
      return !!fromUser;
    }
    return !!this.profileDetails?.emailVerified;
  }

  get profilePhoneVerified(): boolean {
    const fromUser = this.profileUser?.phoneVerified;
    if (fromUser !== undefined && fromUser !== null) {
      return !!fromUser;
    }
    return !!this.profileDetails?.phoneVerified;
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
      qualification: this.isTeacherProfileEditable ? (this.profileDraftQualification || '').trim() : undefined,
      specialization: this.isTeacherProfileEditable ? (this.profileDraftSpecialization || '').trim() : undefined,
      bankAccountHolder: this.isTeacherProfileEditable ? (this.profileDraftBankAccountHolder || '').trim() : undefined,
      bankName: this.isTeacherProfileEditable ? (this.profileDraftBankName || '').trim() : undefined,
      bankAccountNumber: this.isTeacherProfileEditable ? (this.profileDraftBankAccountNumber || '').trim() : undefined,
      bankIfsc: this.isTeacherProfileEditable ? (this.profileDraftBankIfsc || '').trim().toUpperCase() : undefined,
    };
    const requestedEmail = (this.profileDraftEmail || '').trim();
    const requestedPhone = (this.profileDraftPhone || '').trim();
    const continueWithCriticalConfirmation = () => {
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
            this.persistProfileAccountUpdate(updatePayload, requestedEmail, requestedPhone);
          });
        return;
      }
      this.persistProfileAccountUpdate(updatePayload, requestedEmail, requestedPhone);
    };
    const identityImpactDetails = this.buildIdentityImpactChangeDetails(requestedEmail, requestedPhone);
    if (!identityImpactDetails.length) {
      continueWithCriticalConfirmation();
      return;
    }
    this.confirmDialog
      .confirm({
        title: this.translate.instant('settings.identityImpactConfirmTitle'),
        message: this.translate.instant('settings.identityImpactConfirmBody'),
        details: identityImpactDetails,
        variant: 'warning',
        confirmLabel: this.translate.instant('settings.identityImpactConfirmProceed'),
        cancelLabel: this.translate.instant('settings.identityImpactConfirmCancel'),
      })
      .subscribe(confirmed => {
        if (!confirmed) {
          this.cdr.markForCheck();
          return;
        }
        continueWithCriticalConfirmation();
      });
  }

  private buildIdentityImpactChangeDetails(requestedEmail: string, requestedPhone: string): string[] {
    const normalizedRequestedEmail = requestedEmail.toLowerCase();
    const currentEmail = (this.profileUser?.email ?? '').trim().toLowerCase();
    const currentPhone = (this.profileUser?.phone ?? '').trim();
    const details: string[] = [];
    if (normalizedRequestedEmail !== currentEmail) {
      details.push(this.translate.instant('settings.identityImpactEmailLine'));
    }
    if (requestedPhone !== currentPhone) {
      details.push(this.translate.instant('settings.identityImpactPhoneLine'));
    }
    return details;
  }

  private buildCriticalProfileChangeDetails(updatePayload: {
    name: string;
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
        after: (this.profileDraftPhone ?? '').trim(),
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
    qualification?: string;
    specialization?: string;
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  }, requestedEmail: string, requestedPhone: string): void {
    this.profileAccountSaving = true;
    this.profileAccountMsg = '';
    this.profileAccountErr = '';
    this.identityActionMsg = '';
    this.identityActionErr = '';
    this.auth.updateMyProfileDetails(updatePayload).subscribe({
      next: () => {
        this.persistIdentityUpdatesAfterProfileSave(requestedEmail, requestedPhone);
      },
      error: () => {
        this.profileAccountSaving = false;
        this.profileAccountErr = this.translate.instant('settings.profileSaveErr');
        this.cdr.markForCheck();
      },
    });
  }

  private persistIdentityUpdatesAfterProfileSave(requestedEmail: string, requestedPhone: string): void {
    const current = this.auth.getCurrentUser();
    if (!current) {
      this.onProfileSaveComplete();
      return;
    }
    const normalizedEmail = requestedEmail.toLowerCase();
    const emailChanged = normalizedEmail !== ((current.email ?? '').trim().toLowerCase());
    const phoneChanged = requestedPhone !== ((current.phone ?? '').trim());
    const applyPhoneUpdate = () => {
      if (!phoneChanged) {
        this.onProfileSaveComplete();
        return;
      }
      this.auth.updateLoginPhone(requestedPhone).subscribe({
        next: res => {
          if (res?.message) {
            this.identityActionMsg = this.identityActionMsg
              ? `${this.identityActionMsg} ${res.message}`
              : res.message;
          }
          this.onProfileSaveComplete();
        },
        error: e => {
          this.profileAccountSaving = false;
          this.profileAccountErr = e?.message || this.translate.instant('settings.profileSaveErr');
          this.cdr.markForCheck();
        },
      });
    };
    if (!emailChanged) {
      applyPhoneUpdate();
      return;
    }
    this.auth.updateLoginEmail(normalizedEmail).subscribe({
      next: res => {
        if (res?.message) {
          this.identityActionMsg = res.message;
        }
        this.emailVerifyDevTokenHint = res?.devVerificationToken ?? null;
        this.emailVerifyTokenDraft = '';
        applyPhoneUpdate();
      },
      error: e => {
        this.profileAccountSaving = false;
        this.profileAccountErr = e?.message || this.translate.instant('settings.profileSaveErr');
        this.cdr.markForCheck();
      },
    });
  }

  private onProfileSaveComplete(): void {
    this.profileAccountSaving = false;
    this.accountDetailsEditing = false;
    this.profileAccountMsg = this.translate.instant(
      runtimeConfig.useMocks ? 'settings.profileSavedMock' : 'settings.profileSaved'
    );
    this.syncAccountDrafts();
    this.refreshProfileContext();
    this.refreshProfilePreview();
    this.loadPersonalProfileDetails();
    this.auth.fetchProfileSummary().subscribe({ error: () => void 0 });
    this.cdr.markForCheck();
  }

  setPasswordAfterVerificationClick(): void {
    const nextPassword = (this.profileDraftNewPassword || '').trim();
    const confirmPassword = (this.profileDraftConfirmPassword || '').trim();
    this.identityActionMsg = '';
    this.identityActionErr = '';
    if (!nextPassword || nextPassword.length < 8) {
      this.identityActionErr = this.translate.instant('settings.setPasswordMinLength');
      return;
    }
    if (nextPassword !== confirmPassword) {
      this.identityActionErr = this.translate.instant('settings.setPasswordMismatch');
      return;
    }
    if (this.identityActionBusy) {
      return;
    }
    this.confirmDialog
      .confirm({
        title: this.translate.instant('settings.setPasswordConfirmTitle'),
        message: this.translate.instant('settings.setPasswordConfirmMessage'),
        details: [
          this.translate.instant('settings.setPasswordConfirmDetail1'),
          this.translate.instant('settings.setPasswordConfirmDetail2'),
          this.translate.instant('settings.setPasswordConfirmDetail3'),
        ],
        variant: 'warning',
        confirmLabel: this.translate.instant('settings.setPasswordConfirmProceed'),
        cancelLabel: this.translate.instant('settings.setPasswordConfirmCancel'),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (!confirmed) {
          this.cdr.markForCheck();
          return;
        }
        this.executeSetPasswordAfterDialogConfirm(nextPassword);
      });
  }

  private executeSetPasswordAfterDialogConfirm(nextPassword: string): void {
    this.identityActionBusy = true;
    this.identityActionErr = '';
    this.auth
      .setPasswordAfterVerification(nextPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.identityActionBusy = false;
          this.profileDraftNewPassword = '';
          this.profileDraftConfirmPassword = '';
          this.showSetPasswordNew = false;
          this.showSetPasswordConfirm = false;
          this.identityActionMsg = this.translate.instant('settings.setPasswordSuccess');
          this.cdr.markForCheck();
        },
        error: e => {
          this.identityActionBusy = false;
          this.identityActionErr = e?.message || this.translate.instant('settings.setPasswordErr');
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
        if (this.tab === 'finance') {
          this.loadLibraryBorrowerPolicy();
        }
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
                if (this.tab === 'finance') {
                  this.loadLibraryBorrowerPolicy();
                }
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

  requestEmailVerificationClick(): void {
    this.emailVerifyBusy = true;
    this.emailVerifyMessage = '';
    this.auth.requestEmailVerification().subscribe({
      next: res => {
        this.emailVerifyMessage = res.message;
        this.emailVerifyDevTokenHint = res.devOneTimeToken ?? null;
        if (this.emailVerifyDevTokenHint) {
          this.emailVerifyTokenDraft = '';
        }
        this.emailVerifyBusy = false;
        this.cdr.markForCheck();
      },
      error: e => {
        this.emailVerifyMessage = e?.message || this.translate.instant('settings.emailVerifyErr');
        this.emailVerifyBusy = false;
        this.cdr.markForCheck();
      },
    });
  }

  confirmEmailVerificationClick(): void {
    const t = (this.emailVerifyTokenDraft || '').trim();
    if (!t) {
      return;
    }
    this.emailVerifyBusy = true;
    this.auth.confirmEmailVerification(t).subscribe({
      next: () => {
        this.emailVerifyMessage = this.translate.instant('settings.emailVerifyDone');
        this.emailVerifyDevTokenHint = null;
        this.emailVerifyTokenDraft = '';
        this.auth.fetchProfileSummary().subscribe({
          next: () => {
            this.refreshProfileContext();
            this.loadPersonalProfileDetails();
            this.emailVerifyBusy = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.refreshProfileContext();
            this.loadPersonalProfileDetails();
            this.emailVerifyBusy = false;
            this.cdr.markForCheck();
          },
        });
      },
      error: e => {
        this.emailVerifyMessage = e?.message || this.translate.instant('settings.emailVerifyErr');
        this.emailVerifyBusy = false;
        this.cdr.markForCheck();
      },
    });
  }

  private refreshProfileContext(): void {
    this.profileUser = this.auth.getCurrentUser();
    const roleRaw = (this.auth.getRole() || '').toLowerCase().trim();
    const normalizedRole = roleRaw.startsWith('role_') ? roleRaw.slice(5) : roleRaw;
    this.isTenantAdmin = this.uiAccess.hasSchoolTenantSettingsWriteShell();
    this.canManageStaffRbacAccess = this.uiAccess.hasSchoolRbacAssignmentAdminAccess();
    if (this.tab === 'roles' && !this.canManageStaffRbacAccess) {
      this.tab = this.isTenantAdmin ? 'general' : 'preferences';
    }
    this.isParentOnlyChildren = normalizedRole === 'parent';
    this.canEditOwnPhoto = ['admin', 'teacher', 'super_admin', 'student', 'parent'].includes(normalizedRole);
    this.profileVisualRole = ['admin', 'teacher', 'parent', 'super_admin', 'student'].includes(normalizedRole) ? normalizedRole : 'other';
    this.roleDisplayLabel = this.resolveRoleDisplayLabel(normalizedRole);
    this.photoHintLine = this.translate.instant(runtimeConfig.useMocks ? 'settings.photoHintMock' : 'settings.photoHintLive');
  }

  get showLibraryBorrowerPolicyPanel(): boolean {
    return this.isTenantAdmin && this.isLibraryFeatureEnabledForTenant();
  }

  private isLibraryFeatureEnabledForTenant(): boolean {
    return this.features.find(f => f.persistKey === 'library')?.enabled === true;
  }

  private syncBorrowerSelectionFromPolicy(policy: LibraryBorrowerPolicy): void {
    const allowed = new Set((policy?.allowedBorrowerTypes ?? []).map(v => v.toUpperCase()) as LibraryBorrowerType[]);
    this.libraryBorrowerSelection = {
      STUDENT: allowed.has('STUDENT'),
      STAFF: allowed.has('STAFF'),
      GUARDIAN: allowed.has('GUARDIAN'),
      OTHER: allowed.has('OTHER'),
    };
  }

  loadLibraryBorrowerPolicy(): void {
    this.libraryBorrowerPolicyMsg = '';
    this.libraryBorrowerPolicyErr = '';
    if (!this.showLibraryBorrowerPolicyPanel) {
      return;
    }
    this.libraryBorrowerPolicyLoading = true;
    this.settingsService.getLibraryBorrowerPolicy().subscribe({
      next: p => {
        this.libraryBorrowerPolicy = p;
        this.syncBorrowerSelectionFromPolicy(p);
        this.libraryBorrowerPolicyLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.libraryBorrowerPolicyLoading = false;
        this.libraryBorrowerPolicyErr = 'Unable to load borrower policy.';
        this.cdr.markForCheck();
      },
    });
  }

  saveLibraryBorrowerPolicy(): void {
    this.libraryBorrowerPolicyMsg = '';
    this.libraryBorrowerPolicyErr = '';
    if (!this.showLibraryBorrowerPolicyPanel) {
      return;
    }
    const selected = (Object.keys(this.libraryBorrowerSelection) as LibraryBorrowerType[])
      .filter(k => this.libraryBorrowerSelection[k]);
    if (selected.length < 1) {
      this.libraryBorrowerPolicyErr = 'At least one borrower type must be enabled.';
      return;
    }
    this.libraryBorrowerPolicySaving = true;
    this.settingsService.updateLibraryBorrowerPolicy({ allowedBorrowerTypes: selected }).subscribe({
      next: p => {
        this.libraryBorrowerPolicy = p;
        this.syncBorrowerSelectionFromPolicy(p);
        this.libraryBorrowerPolicySaving = false;
        this.libraryBorrowerPolicyMsg = 'Borrower policy saved.';
        this.cdr.markForCheck();
      },
      error: () => {
        this.libraryBorrowerPolicySaving = false;
        this.libraryBorrowerPolicyErr = 'Unable to save borrower policy.';
        this.cdr.markForCheck();
      },
    });
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
