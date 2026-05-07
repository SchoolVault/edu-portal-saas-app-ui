package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.TransportOpsException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TransportOpsExceptionRepository extends JpaRepository<TransportOpsException, Long> {
    Optional<TransportOpsException> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    Page<TransportOpsException> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    Page<TransportOpsException> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, String status, Pageable pageable);

    List<TransportOpsException> findByTenantIdAndStatusAndIsDeletedFalse(String tenantId, String status);

    List<TransportOpsException> findByTenantIdAndEventOccurredAtBeforeAndIsDeletedFalse(String tenantId, Instant cutoff);
}
