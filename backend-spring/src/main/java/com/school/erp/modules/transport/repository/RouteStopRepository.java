package com.school.erp.modules.transport.repository;
import com.school.erp.modules.transport.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.List;
public interface RouteStopRepository extends JpaRepository<RouteStop, Long> { List<RouteStop> findByTenantIdAndRouteIdOrderByStopOrder(String t, Long routeId); }
