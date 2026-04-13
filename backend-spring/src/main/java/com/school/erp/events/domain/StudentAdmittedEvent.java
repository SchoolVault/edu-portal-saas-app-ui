package com.school.erp.events.domain;

import java.time.Instant;

/**
 * New student row created with an initial class (and optional section) assignment.
 */
public record StudentAdmittedEvent(
        String tenantId,
        Long studentId,
        Long classId,
        Long sectionId,
        String admissionNumber,
        Instant occurredAt
) {
}
