package com.school.erp.modules.fees.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;

@Entity @Table(name = "fee_components")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeeComponent extends BaseEntity {
    @Column(name = "fee_structure_id", nullable = false) private Long feeStructureId;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(length = 20) private Enums.FeeComponentType type;
}
