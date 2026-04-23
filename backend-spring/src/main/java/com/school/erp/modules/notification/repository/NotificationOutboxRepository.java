package com.school.erp.modules.notification.repository;

import com.school.erp.modules.notification.entity.NotificationOutbox;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
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
    Optional<NotificationOutbox> findByTenantIdAndProviderMessageIdAndIsDeletedFalse(String tenantId, String providerMessageId);
    long countByTenantIdAndIsDeletedFalseAndCorrelationIdStartingWith(String tenantId, String correlationPrefix);

    @Query("""
            select n.status, count(n)
            from NotificationOutbox n
            where n.tenantId = :tenantId
              and n.isDeleted = false
              and n.correlationId like concat(:campaignId, '-%')
            group by n.status
            """)
    List<Object[]> aggregateStatusCountsByCampaign(@Param("tenantId") String tenantId, @Param("campaignId") String campaignId);

    @Query("""
            select n
            from NotificationOutbox n
            where n.tenantId = :tenantId
              and n.isDeleted = false
              and n.correlationId like concat(:campaignId, '-%')
            order by n.createdAt desc
            """)
    List<NotificationOutbox> findRecentByCampaign(
            @Param("tenantId") String tenantId,
            @Param("campaignId") String campaignId,
            Pageable pageable);
    Page<NotificationOutbox> findByTenantIdAndStatusAndIsDeletedFalseOrderByDeadLetteredAtDesc(
            String tenantId,
            String status,
            Pageable pageable);
    Optional<NotificationOutbox> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Modifying
    @Query("""
            update NotificationOutbox n
            set n.status = :processingStatus,
                n.nextRetryAt = null,
                n.updatedAt = :now
            where n.id = :id
              and n.isDeleted = false
              and n.status in :claimableStatuses
              and (n.nextRetryAt is null or n.nextRetryAt <= :now)
            """)
    int claimForProcessing(
            @Param("id") Long id,
            @Param("processingStatus") String processingStatus,
            @Param("claimableStatuses") List<String> claimableStatuses,
            @Param("now") LocalDateTime now);
}
