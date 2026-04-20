package com.school.erp.modules.exams.repository;

import com.school.erp.modules.exams.entity.ExamNotificationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

public interface ExamNotificationJobRepository extends JpaRepository<ExamNotificationJob, Long> {
    Page<ExamNotificationJob> findByTenantIdAndExamIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long examId, Pageable pageable);
    List<ExamNotificationJob> findByStatusInAndIsDeletedFalseAndNextRetryAtIsNullOrderByCreatedAtAsc(List<String> statuses, Pageable pageable);
    List<ExamNotificationJob> findByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
            List<String> statuses, LocalDateTime retryBefore, Pageable pageable);
}
