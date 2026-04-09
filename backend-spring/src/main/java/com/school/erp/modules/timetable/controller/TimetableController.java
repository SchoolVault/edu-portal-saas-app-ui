package com.school.erp.modules.timetable.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.timetable.dto.TimetableDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.service.TimetableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/timetable")
@Tag(name = "Timetable", description = "Schedule Management with Conflict Detection")
public class TimetableController {
    private final TimetableService service;

    @GetMapping
    @Operation(summary = "Get timetable entries by class and section")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> get(@RequestParam Long classId, @RequestParam Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByClassAndSection(classId, sectionId)));
    }

    @GetMapping("/grid")
    @Operation(summary = "Get timetable as grid (day x period)", description = "Returns structured grid ready for UI rendering")
    public ResponseEntity<ApiResponse<TimetableDTOs.TimetableGridResponse>> getGrid(@RequestParam Long classId, @RequestParam Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getGrid(classId, sectionId)));
    }

    @GetMapping("/teacher/{teacherId}")
    @Operation(summary = "Get teacher\'s complete schedule")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> getByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByTeacher(teacherId)));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create timetable entry", description = "Auto-checks for class and teacher conflicts")
    public ResponseEntity<ApiResponse<TimetableEntry>> create(@RequestBody TimetableEntry entry) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createEntry(entry)));
    }

    @PostMapping("/batch")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Batch create entries")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> batchCreate(@RequestBody List<TimetableEntry> entries) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.batchCreate(entries)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Update timetable entry")
    public ResponseEntity<ApiResponse<TimetableEntry>> update(@PathVariable Long id, @RequestBody TimetableEntry entry) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateEntry(id, entry)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Delete timetable entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.deleteEntry(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    public TimetableController(final TimetableService service) {
        this.service = service;
    }
}
