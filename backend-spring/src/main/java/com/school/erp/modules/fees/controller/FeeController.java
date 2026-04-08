package com.school.erp.modules.fees.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.common.enums.Enums;
import com.school.erp.modules.fees.entity.*; import com.school.erp.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.*; import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*; import java.math.BigDecimal; import java.time.LocalDate; import java.util.List;

@RestController @RequestMapping("/api/v1/fees") @RequiredArgsConstructor
@Tag(name = "Fees", description = "Fee Structure & Payment Management APIs")
public class FeeController {
    private final com.school.erp.modules.fees.repository.FeeStructureRepository fsRepo;
    private final com.school.erp.modules.fees.repository.FeeComponentRepository fcRepo;
    private final com.school.erp.modules.fees.repository.FeePaymentRepository fpRepo;

    @GetMapping("/structures") @Operation(summary = "List fee structures")
    public ResponseEntity<ApiResponse<List<FeeStructure>>> getStructures() {
        return ResponseEntity.ok(ApiResponse.ok(fsRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId())));
    }

    @PostMapping("/structures") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Create fee structure")
    public ResponseEntity<ApiResponse<FeeStructure>> createStructure(@RequestBody FeeStructure fs) {
        fs.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(fsRepo.save(fs)));
    }

    @GetMapping("/structures/{id}/components") @Operation(summary = "Get fee components for a structure")
    public ResponseEntity<ApiResponse<List<FeeComponent>>> getComponents(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(fcRepo.findByTenantIdAndFeeStructureId(TenantContext.getTenantId(), id)));
    }

    @PostMapping("/components") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Add fee component")
    public ResponseEntity<ApiResponse<FeeComponent>> addComponent(@RequestBody FeeComponent fc) {
        fc.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(fcRepo.save(fc)));
    }

    @GetMapping("/payments") @Operation(summary = "List fee payments with optional status filter")
    public ResponseEntity<ApiResponse<List<FeePayment>>> getPayments(@RequestParam(required = false) Enums.FeeStatus status) {
        String t = TenantContext.getTenantId();
        List<FeePayment> payments = status != null ? fpRepo.findByTenantIdAndStatusAndIsDeletedFalse(t, status)
                : fpRepo.findByTenantIdAndIsDeletedFalse(t);
        return ResponseEntity.ok(ApiResponse.ok(payments));
    }

    @GetMapping("/payments/student/{studentId}") @Operation(summary = "Get payments by student")
    public ResponseEntity<ApiResponse<List<FeePayment>>> getStudentPayments(@PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.ok(fpRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(TenantContext.getTenantId(), studentId)));
    }

    @PostMapping("/payments") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Record fee payment")
    public ResponseEntity<ApiResponse<FeePayment>> recordPayment(@RequestBody FeePayment payment) {
        payment.setTenantId(TenantContext.getTenantId());
        if (payment.getReceiptNumber() == null) payment.setReceiptNumber("REC-" + System.currentTimeMillis());
        if (payment.getPaymentDate() == null) payment.setPaymentDate(LocalDate.now());
        payment.setDueAmount(payment.getAmount().subtract(payment.getPaidAmount()));
        if (payment.getDueAmount().compareTo(BigDecimal.ZERO) <= 0) payment.setStatus(Enums.FeeStatus.PAID);
        else if (payment.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) payment.setStatus(Enums.FeeStatus.PARTIAL);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(fpRepo.save(payment)));
    }
}
