package com.school.erp.events.domain;

import java.time.Instant;
import java.util.Map;

/**
 * Unified tenant-safe domain event contract for cross-module analytics, webhook fanout, and audit trails.
 * <p>
 * academicYearId is nullable for domains that are not strictly academic-year partitioned.
 * </p>
 */
public record TenantDomainEvent(
        String tenantId,
        Long academicYearId,
        String entityType,
        String entityId,
        String eventType,
        Instant occurredAt,
        String actor,
        Map<String, Object> attributes
) {
}
