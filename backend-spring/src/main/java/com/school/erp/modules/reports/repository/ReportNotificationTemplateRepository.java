package com.school.erp.modules.reports.repository;

import com.school.erp.modules.reports.entity.ReportNotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportNotificationTemplateRepository extends JpaRepository<ReportNotificationTemplate, Long> {
    Optional<ReportNotificationTemplate> findByTenantIdAndTemplateCodeAndTargetRoleAndLocaleCodeAndChannelAndIsDeletedFalse(
            String tenantId, String templateCode, String targetRole, String localeCode, String channel);
    List<ReportNotificationTemplate> findByTenantIdAndIsDeletedFalseOrderByTemplateCodeAsc(String tenantId);
}
