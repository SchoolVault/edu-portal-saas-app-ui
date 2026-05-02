package com.school.erp.modules.feesv2.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "fee_rule_condition", indexes = {
        @Index(name = "idx_fee_rule_condition_rule", columnList = "tenant_id, academic_year_id, fee_rule_id, condition_order")
})
public class FeeRuleConditionV2 extends FeeV2AcademicYearEntity {
    @Column(name = "fee_rule_id", nullable = false)
    private Long feeRuleId;

    @Column(name = "condition_order", nullable = false)
    private Integer conditionOrder;

    @Column(name = "field_name", nullable = false, length = 80)
    private String fieldName;

    @Column(name = "operator", nullable = false, length = 30)
    private String operator;

    @Column(name = "value_type", nullable = false, length = 20)
    private String valueType;

    @Column(name = "value_text", length = 255)
    private String valueText;

    @Column(name = "value_number", precision = 14, scale = 2)
    private BigDecimal valueNumber;

    @Column(name = "value_json", columnDefinition = "json")
    private String valueJson;

    @Column(name = "logical_join", nullable = false, length = 10)
    private String logicalJoin = "AND";
}
