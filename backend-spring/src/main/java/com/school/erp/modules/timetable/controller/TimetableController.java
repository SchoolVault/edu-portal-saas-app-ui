package com.school.erp.modules.timetable.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/timetable") @RequiredArgsConstructor
@Tag(name = "Timetable", description = "Timetable Management APIs")
public class TimetableController {
    private final com.school.erp.modules.timetable.repository.TimetableRepository repo;

    @GetMapping @Operation(summary = "Get timetable by class and section")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> get(@RequestParam Long classId, @RequestParam Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(TenantContext.getTenantId(), classId, sectionId)));
    }

    @GetMapping("/teacher/{teacherId}") @Operation(summary = "Get timetable by teacher")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> getByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByTenantIdAndTeacherIdAndIsDeletedFalse(TenantContext.getTenantId(), teacherId)));
    }

    @PostMapping @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Create timetable entry")
    public ResponseEntity<ApiResponse<TimetableEntry>> create(@RequestBody TimetableEntry entry) {
        entry.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(repo.save(entry)));
    }

    @PostMapping("/batch") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Batch create timetable entries")
    public ResponseEntity<ApiResponse<List<TimetableEntry>>> batchCreate(@RequestBody List<TimetableEntry> entries) {
        entries.forEach(e -> e.setTenantId(TenantContext.getTenantId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(repo.saveAll(entries)));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Delete timetable entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        repo.deleteById(id); return ResponseEntity.ok(ApiResponse.ok(null, "Deleted"));
    }
}
