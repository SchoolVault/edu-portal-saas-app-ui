import { CommonModule } from '@angular/common';
import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiStreamEvent } from '../../core/models/ai-agent.models';
import { AiAgentService } from '../../core/services/ai-agent.service';
import { AuthService } from '../../core/services/auth.service';

type UiMessage = { role: 'user' | 'assistant'; content: string; at: string };

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button class="ai-fab" (click)="toggleWidget()" [attr.aria-expanded]="open()" aria-label="Open AI assistant">
      <i class="bi" [ngClass]="open() ? 'bi-x-lg' : 'bi-stars'"></i>
    </button>

    <section class="ai-widget erp-card" *ngIf="open()">
      <header class="ai-header">
        <div class="ai-heading">
          <div class="ai-title">School Copilot</div>
          <small class="ai-subtitle">ERP-aware assistant for your daily school operations.</small>
        </div>
        <div class="ai-header-actions">
          <button class="btn-outline-erp btn-xs" (click)="goFullPanel()">Open panel</button>
        </div>
      </header>

      <div class="ai-chips">
        <button *ngFor="let q of quickActions()" class="ai-chip" (click)="send(q)">{{ q }}</button>
      </div>

      <div class="ai-messages">
        <div *ngFor="let m of messages()" class="ai-message-row" [class.ai-message-row--user]="m.role === 'user'">
          <div class="ai-avatar" [class.ai-avatar--user]="m.role === 'user'">
            <i class="bi" [ngClass]="m.role === 'user' ? 'bi-person-fill' : 'bi-stars'"></i>
          </div>
          <div class="ai-bubble" [class.ai-bubble--user]="m.role === 'user'">{{ m.content }}</div>
        </div>
        <div *ngIf="streamingText()" class="ai-message-row">
          <div class="ai-avatar">
            <i class="bi bi-stars"></i>
          </div>
          <div class="ai-bubble">{{ streamingText() }}<span class="ai-cursor"></span></div>
        </div>
        <div *ngIf="streaming()" class="ai-typing">
          <span class="spinner"></span>
          Thinking...
        </div>
      </div>

      <footer class="ai-footer">
        <div class="ai-input-row">
          <input class="erp-input ai-input" [(ngModel)]="prompt" (keydown.enter)="send()" placeholder="Message School Copilot..." />
          <button class="btn-primary-erp btn-sm ai-send-btn" [disabled]="streaming() || !prompt.trim()" (click)="send()">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
        <div class="ai-footer-note">Copilot can make mistakes, so please verify critical details.</div>
      </footer>
    </section>
  `,
  styles: [`
    .ai-fab {
      position: fixed;
      right: 22px;
      bottom: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--clr-accent) 30%, transparent);
      background: linear-gradient(160deg, var(--clr-accent-light), var(--clr-accent-dark));
      box-shadow: 0 12px 26px color-mix(in srgb, var(--clr-text) 18%, transparent);
      color: #fff;
      z-index: 1300;
    }
    .ai-widget {
      position: fixed;
      right: 22px;
      bottom: 84px;
      width: min(450px, calc(100vw - 20px));
      max-height: 80vh;
      overflow: hidden;
      z-index: 1300;
      padding: 0;
      display: flex;
      flex-direction: column;
      border-radius: 18px;
      border: 1px solid color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary));
      background:
        radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--clr-primary) 11%, transparent), transparent 42%),
        var(--clr-surface);
    }
    .ai-header {
      padding: 12px 14px;
      border-bottom: 1px solid color-mix(in srgb, var(--clr-border) 85%, var(--clr-primary));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: color-mix(in srgb, var(--clr-surface) 88%, var(--clr-bg));
    }
    .ai-heading { min-width: 0; }
    .ai-title { font-size: 14px; font-weight: 800; }
    .ai-subtitle { color: var(--clr-text-muted); font-size: 11px; }
    .ai-header-actions { display: flex; align-items: center; gap: 6px; }
    .ai-chips { padding: 8px 14px 10px; display: flex; flex-wrap: wrap; gap: 7px; border-bottom: 1px solid var(--clr-border-light); background: color-mix(in srgb, var(--clr-surface) 92%, var(--clr-bg)); }
    .ai-chip { border: 1px solid var(--clr-border); background: color-mix(in srgb, var(--clr-surface) 90%, var(--clr-hover)); color: var(--clr-text-secondary); border-radius: 999px; padding: 6px 11px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .ai-chip:hover { border-color: color-mix(in srgb, var(--clr-accent) 38%, var(--clr-border)); color: var(--clr-accent-dark); background: color-mix(in srgb, var(--clr-accent) 8%, var(--clr-surface)); }
    .ai-messages { overflow: auto; max-height: 32vh; padding: 12px 14px; background: color-mix(in srgb, var(--clr-bg) 55%, var(--clr-surface)); }
    .ai-message-row { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; align-items: flex-start; margin-bottom: 10px; }
    .ai-message-row--user { grid-template-columns: minmax(0, 1fr) 28px; }
    .ai-message-row--user .ai-avatar { order: 2; }
    .ai-message-row--user .ai-bubble { order: 1; justify-self: end; }
    .ai-avatar { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--clr-border) 70%, transparent); color: var(--clr-primary); background: color-mix(in srgb, var(--clr-surface) 76%, var(--clr-hover)); }
    .ai-avatar--user { color: #fff; border-color: color-mix(in srgb, var(--clr-primary) 45%, transparent); background: linear-gradient(145deg, var(--clr-primary), var(--clr-accent)); }
    .ai-bubble { max-width: 100%; padding: 8px 11px; border-radius: 13px; border: 1px solid var(--clr-border); background: color-mix(in srgb, var(--clr-surface) 86%, var(--clr-bg)); font-size: 12px; line-height: 1.48; white-space: pre-wrap; word-break: break-word; }
    .ai-bubble--user { border-color: color-mix(in srgb, var(--clr-primary) 24%, var(--clr-border)); background: color-mix(in srgb, var(--clr-primary) 11%, var(--clr-surface)); }
    .ai-cursor {
      display: inline-block;
      width: 6px;
      height: 13px;
      margin-left: 3px;
      vertical-align: -2px;
      border-radius: 2px;
      background: color-mix(in srgb, var(--clr-primary) 65%, var(--clr-accent));
      animation: ai-blink 1s ease-in-out infinite;
    }
    .ai-typing { color: var(--clr-text-muted); font-size: 11px; display: inline-flex; align-items: center; gap: 6px; margin-left: 36px; }
    .ai-footer { padding: 10px 14px 12px; border-top: 1px solid color-mix(in srgb, var(--clr-border) 85%, var(--clr-primary)); background: color-mix(in srgb, var(--clr-surface) 88%, var(--clr-bg)); }
    .ai-input-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
    .ai-input { min-height: 40px; border-color: color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary)); }
    .ai-send-btn { min-width: 40px; }
    .ai-footer-note { margin-top: 6px; font-size: 10px; color: var(--clr-text-muted); }
    @keyframes ai-blink {
      0%, 46% { opacity: 1; }
      50%, 100% { opacity: 0.2; }
    }
    @media (max-width: 768px) { .ai-fab { right: 14px; bottom: 12px; } .ai-widget { right: 10px; bottom: 70px; width: min(96vw, 430px); } }
  `],
})
export class AiAssistantComponent implements OnDestroy {
  open = signal(false);
  prompt = '';
  streaming = signal(false);
  streamingText = signal('');
  conversationId = signal<string | null>(null);
  messages = signal<UiMessage[]>([]);
  private streamSub?: Subscription;

  readonly quickActions = signal<string[]>([
    'Show pending fees for Rohit Sharma',
    'Which students are absent today?',
    'Generate fee collection summary for April',
    'Show transport dues for Class 8',
  ]);

  constructor(
    private ai: AiAgentService,
    private router: Router,
    private auth: AuthService
  ) {}

  toggleWidget(): void { this.open.update(v => !v); }
  goFullPanel(): void { this.router.navigate(['/app/ai-assistant']); }
  ngOnDestroy(): void { this.streamSub?.unsubscribe(); }

  send(quick?: string): void {
    const msg = (quick ?? this.prompt ?? '').trim();
    if (!msg || this.streaming()) return;
    this.messages.update(arr => [...arr, { role: 'user', content: msg, at: new Date().toISOString() }]);
    this.prompt = '';
    this.streaming.set(true);
    this.streamingText.set('');
    let assistantBuffer = '';

    this.streamSub?.unsubscribe();
    this.streamSub = this.ai.streamChat({
      conversationId: this.conversationId(),
      message: msg,
      locale: this.auth.getCurrentUser()?.interfaceLocale ?? 'en',
      moduleKey: 'floating-assistant',
      stream: true,
    }).subscribe({
      next: (evt: AiStreamEvent) => {
        if (evt.conversationId) this.conversationId.set(evt.conversationId);
        if (evt.type === 'TOKEN' && evt.token) {
          assistantBuffer += evt.token;
          this.streamingText.set(assistantBuffer);
        }
        if (evt.type === 'ERROR') {
          this.streaming.set(false);
          this.streamingText.set('');
          this.messages.update(arr => [...arr, { role: 'assistant', content: evt.token || 'AI request could not be completed.', at: new Date().toISOString() }]);
          return;
        }
        if (evt.type === 'DONE') {
          this.messages.update(arr => [...arr, { role: 'assistant', content: assistantBuffer.trim(), at: new Date().toISOString() }]);
          this.streaming.set(false);
          this.streamingText.set('');
        }
      },
      complete: () => {
        if (!this.streaming()) return;
        this.streaming.set(false);
        this.streamingText.set('');
        this.messages.update(arr => [...arr, { role: 'assistant', content: assistantBuffer.trim() || 'No response received. Please try again.', at: new Date().toISOString() }]);
      },
      error: () => {
        this.streaming.set(false);
        this.streamingText.set('');
        this.messages.update(arr => [...arr, { role: 'assistant', content: 'Unable to stream AI response right now.', at: new Date().toISOString() }]);
      },
    });
  }
}
