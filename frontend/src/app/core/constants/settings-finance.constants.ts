/**
 * Finance under Settings — single surface today (fee settlement / collection mode).
 * Query {@code ?financeHub=} is accepted for backward-compatible deep links but always resolves here.
 */
export type SettingsFinanceHubTab = 'settlement';

export const DEFAULT_FINANCE_HUB_TAB: SettingsFinanceHubTab = 'settlement';

export function normalizeFinanceHubTab(_raw: string | null | undefined): SettingsFinanceHubTab {
  return 'settlement';
}
