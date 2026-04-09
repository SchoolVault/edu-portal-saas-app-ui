package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.TransportDriver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportDriverRepository extends JpaRepository<TransportDriver, Long> {
    List<TransportDriver> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<TransportDriver> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
