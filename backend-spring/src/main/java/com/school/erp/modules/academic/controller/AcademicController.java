package com.school.erp.modules.academic.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.academic.repository.*;
import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/academic")
@RequiredArgsConstructor
@Tag(name = "Academic", description = "Academic Year, Class & Section Management APIs")
public class AcademicController {

    private final AcademicYearRepository yearRepo;
    private final SchoolClassRepository classRepo;
    private final SectionRepository sectionRepo;

    // --- Academic Years ---
    @GetMapping("/years")
    @Operation(summary = "List academic years")
    public ResponseEntity<ApiResponse<List<AcademicYear>>> getYears() {
        return ResponseEntity.ok(ApiResponse.ok(yearRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId())));
    }

    @PostMapping("/years")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create academic year")
    public ResponseEntity<ApiResponse<AcademicYear>> createYear(@RequestBody AcademicYear year) {
        year.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(yearRepo.save(year)));
    }

    // --- Classes ---
    @GetMapping("/classes")
    @Operation(summary = "List classes with sections")
    public ResponseEntity<ApiResponse<List<ClassWithSections>>> getClasses() {
        String tenantId = TenantContext.getTenantId();
        List<SchoolClass> classes = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        List<ClassWithSections> result = classes.stream().map(c -> {
            List<Section> sections = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId());
            return new ClassWithSections(c, sections);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/classes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create class")
    public ResponseEntity<ApiResponse<SchoolClass>> createClass(@RequestBody SchoolClass cls) {
        cls.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(classRepo.save(cls)));
    }

    @GetMapping("/classes/{id}")
    @Operation(summary = "Get class by ID")
    public ResponseEntity<ApiResponse<ClassWithSections>> getClass(@PathVariable Long id) {
        String tenantId = TenantContext.getTenantId();
        SchoolClass cls = classRepo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new com.school.erp.common.exception.ResourceNotFoundException("Class", id));
        List<Section> sections = sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, id);
        return ResponseEntity.ok(ApiResponse.ok(new ClassWithSections(cls, sections)));
    }

    // --- Sections ---
    @PostMapping("/sections")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create section")
    public ResponseEntity<ApiResponse<Section>> createSection(@RequestBody Section section) {
        section.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(sectionRepo.save(section)));
    }

    @GetMapping("/sections/class/{classId}")
    @Operation(summary = "Get sections by class")
    public ResponseEntity<ApiResponse<List<Section>>> getSectionsByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(ApiResponse.ok(sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(TenantContext.getTenantId(), classId)));
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ClassWithSections {
        private SchoolClass schoolClass;
        private List<Section> sections;
    }
}
