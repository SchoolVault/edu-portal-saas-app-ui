package com.school.erp.modules.notification.repository;

import com.school.erp.modules.notification.entity.NotificationCampaign;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationCampaignRepository extends JpaRepository<NotificationCampaign, Long> {
    Page<NotificationCampaign> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Pageable pageable);
    Optional<NotificationCampaign> findByTenantIdAndCampaignIdAndIsDeletedFalse(String tenantId, String campaignId);
}
