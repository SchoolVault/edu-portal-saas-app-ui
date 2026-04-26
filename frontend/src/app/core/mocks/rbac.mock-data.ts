import { AppPermission } from '../auth/app-permission.constants';
import type {
  CreateCustomSchoolRoleRequest,
  CreatePermissionGroupRequest,
  PermissionGroupRow,
  PermissionGroupSummary,
  RbacStaffUserRow,
  SchoolRoleRow,
  UpdateCustomSchoolRoleRequest,
  UpdatePermissionGroupRequest,
  UserSchoolRoleAssignments,
} from '../models/rbac.model';

/** Mirrors backend {@code SchoolRbacPermissionCatalog} (no platform / portal identity-only codes). */
export function mockGetPermissionCatalog(): string[] {
  return [...MOCK_ASSIGNABLE_PERMISSIONS];
}

const MOCK_ASSIGNABLE_PERMISSIONS: readonly string[] = Object.values(AppPermission)
  .filter(
    p =>
      p !== AppPermission.PLATFORM_ADMIN &&
      p !== AppPermission.PORTAL_PARENT &&
      p !== AppPermission.PORTAL_STUDENT &&
      p !== AppPermission.PORTAL_SCHOOL_STAFF
  )
  .sort();

/** In-memory catalog — includes one custom row for UI demo; swap off via environment.useRbacMocks. */
let MOCK_SCHOOL_ROLES: SchoolRoleRow[] = [
  {
    id: 1,
    code: 'SCHOOL_FULL_ADMIN',
    name: 'Full school administration',
    description: 'Configuration, fees, payroll, and school-wide modules.',
    systemRole: true,
    sortOrder: 10,
    permissions: [
      AppPermission.TENANT_ADMIN,
      AppPermission.SCHOOL_FEE_OFFICE,
      AppPermission.SCHOOL_SETTINGS_FINANCE,
      AppPermission.SCHOOL_PAYROLL_OFFICE,
      AppPermission.SCHOOL_SETTINGS_CORE,
    ],
  },
  {
    id: 2,
    code: 'ACADEMIC_STAFF',
    name: 'Academic staff',
    description: 'Teaching, attendance, marks, class scope.',
    systemRole: true,
    sortOrder: 20,
    permissions: [AppPermission.ACADEMIC_TEACHER, AppPermission.FEE_STRUCTURES_READ],
  },
  {
    id: 3,
    code: 'FEE_OFFICE',
    name: 'Fee & accounts desk',
    description: 'Record collections, fee structures, and fee reports.',
    systemRole: true,
    sortOrder: 30,
    permissions: [AppPermission.SCHOOL_FEE_OFFICE, AppPermission.FEE_STRUCTURES_READ],
  },
  {
    id: 4,
    code: 'LIBRARY_OPERATIONS',
    name: 'Library operations',
    description: 'Catalog, circulation, library fines where enabled.',
    systemRole: true,
    sortOrder: 60,
    permissions: [AppPermission.LIBRARY_MANAGE, AppPermission.LIBRARY_CIRCULATION, AppPermission.FEE_STRUCTURES_READ],
  },
  {
    id: 5,
    code: 'PAYROLL_OFFICE',
    name: 'Payroll & salary desk',
    description: 'Payslips, salary structure, and disbursement.',
    systemRole: true,
    sortOrder: 40,
    permissions: [AppPermission.SCHOOL_PAYROLL_OFFICE, AppPermission.FEE_STRUCTURES_READ],
  },
  {
    id: 6,
    code: 'EXAM_OFFICE',
    name: 'Examination cell',
    description: 'Exam planning and school exam reports.',
    systemRole: true,
    sortOrder: 50,
    permissions: [AppPermission.SCHOOL_EXAMS_OFFICE, AppPermission.SCHOOL_REPORTS_SCHOOL, AppPermission.FEE_STRUCTURES_READ],
  },
  {
    id: 7,
    code: 'TENANT_SETTINGS',
    name: 'School settings & finance profile',
    description: 'Branding, feature flags, finance routing (without full admin).',
    systemRole: true,
    sortOrder: 70,
    permissions: [AppPermission.TENANT_ADMIN, AppPermission.SCHOOL_SETTINGS_CORE, AppPermission.SCHOOL_SETTINGS_FINANCE, AppPermission.FEE_STRUCTURES_READ],
  },
  {
    id: 100,
    code: 'CUST_FEE_REVIEWER',
    name: 'Fee reviewer (custom)',
    description: 'Read-only fee structures and reports (mock custom role).',
    systemRole: false,
    sortOrder: 150,
    permissions: [AppPermission.FEE_STRUCTURES_READ, AppPermission.SCHOOL_REPORTS_SCHOOL],
  },
];

