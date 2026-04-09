import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Defaults aligned with settings branding seed */
  static readonly DEFAULT_PRIMARY = '#1B3A30';
  static readonly DEFAULT_ACCENT = '#C05C3D';

  private readonly storageKey = 'erp_theme';
  private readonly themeSubject = new BehaviorSubject<AppTheme>('light');
  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    const saved = (localStorage.getItem(this.storageKey) as AppTheme | null) ?? 'light';
    this.setTheme(saved);
    this.loadStoredBranding();
  }

  getTheme(): AppTheme {
    return this.themeSubject.value;
  }

  toggleTheme(): void {
    this.setTheme(this.themeSubject.value === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: AppTheme): void {
    this.themeSubject.next(theme);
    localStorage.setItem(this.storageKey, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  private readonly brandKey = 'erp_brand_colors';

  /** Applies tenant primary/accent to CSS variables (persists in localStorage). */
  applySchoolBranding(primaryHex: string, accentHex: string): void {
    const root = document.documentElement;
    root.style.setProperty('--clr-primary', primaryHex);
    root.style.setProperty('--clr-accent', accentHex);
    localStorage.setItem(this.brandKey, JSON.stringify({ primary: primaryHex, accent: accentHex }));
  }

  loadStoredBranding(): void {
    const raw = localStorage.getItem(this.brandKey);
    if (!raw) return;
    try {
      const { primary, accent } = JSON.parse(raw) as { primary: string; accent: string };
      if (primary) document.documentElement.style.setProperty('--clr-primary', primary);
      if (accent) document.documentElement.style.setProperty('--clr-accent', accent);
    } catch { /* ignore */ }
  }

  /** Clears saved brand overrides and restores default ERP palette. */
  resetBrandingToDefault(): void {
    localStorage.removeItem(this.brandKey);
    document.documentElement.style.setProperty('--clr-primary', ThemeService.DEFAULT_PRIMARY);
    document.documentElement.style.setProperty('--clr-accent', ThemeService.DEFAULT_ACCENT);
  }
}
