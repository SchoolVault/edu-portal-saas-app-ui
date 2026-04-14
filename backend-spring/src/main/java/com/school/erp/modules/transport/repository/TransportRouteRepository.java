package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.TransportRoute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportRouteRepository extends JpaRepository<TransportRoute, Long> {
    List<TransportRoute> findByTenantIdAndIsDeletedFalse(String t);

    Page<TransportRoute> findByTenantIdAndIsDeletedFalse(String t, Pageable pageable);

    Page<TransportRoute> findByTenantIdAndIsDeletedFalseAndNameContainingIgnoreCase(String t, String q, Pageable pageable);

    Optional<TransportRoute> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
