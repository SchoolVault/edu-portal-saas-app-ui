# Payroll: offline salary (default) and digital payouts (Razorpay X later)

This note is for **sales, school leadership, and product**. It uses plain language. Technical names (Razorpay X, tenant, webhook) appear only where they help a customer understand **what the school does** and **what we need from them** to turn on **digital** salary transfer through our app.

---

## 1. How it works in your head: two ways to “pay” salary

| Idea | What the school does in the real world | What our product must guarantee |
|------|----------------------------------------|----------------------------------|
| **Money path** | Pay teachers by **bank, cash, cheque, or another process outside the app** — *or* later, send salary **through a regulated payout service** (e.g. **Razorpay X**) from our screens. | The **ledger of “who is owed, what is paid, payslip, receipt”** stays **correct and consistent** in our system, no matter which money path the school uses *today*. |
| **Source of truth** | Finance/Admin is responsible to **record truthfully** when salary has **actually** reached the teacher (or is settled per school policy). | The app is the **single place** for **payslip, status, audit trail, and staff notifications** — if data is updated properly, the portal stays in sync. |

> **Key message for tier-2 / tier-3 schools:** they do *not* have to give payment-gateway or bank-API details on day one. They can run salary **100% outside** the product and only **confirm** in the app. When they **trust the platform and are ready**, the same product can add **Razorpay X** (or a similar **payout** provider) with **extra configuration and approvals**, not a new product rewrite.

This mirrors the **fees** direction already in the codebase: **parent online checkout** is a **per-school capability** gated by **finance / settlement** settings; **default is offline/counter-friendly** and the **fee ledger** remains authoritative when staff record payments.

---

## 2. What already exists today (payroll, at a glance)

* **Payslips** can be **generated**; teachers get **PDF** when the payslip is in the **“Paid”** state (so the document matches “money settled / confirmed” policy).
* **“Mark paid”** exists for staff: after a real bank transfer (or any external settlement the school does), the school can **mark the payslip paid** in the app. That can trigger **in-app notification** and **enqueued** SMS / Whatsapp-style delivery hooks (channel readiness depends on platform configuration).
* **“Initiate disbursement”** in code is wired to a **payout gateway** abstraction (implementation can be **Razorpay X** or a **non-production mock** in environments without credentials). That is the **digital pipeline** path — **not** the same as “we paid offline and we confirm in the app”.

*Gap we are closing with this roadmap:* a **product-level, per-tenant** switch — **“digital payroll payout enabled”** — defaulting to **off**, so that **Razorpay X** is **opt-in** and the **default** story is: **disburse outside → confirm in app → payslip + notifications** (analogous to **offline fee collection** + **ledger updates** for parents’ fees).

---

## 3. What “go live on Razorpay X” means for a non-technical person

* **Razorpay X** (often called “Razorpay X for payouts”) is a **service that moves money from the school’s business account to staff bank accounts** with compliance checks. It is **not** the same as taking **parent fee payments** (that is a different “payment in” product).
* For **go-live** the school (and sometimes the **platform** operations team) typically need: a **business account** relationship, **KYC** for the school, **payout** permissions, **webhook** endpoints for status updates, and **secrets** kept only on the server. Some schools in smaller cities are **not comfortable** sharing this **until** they trust the product and the vendor — that is **normal**.
* Our product goal: **one school can stay fully offline** while **another** school on the same **multi-school platform** can use **Razorpay X** — without mixing data or breaking the **tenant isolation** the product already enforces in architecture.

---

## 4. Three-phase plan (build order)

Design goals across all phases: **tenant-safe**, **backward compatible**, **modular** (switch strategies per tenant and per environment), **auditable**, and **extensible** (add another payout bank or provider later with a small, isolated integration, not a domain rewrite).

### Phase 1 — Offline-first, safe default (minimal surprise)

**Goal:** For **every** school, **by default**: finance runs salary **however they already do**; they use the app to **generate payslips**, **mark periods paid** when reality matches, and **teachers** see **notifications** and can **download** the official PDF. **Razorpay X initiation** is **not** exposed (or is clearly blocked) until the school **explicitly** enables it and passes configuration checks.

**Scope (illustrative):**

