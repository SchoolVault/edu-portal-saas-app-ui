package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "exam_template_components", indexes = {
        @Index(name = "idx_exam_template_component_lookup", columnList = "tenant_id, template_id, is_deleted")
})
public class ExamTemplateComponent extends BaseEntity {
    @Column(name = "template_id", nullable = false)
    private Long templateId;
    @Column(name = "component_code", nullable = false, length = 60)
    private String componentCode;
    @Column(name = "component_label", nullable = false, length = 120)
    private String componentLabel;
    @Column(name = "max_marks", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxMarks;
    @Column(name = "weightage_pct", nullable = false, precision = 6, scale = 2)
    private BigDecimal weightagePct;
    @Column(name = "is_optional", nullable = false)
    private Boolean optional;
    @Column(name = "rule_json", columnDefinition = "json")
    private String ruleJson;

    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }
    public String getComponentCode() { return componentCode; }
    public void setComponentCode(String componentCode) { this.componentCode = componentCode; }
    public String getComponentLabel() { return componentLabel; }
    public void setComponentLabel(String componentLabel) { this.componentLabel = componentLabel; }
    public BigDecimal getMaxMarks() { return maxMarks; }
    public void setMaxMarks(BigDecimal maxMarks) { this.maxMarks = maxMarks; }
    public BigDecimal getWeightagePct() { return weightagePct; }
    public void setWeightagePct(BigDecimal weightagePct) { this.weightagePct = weightagePct; }
    public Boolean getOptional() { return optional; }
    public void setOptional(Boolean optional) { this.optional = optional; }
    public String getRuleJson() { return ruleJson; }
    public void setRuleJson(String ruleJson) { this.ruleJson = ruleJson; }
}
