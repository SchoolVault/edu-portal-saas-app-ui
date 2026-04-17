import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { AppNotification } from '../../core/models/models';
import {
  isNonActionableInternalNotificationPath,
  resolveNotificationNavigationTarget,
} from '../../core/utils/notification-link.util';
import { catchError, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="animate-in p-4" style="max-width: 720px; margin: 0 auto;">
      <a [routerLink]="backHref" class="text-decoration-none small mb-3 d-inline-block">{{
        backLabelKey | translate
      }}</a>
      <div class="erp-card" *ngIf="n">
        <div class="d-flex align-items-start gap-3 mb-3">
          <i class="bi" [ngClass]="icon" style="font-size: 28px;" [style.color]="color"></i>
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">{{ n.title }}</h2>
            <div class="text-muted small">{{ n.createdAt | date: 'medium' }}</div>
            <div class="text-muted small mt-1" *ngIf="n.senderLabel">
              <i class="bi bi-person-badge me-1"></i>{{ 'notificationDetail.sender' | translate }}: {{ n.senderLabel }}
            </div>
          </div>
        </div>
        <p style="font-size: 15px; line-height: 1.6; white-space: pre-wrap;">{{ n.message }}</p>
        <div class="d-flex flex-wrap gap-2 mt-3">
          <a *ngIf="n.link && isExternalHttpLink(n.link)" [href]="n.link" class="btn-primary-erp btn-sm" target="_blank" rel="noopener">{{
            'notificationDetail.openLink' | translate
          }}</a>
          <button
            *ngIf="relatedAnnouncementId"
            type="button"
            class="btn-outline-erp btn-sm"
            (click)="goAnnouncement(relatedAnnouncementId)">
            {{ 'notificationDetail.viewAnnouncement' | translate }}
          </button>
          <button
            *ngIf="relatedInternalPath"
            type="button"
            class="btn-outline-erp btn-sm"
            (click)="goInternal(relatedInternalPath)">
            {{ 'notificationDetail.openRelated' | translate }}
          </button>
        </div>
      </div>
      <div class="erp-card text-muted" *ngIf="!n && !loading">{{ 'notificationDetail.notFound' | translate }}</div>
      <div class="erp-card text-muted" *ngIf="loading">{{ 'notificationDetail.loading' | translate }}</div>
    </div>
  `,
})
export class NotificationDetailComponent implements OnInit {
  n: AppNotification | undefined;
  loading = true;
  icon = 'bi-info-circle-fill';
  color = 'var(--clr-info)';
  relatedAnnouncementId: string | null = null;
  relatedInternalPath: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private auth: AuthService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  get backHref(): string {
    const r = (this.auth.getRole() || '').toLowerCase();
    if (r === 'super_admin') {
      return '/app/dashboard';
    }
    return '/app/inbox';
  }

  get backLabelKey(): string {
    const r = (this.auth.getRole() || '').toLowerCase();
    return r === 'super_admin' ? 'notificationDetail.backDashboard' : 'notificationDetail.backInbox';
  }

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.route.paramMap
      .pipe(
        map(pm => pm.get('id')),
        distinctUntilChanged(),
        switchMap(id => {
          this.relatedAnnouncementId = null;
          this.relatedInternalPath = null;
          if (!id) {
            return of({ phase: 'bad' as const });
          }
          return this.notificationService.getNotificationById(id).pipe(
            map(row => ({ phase: 'ok' as const, row })),
            catchError(() => of({ phase: 'error' as const })),
            startWith({ phase: 'loading' as const })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(state => {
        if (state.phase === 'loading') {
          this.loading = true;
          this.n = undefined;
        } else if (state.phase === 'ok') {
          this.loading = false;
          this.n = state.row;
          this.icon = this.pickIcon(state.row.type);
          this.color = this.pickColor(state.row.type);
          this.applyRelatedActions(state.row);
          this.notificationService.markAsRead(state.row.id);
        } else {
          this.loading = false;
          this.n = undefined;
        }
        this.cdr.markForCheck();
      });
  }

  isExternalHttpLink(link: string): boolean {
    return /^https?:\/\//i.test(link.trim());
  }

  goAnnouncement(id: string): void {
    void this.router.navigate(['/app/announcement', id]);
  }

  goInternal(path: string): void {
    void this.router.navigateByUrl(path);
  }

  private applyRelatedActions(row: AppNotification): void {
    const target = resolveNotificationNavigationTarget(row.link, row.id);
    switch (target.kind) {
      case 'announcement':
        this.relatedAnnouncementId = target.id;
        break;
      case 'internal':
        if (!isNonActionableInternalNotificationPath(target.path)) {
          this.relatedInternalPath = target.path;
        }
        break;
      default:
        break;
    }
  }

  private pickIcon(type: string): string {
    const m: Record<string, string> = {
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
    };
    return m[type] || 'bi-info-circle-fill';
  }

  private pickColor(type: string): string {
    const m: Record<string, string> = {
      info: 'var(--clr-info)',
      warning: 'var(--clr-warning)',
      success: 'var(--clr-success)',
      error: 'var(--clr-danger)',
    };
    return m[type] || 'var(--clr-info)';
  }
}
