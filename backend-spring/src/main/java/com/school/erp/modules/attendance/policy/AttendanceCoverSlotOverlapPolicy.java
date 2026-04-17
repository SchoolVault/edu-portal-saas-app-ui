package com.school.erp.modules.attendance.policy;

import com.school.erp.modules.attendance.entity.AttendanceCoverAssignment;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Pure domain rules for whether two attendance-cover rows compete for the same instructional slice.
 * <p>
 * Semantics align with how schools typically interpret substitutes:
 * <ul>
 *   <li>{@code sectionId == null} on a row means “all sections” for that class on that date — it overlaps any section-specific row.</li>
 *   <li>{@code periodNumber == null} means “whole day / unspecified period” — it overlaps any period-specific row for that class+section slice.</li>
 * </ul>
 * This keeps conflict detection centralized and testable without coupling to persistence.
 */
public final class AttendanceCoverSlotOverlapPolicy {

    private AttendanceCoverSlotOverlapPolicy() {
    }

    /**
     * @param newCoveringTeacherId proposed covering teacher (same teacher re-save is treated as non-conflicting)
     */
    public static Optional<AttendanceCoverAssignment> findBlockingActiveCover(
            List<AttendanceCoverAssignment> sameDayClassRows,
            Long sectionId,
            Integer periodNumber,
            Long newCoveringTeacherId) {
        return sameDayClassRows.stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .filter(c -> !Objects.equals(c.getCoveringTeacherId(), newCoveringTeacherId))
                .filter(c -> sectionsOverlap(c.getSectionId(), sectionId))
                .filter(c -> periodsOverlap(c.getPeriodNumber(), periodNumber))
                .findFirst();
    }

    /**
     * Exact same slot + same covering teacher — idempotent create should return the existing row.
     */
    public static Optional<AttendanceCoverAssignment> findIdenticalActiveCover(
            List<AttendanceCoverAssignment> sameDayClassRows,
            Long sectionId,
            Integer periodNumber,
            Long coveringTeacherId) {
        return sameDayClassRows.stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .filter(c -> Objects.equals(c.getCoveringTeacherId(), coveringTeacherId))
                .filter(c -> nullSafeEquals(c.getSectionId(), sectionId))
                .filter(c -> nullSafeEquals(c.getPeriodNumber(), periodNumber))
                .findFirst();
    }

    private static boolean sectionsOverlap(Long existingSectionId, Long requestedSectionId) {
        if (existingSectionId == null || requestedSectionId == null) {
            return true;
        }
        return Objects.equals(existingSectionId, requestedSectionId);
    }

    private static boolean periodsOverlap(Integer existingPeriod, Integer requestedPeriod) {
        if (existingPeriod == null || requestedPeriod == null) {
            return true;
        }
        return Objects.equals(existingPeriod, requestedPeriod);
    }

    private static boolean nullSafeEquals(Object a, Object b) {
        return Objects.equals(a, b);
    }
}
