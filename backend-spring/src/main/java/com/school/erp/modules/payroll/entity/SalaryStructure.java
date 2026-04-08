package com.school.erp.modules.payroll.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;
@Entity @Table(name = "salary_structures") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SalaryStructure extends BaseEntity {
    @Column(name = "teacher_id", nullable = false) private Long teacherId;
    @Column(name = "teacher_name", length = 200) private String teacherName;
    @Column(name = "basic_salary", precision = 12, scale = 2) private BigDecimal basicSalary;
    @Column(name = "net_salary", precision = 12, scale = 2) private BigDecimal netSalary;
}
