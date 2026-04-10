import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

export interface ConsolePalette {
  primary: string;
  accent: string;
  primaryLight?: string;
  accentLight?: string;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Defaults aligned with settings branding seed */
  static readonly DEFAULT_PRIMARY = '#1B3A30';
  static readonly DEFAULT_ACCENT = '#C05C3D';
  static readonly DEFAULT_PRIMARY_LIGHT = '#2A5A47';
  static readonly DEFAULT_ACCENT_LIGHT = '#D4735B';

  /** Preset console palettes (super-admin / personal; does not change per-tenant school branding in Settings). */
  static readonly CONSOLE_PRESETS: Record<string, ConsolePalette & { label: string }> = {
    erp: {
      label: 'ERP classic',
      primary: ThemeService.DEFAULT_PRIMARY,
      accent: ThemeService.DEFAULT_ACCENT,
      primaryLight: ThemeService.DEFAULT_PRIMARY_LIGHT,
      accentLight: ThemeService.DEFAULT_ACCENT_LIGHT,
    },
    lagoon: {
      label: 'Lagoon & amber',
      primary: '#0F766E',
      accent: '#D97706',
      primaryLight: '#14B8A6',
      accentLight: '#F59E0B',
    },
    indigo: {
      label: 'Indigo focus',
      primary: '#4338CA',
      accent: '#DB2777',
      primaryLight: '#6366F1',
      accentLight: '#EC4899',
    },
    slate: {
      label: 'Slate professional',
      primary: '#334155',
      accent: '#0EA5E9',
      primaryLight: '#475569',
      accentLight: '#38BDF8',
    },
  };

  private readonly storageKey = 'erp_theme';
  private readonly themeSubject = new BehaviorSubject<AppTheme>('light');
  readonly theme$ = this.themeSubject.asObservable();

  private readonly brandKey = 'erp_brand_colors';
  private readonly consolePaletteKey = 'erp_console_palette_v1';

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
    } catch {
      /* ignore */
    }
  }

  /** Clears saved school brand overrides and restores default ERP palette. */
  resetBrandingToDefault(): void {
    localStorage.removeItem(this.brandKey);
    document.documentElement.style.setProperty('--clr-primary', ThemeService.DEFAULT_PRIMARY);
    document.documentElement.style.setProperty('--clr-accent', ThemeService.DEFAULT_ACCENT);
    document.documentElement.style.setProperty('--clr-primary-light', ThemeService.DEFAULT_PRIMARY_LIGHT);
    document.documentElement.style.setProperty('--clr-accent-light', ThemeService.DEFAULT_ACCENT_LIGHT);
  }

  /** Super-admin console accent layer (stored separately from per-school branding). */
  applyConsolePalette(p: ConsolePalette, persist = true): void {
    const root = document.documentElement;
    root.style.setProperty('--clr-primary', p.primary);
    root.style.setProperty('--clr-accent', p.accent);
    if (p.primaryLight) {
      root.style.setProperty('--clr-primary-light', p.primaryLight);
    }
    if (p.accentLight) {
      root.style.setProperty('--clr-accent-light', p.accentLight);
    }
    if (persist) {
      localStorage.setItem(this.consolePaletteKey, JSON.stringify(p));
    }
  }

  applyConsolePreset(presetId: string): void {
    const preset = ThemeService.CONSOLE_PRESETS[presetId] ?? ThemeService.CONSOLE_PRESETS.erp;
    const { label: _l, ...palette } = preset;
    this.applyConsolePalette(palette, true);
  }

  /** After login: if super admin saved a console palette, overlay it on top of any generic brand colors. */
  applyStoredConsolePaletteIfSuperAdmin(): void {
    const raw = localStorage.getItem(this.consolePaletteKey);
    if (!raw) return;
    try {
      const p = JSON.parse(raw) as ConsolePalette;
      if (p?.primary && p?.accent) {
        this.applyConsolePalette(p, false);
      }
    } catch {
      /* ignore */
    }
  }

  /** Clears console palette storage and restores default ERP primary/accent (school brand key untouched). */
  resetConsolePaletteToDefaults(): void {
    localStorage.removeItem(this.consolePaletteKey);
    document.documentElement.style.setProperty('--clr-primary', ThemeService.DEFAULT_PRIMARY);
    document.documentElement.style.setProperty('--clr-accent', ThemeService.DEFAULT_ACCENT);
    document.documentElement.style.setProperty('--clr-primary-light', ThemeService.DEFAULT_PRIMARY_LIGHT);
    document.documentElement.style.setProperty('--clr-accent-light', ThemeService.DEFAULT_ACCENT_LIGHT);
  }
}
