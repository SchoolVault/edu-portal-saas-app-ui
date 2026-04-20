package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamBulkOperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

public interface ExamBulkOperationLogRepository extends JpaRepository<ExamBulkOperationLog, Long> {
    Optional<ExamBulkOperationLog> findByTenantIdAndOperationTypeAndRequestIdAndIsDeletedFalse(String tenantId, String operationType, String requestId);
    Page<ExamBulkOperationLog> findByTenantIdAndExamIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long examId, Pageable pageable);
}
