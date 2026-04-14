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
  ChatCounterpartInsight,
  ChatDirectoryClassRoster,
  ChatDirectoryParentChildRoster,
  ChatDirectoryResponse,
  ChatInboxConversation,
  ChatMessage,
  PlatformSchoolAdminChatHit,
} from '../../core/models/models';
import { resolveCounterpartInsight } from '../../core/chat/chat-counterpart.resolve';
import { runtimeConfig } from '../../core/config/runtime-config';
import { formatSchoolClassDisplayName, formatSchoolClassName } from '../../core/i18n/school-class-display';
import { ErpI18nPhDirective } from '../../shared/erp-i18n/erp-i18n-host.directives';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ErpI18nPhDirective],
  styles: [
    `
      /* Shell: card that reads as one continuous chat workspace (theme-aligned). */
      .chat-shell {
        border-radius: var(--radius-lg, 16px);
        overflow: hidden;
        border: 1px solid var(--clr-border);
        box-shadow:
          0 4px 6px -1px color-mix(in srgb, var(--clr-text) 6%, transparent),
          0 16px 40px -12px color-mix(in srgb, var(--clr-primary) 12%, transparent);
      }
      .chat-layout-row {
        min-height: 480px;
        height: min(720px, calc(100vh - 160px));
      }
      @media (max-width: 991.98px) {
        .chat-layout-row {
          height: auto;
          min-height: 380px;
          max-height: none;
        }
      }
      .chat-sidebar {
        display: flex;
        flex-direction: column;
        min-height: 0;
        max-height: 100%;
        overflow: hidden;
        background: var(--clr-surface);
        border-right: 1px solid var(--clr-border);
      }
      .chat-sidebar > div:not(.chat-sidebar-scroll) {
        flex-shrink: 0;
      }
      .chat-sidebar-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-gutter: stable;
      }
      .chat-thread-column {
        display: flex;
        flex-direction: column;
        min-height: 0;
        min-width: 0;
        max-height: 100%;
        overflow: hidden;
        background: var(--clr-surface);
      }
      .chat-sidebar-toolbar {
        padding: 14px 14px 12px;
        border-bottom: 1px solid var(--clr-border-light);
        background: color-mix(in srgb, var(--clr-surface-alt) 65%, var(--clr-surface));
      }
      .chat-search-field {
        position: relative;
        flex: 1;
        min-width: 0;
      }
      .chat-search-field > i {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 15px;
        color: var(--clr-text-muted);
        pointer-events: none;
      }
      .chat-search-field .erp-input {
        padding-left: 40px;
        border-radius: 999px;
        border: 1px solid var(--clr-border);
        background: var(--clr-surface);
        min-height: 42px;
        font-size: 14px;
      }
      .chat-sidebar-toolbar .btn-outline-erp {
        border-radius: 999px;
        font-weight: 700;
        padding-left: 14px;
        padding-right: 14px;
        white-space: nowrap;
      }
      .chat-directory-panel {
        padding: 14px;
        border-top: 1px solid var(--clr-border-light);
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--clr-primary) 5%, var(--clr-surface-alt)) 0%,
          var(--clr-surface-alt) 100%
        );
        border-bottom: 1px solid var(--clr-border-light);
      }
      .chat-thread-header {
        flex-shrink: 0;
        padding: 14px 16px;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--clr-primary) 9%, var(--clr-surface)) 0%,
          var(--clr-surface) 100%
        );
        border-bottom: 1px solid var(--clr-border);
        box-shadow: 0 1px 0 color-mix(in srgb, var(--clr-border) 80%, transparent);
      }
      .chat-thread-title {
        font-weight: 800;
        font-size: 16px;
        letter-spacing: -0.02em;
        color: var(--clr-text);
      }
      .chat-thread-placeholder-title {
        font-weight: 800;
        font-size: 15px;
        color: var(--clr-text-muted);
      }
      /* Message list: soft “chat canvas” (WhatsApp-like depth, theme tokens only). */
      .chat-messages {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 16px 18px 20px;
        background-color: var(--clr-surface-muted);
        background-image: radial-gradient(
            circle at 12% 18%,
            color-mix(in srgb, var(--clr-primary) 7%, transparent) 0%,
            transparent 42%
          ),
          radial-gradient(
            circle at 88% 72%,
            color-mix(in srgb, var(--clr-accent) 6%, transparent) 0%,
            transparent 48%
          ),
          repeating-linear-gradient(
            -12deg,
            transparent,
            transparent 11px,
            color-mix(in srgb, var(--clr-primary) 3.5%, transparent) 11px,
            color-mix(in srgb, var(--clr-primary) 3.5%, transparent) 12px
          );
      }
      .chat-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 999px;
        border: 1px solid var(--clr-border);
        background: color-mix(in srgb, var(--clr-surface) 92%, transparent);
      }
      .chat-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .chat-status--live .chat-status-dot {
        background: var(--clr-success);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-success) 35%, transparent);
      }
      .chat-status--demo .chat-status-dot {
        background: var(--clr-warning);
      }
      .chat-status--off .chat-status-dot {
        background: var(--clr-text-muted);
      }
      .chat-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 14px;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--clr-surface) 88%, transparent);
      }
      .chat-row {
        padding: 12px 14px;
        border-bottom: 1px solid var(--clr-border-light);
        cursor: pointer;
        transition: background 0.15s ease, box-shadow 0.15s ease;
      }
      .chat-row:hover {
        background: color-mix(in srgb, var(--clr-primary) 6%, var(--clr-surface));
      }
      .chat-row.active {
        background: color-mix(in srgb, var(--clr-primary) 11%, var(--clr-surface));
        box-shadow: inset 3px 0 0 var(--clr-accent);
      }
      .chat-inbox-name {
        font-weight: 800;
        font-size: 14px;
        letter-spacing: -0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .chat-inbox-preview {
        font-size: 13px;
        line-height: 1.35;
        color: var(--clr-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .chat-inbox-time {
        font-size: 11px;
        font-weight: 600;
        color: var(--clr-text-muted);
      }
      .chat-unread-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        padding: 0 7px;
        margin-top: 8px;
        font-size: 11px;
        font-weight: 800;
        border-radius: 999px;
        background: var(--clr-accent);
        color: #fff;
        line-height: 1;
        box-shadow: 0 2px 8px color-mix(in srgb, var(--clr-accent) 45%, transparent);
      }
      .bubble {
        max-width: min(78%, 520px);
        padding: 8px 12px 6px 14px;
        border-radius: 12px 12px 12px 4px;
        border: 1px solid color-mix(in srgb, var(--clr-border) 70%, transparent);
        background: var(--clr-surface);
        box-shadow: 0 1px 2px color-mix(in srgb, var(--clr-text) 6%, transparent);
      }
      .bubble--mine {
        border-radius: 12px 12px 4px 12px;
        background: linear-gradient(
          145deg,
          color-mix(in srgb, var(--clr-primary) 22%, var(--clr-surface)) 0%,
          color-mix(in srgb, var(--clr-primary) 12%, var(--clr-surface)) 100%
        );
        border-color: color-mix(in srgb, var(--clr-primary) 28%, var(--clr-border));
        color: var(--clr-text);
      }
      .bubble-sender {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--clr-primary);
        margin-bottom: 4px;
        opacity: 0.92;
      }
      .bubble-body {
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.5;
        color: var(--clr-text);
      }
      .bubble-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 4px;
        padding-top: 2px;
      }
      .bubble-time {
        font-size: 11px;
        font-weight: 600;
        color: var(--clr-text-muted);
        opacity: 0.9;
      }
      .bubble--mine .bubble-time {
        color: color-mix(in srgb, var(--clr-text) 72%, var(--clr-primary));
      }
      .chat-msg-row {
        margin-bottom: 10px;
      }
      .chat-compose {
        flex-shrink: 0;
        padding: 12px 14px 14px;
        background: color-mix(in srgb, var(--clr-surface-alt) 40%, var(--clr-surface));
        border-top: 1px solid var(--clr-border);
      }
      .chat-compose-bar {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .chat-compose-bar .chat-compose-input {
        flex: 1;
        min-width: 0;
        min-height: 46px;
        border-radius: 999px;
        padding-left: 18px;
        padding-right: 18px;
        font-size: 14px;
        border: 1px solid var(--clr-border);
        background: var(--clr-surface);
        box-shadow: inset 0 1px 2px color-mix(in srgb, var(--clr-text) 4%, transparent);
      }
      .chat-compose-bar .chat-compose-input:focus {
        outline: none;
        border-color: color-mix(in srgb, var(--clr-primary) 45%, var(--clr-border));
        box-shadow:
          inset 0 1px 2px color-mix(in srgb, var(--clr-text) 4%, transparent),
          0 0 0 3px color-mix(in srgb, var(--clr-primary) 18%, transparent);
      }
      .chat-compose-bar .chat-compose-input:disabled {
        opacity: 0.65;
      }
      .chat-send-fab {
        width: 46px;
        height: 46px;
        padding: 0;
        border-radius: 50%;
        border: none;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, var(--clr-primary) 0%, var(--clr-primary-light) 100%);
        color: #fff;
        font-size: 18px;
        box-shadow: 0 4px 14px color-mix(in srgb, var(--clr-primary) 42%, transparent);
        transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
      }
      .chat-send-fab:hover:not(:disabled) {
        transform: scale(1.04);
        box-shadow: 0 6px 18px color-mix(in srgb, var(--clr-primary) 48%, transparent);
      }
      .chat-send-fab:disabled {
        opacity: 0.45;
        transform: none;
        box-shadow: none;
      }
      .chat-send-fab .spinner-border {
        width: 1.15rem;
        height: 1.15rem;
        border-width: 0.14em;
        border-color: rgba(255, 255, 255, 0.35);
        border-right-color: #fff;
      }
      .chat-policy-note {
        font-size: 11px;
        margin-top: 10px;
        text-align: center;
        color: var(--clr-text-muted);
        line-height: 1.45;
      }
      .chat-empty-inbox,
      .chat-empty-thread {
        padding: 36px 20px;
        text-align: center;
      }
      .chat-empty-inbox i,
      .chat-empty-thread i {
        font-size: 52px;
        color: color-mix(in srgb, var(--clr-primary) 28%, var(--clr-border));
        margin-bottom: 14px;
        display: block;
        opacity: 0.85;
      }
      .chat-empty-inbox h3,
      .chat-empty-thread h3 {
        font-size: 17px;
        font-weight: 800;
        margin-bottom: 8px;
        color: var(--clr-text);
      }
      .chat-empty-inbox p,
      .chat-empty-thread p {
        color: var(--clr-text-muted);
        font-size: 14px;
        max-width: 320px;
        margin: 0 auto;
        line-height: 1.5;
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
            <div class="chat-sidebar-toolbar">
              <div class="d-flex gap-2 align-items-center">
                <div class="chat-search-field">
                  <i class="bi bi-search" aria-hidden="true"></i>
                  <input class="erp-input w-100" erpI18nPh="chat.searchPlaceholder" [(ngModel)]="query" />
                </div>
                <button class="btn-outline-erp btn-sm flex-shrink-0" type="button" (click)="openDirectory = !openDirectory">
                  {{ openDirectory ? ('chat.close' | translate) : ('chat.newChat' | translate) }}
                </button>
              </div>
            </div>

            <div *ngIf="openDirectory" class="chat-directory-panel">
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
                  erpI18nPh="chat.plaSearchPh"
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
                  erpI18nPh="chat.dirSearchPh"
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
                    <div class="min-w-0">
                      <div class="chat-inbox-name">{{ conversationTitle(conv) }}</div>
                      <div
                        *ngIf="conversationIdentityHint(conv) as hint"
                        class="text-muted"
                        style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                        [attr.title]="hint"
                      >
                        {{ hint }}
                      </div>
                      <div class="chat-inbox-preview">{{ conv.lastMessagePreview || ('chat.noMessagesPreview' | translate) }}</div>
                    </div>
                    <div class="text-end flex-shrink-0">
                      <div class="chat-inbox-time">{{ asTime(conv.lastMessageAt) }}</div>
                      <span *ngIf="conv.unreadCount > 0" class="chat-unread-pill">{{ conv.unreadCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="!inbox.length" class="chat-empty-inbox">
                <i class="bi bi-inbox" aria-hidden="true"></i>
                <h3>{{ 'chat.emptyInboxTitle' | translate }}</h3>
                <p>{{ 'chat.emptyInboxHint' | translate }}</p>
              </div>
            </div>
          </div>

          <div class="col-lg-8 chat-thread-column">
            <div class="chat-thread-header">
              <div *ngIf="selectedConversation; else noSelection" class="d-flex align-items-start justify-content-between gap-3">
                <div class="d-flex align-items-start gap-3 min-w-0">
                  <div class="chat-avatar d-none d-sm-flex" [style.background]="avatarColor(conversationTitle(selectedConversation))">
                    {{ initials(conversationTitle(selectedConversation)) }}
                  </div>
                  <div class="min-w-0">
                    <div class="chat-thread-title">{{ conversationTitle(selectedConversation) }}</div>
                    <div class="text-muted chat-thread-meta" style="font-size: 12px; line-height: 1.45;">
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
                <div class="chat-thread-placeholder-title">{{ 'chat.selectConversation' | translate }}</div>
                <div class="text-muted" style="font-size: 12px;">{{ 'chat.selectConversationHint' | translate }}</div>
              </ng-template>
            </div>

            <div #threadScroll class="chat-messages">
              <div *ngIf="selectedConversation && loadingMessages" class="chat-empty-thread">
                <h3>{{ 'chat.loading' | translate }}</h3>
              </div>

              <div *ngIf="selectedConversation && !loadingMessages && !messages.length" class="chat-empty-thread">
                <i class="bi bi-chat-dots" aria-hidden="true"></i>
                <h3>{{ 'chat.emptyThreadTitle' | translate }}</h3>
                <p>{{ 'chat.emptyThreadHint' | translate }}</p>
              </div>

              <div *ngFor="let m of messages" class="chat-msg-row">
                <div class="d-flex" [style.justifyContent]="isMine(m) ? 'flex-end' : 'flex-start'">
                  <div class="bubble" [class.bubble--mine]="isMine(m)">
                    <div *ngIf="!isMine(m)" class="bubble-sender">{{ m.senderName || m.senderRole }}</div>
                    <div class="bubble-body">{{ m.body }}</div>
                    <div class="bubble-footer">
                      <span class="bubble-time">{{ asTime(m.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="chat-compose">
              <div class="chat-compose-bar">
                <input
                  class="erp-input chat-compose-input"
                  [disabled]="!selectedConversation || sending"
                  erpI18nPh="chat.composePlaceholder"
                  [(ngModel)]="draft"
                  (keydown.enter)="onEnter($event)"
                />
                <button
                  class="chat-send-fab"
                  type="button"
                  [disabled]="!selectedConversation || sending || !draft.trim()"
                  (click)="send()"
                  [attr.aria-label]="sending ? ('chat.sending' | translate) : ('chat.send' | translate)"
                >
                  <span *ngIf="sending" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <i *ngIf="!sending" class="bi bi-send-fill" aria-hidden="true"></i>
                </button>
              </div>
              <div class="chat-policy-note">{{ 'chat.policyFootnote' | translate }}</div>
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
    return this.inbox.filter(c => {
      const title = this.conversationTitle(c).toLowerCase();
      const hint = (this.conversationIdentityHint(c) || '').toLowerCase();
      const preview = (c.lastMessagePreview || '').toLowerCase();
      return title.includes(q) || hint.includes(q) || preview.includes(q);
    });
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
    const type = this.convTypeLabel(conv.type);
    const sep = this.translate.instant('chat.threadSep');
    const insight = resolveCounterpartInsight(conv, { myUserId: this.myUserId, directory: this.directory });
    const identity = this.formatCounterpartIdentity(insight);
    if (identity) {
      return type + sep + identity;
    }
    return type + sep + this.describeContext(conv);
  }

  /** Sidebar / screen reader: one-line identity under the name (truncation handled by CSS). */
  conversationIdentityHint(conv: ChatInboxConversation): string {
    const insight = resolveCounterpartInsight(conv, { myUserId: this.myUserId, directory: this.directory });
    return this.formatCounterpartIdentity(insight);
  }

  private formatCounterpartIdentity(insight: ChatCounterpartInsight | null): string {
    if (!insight?.roleCode) {
      return '';
    }
    const roleLabel = this.counterpartRoleLabel(insight.roleCode);
    const maxKids = 2;
    const kids = insight.linkedStudents || [];
    const total = insight.linkedStudentTotal ?? kids.length;

    if (insight.roleCode === 'PARENT' && kids.length > 0) {
      const shown = kids.slice(0, maxKids);
      const pairSep = this.translate.instant('chat.threadListSep');
      const parts = shown.map(s =>
        s.classShort
          ? this.translate.instant('chat.threadChildWithClass', { name: s.studentName, cls: s.classShort })
          : s.studentName
      );
      let line = `${roleLabel}${this.translate.instant('chat.threadSep')}${parts.join(pairSep)}`;
      const more = total > shown.length ? total - shown.length : 0;
      if (more > 0) {
        line += `${this.translate.instant('chat.threadSep')}${this.translate.instant('chat.threadMoreChildren', { n: more })}`;
      }
      return line;
    }

    return roleLabel;
  }

  private counterpartRoleLabel(code: string): string {
    const c = (code || '').toUpperCase();
    const map: Record<string, string> = {
      PARENT: 'chat.counterpartRoleParent',
      TEACHER: 'chat.counterpartRoleTeacher',
      ADMIN: 'chat.counterpartRoleAdmin',
      SUPER_ADMIN: 'chat.counterpartRoleSuperAdmin',
      LIBRARY_STAFF: 'chat.counterpartRoleLibraryStaff',
      STUDENT: 'chat.counterpartRoleStudent',
    };
    const key = map[c] ?? 'chat.counterpartRoleGeneric';
    return this.translate.instant(key, { role: c.replace(/_/g, ' ') });
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

