package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamClassScope;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExamClassScopeRepository extends JpaRepository<ExamClassScope, Long> {
    List<ExamClassScope> findByTenantIdAndExamIdAndIsDeletedFalse(String tenantId, Long examId);

    List<ExamClassScope> findByTenantIdAndExamIdInAndIsDeletedFalse(String tenantId, Collection<Long> examIds);
}
