package com.school.erp.modules.importexport.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.export.CsvExportSupport;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.modules.identity.service.SchoolCodeTenantResolver;
import com.school.erp.modules.importexport.dto.ImportExportDTOs;
import com.school.erp.modules.importexport.service.ImportJobNormalizedCsvExportService;
import com.school.erp.modules.importexport.service.ImportJobService;
import com.school.erp.modules.importexport.service.ImportMetricsQueryService;
import com.school.erp.modules.importexport.service.CanonicalExportJobService;
import com.school.erp.modules.student.service.StudentService;
import com.school.erp.modules.teacher.service.TeacherService;
import com.school.erp.security.rbac.RbacSpel;
import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/v1/import-export")
@Tag(name = "Import / Export", description = "Async bulk CSV, XLSX, or ZIP (CSV inside) jobs and CSV exports")
public class ImportExportController {
    private final ImportJobService importJobService;
    private final StudentService studentService;
    private final TeacherService teacherService;
    private final SchoolCodeTenantResolver schoolCodeTenantResolver;

    private final com.school.erp.modules.importexport.service.ImportDryRunService importDryRunService;
    private final com.school.erp.modules.importexport.service.ImportHeaderPreviewService importHeaderPreviewService;
    private final ImportMetricsQueryService importMetricsQueryService;
    private final ImportJobNormalizedCsvExportService importJobNormalizedCsvExportService;
    private final CanonicalExportJobService canonicalExportJobService;

    public ImportExportController(ImportJobService importJobService,
                                StudentService studentService,
                                TeacherService teacherService,
                                SchoolCodeTenantResolver schoolCodeTenantResolver,
                                com.school.erp.modules.importexport.service.ImportDryRunService importDryRunService,
                                com.school.erp.modules.importexport.service.ImportHeaderPreviewService importHeaderPreviewService,
                                ImportMetricsQueryService importMetricsQueryService,
                                ImportJobNormalizedCsvExportService importJobNormalizedCsvExportService,
                                CanonicalExportJobService canonicalExportJobService) {
        this.importJobService = importJobService;
        this.studentService = studentService;
        this.teacherService = teacherService;
        this.schoolCodeTenantResolver = schoolCodeTenantResolver;
        this.importDryRunService = importDryRunService;
        this.importHeaderPreviewService = importHeaderPreviewService;
        this.importMetricsQueryService = importMetricsQueryService;
        this.importJobNormalizedCsvExportService = importJobNormalizedCsvExportService;
        this.canonicalExportJobService = canonicalExportJobService;
    }

