package com.school.erp.modules.importexport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "import_ledger",
        indexes = {
                @Index(name = "idx_import_ledger_tenant_job", columnList = "tenant_id, job_id, id")
        }
)
public class ImportLedgerEntry extends BaseEntity {

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "job_line_id")
    private Long jobLineId;

    @Column(name = "line_index", nullable = false)
    private Integer lineIndex;

    @Column(name = "outcome", nullable = false, length = 32)
    private String outcome;

    @Column(name = "entity_type", length = 64)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "natural_key", length = 512)
    private String naturalKey;

    @Column(name = "rollback_guidance", length = 2000)
    private String rollbackGuidance;

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public Long getJobLineId() {
        return jobLineId;
    }

    public void setJobLineId(Long jobLineId) {
        this.jobLineId = jobLineId;
    }

    public Integer getLineIndex() {
        return lineIndex;
    }

    public void setLineIndex(Integer lineIndex) {
        this.lineIndex = lineIndex;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getNaturalKey() {
        return naturalKey;
    }

    public void setNaturalKey(String naturalKey) {
        this.naturalKey = naturalKey;
    }

    public String getRollbackGuidance() {
        return rollbackGuidance;
    }

    public void setRollbackGuidance(String rollbackGuidance) {
        this.rollbackGuidance = rollbackGuidance;
    }
}
