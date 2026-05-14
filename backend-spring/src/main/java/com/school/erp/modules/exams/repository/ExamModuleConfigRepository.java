package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamModuleConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamModuleConfigRepository extends JpaRepository<ExamModuleConfig, Long> {
    List<ExamModuleConfig> findByTenantIdAndAcademicYearIdAndIsDeletedFalseOrderByConfigKeyAsc(String tenantId, Long academicYearId);

    Optional<ExamModuleConfig> findByTenantIdAndAcademicYearIdAndConfigKeyAndIsDeletedFalse(
            String tenantId,
            Long academicYearId,
            String configKey);
}
