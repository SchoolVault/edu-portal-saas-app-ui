package com.school.erp.modules.timetable.repository;

import com.school.erp.modules.timetable.entity.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import com.school.erp.common.enums.Enums;

public interface TimetableRepository extends JpaRepository<TimetableEntry, Long> {
    List<TimetableEntry> findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(String tenantId, Long classId, Long sectionId);

    List<TimetableEntry> findByTenantIdAndTeacherIdAndIsDeletedFalse(String tenantId, Long teacherId);

    @Query("SELECT e FROM TimetableEntry e WHERE e.tenantId = :t AND e.classId = :c AND e.isDeleted = false "
            + "AND ((:s IS NULL AND e.sectionId IS NULL) OR (:s IS NOT NULL AND e.sectionId = :s))")
    List<TimetableEntry> findForTenantClassAndOptionalSection(@Param("t") String tenantId, @Param("c") Long classId, @Param("s") Long sectionId);

    @Query("SELECT e FROM TimetableEntry e WHERE e.tenantId = :tenantId AND e.classId = :classId AND e.isDeleted = false "
            + "AND ((:sectionId IS NULL AND e.sectionId IS NULL) OR (:sectionId IS NOT NULL AND e.sectionId = :sectionId)) "
            + "AND e.day = :day AND e.period = :period")
    Optional<TimetableEntry> findFirstByTenantAndClassSectionDayPeriod(
            @Param("tenantId") String tenantId,
            @Param("classId") Long classId,
            @Param("sectionId") Long sectionId,
            @Param("day") Enums.DayOfWeek day,
            @Param("period") Integer period);

    Optional<TimetableEntry> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
