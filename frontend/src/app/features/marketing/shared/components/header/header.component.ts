import { DOCUMENT, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'sv-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  template: `
    <header class="sv-header" [class.dark]="isDarkMode()" data-testid="site-header">
      <div class="sv-container sv-header__inner">
        <a routerLink="/" class="sv-logo" aria-label="SchoolVault home">
          <span class="sv-logo-mark" aria-hidden="true">SV</span>
          <span class="sv-logo-text-wrap">
            <span class="sv-logo-text">SchoolVault</span>
            <small class="sv-logo-subtext">Smart. Simple. Secure.</small>
          </span>
        </a>
        <button
          type="button"
          class="sv-mobile-toggle"
          (click)="menuOpen.set(!menuOpen())"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Toggle navigation menu"
        >
          <span>{{ menuOpen() ? 'Close' : 'Menu' }}</span>
        </button>
        <nav class="sv-nav" aria-label="Primary">
          <a routerLink="/features" routerLinkActive="active">Modules</a>
          <a routerLink="/videos" routerLinkActive="active">Videos</a>
          <a routerLink="/testimonials" routerLinkActive="active">Customers</a>
          <a routerLink="/request-demo" class="sv-btn sv-btn-primary">Request a Demo</a>
          <a routerLink="/login" class="sv-btn sv-btn-app">Login</a>
          <button type="button" class="sv-btn sv-btn-theme" (click)="toggleTheme()">
            <span class="sv-theme-icon" [class.is-dark]="isDarkMode()">{{ isDarkMode() ? '☀️' : '🌙' }}</span>
            <span>{{ isDarkMode() ? 'Light' : 'Dark' }}</span>
          </button>
        </nav>
      </div>
      <nav class="sv-mobile-nav" *ngIf="menuOpen()" aria-label="Primary mobile">
        <a routerLink="/features" routerLinkActive="active" (click)="closeMenu()">Modules</a>
        <a routerLink="/videos" routerLinkActive="active" (click)="closeMenu()">Videos</a>
        <a routerLink="/testimonials" routerLinkActive="active" (click)="closeMenu()">Customers</a>
        <a routerLink="/request-demo" class="sv-btn sv-btn-primary" (click)="closeMenu()">Request a Demo</a>
        <a routerLink="/login" class="sv-btn sv-btn-app" (click)="closeMenu()">Login</a>
        <button type="button" class="sv-btn sv-btn-theme" (click)="toggleTheme()">
          <span class="sv-theme-icon" [class.is-dark]="isDarkMode()">{{ isDarkMode() ? '☀️' : '🌙' }}</span>
          <span>{{ isDarkMode() ? 'Light' : 'Dark' }}</span>
        </button>
      </nav>
    </header>
  `,
  styles: [`
    :host { display:block; }
    .sv-header { position: sticky; top: 0; z-index: 50; backdrop-filter: saturate(160%) blur(14px); background: color-mix(in srgb, var(--clr-surface) 88%, transparent); border-bottom: 1px solid var(--clr-border); transition: background .2s ease, border-color .2s ease; }
    .sv-header.dark { background: color-mix(in srgb, var(--clr-surface) 92%, transparent); border-bottom-color: var(--clr-border); }
    .sv-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0 clamp(26px, 4vw, 68px); }
    .sv-header__inner { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 0; }
    .sv-mobile-toggle {
      display: none;
      border: 1px solid var(--clr-border);
      border-radius: 999px;
      background: transparent;
      color: var(--clr-text);
      padding: 8px 14px;
      font-weight: 600;
      font-size: 0.85rem;
      line-height: 1;
    }
    .sv-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 700;
      font-size: 1.4rem;
      color: var(--clr-primary);
      text-decoration: none;
      margin-left: clamp(10px, 1.3vw, 18px);
    }
    .sv-logo-mark {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: 'Avenir Next', 'Segoe UI', sans-serif;
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .04em;
      color: #fff;
      background: linear-gradient(145deg, var(--clr-primary) 0%, color-mix(in srgb, var(--clr-primary) 72%, #000) 100%);
      box-shadow: 0 6px 14px color-mix(in srgb, var(--clr-primary) 24%, transparent);
      flex-shrink: 0;
    }
    .sv-logo-text-wrap {
      display: inline-flex;
      flex-direction: column;
      line-height: 1;
      gap: 1px;
    }
    .sv-logo-text {
      letter-spacing: .01em;
    }
    .sv-logo-subtext {
      font-family: 'Manrope', 'Segoe UI', system-ui, sans-serif;
      font-size: .62rem;
      font-weight: 600;
      letter-spacing: .02em;
      color: var(--clr-text-secondary);
    }
    .sv-header.dark .sv-logo { color: var(--clr-text); }
    .sv-nav { display: flex; gap: 16px; align-items: center; margin-left: auto; padding-right: clamp(18px, 2.2vw, 36px); }
    .sv-nav a { color: var(--clr-text); font-weight: 500; text-decoration: none; font-size: .92rem; display: inline-flex; align-items: center; gap: 4px; }
    .sv-caret { font-size: .72rem; opacity: .82; }
    .sv-nav a.active { color: var(--clr-primary); }
    .sv-header.dark .sv-nav a { color: var(--clr-text); }
    .sv-header.dark .sv-nav a.active { color: var(--clr-primary-light); }
    .sv-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 16px; border-radius: 999px; font-weight: 600; font-size: .9rem; text-decoration: none; border: 1px solid transparent; cursor: pointer; background: transparent; }
    .sv-btn-primary { background: var(--clr-accent); color: #fff !important; }
    .sv-btn-app { background: var(--clr-primary); color: #fff !important; }
    .sv-btn-theme { border-color: var(--clr-border); color: var(--clr-primary); }
    .sv-header.dark .sv-btn-theme { border-color: var(--clr-border); color: var(--clr-text-secondary); }
    .sv-theme-icon {
      display: inline-flex;
      width: 18px;
      justify-content: center;
      transform: rotate(0deg) scale(1);
      transition: transform .25s ease;
    }
    .sv-theme-icon.is-dark {
      transform: rotate(180deg) scale(1.05);
    }
    .sv-mobile-nav {
      display: none;
      max-width: 100%;
      margin: 0 auto;
      padding: 0 24px 14px;
      gap: 10px;
      flex-direction: column;
    }
    .sv-mobile-nav a {
      color: var(--clr-text);
      text-decoration: none;
      padding: 8px 0;
      font-weight: 600;
    }
    .sv-mobile-nav .sv-btn {
      width: 100%;
      justify-content: center;
    }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-nav { display:none; }
      .sv-mobile-toggle { display: inline-flex; align-items: center; justify-content: center; }
      .sv-mobile-nav { display: flex; padding: 0 16px 14px; }
    }
  `]
})
export class HeaderComponent {
  private readonly doc = inject(DOCUMENT);
  readonly isDarkMode = signal(false);
  readonly menuOpen = signal(false);

  constructor() {
    const currentThemeAttr = this.doc.documentElement.getAttribute('data-theme');
    const stored = this.doc.defaultView?.localStorage.getItem('sv-marketing-theme');
    const dark = stored ? stored === 'dark' : currentThemeAttr === 'dark';
    this.isDarkMode.set(dark);
    this.applyTheme(dark);
  }

  toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    this.doc.defaultView?.localStorage.setItem('sv-marketing-theme', next ? 'dark' : 'light');
    this.applyTheme(next);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  private applyTheme(dark: boolean): void {
    this.doc.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
