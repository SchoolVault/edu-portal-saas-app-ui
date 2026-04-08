package com.school.erp.modules.timetable.repository;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface TimetableRepository extends JpaRepository<TimetableEntry, Long> {
    List<TimetableEntry> findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(String tenantId, Long classId, Long sectionId);
    List<TimetableEntry> findByTenantIdAndTeacherIdAndIsDeletedFalse(String tenantId, Long teacherId);
}
