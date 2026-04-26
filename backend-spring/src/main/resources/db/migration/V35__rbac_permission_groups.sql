-- =============================================================================
-- Phase 2b — Reusable permission groups + school-role composition.
-- Effective permissions for a school role = union of linked group grants when
-- at least one link exists; otherwise legacy permissions_csv on rbac_school_role.
-- =============================================================================

CREATE TABLE IF NOT EXISTS rbac_permission_group (
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
    system_template TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rbac_pg_tenant_code (tenant_id, code),
    KEY idx_rbac_pg_tenant (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rbac_group_permission (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    permission_group_id BIGINT NOT NULL,
    permission_code VARCHAR(128) NOT NULL,
    created_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rbac_gp_group_code (permission_group_id, permission_code),
    KEY idx_rbac_gp_tenant (tenant_id),
    CONSTRAINT fk_rbac_gp_group FOREIGN KEY (permission_group_id) REFERENCES rbac_permission_group (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rbac_school_role_permission_group (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL,
    school_role_id BIGINT NOT NULL,
    permission_group_id BIGINT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_rbac_sr_pg (school_role_id, permission_group_id),
    KEY idx_rbac_srg_role (school_role_id),
    KEY idx_rbac_srg_pg (permission_group_id),
    CONSTRAINT fk_rbac_srg_role FOREIGN KEY (school_role_id) REFERENCES rbac_school_role (id) ON DELETE CASCADE,
    CONSTRAINT fk_rbac_srg_pg FOREIGN KEY (permission_group_id) REFERENCES rbac_permission_group (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
