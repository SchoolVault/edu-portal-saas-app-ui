package com.school.erp.modules.timetable.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.timetable.dto.TimetableDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.repository.TimetableRepository;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor
public class TimetableService {
    private final TimetableRepository repo;

    @Transactional(readOnly = true)
    public List<TimetableEntry> getByClassAndSection(Long classId, Long sectionId) {
        return repo.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(TenantContext.getTenantId(), classId, sectionId);
    }

    @Transactional(readOnly = true)
    public List<TimetableEntry> getByTeacher(Long teacherId) {
        return repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(TenantContext.getTenantId(), teacherId);
    }

    @Transactional(readOnly = true)
    public TimetableDTOs.TimetableGridResponse getGrid(Long classId, Long sectionId) {
        List<TimetableEntry> entries = getByClassAndSection(classId, sectionId);
        List<String> days = entries.stream().map(e -> e.getDay().name()).distinct()
                .sorted(Comparator.comparingInt(d -> List.of("MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY").indexOf(d)))
                .collect(Collectors.toList());
        List<Integer> periods = entries.stream().map(TimetableEntry::getPeriod).distinct().sorted().collect(Collectors.toList());

        Map<String, Map<Integer, TimetableDTOs.SlotDTO>> grid = new LinkedHashMap<>();
        for (String day : days) {
            Map<Integer, TimetableDTOs.SlotDTO> daySlots = new LinkedHashMap<>();
            for (int period : periods) {
                TimetableEntry entry = entries.stream()
                        .filter(e -> e.getDay().name().equals(day) && e.getPeriod() == period).findFirst().orElse(null);
                if (entry != null) {
                    daySlots.put(period, TimetableDTOs.SlotDTO.builder()
                            .subject(entry.getSubjectName()).teacher(entry.getTeacherName())
                            .room(entry.getRoom())
                            .startTime(entry.getStartTime() != null ? entry.getStartTime().toString() : null)
                            .endTime(entry.getEndTime() != null ? entry.getEndTime().toString() : null).build());
                }
            }
            grid.put(day, daySlots);
        }
        return TimetableDTOs.TimetableGridResponse.builder().classId(classId).sectionId(sectionId)
                .days(days).periods(periods).grid(grid).build();
    }

    @Transactional
    public TimetableEntry createEntry(TimetableEntry entry) {
        String t = TenantContext.getTenantId();
        // Conflict check: same class+section+day+period
        List<TimetableEntry> existing = repo.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(t, entry.getClassId(), entry.getSectionId());
        boolean conflict = existing.stream().anyMatch(e -> e.getDay() == entry.getDay() && e.getPeriod().equals(entry.getPeriod()));
        if (conflict) throw new BusinessException("Timetable conflict: " + entry.getDay() + " period " + entry.getPeriod() + " already assigned");

        // Teacher conflict check: same teacher+day+period in different class
        if (entry.getTeacherId() != null) {
            List<TimetableEntry> teacherSchedule = repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(t, entry.getTeacherId());
            boolean teacherConflict = teacherSchedule.stream().anyMatch(e -> e.getDay() == entry.getDay() && e.getPeriod().equals(entry.getPeriod()));
            if (teacherConflict) throw new BusinessException("Teacher conflict: already assigned for " + entry.getDay() + " period " + entry.getPeriod());
        }

        entry.setTenantId(t);
        return repo.save(entry);
    }

    @Transactional
    public List<TimetableEntry> batchCreate(List<TimetableEntry> entries) {
        String t = TenantContext.getTenantId();
        entries.forEach(e -> e.setTenantId(t));
        return repo.saveAll(entries);
    }

    @Transactional
    public void deleteEntry(Long id) {
        repo.findById(id).ifPresent(e -> { e.setIsDeleted(true); repo.save(e); });
    }

    @Transactional
    public TimetableEntry updateEntry(Long id, TimetableEntry update) {
        TimetableEntry entry = repo.findById(id).orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("TimetableEntry", id));
        if (update.getSubjectName() != null) entry.setSubjectName(update.getSubjectName());
        if (update.getTeacherId() != null) entry.setTeacherId(update.getTeacherId());
        if (update.getTeacherName() != null) entry.setTeacherName(update.getTeacherName());
        if (update.getRoom() != null) entry.setRoom(update.getRoom());
        if (update.getStartTime() != null) entry.setStartTime(update.getStartTime());
        if (update.getEndTime() != null) entry.setEndTime(update.getEndTime());
        return repo.save(entry);
    }
}
