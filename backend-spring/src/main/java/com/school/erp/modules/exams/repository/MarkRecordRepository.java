package com.school.erp.modules.exams.repository;
import com.school.erp.modules.exams.entity.MarkRecord;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface MarkRecordRepository extends JpaRepository<MarkRecord, Long> {
    List<MarkRecord> findByTenantIdAndExamId(String tenantId, Long examId);
    List<MarkRecord> findByTenantIdAndStudentId(String tenantId, Long studentId);
    List<MarkRecord> findByTenantIdAndExamIdAndClassId(String tenantId, Long examId, Long classId);
}
