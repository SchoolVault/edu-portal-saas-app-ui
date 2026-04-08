package com.school.erp.modules.attendance.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.attendance.dto.AttendanceDTOs;
import com.school.erp.modules.attendance.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Attendance Marking, Statistics & Reports")
public class AttendanceController {

    private final AttendanceService service;

    @GetMapping
    @Operation(summary = "Get attendance by class, section, date")
    public ResponseEntity<ApiResponse<List<AttendanceDTOs.AttendanceResponse>>> get(
            @RequestParam Long classId, @RequestParam Long sectionId, @RequestParam String date) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByClassSectionDate(classId, sectionId, LocalDate.parse(date))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Mark attendance (bulk)", description = "Mark attendance for multiple students at once")
    public ResponseEntity<ApiResponse<List<AttendanceDTOs.AttendanceResponse>>> mark(@Valid @RequestBody AttendanceDTOs.BulkMarkRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.markAttendance(request), "Attendance saved"));
    }

    @GetMapping("/student/{studentId}/stats")
    @Operation(summary = "Get student attendance statistics for date range")
    public ResponseEntity<ApiResponse<AttendanceDTOs.AttendanceStatsResponse>> studentStats(
            @PathVariable Long studentId, @RequestParam String from, @RequestParam String to) {
        return ResponseEntity.ok(ApiResponse.ok(service.getStudentStats(studentId, LocalDate.parse(from), LocalDate.parse(to))));
    }

    @GetMapping("/class-stats")
    @Operation(summary = "Get class attendance statistics for a date")
    public ResponseEntity<ApiResponse<AttendanceDTOs.ClassAttendanceStatsResponse>> classStats(
            @RequestParam Long classId, @RequestParam Long sectionId, @RequestParam String date) {
        return ResponseEntity.ok(ApiResponse.ok(service.getClassStats(classId, sectionId, LocalDate.parse(date))));
    }

    @GetMapping("/monthly-report")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Monthly attendance report", description = "Student-wise monthly attendance with percentages")
    public ResponseEntity<ApiResponse<List<AttendanceDTOs.MonthlyAttendanceRow>>> monthlyReport(
            @RequestParam Long classId, @RequestParam Long sectionId,
            @RequestParam int year, @RequestParam int month) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMonthlyReport(classId, sectionId, year, month)));
    }
}
