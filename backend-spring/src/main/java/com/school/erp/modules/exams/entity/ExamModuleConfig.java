package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.BaseEntity;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.Filter;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "exam_module_configs", indexes = {
        @Index(name = "idx_exam_module_cfg_lookup", columnList = "tenant_id, academic_year_id, config_key, is_deleted")
})
public class ExamModuleConfig extends BaseEntity implements AcademicYearScopedEntity {
    @Column(name = "academic_year_id", nullable = false)
    private Long academicYearId;
    @Column(name = "config_key", nullable = false, length = 60)
    private String configKey;
    @Column(name = "config_json", columnDefinition = "json", nullable = false)
    private String configJson;
    @Column(name = "version_no", nullable = false)
    private Integer versionNo = 1;
    @Column(name = "note", length = 500)
    private String note;

    @Override
    public Long getAcademicYearId() {
        return academicYearId;
    }

    @Override
    public void setAcademicYearId(Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    public String getConfigKey() {
        return configKey;
    }

    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }

    public String getConfigJson() {
        return configJson;
    }

    public void setConfigJson(String configJson) {
        this.configJson = configJson;
    }

    public Integer getVersionNo() {
        return versionNo;
    }

    public void setVersionNo(Integer versionNo) {
        this.versionNo = versionNo;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
