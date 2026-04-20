package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExamEventLogRepository extends JpaRepository<ExamEventLog, Long> {
    Page<ExamEventLog> findByTenantIdAndExamIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long examId, Pageable pageable);
}
