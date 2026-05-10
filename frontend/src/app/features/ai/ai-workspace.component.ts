import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { AiAgentService } from '../../core/services/ai-agent.service';
import {
  AiConversationSummary,
  AiResponseCard,
  AiStreamEvent,
  AiToolExecutionView,
} from '../../core/models/ai-agent.models';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="ai-page animate-in-fade">
      <div class="erp-page-header ai-page-header mb-3">
        <div>
          <h1 class="erp-page-header__title">School Copilot</h1>
          <p class="erp-page-header__lead">Your campus assistant for academics, finance, attendance, and operations.</p>
        </div>
        <div class="erp-page-header__actions">
          <span class="badge-erp badge-neutral">AI workspace</span>
          <span class="badge-erp badge-info" *ngIf="streaming()">Streaming</span>
        </div>
      </div>

      <div class="ai-layout">
        <aside class="ai-sidebar erp-card">
          <div class="ai-sidebar__head">
            <button class="btn-primary-erp btn-sm w-100" (click)="startNewChat()">
              <i class="bi bi-plus-lg"></i>
              New chat
            </button>
            <input
              class="erp-input ai-search-input mt-2"
              [(ngModel)]="searchTerm"
              placeholder="Search chats..." />
          </div>
          <div class="ai-sidebar__list">
            <div class="ai-sidebar__empty" *ngIf="!groupedConversations().length && !loadingConversations()">
              Your saved chats will appear here.
            </div>
            <ng-container *ngFor="let group of groupedConversations()">
              <div class="ai-group-title">{{ group.label }}</div>
              <div
                *ngFor="let convo of group.items"
                class="ai-history-item"
                [class.ai-history-item--active]="convo.conversationId === conversationId()">
                <button class="ai-history-item__content" (click)="openConversation(convo.conversationId)">
                  <div class="ai-history-item__title">{{ convo.title || 'Untitled chat' }}</div>
                  <div class="ai-history-item__preview">{{ convo.lastMessagePreview || 'No message preview available' }}</div>
                  <div class="ai-history-item__time">{{ convo.updatedAt | date: 'MMM d, h:mm a' }}</div>
                </button>
                <div class="ai-history-item__actions">
                  <button
                    class="ai-icon-btn"
                    [disabled]="streaming()"
                    (click)="renameConversation(convo)"
                    title="Rename conversation"
                    aria-label="Rename conversation">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button
                    class="ai-icon-btn ai-icon-btn--danger"
                    [disabled]="streaming()"
                    (click)="deleteConversation(convo)"
                    title="Delete conversation"
                    aria-label="Delete conversation">
                    <i class="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
            </ng-container>
            <div class="ai-sidebar__loading" *ngIf="loadingConversations()">
              <span class="spinner"></span>
              Loading chats...
            </div>
          </div>
        </aside>

        <div class="ai-shell erp-card">
          <div class="ai-thread">
            <div *ngFor="let m of thread()" class="ai-row" [class.ai-row--user]="m.role === 'user'">
              <div class="ai-avatar" [class.ai-avatar--user]="m.role === 'user'">
                <i class="bi" [ngClass]="m.role === 'user' ? 'bi-person-fill' : 'bi-stars'"></i>
              </div>
              <div [class]="m.role === 'user' ? 'ai-bubble ai-bubble--user' : 'ai-bubble ai-bubble--assistant'">
                {{ m.content }}
              </div>
            </div>
            <div *ngIf="streamingText()" class="ai-row">
              <div class="ai-avatar">
                <i class="bi bi-stars"></i>
              </div>
              <div class="ai-bubble ai-bubble--assistant">
                {{ streamingText() }}
                <span class="ai-cursor"></span>
              </div>
            </div>
            <div *ngIf="streaming()" class="ai-streaming-note"><span class="spinner"></span>Thinking...</div>
            <div class="ai-empty" *ngIf="!thread().length && !streaming() && !loadingThread()">
              <div class="ai-empty__title">Start a conversation</div>
              <div class="ai-empty__subtitle">Share class, section, date range, and output format for more accurate responses.</div>
              <div class="ai-prompt-hints">
                <div class="ai-prompt-hints__label">Prompt style hint</div>
                <div class="ai-prompt-hints__item">"For Class 8-A, list students absent today with admission no and guardian contact."</div>
                <div class="ai-prompt-hints__item">"Compare fee collection for April vs May 2026, show totals and percentage change."</div>
                <div class="ai-prompt-hints__item">"For transport route R-12, show pending dues above ₹2,000 in a short table."</div>
              </div>
            </div>
            <div class="ai-thread-loading" *ngIf="loadingThread()">
              <span class="spinner"></span>
              Loading conversation...
            </div>
          </div>
          <div class="ai-composer-wrap">
            <div class="ai-composer">
              <div class="ai-composer__row">
                <input
                  class="erp-input ai-input"
                  [(ngModel)]="prompt"
                  (keydown.enter)="ask()"
                  placeholder="Ask with context (class/section/date range/expected format)..." />
                <button class="btn-primary-erp ai-send-btn" (click)="ask()" [disabled]="streaming() || !prompt.trim()">
                  <i class="bi bi-send-fill"></i>
                  Send
                </button>
              </div>
              <div class="ai-composer__hint">Copilot can make mistakes. Verify important details before sharing.</div>
            </div>
            <div class="ai-quick-actions mt-2" *ngIf="thread().length">
              <button *ngFor="let action of quickActions" class="ai-quick-btn" (click)="ask(action)">{{ action }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="renameModalOpen" (click)="closeRenameModal()">
        <div class="modal-content-erp ai-rename-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="modal-header-erp">
            <h3>Rename conversation</h3>
            <button type="button" class="btn-icon" (click)="closeRenameModal()" aria-label="Close rename dialog">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="modal-body-erp">
            <label class="erp-label" for="ai-rename-input">Title</label>
            <input
              id="ai-rename-input"
              class="erp-input"
              maxlength="120"
              [(ngModel)]="renameDraft"
              (keydown.enter)="submitRenameConversation()"
              placeholder="Enter a conversation title" />
            <div class="ai-rename-help">Keep titles short and specific so you can find chats faster later.</div>
            <div class="ai-rename-error" *ngIf="renameError">{{ renameError }}</div>
          </div>
          <div class="modal-footer-erp">
            <button type="button" class="btn-outline-erp" [disabled]="renameSaving" (click)="closeRenameModal()">Cancel</button>
            <button type="button" class="btn-primary-erp" [disabled]="renameSaving || !renameDraft.trim()" (click)="submitRenameConversation()">
              {{ renameSaving ? 'Saving...' : 'Save title' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .ai-page {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      height: calc(100vh - 132px);
      min-height: 560px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ai-page-header {
      margin-bottom: 12px;
      flex: 0 0 auto;
    }
    .ai-layout {
      display: grid;
      grid-template-columns: minmax(240px, 290px) minmax(0, 1fr);
      gap: 12px;
      flex: 1 1 auto;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .ai-sidebar {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary));
      border-radius: clamp(14px, 2vw, 18px);
      background: color-mix(in srgb, var(--clr-surface) 90%, var(--clr-bg));
    }
    .ai-sidebar__head {
      padding: 12px;
      border-bottom: 1px solid color-mix(in srgb, var(--clr-border) 85%, var(--clr-primary));
    }
    .ai-search-input {
      min-height: 36px;
      border-radius: 10px;
      border-color: color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary));
      font-size: 12px;
    }
    .ai-sidebar__list {
      padding: 10px;
      overflow-x: hidden;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1 1 auto;
      min-height: 0;
    }
    .ai-sidebar__empty,
    .ai-sidebar__loading {
      color: var(--clr-text-muted);
      font-size: 12px;
      border: 1px dashed var(--clr-border);
      border-radius: 12px;
      padding: 12px;
    }
    .ai-sidebar__loading {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .ai-history-item {
      border: 1px solid color-mix(in srgb, var(--clr-border) 90%, var(--clr-primary));
      border-radius: 12px;
      background: color-mix(in srgb, var(--clr-surface) 92%, var(--clr-hover));
      transition: all 0.2s ease;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: start;
    }
    .ai-history-item:hover {
      border-color: color-mix(in srgb, var(--clr-primary) 35%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-primary) 7%, var(--clr-surface));
    }
    .ai-history-item--active {
      border-color: color-mix(in srgb, var(--clr-primary) 45%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface));
      box-shadow: 0 2px 10px color-mix(in srgb, var(--clr-text) 8%, transparent);
    }
    .ai-group-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--clr-text-muted);
      margin: 4px 2px 2px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ai-history-item__content {
      width: 100%;
      border: 0;
      background: transparent;
      text-align: left;
      padding: 9px 0 9px 10px;
      min-width: 0;
    }
    .ai-history-item__actions {
      display: inline-flex;
      gap: 4px;
      padding: 8px 8px 0 0;
    }
    .ai-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary));
      color: var(--clr-text-muted);
      background: color-mix(in srgb, var(--clr-surface) 95%, var(--clr-hover));
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .ai-icon-btn:hover {
      color: var(--clr-primary);
      border-color: color-mix(in srgb, var(--clr-primary) 45%, var(--clr-border));
      background: color-mix(in srgb, var(--clr-primary) 10%, var(--clr-surface));
    }
    .ai-icon-btn--danger:hover {
      color: #c81e1e;
      border-color: color-mix(in srgb, #c81e1e 40%, var(--clr-border));
      background: color-mix(in srgb, #c81e1e 10%, var(--clr-surface));
    }
    .ai-history-item__title {
      font-size: 12px;
      font-weight: 700;
      color: var(--clr-text);
      line-height: 1.3;
      margin-bottom: 4px;
    }
    .ai-history-item__preview {
      font-size: 11px;
      color: var(--clr-text-muted);
      line-height: 1.35;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .ai-history-item__time {
      font-size: 10px;
      color: var(--clr-text-muted);
    }
    .ai-shell {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary));
      border-radius: clamp(14px, 2vw, 18px);
      background:
        radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--clr-accent) 10%, transparent), transparent 38%),
        radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--clr-primary) 11%, transparent), transparent 45%),
        var(--clr-surface);
    }
    .ai-thread {
      flex: 1;
      min-height: 54vh;
      max-height: 68vh;
      overflow: auto;
      padding: 20px clamp(14px, 3vw, 28px);
      background: color-mix(in srgb, var(--clr-bg) 58%, var(--clr-surface));
      scroll-behavior: smooth;
    }
    .ai-row {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr);
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 14px;
    }
    .ai-row--user {
      grid-template-columns: minmax(0, 1fr) 32px;
    }
    .ai-row--user .ai-avatar { order: 2; }
    .ai-row--user .ai-bubble { order: 1; justify-self: end; }
    .ai-avatar {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      border: 1px solid color-mix(in srgb, var(--clr-border) 70%, transparent);
      color: var(--clr-primary);
      background: color-mix(in srgb, var(--clr-surface) 75%, var(--clr-hover));
    }
    .ai-avatar--user {
      color: #fff;
      border-color: color-mix(in srgb, var(--clr-primary) 48%, transparent);
      background: linear-gradient(145deg, var(--clr-primary), var(--clr-accent));
    }
    .ai-bubble {
      max-width: min(860px, 100%);
      border-radius: 16px;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.58;
      border: 1px solid var(--clr-border);
      white-space: pre-wrap;
      word-break: break-word;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--clr-text) 7%, transparent);
    }
    .ai-bubble--assistant {
      background: color-mix(in srgb, var(--clr-surface) 86%, var(--clr-bg));
    }
    .ai-bubble--user {
      background: color-mix(in srgb, var(--clr-primary) 14%, var(--clr-surface));
      border-color: color-mix(in srgb, var(--clr-primary) 30%, var(--clr-border));
    }
    .ai-cursor {
      display: inline-block;
      width: 7px;
      height: 14px;
      margin-left: 3px;
      vertical-align: -2px;
      border-radius: 2px;
      background: color-mix(in srgb, var(--clr-primary) 65%, var(--clr-accent));
      animation: ai-blink 1s ease-in-out infinite;
    }
    .ai-streaming-note {
      color: var(--clr-text-muted);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-left: 42px;
    }
    .ai-thread-loading {
      margin-left: 42px;
      color: var(--clr-text-muted);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .ai-composer-wrap {
      padding: 12px clamp(12px, 2.5vw, 22px) 16px;
      border-top: 1px solid color-mix(in srgb, var(--clr-border) 85%, var(--clr-primary));
      background: color-mix(in srgb, var(--clr-surface) 86%, var(--clr-bg));
    }
    .ai-composer {
      border: 1px solid color-mix(in srgb, var(--clr-border) 85%, var(--clr-primary));
      border-radius: 14px;
      background: var(--clr-surface);
      padding: 9px;
      box-shadow: 0 8px 28px color-mix(in srgb, var(--clr-text) 7%, transparent);
    }
    .ai-composer__row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: center;
    }
    .ai-input {
      min-height: 42px;
      border-radius: 10px;
      border-color: color-mix(in srgb, var(--clr-border) 75%, var(--clr-primary));
    }
    .ai-send-btn {
      min-width: 108px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .ai-composer__hint {
      font-size: 11px;
      color: var(--clr-text-muted);
      margin-top: 8px;
      padding-left: 2px;
    }
    .ai-rename-modal {
      width: min(560px, calc(100vw - 18px));
      max-width: 560px !important;
    }
    .ai-rename-help {
      margin-top: 8px;
      font-size: 11px;
      color: var(--clr-text-muted);
    }
    .ai-rename-error {
      margin-top: 8px;
      font-size: 12px;
      color: var(--clr-danger);
    }
    .ai-empty {
      border: 1px dashed color-mix(in srgb, var(--clr-border) 85%, var(--clr-primary));
      border-radius: 14px;
      padding: 16px;
      background: color-mix(in srgb, var(--clr-surface) 88%, var(--clr-bg));
    }
    .ai-empty__title { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
    .ai-empty__subtitle { font-size: 12px; color: var(--clr-text-muted); }
    .ai-prompt-hints {
      margin-top: 10px;
      border: 1px solid color-mix(in srgb, var(--clr-border) 90%, var(--clr-primary));
      border-radius: 12px;
      background: color-mix(in srgb, var(--clr-surface) 94%, var(--clr-hover));
      padding: 10px;
      display: grid;
      gap: 7px;
    }
    .ai-prompt-hints__label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--clr-text-muted);
    }
    .ai-prompt-hints__item {
      font-size: 12px;
      line-height: 1.45;
      color: var(--clr-text-secondary);
      border-left: 2px solid color-mix(in srgb, var(--clr-primary) 36%, var(--clr-border));
      padding-left: 8px;
    }
    .ai-quick-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .ai-quick-btn {
      border: 1px solid var(--clr-border);
      border-radius: 999px;
      background: color-mix(in srgb, var(--clr-surface) 90%, var(--clr-hover));
      color: var(--clr-text-secondary);
      font-size: 12px;
      font-weight: 600;
      padding: 7px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .ai-quick-btn:hover {
      border-color: color-mix(in srgb, var(--clr-accent) 36%, var(--clr-border));
      color: var(--clr-accent-dark);
      background: color-mix(in srgb, var(--clr-accent) 9%, var(--clr-surface));
    }
    @keyframes ai-blink {
      0%, 46% { opacity: 1; }
      50%, 100% { opacity: 0.2; }
    }
    @media (max-width: 992px) {
      .ai-page {
        height: auto;
        min-height: 0;
        overflow: visible;
      }
      .ai-layout {
        grid-template-columns: 1fr;
        min-height: 0;
        height: auto;
        overflow: visible;
      }
      .ai-sidebar {
        height: auto;
        max-height: min(36vh, 360px);
      }
      .ai-shell { height: auto; min-height: 64vh; }
      .ai-thread { min-height: 40vh; max-height: 60vh; padding: 14px; }
      .ai-composer__row { grid-template-columns: 1fr; }
      .ai-send-btn { width: 100%; }
      .ai-row--user { grid-template-columns: minmax(0, 1fr) 28px; }
      .ai-row { grid-template-columns: 28px minmax(0, 1fr); }
      .ai-avatar { width: 28px; height: 28px; border-radius: 9px; }
      .ai-streaming-note { margin-left: 36px; }
    }
    @media (max-width: 576px) {
      .ai-sidebar { max-height: min(42vh, 320px); }
      .ai-thread { min-height: 46vh; max-height: 62vh; }
    }
  `],
})
export class AiWorkspaceComponent implements OnInit {
  prompt = '';
  searchTerm = '';
  conversationId = signal<string | null>(null);
  streaming = signal(false);
  thread = signal<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  streamingText = signal('');
  conversations = signal<AiConversationSummary[]>([]);
  loadingConversations = signal(false);
  loadingThread = signal(false);
  cards = signal<AiResponseCard[]>([]);
  tools = signal<AiToolExecutionView[]>([]);
  renameModalOpen = false;
  renameTarget: AiConversationSummary | null = null;
  renameDraft = '';
  renameSaving = false;
  renameError = '';
  readonly quickActions = [
    'Show pending fees for Rohit Sharma',
    'Which students are absent today?',
    'Compare fee collection with last month',
    'Show transport dues for Class 8',
    'Generate homework summary',
  ];

  constructor(
    private ai: AiAgentService,
    private auth: AuthService,
    private confirmDialog: ConfirmDialogService
  ) {}

  ngOnInit(): void {
    this.refreshConversations();
  }

  startNewChat(): void {
    if (this.streaming()) return;
    this.conversationId.set(null);
    this.thread.set([]);
    this.streamingText.set('');
    this.prompt = '';
    this.cards.set([]);
    this.tools.set([]);
  }

  openConversation(conversationId: string): void {
    if (!conversationId || this.streaming()) return;
    this.loadingThread.set(true);
    this.ai.getConversationHistory(conversationId).subscribe({
      next: history => {
        this.conversationId.set(history.conversationId);
        this.thread.set(history.messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })));
        this.cards.set([]);
        this.tools.set([]);
        this.streamingText.set('');
      },
      error: () => {
        this.thread.set([{ role: 'assistant', content: 'Unable to load this conversation right now.' }]);
      },
      complete: () => this.loadingThread.set(false),
    });
  }

  renameConversation(conversation: AiConversationSummary): void {
    this.renameTarget = conversation;
    this.renameDraft = (conversation.title || '').trim();
    this.renameSaving = false;
    this.renameError = '';
    this.renameModalOpen = true;
  }

  closeRenameModal(): void {
    if (this.renameSaving) return;
    this.renameModalOpen = false;
    this.renameTarget = null;
    this.renameDraft = '';
    this.renameError = '';
  }

  submitRenameConversation(): void {
    const target = this.renameTarget;
    if (!target) return;
    const trimmed = this.renameDraft.trim();
    const previous = (target.title || '').trim();
    if (!trimmed) {
      this.renameError = 'Title is required.';
      return;
    }
    if (trimmed.length < 2) {
      this.renameError = 'Use at least 2 characters.';
      return;
    }
    if (trimmed === previous) {
      this.closeRenameModal();
      return;
    }
    this.renameSaving = true;
    this.renameError = '';
    this.ai.renameConversation(target.conversationId, trimmed).subscribe({
      next: () => {
        this.closeRenameModal();
        this.refreshConversations(target.conversationId);
      },
      error: () => {
        this.renameSaving = false;
        this.renameError = 'Unable to rename this conversation right now.';
      },
    });
  }

  deleteConversation(conversation: AiConversationSummary): void {
    this.confirmDialog.confirm({
      title: 'Delete conversation?',
      message: `You are about to delete "${conversation.title || 'Untitled chat'}". This removes the chat from your history.`,
      details: [
        'This action cannot be undone from the UI.',
        'Messages and tool traces linked to this conversation are removed.',
      ],
      variant: 'danger',
      confirmLabel: 'Delete conversation',
      cancelLabel: 'Cancel',
    }).pipe(filter(Boolean)).subscribe(() => {
      this.ai.deleteConversation(conversation.conversationId).subscribe({
        next: () => {
          if (this.conversationId() === conversation.conversationId) {
            this.startNewChat();
          }
          this.refreshConversations();
        },
      });
    });
  }

  groupedConversations(): Array<{ label: string; items: AiConversationSummary[] }> {
    const search = this.searchTerm.trim().toLowerCase();
    const list = this.conversations().filter(c => {
      if (!search) return true;
      const title = (c.title || '').toLowerCase();
      const preview = (c.lastMessagePreview || '').toLowerCase();
      return title.includes(search) || preview.includes(search);
    });
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const today: AiConversationSummary[] = [];
    const yesterday: AiConversationSummary[] = [];
    const older: AiConversationSummary[] = [];
    for (const item of list) {
      const t = new Date(item.updatedAt).getTime();
      if (t >= todayStart) {
        today.push(item);
      } else if (t >= yesterdayStart) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    }
    const groups: Array<{ label: string; items: AiConversationSummary[] }> = [];
    if (today.length) groups.push({ label: 'Today', items: today });
    if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
    if (older.length) groups.push({ label: 'Older', items: older });
    return groups;
  }

  private refreshConversations(selectConversationId?: string): void {
    this.loadingConversations.set(true);
    this.ai.listConversations().subscribe({
      next: list => {
        this.conversations.set(list);
        const target = selectConversationId || this.conversationId();
        if (target && !list.some(c => c.conversationId === target)) {
          this.conversationId.set(null);
        }
      },
      complete: () => this.loadingConversations.set(false),
      error: () => this.loadingConversations.set(false),
    });
  }

  ask(quick?: string): void {
    const text = (quick ?? this.prompt).trim();
    if (!text || this.streaming()) return;
    this.prompt = '';
    this.thread.update(t => [...t, { role: 'user', content: text }]);
    this.streaming.set(true);
    this.streamingText.set('');
    let assistant = '';
    this.ai.streamChat({
      conversationId: this.conversationId(),
      message: text,
      moduleKey: 'ai-workspace',
      locale: this.auth.getCurrentUser()?.interfaceLocale ?? 'en',
      stream: true,
    }).subscribe({
      next: (evt: AiStreamEvent) => {
        if (evt.conversationId) this.conversationId.set(evt.conversationId);
        if (evt.type === 'TOOL_END' && evt.tool) this.tools.update(v => [...v, evt.tool as AiToolExecutionView]);
        if (evt.type === 'CARD' && evt.card) this.cards.update(v => [...v, evt.card as AiResponseCard]);
        if (evt.type === 'TOKEN' && evt.token) {
          assistant += evt.token;
          this.streamingText.set(assistant);
        }
        if (evt.type === 'ERROR') {
          this.streaming.set(false);
          this.streamingText.set('');
          this.thread.update(t => [...t, { role: 'assistant', content: evt.token || 'AI request could not be completed.' }]);
          return;
        }
        if (evt.type === 'DONE') {
          this.thread.update(t => [...t, { role: 'assistant', content: assistant.trim() }]);
          this.streaming.set(false);
          this.streamingText.set('');
          this.refreshConversations(this.conversationId() || undefined);
        }
      },
      complete: () => {
        if (!this.streaming()) return;
        this.streaming.set(false);
        this.streamingText.set('');
        this.thread.update(t => [...t, { role: 'assistant', content: assistant.trim() || 'No response received. Please try again.' }]);
        this.refreshConversations(this.conversationId() || undefined);
      },
      error: () => {
        this.streaming.set(false);
        this.streamingText.set('');
        this.thread.update(t => [...t, { role: 'assistant', content: 'AI assistant is temporarily unavailable.' }]);
        this.refreshConversations(this.conversationId() || undefined);
      },
    });
  }
}
