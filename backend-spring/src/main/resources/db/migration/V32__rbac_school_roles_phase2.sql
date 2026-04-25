-- =============================================================================
-- Phase 2 — Tenant-scoped school responsibility roles (RBAC) + user assignments.
-- Permissions are stored as CSV of {@code AppPermission} names; resolved at
-- session mint time. Legacy {@code users.role} is retained as portal identity;
-- staff may hold multiple school roles in rbac_user_school_role.
-- =============================================================================

CREATE TABLE IF NOT EXISTS rbac_school_role (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    deleted_at DATETIME(6) NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500) NULL,
    system_role TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    permissions_csv TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rbac_school_role_tenant_code (tenant_id, code),
    KEY idx_rbac_school_role_tenant (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rbac_user_school_role (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    school_role_id BIGINT NOT NULL,
    created_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rbac_user_school_role (tenant_id, user_id, school_role_id),
    KEY idx_rbac_usr_tenant_user (tenant_id, user_id),
    CONSTRAINT fk_rbac_usr_school_role FOREIGN KEY (school_role_id) REFERENCES rbac_school_role (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
