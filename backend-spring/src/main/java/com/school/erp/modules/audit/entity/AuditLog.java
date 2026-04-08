package com.school.erp.modules.audit.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_tenant_date", columnNames = {"tenant_id", "created_at"}),
    @Index(name = "idx_audit_user", columnNames = {"tenant_id", "user_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLog extends BaseEntity {
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Enums.AuditAction action;
    @Column(nullable = false, length = 50) private String module;
    @Column(nullable = false, length = 500) private String description;
    @Column(name = "user_id") private Long userId;
    @Column(name = "user_name", length = 200) private String userName;
    @Column(name = "ip_address", length = 45) private String ipAddress;
    @Column(name = "entity_id") private Long entityId;
    @Column(name = "entity_type", length = 50) private String entityType;
    @Column(name = "old_value", columnDefinition = "TEXT") private String oldValue;
    @Column(name = "new_value", columnDefinition = "TEXT") private String newValue;
}