    @GetMapping("/metrics/summary")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Tenant import activity summary (last 24h) — complements Prometheus /actuator/metrics")
    public ResponseEntity<ApiResponse<ImportExportDTOs.ImportMetricsSummaryResponse>> importMetricsSummary(
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                importMetricsQueryService::tenantSummaryLast24Hours)));
    }

    @PostMapping(value = "/jobs/preview-headers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Read first-row headers and suggest canonical column mapping (wizard step)")
    public ResponseEntity<ApiResponse<ImportExportDTOs.FileHeaderPreviewResponse>> previewHeaders(
            @RequestParam("jobType") String jobType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importHeaderPreviewService.preview(file, jobType))));
    }

    @PostMapping(value = "/jobs/dry-run", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Validate import file without queueing a job (structure + class/section resolution)")
    public ResponseEntity<ApiResponse<ImportExportDTOs.DryRunResponse>> dryRun(
            @RequestParam("jobType") String jobType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "columnMappingJson", required = false) String columnMappingJson,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importDryRunService.validate(file, jobType, columnMappingJson))));
    }

    @PostMapping(value = "/jobs", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.SCHOOL_IMPORT_EXPORT_WRITE)
    @Operation(summary = "Submit async import job (CSV, XLSX, or ZIP containing typed CSV)")
    public ResponseEntity<ApiResponse<ImportExportDTOs.JobSubmitResponse>> submitJob(
            @RequestParam("jobType") String jobType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "columnMappingJson", required = false) String columnMappingJson,
            @RequestParam(value = "executionMode", required = false) String executionMode,
            @RequestParam(value = "reprocess", required = false, defaultValue = "false") boolean reprocess,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(runInImportTenant(schoolCode,
                        () -> importJobService.submit(file, jobType, columnMappingJson, executionMode, reprocess))));
    }

    private <T> T runInImportTenant(String schoolCode, Supplier<T> operation) {
        String originalTenant = TenantContext.getTenantId();
        String role = TenantContext.getUserRole();
        boolean isSuperAdmin = role != null && role.equalsIgnoreCase("SUPER_ADMIN");
        boolean hasSchoolCode = schoolCode != null && !schoolCode.isBlank();
        if (isSuperAdmin && !hasSchoolCode) {
            throw new BusinessException("Target school code is required for Super Admin import operations (for example: DPS-DLH).");
        }
        try {
            if (isSuperAdmin && hasSchoolCode) {
                String resolvedTenant = schoolCodeTenantResolver.resolveTenantIdStrict(schoolCode);
                TenantContext.setTenantId(resolvedTenant);
            }
            return operation.get();
        } finally {
            TenantContext.setTenantId(originalTenant);
        }
    }

    @GetMapping("/jobs")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "List import jobs")
    public ResponseEntity<ApiResponse<PageResponse<ImportExportDTOs.JobSummaryResponse>>> listJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importJobService.listJobs(page, size))));
    }

    @GetMapping("/jobs/{jobId}")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Get import job summary")
    public ResponseEntity<ApiResponse<ImportExportDTOs.JobSummaryResponse>> getJob(
            @PathVariable Long jobId,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importJobService.getJob(jobId))));
    }

    @GetMapping("/jobs/{jobId}/lines")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Paginated import line outcomes (payload + errors)")
    public ResponseEntity<ApiResponse<PageResponse<ImportExportDTOs.LineResponse>>> getLines(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importJobService.getLines(jobId, page, size))));
    }

    @GetMapping("/jobs/{jobId}/ledger")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Per-row ledger: created / updated / skipped for the job (replay and rollback context)")
    public ResponseEntity<ApiResponse<PageResponse<ImportExportDTOs.LedgerLineResponse>>> getLedger(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importJobService.getLedger(jobId, page, size))));
    }

    @GetMapping("/jobs/{jobId}/rollback-brief")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Guided rollback summary for operators (no automatic deletes)")
    public ResponseEntity<ApiResponse<ImportExportDTOs.RollbackBundleResponse>> getRollbackBrief(
            @PathVariable Long jobId,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importJobService.getRollbackBundle(jobId))));
    }

    @PostMapping("/jobs/{jobId}/retry-failed")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.SCHOOL_IMPORT_EXPORT_WRITE)
    @Operation(summary = "Re-queue failed rows for another async pass")
    public ResponseEntity<ApiResponse<ImportExportDTOs.JobSubmitResponse>> retryFailed(
            @PathVariable Long jobId,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode,
                () -> importJobService.retryFailed(jobId)), "Retry scheduled"));
    }

    @GetMapping(value = "/jobs/{jobId}/download-normalized-csv", produces = "text/csv")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_JOBS)
    @Operation(summary = "Download canonical enriched CSV for this job (round-trip template with resolved ids and entity truth)")
    public ResponseEntity<byte[]> downloadNormalizedJobCsv(
            @PathVariable Long jobId,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        byte[] body = runInImportTenant(schoolCode, () -> importJobNormalizedCsvExportService.buildNormalizedCsv(jobId));
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("import-job-" + jobId + "-normalized.csv", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(body);
    }

    @GetMapping(value = "/export/students.csv", produces = "text/csv")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_STUDENT_TEMPLATE_READ)
    @Operation(summary = "Download students as CSV (import template shape)")
    public ResponseEntity<byte[]> exportStudents() {
        byte[] body = CsvExportSupport.utf8BomBytes(studentService.exportStudentsAsCsv());
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("students-export-" + LocalDate.now() + ".csv", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(body);
    }

    @GetMapping(value = "/export/teachers.csv", produces = "text/csv")
    @RequireTenantFeature("importExport")
    @PreAuthorize(RbacSpel.IMPORT_EXPORT_TEACHER_DIRECTORY_EXPORT)
    @Operation(summary = "Download teachers/staff directory as CSV")
    public ResponseEntity<byte[]> exportTeachers() {
        byte[] body = CsvExportSupport.utf8BomBytes(teacherService.exportTeachersAsCsv());
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("teachers-export-" + LocalDate.now() + ".csv", StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(body);
    }

    @PostMapping("/export-jobs")
    @PreAuthorize(RbacSpel.CANONICAL_EXPORT_JOBS)
    @Operation(summary = "Create async canonical export job (students/teachers/staff/fee structures)")
    public ResponseEntity<ApiResponse<ImportExportDTOs.ExportJobSummaryResponse>> createExportJob(
            @RequestParam("exportType") String exportType,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(runInImportTenant(schoolCode, () -> canonicalExportJobService.createJob(exportType))));
    }

    @GetMapping("/export-jobs")
    @PreAuthorize(RbacSpel.CANONICAL_EXPORT_JOBS)
    @Operation(summary = "List canonical export jobs")
    public ResponseEntity<ApiResponse<PageResponse<ImportExportDTOs.ExportJobSummaryResponse>>> listExportJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode, () -> canonicalExportJobService.listJobs(page, size))));
    }

    @GetMapping("/export-jobs/{jobId}")
    @PreAuthorize(RbacSpel.CANONICAL_EXPORT_JOBS)
    @Operation(summary = "Get canonical export job status")
    public ResponseEntity<ApiResponse<ImportExportDTOs.ExportJobSummaryResponse>> getExportJob(
            @PathVariable Long jobId,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        return ResponseEntity.ok(ApiResponse.ok(runInImportTenant(schoolCode, () -> canonicalExportJobService.getJob(jobId))));
    }

    @GetMapping(value = "/export-jobs/{jobId}/download", produces = "text/csv")
    @PreAuthorize(RbacSpel.CANONICAL_EXPORT_JOBS)
    @Operation(summary = "Download canonical export CSV from completed job")
    public ResponseEntity<byte[]> downloadExportJob(
            @PathVariable Long jobId,
            @RequestParam(value = "schoolCode", required = false) String schoolCode) {
        byte[] body = runInImportTenant(schoolCode, () -> canonicalExportJobService.download(jobId));
        String fileName = runInImportTenant(schoolCode, () -> canonicalExportJobService.downloadFileName(jobId));
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(fileName, StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(body);
    }
}
