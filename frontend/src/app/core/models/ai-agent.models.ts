export interface AiChatRequest {
  conversationId?: string | null;
  message: string;
  moduleKey?: string | null;
  locale?: string | null;
  contextHints?: Record<string, unknown> | null;
  stream?: boolean;
}

export interface AiToolExecutionView {
  toolName: string;
  status: string;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
}

export interface AiResponseCard {
  type: string;
  title: string;
  payload: Record<string, unknown>;
}

export interface AiMessageEnvelope {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | string;
  content: string;
  at: string;
  metadata?: Record<string, unknown>;
}

export interface AiChatResponse {
  conversationId: string;
  assistantMessage: AiMessageEnvelope;
  cards: AiResponseCard[];
  toolsUsed: AiToolExecutionView[];
  suggestions: string[];
}

export interface AiConversationSummary {
  conversationId: string;
  title: string;
  moduleKey?: string | null;
  updatedAt: string;
  lastMessagePreview?: string | null;
}

export interface AiConversationHistory {
  conversationId: string;
  title: string;
  messages: AiMessageEnvelope[];
}

export type AiStreamEventType = 'ACK' | 'TOKEN' | 'TOOL_START' | 'TOOL_END' | 'CARD' | 'DONE' | 'ERROR';

export interface AiStreamEvent {
  type: AiStreamEventType;
  conversationId?: string | null;
  messageId?: string | null;
  token?: string | null;
  tool?: AiToolExecutionView | null;
  card?: AiResponseCard | null;
  doneReason?: string | null;
}
