package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.TransportVehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportVehicleRepository extends JpaRepository<TransportVehicle, Long> {
    List<TransportVehicle> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<TransportVehicle> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
