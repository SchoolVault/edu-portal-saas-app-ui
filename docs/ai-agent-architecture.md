# AI Agent System Architecture (Phase Foundation)

## What this implementation delivers
- Tenant-safe AI orchestration module under `backend-spring/src/main/java/com/school/erp/modules/ai`.
- Tool-calling framework where AI only invokes secure backend tools (never direct DB SQL from AI logic).
- Streaming-first APIs (`/api/v1/ai/agent/chat/stream`) with event envelopes for frontend token rendering.
- Conversation and audit schema (`V46__ai_agent_foundation.sql`) for persistence, observability, and compliance.
- Angular floating assistant + full AI workspace with quick actions, streaming output, and response cards.
- Future-ready extension seams for LLM providers, MCP/agent workflows, RAG connectors, and voice channels.

## Backend module map
- `controller/AiAgentController`: sync + streaming endpoints.
- `service/AiAgentOrchestratorService`: context assembly, tool planning/execution, response assembly, streaming events.
- `service/AiSecurityGuard`: tenant guard, authority checks, prompt sanitization.
- `service/AiToolRegistryService`: dynamic discovery of `AiTool` implementations.
- `service/DefaultAiTools`: initial ERP tools (`GetStudentFeeTool`, `GetAttendanceTool`, `GetTransportDueTool`, etc.).
- `service/AiLlmProvider` + `MockRuleBasedLlmProvider`: provider abstraction + mock implementation.
- `domain/*` + `repository/*`: conversation/message/tool-log persistence.

## Frontend module map
- `core/models/ai-agent.models.ts`: contract-aligned request/response/stream event models.
- `core/services/ai-agent.service.ts`: sync + SSE streaming client using bearer auth.
- `features/ai/ai-assistant.component.ts`: floating widget, palette trigger, quick actions, streaming chat.
- `features/ai/ai-workspace.component.ts`: full AI command center route (`/app/ai-assistant`).
- `layout/layout.component.ts`: assistant injected across authenticated shell.

## Security design
- AI runtime always reads tenant from `TenantContext` and refuses execution without tenant.
- Tool execution is permission-gated per tool using Spring Security authorities.
- Prompt sanitization layer blocks common injection phrases and script payloads.
- Tool call telemetry is stored in `ai_tool_logs` for traceability and abuse analysis.
- Database schema includes tenant keys and time-based indexes for partition-friendly lifecycle retention.

## Streaming protocol
- Event names: `ACK`, `TOKEN`, `TOOL_START`, `TOOL_END`, `CARD`, `DONE`, `ERROR`.
- Frontend reads SSE chunks and incrementally paints assistant tokens.
- Tool progress and analytics cards are emitted in-band during the same stream.
- API contract is stable for WebSocket migration (event envelope remains reusable).

## Database schema overview
- `ai_conversations`: top-level sessions.
- `ai_messages`: user + assistant turns with token estimates.
- `ai_tool_logs`: each tool call request/response and latency.
- `ai_audit_logs`: security/compliance actions.
- `ai_context_sessions`: short-term memory summaries + token budgets.
- `ai_usage_metrics`: daily model usage.
- `ai_prompt_templates`: tenant/localized prompt template catalog.

## Future extensibility points
- Replace `MockRuleBasedLlmProvider` with `OpenAiProvider`, `ClaudeProvider`, `GeminiProvider`, `OllamaProvider`.
- Add `AiMemoryPort` and `AiRetrieverPort` for embeddings/RAG without changing controller contracts.
- Move orchestrator into dedicated microservice later; frontend contract remains unchanged.
- Add workflow agents (fees reminder, attendance escalation) via event bus consumers around tool registry.
- Introduce policy engine/rate limiting interceptors at controller and per-tool level.

## Step-by-step rollout guide
1. Deploy migration `V46` and verify tables.
2. Enable endpoints for selected pilot roles (`TENANT_ADMIN`, finance, principal).
3. Start with mock provider + tools in shadow mode (no side effects).
4. Add live OpenAI provider behind feature flag and compare answer quality.
5. Enable metrics dashboards: request count, latency, token usage, tool failure rates.
6. Add safe write-actions with explicit human confirmation UX.
7. Add RAG adapters (circulars, policy docs, handbooks) using `AiLlmProvider` + retriever decorators.

## Production hardening backlog
- Add per-tenant and per-user rate limits.
- Add PII redaction strategy for tool logs and prompts.
- Add conversation retention policy + archival jobs.
- Add contract tests for tool schema compatibility.
- Add chaos tests for provider timeout and streaming disconnect recovery.
- Runtime tune AI worker pool via `app.ai.executor.*` (`APP_AI_EXEC_*`) per environment.
