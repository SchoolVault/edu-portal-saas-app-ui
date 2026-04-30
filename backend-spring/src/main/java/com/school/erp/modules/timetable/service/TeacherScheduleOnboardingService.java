package com.school.erp.modules.timetable.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.academic.service.AcademicService;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.timetable.dto.TeacherScheduleOnboardingDTOs;
import com.school.erp.modules.timetable.dto.TimetableDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Orchestrates homeroom assignment ({@link AcademicService}) with recurring timetable rows ({@link TimetableService})
 * in one transaction — primary onboarding path for Indian schools (class teacher + weekly teaching load).
 */
@Service
public class TeacherScheduleOnboardingService {

    private final AcademicService academicService;
    private final TimetableService timetableService;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;

    public TeacherScheduleOnboardingService(
            AcademicService academicService,
            TimetableService timetableService,
            TeacherRepository teacherRepository,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository) {
        this.academicService = academicService;
        this.timetableService = timetableService;
        this.teacherRepository = teacherRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
    }

    @Transactional
    public TeacherScheduleOnboardingDTOs.ApplyResponse apply(TeacherScheduleOnboardingDTOs.ApplyRequest req) {
        if (req == null || req.getTeacherId() == null) {
            throw new BusinessException("teacherId is required.");
        }
        String tenant = TenantContext.getTenantId();
        Teacher teacher = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getTeacherId(), tenant)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", req.getTeacherId()));
        if (teacher.getStatus() != null && teacher.getStatus() != Enums.TeacherStatus.ACTIVE) {
            throw new BusinessException("Only active teachers can receive a schedule onboarding.");
        }
        String teacherFullName = (teacher.getFirstName() + " " + teacher.getLastName()).trim();

        TeacherScheduleOnboardingDTOs.ApplyResponse resp = new TeacherScheduleOnboardingDTOs.ApplyResponse();
        resp.setTeacherId(teacher.getId());
        resp.setTeacherName(teacherFullName);

        if (req.getRemoveEntryIds() != null) {
            for (Long id : req.getRemoveEntryIds()) {
                if (id == null) {
                    continue;
                }
                timetableService.deleteEntry(id);
                resp.getRemovedEntryIds().add(id);
            }
        }

        if (req.getHomeroom() != null && req.getHomeroom().getClassId() != null) {
            TeacherScheduleOnboardingDTOs.HomeroomPayload h = req.getHomeroom();
            AcademicDTOs.ClassWithSectionsResponse cls = academicService.assignClassTeacher(
                    h.getClassId(), h.getSectionId(), teacher.getId(), teacherFullName);
            resp.setHomeroomClass(cls);
        }

        if (req.getSlots() != null) {
            for (TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot : req.getSlots()) {
                applyOneSlot(tenant, teacher, teacherFullName, slot, resp);
            }
        }

        TeacherScheduleOnboardingDTOs.Options opt = req.getOptions() != null ? req.getOptions() : new TeacherScheduleOnboardingDTOs.Options();
        if (opt.isAnchorMondayFirstPeriod() && req.getHomeroom() != null && req.getHomeroom().getClassId() != null) {
            anchorMondayFirstPeriod(tenant, teacher, teacherFullName, req.getHomeroom(), resp);
        }

