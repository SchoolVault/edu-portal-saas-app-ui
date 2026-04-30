package com.school.erp.modules.timetable.policy;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.timetable.entity.TimetableEntry;

import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Detects hard conflicts when placing a recurring timetable slot — the same rules enforced by DB unique keys
 * ({@code active_class_slot_key}, {@code active_teacher_slot_key}) but evaluated in the service layer first so the API
 * can return structured 409 responses and optional replace flows.
 */
public final class TimetableSlotConflictResolver {

    public enum Kind {
        /** Another row already owns this class (+section scope) for this weekday period. */
        CLASS_PERIOD_OCCUPIED,
        /** Same teacher is already scheduled in a different class for this weekday period. */
        TEACHER_DOUBLE_BOOKED,
        /** Same room is already used by another class for this weekday period. */
        ROOM_DOUBLE_BOOKED
    }

    public record Conflict(Kind kind, TimetableEntry blockingEntry) {
    }

    private TimetableSlotConflictResolver() {
    }

    /**
     * Class-level collision takes precedence in messaging (typical ERP: "this period is already filled"),
     * then teacher-wide double booking when the class cell is free.
     */
    public static Optional<Conflict> resolve(
            List<TimetableEntry> sameClassSectionRows,
            List<TimetableEntry> teacherRowsOrEmpty,
            List<TimetableEntry> roomRowsOrEmpty,
            Enums.DayOfWeek day,
            int period,
            Long teacherIdOrNull,
            String roomOrNull,
            LocalTime candidateStartOrNull,
            LocalTime candidateEndOrNull,
            Long excludeEntryId) {

        Optional<TimetableEntry> classHit = findClassOccupant(sameClassSectionRows, day, period, excludeEntryId);
        if (classHit.isPresent()) {
            return Optional.of(new Conflict(Kind.CLASS_PERIOD_OCCUPIED, classHit.get()));
        }
        if (teacherIdOrNull != null) {
            Optional<TimetableEntry> teacherHit = findTeacherOccupant(teacherRowsOrEmpty, day, period, excludeEntryId);
            if (teacherHit.isPresent()) {
                return Optional.of(new Conflict(Kind.TEACHER_DOUBLE_BOOKED, teacherHit.get()));
            }
        }
        if (roomOrNull != null && !roomOrNull.isBlank()) {
            Optional<TimetableEntry> roomHit = findRoomOccupant(roomRowsOrEmpty, day, period, excludeEntryId);
            if (roomHit.isPresent()) {
                return Optional.of(new Conflict(Kind.ROOM_DOUBLE_BOOKED, roomHit.get()));
            }
        }
        if (candidateStartOrNull != null && candidateEndOrNull != null) {
            Optional<TimetableEntry> classTimeHit =
                    findClassTimeOverlap(sameClassSectionRows, day, candidateStartOrNull, candidateEndOrNull, excludeEntryId);
            if (classTimeHit.isPresent()) {
                return Optional.of(new Conflict(Kind.CLASS_PERIOD_OCCUPIED, classTimeHit.get()));
            }
            if (teacherIdOrNull != null) {
                Optional<TimetableEntry> teacherTimeHit =
                        findTeacherTimeOverlap(teacherRowsOrEmpty, day, candidateStartOrNull, candidateEndOrNull, excludeEntryId);
                if (teacherTimeHit.isPresent()) {
                    return Optional.of(new Conflict(Kind.TEACHER_DOUBLE_BOOKED, teacherTimeHit.get()));
                }
            }
            if (roomOrNull != null && !roomOrNull.isBlank()) {
                Optional<TimetableEntry> roomTimeHit =
                        findRoomTimeOverlap(roomRowsOrEmpty, day, candidateStartOrNull, candidateEndOrNull, excludeEntryId);
                if (roomTimeHit.isPresent()) {
                    return Optional.of(new Conflict(Kind.ROOM_DOUBLE_BOOKED, roomTimeHit.get()));
                }
            }
        }
        return Optional.empty();
    }

    private static Optional<TimetableEntry> findClassOccupant(
            List<TimetableEntry> rows, Enums.DayOfWeek day, int period, Long excludeEntryId) {
        return rows.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .filter(e -> e.getDay() == day && Objects.equals(e.getPeriod(), period))
                .filter(e -> excludeEntryId == null || !Objects.equals(e.getId(), excludeEntryId))
                .findFirst();
    }

    private static Optional<TimetableEntry> findTeacherOccupant(
            List<TimetableEntry> teacherRows, Enums.DayOfWeek day, int period, Long excludeEntryId) {
        return teacherRows.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .filter(e -> e.getDay() == day && Objects.equals(e.getPeriod(), period))
                .filter(e -> excludeEntryId == null || !Objects.equals(e.getId(), excludeEntryId))
                .findFirst();
    }

    private static Optional<TimetableEntry> findRoomOccupant(
            List<TimetableEntry> roomRows, Enums.DayOfWeek day, int period, Long excludeEntryId) {
        return roomRows.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .filter(e -> e.getDay() == day && Objects.equals(e.getPeriod(), period))
                .filter(e -> excludeEntryId == null || !Objects.equals(e.getId(), excludeEntryId))
                .findFirst();
    }

    private static Optional<TimetableEntry> findClassTimeOverlap(
            List<TimetableEntry> rows, Enums.DayOfWeek day, LocalTime start, LocalTime end, Long excludeEntryId) {
        return rows.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .filter(e -> e.getDay() == day)
                .filter(e -> excludeEntryId == null || !Objects.equals(e.getId(), excludeEntryId))
                .filter(e -> overlaps(start, end, e.getStartTime(), e.getEndTime()))
                .findFirst();
    }

    private static Optional<TimetableEntry> findTeacherTimeOverlap(
            List<TimetableEntry> teacherRows, Enums.DayOfWeek day, LocalTime start, LocalTime end, Long excludeEntryId) {
        return teacherRows.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .filter(e -> e.getDay() == day)
                .filter(e -> excludeEntryId == null || !Objects.equals(e.getId(), excludeEntryId))
                .filter(e -> overlaps(start, end, e.getStartTime(), e.getEndTime()))
                .findFirst();
    }

    private static Optional<TimetableEntry> findRoomTimeOverlap(
            List<TimetableEntry> roomRows, Enums.DayOfWeek day, LocalTime start, LocalTime end, Long excludeEntryId) {
        return roomRows.stream()
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .filter(e -> e.getDay() == day)
                .filter(e -> excludeEntryId == null || !Objects.equals(e.getId(), excludeEntryId))
                .filter(e -> overlaps(start, end, e.getStartTime(), e.getEndTime()))
                .findFirst();
    }

    private static boolean overlaps(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        if (startB == null || endB == null) {
            return false;
        }
        return startA.isBefore(endB) && startB.isBefore(endA);
    }
}
