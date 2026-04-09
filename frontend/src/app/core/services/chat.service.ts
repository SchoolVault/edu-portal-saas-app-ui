import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';
import { AuthService } from './auth.service';
import { ChatCreateConversationRequest, ChatDirectoryResponse, ChatInboxConversation, ChatMessage } from '../models/models';

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
      map(items =>
        (items ?? []).map(item => ({
          conversationId: String(item.conversationId),
          type: item.type,
          subject: item.subject ?? undefined,
          contextType: item.contextType ?? undefined,
          contextId: item.contextId != null ? String(item.contextId) : undefined,
          lastMessageAt: item.lastMessageAt ?? undefined,
          lastMessagePreview: item.lastMessagePreview ?? undefined,
          participants: (item.participants ?? []).map((p: any) => ({
            userId: String(p.userId),
            userRole: p.userRole,
            displayName: p.displayName ?? undefined
          })),
          unreadCount: Number(item.unreadCount ?? 0)
        })) as ChatInboxConversation[]
      ),
      tap(items => this.inboxSubject.next(items))
    );
  }

  loadDirectory(): Observable<ChatDirectoryResponse> {
    if (runtimeConfig.useMocks) {
      const me = this.auth.getCurrentUser();
      const role = (me?.role || 'teacher') as string;
      if (role === 'teacher') {
        return of({
          myClassRosters: [
            {
              classId: 'c8',
              className: 'Class 8',
              students: [
                { studentId: 's12', studentName: 'Emma Chen', parent: { userId: 'u3', name: 'Michael Chen', role: 'PARENT' } }
              ]
            }
          ]
        }).pipe(delay(150));
      }
      if (role === 'parent') {
        return of({
          myChildren: [
            {
              studentId: 's12',
              studentName: 'Emma Chen',
              classId: 'c8',
              className: 'Class 8',
              classTeacher: { userId: 'u2', name: 'Sarah Mitchell', role: 'TEACHER' }
            }
          ]
        }).pipe(delay(150));
      }
      if (role === 'admin') {
        return of({
          teachers: [{ userId: 'u2', name: 'Sarah Mitchell', role: 'TEACHER' }],
          parents: [{ userId: 'u3', name: 'Michael Chen', role: 'PARENT' }]
        }).pipe(delay(150));
      }
      return of({}).pipe(delay(150));
    }
    return this.api.get<any>('/chat/directory').pipe(
      map(item => ({
        myClassRosters: (item.myClassRosters ?? []).map((r: any) => ({
          classId: String(r.classId),
          className: r.className ?? undefined,
          sectionId: r.sectionId != null ? String(r.sectionId) : undefined,
          sectionName: r.sectionName ?? undefined,
          students: (r.students ?? []).map((s: any) => ({
            studentId: String(s.studentId),
            studentName: s.studentName,
            parent: s.parent
              ? { userId: String(s.parent.userId), name: s.parent.name, role: s.parent.role }
              : undefined
          }))
        })),
        myChildren: (item.myChildren ?? []).map((c: any) => ({
          studentId: String(c.studentId),
          studentName: c.studentName,
          classId: c.classId != null ? String(c.classId) : undefined,
          className: c.className ?? undefined,
          sectionId: c.sectionId != null ? String(c.sectionId) : undefined,
          sectionName: c.sectionName ?? undefined,
          classTeacher: c.classTeacher
            ? { userId: String(c.classTeacher.userId), name: c.classTeacher.name, role: c.classTeacher.role }
            : undefined
        })),
        teachers: (item.teachers ?? []).map((u: any) => ({ userId: String(u.userId), name: u.name, role: u.role })),
        parents: (item.parents ?? []).map((u: any) => ({ userId: String(u.userId), name: u.name, role: u.role }))
      }) as ChatDirectoryResponse)
    );
  }

  createConversation(req: ChatCreateConversationRequest): Observable<ChatInboxConversation> {
    if (runtimeConfig.useMocks) {
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
      participants: req.participants.map(p => ({ userId: Number(p.userId), userRole: p.userRole, displayName: p.displayName }))
    }).pipe(
      map(item => ({
        conversationId: String(item.conversationId),
        type: item.type,
        subject: item.subject ?? undefined,
        contextType: item.contextType ?? undefined,
        contextId: item.contextId != null ? String(item.contextId) : undefined,
        lastMessageAt: item.lastMessageAt ?? undefined,
        lastMessagePreview: item.lastMessagePreview ?? undefined,
        participants: (item.participants ?? []).map((p: any) => ({ userId: String(p.userId), userRole: p.userRole, displayName: p.displayName ?? undefined })),
        unreadCount: Number(item.unreadCount ?? 0)
      }) as ChatInboxConversation
      )
    );
  }

  loadMessages(conversationId: string, page = 0, size = 50): Observable<ChatMessage[]> {
    if (runtimeConfig.useMocks) {
      const list = (this.mockMessages[conversationId] ?? []).slice().reverse();
      return of(list).pipe(delay(150));
    }
    return this.api.get<any>(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`).pipe(
      map(resp => {
        const content = resp?.content ?? [];
        // backend is desc by id; UI wants asc
        const normalized = content
          .map((m: any) => this.normalizeMessage(m))
          .reverse();
        return normalized as ChatMessage[];
      })
    );
  }

  sendMessage(conversationId: string, body: string): Observable<ChatMessage> {
    const clientMessageId = 'cm-' + Date.now();
    if (runtimeConfig.useMocks) {
      const me = this.auth.getCurrentUser()?.id || 'me';
      const role = this.auth.getRole() || 'admin';
      const msg: ChatMessage = {
        id: 'm-' + Date.now(),
        conversationId,
        senderUserId: String(me),
        senderRole: role.toUpperCase(),
        senderName: undefined,
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
    const wsUrl = (runtimeConfig.apiUrl || 'http://localhost:8080').replace(/^http/, 'ws') + '/ws';

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
            const conv: ChatInboxConversation = {
              conversationId: String(item.conversationId),
              type: item.type,
              subject: item.subject ?? undefined,
              contextType: item.contextType ?? undefined,
              contextId: item.contextId != null ? String(item.contextId) : undefined,
              lastMessageAt: item.lastMessageAt ?? undefined,
              lastMessagePreview: item.lastMessagePreview ?? undefined,
              participants: (item.participants ?? []).map((p: any) => ({ userId: String(p.userId), userRole: p.userRole, displayName: p.displayName ?? undefined })),
              unreadCount: Number(item.unreadCount ?? 0)
            };
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
      senderUserId: String(m.senderUserId),
      senderRole: m.senderRole,
      senderName: m.senderName ?? undefined,
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
    const me = this.auth.getCurrentUser()?.id || 'u2';
    const role = (this.auth.getRole() || 'teacher').toUpperCase();
    const other: ChatInboxConversation = {
      conversationId: 'c-101',
      type: 'direct',
      subject: undefined,
      contextType: 'student',
      contextId: 's12',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      lastMessagePreview: 'Please review today’s homework.',
      participants: [
        { userId: String(me), userRole: role, displayName: 'You' },
        { userId: 'u3', userRole: 'PARENT', displayName: 'Parent - Michael Chen' }
      ],
      unreadCount: 0
    };
    this.mockConversations = [other];
    this.mockMessages['c-101'] = [
      {
        id: 'm-1',
        conversationId: 'c-101',
        senderUserId: 'u3',
        senderRole: 'PARENT',
        senderName: 'Michael Chen',
        body: 'Please review today’s homework.',
        bodyType: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
      },
      {
        id: 'm-2',
        conversationId: 'c-101',
        senderUserId: String(me),
        senderRole: role,
        senderName: 'You',
        body: 'Sure — I’ll share feedback by evening.',
        bodyType: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
      }
    ];
  }

  private clearWsSubscriptions(): void {
    this.wsSubscriptions.forEach(s => s.unsubscribe());
    this.wsSubscriptions = [];
  }
}

