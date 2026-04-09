package com.school.erp.modules.exams.repository;
import com.school.erp.modules.exams.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<Exam> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
