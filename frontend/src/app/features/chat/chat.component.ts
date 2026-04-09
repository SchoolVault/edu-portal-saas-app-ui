import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatDirectoryResponse, ChatInboxConversation, ChatMessage } from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      .chat-shell {
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid var(--clr-border);
        box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
      }
      .chat-sidebar {
        background: linear-gradient(180deg, var(--clr-surface) 0%, var(--clr-surface-alt) 100%);
        border-right: 1px solid var(--clr-border);
      }
      .chat-thread-header {
        background: var(--clr-surface);
        border-bottom: 1px solid var(--clr-border);
      }
      .chat-messages {
        background: linear-gradient(180deg, var(--clr-surface-alt) 0%, rgba(37, 99, 235, 0.03) 100%);
      }
      .chat-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid var(--clr-border-light);
      }
      .chat-status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .chat-status--live .chat-status-dot {
        background: #16a34a;
        box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.25);
      }
      .chat-status--demo .chat-status-dot {
        background: #ca8a04;
      }
      .chat-status--off .chat-status-dot {
        background: #94a3b8;
      }
      .chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        color: #fff;
        flex-shrink: 0;
      }
      .chat-row {
        padding: 12px 14px;
        border-top: 1px solid var(--clr-border-light);
        cursor: pointer;
        transition: background 0.12s ease;
      }
      .chat-row:hover {
        background: rgba(37, 99, 235, 0.06);
      }
      .chat-row.active {
        background: rgba(37, 99, 235, 0.12);
        border-left: 3px solid var(--clr-primary, #2563eb);
        padding-left: 11px;
      }
      .bubble {
        max-width: 78%;
        padding: 10px 14px;
        border-radius: 14px 14px 14px 6px;
        border: 1px solid var(--clr-border-light);
        background: var(--clr-surface);
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
      }
      .bubble--mine {
        border-radius: 14px 14px 6px 14px;
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(37, 99, 235, 0.08));
        border-color: rgba(37, 99, 235, 0.25);
      }
      .chat-compose {
        background: var(--clr-surface);
        border-top: 1px solid var(--clr-border);
      }
    `
  ],
  template: `
    <div class="animate-in" data-testid="chat-page">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 style="font-size: 24px; font-weight: 800; margin: 0;">Inbox</h2>
          <p class="text-muted mb-0" style="font-size: 13px; max-width: 520px;">
            Secure messaging for teacher–parent updates, admin coordination, and support threads. Live delivery when the server is connected; same REST shape with mocks for local demos.
          </p>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <span
            class="chat-status"
            [class.chat-status--live]="!useMocks && realtimeConnected"
            [class.chat-status--demo]="useMocks"
            [class.chat-status--off]="!useMocks && !realtimeConnected"
            title="WebSocket inbox + conversation topics push new messages without refresh."
          >
            <span class="chat-status-dot"></span>
            <ng-container *ngIf="useMocks">Demo · local only</ng-container>
            <ng-container *ngIf="!useMocks && realtimeConnected">Live · real-time</ng-container>
            <ng-container *ngIf="!useMocks && !realtimeConnected">Connecting…</ng-container>
          </span>
          <button class="btn-outline-erp btn-sm" type="button" (click)="refresh()">Refresh</button>
        </div>
      </div>

      <div class="erp-card chat-shell" style="padding: 0;">
        <div class="row g-0" style="min-height: 620px;">
          <div class="col-lg-4 chat-sidebar">
            <div style="padding: 12px;">
              <div class="d-flex gap-2">
                <input class="erp-input flex-grow-1" placeholder="Search conversations…" [(ngModel)]="query" />
                <button class="btn-outline-erp btn-sm flex-shrink-0" type="button" (click)="openDirectory = !openDirectory">
                  {{ openDirectory ? 'Close' : 'New' }}
                </button>
              </div>
            </div>

            <div *ngIf="openDirectory" style="padding: 12px; border-top: 1px solid var(--clr-border-light); background: var(--clr-surface-alt);">
              <div style="font-weight: 900; margin-bottom: 8px;">Start a conversation</div>
              <div class="text-muted" style="font-size: 12px; margin-bottom: 10px;">
                You can only message people related to you (students/classes) based on ERP rules.
              </div>

              <div *ngIf="loadingDirectory" class="text-muted" style="font-size: 12px;">Loading directory…</div>

              <!-- Teacher: choose a student -> chat with parent -->
              <div *ngIf="role === 'teacher' && directory?.myClassRosters?.length">
                <label class="erp-label">Student</label>
                <select class="erp-select" [(ngModel)]="selectedStudentForChat">
                  <option value="">Select student</option>
                  <ng-container *ngFor="let roster of (directory?.myClassRosters || [])">
                    <optgroup [label]="roster.className || ('Class ' + roster.classId)">
                      <option *ngFor="let s of roster.students" [value]="s.studentId">
                        {{ s.studentName }}
                      </option>
                    </optgroup>
                  </ng-container>
                </select>
                <button class="btn-primary-erp btn-sm mt-2" [disabled]="!selectedStudentForChat" (click)="startTeacherParentChat()">
                  Message Parent
                </button>
              </div>

              <!-- Parent: choose child -> message class teacher -->
              <div *ngIf="role === 'parent' && directory?.myChildren?.length">
                <label class="erp-label">Child</label>
                <select class="erp-select" [(ngModel)]="selectedChildForChat">
                  <option value="">Select child</option>
                  <option *ngFor="let c of (directory?.myChildren || [])" [value]="c.studentId">
                    {{ c.studentName }} · {{ c.className || ('Class ' + c.classId) }}
                  </option>
                </select>
                <button class="btn-primary-erp btn-sm mt-2" [disabled]="!selectedChildForChat" (click)="startParentTeacherChat()">
                  Message Class Teacher
                </button>
              </div>

              <!-- Admin: direct pick (MVP) -->
              <div *ngIf="role === 'admin'">
                <label class="erp-label">Teachers</label>
                <select class="erp-select" [(ngModel)]="selectedAdminTeacher">
                  <option value="">Select teacher</option>
                  <option *ngFor="let t of (directory?.teachers || [])" [value]="t.userId">{{ t.name }}</option>
                </select>
                <label class="erp-label mt-2">Parents</label>
                <select class="erp-select" [(ngModel)]="selectedAdminParent">
                  <option value="">Select parent</option>
                  <option *ngFor="let p of (directory?.parents || [])" [value]="p.userId">{{ p.name }}</option>
                </select>
                <button class="btn-primary-erp btn-sm mt-2" [disabled]="!selectedAdminTeacher && !selectedAdminParent" (click)="startAdminDirectChat()">
                  Start Chat
                </button>
              </div>

              <div *ngIf="!loadingDirectory && openDirectory && !hasDirectoryData()" class="text-muted" style="font-size: 12px;">
                No directory data available for your role yet.
              </div>
            </div>

            <div style="max-height: 560px; overflow: auto;">
              <div *ngFor="let conv of filteredInbox()"
                   (click)="selectConversation(conv)"
                   class="chat-row"
                   [class.active]="selectedConversation?.conversationId === conv.conversationId">
                <div class="d-flex align-items-start gap-3">
                  <div class="chat-avatar" [style.background]="avatarColor(conversationTitle(conv))">
                    {{ initials(conversationTitle(conv)) }}
                  </div>
                  <div class="d-flex justify-content-between align-items-start gap-2 flex-grow-1 min-w-0">
                    <div style="min-width: 0;">
                      <div style="font-weight: 800; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        {{ conversationTitle(conv) }}
                      </div>
                      <div class="text-muted" style="font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        {{ conv.lastMessagePreview || 'No messages yet' }}
                      </div>
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                      <div class="text-muted" style="font-size: 11px;">{{ asTime(conv.lastMessageAt) }}</div>
                      <span *ngIf="conv.unreadCount > 0" class="badge-erp badge-danger" style="margin-top: 6px;">{{ conv.unreadCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="!inbox.length" class="empty-state" style="padding: 28px 14px;">
                <i class="bi bi-inbox"></i>
                <h3>No conversations</h3>
                <p>Start a thread from <strong>New</strong> or wait for an inbound message. With a live backend, updates also arrive over WebSocket.</p>
              </div>
            </div>
          </div>

          <div class="col-lg-8 d-flex flex-column">
            <div class="chat-thread-header" style="padding: 12px 14px;">
              <div *ngIf="selectedConversation; else noSelection" class="d-flex align-items-start justify-content-between gap-3">
                <div class="d-flex align-items-start gap-3 min-w-0">
                  <div class="chat-avatar d-none d-sm-flex" [style.background]="avatarColor(conversationTitle(selectedConversation))">
                    {{ initials(conversationTitle(selectedConversation)) }}
                  </div>
                  <div class="min-w-0">
                    <div style="font-weight: 900; font-size: 15px;">{{ conversationTitle(selectedConversation) }}</div>
                    <div class="text-muted" style="font-size: 12px;">
                      {{ threadSubtitle(selectedConversation) }}
                    </div>
                  </div>
                </div>
                <span
                  class="chat-status d-none d-md-inline-flex"
                  [class.chat-status--live]="!useMocks && realtimeConnected"
                  [class.chat-status--demo]="useMocks"
                  [class.chat-status--off]="!useMocks && !realtimeConnected"
                >
                  <span class="chat-status-dot"></span>
                  <ng-container *ngIf="useMocks">Mock stream</ng-container>
                  <ng-container *ngIf="!useMocks && realtimeConnected">Subscribed</ng-container>
                  <ng-container *ngIf="!useMocks && !realtimeConnected">WS idle</ng-container>
                </span>
              </div>
              <ng-template #noSelection>
                <div style="font-weight: 900;">Select a conversation</div>
                <div class="text-muted" style="font-size: 12px;">Choose a thread to load history and send messages. New replies push in real time when connected.</div>
              </ng-template>
            </div>

            <div class="chat-messages" style="padding: 14px; flex: 1; overflow: auto;">
              <div *ngIf="selectedConversation && loadingMessages" class="empty-state" style="padding: 28px 14px;">
                <h3>Loading…</h3>
              </div>

              <div *ngIf="selectedConversation && !loadingMessages && !messages.length" class="empty-state" style="padding: 28px 14px;">
                <i class="bi bi-chat-left-text"></i>
                <h3>No messages yet</h3>
                <p>Open the conversation with a short note. Participants see the same thread; tenant and role checks apply on the server.</p>
              </div>

              <div *ngFor="let m of messages" style="margin-bottom: 12px;">
                <div class="d-flex" [style.justifyContent]="isMine(m) ? 'flex-end' : 'flex-start'">
                  <div class="bubble" [class.bubble--mine]="isMine(m)">
                    <div *ngIf="!isMine(m)" class="text-muted" style="font-size: 11px; font-weight: 700; margin-bottom: 4px;">
                      {{ m.senderName || m.senderRole }}
                    </div>
                    <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.45;">{{ m.body }}</div>
                    <div class="text-muted" style="font-size: 11px; margin-top: 8px; text-align: right;">
                      {{ asTime(m.createdAt) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="chat-compose" style="padding: 12px 14px;">
              <div class="d-flex gap-2 align-items-stretch">
                <input class="erp-input flex-grow-1"
                       [disabled]="!selectedConversation || sending"
                       placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
                       [(ngModel)]="draft"
                       (keydown.enter)="onEnter($event)" />
                <button class="btn-primary-erp flex-shrink-0"
                        type="button"
                        [disabled]="!selectedConversation || sending || !draft.trim()"
                        (click)="send()">
                  {{ sending ? 'Sending…' : 'Send' }}
                </button>
              </div>
              <div class="text-muted" style="font-size: 11px; margin-top: 8px;">
                End-to-end policy: only conversation participants can read or post; switching accounts or tenants never leaks threads across schools.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy {
  readonly useMocks = runtimeConfig.useMocks;
  realtimeConnected = false;
  role = 'admin';
  inbox: ChatInboxConversation[] = [];
  selectedConversation: ChatInboxConversation | null = null;
  messages: ChatMessage[] = [];
  loadingMessages = false;
  openDirectory = false;
  loadingDirectory = false;
  directory: ChatDirectoryResponse | null = null;
  selectedStudentForChat = '';
  selectedChildForChat = '';
  selectedAdminTeacher = '';
  selectedAdminParent = '';
  sending = false;
  draft = '';
  query = '';

  private myUserId = '';
  private rtSub?: Subscription;

  constructor(private chat: ChatService, private auth: AuthService) {}

  ngOnInit(): void {
    this.myUserId = String(this.auth.getCurrentUser()?.id || '');
    this.role = this.auth.getRole() || 'admin';
    this.chat.connectRealtime();
    this.rtSub = this.chat.realtimeConnected$.subscribe(v => (this.realtimeConnected = v));
    this.chat.inbox$.subscribe(items => (this.inbox = items));
    this.chat.inboundMessage$.subscribe(m => {
      if (this.selectedConversation?.conversationId === m.conversationId) {
        // avoid duplicates on optimistic UI
        if (!this.messages.some(x => x.id === m.id)) {
          this.messages = [...this.messages, m];
        }
      }
    });
    this.refresh();
  }

  ngOnDestroy(): void {
    this.rtSub?.unsubscribe();
    this.chat.disconnectRealtime();
  }

  refresh(): void {
    this.chat.loadInbox().subscribe();
    this.loadDirectory();
  }

  loadDirectory(): void {
    this.loadingDirectory = true;
    this.chat.loadDirectory().subscribe({
      next: dir => {
        this.directory = dir;
        this.loadingDirectory = false;
      },
      error: () => {
        this.loadingDirectory = false;
      }
    });
  }

  hasDirectoryData(): boolean {
    const d = this.directory;
    if (!d) return false;
    return !!(d.myClassRosters?.length || d.myChildren?.length || d.teachers?.length || d.parents?.length);
  }

  startTeacherParentChat(): void {
    if (!this.directory?.myClassRosters?.length) return;
    const all = this.directory.myClassRosters.flatMap(r => r.students || []);
    const student = all.find(s => s.studentId === this.selectedStudentForChat);
    if (!student?.parent) return;
    this.startDirectChat(student.parent.userId, 'PARENT', `Parent of ${student.studentName}`);
  }

  startParentTeacherChat(): void {
    const child = this.directory?.myChildren?.find(c => c.studentId === this.selectedChildForChat);
    if (!child?.classTeacher) return;
    this.startDirectChat(child.classTeacher.userId, 'TEACHER', child.classTeacher.name);
  }

  startAdminDirectChat(): void {
    // MVP: if teacher selected, start direct with teacher; otherwise with parent.
    if (this.selectedAdminTeacher) {
      const t = this.directory?.teachers?.find(x => x.userId === this.selectedAdminTeacher);
      if (t) this.startDirectChat(t.userId, t.role, t.name);
      return;
    }
    if (this.selectedAdminParent) {
      const p = this.directory?.parents?.find(x => x.userId === this.selectedAdminParent);
      if (p) this.startDirectChat(p.userId, p.role, p.name);
    }
  }

  private startDirectChat(otherUserId: string, otherRole: string, otherName?: string): void {
    const me = this.auth.getCurrentUser();
    if (!me) return;
    this.chat.createConversation({
      type: 'direct',
      participants: [
        { userId: String(me.id), userRole: (me.role || 'admin').toUpperCase(), displayName: me.name },
        { userId: String(otherUserId), userRole: (otherRole || '').toUpperCase(), displayName: otherName }
      ]
    }).subscribe(conv => {
      this.openDirectory = false;
      this.selectedConversation = null;
      this.selectConversation(conv);
    });
  }

  filteredInbox(): ChatInboxConversation[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.inbox;
    return this.inbox.filter(c => this.conversationTitle(c).toLowerCase().includes(q) || (c.lastMessagePreview || '').toLowerCase().includes(q));
  }

  selectConversation(conv: ChatInboxConversation): void {
    this.selectedConversation = conv;
    this.messages = [];
    this.loadingMessages = true;
    this.chat.subscribeConversation(conv.conversationId);
    this.chat.loadMessages(conv.conversationId).subscribe(list => {
      this.messages = list;
      this.loadingMessages = false;
    });
  }

  send(): void {
    if (!this.selectedConversation) return;
    const text = this.draft.trim();
    if (!text) return;
    this.sending = true;
    this.chat.sendMessage(this.selectedConversation.conversationId, text).subscribe({
      next: msg => {
        if (!this.messages.some(x => x.id === msg.id)) {
          this.messages = [...this.messages, msg];
        }
        this.draft = '';
        this.sending = false;
      },
      error: () => {
        this.sending = false;
      }
    });
  }

  onEnter(evt: Event): void {
    const e = evt as KeyboardEvent;
    if (e.shiftKey) return;
    e.preventDefault();
    this.send();
  }

  isMine(m: ChatMessage): boolean {
    return !!this.myUserId && m.senderUserId === this.myUserId;
  }

  threadSubtitle(conv: ChatInboxConversation): string {
    const ctx = conv.contextType && conv.contextId ? `${conv.contextType} #${conv.contextId}` : 'General';
    const type = (conv.type || 'direct').replace(/_/g, ' ');
    return `${type} · ${ctx}`;
  }

  initials(title: string): string {
    const parts = (title || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  avatarColor(seed: string): string {
    const palette = ['#2563eb', '#7c3aed', '#0d9488', '#c026d3', '#ca8a04', '#dc2626', '#475569'];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }

  conversationTitle(conv: ChatInboxConversation): string {
    const role = (this.auth.getRole() || '').toLowerCase();
    const me = this.myUserId;
    const others = conv.participants.filter(p => p.userId !== me);
    if (conv.type === 'direct') {
      const other = others[0] || conv.participants[0];
      return other?.displayName || `${other?.userRole || 'User'} ${other?.userId || ''}`.trim();
    }
    if (conv.subject) return conv.subject;
    if (conv.contextType && conv.contextId) return `${conv.contextType} #${conv.contextId}`;
    return role ? role.toUpperCase() + ' Group' : 'Group';
  }

  asTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}

