package com.school.erp.modules.exams.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.dto.ExamScopeDtos;
import com.school.erp.modules.exams.service.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exams")
@Tag(name = "Exams", description = "Exam Management, Marks Entry, Report Cards")
public class ExamController {
    private final ExamService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "List all exams (school staff)", description = "Parents use GET /api/v1/parent/exams — scoped to linked children only.")
    public ResponseEntity<ApiResponse<List<ExamDTOs.ExamResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.getExams()));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "List exams (paged)", description = "Optional q (name) and status (UPCOMING, ONGOING, COMPLETED, CANCELLED).")
    public ResponseEntity<ApiResponse<PageResponse<ExamDTOs.ExamResponse>>> listPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.getExamsPaged(page, size, q, status)));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create exam")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> create(@Valid @RequestBody ExamDTOs.CreateExamRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createExam(req)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Update exam status", description = "Change status: UPCOMING, ONGOING, COMPLETED, CANCELLED")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateExamStatus(id, status)));
    }

    @PutMapping("/{id}/publish-results")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Publish or hide results for parents/students", description = "School admin only — avoids premature parent visibility.")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> publishResults(@PathVariable Long id, @RequestParam boolean published) {
        return ResponseEntity.ok(ApiResponse.ok(service.setResultsPublished(id, published)));
    }

    @GetMapping("/{examId}/marks-entry-scope")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\',\'SUPER_ADMIN\')")
    @Operation(summary = "Marks entry scope for current teacher", description = "Class/section/subject rows derived from subject-teacher assignments (admin: empty list).")
    public ResponseEntity<ApiResponse<List<ExamScopeDtos.MarksEntryScopeRow>>> marksEntryScope(@PathVariable Long examId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMarksEntryScope(examId)));
    }

    @GetMapping("/{examId}/marks")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\',\'SUPER_ADMIN\')")
    @Operation(summary = "Get marks by exam")
    public ResponseEntity<ApiResponse<List<ExamDTOs.MarkResponse>>> getMarksByExam(@PathVariable Long examId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMarksByExam(examId)));
    }

    @GetMapping("/marks/student/{studentId}")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\',\'SUPER_ADMIN\')")
    @Operation(summary = "Get all marks for a student across exams")
    public ResponseEntity<ApiResponse<List<ExamDTOs.MarkResponse>>> getMarksByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMarksByStudent(studentId)));
    }

    @PostMapping("/marks")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Save marks (batch)", description = "Enter marks for multiple students in one subject")
    public ResponseEntity<ApiResponse<List<ExamDTOs.MarkResponse>>> saveMarks(@Valid @RequestBody ExamDTOs.BulkMarksRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.saveMarks(req), "Marks saved"));
    }

    @GetMapping("/{examId}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "Exam timetable (full, staff)", description = "Parents use GET /api/v1/parent/children/{studentId}/exams/{examId}/schedule for scoped rows.")
    public ResponseEntity<ApiResponse<List<ExamScopeDtos.ScheduleSlotOut>>> getSchedule(@PathVariable Long examId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getSchedule(examId)));
    }

    @PutMapping("/{examId}/schedule")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Replace exam timetable", description = "Replaces all schedule rows for the exam (idempotent full replace)")
    public ResponseEntity<ApiResponse<List<ExamScopeDtos.ScheduleSlotOut>>> replaceSchedule(
            @PathVariable Long examId,
            @RequestBody ExamScopeDtos.ReplaceScheduleRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(service.replaceSchedule(examId, body != null ? body : new ExamScopeDtos.ReplaceScheduleRequest()), "Schedule updated"));
    }

    @GetMapping("/report-card/{studentId}")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\',\'SUPER_ADMIN\',\'PARENT\')")
    @Operation(summary = "Get student report card", description = "Complete report card with all subjects, totals, and grade")
    public ResponseEntity<ApiResponse<ExamDTOs.ReportCardResponse>> reportCard(@PathVariable Long studentId, @RequestParam(required = false) Long examId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getReportCard(studentId, examId)));
    }

    public ExamController(final ExamService service) {
        this.service = service;
    }
}
