# Phase 2 — Ports for cross-cutting concerns

## Technical

| Port | Purpose | Default implementation |
|------|---------|-------------------------|
| `NotificationDispatchPort` | Queue SMS / WhatsApp / in-app via **outbox** | `NotificationOutboxService` |
| `AuditTrailPort` | Append-only audit trail + optional Rabbit fanout | `AuditService` |
| `FileStoragePort` | Build **object keys** and **public/base URLs** for S3-compatible storage | `ConfigurableFileStoragePort` |
| `AnalyticsEventPort` | Product analytics sink (warehouse, Segment, etc.) | Bridges to `AnalyticsEventPublisher` |

Fees, payroll, reminders, imports, and announcements depend on **`NotificationDispatchPort`**, not the concrete outbox class, so we can add Kafka/Redis Streams without touching fee rules.

## Plain language

Notifications, audit, file locations, and analytics are **plug-in points**. Today they use our database and config; tomorrow we can plug **S3**, **Kafka**, or a **data warehouse** without rewriting core ERP modules.
