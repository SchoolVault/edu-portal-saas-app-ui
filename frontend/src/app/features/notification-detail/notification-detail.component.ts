import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-in p-4" style="max-width: 720px; margin: 0 auto;">
      <a routerLink="/app/dashboard" class="text-decoration-none small mb-3 d-inline-block">&larr; Back to dashboard</a>
      <div class="erp-card" *ngIf="n">
        <div class="d-flex align-items-start gap-3 mb-3">
          <i class="bi" [ngClass]="icon" style="font-size: 28px;" [style.color]="color"></i>
          <div>
            <h2 style="font-size: 20px; font-weight: 800;">{{ n.title }}</h2>
            <div class="text-muted small">{{ n.createdAt | date:'medium' }}</div>
          </div>
        </div>
        <p style="font-size: 15px; line-height: 1.6; white-space: pre-wrap;">{{ n.message }}</p>
        <a *ngIf="n.link" [href]="n.link" class="btn-primary-erp btn-sm mt-3 d-inline-block" target="_blank" rel="noopener">Open link</a>
      </div>
      <div class="erp-card text-muted" *ngIf="!n">Notification not found or expired.</div>
    </div>
  `
})
export class NotificationDetailComponent implements OnInit {
  n: AppNotification | undefined;
  icon = 'bi-info-circle-fill';
  color = 'var(--clr-info)';

  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const apply = (): void => {
      this.n = this.notificationService.getById(id);
      if (this.n) {
        this.icon = this.pickIcon(this.n.type);
        this.color = this.pickColor(this.n.type);
      }
    };
    if (!environment.useMocks) {
      this.notificationService.refreshFromServer().subscribe(() => apply());
    } else {
      apply();
    }
  }

  private pickIcon(type: string): string {
    const m: Record<string, string> = { info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill', success: 'bi-check-circle-fill', error: 'bi-x-circle-fill' };
    return m[type] || 'bi-info-circle-fill';
  }

  private pickColor(type: string): string {
    const m: Record<string, string> = { info: 'var(--clr-info)', warning: 'var(--clr-warning)', success: 'var(--clr-success)', error: 'var(--clr-danger)' };
    return m[type] || 'var(--clr-info)';
  }
}
