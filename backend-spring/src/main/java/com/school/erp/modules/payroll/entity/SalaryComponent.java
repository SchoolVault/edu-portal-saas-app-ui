package com.school.erp.modules.payroll.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;
@Entity @Table(name = "salary_components") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SalaryComponent extends BaseEntity {
    @Column(name = "salary_structure_id", nullable = false) private Long salaryStructureId;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15) private Enums.SalaryComponentType type;
}
