package com.school.erp.modules.teacher.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.modules.teacher.dto.TeacherDTOs;
import com.school.erp.modules.teacher.service.TeacherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/teachers")
@Tag(name = "Teachers", description = "Teacher Management APIs")
public class TeacherController {
    private final TeacherService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "List teachers")
    public ResponseEntity<ApiResponse<PageResponse<TeacherDTOs.Response>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(service.getTeachers(page, size, search)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get teacher by ID")
    public ResponseEntity<ApiResponse<TeacherDTOs.Response>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create teacher")
    public ResponseEntity<ApiResponse<TeacherDTOs.Response>> create(@Valid @RequestBody TeacherDTOs.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Update teacher")
    public ResponseEntity<ApiResponse<TeacherDTOs.Response>> update(@PathVariable Long id, @Valid @RequestBody TeacherDTOs.UpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Delete teacher")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Teacher deleted"));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Import teachers from ZIP", description = "Upload a ZIP archive containing teachers.csv")
    public ResponseEntity<ApiResponse<java.util.List<TeacherDTOs.Response>>> importTeachers(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.importFromZip(file)));
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Count teachers")
    public ResponseEntity<ApiResponse<Long>> count() {
        return ResponseEntity.ok(ApiResponse.ok(service.count()));
    }

    public TeacherController(final TeacherService service) {
        this.service = service;
    }
}
