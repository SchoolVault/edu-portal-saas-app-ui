package com.school.erp.modules.notification.repository;

import com.school.erp.modules.notification.entity.NotificationOutbox;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    List<NotificationOutbox> findTop100ByStatusAndIsDeletedFalseOrderByCreatedAtAsc(String status);

    List<NotificationOutbox> findTop100ByStatusInAndIsDeletedFalseAndNextRetryAtIsNullOrderByCreatedAtAsc(List<String> statuses);

    List<NotificationOutbox> findTop100ByStatusInAndIsDeletedFalseAndNextRetryAtLessThanEqualOrderByNextRetryAtAscCreatedAtAsc(
            List<String> statuses, LocalDateTime now);

    boolean existsByTenantIdAndDedupeKeyAndIsDeletedFalse(String tenantId, String dedupeKey);

    long countByTenantIdAndRecipientUserIdAndEventTypeAndCreatedAtAfterAndIsDeletedFalse(
            String tenantId, Long recipientUserId, String eventType, LocalDateTime after);

    @Query("""
            select coalesce(sum(coalesce(n.channelCostMinor, 0)), 0)
            from NotificationOutbox n
            where n.tenantId = :tenantId and n.isDeleted = false and n.createdAt >= :after
            """)
    long sumChannelCostMinorByTenantSince(@Param("tenantId") String tenantId, @Param("after") LocalDateTime after);

    Optional<NotificationOutbox> findByTenantIdAndCorrelationIdAndIsDeletedFalse(String tenantId, String correlationId);
}
