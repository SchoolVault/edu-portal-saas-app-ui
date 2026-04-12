package com.school.erp.modules.notification.repository;

import com.school.erp.modules.notification.entity.NotificationOutbox;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    List<NotificationOutbox> findTop100ByStatusAndIsDeletedFalseOrderByCreatedAtAsc(String status);

    boolean existsByTenantIdAndDedupeKeyAndIsDeletedFalse(String tenantId, String dedupeKey);

    long countByTenantIdAndRecipientUserIdAndEventTypeAndCreatedAtAfterAndIsDeletedFalse(
            String tenantId, Long recipientUserId, String eventType, LocalDateTime after);
}
