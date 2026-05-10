import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmDialogOptions, ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="dialog as d"
      class="confirm-dialog-root"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'confirm-dialog-title'"
      [attr.aria-describedby]="'confirm-dialog-desc'">
      <div class="confirm-dialog-backdrop" (click)="onCancel()"></div>
      <div class="confirm-dialog-panel erp-card animate-in" [class.confirm-dialog-panel--wide]="d.wide">
        <div class="confirm-dialog-icon" [ngClass]="'confirm-dialog-icon--' + (d.variant || 'danger')">
          <i class="bi" [ngClass]="iconClass(d)"></i>
        </div>
        <h2 id="confirm-dialog-title" class="confirm-dialog-title">{{ d.title }}</h2>
        <p id="confirm-dialog-desc" class="confirm-dialog-message">{{ d.message }}</p>
        <ul *ngIf="d.details?.length" class="confirm-dialog-details" [class.confirm-dialog-details--scroll]="d.wide">
          <li *ngFor="let line of d.details">{{ line }}</li>
        </ul>
        <div class="confirm-dialog-actions">
          <button *ngIf="showCancel(d)" type="button" class="btn-outline-erp" (click)="onCancel()">{{ d.cancelLabel }}</button>
          <button
            type="button"
            class="btn-primary-erp"
            [ngClass]="{
              'confirm-dialog-confirm--danger': d.variant === 'danger',
              'confirm-dialog-confirm--warning': d.variant === 'warning'
            }"
            (click)="onConfirm()"
            data-testid="confirm-dialog-confirm">
            {{ d.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-dialog-root {
        position: fixed;
        inset: 0;
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }
      .confirm-dialog-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(4px);
        animation: confirm-fade-in 0.2s ease-out;
      }
      .confirm-dialog-panel {
        position: relative;
        max-width: 440px;
        width: 100%;
        padding: 28px 24px 24px;
        text-align: center;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--clr-border);
        animation: confirm-pop-in 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
      }
      .confirm-dialog-panel--wide {
        max-width: min(720px, calc(100vw - 32px));
        text-align: left;
      }
      .confirm-dialog-panel--wide .confirm-dialog-title,
      .confirm-dialog-panel--wide .confirm-dialog-message {
        text-align: center;
      }
      .confirm-dialog-panel--wide .confirm-dialog-icon {
        margin-left: auto;
        margin-right: auto;
      }
      .confirm-dialog-panel--wide .confirm-dialog-actions {
        justify-content: flex-end;
      }
      .confirm-dialog-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 26px;
      }
      .confirm-dialog-icon--danger {
        background: color-mix(in srgb, var(--clr-danger) 14%, var(--clr-surface));
        color: var(--clr-danger);
      }
      .confirm-dialog-icon--warning {
        background: color-mix(in srgb, var(--clr-warning) 18%, var(--clr-surface));
        color: var(--clr-warning);
      }
      .confirm-dialog-icon--primary {
        background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
        color: var(--clr-primary);
      }
      .confirm-dialog-title {
        font-size: 1.25rem;
        font-weight: 800;
        margin: 0 0 10px;
        color: var(--clr-text);
        letter-spacing: -0.02em;
      }
      .confirm-dialog-message {
        margin: 0 0 12px;
        font-size: 14px;
        line-height: 1.55;
        color: var(--clr-text-secondary);
      }
      .confirm-dialog-details {
        text-align: left;
        margin: 0 0 20px;
        padding: 12px 16px;
        background: var(--clr-surface-muted);
        border-radius: var(--radius-md);
        border: 1px solid var(--clr-border-light);
        font-size: 13px;
        color: var(--clr-text-secondary);
        line-height: 1.5;
      }
      .confirm-dialog-details--scroll {
        max-height: min(340px, 45vh);
        overflow-y: auto;
        padding-right: 10px;
      }
      .confirm-dialog-details li {
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid color-mix(in srgb, var(--clr-border) 55%, transparent);
      }
      .confirm-dialog-details li:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      .confirm-dialog-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin-top: 8px;
      }
      .confirm-dialog-actions .btn-outline-erp {
        min-width: 108px;
      }
      .confirm-dialog-actions .btn-primary-erp {
        min-width: 132px;
      }
      .confirm-dialog-confirm--danger {
        background: var(--clr-danger) !important;
        border-color: var(--clr-danger) !important;
        color: #fff !important;
      }
      .confirm-dialog-confirm--danger:hover {
        filter: brightness(1.05);
      }
      .confirm-dialog-confirm--warning {
        background: var(--clr-warning) !important;
        border-color: var(--clr-warning) !important;
        color: #fff !important;
      }
      @keyframes confirm-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes confirm-pop-in {
        from {
          opacity: 0;
          transform: scale(0.94) translateY(8px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `,
  ],
})
export class ConfirmDialogHostComponent implements OnDestroy {
  dialog: ConfirmDialogOptions | null = null;
  private sub: Subscription;

  constructor(private confirmDialog: ConfirmDialogService) {
    this.sub = this.confirmDialog.openDialog$.subscribe(s => (this.dialog = s));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  iconClass(d: ConfirmDialogOptions): string {
    switch (d.variant) {
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'primary':
        return 'bi-question-circle-fill';
      default:
        return 'bi-shield-exclamation';
    }
  }

  onConfirm(): void {
    this.confirmDialog.respond(true);
  }

  onCancel(): void {
    this.confirmDialog.respond(false);
  }

  showCancel(d: ConfirmDialogOptions): boolean {
    return !!(d.cancelLabel && d.cancelLabel.trim().length > 0);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog) {
      this.onCancel();
    }
  }
}
