package com.school.erp.modules.transport.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.transport.dto.TransportDTOs;
import com.school.erp.modules.transport.entity.*;
import com.school.erp.modules.transport.service.TransportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transport")
@Tag(name = "Transport", description = "Route Management, Student Assignment, Stops")
@RequireTenantFeature("transport")
public class TransportController {
    private final TransportService service;

    @GetMapping("/routes")
    @Operation(summary = "List routes with stops and assigned students")
    public ResponseEntity<ApiResponse<List<TransportDTOs.RouteResponse>>> listRoutes() {
        return ResponseEntity.ok(ApiResponse.ok(service.getRoutes()));
    }

    @GetMapping("/routes/paged")
    @Operation(summary = "List routes (paged)", description = "Optional search on route name")
    public ResponseEntity<ApiResponse<PageResponse<TransportDTOs.RouteResponse>>> listRoutesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(ApiResponse.ok(service.getRoutesPaged(page, size, q)));
    }

    @PostMapping("/routes")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create route")
    public ResponseEntity<ApiResponse<TransportRoute>> createRoute(@RequestBody TransportRoute route) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createRoute(route)));
    }

    @PutMapping("/routes/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Update route")
    public ResponseEntity<ApiResponse<TransportRoute>> updateRoute(@PathVariable Long id, @RequestBody TransportRoute route) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateRoute(id, route)));
    }

    @DeleteMapping("/routes/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Delete route")
    public ResponseEntity<ApiResponse<Void>> deleteRoute(@PathVariable Long id) {
        service.deleteRoute(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @PostMapping("/stops")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Add stop to route")
    public ResponseEntity<ApiResponse<RouteStop>> addStop(@RequestBody RouteStop stop) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.addStop(stop)));
    }

    @DeleteMapping("/stops/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Remove stop")
    public ResponseEntity<ApiResponse<Void>> removeStop(@PathVariable Long id) {
        service.removeStop(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Removed"));
    }

    @PutMapping("/stops/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Update stop name, order, or time")
    public ResponseEntity<ApiResponse<RouteStop>> updateStop(@PathVariable Long id, @RequestBody RouteStop patch) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStop(id, patch)));
    }

    @PostMapping("/assign-student")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Assign student to route with pickup/drop stops")
    public ResponseEntity<ApiResponse<StudentTransportMapping>> assignStudent(@Valid @RequestBody TransportDTOs.AssignStudentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.assignStudent(req)));
    }

    @DeleteMapping("/student-mapping/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Remove student from route")
    public ResponseEntity<ApiResponse<Void>> removeStudent(@PathVariable Long id) {
        service.removeStudentFromRoute(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Removed"));
    }

    @GetMapping("/vehicles")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Fleet vehicles")
    public ResponseEntity<ApiResponse<List<com.school.erp.modules.transport.entity.TransportVehicle>>> listVehicles() {
        return ResponseEntity.ok(ApiResponse.ok(service.listVehicles()));
    }

    @PostMapping("/vehicles")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Register vehicle")
    public ResponseEntity<ApiResponse<com.school.erp.modules.transport.entity.TransportVehicle>> createVehicle(@RequestBody com.school.erp.modules.transport.entity.TransportVehicle vehicle) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createVehicle(vehicle)));
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Drivers")
    public ResponseEntity<ApiResponse<List<com.school.erp.modules.transport.entity.TransportDriver>>> listDrivers() {
        return ResponseEntity.ok(ApiResponse.ok(service.listDrivers()));
    }

    @PostMapping("/drivers")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Register driver")
    public ResponseEntity<ApiResponse<com.school.erp.modules.transport.entity.TransportDriver>> createDriver(@RequestBody com.school.erp.modules.transport.entity.TransportDriver driver) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createDriver(driver)));
    }

    @PostMapping("/vehicles/{vehicleId}/location")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Report GPS point (simulator / device gateway)")
    public ResponseEntity<ApiResponse<com.school.erp.modules.transport.entity.VehicleLiveLocation>> reportLocation(
            @PathVariable Long vehicleId,
            @RequestParam(required = false) Long routeId,
            @RequestParam BigDecimal lat,
            @RequestParam BigDecimal lng) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.reportLiveLocation(vehicleId, routeId, lat, lng)));
    }

    public TransportController(final TransportService service) {
        this.service = service;
    }
}
