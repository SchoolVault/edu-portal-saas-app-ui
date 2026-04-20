package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.ReportPublicationSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportPublicationSnapshotRepository extends JpaRepository<ReportPublicationSnapshot, Long> {
    List<ReportPublicationSnapshot> findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByVersionNoDesc(String tenantId, Long reportJobId);
    Optional<ReportPublicationSnapshot> findByTenantIdAndReportJobIdAndVersionNoAndIsDeletedFalse(String tenantId, Long reportJobId, Integer versionNo);
}
