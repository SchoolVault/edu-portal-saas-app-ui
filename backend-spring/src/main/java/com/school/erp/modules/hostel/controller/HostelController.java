package com.school.erp.modules.hostel.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.entity.Hostel;
import com.school.erp.modules.hostel.entity.HostelRoom;
import com.school.erp.modules.hostel.service.HostelService;
import com.school.erp.security.rbac.RbacSpel;
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
@RequireTenantFeature("hostel")
public class HostelController {
    private final HostelService service;

    @GetMapping("/buildings")
    @Operation(summary = "Hostel buildings with live availability summary")
    public ResponseEntity<ApiResponse<List<HostelDTOs.HostelSummary>>> listBuildings() {
        return ResponseEntity.ok(ApiResponse.ok(service.listHostels()));
    }

    @PostMapping("/buildings")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Create hostel building (e.g. Boys BH1)")
    public ResponseEntity<ApiResponse<Hostel>> createBuilding(@RequestBody Hostel hostel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createHostel(hostel)));
    }

    @GetMapping("/rooms")
    @Operation(summary = "List rooms with current residents")
    public ResponseEntity<ApiResponse<List<HostelDTOs.RoomResponse>>> listRooms() {
        return ResponseEntity.ok(ApiResponse.ok(service.getRooms()));
    }

    @GetMapping("/rooms/paged")
    @Operation(summary = "List rooms (paged)")
    public ResponseEntity<ApiResponse<PageResponse<HostelDTOs.RoomResponse>>> listRoomsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getRoomsPaged(page, size)));
    }

    @PostMapping("/rooms")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Create room")
    public ResponseEntity<ApiResponse<HostelRoom>> createRoom(@RequestBody HostelRoom room) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createRoom(room)));
    }

    @PutMapping("/rooms/{id}")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Update room metadata", description = "Hostel, block, floor, room number, type, capacity (cannot drop below occupancy)")
    public ResponseEntity<ApiResponse<HostelRoom>> updateRoom(@PathVariable Long id, @RequestBody HostelRoom patch) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateRoom(id, patch)));
    }

    @PostMapping("/allocate")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
    @Operation(summary = "Allocate student to room", description = "Checks capacity before allocation. Returns error if room is full.")
    public ResponseEntity<ApiResponse<HostelDTOs.AllocationDTO>> allocate(@Valid @RequestBody HostelDTOs.AllocateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.allocateStudent(req)));
    }

    @PutMapping("/vacate/{allocationId}")
    @PreAuthorize(RbacSpel.HOSTEL_DESK_WRITE)
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
