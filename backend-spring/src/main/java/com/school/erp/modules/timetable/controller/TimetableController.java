package com.school.erp.modules.timetable.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.timetable.dto.TeacherScheduleOnboardingDTOs;
import com.school.erp.modules.timetable.dto.TeacherScheduleSlot;
import com.school.erp.modules.timetable.dto.TimetableDTOs;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.service.TeacherScheduleOnboardingService;
import com.school.erp.modules.timetable.service.TimetableService;
import com.school.erp.security.rbac.RbacSpel;
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
    private final TeacherScheduleOnboardingService onboardingService;

    @GetMapping
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get timetable entries by class and optional section", description = "When the class has no sections, pass sectionId omitted or null. Parents use GET /api/v1/parent/children/{studentId}/timetable (child-scoped).")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> get(@RequestParam Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByClassAndSection(classId, sectionId)));
    }

    @GetMapping("/grid")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get timetable as grid (day x period)", description = "Returns structured grid ready for UI rendering. Parents use GET /api/v1/parent/children/{studentId}/timetable/grid.")
    public ResponseEntity<ApiResponse<TimetableDTOs.TimetableGridResponse>> getGrid(@RequestParam Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getGrid(classId, sectionId)));
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get teacher schedule", description = "Recurring weekly slots. When forDate is set, merges active attendance-cover rows for that calendar day (virtual COVER slots override same weekday/period for display only).")
    public ResponseEntity<ApiResponse<List<TeacherScheduleSlot>>> getByTeacher(
            @PathVariable Long teacherId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate forDate) {
        return ResponseEntity.ok(ApiResponse.ok(service.getTeacherSchedule(teacherId, forDate)));
    }

    @PostMapping
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Create timetable entry", description = "Detects class-period and teacher double-booking conflicts (HTTP 409 + payload). Optional replaceTimetableEntryId soft-deletes the blocking row first.")
    public ResponseEntity<ApiResponse<TimetableEntry>> create(
            @RequestBody TimetableEntry entry,
            @RequestParam(required = false) Long replaceTimetableEntryId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createEntry(entry, replaceTimetableEntryId)));
    }

    @PostMapping("/batch")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Batch create entries")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> batchCreate(@RequestBody List<TimetableEntry> entries) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.batchCreate(entries)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Update timetable entry", description = "Same conflict rules as create; optional replaceTimetableEntryId removes another row after explicit user confirmation.")
    public ResponseEntity<ApiResponse<TimetableEntry>> update(
            @PathVariable Long id,
            @RequestBody TimetableEntry entry,
            @RequestParam(required = false) Long replaceTimetableEntryId) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateEntry(id, entry, replaceTimetableEntryId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Delete timetable entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.deleteEntry(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }

    @PostMapping("/onboarding/apply")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(
            summary = "Apply teacher schedule onboarding",
            description = "Single transaction: optional homeroom (class teacher) assignment plus recurring weekly slots. "
                    + "Use removeEntryIds to drop old rows before creating replacements. "
                    + "Homeroom authority is delegated to AcademicService (one homeroom slot per teacher).")
    public ResponseEntity<ApiResponse<TeacherScheduleOnboardingDTOs.ApplyResponse>> applyOnboarding(
            @RequestBody TeacherScheduleOnboardingDTOs.ApplyRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(onboardingService.apply(body)));
    }

    @PostMapping("/onboarding/validate")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(
            summary = "Validate teacher schedule onboarding (dry-run)",
            description = "Runs full onboarding conflict validation without mutating data. "
                    + "Returns all detected issues for the current DB snapshot so admins can confirm safely.")
    public ResponseEntity<ApiResponse<TeacherScheduleOnboardingDTOs.ValidateResponse>> validateOnboarding(
            @RequestBody TeacherScheduleOnboardingDTOs.ApplyRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(onboardingService.validate(body)));
    }

    public TimetableController(final TimetableService service, final TeacherScheduleOnboardingService onboardingService) {
        this.service = service;
        this.onboardingService = onboardingService;
    }
}
