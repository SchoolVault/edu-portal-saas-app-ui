package com.school.erp.platform.port;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

/**
 * Outbound port for product / usage analytics (ClickHouse, Segment, Amplitude, etc.).
 * Default implementation is a no-op; swap the bean for a vendor adapter.
 */
public interface AnalyticsEventPublisher {

    void publish(String eventType, Map<String, Object> attributes);

    default void publish(String eventType) {
        publish(eventType, Collections.emptyMap());
    }

    /**
     * Canonical envelope for future batching or schema evolution.
     */
    record AnalyticsEvent(String eventType, Instant occurredAt, String tenantId, Long userId, Map<String, Object> attributes) {
    }
}
