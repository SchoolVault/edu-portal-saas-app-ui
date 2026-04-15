package com.school.erp.platform.port;

import java.util.Map;

/**
 * Product analytics sink facade (bridges to {@link AnalyticsEventPublisher} by default).
 */
@FunctionalInterface
public interface AnalyticsEventPort {

    void publish(String eventType, Map<String, Object> attributes);
}
