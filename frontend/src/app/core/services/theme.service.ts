import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'erp_theme';
  private readonly themeSubject = new BehaviorSubject<AppTheme>('light');
  readonly theme$ = this.themeSubject.asObservable();

  constructor() {
    const saved = (localStorage.getItem(this.storageKey) as AppTheme | null) ?? 'light';
    this.setTheme(saved);
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
}
