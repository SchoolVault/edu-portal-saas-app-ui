package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.LateFeeCalculationMode;
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
@Table(name = "fee_late_fee_policy_v2", indexes = {
        @Index(name = "idx_late_fee_policy_tenant_year", columnList = "tenant_id, academic_year_id, is_deleted, is_active")
})
public class FeeLateFeePolicyV2 extends FeeV2AcademicYearEntity {
    @Column(name = "policy_code", nullable = false, length = 60)
    private String policyCode;

    @Column(name = "policy_name", nullable = false, length = 160)
    private String policyName;

    @Column(name = "grace_days", nullable = false)
    private Integer graceDays = 0;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "calculation_mode", nullable = false, length = 30)
    private LateFeeCalculationMode calculationMode;

    @Column(name = "flat_amount", precision = 14, scale = 2)
    private BigDecimal flatAmount;

    @Column(name = "rate_percent", precision = 7, scale = 4)
    private BigDecimal ratePercent;

    @Column(name = "max_late_amount", precision = 14, scale = 2)
    private BigDecimal maxLateAmount;
}
