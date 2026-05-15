package com.school.erp.modules.exams.repository;
import com.school.erp.modules.exams.entity.MarkRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
public interface MarkRecordRepository extends JpaRepository<MarkRecord, Long> {
    List<MarkRecord> findByTenantId(String tenantId);
    List<MarkRecord> findByTenantIdAndClassIdIn(String tenantId, List<Long> classIds);
    List<MarkRecord> findByTenantIdAndExamId(String tenantId, Long examId);
    List<MarkRecord> findByTenantIdAndExamIdAndStudentId(String tenantId, Long examId, Long studentId);
    List<MarkRecord> findByTenantIdAndStudentId(String tenantId, Long studentId);
    List<MarkRecord> findByTenantIdAndExamIdInAndStudentIdIn(String tenantId, List<Long> examIds, List<Long> studentIds);
    List<MarkRecord> findByTenantIdAndExamIdAndClassId(String tenantId, Long examId, Long classId);

    @Query("""
            SELECT m.classId, AVG((m.marksObtained * 100.0) / NULLIF(m.maxMarks, 0))
            FROM MarkRecord m
            WHERE m.tenantId = :tenantId
              AND m.classId IN :classIds
              AND m.isDeleted = false
              AND m.maxMarks > 0
            GROUP BY m.classId
            """)
    List<Object[]> getAveragePerformanceByClassIds(
            @Param("tenantId") String tenantId,
            @Param("classIds") List<Long> classIds);
}
