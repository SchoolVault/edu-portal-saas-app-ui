/** Default rows per page for ERP list tables (15–18 range). */
export const DEFAULT_ERP_PAGE_SIZE = 12;

export const ERP_PAGE_SIZE_OPTIONS = [12, 16, 24, 48] as const;

/** Header bell: first page size (paired with {@code GET /notifications/unread-count} for badge). */
export const NOTIFICATION_HEADER_PREVIEW_SIZE = 25;
