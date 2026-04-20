package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.ReportAnalyticsPackConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportAnalyticsPackConfigRepository extends JpaRepository<ReportAnalyticsPackConfig, Long> {
    Optional<ReportAnalyticsPackConfig> findByTenantIdAndPackCodeAndIsDeletedFalse(String tenantId, String packCode);
    List<ReportAnalyticsPackConfig> findByTenantIdAndIsDeletedFalseOrderByPackCodeAsc(String tenantId);
}
