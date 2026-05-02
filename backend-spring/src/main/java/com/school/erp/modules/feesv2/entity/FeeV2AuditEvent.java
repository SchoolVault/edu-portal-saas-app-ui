package com.school.erp.modules.feesv2.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * Append-only financial audit for fees-v2 (separate from generic entity auditing).
 */
@Getter
@Setter
@Entity
@Table(name = "fee_v2_audit_event", indexes = {
        @Index(name = "idx_fee_v2_audit_tenant_year_created", columnList = "tenant_id, academic_year_id, created_at")
})
public class FeeV2AuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Column(name = "academic_year_id", nullable = false)
    private Long academicYearId;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "action_code", nullable = false, length = 80)
    private String actionCode;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "correlation_id", length = 80)
    private String correlationId;

    @Column(name = "detail_json", columnDefinition = "json")
    private String detailJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
