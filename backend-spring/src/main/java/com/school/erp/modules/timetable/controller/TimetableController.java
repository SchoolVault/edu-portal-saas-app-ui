package com.school.erp.modules.timetable.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.timetable.dto.TeacherScheduleSlot;
import com.school.erp.modules.timetable.dto.TimetableDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.service.TimetableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/timetable")
@Tag(name = "Timetable", description = "Schedule Management with Conflict Detection")
public class TimetableController {
    private final TimetableService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "Get timetable entries by class and optional section", description = "When the class has no sections, pass sectionId omitted or null. Parents use GET /api/v1/parent/children/{studentId}/timetable (child-scoped).")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> get(@RequestParam Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByClassAndSection(classId, sectionId)));
    }

    @GetMapping("/grid")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "Get timetable as grid (day x period)", description = "Returns structured grid ready for UI rendering. Parents use GET /api/v1/parent/children/{studentId}/timetable/grid.")
    public ResponseEntity<ApiResponse<TimetableDTOs.TimetableGridResponse>> getGrid(@RequestParam Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getGrid(classId, sectionId)));
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "Get teacher schedule", description = "Recurring weekly slots. When forDate is set, merges active attendance-cover rows for that calendar day (virtual COVER slots override same weekday/period for display only).")
    public ResponseEntity<ApiResponse<List<TeacherScheduleSlot>>> getByTeacher(
            @PathVariable Long teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate forDate) {
        return ResponseEntity.ok(ApiResponse.ok(service.getTeacherSchedule(teacherId, forDate)));
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