/** Reusable permission packs (mock). */
let MOCK_PERMISSION_GROUPS: PermissionGroupRow[] = [
  {
    id: 500,
    code: 'PACK_FEE_AND_REPORTS',
    name: 'Fee structures + school reports',
    description: 'Read-only finance visibility for reviewers.',
    systemTemplate: false,
    sortOrder: 5,
    permissions: [AppPermission.FEE_STRUCTURES_READ, AppPermission.SCHOOL_REPORTS_SCHOOL],
  },
];

const MOCK_STAFF: RbacStaffUserRow[] = [
  { id: 1, name: 'John Anderson', email: 'admin@school.com', portalRole: 'admin' },
  { id: 2, name: 'Sarah Mitchell', email: 'teacher@school.com', portalRole: 'teacher' },
  { id: 901, name: 'Asha Krishnan', email: 'library@school.com', portalRole: 'library_staff' },
];

/** In-memory per-user selected role ids (resets on reload) — only when useRbacMocks. */
const mockUserRoles = new Map<number, number[]>([
  [1, [1]],
  [2, [2]],
  [901, [4]],
]);

let nextId = 200;
let nextPackId = 600;

function rowsForIds(ids: number[]): SchoolRoleRow[] {
  const set = new Set(ids);
  return MOCK_SCHOOL_ROLES.filter(r => set.has(r.id));
}

