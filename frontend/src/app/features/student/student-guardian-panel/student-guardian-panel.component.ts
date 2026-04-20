import { ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StudentGuardianMapping } from '../../../core/models/models';

/**
 * Parents & guardians block for student directory profile — contact-focused, role-neutral copy for staff.
 * Data shape mirrors {@link StudentGuardianMapping} / backend {@code MappingResponse}.
 */
@Component({
  selector: 'app-student-guardian-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="sgp" data-testid="student-guardian-panel">
      <h5 class="sgp__title">{{ 'students.profile.guardiansSection' | translate }}</h5>
      <p *ngIf="loading" class="text-muted small mb-0">{{ 'students.profile.guardiansLoading' | translate }}</p>

      <ng-container *ngIf="!loading">
        <div *ngIf="guardians.length === 0 && fallbackParentName" class="sgp__fallback">
          <span class="sgp__label">{{ 'students.profile.parentGuardian' | translate }}</span>
          <strong class="d-block">{{ fallbackParentName }}</strong>
          <p class="text-muted mb-0 mt-2 small">{{ 'students.profile.guardiansFallbackHint' | translate }}</p>
        </div>

        <div *ngFor="let g of guardians; trackBy: trackById" class="sgp__card">
          <div class="sgp__card-head">
            <div class="sgp__identity">
              <span class="sgp__name">{{ g.guardianName }}</span>
              <span *ngIf="g.relationType as rel" class="sgp__relation">
                {{ ('students.enums.guardianRelation.' + (rel | uppercase)) | translate }}
              </span>
            </div>
            <div class="sgp__badges">
              <span *ngIf="g.isPrimary" class="sgp__badge sgp__badge--primary">{{ 'students.profile.guardianBadgePrimary' | translate }}</span>
              <span *ngIf="g.isEmergencyContact" class="sgp__badge sgp__badge--emergency">{{ 'students.profile.guardianBadgeEmergency' | translate }}</span>
            </div>
          </div>

          <div class="sgp__grid">
            <div class="sgp__cell" *ngIf="g.primaryPhone">
              <span class="sgp__label">{{ 'students.profile.guardianDetail.primaryMobile' | translate }}</span>
              <span class="sgp__value">{{ g.primaryPhone }}</span>
            </div>
            <div class="sgp__cell" *ngIf="g.additionalPhones?.length">
              <span class="sgp__label">{{ 'students.profile.guardianDetail.alternatePhones' | translate }}</span>
              <span class="sgp__value sgp__value--lines">{{ additionalPhonesLine(g) }}</span>
            </div>
            <div class="sgp__cell" *ngIf="g.email">
              <span class="sgp__label">{{ 'students.profile.guardianDetail.email' | translate }}</span>
              <span class="sgp__value">{{ g.email }}</span>
            </div>
            <div class="sgp__cell" *ngIf="g.occupation">
              <span class="sgp__label">{{ 'students.profile.guardianDetail.occupation' | translate }}</span>
              <span class="sgp__value">{{ g.occupation }}</span>
            </div>
            <div class="sgp__cell" *ngIf="g.parentPortalLinked === true || g.parentPortalLinked === false">
              <span class="sgp__label">{{ 'students.profile.guardianDetail.parentApp' | translate }}</span>
              <span class="sgp__value">{{
                g.parentPortalLinked
                  ? ('students.profile.guardianDetail.parentAppYes' | translate)
                  : ('students.profile.guardianDetail.parentAppNo' | translate)
              }}</span>
            </div>
            <div class="sgp__cell" *ngIf="g.custodyType">
              <span class="sgp__label">{{ 'students.profile.guardianDetail.familyNotes' | translate }}</span>
              <span class="sgp__value">{{ g.custodyType }}</span>
            </div>
            <div class="sgp__cell" *ngIf="g.effectiveFrom || g.effectiveTo">
              <span class="sgp__label">{{ 'students.profile.guardianDetail.contactPeriod' | translate }}</span>
              <span class="sgp__value">{{ formatEffective(g) }}</span>
            </div>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [
    `
      .sgp__title {
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 12px;
        color: color-mix(in srgb, var(--clr-text) 88%, var(--clr-primary) 12%);
        letter-spacing: -0.01em;
      }
      .sgp__fallback {
        line-height: 1.5;
        font-size: 14px;
      }
      .sgp__card {
        background: color-mix(in srgb, var(--clr-surface) 95%, var(--clr-primary) 5%);
        border: 1px solid color-mix(in srgb, var(--clr-border) 76%, var(--clr-primary) 24%);
        border-radius: 12px;
        padding: 16px 18px;
        margin-bottom: 12px;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--clr-border) 25%, transparent);
      }
      .sgp__card:last-child {
        margin-bottom: 0;
      }
      .sgp__card-head {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 14px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--clr-border);
      }
      .sgp__identity {
        min-width: 0;
      }
      .sgp__name {
        display: block;
        font-size: 16px;
        font-weight: 700;
        color: var(--clr-text);
        line-height: 1.3;
      }
      .sgp__relation {
        display: block;
        font-size: 13px;
        color: var(--clr-text-muted);
        margin-top: 4px;
      }
      .sgp__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        flex-shrink: 0;
      }
      .sgp__badge {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 999px;
        white-space: nowrap;
      }
      .sgp__badge--primary {
        background: var(--clr-primary);
        color: #fff;
      }
      .sgp__badge--emergency {
        background: var(--clr-warning);
        color: #1a1a1a;
      }
      .sgp__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 14px 20px;
        align-items: start;
      }
      @media (max-width: 576px) {
        .sgp__grid {
          grid-template-columns: 1fr;
        }
      }
      .sgp__cell {
        min-width: 0;
      }
      .sgp__label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--clr-text-muted);
        margin-bottom: 4px;
      }
      .sgp__value {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: var(--clr-text);
        word-break: break-word;
      }
      .sgp__value--lines {
        font-weight: 500;
        white-space: pre-line;
      }
    `,
  ],
})
export class StudentGuardianPanelComponent implements OnDestroy {
  @Input() guardians: StudentGuardianMapping[] = [];
  @Input() loading = false;
  @Input() fallbackParentName: string | null = null;

  private langSub?: Subscription;

  constructor(
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.langSub = this.translate.onLangChange.subscribe(() => this.cdr.markForCheck());
    this.langSub.add(this.translate.onTranslationChange.subscribe(() => this.cdr.markForCheck()));
  }

  trackById(_: number, g: StudentGuardianMapping): number {
    return g.id;
  }

  additionalPhonesLine(g: StudentGuardianMapping): string {
    const list = g.additionalPhones;
    if (!list?.length) {
      return '';
    }
    return list.join('\n');
  }

  formatEffective(g: StudentGuardianMapping): string {
    const dash = '—';
    const from = g.effectiveFrom || dash;
    const to = g.effectiveTo || dash;
    return `${from} → ${to}`;
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }
}
