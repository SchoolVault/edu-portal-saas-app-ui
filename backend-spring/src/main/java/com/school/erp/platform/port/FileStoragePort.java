package com.school.erp.platform.port;

/**
 * S3-compatible object storage abstraction (keys + URLs). Bytes are uploaded by clients or workers using the URL/policy you return.
 */
public interface FileStoragePort {

    /**
     * Stable object key within the bucket (no leading slash).
     */
    String buildObjectKey(String tenantId, String category, String sanitizedFileName);

    /**
     * Public or CDN base URL for the object; dev may point at API download route.
     */
    String buildPublicUrl(String tenantId, String storageKey);
}
