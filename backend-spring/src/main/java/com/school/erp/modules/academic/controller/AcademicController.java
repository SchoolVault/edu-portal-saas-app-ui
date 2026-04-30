package com.school.erp.modules.academic.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.dto.AcademicMutationRequests;
import com.school.erp.modules.academic.dto.AcademicWorkflowDTOs;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.academic.dto.TeacherAssignmentDTOs;
import com.school.erp.modules.academic.service.AcademicService;
import com.school.erp.modules.academic.service.TeacherAssignmentService;
import com.school.erp.security.rbac.RbacSpel;
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
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "List academic years")
    public ResponseEntity<ApiResponse<List<AcademicYear>>> getYears() {
        return ResponseEntity.ok(ApiResponse.ok(service.getYears()));
    }

    @PostMapping("/years")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Create academic year")
    public ResponseEntity<ApiResponse<AcademicYear>> createYear(@RequestBody AcademicYear year) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createYear(year)));
    }

    @PutMapping("/years/{id}/set-current")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Set academic year as current")
    public ResponseEntity<ApiResponse<AcademicYear>> setCurrent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.setCurrentYear(id), "Current year updated"));
    }

    @GetMapping("/classes")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "List classes with sections and student counts")
    public ResponseEntity<ApiResponse<List<AcademicDTOs.ClassWithSectionsResponse>>> getClasses(
            @RequestParam(required = false) String lifecycle) {
        return ResponseEntity.ok(ApiResponse.ok(service.getClassesWithSections(lifecycle)));
    }

    @GetMapping("/classes/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get one class with sections", description = "Matches Angular AcademicService.getClassById")
    public ResponseEntity<ApiResponse<AcademicDTOs.ClassWithSectionsResponse>> getClassById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getClassWithSectionsById(id)));
    }

    @PostMapping("/classes")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Create class with optional sections", description = "Omit or empty sectionNames for a whole-class (no section rows). Response matches list entries.")
    public ResponseEntity<ApiResponse<AcademicDTOs.ClassWithSectionsResponse>> createClass(@Valid @RequestBody AcademicDTOs.CreateClassRequest req) {
        SchoolClass created = service.createClass(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.getClassWithSectionsById(created.getId())));
    }

    @PutMapping("/classes/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Update class name and grade")
    public ResponseEntity<ApiResponse<AcademicDTOs.ClassWithSectionsResponse>> updateClass(
            @PathVariable Long id, @Valid @RequestBody AcademicMutationRequests.UpdateSchoolClassRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateClass(id, req)));
    }

    @PostMapping("/sections")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Add section to class")
    public ResponseEntity<ApiResponse<Section>> addSection(@Valid @RequestBody AcademicDTOs.AddSectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.addSection(req.getClassId(), req.getName(), req.getCapacity())));
    }

    @PutMapping("/sections/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Update section name and capacity")
    public ResponseEntity<ApiResponse<Section>> updateSection(@PathVariable Long id, @Valid @RequestBody AcademicMutationRequests.UpdateSectionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateSection(id, req)));
    }

    @DeleteMapping("/sections/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Remove empty section", description = "Soft-deletes section when studentCount is zero")
    public ResponseEntity<ApiResponse<Void>> deleteSection(@PathVariable Long id) {
        service.deleteSection(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Section removed"));
    }

    @DeleteMapping("/classes/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Remove empty class", description = "Soft-deletes class only when no active sections and no active students remain")
    public ResponseEntity<ApiResponse<Void>> deleteClass(@PathVariable Long id) {
        service.deleteClass(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Class removed"));
    }

    @GetMapping("/sections/class/{classId}")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get sections by class")
    public ResponseEntity<ApiResponse<List<Section>>> getSections(
            @PathVariable Long classId,
            @RequestParam(required = false) String lifecycle) {
        return ResponseEntity.ok(ApiResponse.ok(service.getSectionsByClass(classId, lifecycle)));
    }

    @PatchMapping("/classes/{id}/deactivate")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Deactivate class", description = "Marks class inactive while retaining history. Blocks when active sections/students exist.")
    public ResponseEntity<ApiResponse<AcademicDTOs.ClassWithSectionsResponse>> deactivateClass(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.setClassActiveState(id, false), "Class deactivated"));
    }

    @PatchMapping("/classes/{id}/activate")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Activate class", description = "Re-enables class for operational use.")
    public ResponseEntity<ApiResponse<AcademicDTOs.ClassWithSectionsResponse>> activateClass(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.setClassActiveState(id, true), "Class activated"));
    }

    @PatchMapping("/sections/{id}/deactivate")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Deactivate section", description = "Marks section inactive while retaining history. Blocks when active students exist.")
    public ResponseEntity<ApiResponse<Section>> deactivateSection(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.setSectionActiveState(id, false), "Section deactivated"));
    }

    @PatchMapping("/sections/{id}/activate")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Activate section", description = "Re-enables section for operational use; parent class must be active.")
    public ResponseEntity<ApiResponse<Section>> activateSection(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.setSectionActiveState(id, true), "Section activated"));
    }

    @PutMapping("/classes/{classId}/teacher")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Assign class teacher")
    public ResponseEntity<ApiResponse<AcademicDTOs.ClassWithSectionsResponse>> assignTeacher(@PathVariable Long classId, @Valid @RequestBody AcademicDTOs.AssignTeacherRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.assignClassTeacher(classId, req.getSectionId(), req.getTeacherId(), req.getTeacherName())));
    }

    @GetMapping("/subjects/catalog")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Subject catalog for dropdowns", description = "Tenant-scoped master list; falls back to platform defaults if no rows.")
    public ResponseEntity<ApiResponse<List<AcademicDTOs.SubjectCatalogItem>>> subjectCatalog() {
        return ResponseEntity.ok(ApiResponse.ok(service.getSubjectCatalog()));
    }

    @GetMapping("/promotion/preview")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Preview class promotion", description = "Returns target class and eligible students for promotion")
    public ResponseEntity<ApiResponse<AcademicWorkflowDTOs.PromotionPreviewResponse>> previewPromotion(@RequestParam Long fromClassId) {
        return ResponseEntity.ok(ApiResponse.ok(service.previewPromotion(fromClassId)));
    }

    @GetMapping("/promotion/split-preview")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Suggest section distribution for promotion", description = "Heuristic student counts per target section when merging sections")
    public ResponseEntity<ApiResponse<AcademicWorkflowDTOs.PromotionSplitPreviewResponse>> promotionSplitPreview(
            @RequestParam Long fromClassId,
            @RequestParam Long toClassId) {
        return ResponseEntity.ok(ApiResponse.ok(service.promotionSplitPreview(fromClassId, toClassId)));
    }

    @PostMapping("/promotion/execute")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Promote students", description = "Promotes selected students into the target class and section")
    public ResponseEntity<ApiResponse<AcademicWorkflowDTOs.PromotionResultResponse>> promoteStudents(@Valid @RequestBody AcademicWorkflowDTOs.PromoteStudentsRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.promoteStudents(req), "Students promoted"));
    }

    @GetMapping("/classes/{classId}/class-teacher-assignments")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Active class-teacher assignments for a class")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentDTOs.ClassTeacherAssignmentResponse>>> listClassTeacherAssignments(
            @PathVariable Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(teacherAssignmentService.listClassAssignments(classId, sectionId)));
    }

    @PostMapping("/class-teacher-assignments")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Create class-teacher assignment (historical)")
    public ResponseEntity<ApiResponse<TeacherAssignmentDTOs.ClassTeacherAssignmentResponse>> createClassTeacherAssignment(
            @Valid @RequestBody TeacherAssignmentDTOs.CreateClassTeacherAssignmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(teacherAssignmentService.createClassAssignment(req)));
    }

    @GetMapping("/classes/{classId}/subject-teacher-assignments")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Active subject-teacher assignments for a class")
    public ResponseEntity<ApiResponse<List<TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse>>> listSubjectTeacherAssignments(
            @PathVariable Long classId, @RequestParam(required = false) Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(teacherAssignmentService.listSubjectAssignments(classId, sectionId)));
    }

    @PostMapping("/subject-teacher-assignments")
    @PreAuthorize(RbacSpel.ACADEMIC_DESK_ADMIN)
    @Operation(summary = "Assign subject teacher to class/section")
    public ResponseEntity<ApiResponse<TeacherAssignmentDTOs.SubjectTeacherAssignmentResponse>> createSubjectTeacherAssignment(
            @Valid @RequestBody TeacherAssignmentDTOs.CreateSubjectTeacherAssignmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(teacherAssignmentService.createSubjectAssignment(req)));
    }

    @GetMapping("/teachers/{teacherId}/workload")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Teacher workload from assignment tables")
    public ResponseEntity<ApiResponse<TeacherAssignmentDTOs.TeacherWorkloadResponse>> teacherWorkload(@PathVariable Long teacherId) {
        return ResponseEntity.ok(ApiResponse.ok(teacherAssignmentService.getWorkload(teacherId)));
    }

    public AcademicController(final AcademicService service, final TeacherAssignmentService teacherAssignmentService) {
        this.service = service;
        this.teacherAssignmentService = teacherAssignmentService;
    }
}
