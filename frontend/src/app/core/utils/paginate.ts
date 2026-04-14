import type { PageResp } from '../services/api.service';

/** 0-based page index in range for a given total count. */
export function clampPageIndex(pageIndex: number, totalElements: number, pageSize: number): number {
  if (totalElements <= 0) return 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  return Math.min(Math.max(0, pageIndex), totalPages - 1);
}

/** Window of 0-based page indices to show as numbered buttons (ellipsis-free, capped). */
export function pageButtonIndices(currentPage0: number, totalPages: number, maxButtons = 5): number[] {
  if (totalPages <= 0) return [0];
  const cap = Math.min(maxButtons, totalPages);
  let start = Math.max(0, currentPage0 - Math.floor(cap / 2));
  let end = start + cap;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(0, end - cap);
  }
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export function sliceToPage<T>(items: T[], pageIndex0: number, pageSize: number): PageResp<T> {
  const totalElements = items.length;
  if (totalElements === 0) {
    return { content: [], page: 0, size: pageSize, totalElements: 0, totalPages: 0, first: true, last: true };
  }
  const idx = clampPageIndex(pageIndex0, totalElements, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const start = idx * pageSize;
  const content = items.slice(start, start + pageSize);
  return {
    content,
    page: idx,
    size: pageSize,
    totalElements,
    totalPages,
    first: idx === 0,
    last: idx >= totalPages - 1,
  };
}

/** Build Spring-aligned page from a filtered full list (mock or client-side filter before server paging exists). */
export function toPageResponse<T>(items: T[], pageIndex0: number, pageSize: number): PageResp<T> {
  return sliceToPage(items, pageIndex0, pageSize);
}
