package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.ReportTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, Long> {
    List<ReportTemplate> findByTenantIdAndIsDeletedFalseOrderByNameAsc(String tenantId);
    Optional<ReportTemplate> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<ReportTemplate> findByTenantIdAndTemplateCodeAndIsDeletedFalse(String tenantId, String templateCode);
}
