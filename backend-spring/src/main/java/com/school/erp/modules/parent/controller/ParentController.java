package com.school.erp.modules.parent.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.exams.repository.MarkRecordRepository;
import com.school.erp.modules.exams.entity.MarkRecord;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parent")
@RequiredArgsConstructor
@Tag(name = "Parent Portal", description = "Parent view - children, grades, fees, attendance")
@PreAuthorize("hasAnyRole('PARENT','ADMIN')")
public class ParentController {

    private final StudentRepository studentRepo;
    private final MarkRecordRepository markRepo;
    private final FeePaymentRepository feeRepo;

    @GetMapping("/children")
    @Operation(summary = "Get parent's children", description = "Returns all students linked to the current parent user")
    public ResponseEntity<ApiResponse<List<Student>>> getChildren() {
        String t = TenantContext.getTenantId();
        Long parentId = TenantContext.getUserId();
        List<Student> children = studentRepo.findByTenantIdAndIsDeletedFalse(t, org.springframework.data.domain.PageRequest.of(0, 100))
                .getContent().stream().filter(s -> parentId.equals(s.getParentId())).toList();
        return ResponseEntity.ok(ApiResponse.ok(children));
    }

    @GetMapping("/children/{studentId}/marks")
    @Operation(summary = "Get child's exam marks")
    public ResponseEntity<ApiResponse<List<MarkRecord>>> getChildMarks(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(markRepo.findByTenantIdAndStudentId(TenantContext.getTenantId(), studentId)));
    }

    @GetMapping("/children/{studentId}/fees")
    @Operation(summary = "Get child's fee status")
    public ResponseEntity<ApiResponse<List<FeePayment>>> getChildFees(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(feeRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(TenantContext.getTenantId(), studentId)));
    }
}
