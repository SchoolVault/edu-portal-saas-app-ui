import { TranslateService } from '@ngx-translate/core';
import type {
  ChatCounterpartInsight,
  ChatInboxConversation,
  ChatMessage,
  ChatParticipantSummary,
} from '../models/models';

/** Normalise Spring / JWT / legacy role strings to the keys used in UI i18n. */
export function normalizeErpRoleKey(roleRaw: string | undefined): string {
  let r = (roleRaw || '')
    .trim()
    .toLowerCase()
    .replace(/^role_/, '');
  if (r === 'administrator' || r === 'school_admin' || r === 'schooladmin') {
    return 'admin';
  }
  if (r === 'superadmin' || r === 'super administrator') {
    return 'super_admin';
  }
  if (r === 'librarian' || r === 'library staff') {
    return 'library_staff';
  }
  return r;
}

/**
 * Maps ERP role codes to the same i18n keys as the shell header so chat, directory, and settings stay aligned.
 */
export function translateErpRoleLabel(roleRaw: string | undefined, translate: TranslateService): string {
  const r = normalizeErpRoleKey(roleRaw);
  const key =
    r === 'super_admin'
      ? 'header.role.superAdmin'
      : r === 'library_staff'
        ? 'header.role.libraryStaff'
        : r === 'admin'
          ? 'header.role.admin'
          : r === 'teacher'
            ? 'header.role.teacher'
            : r === 'parent'
              ? 'header.role.parent'
              : r === 'student'
                ? 'header.role.student'
                : '';
  if (key) {
    const t = translate.instant(key);
    if (t !== key) {
      return t;
    }
  }
  const fallback = (roleRaw || '').replace(/_/g, ' ').trim();
  return fallback || translate.instant('header.role.user');
}

/**
 * Primary inbox / thread heading for the non-self party in a direct conversation (name · role or name · job).
 */
export function chatDirectPeerTitle(
  other: ChatParticipantSummary | undefined,
  insight: ChatCounterpartInsight | null,
  translate: TranslateService
): string {
  if (!other) {
    return translate.instant('chat.fallbackParticipant');
  }
  const name = (other.displayName || '').trim() || translate.instant('chat.fallbackParticipant');
  const roleCode = (insight?.roleCode || other.userRole || '').toUpperCase();
  const job = (other.jobTitle || '').trim();
  if (job) {
    return translate.instant('chat.peerTitleNameJob', { name, job });
  }
  if (roleCode === 'PARENT') {
    return name;
  }
  const roleHuman = translateErpRoleLabel(roleCode, translate);
  return translate.instant('chat.peerTitleNameRole', { name, role: roleHuman });
}

/**
 * Incoming bubble: "Name · Role" (job title wins when present).
 * When {@link ChatMessage.senderName} is missing (older API rows / WS race), resolves from conversation participants.
 */
export function chatIncomingBubbleLabel(
  m: ChatMessage,
  conv: ChatInboxConversation | null | undefined,
  translate: TranslateService
): string {
  const fromParticipant = conv?.participants?.find(p => p.userId === m.senderUserId);
  const name =
    (m.senderName || '').trim() ||
    (fromParticipant?.displayName || '').trim() ||
    translate.instant('chat.fallbackParticipant');
  const job =
    (m.senderJobTitle || '').trim() ||
    (fromParticipant?.jobTitle || '').trim();
  if (job) {
    return translate.instant('chat.messageSenderLineJob', { name, job });
  }
  const roleHuman = translateErpRoleLabel(m.senderRole, translate);
  return translate.instant('chat.messageSenderLineRole', { name, role: roleHuman });
}
