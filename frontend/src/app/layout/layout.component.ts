import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="app-layout">
      <app-sidebar
        [collapsed]="sidebarCollapsed"
        (toggle)="sidebarCollapsed = !sidebarCollapsed"
        data-testid="app-sidebar">
      </app-sidebar>
      <div class="main-wrapper" [class.collapsed]="sidebarCollapsed">
        <app-header
          [collapsed]="sidebarCollapsed"
          (toggleSidebar)="sidebarCollapsed = !sidebarCollapsed"
          data-testid="app-header">
        </app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class LayoutComponent {
  sidebarCollapsed = false;
}
