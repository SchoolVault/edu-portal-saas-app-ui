/**
 * Role rules for inbox audience **filters** (must stay aligned with
 * {@code com.school.erp.modules.communication.policy.InboxAudienceTokenPolicy} on the server).
 *
 * Announcement rows are already scoped per role via {@code CommunicationService#getAnnouncements};
 * this layer only controls which filter facets a user may apply and strips disallowed tokens from requests.
 */
const TOKEN_ALERT = 'ALERT';

export type InboxAudiencePresetOption = { value: string; labelKey: string };

const ALL_PRESETS: readonly InboxAudiencePresetOption[] = [
  { value: '', labelKey: 'inbox.filters.audAny' },
  { value: 'ALL', labelKey: 'inbox.filters.audALL' },
  { value: 'TEACHERS', labelKey: 'inbox.filters.audTEACHERS' },
  { value: 'PARENTS', labelKey: 'inbox.filters.audPARENTS' },
  { value: 'CLASS', labelKey: 'inbox.filters.audCLASS' },
  { value: 'SECTION', labelKey: 'inbox.filters.audSECTION' },
  { value: 'ALERT', labelKey: 'inbox.filters.audALERT' },
  { value: 'ALL,ALERT', labelKey: 'inbox.filters.audAllAndAlerts' },
] as const;

/** Uppercase announcement-audience tokens a role may use in filters (not including ALERT). */
export function allowedInboxAudienceTokensExcludingAlert(normalizedRoleKey: string): ReadonlySet<string> {
  const r = (normalizedRoleKey || '').trim().toLowerCase().replace(/^role_/, '');
  if (r === 'parent' || r === 'student') {
    return new Set(['ALL', 'CLASS', 'SECTION']);
  }
  if (r === 'admin' || r === 'super_admin' || r === 'teacher' || r === 'library_staff') {
    return new Set(['ALL', 'TEACHERS', 'PARENTS', 'CLASS', 'SECTION']);
  }
  return new Set(['ALL', 'CLASS', 'SECTION']);
}

/** Dropdown rows for the inbox audience preset (values are CSV for multi-token presets). */
export function inboxAudiencePresetOptionsForRole(normalizedRoleKey: string): InboxAudiencePresetOption[] {
  const ann = allowedInboxAudienceTokensExcludingAlert(normalizedRoleKey);
  return ALL_PRESETS.filter(o => {
    if (o.value === '') {
      return true;
    }
    if (o.value.includes(',')) {
      return o.value.split(',').every(p => {
        const u = p.trim().toUpperCase();
        return u === TOKEN_ALERT || ann.has(u);
      });
    }
    const u = o.value.trim().toUpperCase();
    return u === TOKEN_ALERT || ann.has(u);
  });
}

/** Allowed preset value strings for the current role (for clearing invalid UI state). */
export function allowedInboxAudiencePresetValues(normalizedRoleKey: string): ReadonlySet<string> {
  return new Set(inboxAudiencePresetOptionsForRole(normalizedRoleKey).map(o => o.value));
}

/**
 * Drops audience tokens the signed-in role must not apply (tamper-safe client + mock path).
 * {@link TOKEN_ALERT} is kept only when allowed by the preset rules (always allowed when paired with valid ann tokens or alone).
 */
export function sanitizeInboxAudienceTokens(normalizedRoleKey: string, tokens: readonly string[]): string[] {
  const annAllowed = allowedInboxAudienceTokensExcludingAlert(normalizedRoleKey);
  const up = tokens.map(t => String(t || '').trim().toUpperCase()).filter(Boolean);
  const out: string[] = [];
  for (const t of up) {
    if (t === TOKEN_ALERT || annAllowed.has(t)) {
      out.push(t);
    }
  }
  return [...new Set(out)];
}
