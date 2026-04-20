package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamTemplateComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamTemplateComponentRepository extends JpaRepository<ExamTemplateComponent, Long> {
    List<ExamTemplateComponent> findByTenantIdAndTemplateIdAndIsDeletedFalseOrderByIdAsc(String tenantId, Long templateId);
}
