import { Injectable, signal } from '@angular/core';

/**
 * Last API trace id from {@code X-Request-Id} (aligned with backend MDC {@code traceId}).
 * Staff can copy this when contacting support.
 */
@Injectable({ providedIn: 'root' })
export class SupportContextService {
  readonly lastTraceId = signal<string | null>(null);

  recordTraceId(headerValue: string | null): void {
    const v = headerValue?.trim();
    this.lastTraceId.set(v && v.length > 0 ? v : null);
  }

  async copyTraceToClipboard(): Promise<boolean> {
    const id = this.lastTraceId();
    if (!id || typeof navigator === 'undefined' || !navigator.clipboard) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(id);
      return true;
    } catch {
      return false;
    }
  }
}
