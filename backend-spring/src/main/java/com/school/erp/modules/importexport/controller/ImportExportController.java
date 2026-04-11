package com.school.erp.modules.importexport.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.service.ImportJobService;
import com.school.erp.modules.student.service.StudentService;
import com.school.erp.modules.teacher.service.TeacherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/import-export")
@Tag(name = "Import / Export", description = "Async bulk ZIP+CSV jobs and CSV exports")
public class ImportExportController {
    private final ImportJobService importJobService;
    private final StudentService studentService;
    private final TeacherService teacherService;

    public ImportExportController(ImportJobService importJobService,
                                StudentService studentService,
                                TeacherService teacherService) {
        this.importJobService = importJobService;
        this.studentService = studentService;
        this.teacherService = teacherService;
    }

    @PostMapping(value = "/jobs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Submit async import job (ZIP with typed CSV)")
    public ResponseEntity<ApiResponse<ImportExportDTOs.JobSubmitResponse>> submitJob(
            @RequestParam("jobType") String jobType,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(importJobService.submit(file, jobType)));
    }

    @GetMapping("/jobs")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "List import jobs")
    public ResponseEntity<ApiResponse<PageResponse<ImportExportDTOs.JobSummaryResponse>>> listJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(importJobService.listJobs(page, size)));
    }

    @GetMapping("/jobs/{jobId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Get import job summary")
    public ResponseEntity<ApiResponse<ImportExportDTOs.JobSummaryResponse>> getJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(importJobService.getJob(jobId)));
    }

    @GetMapping("/jobs/{jobId}/lines")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Paginated import line outcomes (payload + errors)")
    public ResponseEntity<ApiResponse<PageResponse<ImportExportDTOs.LineResponse>>> getLines(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.ok(importJobService.getLines(jobId, page, size)));
    }

    @PostMapping("/jobs/{jobId}/retry-failed")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Re-queue failed rows for another async pass")
    public ResponseEntity<ApiResponse<ImportExportDTOs.JobSubmitResponse>> retryFailed(@PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(importJobService.retryFailed(jobId), "Retry scheduled"));
    }

    @GetMapping(value = "/export/students.csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','SUPER_ADMIN')")
    @Operation(summary = "Download students as CSV (import template shape)")
    public ResponseEntity<byte[]> exportStudents() {
        byte[] body = studentService.exportStudentsAsCsv().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"students-export.csv\"")
                .body(body);
    }

    @GetMapping(value = "/export/teachers.csv", produces = "text/csv")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Download teachers/staff directory as CSV")
    public ResponseEntity<byte[]> exportTeachers() {
        byte[] body = teacherService.exportTeachersAsCsv().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"teachers-export.csv\"")
                .body(body);
    }
}
