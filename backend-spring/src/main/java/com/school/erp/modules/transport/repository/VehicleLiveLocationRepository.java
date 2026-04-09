package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.VehicleLiveLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleLiveLocationRepository extends JpaRepository<VehicleLiveLocation, Long> {
    Optional<VehicleLiveLocation> findTopByTenantIdAndVehicleIdAndIsDeletedFalseOrderByRecordedAtDesc(String tenantId, Long vehicleId);
}
