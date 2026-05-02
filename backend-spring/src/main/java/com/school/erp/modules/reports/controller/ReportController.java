package com.school.erp.modules.reports.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.dto.ReportModuleDTOs;
import com.school.erp.security.RequireTenantFeature;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@Tag(name = "Reports", description = "Report Generation APIs")
public class ReportController {
    private final com.school.erp.modules.reports.service.ReportService reportService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard KPIs", description = "Returns key performance indicators for admin dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardKPIs() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getDashboardKPIs()));
    }

    @GetMapping("/dashboard/admin")
    @PreAuthorize(RbacSpel.REPORT_LIBRARY_DESK)
    @Operation(summary = "Get admin dashboard", description = "Returns KPI, chart, activity, and upcoming event data for the admin dashboard")
    public ResponseEntity<ApiResponse<ReportDashboardDTOs.AdminDashboardResponse>> getAdminDashboard(
            @RequestParam(name = "attendanceOverviewScope", required = false) String attendanceOverviewScope) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getAdminDashboard(attendanceOverviewScope)));
    }

    @GetMapping("/dashboard/admin/recent-activities")
    @PreAuthorize(RbacSpel.REPORT_LIBRARY_DESK)
    @Operation(summary = "Get paged admin recent activity", description = "Server-side filtered/paginated admin dashboard recent activity stream")
    public ResponseEntity<ApiResponse<PageResponse<ReportDashboardDTOs.ActivityItem>>> getAdminRecentActivitiesPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.getAdminRecentActivitiesPaged(page, size, q, eventType, fromDate, toDate)));
    }

    @GetMapping("/dashboard/admin/upcoming-events")
    @PreAuthorize(RbacSpel.REPORT_LIBRARY_DESK)
    @Operation(summary = "Get paged admin upcoming events", description = "Server-side filtered/paginated admin dashboard upcoming events stream")
    public ResponseEntity<ApiResponse<PageResponse<ReportDashboardDTOs.UpcomingEvent>>> getAdminUpcomingEventsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        return ResponseEntity.ok(ApiResponse.ok(
                reportService.getAdminUpcomingEventsPaged(page, size, q, eventType, fromDate, toDate)));
    }

    @GetMapping("/dashboard/teacher")
    @PreAuthorize(RbacSpel.PORTAL_TEACHER_SELF)
    @Operation(summary = "Get teacher dashboard", description = "Returns schedule, workload, activity feed, and attendance charts for the current teacher. Optional month (YYYY-MM) scopes homeroom daily + ring breakdown.")
    public ResponseEntity<ApiResponse<ReportDashboardDTOs.TeacherDashboardResponse>> getTeacherDashboard(
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getTeacherDashboard(month)));
    }

    @GetMapping("/dashboard/parent")
    @PreAuthorize(RbacSpel.PORTAL_PARENT_SELF)
    @Operation(summary = "Get parent dashboard", description = "Aggregated KPIs, metric context, and activity feed for the guardian dashboard (same contract as frontend ParentDashboardData).")
    public ResponseEntity<ApiResponse<ParentDashboardDtos.Response>> getParentDashboard(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long childId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getParentDashboard(from, to, childId)));
    }

    @GetMapping("/student-performance")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Student performance report", description = "Class-wise student performance with marks, grades, and rankings")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> studentPerformance(
            @RequestParam Long classId,
            @RequestParam Long examId,
            @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getStudentPerformanceReport(classId, examId, sectionId)));
    }

    @GetMapping("/attendance-summary")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Attendance summary report", description = "Monthly attendance summary by class")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> attendanceSummary(
            @RequestParam Long classId,
            @RequestParam String month,
            @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getAttendanceSummary(classId, month, sectionId)));
    }

    @GetMapping("/fee-collection")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Fee collection report", description = "Fee collection status with pending and collected amounts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> feeCollection(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getFeeCollectionReport(classId, sectionId)));
    }

    @GetMapping("/class-summary")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Class summary report", description = "Overview of all classes with statistics")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> classSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getClassSummary()));
    }

    @GetMapping("/class-summary/paged")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Class summary report (paged)", description = "Same aggregates as class-summary; windowed for large tenants")
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> classSummaryPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getClassSummaryPaged(page, size)));
    }

    @GetMapping("/section-summary")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Section summary report", description = "Per-section student counts by class")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> sectionSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getSectionSummary()));
    }

    @GetMapping("/section-summary/paged")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Section summary report (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> sectionSummaryPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getSectionSummaryPaged(page, size)));
    }

    @GetMapping("/teacher-workload")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Teacher workload report", description = "Teacher teaching hours and class assignments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> teacherWorkload() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getTeacherWorkload()));
    }

    @GetMapping("/teacher-workload/paged")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Teacher workload report (paged)")
    public ResponseEntity<ApiResponse<PageResponse<Map<String, Object>>>> teacherWorkloadPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getTeacherWorkloadPaged(page, size)));
    }

    @GetMapping("/templates")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "List report templates")
    public ResponseEntity<ApiResponse<List<ReportModuleDTOs.TemplateResponse>>> listTemplates() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.listTemplates()));
    }

    @PostMapping("/templates")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Create / update report template")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.TemplateResponse>> upsertTemplate(@Valid @RequestBody ReportModuleDTOs.UpsertTemplateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.upsertTemplate(req)));
    }

    @PostMapping("/generate")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Generate a report file (PDF/CSV)")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.ReportJobResponse>> generate(@Valid @RequestBody ReportModuleDTOs.GenerateReportRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.generateReport(req)));
    }

    @PutMapping("/jobs/{jobId}/retry")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Retry failed report generation job")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.ReportJobResponse>> retryJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.retryReportJob(jobId)));
    }

    @GetMapping("/jobs")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "List generated report jobs (paged)")
    public ResponseEntity<ApiResponse<PageResponse<ReportModuleDTOs.ReportJobResponse>>> listJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.listGeneratedReports(page, size)));
    }

    @GetMapping("/jobs/{jobId}/download")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Download generated report")
    public ResponseEntity<byte[]> download(@PathVariable Long jobId) {
        var job = reportService.getGeneratedReportFile(jobId);
        byte[] content = reportService.getGeneratedReportContent(jobId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + (job.getFileName() != null ? job.getFileName() : "report.bin") + "\"")
                .header(HttpHeaders.CONTENT_TYPE, job.getContentType() != null ? job.getContentType() : "application/octet-stream")
                .body(content);
    }

    @GetMapping("/jobs/{jobId}/dispatches")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "List share dispatch rows for report job")
    public ResponseEntity<ApiResponse<PageResponse<ReportModuleDTOs.ShareDispatchResponse>>> listDispatches(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.listDispatches(jobId, page, size)));
    }

    @GetMapping("/jobs/{jobId}/events")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "List workflow event logs for report job")
    public ResponseEntity<ApiResponse<PageResponse<ReportModuleDTOs.WorkflowEventLogResponse>>> listWorkflowEvents(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.listWorkflowEvents(jobId, page, size)));
    }

    @PutMapping("/jobs/{jobId}/approve")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Approve report job for publication")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.ReportJobResponse>> approveJob(
            @PathVariable Long jobId,
            @RequestBody(required = false) ReportModuleDTOs.WorkflowActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.approveJob(jobId, req)));
    }

    @PutMapping("/jobs/{jobId}/publish")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Publish approved report job and create immutable snapshot")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.ReportJobResponse>> publishJob(
            @PathVariable Long jobId,
            @RequestBody(required = false) ReportModuleDTOs.WorkflowActionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.publishJob(jobId, req)));
    }

    @GetMapping("/jobs/{jobId}/snapshots")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "List immutable publication snapshots for report job")
    public ResponseEntity<ApiResponse<List<ReportModuleDTOs.PublicationSnapshotResponse>>> listSnapshots(@PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.listPublicationSnapshots(jobId)));
    }

    @PutMapping("/jobs/{jobId}/rollback")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Rollback report publication to a snapshot version")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.ReportJobResponse>> rollback(
            @PathVariable Long jobId,
            @Valid @RequestBody ReportModuleDTOs.RollbackSnapshotRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.rollbackToSnapshot(jobId, req)));
    }

    @GetMapping("/analytics-pack")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Get analytics pack with trend bands and promotion eligibility")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.AnalyticsPackResponse>> analyticsPack(
            @RequestParam(required = false) String packCode,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) Long sectionId,
            @RequestParam(required = false) Long examId,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getAnalyticsPack(packCode, classId, sectionId, examId, month)));
    }

    @GetMapping("/analytics-pack/configs")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "List analytics pack configurations")
    public ResponseEntity<ApiResponse<List<ReportModuleDTOs.AnalyticsPackConfigResponse>>> listAnalyticsPackConfigs() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.listAnalyticsPackConfigs()));
    }

    @PostMapping("/analytics-pack/configs")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Create or update analytics pack config with formula guardrails")
    public ResponseEntity<ApiResponse<ReportModuleDTOs.AnalyticsPackConfigResponse>> upsertAnalyticsPackConfig(
            @Valid @RequestBody ReportModuleDTOs.AnalyticsPackConfigRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.upsertAnalyticsPackConfig(req)));
    }

    @PostMapping("/jobs/process")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Process due report jobs now")
    public ResponseEntity<ApiResponse<Integer>> processJobs(@RequestParam(defaultValue = "20") int batchSize) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.processQueuedJobs(batchSize)));
    }

    @PostMapping("/dispatches/process")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Process due report share dispatches now")
    public ResponseEntity<ApiResponse<Integer>> processDispatches(@RequestParam(defaultValue = "50") int batchSize) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.processDispatches(batchSize)));
    }

    @PostMapping("/templates/seed-defaults")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Seed predefined report template packs")
    public ResponseEntity<ApiResponse<Integer>> seedDefaultPacks() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.seedDefaultPacks()));
    }

    @PostMapping("/dashboard/snapshots/warmup")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_WRITE)
    @Operation(summary = "Warm up dashboard snapshots", description = "Proactively regenerates dashboard snapshots for tenants")
    public ResponseEntity<ApiResponse<Integer>> warmupDashboardSnapshots(
            @RequestParam(defaultValue = "30") int tenantLimit) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.warmupDashboardSnapshots(tenantLimit)));
    }

    @GetMapping("/performance-metrics")
    @RequireTenantFeature("reports")
    @PreAuthorize(RbacSpel.SCHOOL_REPORTS_READ)
    @Operation(summary = "Report performance metrics", description = "Returns in-process report latency and snapshot hit/miss metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> performanceMetrics() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getPerformanceMetrics()));
    }

    public ReportController(final com.school.erp.modules.reports.service.ReportService reportService) {
        this.reportService = reportService;
    }
}
