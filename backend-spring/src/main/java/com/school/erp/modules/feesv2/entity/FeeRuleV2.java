package com.school.erp.modules.feesv2.entity;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.RuleType;
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
@Table(name = "fee_rule", indexes = {
        @Index(name = "idx_fee_rule_priority", columnList = "tenant_id, academic_year_id, rule_status, priority_no")
})
public class FeeRuleV2 extends FeeV2AcademicYearEntity {
    @Column(name = "rule_code", nullable = false, length = 80)
    private String ruleCode;

    @Column(name = "rule_name", nullable = false, length = 160)
    private String ruleName;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "rule_type", nullable = false, length = 30)
    private RuleType ruleType;

    @Column(name = "priority_no", nullable = false)
    private Integer priorityNo = 100;

    @Column(name = "rule_status", nullable = false, length = 20)
    private String ruleStatus = "ACTIVE";

    @Column(name = "stop_on_match", nullable = false)
    private Boolean stopOnMatch = Boolean.FALSE;
}
