import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  AiChatRequest,
  AiChatResponse,
  AiConversationHistory,
  AiConversationSummary,
  AiResponseCard,
  AiStreamEvent,
  AiToolExecutionView,
} from '../models/ai-agent.models';

@Injectable({ providedIn: 'root' })
export class AiAgentService {
  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  chat(request: AiChatRequest): Observable<AiChatResponse> {
    return this.api.post<AiChatResponse>('/ai/agent/chat', request);
  }

  listConversations(): Observable<AiConversationSummary[]> {
    return this.api.get<AiConversationSummary[]>('/ai/agent/conversations');
  }

  getConversationHistory(conversationId: string): Observable<AiConversationHistory> {
    return this.api.get<AiConversationHistory>(`/ai/agent/conversations/${encodeURIComponent(conversationId)}`);
  }

  renameConversation(conversationId: string, title: string): Observable<{ updated: boolean }> {
    return this.api.patch<{ updated: boolean }>(`/ai/agent/conversations/${encodeURIComponent(conversationId)}`, { title });
  }

  deleteConversation(conversationId: string): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>(`/ai/agent/conversations/${encodeURIComponent(conversationId)}`);
  }

  streamChat(request: AiChatRequest): Observable<AiStreamEvent> {
    const stream$ = new Subject<AiStreamEvent>();
    const token = this.auth.getToken();
    fetch(`${this.api.getBaseUrl()}/ai/agent/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...request, stream: true }),
    })
      .then(async response => {
        if (!response.ok || !response.body) {
          throw new Error(`AI stream failed: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          buffer += decoder.decode(next.value, { stream: true });
          let splitIdx = buffer.indexOf('\n\n');
          while (splitIdx >= 0) {
            const chunk = buffer.slice(0, splitIdx);
            buffer = buffer.slice(splitIdx + 2);
            this.parseSseChunk(chunk, stream$);
            splitIdx = buffer.indexOf('\n\n');
          }
        }
        stream$.complete();
      })
      .catch(err => stream$.error(err));

    return stream$.asObservable();
  }

  private parseSseChunk(chunk: string, sink: Subject<AiStreamEvent>): void {
    const lines = chunk.split('\n');
    let eventName = 'TOKEN';
    let dataRaw = '';
    for (const line of lines) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      if (line.startsWith('data:')) dataRaw += line.slice(5).trim();
    }
    if (!dataRaw) return;
    try {
      const parsed = JSON.parse(dataRaw) as {
        type: string;
        conversationId?: string;
        messageId?: string;
        token?: string;
        tool?: AiToolExecutionView;
        card?: AiResponseCard;
        doneReason?: string;
      };
      sink.next({
        type: (parsed.type || eventName) as AiStreamEvent['type'],
        conversationId: parsed.conversationId,
        messageId: parsed.messageId,
        token: parsed.token,
        tool: parsed.tool,
        card: parsed.card,
        doneReason: parsed.doneReason,
      });
    } catch {
      sink.next({ type: 'ERROR', token: 'Malformed AI stream payload' });
    }
  }
}
