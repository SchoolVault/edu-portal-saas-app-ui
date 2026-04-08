package com.school.erp.modules.payroll.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.LocalDate;
@Entity @Table(name = "payslips", indexes = {@Index(name = "idx_payslip_teacher", columnNames = {"tenant_id", "teacher_id"})})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Payslip extends BaseEntity {
    @Column(name = "teacher_id", nullable = false) private Long teacherId;
    @Column(name = "teacher_name", length = 200) private String teacherName;
    @Column(length = 20) private String month;
    private Integer year;
    @Column(name = "basic_salary", precision = 12, scale = 2) private BigDecimal basicSalary;
    @Column(name = "total_allowances", precision = 12, scale = 2) private BigDecimal totalAllowances;
    @Column(name = "total_deductions", precision = 12, scale = 2) private BigDecimal totalDeductions;
    @Column(name = "net_salary", precision = 12, scale = 2) private BigDecimal netSalary;
    @Enumerated(EnumType.STRING) @Column(length = 15) private Enums.PayslipStatus status;
    @Column(name = "payment_date") private LocalDate paymentDate;
}