        return resp;
    }

    @Transactional(readOnly = true)
    public TeacherScheduleOnboardingDTOs.ValidateResponse validate(TeacherScheduleOnboardingDTOs.ApplyRequest req) {
        TeacherScheduleOnboardingDTOs.ValidateResponse resp = new TeacherScheduleOnboardingDTOs.ValidateResponse();
        if (req == null || req.getTeacherId() == null) {
            addIssue(resp, "TEACHER_REQUIRED", "teacherId is required.");
            resp.setValid(false);
            return resp;
        }
        String tenant = TenantContext.getTenantId();
        resp.setTeacherId(req.getTeacherId());
        Teacher teacher = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getTeacherId(), tenant).orElse(null);
        if (teacher == null) {
            addIssue(resp, "TEACHER_NOT_FOUND", "Teacher not found for this tenant.");
            resp.setValid(false);
            return resp;
        }
        if (teacher.getStatus() != null && teacher.getStatus() != Enums.TeacherStatus.ACTIVE) {
            addIssue(resp, "TEACHER_INACTIVE", "Only active teachers can receive a schedule onboarding.");
        }
        String teacherFullName = (teacher.getFirstName() + " " + teacher.getLastName()).trim();
        resp.setTeacherName(teacherFullName);

        Set<Long> removeIds = new HashSet<>();
        for (Long id : req.getRemoveEntryIds() != null ? req.getRemoveEntryIds() : List.<Long>of()) {
            if (id == null) {
                continue;
            }
            removeIds.add(id);
        }
        resp.setSlotsToDelete(removeIds.size());

        if (req.getHomeroom() != null && req.getHomeroom().getClassId() != null) {
            validateHomeroom(tenant, req.getHomeroom(), resp);
        }

        int creates = 0;
        int updates = 0;
        Set<String> uniqClass = new HashSet<>();
        Set<String> uniqTeacher = new HashSet<>();
        Set<String> uniqRoom = new HashSet<>();
        List<TeacherScheduleOnboardingDTOs.TeachingSlotPayload> slots =
                req.getSlots() != null ? req.getSlots() : List.of();
        for (TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot : slots) {
            if (slot == null) {
                continue;
            }
            if (slot.getExistingEntryId() != null) {
                updates++;
            } else {
                creates++;
            }
            validateSlotShape(tenant, teacher, slot, uniqClass, uniqTeacher, uniqRoom, resp);
            validateSlotConflicts(tenant, teacher, slot, removeIds, resp);
        }
        resp.setSlotsToCreate(creates);
        resp.setSlotsToUpdate(updates);
        resp.setValid(resp.getIssues().isEmpty());
        return resp;
    }

    private void applyOneSlot(
            String tenant,
            Teacher teacher,
            String teacherFullName,
            TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot,
            TeacherScheduleOnboardingDTOs.ApplyResponse resp) {
        if (slot.getClassId() == null || slot.getPeriod() == null || slot.getSubjectName() == null || slot.getSubjectName().isBlank()) {
            throw new BusinessException("Each slot requires classId, period, and subjectName.");
        }
        Enums.DayOfWeek day = parseDay(slot.getDay());
        SchoolClass cls = schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(slot.getClassId(), tenant)
                .orElseThrow(() -> new ResourceNotFoundException("Class", slot.getClassId()));
        LocalTime[] win = resolveSlotWindow(slot);

        if (slot.getExistingEntryId() != null) {
            TimetableEntry patch = new TimetableEntry();
            patch.setClassId(slot.getClassId());
            patch.setSectionId(slot.getSectionId());
            patch.setDay(day);
            patch.setPeriod(slot.getPeriod());
            patch.setSubjectName(slot.getSubjectName().trim());
            patch.setTeacherId(teacher.getId());
            patch.setTeacherName(teacherFullName);
            patch.setStartTime(win[0]);
            patch.setEndTime(win[1]);
            patch.setRoom(slot.getRoom() != null && !slot.getRoom().isBlank()
                    ? slot.getRoom().trim()
                    : defaultRoomLabel(cls.getGrade(), slot.getClassId(), slot.getPeriod()));
            timetableService.updateEntry(slot.getExistingEntryId(), patch, slot.getReplaceTimetableEntryId());
            resp.getUpdatedEntryIds().add(slot.getExistingEntryId());
            return;
        }

        TimetableEntry e = TimetableEntry.builder()
                .classId(slot.getClassId())
                .sectionId(slot.getSectionId())
                .day(day)
                .period(slot.getPeriod())
                .startTime(win[0])
                .endTime(win[1])
                .subjectName(slot.getSubjectName().trim())
                .teacherId(teacher.getId())
                .teacherName(teacherFullName)
                .room(slot.getRoom() != null && !slot.getRoom().isBlank()
                        ? slot.getRoom()
                        : defaultRoomLabel(cls.getGrade(), slot.getClassId(), slot.getPeriod()))
                .build();
        e.setTenantId(tenant);
        e.setAcademicYearId(cls.getAcademicYearId());
        e.setIsDeleted(false);
        TimetableEntry saved = timetableService.createEntry(e, slot.getReplaceTimetableEntryId());
        resp.getCreatedEntryIds().add(saved.getId());
    }

    private void anchorMondayFirstPeriod(
            String tenant,
            Teacher teacher,
            String teacherFullName,
            TeacherScheduleOnboardingDTOs.HomeroomPayload homeroom,
            TeacherScheduleOnboardingDTOs.ApplyResponse resp) {
        Long classId = homeroom.getClassId();
        Long sectionId = homeroom.getSectionId();
        List<TimetableEntry> rows = timetableService.getByClassAndSection(classId, sectionId);
        Optional<TimetableEntry> mon = rows.stream()
                .filter(e -> e.getDay() == Enums.DayOfWeek.MONDAY && e.getPeriod() != null && e.getPeriod() == 1)
                .findFirst();
        if (mon.isEmpty()) {
            return;
        }
        TimetableEntry patch = new TimetableEntry();
        patch.setTeacherId(teacher.getId());
        patch.setTeacherName(teacherFullName);
        patch.setSubjectName(primarySubjectLabel(teacher));
        LocalTime[] win = periodWindow(1);
        patch.setStartTime(win[0]);
        patch.setEndTime(win[1]);
        TimetableEntry updated = timetableService.updateEntry(mon.get().getId(), patch, null);
        resp.setAnchoredEntryId(updated.getId());
    }

    private static String primarySubjectLabel(Teacher t) {
        String spec = Optional.ofNullable(t.getSpecialization()).orElse("").trim();
        if (!spec.isEmpty()) {
            return spec;
        }
        if (t.getSubjects() != null) {
            for (String s : t.getSubjects()) {
                if (s != null && !s.isBlank()) {
                    return s.trim();
                }
            }
        }
        return "Value Education";
    }

    private static LocalTime[] periodWindow(int period) {
        if (period < 1) {
            throw new BusinessException("period must be >= 1.");
        }
        LocalTime start = LocalTime.of(8, 0).plusMinutes((long) (period - 1) * 45);
        return new LocalTime[]{start, start.plusMinutes(45)};
    }

    private static LocalTime[] resolveSlotWindow(TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot) {
        String startRaw = slot.getStartTime();
        String endRaw = slot.getEndTime();
        if (startRaw != null && !startRaw.isBlank() && endRaw != null && !endRaw.isBlank()) {
            try {
                LocalTime start = LocalTime.parse(startRaw.trim());
                LocalTime end = LocalTime.parse(endRaw.trim());
                if (!start.isBefore(end)) {
                    throw new BusinessException("startTime must be before endTime for each slot.");
                }
                return new LocalTime[]{start, end};
            } catch (RuntimeException ex) {
                throw new BusinessException("Invalid time format for slot. Use HH:mm (e.g. 08:45).");
            }
        }
        return periodWindow(slot.getPeriod());
    }

    private static String defaultRoomLabel(Integer grade, Long classId, int period) {
        int g = grade != null ? grade : 6;
        return "Room " + (100 + g * 10 + period);
    }

    private static Enums.DayOfWeek parseDay(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BusinessException("day is required for each slot.");
        }
        try {
            return Enums.DayOfWeek.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid weekday: " + raw);
        }
    }

    private void validateHomeroom(
            String tenant,
            TeacherScheduleOnboardingDTOs.HomeroomPayload h,
            TeacherScheduleOnboardingDTOs.ValidateResponse resp) {
        SchoolClass cls = schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(h.getClassId(), tenant).orElse(null);
        if (cls == null) {
            addIssue(resp, "HOMEROOM_CLASS_NOT_FOUND", "Selected homeroom class was not found.");
            return;
        }
        List<Section> sections = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenant, h.getClassId());
        boolean hasSections = sections != null && !sections.isEmpty();
        if (hasSections && h.getSectionId() == null) {
            addIssue(resp, "HOMEROOM_SECTION_REQUIRED", "This class has sections. Select a section for homeroom.");
            return;
        }
        if (!hasSections && h.getSectionId() != null) {
            addIssue(resp, "HOMEROOM_SECTION_NOT_ALLOWED", "This class has no sections; do not send sectionId.");
            return;
        }
        if (hasSections) {
            boolean ok = sections.stream().anyMatch(s -> Objects.equals(s.getId(), h.getSectionId()));
            if (!ok) {
                addIssue(resp, "HOMEROOM_SECTION_INVALID", "Selected homeroom section does not belong to the class.");
            }
        }
    }

    private void validateSlotShape(
            String tenant,
            Teacher teacher,
            TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot,
            Set<String> uniqClass,
            Set<String> uniqTeacher,
            Set<String> uniqRoom,
            TeacherScheduleOnboardingDTOs.ValidateResponse resp) {
        if (slot.getClassId() == null || slot.getPeriod() == null || slot.getSubjectName() == null || slot.getSubjectName().isBlank()) {
            addIssue(resp, "SLOT_REQUIRED_FIELDS", "Each slot requires classId, period, and subjectName.", slot);
            return;
        }
        if (slot.getPeriod() < 1 || slot.getPeriod() > 12) {
            addIssue(resp, "SLOT_PERIOD_RANGE", "Period must be between 1 and 12.", slot);
        }
        Enums.DayOfWeek day;
        try {
            day = parseDay(slot.getDay());
        } catch (BusinessException ex) {
            addIssue(resp, "SLOT_DAY_INVALID", ex.getMessage(), slot);
            return;
        }
        SchoolClass cls = schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(slot.getClassId(), tenant).orElse(null);
        if (cls == null) {
            addIssue(resp, "SLOT_CLASS_NOT_FOUND", "Selected class does not exist.", slot);
            return;
        }
        List<Section> sections = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenant, slot.getClassId());
        boolean hasSections = sections != null && !sections.isEmpty();
        if (hasSections && slot.getSectionId() == null) {
            addIssue(resp, "SLOT_SECTION_REQUIRED", "Section is required for classes with sections.", slot);
        }
        if (!hasSections && slot.getSectionId() != null) {
            addIssue(resp, "SLOT_SECTION_NOT_ALLOWED", "Section is not allowed for classes without sections.", slot);
        }
        if (hasSections && slot.getSectionId() != null) {
            boolean belongs = sections.stream().anyMatch(s -> Objects.equals(s.getId(), slot.getSectionId()));
            if (!belongs) {
                addIssue(resp, "SLOT_SECTION_INVALID", "Selected section does not belong to the class.", slot);
            }
        }
        String classKey = day.name() + "|" + slot.getPeriod() + "|" + slot.getClassId() + "|" + (slot.getSectionId() == null ? 0 : slot.getSectionId());
        if (!uniqClass.add(classKey)) {
            addIssue(resp, "REQUEST_DUPLICATE_CLASS_SLOT", "Duplicate class-section slot found in request.", slot);
        }
        String teacherKey = day.name() + "|" + slot.getPeriod() + "|" + teacher.getId();
        if (!uniqTeacher.add(teacherKey)) {
            addIssue(resp, "REQUEST_TEACHER_DOUBLE_BOOKED", "Teacher is double-booked in the request.", slot);
        }
        String room = slot.getRoom() != null ? slot.getRoom().trim().toLowerCase(Locale.ROOT) : "";
        if (!room.isBlank()) {
            String roomKey = day.name() + "|" + slot.getPeriod() + "|" + room;
            if (!uniqRoom.add(roomKey)) {
                addIssue(resp, "REQUEST_ROOM_DOUBLE_BOOKED", "Room is double-booked in the request.", slot);
            }
        }
        if (slot.getExistingEntryId() != null) {
            TimetableEntry existing = timetableService.getByTeacher(teacher.getId()).stream()
                    .filter(e -> Objects.equals(e.getId(), slot.getExistingEntryId()))
                    .findFirst()
                    .orElse(null);
            if (existing == null) {
                addIssue(resp, "SLOT_EXISTING_ENTRY_NOT_FOUND", "existingEntryId not found for selected teacher.", slot);
            }
        }
    }

    private void validateSlotConflicts(
            String tenant,
            Teacher teacher,
            TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot,
            Set<Long> removeIds,
            TeacherScheduleOnboardingDTOs.ValidateResponse resp) {
        if (slot.getClassId() == null || slot.getPeriod() == null || slot.getSubjectName() == null || slot.getSubjectName().isBlank()) {
            return;
        }
        Enums.DayOfWeek day;
        try {
            day = parseDay(slot.getDay());
        } catch (BusinessException ex) {
            return;
        }
        LocalTime[] win;
        try {
            win = resolveSlotWindow(slot);
        } catch (BusinessException ex) {
            addIssue(resp, "SLOT_TIME_INVALID", ex.getMessage(), slot);
            return;
        }
        TimetableEntry candidate = TimetableEntry.builder()
                .classId(slot.getClassId())
                .sectionId(slot.getSectionId())
                .day(day)
                .period(slot.getPeriod())
                .startTime(win[0])
                .endTime(win[1])
                .subjectName(slot.getSubjectName().trim())
                .teacherId(teacher.getId())
                .teacherName((teacher.getFirstName() + " " + teacher.getLastName()).trim())
                .room(slot.getRoom() != null ? slot.getRoom().trim() : "")
                .build();
        Long excludeId = slot.getExistingEntryId();
        Optional<TimetableDTOs.TimetableConflictPayload> conflict =
                timetableService.findConflict(candidate, excludeId, removeIds);
        if (slot.getReplaceTimetableEntryId() != null) {
            if (conflict.isEmpty()) {
                addIssue(resp, "REPLACE_WITHOUT_CONFLICT", "replaceTimetableEntryId provided but no conflict exists.", slot);
                return;
            }
            if (!Objects.equals(slot.getReplaceTimetableEntryId(), conflict.get().getExistingEntryId())) {
                addIssue(resp, "REPLACE_ID_MISMATCH", "replaceTimetableEntryId does not match the blocking entry.", slot, conflict.get());
                return;
            }
            Set<Long> ignore = new HashSet<>(removeIds);
            ignore.add(slot.getReplaceTimetableEntryId());
            Optional<TimetableDTOs.TimetableConflictPayload> afterReplace =
                    timetableService.findConflict(candidate, excludeId, ignore);
            if (afterReplace.isPresent()) {
                addIssue(resp, "CONFLICT_AFTER_REPLACE", "Another conflict still exists after replacing selected entry.", slot, afterReplace.get());
            }
            return;
        }
        conflict.ifPresent(payload -> addIssue(resp, "DB_CONFLICT", "Conflicts with existing timetable row.", slot, payload));
    }

    private static void addIssue(
            TeacherScheduleOnboardingDTOs.ValidateResponse resp,
            String code,
            String message) {
        TeacherScheduleOnboardingDTOs.ValidationIssue i = new TeacherScheduleOnboardingDTOs.ValidationIssue();
        i.setCode(code);
        i.setMessage(message);
        resp.getIssues().add(i);
    }

    private static void addIssue(
            TeacherScheduleOnboardingDTOs.ValidateResponse resp,
            String code,
            String message,
            TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot) {
        TeacherScheduleOnboardingDTOs.ValidationIssue i = new TeacherScheduleOnboardingDTOs.ValidationIssue();
        i.setCode(code);
        i.setMessage(message);
        if (slot != null) {
            i.setDay(slot.getDay());
            i.setPeriod(slot.getPeriod());
            i.setClassId(slot.getClassId());
            i.setSectionId(slot.getSectionId());
            i.setRoom(slot.getRoom());
        }
        resp.getIssues().add(i);
    }

    private static void addIssue(
            TeacherScheduleOnboardingDTOs.ValidateResponse resp,
            String code,
            String message,
            TeacherScheduleOnboardingDTOs.TeachingSlotPayload slot,
            TimetableDTOs.TimetableConflictPayload p) {
        TeacherScheduleOnboardingDTOs.ValidationIssue i = new TeacherScheduleOnboardingDTOs.ValidationIssue();
        i.setCode(code);
        i.setMessage(message);
        if (slot != null) {
            i.setDay(slot.getDay());
            i.setPeriod(slot.getPeriod());
            i.setClassId(slot.getClassId());
            i.setSectionId(slot.getSectionId());
            i.setRoom(slot.getRoom());
        }
        if (p != null) {
            i.setConflictType(p.getConflictType());
            i.setExistingEntryId(p.getExistingEntryId());
            if (i.getDay() == null) {
                i.setDay(p.getDay());
            }
            if (i.getPeriod() == null) {
                i.setPeriod(p.getPeriod());
            }
            if (i.getClassId() == null) {
                i.setClassId(p.getClassId());
            }
            if (i.getSectionId() == null) {
                i.setSectionId(p.getSectionId());
            }
            if (i.getRoom() == null) {
                i.setRoom(p.getRoom());
            }
        }
        resp.getIssues().add(i);
    }
}
