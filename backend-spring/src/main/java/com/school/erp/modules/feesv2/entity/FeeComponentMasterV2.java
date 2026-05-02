package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.ComponentType;
import com.school.erp.modules.feesv2.domain.FeeV2Enums.FrequencyType;
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
@Table(name = "fee_component_master", indexes = {
        @Index(name = "idx_fcm_tenant_year_active", columnList = "tenant_id, academic_year_id, is_deleted, is_active")
})
public class FeeComponentMasterV2 extends FeeV2AcademicYearEntity {
    @Column(name = "code", nullable = false, length = 60)
    private String code;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "component_type", nullable = false, length = 20)
    private ComponentType componentType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "frequency", nullable = false, length = 20)
    private FrequencyType frequency;

    @Column(name = "optional_component", nullable = false)
    private Boolean optionalComponent = Boolean.FALSE;

    @Column(name = "refundable", nullable = false)
    private Boolean refundable = Boolean.FALSE;

    @Column(name = "metadata_json", columnDefinition = "json")
    private String metadataJson;
}
