package com.school.erp.modules.notification.repository;

import com.school.erp.modules.notification.entity.NotificationCampaignTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationCampaignTemplateRepository extends JpaRepository<NotificationCampaignTemplate, Long> {
    List<NotificationCampaignTemplate> findByTenantIdAndIsDeletedFalseOrderByUpdatedAtDesc(String tenantId);
    Optional<NotificationCampaignTemplate> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
    Optional<NotificationCampaignTemplate> findByTenantIdAndEventTypeAndChannelAndLocaleCodeAndStatusAndIsDeletedFalse(
            String tenantId,
            String eventType,
            String channel,
            String localeCode,
            String status);
}
