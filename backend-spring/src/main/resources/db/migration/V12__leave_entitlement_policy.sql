-- Tenant-scoped annual / sick / casual entitlements for leave balance (Indian school HR policy).
-- One row per tenant; aligns with Angular {@code LeaveEntitlementPolicy}.

CREATE TABLE leave_entitlement_policies (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    annual_entitled INT NOT NULL DEFAULT 24,
    sick_entitled INT NOT NULL DEFAULT 12,
    casual_entitled INT NOT NULL DEFAULT 12,
    policy_year_label VARCHAR(120) NULL,
    UNIQUE KEY uk_leave_entitlement_policy_tenant (tenant_id),
    KEY idx_leave_entitlement_tenant_active (tenant_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
