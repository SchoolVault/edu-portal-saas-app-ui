/** Inbox list filters (mirrors {@code GET /communication/inbox/timeline} query params). */
export type InboxFeedKindFilter = 'ALL' | 'ANNOUNCEMENT' | 'NOTIFICATION';

export interface InboxFilterState {
  feedKind: InboxFeedKindFilter;
  /** Uppercase tokens: ALL, TEACHERS, PARENTS, CLASS, SECTION, ALERT. Empty = no audience filter. */
  audienceTokens: readonly string[];
  /** {@code YYYY-MM} (shared ERP month picker), or empty = any month. */
  yearMonth: string;
}

export const DEFAULT_INBOX_FILTER_STATE: InboxFilterState = {
  feedKind: 'ALL',
  audienceTokens: [],
  yearMonth: '',
};
