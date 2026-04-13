package com.school.erp.platform.port.internal;

import com.school.erp.platform.port.SearchIndexService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class NoOpSearchIndexService implements SearchIndexService {

    private static final Logger log = LoggerFactory.getLogger(NoOpSearchIndexService.class);

    @Override
    public void upsertDocument(String indexName, String documentId, Map<String, Object> fields) {
        if (log.isTraceEnabled()) {
            log.trace("search index noop upsert index={} id={}", indexName, documentId);
        }
    }

    @Override
    public void deleteDocument(String indexName, String documentId) {
        if (log.isTraceEnabled()) {
            log.trace("search index noop delete index={} id={}", indexName, documentId);
        }
    }
}
