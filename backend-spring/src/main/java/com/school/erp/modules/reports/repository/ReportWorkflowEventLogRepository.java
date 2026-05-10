package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.ReportWorkflowEventLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportWorkflowEventLogRepository extends JpaRepository<ReportWorkflowEventLog, Long> {
    Page<ReportWorkflowEventLog> findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByOccurredAtDesc(String tenantId, Long reportJobId, Pageable pageable);
}
