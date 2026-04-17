import { Injectable } from '@angular/core';

/**
 * Persists the parent’s last focused child across dashboard → portal navigation.
 * Mirrors future {@code PUT /parent/ui-context} — replace sessionStorage with API when available.
 */
@Injectable({ providedIn: 'root' })
export class ParentSelectionService {
  private static readonly STORAGE_KEY = 'erp.parentPortal.preferredChildId';

  rememberSelectedChild(studentId: number | null): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    if (studentId == null || !Number.isFinite(studentId)) {
      sessionStorage.removeItem(ParentSelectionService.STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(ParentSelectionService.STORAGE_KEY, String(studentId));
  }

  readPreferredChildId(): number | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const raw = sessionStorage.getItem(ParentSelectionService.STORAGE_KEY);
    if (!raw || !/^\d+$/.test(raw)) {
      return null;
    }
    return Number(raw);
  }
}
