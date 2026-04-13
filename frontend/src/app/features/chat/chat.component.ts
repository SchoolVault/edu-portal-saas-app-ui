import { ChangeDetectorRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { DirectoryEntry, DirectoryService } from '../../core/services/directory.service';
import { PlatformService } from '../../core/services/platform.service';
import {
  ChatDirectoryClassRoster,
  ChatDirectoryParentChildRoster,
  ChatDirectoryResponse,
  ChatInboxConversation,
  ChatMessage,
  PlatformSchoolAdminChatHit,
} from '../../core/models/models';
import { runtimeConfig } from '../../core/config/runtime-config';
import { formatSchoolClassDisplayName, formatSchoolClassName } from '../../core/i18n/school-class-display';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  styles: [
    `
      .chat-shell {
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid var(--clr-border);
        box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
      }
      /* Fixed viewport band + flex column so the message list scrolls and the composer stays pinned (WhatsApp-style). */
      .chat-layout-row {
        min-height: 480px;
        height: min(680px, calc(100vh - 168px));
      }
      @media (max-width: 991.98px) {
        .chat-layout-row {
          height: auto;
          min-height: 360px;
          max-height: none;
        }
      }
      .chat-sidebar {
        display: flex;
        flex-direction: column;
        min-height: 0;
        max-height: 100%;
        overflow: hidden;
      }
      .chat-sidebar > div:not(.chat-sidebar-scroll) {
        flex-shrink: 0;
      }
      .chat-sidebar-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .chat-thread-column {
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        max-height: 100%;
        overflow: hidden;
      }
      .chat-sidebar {
        background: linear-gradient(180deg, var(--clr-surface) 0%, var(--clr-surface-alt) 100%);
        border-right: 1px solid var(--clr-border);
      }
      .chat-thread-header {
        flex-shrink: 0;
        background: var(--clr-surface);
        border-bottom: 1px solid var(--clr-border);
      }
      .chat-messages {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: linear-gradient(180deg, var(--clr-surface-alt) 0%, color-mix(in srgb, var(--clr-primary) 6%, transparent) 100%);
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
        background: color-mix(in srgb, var(--clr-primary) 8%, transparent);
      }
      .chat-row.active {
        background: color-mix(in srgb, var(--clr-accent) 14%, transparent);
        border-left: 3px solid var(--clr-accent);
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
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--clr-accent) 22%, transparent),
          color-mix(in srgb, var(--clr-primary) 12%, transparent)
        );
        border-color: color-mix(in srgb, var(--clr-accent) 35%, var(--clr-border-light));
      }
      .chat-compose {
        flex-shrink: 0;
        background: var(--clr-surface);
        border-top: 1px solid var(--clr-border);
      }
    `
  ],
  template: `
    <div class="animate-in" data-testid="chat-page">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h2 style="font-size: 24px; font-weight: 800; margin: 0;">{{ 'chat.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px; max-width: 560px;">
            <ng-container *ngIf="role !== 'super_admin'">{{ 'chat.leadStaff' | translate }}</ng-container>
            <ng-container *ngIf="role === 'super_admin'">{{ 'chat.leadSuperAdmin' | translate }}</ng-container>
          </p>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <span
            class="chat-status"
            [class.chat-status--live]="!useMocks && realtimeConnected"
            [class.chat-status--demo]="useMocks"
            [class.chat-status--off]="!useMocks && !realtimeConnected"
            [attr.title]="'chat.statusWsTitle' | translate"
          >
            <span class="chat-status-dot"></span>
            <ng-container *ngIf="useMocks">{{ 'chat.statusDemo' | translate }}</ng-container>
            <ng-container *ngIf="!useMocks && realtimeConnected">{{ 'chat.statusLive' | translate }}</ng-container>
            <ng-container *ngIf="!useMocks && !realtimeConnected">{{ 'chat.statusConnecting' | translate }}</ng-container>
          </span>
          <button class="btn-outline-erp btn-sm" type="button" (click)="refresh()">{{ 'chat.refresh' | translate }}</button>
        </div>
      </div>

      <div class="erp-card chat-shell" style="padding: 0;">
        <div class="row g-0 flex-lg-nowrap chat-layout-row">
          <div class="col-lg-4 chat-sidebar">
            <div style="padding: 12px;">
              <div class="d-flex gap-2">
                <input class="erp-input flex-grow-1" [placeholder]="'chat.searchPlaceholder' | translate" [(ngModel)]="query" />
                <button class="btn-outline-erp btn-sm flex-shrink-0" type="button" (click)="openDirectory = !openDirectory">
                  {{ openDirectory ? ('chat.close' | translate) : ('chat.newChat' | translate) }}
                </button>
              </div>
            </div>

            <div *ngIf="openDirectory" style="padding: 12px; border-top: 1px solid var(--clr-border-light); background: var(--clr-surface-alt);">
              <div style="font-weight: 900; margin-bottom: 8px;">{{ 'chat.startConversationTitle' | translate }}</div>
              <div class="text-muted" style="font-size: 12px; margin-bottom: 10px;">
                <ng-container *ngIf="role === 'super_admin'">{{ 'chat.dirHelpSuperAdmin' | translate }}</ng-container>
                <ng-container *ngIf="role !== 'parent' && role !== 'super_admin'">{{ 'chat.dirHelpStaff' | translate }}</ng-container>
                <ng-container *ngIf="role === 'parent'">{{ 'chat.dirHelpParent' | translate }}</ng-container>
              </div>

              <div class="mb-3" *ngIf="role === 'super_admin'">
                <label class="erp-label">{{ 'chat.labelSchoolAdmins' | translate }}</label>
                <input
                  class="erp-input"
                  [placeholder]="'chat.plaSearchPh' | translate"
                  [(ngModel)]="platformAdminQuery"
                  (ngModelChange)="onPlatformAdminQueryChange()"
                />
                <div *ngIf="platformAdminSearchLoading" class="text-muted mt-1" style="font-size: 11px;">{{ 'chat.searching' | translate }}</div>
                <div *ngIf="platformAdminResults.length" class="mt-2" style="max-height: 240px; overflow: auto; border: 1px solid var(--clr-border-light); border-radius: var(--radius-md); background: var(--clr-surface);">
                  <button
                    type="button"
                    *ngFor="let hit of platformAdminResults"
                    class="chat-row text-start w-100 border-0 bg-transparent"
                    style="border-top: none !important;"
                    (click)="pickPlatformAdmin(hit)"
                  >
                    <div class="d-flex flex-column align-items-start gap-1">
                      <span style="font-weight: 800; font-size: 13px;">{{ hit.name }}</span>
                      <span class="text-muted" style="font-size: 12px;">{{ hit.schoolName }} · <code class="small">{{ hit.schoolCode }}</code></span>
                      <span class="text-muted" style="font-size: 11px;">{{ hit.email }}</span>
                    </div>
                  </button>
                </div>
              </div>

              <div class="mb-3" *ngIf="role !== 'parent' && role !== 'super_admin'">
                <label class="erp-label">{{ 'chat.labelDirSearch' | translate }}</label>
                <input
                  class="erp-input"
                  [placeholder]="'chat.dirSearchPh' | translate"
                  [(ngModel)]="directorySearchQuery"
                  (ngModelChange)="onDirectoryQueryChange()"
                />
                <div *ngIf="directorySearchLoading" class="text-muted mt-1" style="font-size: 11px;">{{ 'chat.searching' | translate }}</div>
                <div *ngIf="directorySearchResults.length" class="mt-2" style="max-height: 200px; overflow: auto; border: 1px solid var(--clr-border-light); border-radius: var(--radius-md); background: var(--clr-surface);">
                  <button
                    type="button"
                    *ngFor="let hit of directorySearchResults"
                    class="chat-row text-start w-100 border-0 bg-transparent"
                    style="border-top: none !important;"
                    (click)="pickDirectoryEntry(hit)"
                  >
                    <div class="d-flex flex-column align-items-start gap-1">
                      <span style="font-weight: 700; font-size: 12px;">{{ hit.displayName }}</span>
                      <span class="text-muted" style="font-size: 11px;">{{ hit.subtitle }}</span>
                      <span class="text-muted" style="font-size: 10px;">
                        <ng-container *ngIf="hit.chatUserId">{{ 'chat.chatAvailable' | translate }}</ng-container>
                        <ng-container *ngIf="!hit.chatUserId">{{ 'chat.profileOnly' | translate }}</ng-container>
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div *ngIf="loadingDirectory" class="text-muted" style="font-size: 12px;">{{ 'chat.loadingDirectory' | translate }}</div>

              <!-- Teacher: choose a student -> chat with parent -->
              <div *ngIf="role === 'teacher' && directory?.myClassRosters?.length">
                <label class="erp-label">{{ 'chat.labelStudent' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedStudentForChat">
                  <option [ngValue]="null">{{ 'chat.selectStudent' | translate }}</option>
                  <ng-container *ngFor="let roster of (directory?.myClassRosters || [])">
                    <optgroup [label]="rosterOptgroupLabel(roster)">
                      <option *ngFor="let s of roster.students || []" [ngValue]="s.studentId">
                        {{ s.studentName }}
                      </option>
                    </optgroup>
                  </ng-container>
                </select>
                <button class="btn-primary-erp btn-sm mt-2" [disabled]="selectedStudentForChat == null" (click)="startTeacherParentChat()">
                  {{ 'chat.messageParent' | translate }}
                </button>
              </div>

              <!-- Parent: choose child -> message class teacher -->
              <div *ngIf="role === 'parent' && directory?.myChildren?.length">
                <label class="erp-label">{{ 'chat.labelChild' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedChildForChat">
                  <option [ngValue]="null">{{ 'chat.selectChild' | translate }}</option>
                  <option *ngFor="let c of (directory?.myChildren || [])" [ngValue]="c.studentId">
                    {{ childPickerLine(c) }}
                  </option>
                </select>
                <button class="btn-primary-erp btn-sm mt-2" [disabled]="selectedChildForChat == null" (click)="startParentTeacherChat()">
                  {{ 'chat.messageClassTeacher' | translate }}
                </button>
              </div>

              <!-- Admin: direct pick (MVP) -->
              <div *ngIf="role === 'admin'">
                <label class="erp-label">{{ 'chat.labelTeachers' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedAdminTeacher" (ngModelChange)="selectedAdminParent = null">
                  <option [ngValue]="null">{{ 'chat.selectTeacher' | translate }}</option>
                  <option *ngFor="let t of (directory?.teachers || [])" [ngValue]="t.userId">{{ t.name }}</option>
                </select>
                <label class="erp-label mt-2">{{ 'chat.labelParents' | translate }}</label>
                <select class="erp-select" [(ngModel)]="selectedAdminParent" (ngModelChange)="selectedAdminTeacher = null">
                  <option [ngValue]="null">{{ 'chat.selectParent' | translate }}</option>
                  <option *ngFor="let p of (directory?.parents || [])" [ngValue]="p.userId">{{ p.name }}</option>
                </select>
                <button class="btn-primary-erp btn-sm mt-2" [disabled]="selectedAdminTeacher == null && selectedAdminParent == null" (click)="startAdminDirectChat()">
                  {{ 'chat.startChat' | translate }}
                </button>
              </div>

              <div *ngIf="!loadingDirectory && openDirectory && !hasDirectoryData() && role !== 'super_admin'" class="text-muted" style="font-size: 12px;">
                {{ 'chat.noDirectoryData' | translate }}
              </div>
            </div>

            <div class="chat-sidebar-scroll">
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
                        {{ conv.lastMessagePreview || ('chat.noMessagesPreview' | translate) }}
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
                <h3>{{ 'chat.emptyInboxTitle' | translate }}</h3>
                <p>{{ 'chat.emptyInboxHint' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="col-lg-8 chat-thread-column">
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
                  <ng-container *ngIf="useMocks">{{ 'chat.statusThreadDemo' | translate }}</ng-container>
                  <ng-container *ngIf="!useMocks && realtimeConnected">{{ 'chat.statusThreadLive' | translate }}</ng-container>
                  <ng-container *ngIf="!useMocks && !realtimeConnected">{{ 'chat.statusThreadIdle' | translate }}</ng-container>
                </span>
              </div>
              <ng-template #noSelection>
                <div style="font-weight: 900;">{{ 'chat.selectConversation' | translate }}</div>
                <div class="text-muted" style="font-size: 12px;">{{ 'chat.selectConversationHint' | translate }}</div>
              </ng-template>
            </div>

            <div #threadScroll class="chat-messages" style="padding: 14px;">
              <div *ngIf="selectedConversation && loadingMessages" class="empty-state" style="padding: 28px 14px;">
                <h3>{{ 'chat.loading' | translate }}</h3>
              </div>

              <div *ngIf="selectedConversation && !loadingMessages && !messages.length" class="empty-state" style="padding: 28px 14px;">
                <i class="bi bi-chat-left-text"></i>
                <h3>{{ 'chat.emptyThreadTitle' | translate }}</h3>
                <p>{{ 'chat.emptyThreadHint' | translate }}</p>
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
                       [placeholder]="'chat.composePlaceholder' | translate"
                       [(ngModel)]="draft"
                       (keydown.enter)="onEnter($event)" />
                <button class="btn-primary-erp flex-shrink-0"
                        type="button"
                        [disabled]="!selectedConversation || sending || !draft.trim()"
                        (click)="send()">
                  {{ sending ? ('chat.sending' | translate) : ('chat.send' | translate) }}
                </button>
              </div>
              <div class="text-muted" style="font-size: 11px; margin-top: 8px;">
                {{ 'chat.policyFootnote' | translate }}
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
  selectedStudentForChat: number | null = null;
  selectedChildForChat: number | null = null;
  selectedAdminTeacher: number | null = null;
  selectedAdminParent: number | null = null;
  sending = false;
  draft = '';
  query = '';
  directorySearchQuery = '';
  directorySearchResults: DirectoryEntry[] = [];
  directorySearchLoading = false;
  private directorySearchTimer: ReturnType<typeof setTimeout> | null = null;
  platformAdminQuery = '';
  platformAdminResults: PlatformSchoolAdminChatHit[] = [];
  platformAdminSearchLoading = false;
  private platformAdminSearchTimer: ReturnType<typeof setTimeout> | null = null;

  private myUserId: number | null = null;
  private rtSub?: Subscription;

  @ViewChild('threadScroll') private threadScroll?: ElementRef<HTMLElement>;

  constructor(
    private chat: ChatService,
    private auth: AuthService,
    private directoryService: DirectoryService,
    private platform: PlatformService,
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
    this.myUserId = this.auth.getCurrentUser()?.id ?? null;
    this.role = this.auth.getRole() || 'admin';
    this.chat.connectRealtime();
    this.rtSub = this.chat.realtimeConnected$.subscribe(v => (this.realtimeConnected = v));
    this.chat.inbox$.subscribe(items => (this.inbox = items));
    this.chat.inboundMessage$.subscribe(m => {
      if (this.selectedConversation?.conversationId === m.conversationId) {
        // avoid duplicates on optimistic UI
        if (!this.messages.some(x => x.id === m.id)) {
          this.messages = [...this.messages, m];
          this.scrollThreadToBottom();
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
    if (this.role === 'super_admin') {
      return true;
    }
    const d = this.directory;
    if (!d) return false;
    return !!(d.myClassRosters?.length || d.myChildren?.length || d.teachers?.length || d.parents?.length);
  }

  onPlatformAdminQueryChange(): void {
    if (this.platformAdminSearchTimer) {
      clearTimeout(this.platformAdminSearchTimer);
    }
    this.platformAdminSearchTimer = setTimeout(() => this.runPlatformAdminSearch(), 280);
  }

  private runPlatformAdminSearch(): void {
    const q = this.platformAdminQuery.trim();
    if (q.length < 2) {
      this.platformAdminResults = [];
      return;
    }
    this.platformAdminSearchLoading = true;
    this.platform.searchSchoolAdminsForChat(q).subscribe({
      next: rows => {
        this.platformAdminResults = rows;
        this.platformAdminSearchLoading = false;
      },
      error: () => {
        this.platformAdminResults = [];
        this.platformAdminSearchLoading = false;
      },
    });
  }

  pickPlatformAdmin(hit: PlatformSchoolAdminChatHit): void {
    const label = `${hit.name} · ${hit.schoolName} (${hit.schoolCode})`;
    this.startDirectChat(hit.userId, 'ADMIN', label);
  }

  startTeacherParentChat(): void {
    if (!this.directory?.myClassRosters?.length) return;
    const all = this.directory.myClassRosters.flatMap(r => r.students || []);
    const student = all.find(s => s.studentId === this.selectedStudentForChat);
    if (!student?.parent) return;
    this.startDirectChat(student.parent.userId, 'PARENT', this.translate.instant('chat.parentOf', { name: student.studentName }), {
      contextType: 'student',
      contextId: String(student.studentId),
    });
  }

  startParentTeacherChat(): void {
    const child = this.directory?.myChildren?.find(c => c.studentId === this.selectedChildForChat);
    if (!child?.classTeacher) return;
    this.startDirectChat(child.classTeacher.userId, 'TEACHER', child.classTeacher.name, {
      contextType: 'student',
      contextId: String(child.studentId),
    });
  }

  startAdminDirectChat(): void {
    // MVP: if teacher selected, start direct with teacher; otherwise with parent.
    if (this.selectedAdminTeacher != null) {
      const t = this.directory?.teachers?.find(x => x.userId === this.selectedAdminTeacher);
      if (t) this.startDirectChat(t.userId, t.role, t.name);
      return;
    }
    if (this.selectedAdminParent != null) {
      const p = this.directory?.parents?.find(x => x.userId === this.selectedAdminParent);
      if (p) this.startDirectChat(p.userId, p.role, p.name);
    }
  }

  onDirectoryQueryChange(): void {
    if (this.directorySearchTimer) {
      clearTimeout(this.directorySearchTimer);
    }
    this.directorySearchTimer = setTimeout(() => this.runDirectorySearch(), 300);
  }

  private runDirectorySearch(): void {
    if (this.role === 'super_admin') {
      this.directorySearchResults = [];
      return;
    }
    if (this.role === 'parent') {
      this.directorySearchResults = [];
      return;
    }
    const q = this.directorySearchQuery.trim();
    if (q.length < 2) {
      this.directorySearchResults = [];
      return;
    }
    this.directorySearchLoading = true;
    this.directoryService.search(q).subscribe({
      next: res => {
        let rows = res.results || [];
        if (this.role === 'parent') {
          rows = rows.filter(hit => this.isParentAllowedDirectoryHit(hit));
        }
        this.directorySearchResults = rows;
        this.directorySearchLoading = false;
      },
      error: () => {
        this.directorySearchLoading = false;
      },
    });
  }

  pickDirectoryEntry(hit: DirectoryEntry): void {
    if (this.role === 'parent' && !this.isParentAllowedDirectoryHit(hit)) {
      return;
    }
    if (!hit.chatUserId) {
      if (hit.deepLink) {
        this.openDirectory = false;
        this.router.navigateByUrl(hit.deepLink);
      }
      return;
    }
    const me = this.auth.getCurrentUser()?.id ?? null;
    if (me != null && hit.chatUserId === me) {
      return;
    }
    const role =
      hit.chatTargetRole ||
      (hit.kind === 'teacher' ? 'TEACHER' : hit.kind === 'student' ? 'PARENT' : 'USER');
    const label =
      hit.kind === 'student'
        ? this.translate.instant('chat.parentDirectoryLabel', { name: hit.displayName })
        : hit.displayName;
    this.startDirectChat(hit.chatUserId, role, label, {
      contextType: hit.contextType,
      contextId: hit.contextId,
    });
  }

  /** Parent accounts may only open chat with homeroom teachers linked to their children (matches server policy). */
  private isParentAllowedDirectoryHit(hit: DirectoryEntry): boolean {
    if (this.role !== 'parent') return true;
    if (hit.kind !== 'teacher' || !hit.chatUserId) return false;
    const allowed = new Set<number>();
    for (const c of this.directory?.myChildren ?? []) {
      if (c.classTeacher?.userId != null) allowed.add(c.classTeacher.userId);
    }
    return hit.chatUserId != null && allowed.has(hit.chatUserId);
  }

  private startDirectChat(
    otherUserId: number,
    otherRole: string,
    otherName?: string,
    ctx?: { contextType?: string; contextId?: string }
  ): void {
    const me = this.auth.getCurrentUser();
    if (!me) return;
    this.chat.createConversation({
      type: 'direct',
      contextType: ctx?.contextType,
      contextId: ctx?.contextId,
      participants: [
        { userId: me.id, userRole: (me.role || 'admin').toUpperCase(), displayName: me.name },
        { userId: otherUserId, userRole: (otherRole || '').toUpperCase(), displayName: otherName }
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
      this.scrollThreadToBottom();
      const lastId = list.length ? this.parseMessageIdForReadCursor(list[list.length - 1].id) : 0;
      if (lastId > 0) {
        this.chat.markRead(conv.conversationId, lastId).subscribe({
          error: () => {
            /* non-fatal */
          }
        });
      }
    });
  }

  private parseMessageIdForReadCursor(id: string | undefined): number {
    if (id == null) {
      return 0;
    }
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private scrollThreadToBottom(): void {
    setTimeout(() => {
      const el = this.threadScroll?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
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
          this.scrollThreadToBottom();
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
    return this.myUserId != null && m.senderUserId === this.myUserId;
  }

  threadSubtitle(conv: ChatInboxConversation): string {
    const ctx = this.describeContext(conv);
    return this.convTypeLabel(conv.type) + this.translate.instant('chat.threadSep') + ctx;
  }

  rosterOptgroupLabel(roster: ChatDirectoryClassRoster): string {
    return formatSchoolClassDisplayName(roster.classId, roster.className ?? null, this.translate);
  }

  childPickerLine(c: ChatDirectoryParentChildRoster): string {
    const cls =
      c.classId != null
        ? formatSchoolClassDisplayName(c.classId, c.className ?? null, this.translate)
        : formatSchoolClassName(c.className, this.translate) || c.className?.trim() || '';
    return cls ? `${c.studentName} · ${cls}` : c.studentName;
  }

  private convTypeLabel(type?: string): string {
    const normalized = (type || 'direct').toLowerCase().replace(/_/g, ' ');
    if (normalized === 'direct') {
      return this.translate.instant('chat.typeDirect');
    }
    if (normalized === 'group') {
      return this.translate.instant('chat.typeGroup');
    }
    return (type || 'direct').replace(/_/g, ' ');
  }

  private describeContext(conv: ChatInboxConversation): string {
    const role = (this.auth.getRole() || '').toLowerCase();
    if (conv.contextType === 'student' && conv.contextId) {
      const sid = Number(conv.contextId);
      if (role === 'parent' && this.directory?.myChildren?.length) {
        const child = this.directory.myChildren.find(c => c.studentId === sid);
        if (child?.studentName) {
          return this.translate.instant('chat.ctxChild', { name: child.studentName });
        }
      }
      if (role === 'teacher' && this.directory?.myClassRosters?.length) {
        for (const r of this.directory.myClassRosters) {
          const hit = r.students?.find(s => s.studentId === sid);
          if (hit?.studentName) {
            return this.translate.instant('chat.ctxStudentNamed', { name: hit.studentName });
          }
        }
      }
      return this.translate.instant('chat.ctxStudentId', { id: conv.contextId });
    }
    if (conv.contextType && conv.contextId) {
      return this.translate.instant('chat.ctxGeneric', { type: conv.contextType, id: conv.contextId });
    }
    return this.translate.instant('chat.ctxGeneral');
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
      return (
        other?.displayName ||
        `${other?.userRole || this.translate.instant('chat.fallbackUser')} ${other?.userId || ''}`.trim()
      );
    }
    if (conv.subject) return conv.subject;
    if (conv.contextType && conv.contextId) return this.describeContext(conv);
    return role
      ? this.translate.instant('chat.roleGroup', { role: role.toUpperCase() })
      : this.translate.instant('chat.fallbackGroup');
  }

  asTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const loc = this.translate.currentLang === 'hi' ? 'hi-IN' : 'en-IN';
    return d.toLocaleString(loc, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}

