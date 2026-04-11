package com.school.erp.modules.notification.repository;

import com.school.erp.modules.notification.entity.NotificationOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    List<NotificationOutbox> findTop100ByStatusAndIsDeletedFalseOrderByCreatedAtAsc(String status);

    boolean existsByTenantIdAndDedupeKeyAndIsDeletedFalse(String tenantId, String dedupeKey);
}
