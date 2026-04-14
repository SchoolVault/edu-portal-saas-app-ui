package com.school.erp.modules.operations.repository;

import com.school.erp.modules.operations.entity.FeeReminderQueue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeeReminderQueueRepository extends JpaRepository<FeeReminderQueue, Long> {

    List<FeeReminderQueue> findByTenantIdAndStatusAndIsDeletedFalseOrderByScheduledAtAsc(String tenantId, String status);

    Page<FeeReminderQueue> findByTenantIdAndStatusAndIsDeletedFalseOrderByScheduledAtAsc(String tenantId, String status, Pageable pageable);

    Page<FeeReminderQueue> findByTenantIdAndIsDeletedFalseOrderByScheduledAtAsc(String tenantId, Pageable pageable);

    Optional<FeeReminderQueue> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