* Add a **per-tenant** flag (e.g. **digital payroll / Razorpay X payout enabled**), default **false**, stored alongside existing **finance** profile data (same conceptual place as **parent online fee** toggles).
* **API + UI** gate: `initiate` digital disbursement is allowed **only** when the flag and environment/provider rules are satisfied; otherwise a **clear, non-technical error** explains “your school has not enabled online salary payout; use external payment, then mark paid in Payroll.”
* Harden the **“mark paid”** path: optional **reference** field (e.g. bank UTR / ref / remarks) and **audit** entry so **offline** settlements are as traceable as **gateway** references.
* **Teacher experience:** no change to core story — when status is **Paid**, they get **payslip PDF** + **notifications** (as today); copy can say **“credited as per school records”** to avoid legal confusion if SMS templates vary by school policy.
* **Seeding / demos:** default new tenants to **offline payroll** so **sales** demos and **tier-2/3** schools see the right story from day one.

**Outcome:** **Zero** requirement to share **Razorpay X** or bank API details to start; **no** hidden calls to a payout API for schools that did not turn it on. Existing behaviour for environments that use **mock** or **Razorpay** today remains reachable **only** under explicit **tenant + env** control.

### Phase 2 — Operational scale and school-friendly workflows

**Goal:** Finance teams in busy schools can **work fast** in **offline** mode, with **strong consistency** and **observability**.

**Scope (illustrative):**

* **Bulk** actions: mark **many** teachers paid for a period (with idempotency and per-row failure reporting), where **permitted by RBAC**.
* **Payslip / PDF** enhancements for **offline** refs (UTR, method “Cash/Bank/Other”, notes) so printouts match what accountants expect.
* **Reconciliation** views: “Generated vs paid vs in-progress digital attempt” in one place; export for audits.
* **Notification** templates: school-level optional **wording** for SMS/ WhatsApp; respect **DND** and idempotency keys to avoid **duplicate** salary SMS on retries.
* **Teacher portal** polish: history, filters, download archive — still **gated** so **payslip PDF** reflects **final** state only.

**Outcome:** Offline-first schools get **grade-A** day-to-day UX; no dependency on a gateway. Digital schools benefit from the **same** ledger and the **same** payslip story.

### Phase 3 — Razorpay X (or another payout provider) “onboarding path” and production hardening

**Goal:** When a school is **ready**, they can **turn on** **digital** payroll **with platform guidance**, **minimal** configuration drift, and **proven** reconciliation.

**Scope (illustrative):**

* **Provider onboarding** checklist (customer-facing) matching internal tasks: KYC, account IDs, **webhook** URL, **signing secret**, test vs live keys, and **LIVE** gate similar in spirit to **Route** live checks used for **parent** online fees where applicable.
* **Webhook** processing: link provider events to **disbursement attempts** and **payslip** state; **retry** and **dead-letter** style handling for supportability.
* **Razorpay**-specific: contact/fund-account caching (already in domain direction) evaluated for **rate limits** and **idempotency**; optional **payout** approval workflows for very large orgs.
* **Multi-tenant** operations: **per-tenant** feature flags, **per-environment** key management, and **rollout** playbook for **support and sales** (“pilot 1 school → region → all”).

**Outcome:** Schools that **outgrow** **manual** **bank runs** can **adopt** **Razorpay X** without abandoning the **ledger**; schools that **never** adopt a gateway can stay on **Phase 1–2** **forever**.

---

## 5. What the customer hears (one paragraph)

“Your **salary** can be paid **in the same way you pay today** — at the **bank, by cash, or by any internal process**. Our system is the **official place for payslips, paid status, and staff notifications** once you **confirm** in the app. You **do not** need to connect **Razorpay** or any **digital payout** service to start. **Later**, if you want **salary to move directly from a business account to teachers** through a regulated **payout** like **Razorpay X**, we turn that on **per school** with a short **onboarding** and **safety** checklist — the **data model** and **payslips** stay the **same**.”

---

## 6. For engineering (short alignment, not a spec)

* **Parity** with **fees**: tenant-level **capability** + service-layer **assert*Allowed** + UI that **does not advertise** a path the tenant cannot use.
* **Payout** is already behind **`PayrollPayoutGatewayClient`**; Phase 1 **adds** policy **before** any **initiate** to avoid accidental provider calls. **markPayslipPaid** remains the **manual off-ramp** for **offline** truth.
* **Idempotency**, **audit**, and **per-tenant** isolation are **non-negotiable** for all phases.

*Document version:* initial roadmap for product/sales; implementation tickets should reference **Phase 1/2/3** scope above and the current `TenantFinanceProfile` / `PayrollService` patterns in code.
