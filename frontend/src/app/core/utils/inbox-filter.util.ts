import { InboxFilterState } from '../models/inbox-filter.model';
import { InboxUnifiedItem } from '../models/models';

const TOKEN_ALERT = 'ALERT';

/** Mirrors server {@link com.school.erp.modules.communication.service.InboxTimelineService} filter semantics. */
export function applyInboxFilters(rows: InboxUnifiedItem[], filters: InboxFilterState): InboxUnifiedItem[] {
  const fk = filters.feedKind;
  const tokens = [...filters.audienceTokens].map(t => t.toUpperCase());
  const ym = parseYearMonth(filters.yearMonth);

  return rows.filter(row => {
    if (fk === 'ANNOUNCEMENT' && row.kind !== 'announcement') {
      return false;
    }
    if (fk === 'NOTIFICATION' && row.kind !== 'notification') {
      return false;
    }
    if (!passesAudience(row, tokens)) {
      return false;
    }
    if (ym && !inYearMonth(row.createdAt, ym)) {
      return false;
    }
    return true;
  });
}

function parseYearMonth(s: string): { y: number; m: number } | null {
  const t = (s || '').trim();
  if (!/^\d{4}-\d{2}$/.test(t)) {
    return null;
  }
  const [y, m] = t.split('-').map(Number);
  if (!y || m < 1 || m > 12) {
    return null;
  }
  return { y, m };
}

function inYearMonth(iso: string, ym: { y: number; m: number }): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return false;
  }
  return d.getFullYear() === ym.y && d.getMonth() + 1 === ym.m;
}

function passesAudience(row: InboxUnifiedItem, tokens: string[]): boolean {
  if (!tokens.length) {
    return true;
  }
  if (row.kind === 'notification') {
    return tokens.includes(TOKEN_ALERT);
  }
  if (tokens.length === 1 && tokens[0] === TOKEN_ALERT) {
    return false;
  }
  const annTok = tokens.filter(t => t !== TOKEN_ALERT);
  if (!annTok.length) {
    return false;
  }
  const key = (row.audienceKey ?? '').toUpperCase();
  if (annTok.includes(key)) {
    return true;
  }
  return (key === 'CLASS' && annTok.includes('CLASS')) || (key === 'SECTION' && annTok.includes('SECTION'));
}
