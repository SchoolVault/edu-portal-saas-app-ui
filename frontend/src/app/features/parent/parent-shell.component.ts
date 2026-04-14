import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Lazy parent area shell. Default child route redirects to {@code children} for deep links;
 * post-login landing uses {@code /app/dashboard} (role-aware).
 */
@Component({
  selector: 'app-parent-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class ParentShellComponent {}
