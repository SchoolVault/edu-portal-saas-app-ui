/**
 * Aligned with Spring {@code RbacDTOs} — same field names for drop-in when mocks are off.
 */
export interface SchoolRoleRow {
  id: number;
  code: string;
  name: string;
  description: string;
  systemRole: boolean;
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
  permissions: string[];
}

/** {@code RbacDTOs.UpdateCustomSchoolRoleRequest} */
export interface UpdateCustomSchoolRoleRequest {
  name: string;
  description?: string;
  sortOrder: number;
  permissions: string[];
}
