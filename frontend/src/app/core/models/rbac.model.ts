/**
 * Aligned with Spring {@code RbacDTOs} — same field names for drop-in when mocks are off.
 */
export interface PermissionGroupSummary {
  id: number;
  code: string;
  name: string;
}

export interface SchoolRoleRow {
  id: number;
  code: string;
  name: string;
  description: string;
  systemRole: boolean;
  sortOrder: number;
  permissions: string[];
  permissionGroupIds?: number[];
  permissionGroups?: PermissionGroupSummary[];
}

export interface PermissionGroupRow {
  id: number;
  code: string;
  name: string;
  description?: string;
  systemTemplate: boolean;
  sortOrder: number;
  permissions: string[];
}

export interface RbacStaffUserRow {
  id: number;
  name: string;
  email?: string;
  portalRole: string;
}

export interface UserSchoolRoleAssignments {
  schoolRoleIds: number[];
  schoolRoles: SchoolRoleRow[];
}

/** {@code RbacDTOs.CreateCustomSchoolRoleRequest} */
export interface CreateCustomSchoolRoleRequest {
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  /** Use with “direct permissions” compose mode. */
  permissions?: string[];
  /** Use with “link packs” compose mode. */
  permissionGroupIds?: number[];
}

/** {@code RbacDTOs.UpdateCustomSchoolRoleRequest} */
export interface UpdateCustomSchoolRoleRequest {
  name: string;
  description?: string;
  sortOrder: number;
  permissions?: string[];
  permissionGroupIds?: number[];
}

/** {@code RbacDTOs.CreatePermissionGroupRequest} */
export interface CreatePermissionGroupRequest {
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  permissions: string[];
}

/** {@code RbacDTOs.UpdatePermissionGroupRequest} */
export interface UpdatePermissionGroupRequest {
  name: string;
  description?: string;
  sortOrder: number;
  permissions: string[];
}
