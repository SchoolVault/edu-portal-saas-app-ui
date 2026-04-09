package com.school.erp.modules.audit.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "audit_logs", indexes = {@Index(name = "idx_audit_tenant_date", columnList = "tenant_id, created_at"), @Index(name = "idx_audit_user", columnList = "tenant_id, user_id")})
public class AuditLog extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private Enums.AuditAction action;
    @Column(nullable = false, length = 50)
    private String module;
    @Column(nullable = false, length = 500)
    private String description;
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "user_name", length = 200)
    private String userName;
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    @Column(name = "entity_id")
    private Long entityId;
    @Column(name = "entity_type", length = 50)
    private String entityType;
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;


    public static class AuditLogBuilder {
        private Enums.AuditAction action;
        private String module;
        private String description;
        private Long userId;
        private String userName;
        private String ipAddress;
        private Long entityId;
        private String entityType;
        private String oldValue;
        private String newValue;

        AuditLogBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder action(final Enums.AuditAction action) {
            this.action = action;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder module(final String module) {
            this.module = module;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder description(final String description) {
            this.description = description;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder userId(final Long userId) {
            this.userId = userId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder userName(final String userName) {
            this.userName = userName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder ipAddress(final String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder entityId(final Long entityId) {
            this.entityId = entityId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder entityType(final String entityType) {
            this.entityType = entityType;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder oldValue(final String oldValue) {
            this.oldValue = oldValue;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AuditLog.AuditLogBuilder newValue(final String newValue) {
            this.newValue = newValue;
            return this;
        }

        public AuditLog build() {
            return new AuditLog(this.action, this.module, this.description, this.userId, this.userName, this.ipAddress, this.entityId, this.entityType, this.oldValue, this.newValue);
        }

        @Override
        public String toString() {
            return "AuditLog.AuditLogBuilder(action=" + this.action + ", module=" + this.module + ", description=" + this.description + ", userId=" + this.userId + ", userName=" + this.userName + ", ipAddress=" + this.ipAddress + ", entityId=" + this.entityId + ", entityType=" + this.entityType + ", oldValue=" + this.oldValue + ", newValue=" + this.newValue + ")";
        }
    }

    public static AuditLog.AuditLogBuilder builder() {
        return new AuditLog.AuditLogBuilder();
    }

    public Enums.AuditAction getAction() {
        return this.action;
    }

    public String getModule() {
        return this.module;
    }

    public String getDescription() {
        return this.description;
    }

    public Long getUserId() {
        return this.userId;
    }

    public String getUserName() {
        return this.userName;
    }

    public String getIpAddress() {
        return this.ipAddress;
    }

    public Long getEntityId() {
        return this.entityId;
    }

    public String getEntityType() {
        return this.entityType;
    }

    public String getOldValue() {
        return this.oldValue;
    }

    public String getNewValue() {
        return this.newValue;
    }

    public void setAction(final Enums.AuditAction action) {
        this.action = action;
    }

    public void setModule(final String module) {
        this.module = module;
    }

    public void setDescription(final String description) {
        this.description = description;
    }

    public void setUserId(final Long userId) {
        this.userId = userId;
    }

    public void setUserName(final String userName) {
        this.userName = userName;
    }

    public void setIpAddress(final String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public void setEntityId(final Long entityId) {
        this.entityId = entityId;
    }

    public void setEntityType(final String entityType) {
        this.entityType = entityType;
    }

    public void setOldValue(final String oldValue) {
        this.oldValue = oldValue;
    }

    public void setNewValue(final String newValue) {
        this.newValue = newValue;
    }

    public AuditLog() {
    }

    public AuditLog(final Enums.AuditAction action, final String module, final String description, final Long userId, final String userName, final String ipAddress, final Long entityId, final String entityType, final String oldValue, final String newValue) {
        this.action = action;
        this.module = module;
        this.description = description;
        this.userId = userId;
        this.userName = userName;
        this.ipAddress = ipAddress;
        this.entityId = entityId;
        this.entityType = entityType;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
}
