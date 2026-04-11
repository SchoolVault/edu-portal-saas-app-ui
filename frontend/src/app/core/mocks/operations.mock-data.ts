import type { InventoryRow, OperationalStaffRow, PayrollAccrualSummary } from '../models/operations.models';

export const MOCK_OPERATIONS_STAFF_SEED: OperationalStaffRow[] = [
  { id: '1', staffRole: 'DRIVER', fullName: 'Rahim Khan', phone: '+91-900001', employeeCode: 'DRV-01', transportRouteId: '10' },
  { id: '2', staffRole: 'SECURITY', fullName: 'Anita Desai', phone: '+91-900002', employeeCode: 'SEC-02' },
];

export const MOCK_OPERATIONS_INVENTORY_SEED: InventoryRow[] = [
  { id: '1', sku: 'CHALK-01', name: 'White chalk box', category: 'Supplies', quantityOnHand: 40, reorderLevel: 10, location: 'Store A' },
];

export function mockPayrollAccrualSummary(period?: string): PayrollAccrualSummary {
  return {
    periodLabel: period || '2026-04',
    grossAccrued: 0,
    deductionsAccrued: 0,
    netAccrued: 0,
    employeeCount: 0,
    notes: ['Mock: wire to payroll posting service when ready.'],
  };
}
