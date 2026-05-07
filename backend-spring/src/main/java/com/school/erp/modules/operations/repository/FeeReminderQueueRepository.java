package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.FeeReminderQueue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FeeReminderQueueRepository extends JpaRepository<FeeReminderQueue, Long> {

    List<FeeReminderQueue> findByTenantIdAndStatusAndIsDeletedFalseOrderByScheduledAtAsc(String tenantId, String status);

    Page<FeeReminderQueue> findByTenantIdAndStatusAndIsDeletedFalseOrderByScheduledAtAsc(String tenantId, String status, Pageable pageable);

    Page<FeeReminderQueue> findByTenantIdAndIsDeletedFalseOrderByScheduledAtAsc(String tenantId, Pageable pageable);

    Optional<FeeReminderQueue> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    @Query("""
            SELECT r FROM FeeReminderQueue r
            WHERE r.tenantId = :tenantId
              AND r.isDeleted = false
              AND (
                CAST(r.studentId AS string) LIKE CONCAT('%', :q, '%')
                OR LOWER(COALESCE(r.channel, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(r.status, '')) LIKE LOWER(CONCAT('%', :q, '%'))
              )
            ORDER BY r.scheduledAt ASC
            """)
    Page<FeeReminderQueue> searchByTenantAndQuery(
            @Param("tenantId") String tenantId,
            @Param("q") String q,
            Pageable pageable);
}
