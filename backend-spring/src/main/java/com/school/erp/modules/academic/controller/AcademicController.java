package com.school.erp.modules.academic.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.dto.AcademicWorkflowDTOs;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.academic.dto.TeacherAssignmentDTOs;
import com.school.erp.modules.academic.service.AcademicService;
import com.school.erp.modules.academic.service.TeacherAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/academic")
@Tag(name = "Academic", description = "Academic Year, Class & Section Management")
public class AcademicController {
    private final AcademicService service;
    private final TeacherAssignmentService teacherAssignmentService;

    @GetMapping("/years")
    @Operation(summary = "List academic years")
    public ResponseEntity<ApiResponse<List<AcademicYear>>> getYears() {
        return ResponseEntity.ok(ApiResponse.ok(service.getYears()));
    }

    @PostMapping("/years")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create academic year")
    public ResponseEntity<ApiResponse<AcademicYear>> createYear(@RequestBody AcademicYear year) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createYear(year)));
    }

    @PutMapping("/years/{id}/set-current")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Set academic year as current")
    public ResponseEntity<ApiResponse<AcademicYear>> setCurrent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.setCurrentYear(id), "Current year updated"));
    }

    @GetMapping("/classes")
    @Operation(summary = "List classes with sections and student counts")
    public ResponseEntity<ApiResponse<List<AcademicDTOs.ClassWithSectionsResponse>>> getClasses() {
        return ResponseEntity.ok(ApiResponse.ok(service.getClassesWithSections()));
    }

    @GetMapping("/classes/{id}")
    @Operation(summary = "Get one class with sections", description = "Matches Angular AcademicService.getClassById")
    public ResponseEntity<ApiResponse<AcademicDTOs.ClassWithSectionsResponse>> getClassById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getClassWithSectionsById(id)));
    }

    @PostMapping("/classes")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create class with sections")
    public ResponseEntity<ApiResponse<SchoolClass>> createClass(@Valid @RequestBody AcademicDTOs.CreateClassRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createClass(req)));
    }

    @PostMapping("/sections")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Add section to class")
    public ResponseEntity<ApiResponse<Section>> addSection(@Valid @RequestBody AcademicDTOs.AddSectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.addSection(req.getClassId(), req.getName(), req.getCapacity())));
    }

    @GetMapping("/sections/class/{classId}")
    @Operation(summary = "Get sections by class")
    public ResponseEntity<ApiResponse<List<Section>>> getSections(@PathVariable Long classId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getSectionsByClass(classId)));
    }

    @PutMapping("/classes/{classId}/teacher")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Assign class teacher")
    public ResponseEntity<ApiResponse<SchoolClass>> assignTeacher(@PathVariable Long classId, @Valid @RequestBody AcademicDTOs.AssignTeacherRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.assignClassTeacher(classId, req.getTeacherId(), req.getTeacherName())));
    }

    @GetMapping("/subjects/catalog")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Subject catalog for dropdowns", description = "Tenant-scoped master list; falls back to platform defaults if no rows.")
    public ResponseEntity<ApiResponse<List<AcademicDTOs.SubjectCatalogItem>>> subjectCatalog() {
        return ResponseEntity.ok(ApiResponse.ok(service.getSubjectCatalog()));
    }

    @GetMapping("/promotion/preview")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Preview class promotion", description = "Returns target class and eligible students for promotion")
    public ResponseEntity<ApiResponse<AcademicWorkflowDTOs.PromotionPreviewResponse>> previewPromotion(@RequestParam Long fromClassId) {
        return ResponseEntity.ok(ApiResponse.ok(service.previewPromotion(fromClassId)));
    }

    @PostMapping("/promotion/execute")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Promote students", description = "Promotes selected students into the target class and section")
    public ResponseEntity<ApiResponse<AcademicWorkflowDTOs.PromotionResultResponse>> promoteStudents(@Valid @RequestBody AcademicWorkflowDTOs.PromoteStudentsRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.promoteStudents(req), "Students promoted"));
    }

    @GetMapping("/classes/{classId}/class-teacher-assignments")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Active class-teacher assignments for a class")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentDTOs.ClassTeacherAssignmentResponse>>> listClassTeacherAssignments(
            @PathVariable Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(teacherAssignmentService.listClassAssignments(classId, sectionId)));
    }

    @PostMapping("/class-teacher-assignments")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create class-teacher assignment (historical)")
    public ResponseEntity<ApiResponse<TeacherAssignmentDTOs.ClassTeacherAssignmentResponse>> createClassTeacherAssignment(
            @Valid @RequestBody TeacherAssignmentDTOs.CreateClassTeacherAssignmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(teacherAssignmentService.createClassAssignment(req)));
    }

    @GetMapping("/classes/{classId}/subject-teacher-assignments")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Active subject-teacher assignments for a class")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse>>> listSubjectTeacherAssignments(
            @PathVariable Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(teacherAssignmentService.listSubjectAssignments(classId, sectionId)));
    }

    @PostMapping("/subject-teacher-assignments")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Assign subject teacher to class/section")
    public ResponseEntity<ApiResponse<TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse>> createSubjectTeacherAssignment(
            @Valid @RequestBody TeacherAssignmentDTOs.CreateSubjectTeacherAssignmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(teacherAssignmentService.createSubjectAssignment(req)));
    }

    @GetMapping("/teachers/{teacherId}/workload")
    @PreAuthorize("hasAnyRole(\'ADMIN\',\'TEACHER\')")
    @Operation(summary = "Teacher workload from assignment tables")
    public ResponseEntity<ApiResponse<TeacherAssignmentDTOs.TeacherWorkloadResponse>> teacherWorkload(@PathVariable Long teacherId) {
        return ResponseEntity.ok(ApiResponse.ok(teacherAssignmentService.getWorkload(teacherId)));
    }

    public AcademicController(final AcademicService service, final TeacherAssignmentService teacherAssignmentService) {
        this.service = service;
        this.teacherAssignmentService = teacherAssignmentService;
    }
}
