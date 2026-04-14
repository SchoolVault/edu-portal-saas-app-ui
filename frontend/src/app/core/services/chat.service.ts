import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import {
  buildMockChatInboxSeed,
  MOCK_CHAT_DIRECTORY_ADMIN,
  MOCK_CHAT_DIRECTORY_PARENT,
  MOCK_CHAT_DIRECTORY_TEACHER,
} from '../mocks/chat.mock-data';
import { getMockSchoolAdminPeer } from '../mocks/auth.mock-data';
import { ApiService } from './api.service';
import { getStompBrokerUrl, runtimeConfig } from '../config/runtime-config';
import { AuthService } from './auth.service';
import {
  ChatCounterpartInsight,
  ChatCreateConversationRequest,
  ChatDirectoryResponse,
  ChatInboxConversation,
  ChatMessage,
} from '../models/models';

function mapCounterpartInsight(raw: any): ChatCounterpartInsight | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const students = Array.isArray(raw.linkedStudents)
    ? raw.linkedStudents.map((s: any) => ({
        studentId: Number(s.studentId),
        studentName: String(s.studentName ?? ''),
        classShort: s.classShort != null ? String(s.classShort) : undefined,
      }))
    : undefined;
  let roleCode = String(raw.roleCode ?? '').trim().toUpperCase();
  if (!roleCode && students?.length) {
    roleCode = 'PARENT';
  }
  if (!roleCode) {
    return undefined;
  }
  const out: ChatCounterpartInsight = {
    roleCode,
  };
  if (students?.length) {
    out.linkedStudents = students;
  }
  if (raw.linkedStudentTotal != null) {
    out.linkedStudentTotal = Number(raw.linkedStudentTotal);
  }
  return out;
}

