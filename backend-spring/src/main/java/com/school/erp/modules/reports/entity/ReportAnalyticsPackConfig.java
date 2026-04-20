package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "report_analytics_pack_configs", indexes = {
        @Index(name = "idx_report_analytics_pack", columnList = "tenant_id, pack_code, is_deleted")
})
public class ReportAnalyticsPackConfig extends BaseEntity {
    @Column(name = "pack_code", nullable = false, length = 30)
    private String packCode;
    @Column(name = "config_json", nullable = false, columnDefinition = "json")
    private String configJson;
    @Column(name = "formula_json", nullable = false, columnDefinition = "json")
    private String formulaJson;

    public String getPackCode() { return packCode; }
    public void setPackCode(String packCode) { this.packCode = packCode; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public String getFormulaJson() { return formulaJson; }
    public void setFormulaJson(String formulaJson) { this.formulaJson = formulaJson; }
}
