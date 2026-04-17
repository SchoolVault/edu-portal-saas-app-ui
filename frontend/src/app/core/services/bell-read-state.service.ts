import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Client-side "opened from bell / detail" state for announcements (no {@code isRead} on preview DTO yet).
 * Mirrors future {@code PUT /communication/announcements/{id}/read} — swap to API when available.
 */
@Injectable({ providedIn: 'root' })
export class BellReadStateService {
  private readonly auth = inject(AuthService);
  private readonly readIds = new Set<string>();
  private readonly tick = new BehaviorSubject<number>(0);
  /** Bump whenever read set changes (header badge + dots). */
  readonly changed$ = this.tick.asObservable();

  constructor() {
    this.hydrateFromStorage();
    this.auth.currentUser$
      .pipe(
        map(u => `${u?.tenantId ?? ''}|${u?.id ?? ''}`),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.hydrateFromStorage();
        this.tick.next(this.tick.value + 1);
      });
  }

  isAnnouncementUnread(id: string | number | undefined | null): boolean {
    const sid = id == null ? '' : String(id);
    if (!sid) {
      return false;
    }
    return !this.readIds.has(sid);
  }

  markAnnouncementRead(id: string | number | undefined | null): void {
    const sid = id == null ? '' : String(id);
    if (!sid || this.readIds.has(sid)) {
      return;
    }
    this.readIds.add(sid);
    this.persist();
    this.tick.next(this.tick.value + 1);
  }

  /** Mark every id in the current preview strip (used by header "mark all read"). */
  markAnnouncementsRead(ids: readonly (string | number)[]): void {
    let added = false;
    for (const id of ids) {
      const sid = id == null ? '' : String(id);
      if (sid && !this.readIds.has(sid)) {
        this.readIds.add(sid);
        added = true;
      }
    }
    if (added) {
      this.persist();
      this.tick.next(this.tick.value + 1);
    }
  }

  private storageKey(): string | null {
    const u = this.auth.getCurrentUser();
    if (!u?.tenantId || u.id == null) {
      return null;
    }
    return `erp.bellAnnRead:${u.tenantId}:${u.id}`;
  }

  private hydrateFromStorage(): void {
    this.readIds.clear();
    const k = this.storageKey();
    if (!k || typeof localStorage === 'undefined') {
      return;
    }
    try {
      const raw = localStorage.getItem(k);
      if (!raw) {
        return;
      }
      const arr = JSON.parse(raw) as unknown;
      if (Array.isArray(arr)) {
        for (const x of arr) {
          if (typeof x === 'string' && x) {
            this.readIds.add(x);
          }
        }
      }
    } catch {
      /* ignore corrupt */
    }
  }

  private persist(): void {
    const k = this.storageKey();
    if (!k || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(k, JSON.stringify([...this.readIds]));
    } catch {
      /* quota */
    }
  }

}
