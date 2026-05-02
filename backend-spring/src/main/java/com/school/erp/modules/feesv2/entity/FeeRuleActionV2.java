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
@Table(name = "fee_rule_action", indexes = {
        @Index(name = "idx_fee_rule_action_rule", columnList = "tenant_id, academic_year_id, fee_rule_id, action_order")
})
public class FeeRuleActionV2 extends FeeV2AcademicYearEntity {
    @Column(name = "fee_rule_id", nullable = false)
    private Long feeRuleId;

    @Column(name = "action_order", nullable = false)
    private Integer actionOrder;

    @Column(name = "action_type", nullable = false, length = 40)
    private String actionType;

    @Column(name = "target_scope", length = 30)
    private String targetScope;

    @Column(name = "value_type", length = 20)
    private String valueType;

    @Column(name = "value_number", precision = 14, scale = 2)
    private BigDecimal valueNumber;

    @Column(name = "value_text", length = 255)
    private String valueText;

    @Column(name = "value_json", columnDefinition = "json")
    private String valueJson;
}
