package com.school.erp.modules.fees.entity;
import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;

@Entity @Table(name = "fee_structures", indexes = {@Index(name = "idx_fs_tenant", columnNames = "tenant_id")})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeeStructure extends BaseEntity {
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "class_id") private Long classId;
    @Column(name = "class_name", length = 50) private String className;
    @Column(name = "academic_year_id") private Long academicYearId;
    @Column(name = "total_amount", precision = 12, scale = 2) private BigDecimal totalAmount;
}
