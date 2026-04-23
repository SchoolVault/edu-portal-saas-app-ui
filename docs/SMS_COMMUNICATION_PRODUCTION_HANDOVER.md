# SMS and Communication Production Handover

This page is a human-readable handover for Sales and Engineering teams before go-live.

It explains:
- what to configure for real SMS in production,
- what changed in Announcement/Event flows,
- how role-based dashboard (admin/parent/teacher) gets Upcoming Events and Recent Activity,
- and what to verify so we do not miss anything.

---

## 1) What "real SMS mode" means

You are in production-ready real SMS mode when:
1. Mock provider is not used for live notifications.
2. At least one real SMS provider is configured with valid credentials.
3. Webhook/callback security is configured (signature/secret).
4. Async pipeline (outbox/queue worker) is enabled.
5. Retry + reconciliation + retention jobs are enabled.

Result: parents, teachers, and staff receive real SMS for announcements/events/reminders without blocking UI actions.

---

## 2) Required production configuration (env/configmap)

Set all sensitive values in secret manager (never in git).

### 2.1 Core delivery mode

- `APP_NOTIFICATION_DELIVERY_ENABLED=true`
- `APP_NOTIFICATION_DELIVERY_PROVIDER=<real_provider>` (example: `msg91`, `twilio`, `aws_sns`)
- `APP_NOTIFICATION_DELIVERY_WEBHOOK_SECRET=<strong_secret>`

### 2.2 Quiet hours and compliance guardrails

- `APP_NOTIFICATION_DELIVERY_QUIET_HOURS_START=22:00`
- `APP_NOTIFICATION_DELIVERY_QUIET_HOURS_END=07:00`
- `APP_NOTIFICATION_DELIVERY_QUIET_HOURS_TIMEZONE=Asia/Kolkata`
- `APP_NOTIFICATION_DELIVERY_ENFORCE_DLT_TEMPLATE_FOR_SMS=true`

### 2.3 Event lifecycle scheduler (publish + reminders)

- `APP_COMM_EVENTS_SCHEDULER_ENABLED=true`
- `APP_COMM_EVENTS_SCHEDULER_POLL_MS=60000`
- `APP_COMM_EVENTS_SCHEDULER_TENANT_LIMIT=100`
- `APP_COMM_EVENTS_SCHEDULER_BATCH_SIZE=100`

### 2.4 Retention cleanup (DB load control)

- `APP_COMM_RETENTION_ENABLED=true`
- `APP_COMM_RETENTION_DRY_RUN=false` (set true first for rehearsal)
- `APP_COMM_RETENTION_MONTHS=6` (change as needed)
- `APP_COMM_RETENTION_CRON=0 20 3 * * SUN`
- `APP_COMM_RETENTION_ALLOW_ALL_TENANTS=false`
- `APP_COMM_RETENTION_TENANT_IDS=<comma_separated_tenants>`

This retention covers:
- announcements,
- in-app notifications,
- stale communication events.

### 2.5 Reliability baseline

- Redis healthy for idempotency/locking.
- RabbitMQ healthy for async dispatch.
- DB migrations up-to-date before service start.

---

## 3) Provider onboarding checklist (real SMS)

For any provider (MSG91/Twilio/AWS SNS/others), complete:
1. Configure API credentials (key/token/sender id/route).
2. Configure callback/webhook URL on provider dashboard.
3. Configure callback secret/signature validation in app.
4. Run one controlled live campaign to test:
   - accepted by provider,
   - delivered/failed status reconciliation,
   - webhook signature verification,
   - retry/DLQ behavior.

Important:
- Keep fallback provider configured for failover.
- Do not run production with mock provider as primary.

---

## 4) Announcement and Event section changes (what users can do now)

### 4.1 In create flow (admin)

Admin can choose:
- **Notice** (normal announcement), or
- **Scheduled Event** (first-class event record).

For Scheduled Event, admin can set:
- event type (PTM, Sports, Festival, Staff Meeting, Exam, Fees, Other),
- audience scope (All, Parents, Teachers, Class, Section),
- event date/time (+ optional end time),
- location,
- publish now or schedule publish for later,
- locale-aware reminder behavior.

### 4.2 Event lifecycle behavior

- `DRAFT` / `SCHEDULED` / `PUBLISHED` / `CANCELLED` / `COMPLETED` states.
- Scheduler auto-publishes due events.
- Optional reminders are dispatched asynchronously (T-1 day, T-1 hour).
- Campaign IDs are linked to events for delivery drill-down and auditability.

---

## 5) Dashboard behavior (role-based scope)

## 5.1 Admin dashboard

Now uses server-side paginated/filterable endpoints:
- `GET /api/v1/reports/dashboard/admin/recent-activities`
- `GET /api/v1/reports/dashboard/admin/upcoming-events`

Supported filters:
- `page`, `size`,
- `q` (search),
- `eventType`,
- `fromDate`, `toDate`.

Logic:
- **Upcoming Events**: scheduled/published events in future scope.
- **Recent Activity**: published/completed/cancelled events + announcement activity.

### 5.2 Parent dashboard

Parent sees only relevant upcoming events by child scope:
- all/parents/class/section matching child class-section.

### 5.3 Teacher dashboard

Teacher feed and activities remain role-scoped and tenant-safe.

---

## 6) Go-live checklist (must pass)

1. Apply latest DB migrations.
2. Add all real SMS credentials in secret manager.
3. Enable async dispatch and scheduler flags.
4. Configure provider webhook + secret verification.
5. Set retention months and tenant target strategy.
6. Keep `dry-run=true` for one rehearsal cycle, then turn off.
7. Execute production smoke tests:
   - one parent-targeted event,
   - one teacher-targeted event,
   - one class/section-targeted event,
   - one scheduled publish + reminder.
8. Validate dashboard:
   - admin filters/pagination,
   - parent role-scoped upcoming events,
   - drill-down to campaign delivery analytics.
9. Confirm monitoring:
   - queue lag,
   - failed/retry/DLQ rates,
   - webhook reject rates,
   - scheduler execution metrics.

---

## 7) What Sales team should communicate

- System supports targeted communication by role and academic scope.
- Events can be planned in advance and auto-reminded.
- Delivery is async and resilient (suitable for high-volume school operations).
- Dashboard provides operational visibility (recent/upcoming + delivery drill-down).

---

## 8) Future extension roadmap (already architecture-ready)

1. Multi-provider smart routing by cost/latency/health.
2. Tenant-level template management UI (per locale + approval workflow).
3. Real-time provider callback schema hardening (account-specific mappings).
4. Advanced observability (SLA/cost panels per tenant).
5. Policy engine for strict quiet-hours and regulatory schedules by region.

---

## 9) Ownership and handoff model

- **Product/Sales**: audience communication policy, reminder policy, escalation policy.
- **Engineering**: provider integration, webhook security, scheduler/retry tuning, monitoring.
- **DevOps/SRE**: secret/configmap management, queue/redis/mysql health, alerting, backup/retention governance.

This split ensures safe, scalable, and repeatable production operations.

