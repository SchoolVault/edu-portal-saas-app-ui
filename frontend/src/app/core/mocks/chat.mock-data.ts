import type { ChatDirectoryResponse, ChatInboxConversation, ChatMessage } from '../models/models';
import { MOCK_PARENT_CHILDREN } from './parent.mock-data';

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

/** Same four linked children as parent portal / settings (`MOCK_PARENT_CHILDREN`). */
export const MOCK_CHAT_DIRECTORY_PARENT: ChatDirectoryResponse = {
  myChildren: MOCK_PARENT_CHILDREN.map(s => ({
    studentId: s.id,
    studentName: `${s.firstName} ${s.lastName}`,
    classId: s.classId,
    className: s.className,
    sectionId: s.sectionId,
    sectionName: s.sectionName,
    classTeacher:
      s.homeroomTeacherUserId != null && s.homeroomTeacherName
        ? { userId: s.homeroomTeacherUserId, name: s.homeroomTeacherName, role: 'TEACHER' }
        : { userId: 2, name: 'Sarah Mitchell', role: 'TEACHER' },
  })),
};

export const MOCK_CHAT_DIRECTORY_ADMIN: ChatDirectoryResponse = {
  teachers: [{ userId: 2, name: 'Sarah Mitchell', role: 'TEACHER' }],
  parents: [{ userId: 3, name: 'Michael Chen', role: 'PARENT' }],
};

const ADMIN_USER_ID = 1;

/**
 * Inbox + messages for mocks. Messages are **chronological ascending** (oldest first) — WhatsApp-style scroll.
 */
export function buildMockChatInboxSeed(
  meUserId: number,
  roleUpper: string
): { conversations: ChatInboxConversation[]; messages: Record<string, ChatMessage[]> } {
  const role = roleUpper.toUpperCase();
  const now = Date.now();

  if (role === 'PARENT') {
    const conv: ChatInboxConversation = {
      conversationId: 'c-parent-homeroom',
      type: 'direct',
      subject: undefined,
      contextType: 'student',
      contextId: '12',
      lastMessageAt: new Date(now - 1000 * 60 * 2).toISOString(),
      lastMessagePreview: 'Fee reminder: please clear dues on time.',
      participants: [
        { userId: meUserId, userRole: 'PARENT', displayName: 'You' },
        { userId: 2, userRole: 'TEACHER', displayName: 'Sarah Mitchell' },
      ],
      unreadCount: 1,
    };
    const messages: ChatMessage[] = [
      {
        id: '1001',
        conversationId: 'c-parent-homeroom',
        senderUserId: 2,
        senderRole: 'TEACHER',
        senderName: 'Sarah Mitchell',
        body: 'Hello — quick note on Emma’s progress this week.',
        bodyType: 'text',
        createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
      },
      {
        id: '1002',
        conversationId: 'c-parent-homeroom',
        senderUserId: meUserId,
        senderRole: 'PARENT',
        senderName: 'Michael Chen',
        body: 'Sure — I’ll share feedback by evening.',
        bodyType: 'text',
        createdAt: new Date(now - 1000 * 60 * 11).toISOString(),
      },
      {
        id: '1003',
        conversationId: 'c-parent-homeroom',
        senderUserId: ADMIN_USER_ID,
        senderRole: 'ADMIN',
        senderName: 'School Office',
        body: 'Hello parent — a fee balance is pending for Emma Chen. Please clear dues on time.',
        bodyType: 'text',
        createdAt: new Date(now - 1000 * 60 * 2).toISOString(),
      },
    ];
    return { conversations: [conv], messages: { 'c-parent-homeroom': messages } };
  }

  if (role === 'TEACHER') {
    const conv: ChatInboxConversation = {
      conversationId: 'c-teacher-parent',
      type: 'direct',
      contextType: 'student',
      contextId: '12',
      lastMessageAt: new Date(now - 1000 * 60 * 4).toISOString(),
      lastMessagePreview: 'Please review today’s homework.',
      participants: [
        { userId: meUserId, userRole: 'TEACHER', displayName: 'You' },
        { userId: 3, userRole: 'PARENT', displayName: 'Michael Chen' },
      ],
      unreadCount: 0,
    };
    const messages: ChatMessage[] = [
      {
        id: '2001',
        conversationId: 'c-teacher-parent',
        senderUserId: 3,
        senderRole: 'PARENT',
        senderName: 'Michael Chen',
        body: 'Please review today’s homework.',
        bodyType: 'text',
        createdAt: new Date(now - 1000 * 60 * 8).toISOString(),
      },
      {
        id: '2002',
        conversationId: 'c-teacher-parent',
        senderUserId: meUserId,
        senderRole: 'TEACHER',
        senderName: 'Sarah Mitchell',
        body: 'Will do — thanks for the heads-up.',
        bodyType: 'text',
        createdAt: new Date(now - 1000 * 60 * 4).toISOString(),
      },
    ];
    return { conversations: [conv], messages: { 'c-teacher-parent': messages } };
  }

  const conv: ChatInboxConversation = {
    conversationId: 'c-admin-parent',
    type: 'direct',
    lastMessageAt: new Date(now - 1000 * 60 * 6).toISOString(),
    lastMessagePreview: 'Thanks — noted for records.',
    participants: [
      { userId: meUserId, userRole: roleUpper, displayName: 'You' },
      { userId: 3, userRole: 'PARENT', displayName: 'Michael Chen' },
    ],
    unreadCount: 0,
  };
  const messages: ChatMessage[] = [
    {
      id: '3001',
      conversationId: 'c-admin-parent',
      senderUserId: 3,
      senderRole: 'PARENT',
      senderName: 'Michael Chen',
      body: 'Could you confirm the transport route change?',
      bodyType: 'text',
      createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
    },
    {
      id: '3002',
      conversationId: 'c-admin-parent',
      senderUserId: meUserId,
      senderRole: 'ADMIN',
      senderName: 'John Anderson',
      body: 'Thanks — noted for records.',
      bodyType: 'text',
      createdAt: new Date(now - 1000 * 60 * 6).toISOString(),
    },
  ];
  return { conversations: [conv], messages: { 'c-admin-parent': messages } };
}
