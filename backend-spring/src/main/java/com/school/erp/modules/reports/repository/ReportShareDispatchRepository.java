package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.ReportShareDispatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportShareDispatchRepository extends JpaRepository<ReportShareDispatch, Long> {
    Page<ReportShareDispatch> findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long reportJobId, Pageable pageable);
    List<ReportShareDispatch> findByStatusInAndIsDeletedFalseAndNextRetryAtIsNullOrderByCreatedAtAsc(List<String> statuses, Pageable pageable);
    List<ReportShareDispatch> findByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
            List<String> statuses, LocalDateTime retryBefore, Pageable pageable);
}
