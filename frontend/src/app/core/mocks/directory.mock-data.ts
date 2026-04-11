import type { DirectoryEntry } from '../models/directory.dto';

/** Extra directory rows merged with student/teacher search in mock mode (ops + admin). */
export const MOCK_DIRECTORY_STATIC_ENTRIES: DirectoryEntry[] = [
  { kind: 'staff', id: 501, displayName: 'Ravi Transport', subtitle: 'TRANSPORT', phone: '+91-9000000501', deepLink: '/app/operations' },
  { kind: 'user', id: 2, displayName: 'John Anderson', subtitle: 'ADMIN · admin@school.com', email: 'admin@school.com', deepLink: '/app/settings' },
];
