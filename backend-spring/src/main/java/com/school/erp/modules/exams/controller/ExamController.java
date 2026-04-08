package com.school.erp.modules.exams.controller;
import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.exams.entity.*; import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*; import java.util.List;

@RestController @RequestMapping("/api/v1/exams") @RequiredArgsConstructor
@Tag(name = "Exams", description = "Exam & Marks Management APIs")
public class ExamController {
    private final com.school.erp.modules.exams.repository.ExamRepository examRepo;
    private final com.school.erp.modules.exams.repository.MarkRecordRepository markRepo;

    @GetMapping @Operation(summary = "List all exams")
    public ResponseEntity<ApiResponse<List<Exam>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(examRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId())));
    }

    @PostMapping @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Create exam")
    public ResponseEntity<ApiResponse<Exam>> create(@RequestBody Exam exam) {
        exam.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(examRepo.save(exam)));
    }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Update exam")
    public ResponseEntity<ApiResponse<Exam>> update(@PathVariable Long id, @RequestBody Exam exam) {
        exam.setId(id); exam.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.ok(ApiResponse.ok(examRepo.save(exam)));
    }

    @GetMapping("/{examId}/marks") @Operation(summary = "Get marks by exam")
    public ResponseEntity<ApiResponse<List<MarkRecord>>> getMarksByExam(@PathVariable Long examId) {
        return ResponseEntity.ok(ApiResponse.ok(markRepo.findByTenantIdAndExamId(TenantContext.getTenantId(), examId)));
    }

    @GetMapping("/marks/student/{studentId}") @Operation(summary = "Get marks by student")
    public ResponseEntity<ApiResponse<List<MarkRecord>>> getMarksByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(markRepo.findByTenantIdAndStudentId(TenantContext.getTenantId(), studentId)));
    }

    @PostMapping("/marks") @PreAuthorize("hasAnyRole('ADMIN','TEACHER')") @Operation(summary = "Save marks (single or batch)")
    public ResponseEntity<ApiResponse<List<MarkRecord>>> saveMarks(@RequestBody List<MarkRecord> marks) {
        String tenantId = TenantContext.getTenantId();
        marks.forEach(m -> m.setTenantId(tenantId));
        return ResponseEntity.ok(ApiResponse.ok(markRepo.saveAll(marks), "Marks saved"));
    }

    @PostMapping("/marks/batch") @PreAuthorize("hasAnyRole('ADMIN','TEACHER')") @Operation(summary = "Batch save marks for a class")
    public ResponseEntity<ApiResponse<List<MarkRecord>>> batchSaveMarks(@RequestBody List<MarkRecord> marks) {
        String tenantId = TenantContext.getTenantId();
        marks.forEach(m -> {
            m.setTenantId(tenantId);
            double pct = (m.getMarksObtained() / m.getMaxMarks()) * 100;
            m.setGrade(pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "D");
        });
        return ResponseEntity.ok(ApiResponse.ok(markRepo.saveAll(marks), "Marks batch saved"));
    }
}
