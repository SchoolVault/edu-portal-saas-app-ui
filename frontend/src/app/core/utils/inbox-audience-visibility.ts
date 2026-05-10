/**
 * Role rules for inbox audience **filters** (must stay aligned with
 * {@code com.school.erp.modules.communication.policy.InboxAudienceTokenPolicy} on the server).
 *
 * Announcement rows are already scoped per role via {@code CommunicationService#getAnnouncements};
 * this layer only controls which filter facets a user may apply and strips disallowed tokens from requests.
 */
export type InboxAudiencePresetOption = { value: string; labelKey: string };

const BASE_PRESET_ANY: InboxAudiencePresetOption = { value: '', labelKey: 'inbox.filters.audAny' };
const BASE_PRESET_ALL: InboxAudiencePresetOption = { value: 'ALL', labelKey: 'inbox.filters.audALL' };
const BASE_PRESET_TEACHERS: InboxAudiencePresetOption = { value: 'TEACHERS', labelKey: 'inbox.filters.audTEACHERS' };
const BASE_PRESET_PARENTS: InboxAudiencePresetOption = { value: 'PARENTS', labelKey: 'inbox.filters.audPARENTS' };
const BASE_PRESET_CLASS: InboxAudiencePresetOption = { value: 'CLASS', labelKey: 'inbox.filters.audCLASS' };
const BASE_PRESET_SECTION: InboxAudiencePresetOption = { value: 'SECTION', labelKey: 'inbox.filters.audSECTION' };
const ALL_PRESETS: readonly InboxAudiencePresetOption[] = [
  BASE_PRESET_ANY,
  BASE_PRESET_ALL,
  BASE_PRESET_TEACHERS,
  BASE_PRESET_PARENTS,
  BASE_PRESET_CLASS,
  BASE_PRESET_SECTION,
] as const;

/** Uppercase announcement-audience tokens a role may use in filters. */
export function allowedInboxAudienceTokens(normalizedRoleKey: string): ReadonlySet<string> {
  const r = (normalizedRoleKey || '').trim().toLowerCase().replace(/^role_/, '');
  if (r === 'parent' || r === 'student') {
    return new Set(['ALL', 'PARENTS', 'CLASS', 'SECTION']);
  }
  if (r === 'teacher') {
    return new Set(['ALL', 'TEACHERS', 'CLASS', 'SECTION']);
  }
  if (r === 'admin' || r === 'super_admin' || r === 'library_staff' || r === 'school_staff') {
    return new Set(['ALL', 'TEACHERS', 'PARENTS', 'CLASS', 'SECTION']);
  }
  return new Set(['ALL', 'CLASS', 'SECTION']);
}

/** Dropdown rows for the inbox audience preset (values are CSV for multi-token presets). */
export function inboxAudiencePresetOptionsForRole(normalizedRoleKey: string): InboxAudiencePresetOption[] {
  const role = (normalizedRoleKey || '').trim().toLowerCase().replace(/^role_/, '');
  if (role === 'parent' || role === 'student') {
    return [BASE_PRESET_ANY, BASE_PRESET_ALL, BASE_PRESET_PARENTS];
  }
  if (role === 'teacher') {
    return [BASE_PRESET_ANY, BASE_PRESET_ALL, BASE_PRESET_TEACHERS];
  }
  const ann = allowedInboxAudienceTokens(normalizedRoleKey);
  return ALL_PRESETS.filter(o => {
    if (o.value === '') {
      return true;
    }
    if (o.value.includes(',')) {
      return o.value.split(',').every(p => ann.has(p.trim().toUpperCase()));
    }
    const u = o.value.trim().toUpperCase();
    return ann.has(u);
  });
}

/** Allowed preset value strings for the current role (for clearing invalid UI state). */
export function allowedInboxAudiencePresetValues(normalizedRoleKey: string): ReadonlySet<string> {
  return new Set(inboxAudiencePresetOptionsForRole(normalizedRoleKey).map(o => o.value));
}

/**
 * Drops audience tokens the signed-in role must not apply (tamper-safe client + mock path).
 */
export function sanitizeInboxAudienceTokens(normalizedRoleKey: string, tokens: readonly string[]): string[] {
  const annAllowed = allowedInboxAudienceTokens(normalizedRoleKey);
  const up = tokens.map(t => String(t || '').trim().toUpperCase()).filter(Boolean);
  const out: string[] = [];
  for (const t of up) {
    if (annAllowed.has(t)) {
      out.push(t);
    }
  }
  return [...new Set(out)];
}

/**
 * Parent / teacher role-level presets include child/class-targeted rows.
 * - parents => includes PARENTS + CLASS + SECTION
 * - teachers => includes TEACHERS + CLASS + SECTION
 */
export function expandLogicalInboxAudienceTokens(normalizedRoleKey: string, tokens: readonly string[]): string[] {
  const role = (normalizedRoleKey || '').trim().toLowerCase().replace(/^role_/, '');
  const up = tokens.map(t => String(t || '').trim().toUpperCase()).filter(Boolean);
  const out = [...up];
  if ((role === 'parent' || role === 'student') && up.includes('PARENTS')) {
    out.push('CLASS', 'SECTION');
  }
  if (role === 'teacher' && up.includes('TEACHERS')) {
    out.push('CLASS', 'SECTION');
  }
  return [...new Set(out)];
}
