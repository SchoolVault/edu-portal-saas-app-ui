package com.school.erp.modules.attendance.repository;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository; import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate; import java.util.List;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    boolean existsByTenantIdAndStudentIdAndDateAndIsDeletedFalse(String tenantId, Long studentId, LocalDate date);

    List<AttendanceRecord> findByTenantIdAndDateAndIsDeletedFalseOrderByStudentIdAsc(String tenantId, LocalDate date);

    List<AttendanceRecord> findByTenantIdAndClassIdAndSectionIdAndDate(String tenantId, Long classId, Long sectionId, LocalDate date);

    Page<AttendanceRecord> findByTenantIdAndClassIdAndSectionIdAndDateAndIsDeletedFalseOrderByStudentIdAsc(
            String tenantId, Long classId, Long sectionId, LocalDate date, Pageable pageable);
    List<AttendanceRecord> findByTenantIdAndStudentIdAndDateBetween(String tenantId, Long studentId, LocalDate from, LocalDate to);
    long countByTenantIdAndDate(String tenantId, LocalDate date);
    long countByTenantIdAndDateAndStatus(String tenantId, LocalDate date, com.school.erp.common.enums.Enums.AttendanceStatus status);

    @Query("SELECT a.status, COUNT(a) FROM AttendanceRecord a WHERE a.tenantId = :tenantId AND a.classId = :classId AND a.date = :date GROUP BY a.status")
    List<Object[]> getClassAttendanceStats(String tenantId, Long classId, LocalDate date);

    @Query("""
            SELECT a.classId, a.status, COUNT(a)
            FROM AttendanceRecord a
            WHERE a.tenantId = :tenantId
              AND a.isDeleted = false
              AND a.classId IN :classIds
              AND a.date = :date
            GROUP BY a.classId, a.status
            """)
    List<Object[]> getClassAttendanceStatsByClassIds(
            @Param("tenantId") String tenantId,
            @Param("classIds") List<Long> classIds,
            @Param("date") LocalDate date);

    @Query("SELECT a.status, COUNT(a) FROM AttendanceRecord a WHERE a.tenantId = :tenantId AND a.studentId = :studentId AND a.date BETWEEN :from AND :to GROUP BY a.status")
    List<Object[]> getStudentAttendanceStats(String tenantId, Long studentId, LocalDate from, LocalDate to);

    @Query("""
            SELECT a.studentId, a.status, COUNT(a)
            FROM AttendanceRecord a
            WHERE a.tenantId = :tenantId
              AND a.classId = :classId
              AND a.isDeleted = false
              AND a.date BETWEEN :from AND :to
            GROUP BY a.studentId, a.status
            """)
    List<Object[]> getAttendanceStatsByClassAndDateRange(String tenantId, Long classId, LocalDate from, LocalDate to);

    long countByTenantIdAndClassIdAndDateAndStatus(String tenantId, Long classId, LocalDate date, com.school.erp.common.enums.Enums.AttendanceStatus status);

    List<AttendanceRecord> findByTenantIdAndClassIdAndDateBetweenAndIsDeletedFalse(String tenantId, Long classId, LocalDate from, LocalDate to);

    List<AttendanceRecord> findByTenantIdAndClassIdAndSectionIdAndDateBetweenAndIsDeletedFalse(
            String tenantId, Long classId, Long sectionId, LocalDate from, LocalDate to);
}
