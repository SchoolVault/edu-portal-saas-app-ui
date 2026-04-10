package com.school.erp.modules.attendance.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.attendance.dto.AttendanceCoverDTOs;
import com.school.erp.modules.attendance.service.AttendanceCoverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance/covers")
@Tag(name = "Attendance cover", description = "Substitute / cover assignments for attendance marking")
public class AttendanceCoverController {

    private final AttendanceCoverService coverService;

    public AttendanceCoverController(AttendanceCoverService coverService) {
        this.coverService = coverService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "List cover assignments for a date (teacher: own covers; admin: all)")
    public ResponseEntity<ApiResponse<List<AttendanceCoverDTOs.Response>>> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(coverService.listForDate(date)));
    }

    @GetMapping("/all-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: all active covers on a date")
    public ResponseEntity<ApiResponse<List<AttendanceCoverDTOs.Response>>> listAllActive(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(coverService.listAllActiveOnDate(date)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create cover assignment")
    public ResponseEntity<ApiResponse<AttendanceCoverDTOs.Response>> create(@Valid @RequestBody AttendanceCoverDTOs.CreateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(coverService.create(req)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cancel cover assignment")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable Long id) {
        coverService.cancel(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Cancelled"));
    }
}
