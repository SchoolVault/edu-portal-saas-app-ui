package com.school.erp.modules.exams.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.dto.ExamScopeDtos;
import com.school.erp.modules.exams.service.ExamService;
import com.school.erp.security.RequireTenantFeature;
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
@RequireTenantFeature("exams")
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
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "Create exam")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> create(@Valid @RequestBody ExamDTOs.CreateExamRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createExam(req)));
    }

    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "List exam templates")
    public ResponseEntity<ApiResponse<List<ExamDTOs.TemplateResponse>>> listTemplates() {
        return ResponseEntity.ok(ApiResponse.ok(service.listTemplates()));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Create/update exam template")
    public ResponseEntity<ApiResponse<ExamDTOs.TemplateResponse>> upsertTemplate(@RequestBody ExamDTOs.UpsertTemplateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.upsertTemplate(req)));
    }

    @PutMapping("/{id}/submit-approval")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "Submit exam for approval")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> submitApproval(
            @PathVariable Long id,
            @RequestBody(required = false) ExamDTOs.WorkflowActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.submitExamForApproval(id, req)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Approve exam")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ExamDTOs.WorkflowActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.approveExam(id, req)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Reject exam")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ExamDTOs.WorkflowActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.rejectExam(id, req)));
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Publish / unpublish exam workflow")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> publish(
            @PathVariable Long id,
            @RequestParam boolean published,
            @RequestBody(required = false) ExamDTOs.WorkflowActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.setExamPublished(id, published, req)));
    }

    @GetMapping("/{id}/publications")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "List exam publication snapshots")
    public ResponseEntity<ApiResponse<List<ExamDTOs.PublicationSnapshotResponse>>> listSnapshots(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.listPublicationSnapshots(id)));
    }

    @PutMapping("/{id}/rollback")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Rollback exam config to snapshot version")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> rollback(
            @PathVariable Long id,
            @Valid @RequestBody ExamDTOs.RollbackToVersionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.rollbackToSnapshot(id, req)));
    }

    @GetMapping("/{id}/events")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "List exam event logs (paged)")
    public ResponseEntity<ApiResponse<PageResponse<ExamDTOs.ExamEventLogResponse>>> listEvents(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.listExamEvents(id, page, size)));
    }

    @GetMapping("/{id}/notification-jobs")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "List exam notification jobs (paged)")
    public ResponseEntity<ApiResponse<PageResponse<ExamDTOs.NotificationJobResponse>>> listNotificationJobs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.listExamNotificationJobs(id, page, size)));
    }

    @GetMapping("/{id}/bulk-operations")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "List exam bulk operation logs (paged)")
    public ResponseEntity<ApiResponse<PageResponse<ExamDTOs.BulkOperationLogResponse>>> listBulkOperations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.listExamBulkOps(id, page, size)));
    }

    @PostMapping("/notification-jobs/process")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Manually process pending exam notification jobs")
    public ResponseEntity<ApiResponse<Integer>> processNotificationJobs(
            @RequestParam(defaultValue = "25") int batchSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.processPendingNotificationJobs(batchSize)));
    }

    @PutMapping("/{id}/freeze")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Freeze exam edits")
    public ResponseEntity<ApiResponse<ExamDTOs.ExamResponse>> freeze(
            @PathVariable Long id,
            @RequestBody(required = false) ExamDTOs.WorkflowActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.freezeExam(id, req)));
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
