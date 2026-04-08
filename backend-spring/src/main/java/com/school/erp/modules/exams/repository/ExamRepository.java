package com.school.erp.modules.exams.repository;
import com.school.erp.modules.exams.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByTenantIdAndIsDeletedFalse(String tenantId);
}