export function mockGetRbacCatalog(): SchoolRoleRow[] {
  return [...MOCK_SCHOOL_ROLES].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function mockListPermissionGroups(): PermissionGroupRow[] {
  return [...MOCK_PERMISSION_GROUPS].sort((a, b) => a.sortOrder - b.sortOrder);
}

function packSummaries(ids: number[]): PermissionGroupSummary[] {
  const set = new Set(ids);
  return MOCK_PERMISSION_GROUPS.filter(p => set.has(p.id)).map(p => ({ id: p.id, code: p.code, name: p.name }));
}

function unionPermissionsFromPackIds(ids: number[]): string[] {
  const uniq = new Set<string>();
  for (const id of ids) {
    const p = MOCK_PERMISSION_GROUPS.find(x => x.id === id);
    if (p) {
      for (const c of p.permissions) {
        uniq.add(c);
      }
    }
  }
  return [...uniq].sort();
}

export function mockCreatePermissionGroup(body: CreatePermissionGroupRequest): PermissionGroupRow {
  const perms = [...new Set(body.permissions)];
  for (const p of perms) {
    if (!MOCK_ASSIGNABLE_PERMISSIONS.includes(p)) {
      throw new Error('Unknown or disallowed permission: ' + p);
    }
  }
  const row: PermissionGroupRow = {
    id: nextPackId++,
    code: body.code.trim().toUpperCase(),
    name: body.name,
    description: body.description ?? '',
    systemTemplate: false,
    sortOrder: body.sortOrder,
    permissions: perms.sort(),
  };
  MOCK_PERMISSION_GROUPS = [...MOCK_PERMISSION_GROUPS, row];
  return row;
}

export function mockUpdatePermissionGroup(groupId: number, body: UpdatePermissionGroupRequest): PermissionGroupRow {
  const idx = MOCK_PERMISSION_GROUPS.findIndex(p => p.id === groupId);
  if (idx < 0) {
    throw new Error('Permission pack not found');
  }
  const e = MOCK_PERMISSION_GROUPS[idx];
  if (e.systemTemplate) {
    throw new Error('System template packs cannot be modified in mock');
  }
  const perms = [...new Set(body.permissions)];
  const row: PermissionGroupRow = {
    ...e,
    name: body.name,
    description: body.description ?? '',
    sortOrder: body.sortOrder,
    permissions: perms.sort(),
  };
  MOCK_PERMISSION_GROUPS = MOCK_PERMISSION_GROUPS.map((x, i) => (i === idx ? row : x));
  return row;
}

export function mockDeletePermissionGroup(groupId: number): void {
  const e = MOCK_PERMISSION_GROUPS.find(p => p.id === groupId);
  if (!e) {
    throw new Error('Permission pack not found');
  }
  if (e.systemTemplate) {
    throw new Error('System pack cannot be deleted in mock');
  }
  MOCK_PERMISSION_GROUPS = MOCK_PERMISSION_GROUPS.filter(p => p.id !== groupId);
  MOCK_SCHOOL_ROLES = MOCK_SCHOOL_ROLES.map(r => ({
    ...r,
    permissionGroupIds: (r.permissionGroupIds ?? []).filter(id => id !== groupId),
    permissionGroups: (r.permissionGroups ?? []).filter(g => g.id !== groupId),
  }));
}

export function mockListRbacStaff(): RbacStaffUserRow[] {
  return [...MOCK_STAFF];
}

export function mockGetUserAssignments(userId: number): UserSchoolRoleAssignments {
  const ids = mockUserRoles.get(userId) ?? (userId === 1 ? [1] : userId === 2 ? [2] : [4]);
  return { schoolRoleIds: [...ids], schoolRoles: rowsForIds(ids) };
}

export function mockReplaceAssignments(userId: number, schoolRoleIds: number[]): UserSchoolRoleAssignments {
  const uniq = [...new Set(schoolRoleIds)];
  for (const rid of uniq) {
    if (!MOCK_SCHOOL_ROLES.some(r => r.id === rid)) {
      throw new Error('Invalid school role id in mock');
    }
  }
  mockUserRoles.set(userId, uniq);
  return { schoolRoleIds: uniq, schoolRoles: rowsForIds(uniq) };
}

export function mockCreateCustomRole(body: CreateCustomSchoolRoleRequest): SchoolRoleRow {
  if (MOCK_SCHOOL_ROLES.some(r => r.code === body.code)) {
    throw new Error('A school role with this code already exists.');
  }
  const hasGroups = body.permissionGroupIds != null && body.permissionGroupIds.length > 0;
  const hasPerms = body.permissions != null && body.permissions.some(p => p != null && p !== '');
  if (!hasGroups && !hasPerms) {
    throw new Error('Choose packs or direct permissions.');
  }
  let perms: string[];
  let groupIds: number[] | undefined;
  let groups: PermissionGroupSummary[] | undefined;
  if (hasGroups) {
    groupIds = [...new Set(body.permissionGroupIds!)];
    for (const id of groupIds) {
      if (!MOCK_PERMISSION_GROUPS.some(p => p.id === id)) {
        throw new Error('Unknown permission pack id in mock');
      }
    }
    perms = unionPermissionsFromPackIds(groupIds);
    groups = packSummaries(groupIds);
  } else {
    perms = [...new Set(body.permissions!)];
    for (const p of perms) {
      if (!MOCK_ASSIGNABLE_PERMISSIONS.includes(p)) {
        throw new Error('Unknown or disallowed permission: ' + p);
      }
    }
    perms.sort();
  }
  const row: SchoolRoleRow = {
    id: nextId++,
    code: body.code.trim(),
    name: body.name,
    description: body.description ?? '',
    systemRole: false,
    sortOrder: body.sortOrder,
    permissions: perms,
    permissionGroupIds: groupIds,
    permissionGroups: groups,
  };
  MOCK_SCHOOL_ROLES = [...MOCK_SCHOOL_ROLES, row];
  return row;
}

export function mockUpdateCustomRole(roleId: number, body: UpdateCustomSchoolRoleRequest): SchoolRoleRow {
  const idx = MOCK_SCHOOL_ROLES.findIndex(r => r.id === roleId);
  if (idx < 0) {
    throw new Error('School role not found');
  }
  const e = MOCK_SCHOOL_ROLES[idx];
  if (e.systemRole) {
    throw new Error('System template roles cannot be modified in mock');
  }
  const hasGroups = body.permissionGroupIds != null && body.permissionGroupIds.length > 0;
  const hasPerms = body.permissions != null && body.permissions.some(p => p != null && p !== '');
  if (!hasGroups && !hasPerms) {
    throw new Error('Choose packs or direct permissions.');
  }
  let perms: string[];
  let groupIds: number[] | undefined;
  let groups: PermissionGroupSummary[] | undefined;
  if (hasGroups) {
    groupIds = [...new Set(body.permissionGroupIds!)];
    for (const id of groupIds) {
      if (!MOCK_PERMISSION_GROUPS.some(p => p.id === id)) {
        throw new Error('Unknown permission pack id in mock');
      }
    }
    perms = unionPermissionsFromPackIds(groupIds);
    groups = packSummaries(groupIds);
  } else {
    perms = [...new Set(body.permissions!)];
    for (const p of perms) {
      if (!MOCK_ASSIGNABLE_PERMISSIONS.includes(p)) {
        throw new Error('Unknown or disallowed permission: ' + p);
      }
    }
    perms.sort();
  }
  const row: SchoolRoleRow = {
    ...e,
    name: body.name,
    description: body.description ?? '',
    sortOrder: body.sortOrder,
    permissions: perms,
    permissionGroupIds: groupIds,
    permissionGroups: groups,
  };
  MOCK_SCHOOL_ROLES = MOCK_SCHOOL_ROLES.map((x, i) => (i === idx ? row : x));
  return row;
}

export function mockDeleteCustomRole(roleId: number): void {
  const e = MOCK_SCHOOL_ROLES.find(r => r.id === roleId);
  if (!e) {
    throw new Error('School role not found');
  }
  if (e.systemRole) {
    throw new Error('System role cannot be deleted in mock');
  }
  MOCK_SCHOOL_ROLES = MOCK_SCHOOL_ROLES.filter(r => r.id !== roleId);
  for (const [uid, list] of mockUserRoles) {
    mockUserRoles.set(
      uid,
      list.filter(id => id !== roleId)
    );
  }
}
