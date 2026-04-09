package com.school.erp.modules.student.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.service.StudentService;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "List students", description = "Get paginated list of students with optional filters")
    public ResponseEntity<ApiResponse<PageResponse<StudentDTOs.Response>>> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) Long classId, @RequestParam(required = false) Enums.StudentStatus status, @RequestParam(required = false) String search, @RequestParam(defaultValue = "firstName") String sortBy, @RequestParam(defaultValue = "asc") String direction) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudents(page, size, classId, status, search, sortBy, direction)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get student", description = "Get student by ID with full profile")
    public ResponseEntity<ApiResponse<StudentDTOs.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudentById(id)));
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get students by class", description = "Get all students in a specific class")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> getByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudentsByClass(classId)));
    }

    @GetMapping("/class/{classId}/section/{sectionId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Get students by class and section")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> getByClassAndSection(@PathVariable Long classId, @PathVariable Long sectionId) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getStudentsByClassAndSection(classId, sectionId)));
    }

    @PostMapping
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create student", description = "Add a new student to the system")
    public ResponseEntity<ApiResponse<StudentDTOs.Response>> create(@Valid @RequestBody StudentDTOs.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(studentService.createStudent(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole(\'ADMIN\', \'TEACHER\')")
    @Operation(summary = "Update student", description = "Update student information")
    public ResponseEntity<ApiResponse<StudentDTOs.Response>> update(@PathVariable Long id, @Valid @RequestBody StudentDTOs.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(studentService.updateStudent(id, request), "Student updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Delete student", description = "Soft delete a student record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Student deleted"));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Bulk create students", description = "Upload multiple students at once")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> bulkCreate(@Valid @RequestBody StudentDTOs.BulkUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(studentService.bulkCreate(request)));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Import students from ZIP", description = "Upload a ZIP archive containing students.csv")
    public ResponseEntity<ApiResponse<List<StudentDTOs.Response>>> importStudents(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(studentService.importFromZip(file)));
    }

    @PostMapping("/promote")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Promote students", description = "Promote students from one class to another")
    public ResponseEntity<ApiResponse<Integer>> promote(@Valid @RequestBody StudentDTOs.PromotionRequest request) {
        int count = studentService.promoteStudents(request);
        return ResponseEntity.ok(ApiResponse.ok(count, count + " students promoted"));
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @Operation(summary = "Count students", description = "Get total number of active students")
    public ResponseEntity<ApiResponse<Long>> count() {
        return ResponseEntity.ok(ApiResponse.ok(studentService.countStudents()));
    }

    public StudentController(final StudentService studentService) {
        this.studentService = studentService;
    }
}
