/**
 * Resolves in-app routes from persisted notification {@code link} values.
 * Keeps header + inbox navigation consistent and tolerant of quoted / absolute URLs.
 */

export type NotificationNavTarget =
  | { kind: 'announcement'; id: string }
  | { kind: 'internal'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'notification_fallback'; id: string };

const ANNOUNCEMENT_PATH = /\/announcement\/([^/?#]+)/i;

export function stripOuterQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2) {
    const a = t[0];
    const b = t[t.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      return t.slice(1, -1).trim();
    }
  }
  return t;
}

/** When the API stores a full URL to this deployment, route inside the SPA instead of opening a new tab. */
export function sameOriginAppPath(link: string): string | null {
  const t = stripOuterQuotes(link);
  if (!/^https?:\/\//i.test(t)) {
    return null;
  }
  try {
    const u = new URL(t);
    if (typeof window !== 'undefined' && u.origin === window.location.origin) {
      return `${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function extractAnnouncementIdFromLink(link: string): string | null {
  const m = stripOuterQuotes(link).match(ANNOUNCEMENT_PATH);
  if (!m?.[1]) {
    return null;
  }
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/**
 * Header bell + inbox list rows: open the notice editor only when the stored link clearly targets an announcement.
 * Otherwise always open the notification detail route so generic deep links (e.g. {@code /app/dashboard}) do not hijack the UX.
 */
export function notificationListRowNavigation(
  link: string | null | undefined,
  notificationId: string
): { kind: 'announcement'; id: string } | { kind: 'detail'; id: string } {
  const annId = extractAnnouncementIdFromLink(link ?? '');
  if (annId) {
    return { kind: 'announcement', id: annId };
  }
  return { kind: 'detail', id: notificationId };
}

/** Internal paths that should not be promoted as a primary “related” action from the detail screen. */
export function isNonActionableInternalNotificationPath(path: string): boolean {
  const pathname = path.split('?')[0].replace(/\/+$/, '') || '/';
  return pathname === '/app' || pathname === '/app/dashboard';
}

export function resolveNotificationNavigationTarget(
  link: string | null | undefined,
  notificationId: string
): NotificationNavTarget {
  let raw = stripOuterQuotes((link ?? '').trim());
  const internal = sameOriginAppPath(raw);
  if (internal) {
    raw = internal;
  }
  const annId = extractAnnouncementIdFromLink(raw);
  if (annId) {
    return { kind: 'announcement', id: annId };
  }
  if (raw) {
    if (/^https?:\/\//i.test(raw)) {
      return { kind: 'external', url: raw };
    }
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return { kind: 'internal', path };
  }
  return { kind: 'notification_fallback', id: notificationId };
}
