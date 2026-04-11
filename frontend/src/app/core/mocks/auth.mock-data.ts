import type { LoginRequest } from '../models/models';
import type { ProfileSummary } from '../models/models';
import type { User } from '../models/models';

/** Demo accounts — same shape as future `POST /auth/login` users; delete this file when mocks are off. */
export interface MockLoginRecord {
  email: string;
  password: string;
  schoolCode: string;
  user: User;
}

export const MOCK_LOGIN_USERS: readonly MockLoginRecord[] = [
  {
    email: 'admin@school.com',
    password: 'admin123',
    schoolCode: 'SCH001',
    user: { id: 1, email: 'admin@school.com', name: 'John Anderson', role: 'admin', tenantId: 't1', phone: '+1-555-0101' },
  },
  {
    email: 'teacher@school.com',
    password: 'teacher123',
    schoolCode: 'SCH001',
    user: { id: 2, email: 'teacher@school.com', name: 'Sarah Mitchell', role: 'teacher', tenantId: 't1', phone: '+1-555-0102' },
  },
  {
    email: 'parent@school.com',
    password: 'parent123',
    schoolCode: 'SCH001',
    user: { id: 3, email: 'parent@school.com', name: 'Michael Chen', role: 'parent', tenantId: 't1', phone: '+1-555-0103' },
  },
  {
    email: 'superadmin@schoolvault.com',
    password: 'super123',
    schoolCode: 'PLATFORM',
    user: {
      id: 9901,
      email: 'superadmin@schoolvault.com',
      name: 'Priya Narang',
      role: 'super_admin',
      tenantId: 'platform',
      phone: '+1-555-0199',
    },
  },
];

export function findMockLoginUser(req: LoginRequest): MockLoginRecord | undefined {
  return MOCK_LOGIN_USERS.find(
    u => u.email === req.email && u.password === req.password && u.schoolCode === req.schoolCode
  );
}

/** Mirrors `GET /auth/profile-summary` mock payload per role until API drives the shell. */
export function buildMockProfileSummary(user: User | null): ProfileSummary {
  if (user?.role === 'teacher') {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'teacher',
      tenantId: user.tenantId,
      schoolName: 'Crescent Heights Academy',
      schoolCode: 'SCH001',
      schoolEmail: 'info@crescentheights.edu',
      schoolPhone: '+1-555-1000',
      schoolAddress: '245 Learning Avenue, Austin, TX',
      primaryColor: '#1B3A30',
      secondaryColor: '#C05C3D',
      userTitle: 'Senior Mathematics Teacher',
      qualification: 'M.Sc Mathematics',
      specialization: 'Mathematics',
      subjectCount: 3,
      classTeacherOf: [{ classId: 8, className: 'Class 8', sectionName: 'A', totalStudents: 38 }],
    };
  }
  if (user?.role === 'super_admin') {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'super_admin',
      tenantId: user.tenantId,
      schoolName: 'SchoolVault platform operations',
      schoolCode: 'PLATFORM',
      schoolEmail: 'platform@schoolvault.com',
      schoolPhone: '+1-555-9000',
      schoolAddress: 'Operating console — not a single campus tenant',
      primaryColor: '#0F172A',
      secondaryColor: '#0EA5E9',
      userTitle: 'Platform super administrator',
      platformWorkspaceCount: 4,
      platformOperatorSince: '2024-08-12',
      platformLastLoginDisplay: 'Today · 09:42 (browser session)',
      platformTimezone: 'Asia/Kolkata (operator preference)',
      platformMfaEnabled: true,
      platformPrimaryRegion: 'IN · Primary data residency — multi-tenant EU/US shards available',
    };
  }
  if (user?.role === 'parent') {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: 'parent',
      tenantId: user.tenantId,
      schoolName: 'Crescent Heights Academy',
      schoolCode: 'SCH001',
      schoolEmail: 'info@crescentheights.edu',
      schoolPhone: '+1-555-1000',
      schoolAddress: '245 Learning Avenue, Austin, TX',
      primaryColor: '#1B3A30',
      secondaryColor: '#C05C3D',
      userTitle: 'Parent Account',
      childCount: 2,
    };
  }
  return {
    id: user?.id ?? 1,
    name: user?.name ?? 'John Anderson',
    email: user?.email ?? 'admin@school.com',
    phone: user?.phone ?? '+1-555-0101',
    role: 'admin',
    tenantId: user?.tenantId ?? 't1',
    schoolName: 'Crescent Heights Academy',
    schoolCode: 'SCH001',
    schoolEmail: 'info@crescentheights.edu',
    schoolPhone: '+1-555-1000',
    schoolAddress: '245 Learning Avenue, Austin, TX',
    primaryColor: '#1B3A30',
    secondaryColor: '#C05C3D',
    userTitle: 'School Administrator',
    managedStudentCount: 2847,
    managedTeacherCount: 124,
  };
}
