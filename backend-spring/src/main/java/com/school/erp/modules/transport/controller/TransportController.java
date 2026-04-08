package com.school.erp.modules.transport.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.transport.dto.TransportDTOs;
import com.school.erp.modules.transport.entity.*;
import com.school.erp.modules.transport.service.TransportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController @RequestMapping("/api/v1/transport") @RequiredArgsConstructor
@Tag(name = "Transport", description = "Route Management, Student Assignment, Stops")
public class TransportController {
    private final TransportService service;

    @GetMapping("/routes") @Operation(summary = "List routes with stops and assigned students")
    public ResponseEntity<ApiResponse<List<TransportDTOs.RouteResponse>>> listRoutes() { return ResponseEntity.ok(ApiResponse.ok(service.getRoutes())); }

    @PostMapping("/routes") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Create route")
    public ResponseEntity<ApiResponse<TransportRoute>> createRoute(@RequestBody TransportRoute route) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createRoute(route))); }

    @PutMapping("/routes/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Update route")
    public ResponseEntity<ApiResponse<TransportRoute>> updateRoute(@PathVariable Long id, @RequestBody TransportRoute route) { return ResponseEntity.ok(ApiResponse.ok(service.updateRoute(id, route))); }

    @DeleteMapping("/routes/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Delete route")
    public ResponseEntity<ApiResponse<Void>> deleteRoute(@PathVariable Long id) { service.deleteRoute(id); return ResponseEntity.ok(ApiResponse.ok(null, "Deleted")); }

    @PostMapping("/stops") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Add stop to route")
    public ResponseEntity<ApiResponse<RouteStop>> addStop(@RequestBody RouteStop stop) { return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.addStop(stop))); }

    @DeleteMapping("/stops/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Remove stop")
    public ResponseEntity<ApiResponse<Void>> removeStop(@PathVariable Long id) { service.removeStop(id); return ResponseEntity.ok(ApiResponse.ok(null, "Removed")); }

    @PostMapping("/assign-student") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Assign student to route with pickup/drop stops")
    public ResponseEntity<ApiResponse<StudentTransportMapping>> assignStudent(@Valid @RequestBody TransportDTOs.AssignStudentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.assignStudent(req))); }

    @DeleteMapping("/student-mapping/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Remove student from route")
    public ResponseEntity<ApiResponse<Void>> removeStudent(@PathVariable Long id) { service.removeStudentFromRoute(id); return ResponseEntity.ok(ApiResponse.ok(null, "Removed")); }
}
