package com.school.erp.events.domain;

import java.time.Instant;

/**
 * Class or section movement for an existing student (transfer / re-sectioning).
 */
public record StudentEnrollmentChangedEvent(
        String tenantId,
        Long studentId,
        Long priorClassId,
        Long newClassId,
        Long priorSectionId,
        Long newSectionId,
        Instant occurredAt
) {
}
