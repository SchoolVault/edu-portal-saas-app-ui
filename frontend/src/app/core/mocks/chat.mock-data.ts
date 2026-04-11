import type { ChatDirectoryResponse, ChatInboxConversation, ChatMessage } from '../models/models';

export const MOCK_CHAT_DIRECTORY_TEACHER: ChatDirectoryResponse = {
  myClassRosters: [
    {
      classId: 8,
      className: 'Class 8',
      sectionId: 801,
      sectionName: 'A',
      students: [{ studentId: 12, studentName: 'Emma Chen', parent: { userId: 3, name: 'Michael Chen', role: 'PARENT' } }],
    },
  ],
};

export const MOCK_CHAT_DIRECTORY_PARENT: ChatDirectoryResponse = {
  myChildren: [
    {
      studentId: 12,
      studentName: 'Emma Chen',
      classId: 8,
      className: 'Class 8',
      sectionId: 801,
      sectionName: 'A',
      classTeacher: { userId: 2, name: 'Sarah Mitchell', role: 'TEACHER' },
    },
  ],
};

export const MOCK_CHAT_DIRECTORY_ADMIN: ChatDirectoryResponse = {
  teachers: [{ userId: 2, name: 'Sarah Mitchell', role: 'TEACHER' }],
  parents: [{ userId: 3, name: 'Michael Chen', role: 'PARENT' }],
};

export function buildMockChatInboxSeed(
  meUserId: number,
  roleUpper: string
): { conversations: ChatInboxConversation[]; messages: Record<string, ChatMessage[]> } {
  const other: ChatInboxConversation = {
    conversationId: 'c-101',
    type: 'direct',
    subject: undefined,
    contextType: 'student',
    contextId: '12',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    lastMessagePreview: 'Please review today’s homework.',
    participants: [
      { userId: meUserId, userRole: roleUpper, displayName: 'You' },
      { userId: 3, userRole: 'PARENT', displayName: 'Parent - Michael Chen' },
    ],
    unreadCount: 0,
  };
  return {
    conversations: [other],
    messages: {
      'c-101': [
        {
          id: 'm-1',
          conversationId: 'c-101',
          senderUserId: 3,
          senderRole: 'PARENT',
          senderName: 'Michael Chen',
          body: 'Please review today’s homework.',
          bodyType: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        },
        {
          id: 'm-2',
          conversationId: 'c-101',
          senderUserId: meUserId,
          senderRole: roleUpper,
          senderName: 'You',
          body: 'Sure — I’ll share feedback by evening.',
          bodyType: 'text',
          createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        },
      ],
    },
  };
}
