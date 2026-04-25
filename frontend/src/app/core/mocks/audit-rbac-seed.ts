import type { AuditLog } from '../models/models';

/**
 * Seed rows for module {@code RBAC} — merged into global audit mocks and used by Settings → Roles & access “recent” strip.
 */
export const MOCK_RBAC_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'rbac-a1',
    action: 'create',
    module: 'RBAC',
    description: 'Custom school role: CUST_FEE_REVIEWER — Fee reviewer (custom)',
    userId: '1',
    userName: 'John Anderson (john.anderson@demo-school.edu)',
    timestamp: '2026-04-20T11:00:00Z',
    ipAddress: '192.168.1.100',
    tenantId: 't1',
  },
  {
    id: 'rbac-a2',
    action: 'update',
    module: 'RBAC',
    description: 'School roles for Sarah Mitchell: added LIBRARY_OPERATIONS',
    userId: '1',
    userName: 'John Anderson (john.anderson@demo-school.edu)',
    timestamp: '2026-04-22T14:20:00Z',
    ipAddress: '192.168.1.100',
    tenantId: 't1',
  },
  {
    id: 'rbac-a3',
    action: 'update',
    module: 'RBAC',
    description: 'Updated custom school role: CUST_FEE_REVIEWER',
    userId: '1',
    userName: 'John Anderson (john.anderson@demo-school.edu)',
    timestamp: '2026-04-23T09:10:00Z',
    ipAddress: '192.168.1.100',
    tenantId: 't1',
  },
  {
    id: 'rbac-a4',
    action: 'delete',
    module: 'RBAC',
    description: 'Removed custom school role: LEGACY_INTERN',
    userId: '1',
    userName: 'John Anderson (john.anderson@demo-school.edu)',
    timestamp: '2026-04-24T08:00:00Z',
    ipAddress: '192.168.1.100',
    tenantId: 't1',
  },
];
