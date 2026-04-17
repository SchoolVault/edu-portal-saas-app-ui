package com.school.erp.modules.notification.repository;
import com.school.erp.modules.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTenantIdAndUserIdOrderByCreatedAtDesc(String tenantId, Long userId);

    Page<Notification> findByTenantIdAndUserIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId, Long userId, Pageable pageable);

    long countByTenantIdAndUserIdAndIsReadFalse(String tenantId, Long userId);

    Optional<Notification> findByIdAndTenantIdAndUserIdAndIsDeletedFalse(Long id, String tenantId, Long userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.tenantId = :tenantId AND n.isDeleted = true AND n.deletedAt IS NOT NULL AND n.deletedAt < :cutoff")
    int deleteSoftDeletedBeforeForTenant(@Param("tenantId") String tenantId, @Param("cutoff") LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Notification n SET n.isDeleted = true, n.deletedAt = :now
            WHERE n.tenantId = :tenantId AND n.isDeleted = false AND n.createdAt < :cutoff
            """)
    int softDeleteTenantNotificationsOlderThan(
            @Param("tenantId") String tenantId,
            @Param("cutoff") LocalDateTime cutoff,
            @Param("now") LocalDateTime now);
}
