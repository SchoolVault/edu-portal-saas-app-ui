package com.school.erp.modules.student.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.guardian.dto.GuardianDTOs;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.service.StudentService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@Tag(name = "Students", description = "Student Management CRUD APIs")
public class StudentController {
    private final StudentService studentService;
    private final GuardianService guardianService;

    @GetMapping
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "List students", description = "Get paginated list of students with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<StudentDTOs.Response>>> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) Long classId, @RequestParam(required = false) Long sectionId, @RequestParam(required = false) Enums.StudentStatus status, @RequestParam(required = false) String search, @RequestParam(defaultValue = "firstName") String sortBy, @RequestParam(defaultValue = "asc") String direction) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudents(page, size, classId, sectionId, status, search, sortBy, direction)));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get student", description = "Get student by ID with full profile")
    public ResponseEntity<ApiResponse<StudentDTOs.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudentById(id)));
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get students by class", description = "Get all students in a specific class")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> getByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudentsByClass(classId)));
    }

    @GetMapping("/class/{classId}/section/{sectionId}")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Get students by class and section")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> getByClassAndSection(@PathVariable Long classId, @PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudentsByClassAndSection(classId, sectionId)));
    }

    @PostMapping
    @PreAuthorize(RbacSpel.STUDENT_MASTER_WRITE)
    @Operation(summary = "Create student", description = "Add a new student to the system")
    public ResponseEntity<ApiResponse<StudentDTOs.Response>> create(@Valid @RequestBody StudentDTOs.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(studentService.createStudent(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize(RbacSpel.STUDENT_MASTER_WRITE)
    @Operation(summary = "Update student", description = "School admin updates master record (class, status, guardianship, etc.). Teachers have read-only roster access.")
    public ResponseEntity<ApiResponse<StudentDTOs.Response>> update(@PathVariable Long id, @Valid @RequestBody StudentDTOs.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.updateStudent(id, request), "Student updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(RbacSpel.STUDENT_MASTER_WRITE)
    @Operation(summary = "Delete student", description = "Soft delete a student record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Student deleted"));
    }

    @PostMapping("/bulk")
    @PreAuthorize(RbacSpel.STUDENT_MASTER_WRITE)
    @Operation(summary = "Bulk create students", description = "Upload multiple students at once")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> bulkCreate(@Valid @RequestBody StudentDTOs.BulkUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(studentService.bulkCreate(request)));
    }

    @PostMapping("/bulk-report")
    @PreAuthorize(RbacSpel.STUDENT_MASTER_WRITE)
    @Operation(summary = "Bulk create with validation report", description = "Partial success: returns successes and per-row errors")
    public ResponseEntity<ApiResponse<StudentDTOs.BulkUploadReport>> bulkCreateReport(@Valid @RequestBody StudentDTOs.BulkUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(studentService.bulkCreateWithReport(request)));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(RbacSpel.STUDENT_MASTER_WRITE)
    @Operation(summary = "Import students from ZIP", description = "Upload a ZIP archive containing students.csv")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> importStudents(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(studentService.importFromZip(file)));
    }

    @PostMapping("/promote")
    @PreAuthorize(RbacSpel.STUDENT_MASTER_WRITE)
    @Operation(summary = "Promote students", description = "Promote students from one class to another")
    public ResponseEntity<ApiResponse<Integer>> promote(@Valid @RequestBody StudentDTOs.PromotionRequest request) {
        int count = studentService.promoteStudents(request);
        return ResponseEntity.ok(ApiResponse.ok(count, count + " students promoted"));
    }

    @GetMapping("/count")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "Count students", description = "Get total number of active students")
    public ResponseEntity<ApiResponse<Long>> count() {
        return ResponseEntity.ok(ApiResponse.ok(studentService.countStudents()));
    }

    @GetMapping("/{id}/guardian-mappings")
    @PreAuthorize(RbacSpel.ACADEMIC_ROSTER_READ)
    @Operation(summary = "List guardian links for a student")
    public ResponseEntity<ApiResponse<List<GuardianDTOs.MappingResponse>>> listGuardianMappings(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(guardianService.listMappingsForStudent(id)));
    }

    @PostMapping("/{id}/guardian-mappings")
    @PreAuthorize(RbacSpel.GUARDIAN_DIRECTORY_WRITE)
    @Operation(summary = "Link a guardian to a student with relationship metadata")
    public ResponseEntity<ApiResponse<GuardianDTOs.MappingResponse>> addGuardianMapping(
            @PathVariable Long id, @Valid @RequestBody GuardianDTOs.CreateMappingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(guardianService.addMapping(id, request)));
    }

    @PutMapping("/{id}/guardian-mappings/{mappingId}")
    @PreAuthorize(RbacSpel.GUARDIAN_DIRECTORY_WRITE)
    @Operation(summary = "Update guardian mapping metadata for a student")
    public ResponseEntity<ApiResponse<GuardianDTOs.MappingResponse>> updateGuardianMapping(
            @PathVariable Long id,
            @PathVariable Long mappingId,
            @RequestBody GuardianDTOs.UpdateMappingRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(guardianService.updateMapping(id, mappingId, request), "Guardian mapping updated"));
    }

    public StudentController(final StudentService studentService, final GuardianService guardianService) {
        this.studentService = studentService;
        this.guardianService = guardianService;
    }
}
