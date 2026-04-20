package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "exam_templates", indexes = {
        @Index(name = "idx_exam_template_lookup", columnList = "tenant_id, board_type, is_deleted")
})
public class ExamTemplate extends BaseEntity {
    @Column(nullable = false, length = 140)
    private String name;
    @Column(name = "board_type", nullable = false, length = 40)
    private String boardType;
    @Column(name = "class_band", length = 50)
    private String classBand;
    @Column(name = "default_marking_scheme", length = 40)
    private String defaultMarkingScheme;
    @Column(name = "rules_json", columnDefinition = "json")
    private String rulesJson;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBoardType() {
        return boardType;
    }

    public void setBoardType(String boardType) {
        this.boardType = boardType;
    }

    public String getClassBand() {
        return classBand;
    }

    public void setClassBand(String classBand) {
        this.classBand = classBand;
    }

    public String getDefaultMarkingScheme() {
        return defaultMarkingScheme;
    }

    public void setDefaultMarkingScheme(String defaultMarkingScheme) {
        this.defaultMarkingScheme = defaultMarkingScheme;
    }

    public String getRulesJson() {
        return rulesJson;
    }

    public void setRulesJson(String rulesJson) {
        this.rulesJson = rulesJson;
    }
}
