package com.school.erp.platform.port;

import java.util.Map;

/**
 * Outbound port for full-text / faceted search (OpenSearch, Elasticsearch, Typesense, etc.).
 */
public interface SearchIndexService {

    void upsertDocument(String indexName, String documentId, Map<String, Object> fields);

    void deleteDocument(String indexName, String documentId);
}
