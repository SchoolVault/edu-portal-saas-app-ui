import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatDirectoryResponse, ChatInboxConversation, ChatMessage } from '../../core/models/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-in" data-testid="chat-page">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 style="font-size: 24px; font-weight: 800; margin: 0;">Inbox</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">Real-time conversations (teacher-parent, admin-staff, student support)</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn-outline-erp btn-sm" (click)="refresh()">Refresh</button>
        </div>
      </div>

      <div class="erp-card" style="padding: 0;">
        <div class="row g-0" style="min-height: 620px;">
          <div class="col-lg-4" style="border-right: 1px solid var(--clr-border);">
            <div style="padding: 12px;">
              <div class="d-flex gap-2">
                <input class="erp-input" placeholder="Search conversations..." [(ngModel)]="query" />
                <button class="btn-outline-erp btn-sm" (click)="openDirectory = !openDirectory">
                  {{ openDirectory ? 'Close' : 'New Chat' }}
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
                   class="nav-item"
                   [class.active]="selectedConversation?.conversationId === conv.conversationId"
                   style="border-radius: 0; padding: 12px 14px; border-top: 1px solid var(--clr-border-light); cursor: pointer;">
                <div class="d-flex justify-content-between align-items-start gap-2">
                  <div style="min-width: 0;">
                    <div style="font-weight: 800; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {{ conversationTitle(conv) }}
                    </div>
                    <div class="text-muted" style="font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {{ conv.lastMessagePreview || '—' }}
                    </div>
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div class="text-muted" style="font-size: 11px;">{{ asTime(conv.lastMessageAt) }}</div>
                    <span *ngIf="conv.unreadCount > 0" class="badge-erp badge-danger" style="margin-top: 6px;">{{ conv.unreadCount }}</span>
                  </div>
                </div>
              </div>
              <div *ngIf="!inbox.length" class="empty-state" style="padding: 28px 14px;">
                <i class="bi bi-inbox"></i>
                <h3>No conversations</h3>
                <p>Once teachers/parents/admins message you, your inbox will appear here.</p>
              </div>
            </div>
          </div>

          <div class="col-lg-8 d-flex flex-column">
            <div style="padding: 12px 14px; border-bottom: 1px solid var(--clr-border);">
              <div *ngIf="selectedConversation; else noSelection">
                <div style="font-weight: 900;">{{ conversationTitle(selectedConversation) }}</div>
                <div class="text-muted" style="font-size: 12px;">
                  {{ selectedConversation.type }} · {{ selectedConversation.contextType || 'general' }}
                </div>
              </div>
              <ng-template #noSelection>
                <div style="font-weight: 900;">Select a conversation</div>
                <div class="text-muted" style="font-size: 12px;">Pick from the inbox to load messages.</div>
              </ng-template>
            </div>

            <div style="padding: 14px; flex: 1; overflow: auto; background: var(--clr-surface-alt);">
              <div *ngIf="selectedConversation && loadingMessages" class="empty-state" style="padding: 28px 14px;">
                <h3>Loading…</h3>
              </div>

              <div *ngIf="selectedConversation && !loadingMessages && !messages.length" class="empty-state" style="padding: 28px 14px;">
                <i class="bi bi-chat-left-text"></i>
                <h3>No messages yet</h3>
                <p>Send the first message to start the conversation.</p>
              </div>

              <div *ngFor="let m of messages" style="margin-bottom: 10px;">
                <div [style.display]="'flex'"
                     [style.justifyContent]="isMine(m) ? 'flex-end' : 'flex-start'">
                  <div class="erp-card"
                       [style.maxWidth.%]="78"
                       [style.padding]="'10px 12px'"
                       [style.boxShadow]="'none'"
                       [style.border]="'1px solid var(--clr-border-light)'"
                       [style.background]="isMine(m) ? 'rgba(37,99,235,0.10)' : 'var(--clr-surface)'">
                    <div *ngIf="!isMine(m)" class="text-muted" style="font-size: 11px; font-weight: 700;">
                      {{ m.senderName || m.senderRole }}
                    </div>
                    <div style="white-space: pre-wrap; font-size: 13px;">{{ m.body }}</div>
                    <div class="text-muted" style="font-size: 11px; margin-top: 6px; text-align: right;">
                      {{ asTime(m.createdAt) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style="padding: 12px 14px; border-top: 1px solid var(--clr-border);">
              <div class="d-flex gap-2">
                <input class="erp-input"
                       [disabled]="!selectedConversation || sending"
                       placeholder="Type a message…"
                       [(ngModel)]="draft"
                       (keydown.enter)="onEnter($event)" />
                <button class="btn-primary-erp"
                        [disabled]="!selectedConversation || sending || !draft.trim()"
                        (click)="send()">
                  {{ sending ? 'Sending…' : 'Send' }}
                </button>
              </div>
              <div class="text-muted" style="font-size: 11px; margin-top: 6px;">
                Messages are visible only to participants (role + tenant enforced).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy {
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

  constructor(private chat: ChatService, private auth: AuthService) {}

  ngOnInit(): void {
    this.myUserId = String(this.auth.getCurrentUser()?.id || '');
    this.role = this.auth.getRole() || 'admin';
    this.chat.connectRealtime();
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

