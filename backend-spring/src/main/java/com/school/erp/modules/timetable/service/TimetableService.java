package com.school.erp.modules.timetable.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ApiErrorCode;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.SchedulingConflictException;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.attendance.entity.AttendanceCoverAssignment;
import com.school.erp.modules.attendance.repository.AttendanceCoverAssignmentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.timetable.dto.TeacherScheduleSlot;
import com.school.erp.modules.timetable.dto.TimetableDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.policy.TimetableSlotConflictResolver;
import com.school.erp.modules.timetable.policy.TimetableSlotConflictResolver.Conflict;
import com.school.erp.modules.timetable.repository.TimetableRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.cache.CacheService;
import com.school.erp.cache.CacheService.CacheRegion;
import com.school.erp.config.CacheConfig;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TimetableService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TimetableService.class);
    private static final List<String> DEFAULT_DAYS = List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY");
    private static final List<Integer> DEFAULT_PERIODS = List.of(1, 2, 3, 4, 5, 6, 7, 8);
    private final TimetableRepository repo;
    private final AttendanceCoverAssignmentRepository coverRepo;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final TeacherRepository teacherRepository;
    private final TimetableService self;
    private final ObjectProvider<CacheService> cacheService;

    @Cacheable(cacheNames = CacheConfig.TIMETABLE_GRID, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<TimetableEntry> getByClassAndSection(Long classId, Long sectionId) {
        String t = TenantContext.getTenantId();
        log.debug("Fetching timetable entries classId={} sectionId={}", classId, sectionId);
        List<TimetableEntry> list = repo.findForTenantClassAndOptionalSection(t, classId, sectionId);
        log.debug("Timetable entries count={} classId={} sectionId={}", list.size(), classId, sectionId);
        return list;
    }

    @Cacheable(cacheNames = CacheConfig.TIMETABLE_GRID, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<TimetableEntry> getByTeacher(Long teacherId) {
        String t = TenantContext.getTenantId();
        log.debug("Fetching timetable by teacherId={}", teacherId);
        List<TimetableEntry> list = repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(t, teacherId);
        log.debug("Teacher timetable entry count={} teacherId={}", list.size(), teacherId);
        return list;
    }

    /**
     * Maps a calendar day to {@link Enums.DayOfWeek} (Mon–Sat only). Sunday and any unmapped day are empty —
     * the master timetable does not model weekend instruction days.
     */
    private static Optional<Enums.DayOfWeek> toSchoolDayOfWeek(LocalDate forDate) {
        DayOfWeek j = forDate.getDayOfWeek();
        if (j == DayOfWeek.SUNDAY) {
            return Optional.empty();
        }
        try {
            return Optional.of(Enums.DayOfWeek.valueOf(j.name()));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    /**
     * Teacher schedule: recurring weekly rows plus optional one-day {@code COVER} slots for {@code forDate}.
     * Cover rows override the same weekday/period recurring slot for that calendar day only (response is date-scoped).
     * <p>When {@code forDate} is a non-school calendar day (e.g. Sunday), returns the recurring weekly pattern only
     * — no {@code IllegalArgumentException} (school {@link Enums.DayOfWeek} has no {@code SUNDAY}).</p>
     */
    @Transactional(readOnly = true)
    public List<TeacherScheduleSlot> getTeacherSchedule(Long teacherId, LocalDate forDate) {
        if (forDate == null) {
            return self.getByTeacher(teacherId).stream().map(this::toRecurringSlot).collect(Collectors.toList());
        }
        Optional<Enums.DayOfWeek> schoolDay = toSchoolDayOfWeek(forDate);
        if (schoolDay.isEmpty()) {
            log.debug("Teacher schedule for non-school calendar day {} — recurring pattern only (teacherId={})", forDate, teacherId);
            return self.getByTeacher(teacherId).stream().map(this::toRecurringSlot).collect(Collectors.toList());
        }
        String tenantId = TenantContext.getTenantId();
        Enums.DayOfWeek dow = schoolDay.get();
        List<TeacherScheduleSlot> recurring = self.getByTeacher(teacherId).stream().map(this::toRecurringSlot).collect(Collectors.toList());

        String coveringName = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, tenantId)
                .map(te -> (te.getFirstName() + " " + te.getLastName()).trim())
                .orElse("");

        List<AttendanceCoverAssignment> covers = coverRepo.findByTenantIdAndCoverDateAndCoveringTeacherIdAndStatusAndIsDeletedFalse(
                tenantId, forDate, teacherId, "ACTIVE");

        List<TeacherScheduleSlot> coverSlots = new ArrayList<>();
        for (AttendanceCoverAssignment cover : covers) {
            TimetableEntry template = resolveCoverTemplate(cover, dow, tenantId);
            coverSlots.add(buildCoverSlot(cover, forDate, dow, template, coveringName, teacherId, tenantId));
        }

        Set<String> occupied = coverSlots.stream()
                .map(s -> s.getDay() + "|" + s.getPeriod())
                .collect(Collectors.toSet());

        List<TeacherScheduleSlot> merged = new ArrayList<>(coverSlots);
        for (TeacherScheduleSlot r : recurring) {
            if (!occupied.contains(r.getDay() + "|" + r.getPeriod())) {
                merged.add(r);
            }
        }
        log.info("Teacher schedule merged teacherId={} forDate={} recurring={} covers={} out={}",
                teacherId, forDate, recurring.size(), coverSlots.size(), merged.size());
        return merged;
    }

    private TimetableEntry resolveCoverTemplate(AttendanceCoverAssignment cover, Enums.DayOfWeek dow, String tenantId) {
        if (cover.getTimetableEntryId() != null) {
            Optional<TimetableEntry> linked = repo.findByIdAndTenantIdAndIsDeletedFalse(cover.getTimetableEntryId(), tenantId);
            if (linked.isPresent()) {
                return linked.get();
            }
        }
        List<TimetableEntry> classSlots = repo.findForTenantClassAndOptionalSection(tenantId, cover.getClassId(), cover.getSectionId());
        if (cover.getPeriodNumber() != null) {
            Optional<TimetableEntry> byPeriod = classSlots.stream()
                    .filter(e -> e.getDay() == dow && Objects.equals(e.getPeriod(), cover.getPeriodNumber()))
                    .findFirst();
            if (byPeriod.isPresent()) {
                return byPeriod.get();
            }
        }
        if (cover.getRegularTeacherId() != null) {
            Optional<TimetableEntry> byRegular = classSlots.stream()
                    .filter(e -> e.getDay() == dow && Objects.equals(e.getTeacherId(), cover.getRegularTeacherId()))
                    .findFirst();
            if (byRegular.isPresent()) {
                return byRegular.get();
            }
        }
        return classSlots.stream().filter(e -> e.getDay() == dow).findFirst().orElse(null);
    }

    private TeacherScheduleSlot buildCoverSlot(
            AttendanceCoverAssignment cover,
            LocalDate forDate,
            Enums.DayOfWeek dow,
            TimetableEntry template,
            String coveringTeacherName,
            Long coveringTeacherId,
            String tenantId) {
        TeacherScheduleSlot s = new TeacherScheduleSlot();
        s.setId(-cover.getId());
        s.setScheduleSource("COVER");
        s.setCoverForDate(forDate.toString());
        s.setClassId(cover.getClassId());
        s.setSectionId(cover.getSectionId());
        s.setDay(dow.name());
        s.setTeacherId(coveringTeacherId);
        s.setTeacherName(coveringTeacherName);

        int period = template != null ? template.getPeriod()
                : (cover.getPeriodNumber() != null ? cover.getPeriodNumber() : 1);
        s.setPeriod(period);

        if (template != null && template.getStartTime() != null) {
            s.setStartTime(fmtTime(template.getStartTime()));
            s.setEndTime(fmtTime(template.getEndTime()));
        } else {
            s.setStartTime("09:00");
            s.setEndTime("09:45");
        }

        String classLabel = schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(cover.getClassId(), tenantId)
                .map(SchoolClass::getName)
                .orElse("Class");
        String secSuffix = "";
        if (cover.getSectionId() != null) {
            secSuffix = sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(cover.getSectionId(), tenantId)
                    .map(Section::getName)
                    .map(n -> " · " + n)
                    .orElse("");
        }
        String baseSubject = template != null ? template.getSubjectName() : "Cover session";
        s.setSubjectName(baseSubject + " · Cover (" + classLabel + secSuffix + ")");
        s.setRoom(template != null && template.getRoom() != null ? template.getRoom() : "");
        return s;
    }

    private TeacherScheduleSlot toRecurringSlot(TimetableEntry e) {
        TeacherScheduleSlot s = new TeacherScheduleSlot();
        s.setId(e.getId());
        s.setClassId(e.getClassId());
        s.setSectionId(e.getSectionId());
        s.setDay(e.getDay().name());
        s.setPeriod(e.getPeriod());
        s.setStartTime(fmtTime(e.getStartTime()));
        s.setEndTime(fmtTime(e.getEndTime()));
        s.setSubjectName(e.getSubjectName());
        s.setTeacherId(e.getTeacherId());
        s.setTeacherName(e.getTeacherName());
        s.setRoom(e.getRoom() != null ? e.getRoom() : "");
        s.setScheduleSource("RECURRING");
        s.setCoverForDate(null);
        return s;
    }

    private static String fmtTime(LocalTime t) {
        if (t == null) {
            return "";
        }
        String str = t.toString();
        return str.length() >= 5 ? str.substring(0, 5) : str;
    }

    @Transactional(readOnly = true)
    public TimetableDTOs.TimetableGridResponse getGrid(Long classId, Long sectionId) {
        log.debug("Building timetable grid classId={} sectionId={}", classId, sectionId);
        List<TimetableEntry> entries = self.getByClassAndSection(classId, sectionId);
        List<String> days = entries.stream().map(e -> e.getDay().name()).distinct()
                .sorted(Comparator.comparingInt(d -> DEFAULT_DAYS.indexOf(d) >= 0 ? DEFAULT_DAYS.indexOf(d) : 99))
                .collect(Collectors.toList());
        List<Integer> periods = entries.stream().map(TimetableEntry::getPeriod).distinct().sorted().collect(Collectors.toList());
        if (days.isEmpty()) {
            days = new ArrayList<>(DEFAULT_DAYS);
        }
        if (periods.isEmpty()) {
            periods = new ArrayList<>(DEFAULT_PERIODS);
        }
        Map<String, Map<Integer, TimetableDTOs.SlotDTO>> grid = new LinkedHashMap<>();
        for (String day : days) {
            Map<Integer, TimetableDTOs.SlotDTO> daySlots = new LinkedHashMap<>();
            for (int period : periods) {
                TimetableEntry entry = entries.stream()
                        .filter(e -> e.getDay().name().equals(day) && e.getPeriod() == period)
                        .findFirst().orElse(null);
                if (entry != null) {
                    daySlots.put(period, TimetableDTOs.SlotDTO.builder()
                            .subject(entry.getSubjectName())
                            .teacher(entry.getTeacherName())
                            .room(entry.getRoom())
                            .startTime(entry.getStartTime() != null ? entry.getStartTime().toString() : null)
                            .endTime(entry.getEndTime() != null ? entry.getEndTime().toString() : null)
                            .build());
                }
            }
            grid.put(day, daySlots);
        }
        log.info("Timetable grid built classId={} sectionId={} filledSlots={}", classId, sectionId, entries.size());
        return TimetableDTOs.TimetableGridResponse.builder().classId(classId).sectionId(sectionId).days(days).periods(periods).grid(grid).build();
    }

    /**
     * Creates a recurring timetable slot. When {@code replaceTimetableEntryId} matches the blocking row returned in a
     * prior 409, that row is soft-deleted first (explicit replace — same contract as attendance cover replace).
     */
    @Transactional
    public TimetableEntry createEntry(TimetableEntry entry, Long replaceTimetableEntryId) {
        String t = TenantContext.getTenantId();
        log.info("Creating timetable slot classId={} day={} period={} replaceId={}", entry.getClassId(), entry.getDay(), entry.getPeriod(), replaceTimetableEntryId);
        validateTimetableEntryRules(entry);
        assertNoTimetableConflictOrReplace(t, entry, null, replaceTimetableEntryId);
        entry.setTenantId(t);
        TimetableEntry saved = repo.save(entry);
        log.info("Timetable entry created id={}", saved.getId());
        evictTimetableEntryCaches(saved, null);
        return saved;
    }

    @Transactional
    public List<TimetableEntry> batchCreate(List<TimetableEntry> entries) {
        String t = TenantContext.getTenantId();
        log.info("Batch creating timetable rows count={}", entries.size());
        entries.forEach(e -> e.setTenantId(t));
        for (TimetableEntry e : entries) {
            validateTimetableEntryRules(e);
            assertNoTimetableConflictOrReplace(t, e, null, null);
        }
        List<TimetableEntry> saved = repo.saveAll(entries);
        log.info("Batch timetable save completed count={}", saved.size());
        for (TimetableEntry e : saved) {
            evictTimetableEntryCaches(e, null);
        }
        return saved;
    }

    /**
     * Keeps denormalized {@link TimetableEntry#getTeacherName()} aligned when a teacher's legal/display name changes,
     * so grids and exports stay consistent without requiring manual slot edits.
     */
    @Transactional
    public void refreshDenormalizedTeacherNames(Long teacherId) {
        if (teacherId == null) {
            return;
        }
        String t = TenantContext.getTenantId();
        Optional<Teacher> opt = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherId, t);
        if (opt.isEmpty()) {
            return;
        }
        String full = (opt.get().getFirstName() + " " + opt.get().getLastName()).trim();
        if (full.isBlank()) {
            return;
        }
        List<TimetableEntry> rows = repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(t, teacherId);
        int updated = 0;
        for (TimetableEntry e : rows) {
            if (Objects.equals(full, e.getTeacherName())) {
                continue;
            }
            TimetableEntry before = snapshotEntry(e);
            e.setTeacherName(full);
            repo.save(e);
            evictTimetableEntryCaches(e, before);
            updated++;
        }
        if (updated > 0) {
            log.info("Refreshed timetable teacherName rows={} teacherId={} tenantId={}", updated, teacherId, t);
        }
    }

    @Transactional
    public void deleteEntry(Long id) {
        String t = TenantContext.getTenantId();
        log.info("Soft-deleting timetable entry id={}", id);
        TimetableEntry e = repo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("TimetableEntry", id));
        evictTimetableEntryCaches(e, null);
        e.setIsDeleted(true);
        repo.save(e);
    }

    @Transactional
    public TimetableEntry updateEntry(Long id, TimetableEntry update, Long replaceTimetableEntryId) {
        String t = TenantContext.getTenantId();
        log.info("Updating timetable entry id={} replaceId={}", id, replaceTimetableEntryId);
        TimetableEntry entry = repo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("TimetableEntry", id));
        TimetableEntry before = snapshotEntry(entry);
        if (update.getClassId() != null) {
            entry.setClassId(update.getClassId());
            entry.setSectionId(update.getSectionId());
        } else if (update.getSectionId() != null) {
            entry.setSectionId(update.getSectionId());
        }
        if (update.getDay() != null) entry.setDay(update.getDay());
        if (update.getPeriod() != null) entry.setPeriod(update.getPeriod());
        if (update.getSubjectName() != null) entry.setSubjectName(update.getSubjectName());
        if (update.getTeacherId() != null) entry.setTeacherId(update.getTeacherId());
        if (update.getTeacherName() != null) entry.setTeacherName(update.getTeacherName());
        if (update.getRoom() != null) entry.setRoom(update.getRoom());
        if (update.getStartTime() != null) entry.setStartTime(update.getStartTime());
        if (update.getEndTime() != null) entry.setEndTime(update.getEndTime());
        validateTimetableEntryRules(entry);
        assertNoTimetableConflictOrReplace(t, entry, id, replaceTimetableEntryId);
        TimetableEntry saved = repo.save(entry);
        log.info("Timetable entry updated id={}", id);
        evictTimetableEntryCaches(saved, before);
        return saved;
    }

    /**
     * Loads current rows for the candidate class/section and teacher, applies {@link TimetableSlotConflictResolver},
     * and either throws {@link SchedulingConflictException} (409 + payload) or soft-deletes the confirmed blocking row.
     */
    private void assertNoTimetableConflictOrReplace(
            String tenantId, TimetableEntry candidate, Long excludeEntryId, Long replaceTimetableEntryId) {
        List<TimetableEntry> classRows = repo.findForTenantClassAndOptionalSection(tenantId, candidate.getClassId(), candidate.getSectionId());
        List<TimetableEntry> teacherRows = candidate.getTeacherId() != null
                ? repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(tenantId, candidate.getTeacherId())
                : List.of();
        String room = candidate.getRoom() != null ? candidate.getRoom().trim() : "";
        List<TimetableEntry> roomRows = !room.isBlank()
                ? repo.findByTenantAndRoomIgnoreCase(tenantId, room)
                : List.of();

        Optional<Conflict> conflict = TimetableSlotConflictResolver.resolve(
                classRows,
                teacherRows,
                roomRows,
                candidate.getDay(),
                candidate.getPeriod(),
                candidate.getTeacherId(),
                room,
                candidate.getStartTime(),
                candidate.getEndTime(),
                excludeEntryId);

        if (replaceTimetableEntryId != null) {
            if (conflict.isEmpty()) {
                throw new BusinessException("No timetable conflict to replace — refresh the schedule and try again.");
            }
            if (!replaceTimetableEntryId.equals(conflict.get().blockingEntry().getId())) {
                throw new BusinessException("Replace id does not match the conflicting timetable row.");
            }
            softDeleteBlockingEntry(tenantId, replaceTimetableEntryId);
            Optional<Conflict> again = TimetableSlotConflictResolver.resolve(
                    repo.findForTenantClassAndOptionalSection(tenantId, candidate.getClassId(), candidate.getSectionId()),
                    candidate.getTeacherId() != null
                            ? repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(tenantId, candidate.getTeacherId())
                            : List.of(),
                    !room.isBlank() ? repo.findByTenantAndRoomIgnoreCase(tenantId, room) : List.of(),
                    candidate.getDay(),
                    candidate.getPeriod(),
                    candidate.getTeacherId(),
                    room,
                    candidate.getStartTime(),
                    candidate.getEndTime(),
                    excludeEntryId);
            if (again.isPresent()) {
                throw new BusinessException("After removing the selected slot, another conflict still exists. Refresh and review the grid.");
            }
            return;
        }

        if (conflict.isPresent()) {
            Conflict c = conflict.get();
            log.warn("Timetable conflict kind={} blockingId={}", c.kind(), c.blockingEntry().getId());
            throw new SchedulingConflictException(
                    humanTimetableConflictMessage(c.kind()),
                    ApiErrorCode.TIMETABLE_SLOT_CONFLICT,
                    buildTimetableConflictPayload(c));
        }
    }

    private static String humanTimetableConflictMessage(TimetableSlotConflictResolver.Kind kind) {
        if (kind == TimetableSlotConflictResolver.Kind.CLASS_PERIOD_OCCUPIED) {
            return "This class already has a subject scheduled in that weekday period/time window.";
        }
        if (kind == TimetableSlotConflictResolver.Kind.ROOM_DOUBLE_BOOKED) {
            return "This room is already occupied in that weekday period/time window.";
        }
        return "This teacher is already scheduled in another class in that weekday period/time window.";
    }

    private void validateTimetableEntryRules(TimetableEntry entry) {
        if (entry.getClassId() == null || entry.getClassId() <= 0) {
            throw new BusinessException("Class is required for timetable slot.");
        }
        if (entry.getDay() == null) {
            throw new BusinessException("Weekday is required for timetable slot.");
        }
        if (entry.getPeriod() == null || entry.getPeriod() < 1 || entry.getPeriod() > 12) {
            throw new BusinessException("Period must be between 1 and 12.");
        }
        if (entry.getSubjectName() == null || entry.getSubjectName().trim().isEmpty()) {
            throw new BusinessException("Subject is required for timetable slot.");
        }
        if (entry.getTeacherId() == null || entry.getTeacherId() <= 0) {
            throw new BusinessException("Teacher is required for timetable slot.");
        }
        if (entry.getStartTime() == null || entry.getEndTime() == null || !entry.getStartTime().isBefore(entry.getEndTime())) {
            throw new BusinessException("Start time must be earlier than end time.");
        }
        String tenantId = TenantContext.getTenantId();
        schoolClassRepository
                .findByIdAndTenantIdAndIsDeletedFalse(entry.getClassId(), tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", entry.getClassId()));
        List<Section> classSections = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, entry.getClassId());
        if (!classSections.isEmpty()) {
            if (entry.getSectionId() == null || entry.getSectionId() <= 0) {
                throw new BusinessException("Section is required for this class.");
            }
            sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(entry.getSectionId(), tenantId)
                    .filter(sec -> sec.getClassId().equals(entry.getClassId()))
                    .orElseThrow(() -> new BusinessException("Selected section does not belong to the chosen class."));
        }
    }

    private void softDeleteBlockingEntry(String tenantId, Long id) {
        TimetableEntry victim = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new BusinessException("The timetable row to remove is no longer available."));
        evictTimetableEntryCaches(victim, null);
        victim.setIsDeleted(true);
        repo.save(victim);
    }

    private static TimetableDTOs.TimetableConflictPayload buildTimetableConflictPayload(Conflict c) {
        TimetableEntry b = c.blockingEntry();
        TimetableDTOs.TimetableConflictPayload p = new TimetableDTOs.TimetableConflictPayload();
        p.setConflictType(c.kind().name());
        p.setExistingEntryId(b.getId());
        p.setDay(b.getDay() != null ? b.getDay().name() : null);
        p.setPeriod(b.getPeriod());
        p.setSubjectName(b.getSubjectName());
        p.setTeacherName(b.getTeacherName());
        p.setRoom(b.getRoom());
        p.setClassId(b.getClassId());
        p.setSectionId(b.getSectionId());
        if (c.kind() == TimetableSlotConflictResolver.Kind.TEACHER_DOUBLE_BOOKED) {
            p.setConflictingClassId(b.getClassId());
            p.setConflictingSectionId(b.getSectionId());
        }
        return p;
    }

    @Transactional(readOnly = true)
    public Optional<TimetableDTOs.TimetableConflictPayload> findConflict(
            TimetableEntry candidate, Long excludeEntryId, Set<Long> ignoreEntryIds) {
        if (candidate == null || candidate.getClassId() == null || candidate.getDay() == null || candidate.getPeriod() == null) {
            return Optional.empty();
        }
        String tenantId = TenantContext.getTenantId();
        Set<Long> ignore = ignoreEntryIds != null ? ignoreEntryIds : Set.of();
        List<TimetableEntry> classRows = repo.findForTenantClassAndOptionalSection(tenantId, candidate.getClassId(), candidate.getSectionId())
                .stream()
                .filter(e -> !ignore.contains(e.getId()))
                .collect(Collectors.toList());
        List<TimetableEntry> teacherRows = candidate.getTeacherId() != null
                ? repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(tenantId, candidate.getTeacherId()).stream()
                .filter(e -> !ignore.contains(e.getId()))
                .collect(Collectors.toList())
                : List.of();
        String room = candidate.getRoom() != null ? candidate.getRoom().trim() : "";
        List<TimetableEntry> roomRows = !room.isBlank()
                ? repo.findByTenantAndRoomIgnoreCase(tenantId, room).stream()
                .filter(e -> !ignore.contains(e.getId()))
                .collect(Collectors.toList())
                : List.of();
        Optional<Conflict> conflict = TimetableSlotConflictResolver.resolve(
                classRows,
                teacherRows,
                roomRows,
                candidate.getDay(),
                candidate.getPeriod(),
                candidate.getTeacherId(),
                room,
                candidate.getStartTime(),
                candidate.getEndTime(),
                excludeEntryId);
        return conflict.map(TimetableService::buildTimetableConflictPayload);
    }

    private static TimetableEntry snapshotEntry(TimetableEntry entry) {
        TimetableEntry s = new TimetableEntry();
        s.setClassId(entry.getClassId());
        s.setSectionId(entry.getSectionId());
        s.setTeacherId(entry.getTeacherId());
        return s;
    }

    private void evictTimetableEntryCaches(TimetableEntry current, TimetableEntry beforeOrNull) {
        cacheService.ifAvailable(cs -> {
            String tid = TenantContext.getTenantId();
            if (tid == null || tid.isBlank()) {
                tid = "_no_tenant_";
            }
            evictOne(cs, tid, current);
            if (beforeOrNull != null) {
                evictOne(cs, tid, beforeOrNull);
            }
        });
    }

    private static void evictOne(CacheService cs, String tid, TimetableEntry e) {
        Long classId = e.getClassId();
        Long sectionId = e.getSectionId();
        cs.evict(CacheRegion.TIMETABLE_GRID, tid + ":getByClassAndSection:" + classId + ":" + (sectionId == null ? "_" : sectionId));
        if (e.getTeacherId() != null) {
            cs.evict(CacheRegion.TIMETABLE_GRID, tid + ":getByTeacher:" + e.getTeacherId());
        }
    }

    public TimetableService(
            TimetableRepository repo,
            AttendanceCoverAssignmentRepository coverRepo,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            TeacherRepository teacherRepository,
            @Lazy TimetableService self,
            ObjectProvider<CacheService> cacheService) {
        this.repo = repo;
        this.coverRepo = coverRepo;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.teacherRepository = teacherRepository;
        this.self = self;
        this.cacheService = cacheService;
    }
}
