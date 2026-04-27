package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "hostel_audit_logs", indexes = {
        @Index(name = "idx_hal_tenant_action", columnList = "tenant_id, action_code"),
        @Index(name = "idx_hal_tenant_actor", columnList = "tenant_id, actor_user_id"),
        @Index(name = "idx_hal_tenant_entity", columnList = "tenant_id, entity_type, entity_id")
})
public class HostelAuditLog extends BaseEntity {
    @Column(name = "action_code", length = 80)
    private String actionCode;
    @Column(name = "entity_type", length = 50)
    private String entityType;
    @Column(name = "entity_id")
    private Long entityId;
    @Column(name = "actor_user_id")
    private Long actorUserId;
    @Column(name = "actor_role", length = 40)
    private String actorRole;
    @Column(name = "actor_name", length = 200)
    private String actorName;
    @Column(name = "change_summary", length = 500)
    private String changeSummary;
    @Column(name = "diff_json", columnDefinition = "TEXT")
    private String diffJson;
    @Column(name = "request_ip", length = 80)
    private String requestIp;

    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getChangeSummary() { return changeSummary; }
    public void setChangeSummary(String changeSummary) { this.changeSummary = changeSummary; }
    public String getDiffJson() { return diffJson; }
    public void setDiffJson(String diffJson) { this.diffJson = diffJson; }
    public String getRequestIp() { return requestIp; }
    public void setRequestIp(String requestIp) { this.requestIp = requestIp; }
}
