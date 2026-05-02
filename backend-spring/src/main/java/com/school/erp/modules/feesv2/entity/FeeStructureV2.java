package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.StructureStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "fee_structure", indexes = {
        @Index(name = "idx_fee_structure_tenant_class", columnList = "tenant_id, academic_year_id, class_id, is_deleted")
})
public class FeeStructureV2 extends FeeV2AcademicYearEntity {
    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "structure_name", nullable = false, length = 120)
    private String structureName;

    @Column(name = "version_no", nullable = false)
    private Integer versionNo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 20)
    private StructureStatus status = StructureStatus.DRAFT;

    @Column(name = "rule_expression", length = 1000)
    private String ruleExpression;
}
