package com.school.erp.modules.payroll.controller;
import com.school.erp.common.dto.ApiResponse; import com.school.erp.modules.payroll.entity.*;
import com.school.erp.tenant.TenantContext; import io.swagger.v3.oas.annotations.Operation; import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor; import org.springframework.http.HttpStatus; import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/v1/payroll") @RequiredArgsConstructor
@Tag(name = "Payroll", description = "Salary & Payslip Management APIs")
public class PayrollController {
    private final com.school.erp.modules.payroll.repository.SalaryStructureRepository ssRepo;
    private final com.school.erp.modules.payroll.repository.SalaryComponentRepository scRepo;
    private final com.school.erp.modules.payroll.repository.PayslipRepository psRepo;
    @GetMapping("/structures") @Operation(summary = "List salary structures") public ResponseEntity<ApiResponse<List<SalaryStructure>>> listStructures() { return ResponseEntity.ok(ApiResponse.ok(ssRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()))); }
    @PostMapping("/structures") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Create salary structure") public ResponseEntity<ApiResponse<SalaryStructure>> createStructure(@RequestBody SalaryStructure ss) { ss.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(ssRepo.save(ss))); }
    @GetMapping("/structures/{id}/components") @Operation(summary = "Get salary components") public ResponseEntity<ApiResponse<List<SalaryComponent>>> getComponents(@PathVariable Long id) { return ResponseEntity.ok(ApiResponse.ok(scRepo.findByTenantIdAndSalaryStructureId(TenantContext.getTenantId(), id))); }
    @PostMapping("/components") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Add salary component") public ResponseEntity<ApiResponse<SalaryComponent>> addComponent(@RequestBody SalaryComponent sc) { sc.setTenantId(TenantContext.getTenantId()); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(scRepo.save(sc))); }
    @GetMapping("/payslips") @Operation(summary = "List payslips") public ResponseEntity<ApiResponse<List<Payslip>>> listPayslips(@RequestParam(required = false) Integer year, @RequestParam(required = false) String month) { return ResponseEntity.ok(ApiResponse.ok(psRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId()))); }
    @PostMapping("/payslips/generate") @PreAuthorize("hasRole('ADMIN')") @Operation(summary = "Generate payslips for a month") public ResponseEntity<ApiResponse<List<Payslip>>> generatePayslips(@RequestBody List<Payslip> payslips) { payslips.forEach(p -> p.setTenantId(TenantContext.getTenantId())); return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(psRepo.saveAll(payslips))); }
}
