package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamTemplateRepository extends JpaRepository<ExamTemplate, Long> {
    List<ExamTemplate> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);
    Optional<ExamTemplate> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
