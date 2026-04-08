package com.school.erp.modules.attendance.repository;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate; import java.util.List;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByTenantIdAndClassIdAndSectionIdAndDate(String tenantId, Long classId, Long sectionId, LocalDate date);
    List<AttendanceRecord> findByTenantIdAndStudentIdAndDateBetween(String tenantId, Long studentId, LocalDate from, LocalDate to);

    @Query("SELECT a.status, COUNT(a) FROM AttendanceRecord a WHERE a.tenantId = :tenantId AND a.classId = :classId AND a.date = :date GROUP BY a.status")
    List<Object[]> getClassAttendanceStats(String tenantId, Long classId, LocalDate date);

    @Query("SELECT a.status, COUNT(a) FROM AttendanceRecord a WHERE a.tenantId = :tenantId AND a.studentId = :studentId AND a.date BETWEEN :from AND :to GROUP BY a.status")
    List<Object[]> getStudentAttendanceStats(String tenantId, Long studentId, LocalDate from, LocalDate to);

    long countByTenantIdAndClassIdAndDateAndStatus(String tenantId, Long classId, LocalDate date, com.school.erp.common.enums.Enums.AttendanceStatus status);
}
