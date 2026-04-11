/**
 * Mirrors {@code com.school.erp.modules.directory.dto.DirectoryDTOs} (GET /api/v1/directory/search, wrapped in standard ApiResponse).
 * Field names and nullability match Jackson camelCase JSON.
 */
export namespace DirectoryDtos {
  export interface Entry {
    kind: string;
    /** Java Long → JSON number */
    id: number;
    displayName: string;
    subtitle?: string;
    email?: string;
    phone?: string;
    deepLink?: string;
    /** ERP user id for starting a direct chat (parent login, teacher login, etc.). */
    chatUserId?: number;
    chatTargetRole?: string;
    contextType?: string;
    contextId?: string;
  }

  export interface SearchResponse {
    query: string;
    results: Entry[];
  }
}

/** Alias for feature imports (same shape as {@link DirectoryDtos.Entry}). */
export type DirectoryEntry = DirectoryDtos.Entry;
/** Alias for feature imports (same shape as {@link DirectoryDtos.SearchResponse}). */
export type DirectorySearchResponse = DirectoryDtos.SearchResponse;
