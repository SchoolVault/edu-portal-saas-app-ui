package com.school.erp.modules.transport.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.transport.entity.*;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*; import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/v1/transport") @RequiredArgsConstructor
@Tag(name = "Transport", description = "Transport Route & Vehicle Management")
public class TransportController {
    private final com.school.erp.modules.transport.repository.TransportRouteRepository routeRepo;
    private final com.school.erp.modules.transport.repository.RouteStopRepository stopRepo;
    @GetMapping("/routes") @Operation(summary = "List all routes")
    public ResponseEntity<ApiResponse<List<TransportRoute>>> listRoutes() { return ResponseEntity.ok(ApiResponse.ok(routeRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()))); }
    @PostMapping("/routes") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Create route")
    public ResponseEntity<ApiResponse<TransportRoute>> createRoute(@RequestBody TransportRoute r) { r.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(routeRepo.save(r))); }
    @GetMapping("/routes/{routeId}/stops") @Operation(summary = "Get route stops")
    public ResponseEntity<ApiResponse<List<RouteStop>>> getStops(@PathVariable Long routeId) { return ResponseEntity.ok(ApiResponse.ok(stopRepo.findByTenantIdAndRouteIdOrderByStopOrder(TenantContext.getTenantId(), routeId))); }
    @PostMapping("/stops") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Add stop to route")
    public ResponseEntity<ApiResponse<RouteStop>> addStop(@RequestBody RouteStop s) { s.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(stopRepo.save(s))); }
}
