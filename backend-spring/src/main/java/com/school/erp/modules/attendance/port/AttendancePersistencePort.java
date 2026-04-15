package com.school.erp.modules.attendance.port;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.attendance.entity.AttendanceRecord;

import java.time.LocalDate;
import java.util.List;

public interface AttendancePersistencePort {

    List<AttendanceRecord> findByTenantIdAndClassIdAndSectionIdAndDate(String tenantId, Long classId, Long sectionId, LocalDate date);

    List<AttendanceRecord> saveAll(Iterable<AttendanceRecord> records);

    List<AttendanceRecord> findByTenantIdAndStudentIdAndDateBetween(String tenantId, Long studentId, LocalDate from, LocalDate to);

    List<Object[]> getClassAttendanceStats(String tenantId, Long classId, LocalDate date);

    List<Object[]> getStudentAttendanceStats(String tenantId, Long studentId, LocalDate from, LocalDate to);
}
