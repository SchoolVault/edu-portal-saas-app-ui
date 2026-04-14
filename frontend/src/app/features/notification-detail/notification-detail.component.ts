import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/models';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="animate-in p-4" style="max-width: 720px; margin: 0 auto;">
      <a routerLink="/app/dashboard" class="text-decoration-none small mb-3 d-inline-block">{{
        'notificationDetail.back' | translate
      }}</a>
      <div class="erp-card" *ngIf="n">
        <div class="d-flex align-items-start gap-3 mb-3">
          <i class="bi" [ngClass]="icon" style="font-size: 28px;" [style.color]="color"></i>
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">{{ n.title }}</h2>
            <div class="text-muted small">{{ n.createdAt | date: 'medium' }}</div>
          </div>
        </div>
        <p style="font-size: 15px; line-height: 1.6; white-space: pre-wrap;">{{ n.message }}</p>
        <a *ngIf="n.link" [href]="n.link" class="btn-primary-erp btn-sm mt-3 d-inline-block" target="_blank" rel="noopener">{{
          'notificationDetail.openLink' | translate
        }}</a>
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

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.notificationService.getNotificationById(id).subscribe({
      next: n => {
        this.n = n;
        this.icon = this.pickIcon(n.type);
        this.color = this.pickColor(n.type);
        this.loading = false;
      },
      error: () => {
        this.n = undefined;
        this.loading = false;
      },
    });
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
