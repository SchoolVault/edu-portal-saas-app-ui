import type { SchoolBranch, TenantConfig } from '../models/models';

export const MOCK_TENANT_CONFIG_DEFAULT: TenantConfig = {
  id: '1',
  schoolName: 'SchoolVault Academy',
  schoolCode: 'SCH001',
  address: '123 Education Lane, Knowledge City',
  phone: '+91-9876009834',
  email: 'schoolvault@gmail.com',
  primaryColor: '#1B3A30',
  secondaryColor: '#C05C3D',
  features: {
    feeReminderAutomation: false,
    chat: true,
    transport: true,
    hostel: true,
    library: true,
    audit: true,
    operationsHub: true,
    importExport: true,
    directory: true,
    leave: true,
  },
  tenantId: 't1',
};

export function mockSchoolBranches(schoolCode: string): SchoolBranch[] {
  const code = schoolCode.trim() || 'SCH001';
  return [
    {
      tenantId: 't1',
      schoolName: 'SchoolVault Academy — Main campus',
      schoolCode: code,
      address: '123 Education Lane, Knowledge City',
      phone: '+91-9876009834',
      email: 'main@schoolvault.edu',
      currentTenant: true,
    },
    {
      tenantId: 't-branch-east',
      schoolName: 'SchoolVault Academy — East wing',
      schoolCode: code,
      address: '88 Riverside Road, Knowledge City',
      phone: '+91-9876009900',
      email: 'east@schoolvault.edu',
      currentTenant: false,
    },
    {
      tenantId: 't-branch-north',
      schoolName: 'SchoolVault Academy — North junior',
      schoolCode: code,
      address: '2 Oak Avenue, Knowledge City',
      phone: '+91-9876009911',
      email: 'north@schoolvault.edu',
      currentTenant: false,
    },
  ];
}
