package com.school.erp.modules.teacher.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.teacher.dto.TeacherDTOs; import com.school.erp.modules.teacher.service.TeacherService;
import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/teachers") @RequiredArgsConstructor
@Tag(name = "Teachers", description = "Teacher Management APIs")
public class TeacherController {
    private final TeacherService service;

    @GetMapping @Operation(summary = "List teachers")
    public ResponseEntity<ApiResponse<PageResponse<TeacherDTOs.Response>>> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.getTeachers(page, size)));
    }
    @GetMapping("/{id}") @Operation(summary = "Get teacher by ID")
    public ResponseEntity<ApiResponse<TeacherDTOs.Response>> get(@PathVariable Long id) { return ResponseEntity.ok(ApiResponse.ok(service.getById(id))); }

    @PostMapping @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Create teacher")
    public ResponseEntity<ApiResponse<TeacherDTOs.Response>> create(@Valid @RequestBody TeacherDTOs.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.create(req)));
    }
    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Update teacher")
    public ResponseEntity<ApiResponse<TeacherDTOs.Response>> update(@PathVariable Long id, @Valid @RequestBody TeacherDTOs.UpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, req)));
    }
    @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Delete teacher")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.ok(ApiResponse.ok(null, "Teacher deleted")); }

    @GetMapping("/count") @Operation(summary = "Count teachers")
    public ResponseEntity<ApiResponse<Long>> count() { return ResponseEntity.ok(ApiResponse.ok(service.count())); }
}
