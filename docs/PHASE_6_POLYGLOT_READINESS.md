# Phase 6 — Polyglot readiness (chat + notification queue)

**Operational guide (env vars, Atlas, switch steps):** [POLYGLOT_PERSISTENCE_SWITCHING.md](./POLYGLOT_PERSISTENCE_SWITCHING.md)

## Technical

- **`ChatMessageStorePort`:** Abstraction over chat message persistence. Default: **`JpaChatMessageStoreAdapter`** (MySQL). Alternate: **`MongoChatMessageStoreAdapter`** when `app.chat.message-store=mongo` and `spring.data.mongodb.uri` is set — messages in MongoDB; `ChatService` unchanged beyond the port.
- **Notifications:** `NotificationDispatchPort` is the single entry; today it writes the **SQL outbox**. A future **Kafka / Redis Streams** adapter implements the same port.

## Plain language

Chat messages can move to a **document database** when volume requires it. Outbound notifications stay behind one **“send this message”** contract so we can change the **pipe** (database queue vs Kafka) without rewriting business rules.
