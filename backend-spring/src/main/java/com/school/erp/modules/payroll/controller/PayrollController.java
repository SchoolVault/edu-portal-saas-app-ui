package com.school.erp.modules.payroll.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.payroll.dto.PayrollDTOs;
import com.school.erp.modules.payroll.entity.Payslip;
import com.school.erp.modules.payroll.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payroll")
@Tag(name = "Payroll", description = "Salary Structure, Payslip Generation & Management")
public class PayrollController {
    private final PayrollService service;

    @GetMapping("/structures")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "List salary structures with components")
    public ResponseEntity<ApiResponse<List<PayrollDTOs.SalaryStructureResponse>>> listStructures() {
        return ResponseEntity.ok(ApiResponse.ok(service.getStructures()));
    }

    @PostMapping("/structures")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Create salary structure", description = "Define basic salary, allowances, and deductions for a teacher")
    public ResponseEntity<ApiResponse<PayrollDTOs.SalaryStructureResponse>> createStructure(@Valid @RequestBody PayrollDTOs.CreateSalaryStructureRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.createStructure(req)));
    }

    @PostMapping("/payslips/generate")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "Generate payslips", description = "Generate payslips for all teachers for a given month/year")
    public ResponseEntity<ApiResponse<List<Payslip>>> generatePayslips(@Valid @RequestBody PayrollDTOs.GeneratePayslipRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(service.generatePayslips(req.getMonth(), req.getYear())));
    }

    @GetMapping("/payslips")
    @PreAuthorize("hasRole(\'ADMIN\')")
    @Operation(summary = "List payslips", description = "Filter by year and month")
    public ResponseEntity<ApiResponse<List<Payslip>>> listPayslips(@RequestParam(required = false) Integer year, @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPayslips(year, month)));
    }

    public PayrollController(final PayrollService service) {
        this.service = service;
    }
}
