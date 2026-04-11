import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProfilePhotoPickEvent {
  dataUrl: string;
  fileName: string;
}

/**
 * Enterprise-style avatar control: hidden file input + camera overlay (no misleading native "No file chosen").
 */
@Component({
  selector: 'app-profile-photo-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="ppp"
      [class.ppp--disabled]="disabled"
      [class.ppp--comfortable]="size === 'comfortable'"
      [class.ppp--hero]="size === 'hero'"
      [class.ppp--stacked]="layout === 'stacked'"
      [class.ppp--minimal-status]="statusMode === 'minimal'"
      [class.ppp--no-status]="statusMode === 'none'"
    >
      <button
        type="button"
        class="ppp__frame"
        [disabled]="disabled"
        (click)="openPicker($event)"
        [attr.aria-label]="frameAriaLabel"
      >
        <img *ngIf="displayUrl" [src]="displayUrl" alt="" class="ppp__img" />
        <div *ngIf="!displayUrl" class="ppp__initials" aria-hidden="true">{{ initials || '?' }}</div>
        <div class="ppp__overlay" *ngIf="!disabled" aria-hidden="true">
          <i class="bi bi-camera-fill ppp__cam"></i>
        </div>
      </button>
      <div class="ppp__side" *ngIf="!disabled">
        <div class="ppp__actions">
          <button type="button" class="btn-outline-erp btn-sm ppp__btn" (click)="openPicker($event)">
            <i class="bi bi-cloud-arrow-up"></i> {{ uploadLabel }}
          </button>
          <button
            type="button"
            class="btn-outline-erp btn-sm ppp__btn"
            *ngIf="showRemove && (displayUrl || pendingFileName)"
            (click)="onRemove()"
          >
            <i class="bi bi-trash3"></i> Remove
          </button>
        </div>
        <p class="ppp__status" *ngIf="statusMode !== 'none'">{{ statusText }}</p>
      </div>
      <input
        #fileInput
        type="file"
        class="visually-hidden"
        accept="image/*"
        tabindex="-1"
        (change)="onFileSelected($event)"
      />
    </div>
  `,
  styles: [
    `
      .ppp {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 20px;
      }
      .ppp--disabled {
        opacity: 0.85;
      }
      .ppp__frame {
        position: relative;
        width: 96px;
        height: 96px;
        padding: 0;
        border: 2px solid var(--clr-border, #e2e8f0);
        border-radius: 50%;
        background: var(--clr-surface-muted, #f8fafc);
        cursor: pointer;
        overflow: hidden;
        flex-shrink: 0;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .ppp__frame:hover:not(:disabled) {
        border-color: var(--clr-primary, #1b3a30);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary, #1b3a30) 18%, transparent);
      }
      .ppp__frame:focus-visible {
        outline: 2px solid var(--clr-accent, #c05c3d);
        outline-offset: 2px;
      }
      .ppp__frame:disabled {
        cursor: not-allowed;
      }
      .ppp__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .ppp__initials {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 28px;
        color: var(--clr-text-secondary, #64748b);
      }
      .ppp__overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, transparent 35%, rgba(15, 23, 42, 0.72) 100%);
        opacity: 0;
        transition: opacity 0.15s ease;
        pointer-events: none;
      }
      .ppp__frame:hover:not(:disabled) .ppp__overlay {
        opacity: 1;
      }
      .ppp__cam {
        color: #fff;
        font-size: 22px;
        margin-top: 18px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
      }
      .ppp__side {
        min-width: 200px;
        flex: 1;
        max-width: 360px;
      }
      .ppp__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      .ppp__btn i {
        margin-right: 4px;
      }
      .ppp__status {
        font-size: 12px;
        color: var(--clr-text-muted, #64748b);
        margin: 0;
        line-height: 1.45;
      }
      .ppp--comfortable .ppp__frame {
        width: 112px;
        height: 112px;
      }
      .ppp--comfortable .ppp__initials {
        font-size: 32px;
      }
      .ppp--comfortable .ppp__cam {
        font-size: 26px;
        margin-top: 22px;
      }
      .ppp--hero .ppp__frame {
        width: 128px;
        height: 128px;
      }
      .ppp--hero .ppp__initials {
        font-size: 36px;
      }
      .ppp--hero .ppp__cam {
        font-size: 28px;
        margin-top: 26px;
      }
      .ppp--minimal-status .ppp__status {
        font-size: 11px;
      }
      .ppp--no-status .ppp__actions {
        margin-bottom: 0;
      }
      /** Avatar above actions — narrows horizontal footprint next to identity block (settings hero). */
      .ppp--stacked {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .ppp--stacked .ppp__side {
        min-width: 0;
        max-width: none;
        flex: none;
        width: 100%;
      }
      .ppp--stacked .ppp__actions {
        margin-bottom: 0;
      }
    `,
  ],
})
export class ProfilePhotoPickerComponent implements OnChanges {
  @Input() previewUrl: string | null = null;
  @Input() initials = '';
  @Input() disabled = false;
  @Input() showRemove = true;
  @Input() uploadLabel = 'Upload photo';
  @Input() frameAriaLabel = 'Choose profile photo';
  /** default: 96px; comfortable: 112px; hero: 128px (single focal avatar on profile screens). */
  @Input() size: 'default' | 'comfortable' | 'hero' = 'default';
  /** default / minimal: show helper under actions; none: hide (parent supplies copy). */
  @Input() statusMode: 'default' | 'minimal' | 'none' = 'default';
  /** inline: frame and actions side-by-side (default). stacked: actions under frame (dense profile rows). */
  @Input() layout: 'inline' | 'stacked' = 'inline';

  @Output() photoPicked = new EventEmitter<ProfilePhotoPickEvent>();
  @Output() photoRemoved = new EventEmitter<void>();

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  pendingFileName: string | null = null;

  get displayUrl(): string | null {
    return this.previewUrl;
  }

  get statusText(): string {
    if (this.statusMode === 'minimal') {
      if (this.disabled) {
        return this.previewUrl ? 'Photo on file.' : 'No photo.';
      }
      if (this.pendingFileName) {
        return 'Selected: ' + this.pendingFileName;
      }
      if (this.previewUrl) {
        return 'Saved on this device.';
      }
      return 'PNG, JPG, or WebP — click avatar or Upload.';
    }
    if (this.disabled) {
      return this.previewUrl ? 'Photo on file.' : 'No photo.';
    }
    if (this.pendingFileName) {
      return 'New file: ' + this.pendingFileName + ' — save or confirm where your app persists it.';
    }
    if (this.previewUrl) {
      return 'Photo stored for this browser session (demo). Server media sync will use the same fields when enabled.';
    }
    return 'Click the avatar or Upload to choose an image. Supported: common image types.';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['previewUrl'] && !changes['previewUrl'].firstChange) {
      this.pendingFileName = null;
      this.resetInput();
    }
  }

  openPicker(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.disabled) return;
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.resetInput();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result : null;
      if (data) {
        this.pendingFileName = file.name;
        this.photoPicked.emit({ dataUrl: data, fileName: file.name });
      }
      this.resetInput();
    };
    reader.readAsDataURL(file);
  }

  onRemove(): void {
    this.pendingFileName = null;
    this.photoRemoved.emit();
    this.resetInput();
  }

  private resetInput(): void {
    const el = this.fileInputRef?.nativeElement;
    if (el) el.value = '';
  }
}
