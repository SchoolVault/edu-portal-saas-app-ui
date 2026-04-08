package com.school.erp.modules.payroll.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class PayrollDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateSalaryStructureRequest {
        @NotNull private Long teacherId;
        private String teacherName;
        @NotNull private BigDecimal basicSalary;
        private List<SalaryComponentDTO> allowances;
        private List<SalaryComponentDTO> deductions;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SalaryComponentDTO {
        private Long id;
        private String name;
        private BigDecimal amount;
        private String type;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SalaryStructureResponse {
        private Long id;
        private Long teacherId;
        private String teacherName;
        private BigDecimal basicSalary;
        private BigDecimal netSalary;
        private BigDecimal totalAllowances;
        private BigDecimal totalDeductions;
        private List<SalaryComponentDTO> components;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class GeneratePayslipRequest {
        @NotNull private String month;
        @NotNull private Integer year;
    }
}
