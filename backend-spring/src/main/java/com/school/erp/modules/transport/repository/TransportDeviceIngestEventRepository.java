package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.TransportDeviceIngestEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TransportDeviceIngestEventRepository extends JpaRepository<TransportDeviceIngestEvent, Long> {
    Optional<TransportDeviceIngestEvent> findByTenantIdAndIdempotencyKeyAndIsDeletedFalse(String tenantId, String idempotencyKey);

    Optional<TransportDeviceIngestEvent> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    List<TransportDeviceIngestEvent> findTop50ByTenantIdAndProcessingStatusAndIsDeletedFalseOrderByOccurredAtAsc(String tenantId, String processingStatus);

    List<TransportDeviceIngestEvent> findByTenantIdAndProcessingStatusAndIsDeletedFalseOrderByOccurredAtAsc(String tenantId, String processingStatus);

    List<TransportDeviceIngestEvent> findByTenantIdAndOccurredAtBeforeAndIsDeletedFalse(String tenantId, Instant cutoff);
}
