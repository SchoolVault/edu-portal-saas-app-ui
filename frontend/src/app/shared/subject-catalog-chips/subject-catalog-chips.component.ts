import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectCatalogItem } from '../../core/models/models';

/**
 * Toggleable subject chips backed by canonical subject names (API / catalog `name` field).
 * Emits a new immutable selection array on each toggle — safe with OnPush parents and forms.
 */
@Component({
  selector: 'app-subject-catalog-chips',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="subj-chips" role="group">
      <button
        type="button"
        *ngFor="let s of items; trackBy: trackByName"
        class="subj-chips__btn"
        [class.subj-chips__btn--on]="isSelected(s.name)"
        [attr.aria-pressed]="isSelected(s.name)"
        (click)="toggle(s.name, $event)"
      >
        <span class="subj-chips__check" aria-hidden="true">
          <i
            class="bi"
            [ngClass]="isSelected(s.name) ? 'bi-check-circle-fill' : 'bi-circle'"
          ></i>
        </span>
        <span *ngIf="s.code" class="subj-chips__code">{{ s.code }}</span>
        <span class="subj-chips__name">{{ s.name }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .subj-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .subj-chips__btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        padding: 8px 12px 8px 10px;
        min-height: 40px;
        border-radius: var(--radius-md);
        border: 2px solid var(--clr-border);
        background: var(--clr-surface);
        color: var(--clr-text);
        font: inherit;
        font-size: 13px;
        line-height: 1.35;
        text-align: left;
        cursor: pointer;
        transition:
          border-color 0.15s ease,
          background 0.15s ease,
          box-shadow 0.15s ease,
          font-weight 0.15s ease;
        -webkit-appearance: none;
        appearance: none;
      }
      .subj-chips__btn:hover {
        border-color: color-mix(in srgb, var(--clr-primary) 38%, var(--clr-border));
        box-shadow: 0 2px 8px rgba(27, 58, 48, 0.07);
      }
      .subj-chips__btn:focus-visible {
        outline: none;
        border-color: var(--clr-accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-accent) 28%, transparent);
      }
      .subj-chips__btn--on {
        border-color: var(--clr-primary);
        background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-primary) 22%, transparent);
        font-weight: 600;
      }
      .subj-chips__btn--on .subj-chips__code {
        color: var(--clr-primary);
        background: color-mix(in srgb, var(--clr-primary) 14%, var(--clr-surface));
      }
      .subj-chips__check {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        font-size: 1.05rem;
        line-height: 1;
        color: var(--clr-text-muted);
      }
      .subj-chips__btn--on .subj-chips__check {
        color: var(--clr-primary);
      }
      .subj-chips__code {
        font-size: 11px;
        font-weight: 700;
        color: var(--clr-text-muted);
        padding: 2px 6px;
        border-radius: 4px;
        background: color-mix(in srgb, var(--clr-text-muted) 12%, transparent);
        flex-shrink: 0;
      }
    `,
  ],
})
export class SubjectCatalogChipsComponent {
  @Input() items: SubjectCatalogItem[] = [];
  /** Canonical subject names currently selected (must match catalog `name`). */
  @Input() selectedNames: readonly string[] = [];
  @Output() readonly selectedChange = new EventEmitter<string[]>();

  trackByName(_index: number, item: SubjectCatalogItem): string {
    return item.name;
  }

  isSelected(name: string): boolean {
    return this.selectedNames.includes(name);
  }

  toggle(name: string, ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    const next = new Set(this.selectedNames);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.selectedChange.emit([...next]);
  }
}
