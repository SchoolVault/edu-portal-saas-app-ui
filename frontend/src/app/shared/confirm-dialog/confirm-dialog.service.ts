import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  /** Short bullet lines shown under the message (operation context). */
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  /** Wider panel + scrollable detail list (e.g. timetable validation with many rows). */
  wide?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly state = new BehaviorSubject<ConfirmDialogOptions | null>(null);
  private pending: { finish: (ok: boolean) => void } | null = null;

  /** Observable for the host component to render the current dialog (or null). */
  readonly openDialog$ = this.state.asObservable();

  /**
   * Shows the global confirm dialog and emits once with true (confirm) or false (cancel / backdrop / Escape).
   */
  confirm(opts: ConfirmDialogOptions): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      if (this.pending) {
        // Replace stale dialog (e.g. double submit) so the user always sees the latest confirmation.
        this.pending.finish(false);
      }
      this.state.next({
        variant: 'danger',
        confirmLabel: 'Yes, proceed',
        cancelLabel: 'Cancel',
        ...opts,
      });
      this.pending = {
        finish: ok => {
          this.pending = null;
          this.state.next(null);
          subscriber.next(ok);
          subscriber.complete();
        },
      };
    });
  }

  respond(ok: boolean): void {
    this.pending?.finish(ok);
  }
}
