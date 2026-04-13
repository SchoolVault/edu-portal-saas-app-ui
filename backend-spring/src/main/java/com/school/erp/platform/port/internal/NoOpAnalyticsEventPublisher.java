package com.school.erp.platform.port.internal;

import com.school.erp.platform.port.AnalyticsEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * Safe default until a real analytics backend is configured.
 */
public class NoOpAnalyticsEventPublisher implements AnalyticsEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(NoOpAnalyticsEventPublisher.class);

    @Override
    public void publish(String eventType, Map<String, Object> attributes) {
        if (log.isTraceEnabled()) {
            log.trace("analytics noop type={} attrs={}", eventType, attributes);
        }
    }
}
