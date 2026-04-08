package com.school.erp.modules.attendance.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.attendance.repository.AttendanceRepository; import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*; import org.springframework.http.ResponseEntity; import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*; import java.time.LocalDate; import java.util.List;

@RestController @RequestMapping("/api/v1/attendance") @RequiredArgsConstructor
@Tag(name = "Attendance", description = "Attendance Marking & Reporting APIs")
public class AttendanceController {
    private final AttendanceRepository repo;

    @GetMapping @Operation(summary = "Get attendance by class, section, date")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> get(
            @RequestParam Long classId, @RequestParam Long sectionId, @RequestParam String date) {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndClassIdAndSectionIdAndDate(
                TenantContext.getTenantId(), classId, sectionId, LocalDate.parse(date))));
    }

    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','TEACHER')") @Operation(summary = "Save/update attendance records")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> save(@RequestBody List<AttendanceRecord> records) {
        String tenantId = TenantContext.getTenantId();
        records.forEach(r -> { r.setTenantId(tenantId); r.setMarkedBy(TenantContext.getUserId()); });
        return ResponseEntity.ok(ApiResponse.ok(repo.saveAll(records), "Attendance saved"));
    }

    @GetMapping("/student/{studentId}") @Operation(summary = "Get student attendance for date range")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getStudentAttendance(
            @PathVariable Long studentId, @RequestParam String from, @RequestParam String to) {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndStudentIdAndDateBetween(
                TenantContext.getTenantId(), studentId, LocalDate.parse(from), LocalDate.parse(to))));
    }

    @GetMapping("/stats/class/{classId}") @Operation(summary = "Get class attendance statistics")
    public ResponseEntity<ApiResponse<List<Object[]>>> classStats(@PathVariable Long classId, @RequestParam String date) {
        return ResponseEntity.ok(ApiResponse.ok(repo.getClassAttendanceStats(TenantContext.getTenantId(), classId, LocalDate.parse(date))));
    }

    @GetMapping("/stats/student/{studentId}") @Operation(summary = "Get student attendance statistics")
    public ResponseEntity<ApiResponse<List<Object[]>>> studentStats(
            @PathVariable Long studentId, @RequestParam String from, @RequestParam String to) {
        return ResponseEntity.ok(ApiResponse.ok(repo.getStudentAttendanceStats(
                TenantContext.getTenantId(), studentId, LocalDate.parse(from), LocalDate.parse(to))));
    }
}