function mapChatInboxFromApi(item: any): ChatInboxConversation {
  return {
    conversationId: String(item.conversationId),
    type: item.type,
    subject: item.subject ?? undefined,
    contextType: item.contextType ?? undefined,
    contextId: item.contextId != null ? String(item.contextId) : undefined,
    lastMessageAt: item.lastMessageAt ?? undefined,
    lastMessagePreview: item.lastMessagePreview ?? undefined,
    participants: (item.participants ?? []).map((p: any) => ({
      userId: Number(p.userId),
      userRole: p.userRole,
      displayName: p.displayName ?? undefined,
      jobTitle: p.jobTitle != null && String(p.jobTitle).trim() ? String(p.jobTitle).trim() : undefined,
    })),
    unreadCount: Number(item.unreadCount ?? 0),
    counterpartInsight: mapCounterpartInsight(item.counterpartInsight),
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private inboxSubject = new BehaviorSubject<ChatInboxConversation[]>([]);
  inbox$ = this.inboxSubject.asObservable();

  private inboundMessageSubject = new Subject<ChatMessage>();
  inboundMessage$ = this.inboundMessageSubject.asObservable();

  /** WebSocket/STOMP connected (false when mocks or offline). */
  private rtConnected = new BehaviorSubject<boolean>(false);
  readonly realtimeConnected$ = this.rtConnected.asObservable();

  private ws: Client | null = null;
  private wsSubscriptions: StompSubscription[] = [];

  // local mock store
  private mockConversations: ChatInboxConversation[] = [];
  private mockMessages: Record<string, ChatMessage[]> = {};

  constructor(private api: ApiService, private auth: AuthService) {
    if (runtimeConfig.useMocks) {
      this.seedMocks();
      this.inboxSubject.next(this.mockConversations);
      this.rtConnected.next(false);
    }
  }

  loadInbox(): Observable<ChatInboxConversation[]> {
    if (runtimeConfig.useMocks) {
      return of(this.mockConversations).pipe(delay(150), tap(items => this.inboxSubject.next(items)));
    }
    return this.api.get<any[]>('/chat/inbox').pipe(
      map(items => (items ?? []).map(item => mapChatInboxFromApi(item))),
      tap(items => this.inboxSubject.next(items))
    );
  }

  loadDirectory(): Observable<ChatDirectoryResponse> {
    if (runtimeConfig.useMocks) {
      const me = this.auth.getCurrentUser();
      const role = (me?.role || 'teacher') as string;
      if (role === 'teacher') {
        return of({
          myClassRosters: MOCK_CHAT_DIRECTORY_TEACHER.myClassRosters?.map(r => ({
            ...r,
            students: r.students.map(s => ({
              ...s,
              parent: s.parent ? { ...s.parent } : undefined,
            })),
          })),
        }).pipe(delay(150));
      }
      if (role === 'parent') {
        return of({
          myChildren: MOCK_CHAT_DIRECTORY_PARENT.myChildren?.map(c => ({
            ...c,
            classTeacher: c.classTeacher ? { ...c.classTeacher } : undefined,
          })),
        }).pipe(delay(150));
      }
      if (role === 'admin') {
        return of({
          teachers: MOCK_CHAT_DIRECTORY_ADMIN.teachers?.map(u => ({ ...u })),
          parents: MOCK_CHAT_DIRECTORY_ADMIN.parents?.map(u => ({ ...u })),
        }).pipe(delay(150));
      }
      return of({}).pipe(delay(150));
    }
    return this.api.get<any>('/chat/directory').pipe(
      map(item => ({
        myClassRosters: (item.myClassRosters ?? []).map((r: any) => ({
          classId: Number(r.classId),
          className: r.className ?? undefined,
          sectionId: r.sectionId != null ? Number(r.sectionId) : undefined,
          sectionName: r.sectionName ?? undefined,
          students: (r.students ?? []).map((s: any) => ({
            studentId: Number(s.studentId),
            studentName: s.studentName,
            parent: s.parent
              ? { userId: Number(s.parent.userId), name: s.parent.name, role: s.parent.role }
              : undefined
          }))
        })),
        myChildren: (item.myChildren ?? []).map((c: any) => ({
          studentId: Number(c.studentId),
          studentName: c.studentName,
          classId: c.classId != null ? Number(c.classId) : undefined,
          className: c.className ?? undefined,
          sectionId: c.sectionId != null ? Number(c.sectionId) : undefined,
          sectionName: c.sectionName ?? undefined,
          classTeacher: c.classTeacher
            ? { userId: Number(c.classTeacher.userId), name: c.classTeacher.name, role: c.classTeacher.role }
            : undefined
        })),
        teachers: (item.teachers ?? []).map((u: any) => ({ userId: Number(u.userId), name: u.name, role: u.role })),
        parents: (item.parents ?? []).map((u: any) => ({
          userId: Number(u.userId),
          name: u.name,
          role: u.role,
          linkedStudents: Array.isArray(u.linkedStudents)
            ? u.linkedStudents.map((s: any) => ({
                studentId: Number(s.studentId),
                studentName: String(s.studentName ?? ''),
                classShort: s.classShort != null ? String(s.classShort) : undefined,
              }))
            : undefined,
          linkedStudentTotal: u.linkedStudentTotal != null ? Number(u.linkedStudentTotal) : undefined,
        }))
      }) as ChatDirectoryResponse)
    );
  }

  createConversation(req: ChatCreateConversationRequest): Observable<ChatInboxConversation> {
    if (runtimeConfig.useMocks) {
      if (req.type === 'direct' && req.participants?.length === 2) {
        const sorted = [...req.participants].map(p => Number(p.userId)).sort((a, b) => a - b);
        const existing = this.mockConversations.find(c => {
          if (c.type !== 'direct') return false;
          const pids = (c.participants || []).map(p => Number(p.userId)).sort((a, b) => a - b);
          return pids.length === 2 && pids[0] === sorted[0] && pids[1] === sorted[1];
        });
        if (existing) {
          return of(existing).pipe(delay(120));
        }
      }
      const conv: ChatInboxConversation = {
        conversationId: 'c-' + Date.now(),
        type: req.type,
        subject: req.subject,
        contextType: req.contextType,
        contextId: req.contextId,
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'Conversation created',
        participants: req.participants,
        unreadCount: 0
      };
      this.mockConversations = [conv, ...this.mockConversations];
      this.mockMessages[conv.conversationId] = [];
      this.inboxSubject.next(this.mockConversations);
      return of(conv).pipe(delay(150));
    }
    return this.api.post<any>('/chat/conversations', {
      type: req.type,
      subject: req.subject,
      contextType: req.contextType,
      contextId: req.contextId != null ? Number(req.contextId) : null,
      participants: req.participants.map(p => ({
        userId: Number(p.userId),
        userRole: p.userRole,
        displayName: p.displayName,
        jobTitle: p.jobTitle != null && String(p.jobTitle).trim() ? String(p.jobTitle).trim() : undefined,
      }))
    }).pipe(map(item => mapChatInboxFromApi(item)));
  }

  loadMessages(conversationId: string, page = 0, size = 50): Observable<ChatMessage[]> {
    if (runtimeConfig.useMocks) {
      const list = this.sortMessagesChronological(this.mockMessages[conversationId] ?? []);
      return of(list).pipe(delay(150));
    }
    return this.api.get<any>(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`).pipe(
      map(resp => {
        const content = resp?.content ?? [];
        // backend is desc by id; UI wants oldest → newest (WhatsApp-style)
        const normalized = content.map((m: any) => this.normalizeMessage(m));
        return this.sortMessagesChronological(normalized as ChatMessage[]);
      })
    );
  }

  private sortMessagesChronological(messages: ChatMessage[]): ChatMessage[] {
    return [...messages].sort((a, b) => {
      const na = Number(a.id);
      const nb = Number(b.id);
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) {
        return na - nb;
      }
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return ta - tb;
    });
  }

  markRead(conversationId: string, lastReadMessageId: number): Observable<void> {
    if (runtimeConfig.useMocks) {
      const updated = this.mockConversations.map(c =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      );
      this.mockConversations = updated;
      this.inboxSubject.next(this.mockConversations);
      return of(undefined).pipe(delay(30));
    }
    return this.api
      .put<void>('/chat/conversations/read', {
        conversationId: Number(conversationId),
        lastReadMessageId
      })
      .pipe(map(() => undefined));
  }

  sendMessage(conversationId: string, body: string): Observable<ChatMessage> {
    const clientMessageId = 'cm-' + Date.now();
    if (runtimeConfig.useMocks) {
      const me = this.auth.getCurrentUser()?.id ?? 1;
      const role = this.auth.getRole() || 'admin';
      const u = this.auth.getCurrentUser();
      const summary = this.auth.getProfileSummarySnapshot();
      const job =
        summary?.userTitle != null && String(summary.userTitle).trim()
          ? String(summary.userTitle).trim()
          : undefined;
      const msg: ChatMessage = {
        id: 'm-' + Date.now(),
        conversationId,
        senderUserId: me,
        senderRole: role.toUpperCase(),
        senderName: u?.name,
        senderJobTitle: job,
        body,
        bodyType: 'text',
        clientMessageId,
        createdAt: new Date().toISOString()
      };
      this.mockMessages[conversationId] = [...(this.mockMessages[conversationId] ?? []), msg];
      this.bumpInboxPreview(conversationId, body);
      this.inboundMessageSubject.next(msg);
      return of(msg).pipe(delay(50));
    }
    return this.api.post<any>('/chat/messages', { conversationId: Number(conversationId), body, clientMessageId }).pipe(
      map(m => this.normalizeMessage(m)),
      tap(m => this.inboundMessageSubject.next(m))
    );
  }

  connectRealtime(): void {
    if (runtimeConfig.useMocks) return;
    if (this.ws?.connected) return;

    const token = this.auth.getToken();
    const wsUrl = getStompBrokerUrl();

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });

    client.onDisconnect = () => this.rtConnected.next(false);
    client.onStompError = () => this.rtConnected.next(false);
    client.onWebSocketError = () => this.rtConnected.next(false);

    client.onConnect = () => {
      this.rtConnected.next(true);
      this.clearWsSubscriptions();
      // inbox updates
      this.wsSubscriptions.push(
        client.subscribe('/user/queue/chat.inbox', (msg: IMessage) => {
          try {
            const item = JSON.parse(msg.body);
            const conv = mapChatInboxFromApi(item);
            const current = this.inboxSubject.getValue();
            const merged = [conv, ...current.filter(c => c.conversationId !== conv.conversationId)];
            this.inboxSubject.next(merged);
          } catch {
            // ignore bad payload
          }
        })
      );
    };

    client.activate();
    this.ws = client;
  }

  subscribeConversation(conversationId: string): void {
    if (runtimeConfig.useMocks) return;
    if (!this.ws?.connected) return;

    this.wsSubscriptions.push(
      this.ws.subscribe(`/topic/chat.conversation.${conversationId}`, (msg: IMessage) => {
        try {
          const item = JSON.parse(msg.body);
          const m = this.normalizeMessage(item);
          this.inboundMessageSubject.next(m);
        } catch {
          // ignore
        }
      })
    );
  }

  disconnectRealtime(): void {
    this.clearWsSubscriptions();
    this.ws?.deactivate();
    this.ws = null;
    this.rtConnected.next(false);
  }

  ngOnDestroy(): void {
    this.disconnectRealtime();
  }

  private normalizeMessage(m: any): ChatMessage {
    return {
      id: String(m.id),
      conversationId: String(m.conversationId),
      senderUserId: Number(m.senderUserId),
      senderRole: m.senderRole,
      senderName: m.senderName ?? undefined,
      senderJobTitle: m.senderJobTitle != null && String(m.senderJobTitle).trim() ? String(m.senderJobTitle).trim() : undefined,
      body: m.body,
      bodyType: m.bodyType,
      clientMessageId: m.clientMessageId ?? undefined,
      createdAt: m.createdAt ?? undefined
    };
  }

  private bumpInboxPreview(conversationId: string, body: string): void {
    const updated = this.mockConversations.map(c =>
      c.conversationId === conversationId
        ? { ...c, lastMessageAt: new Date().toISOString(), lastMessagePreview: body, unreadCount: 0 }
        : c
    );
    this.mockConversations = updated.sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));
    this.inboxSubject.next(this.mockConversations);
  }

  private seedMocks(): void {
      const me = this.auth.getCurrentUser()?.id ?? 2;
      const role = (this.auth.getRole() || 'teacher').toUpperCase();
      const peer = getMockSchoolAdminPeer();
      const seed = buildMockChatInboxSeed(me, role, {
        schoolAdminPeer: { userId: peer.userId, displayName: peer.displayName, jobTitle: undefined },
      });
    this.mockConversations = seed.conversations.map(c => ({
      ...c,
      participants: c.participants.map(p => ({ ...p })),
    }));
    this.mockMessages = Object.fromEntries(
      Object.entries(seed.messages).map(([k, msgs]) => [k, msgs.map(m => ({ ...m }))])
    );
  }

  private clearWsSubscriptions(): void {
    this.wsSubscriptions.forEach(s => s.unsubscribe());
    this.wsSubscriptions = [];
  }
}

