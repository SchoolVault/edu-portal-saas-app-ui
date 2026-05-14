package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamModuleConfigHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamModuleConfigHistoryRepository extends JpaRepository<ExamModuleConfigHistory, Long> {
    List<ExamModuleConfigHistory> findByTenantIdAndAcademicYearIdAndConfigKeyAndIsDeletedFalseOrderByVersionNoDesc(
            String tenantId,
            Long academicYearId,
            String configKey);
}
