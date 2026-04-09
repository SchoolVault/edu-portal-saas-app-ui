package com.school.erp.modules.reports.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Get admin dashboard", description = "Returns KPI, chart, activity, and upcoming event data for the admin dashboard")
    public ResponseEntity<ApiResponse<ReportDashboardDTOs.AdminDashboardResponse>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getAdminDashboard()));
    }

    @GetMapping("/dashboard/teacher")
    @PreAuthorize("hasRole(\'TEACHER\')")
    @Operation(summary = "Get teacher dashboard", description = "Returns schedule and workload summaries for the current teacher")
    public ResponseEntity<ApiResponse<ReportDashboardDTOs.TeacherDashboardResponse>> getTeacherDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getTeacherDashboard()));
    }

    @GetMapping("/student-performance")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Student performance report", description = "Class-wise student performance with marks, grades, and rankings")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> studentPerformance(@RequestParam Long classId, @RequestParam Long examId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getStudentPerformanceReport(classId, examId)));
    }

    @GetMapping("/attendance-summary")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Attendance summary report", description = "Monthly attendance summary by class")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> attendanceSummary(@RequestParam Long classId, @RequestParam String month) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getAttendanceSummary(classId, month)));
    }

    @GetMapping("/fee-collection")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Fee collection report", description = "Fee collection status with pending and collected amounts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> feeCollection(@RequestParam(required = false) Long classId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getFeeCollectionReport(classId)));
    }

    @GetMapping("/class-summary")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Class summary report", description = "Overview of all classes with statistics")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> classSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getClassSummary()));
    }

    @GetMapping("/section-summary")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Section summary report", description = "Per-section student counts by class")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> sectionSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getSectionSummary()));
    }

    @GetMapping("/teacher-workload")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Teacher workload report", description = "Teacher teaching hours and class assignments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> teacherWorkload() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getTeacherWorkload()));
    }

    public ReportController(final com.school.erp.modules.reports.service.ReportService reportService) {
        this.reportService = reportService;
    }
}
