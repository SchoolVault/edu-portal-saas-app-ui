package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.ReportGenerationJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReportGenerationJobRepository extends JpaRepository<ReportGenerationJob, Long> {
    Page<ReportGenerationJob> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Pageable pageable);
    Optional<ReportGenerationJob> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<ReportGenerationJob> findByTenantIdAndRequestIdAndIsDeletedFalse(String tenantId, String requestId);
    List<ReportGenerationJob> findByStatusInAndIsDeletedFalseAndScheduleAtLessThanEqualOrderByScheduleAtAscCreatedAtAsc(
            List<String> statuses, LocalDateTime scheduleAt, Pageable pageable);
    List<ReportGenerationJob> findByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
            List<String> statuses, LocalDateTime retryAt, Pageable pageable);
}
