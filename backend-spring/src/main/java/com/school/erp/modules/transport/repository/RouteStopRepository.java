package com.school.erp.modules.transport.repository;

import com.school.erp.modules.transport.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {
    List<RouteStop> findByTenantIdAndRouteIdOrderByStopOrder(String t, Long routeId);

    Optional<RouteStop> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);
}
