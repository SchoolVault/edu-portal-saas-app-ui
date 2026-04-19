package com.school.erp.modules.timetable.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.service.AcademicService;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.timetable.dto.TeacherScheduleOnboardingDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

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

    public TeacherScheduleOnboardingService(
            AcademicService academicService,
            TimetableService timetableService,
            TeacherRepository teacherRepository,
            SchoolClassRepository schoolClassRepository) {
        this.academicService = academicService;
        this.timetableService = timetableService;
        this.teacherRepository = teacherRepository;
        this.schoolClassRepository = schoolClassRepository;
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
        LocalTime[] win = periodWindow(slot.getPeriod());

        if (slot.getExistingEntryId() != null) {
            TimetableEntry patch = new TimetableEntry();
            patch.setSubjectName(slot.getSubjectName().trim());
            patch.setTeacherId(teacher.getId());
            patch.setTeacherName(teacherFullName);
            patch.setStartTime(win[0]);
            patch.setEndTime(win[1]);
            if (slot.getRoom() != null) {
                patch.setRoom(slot.getRoom());
            }
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
}
