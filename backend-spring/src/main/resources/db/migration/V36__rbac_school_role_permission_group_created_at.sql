-- Align rbac_school_role_permission_group with SchoolRolePermissionGroup.createdAt (Hibernate mapping).
ALTER TABLE rbac_school_role_permission_group
    ADD COLUMN created_at DATETIME(6) NULL AFTER sort_order;
