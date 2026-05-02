package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.FrequencyType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "fee_structure_component", indexes = {
        @Index(name = "idx_fsc_structure", columnList = "tenant_id, academic_year_id, fee_structure_id, is_deleted")
})
public class FeeStructureComponentV2 extends FeeV2AcademicYearEntity {
    @Column(name = "fee_structure_id", nullable = false)
    private Long feeStructureId;

    @Column(name = "fee_component_master_id", nullable = false)
    private Long feeComponentMasterId;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "frequency_override", length = 20)
    private FrequencyType frequencyOverride;

    @Column(name = "optional_override")
    private Boolean optionalOverride;
}
