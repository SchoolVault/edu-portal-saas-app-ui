package com.school.erp.modules.attendance.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.attendance.dto.AttendanceDTOs;
import com.school.erp.modules.attendance.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance")
@Tag(name = "Attendance", description = "Attendance Marking, Statistics & Reports")
public class AttendanceController {
    private final AttendanceService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get attendance by class, section, date")
    public ResponseEntity<ApiResponse<List<AttendanceDTOs.AttendanceResponse>>> get(@RequestParam Long classId, @RequestParam Long sectionId, @RequestParam String date) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByClassSectionDate(classId, sectionId, LocalDate.parse(date))));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get attendance by class, section, date (paged)")
    public ResponseEntity<ApiResponse<PageResponse<AttendanceDTOs.AttendanceResponse>>> getPaged(
            @RequestParam Long classId,
            @RequestParam Long sectionId,
            @RequestParam String date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByClassSectionDatePaged(classId, sectionId, LocalDate.parse(date), page, size)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Mark attendance (bulk)", description = "Mark attendance for multiple students at once")
    public ResponseEntity<ApiResponse<List<AttendanceDTOs.AttendanceResponse>>> mark(@Valid @RequestBody AttendanceDTOs.BulkMarkRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.markAttendance(request), "Attendance saved"));
    }

    @GetMapping("/student/{studentId}/stats")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get student attendance statistics for date range")
    public ResponseEntity<ApiResponse<AttendanceDTOs.AttendanceStatsResponse>> studentStats(@PathVariable Long studentId, @RequestParam String from, @RequestParam String to) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentStats(studentId, LocalDate.parse(from), LocalDate.parse(to))));
    }

    @GetMapping("/class-stats")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get class attendance statistics for a date")
    public ResponseEntity<ApiResponse<AttendanceDTOs.ClassAttendanceStatsResponse>> classStats(@RequestParam Long classId, @RequestParam Long sectionId, @RequestParam String date) {
        return ResponseEntity.ok(ApiResponse.ok(service.getClassStats(classId, sectionId, LocalDate.parse(date))));
    }

    @GetMapping("/monthly-report")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Monthly attendance report", description = "Student-wise monthly attendance with percentages")
    public ResponseEntity<ApiResponse<List<AttendanceDTOs.MonthlyAttendanceRow>>> monthlyReport(@RequestParam Long classId, @RequestParam Long sectionId, @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMonthlyReport(classId, sectionId, year, month)));
    }

    public AttendanceController(final AttendanceService service) {
        this.service = service;
    }
}
