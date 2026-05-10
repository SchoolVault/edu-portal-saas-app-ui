package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "report_templates", indexes = {
        @Index(name = "idx_report_template_lookup", columnList = "tenant_id, report_type, is_deleted")
})
public class ReportTemplate extends BaseEntity {
    @Column(name = "template_code", nullable = false, length = 80)
    private String templateCode;
    @Column(nullable = false, length = 140)
    private String name;
    @Column(name = "report_type", nullable = false, length = 60)
    private String reportType;
    @Column(name = "default_format", nullable = false, length = 20)
    private String defaultFormat = "PDF";
    @Column(name = "layout_config_json", columnDefinition = "json")
    private String layoutConfigJson;
    @Column(name = "filter_schema_json", columnDefinition = "json")
    private String filterSchemaJson;
    @Column(name = "pack_code", length = 40)
    private String packCode;
    @Column(name = "is_system_template", nullable = false)
    private Boolean isSystemTemplate = false;

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getDefaultFormat() {
        return defaultFormat;
    }

    public void setDefaultFormat(String defaultFormat) {
        this.defaultFormat = defaultFormat;
    }

    public String getLayoutConfigJson() {
        return layoutConfigJson;
    }

    public void setLayoutConfigJson(String layoutConfigJson) {
        this.layoutConfigJson = layoutConfigJson;
    }

    public String getFilterSchemaJson() {
        return filterSchemaJson;
    }

    public void setFilterSchemaJson(String filterSchemaJson) {
        this.filterSchemaJson = filterSchemaJson;
    }

    public String getPackCode() {
        return packCode;
    }

    public void setPackCode(String packCode) {
        this.packCode = packCode;
    }

    public Boolean getSystemTemplate() {
        return isSystemTemplate;
    }

    public void setSystemTemplate(Boolean systemTemplate) {
        isSystemTemplate = systemTemplate;
    }
}
