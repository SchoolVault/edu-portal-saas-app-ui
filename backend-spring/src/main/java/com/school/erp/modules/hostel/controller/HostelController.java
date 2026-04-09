package com.school.erp.modules.hostel.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.entity.HostelRoom;
import com.school.erp.modules.hostel.service.HostelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/hostel")
@Tag(name = "Hostel", description = "Room Management, Student Allocation & Vacancy")
public class HostelController {
    private final HostelService service;

    @GetMapping("/rooms")
    @Operation(summary = "List rooms with current residents")
    public ResponseEntity<ApiResponse<List<HostelDTOs.RoomResponse>>> listRooms() {
        return ResponseEntity.ok(ApiResponse.ok(service.getRooms()));
    }

    @PostMapping("/rooms")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create room")
    public ResponseEntity<ApiResponse<HostelRoom>> createRoom(@RequestBody HostelRoom room) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createRoom(room)));
    }

    @PostMapping("/allocate")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Allocate student to room", description = "Checks capacity before allocation. Returns error if room is full.")
    public ResponseEntity<ApiResponse<HostelDTOs.AllocationDTO>> allocate(@Valid @RequestBody HostelDTOs.AllocateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.allocateStudent(req)));
    }

    @PutMapping("/vacate/{allocationId}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Vacate student from room", description = "Sets status to VACATED, decreases room occupancy")
    public ResponseEntity<ApiResponse<Void>> vacate(@PathVariable Long allocationId) {
        service.vacateStudent(allocationId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Student vacated"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Hostel statistics", description = "Total rooms, capacity, occupancy, available beds")
    public ResponseEntity<ApiResponse<HostelDTOs.HostelStats>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStats()));
    }

    public HostelController(final HostelService service) {
        this.service = service;
    }
}
