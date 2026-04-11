import type { DocumentRecord } from '../models/models';

export const MOCK_DOCUMENTS_LIST: DocumentRecord[] = [
  {
    id: 'd1',
    name: 'School Calendar',
    type: 'PDF',
    category: 'general',
    uploadedBy: '1',
    uploadDate: '2025-06-01',
    size: '2 MB',
    fileUrl: 'https://example.com/cal.pdf',
    tenantId: 't1',
  },
];
