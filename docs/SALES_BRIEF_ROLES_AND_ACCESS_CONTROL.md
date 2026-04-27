# How sign-in, roles, and access work in the school app  
**For sales and customer conversations** · Plain language · Phases 1–4

---

## Who this is for

This note explains **how we control who can do what** in the product—without technical jargon. You can use the same story with school principals, bursars, and IT heads.

---

## The simple picture (analogy)

Think of the school’s workspace like an **office building**.

1. **Your “door badge” (sign-in type)**  
   When someone logs in, we first know *what kind of person they are*: for example **School Admin**, **Teacher**, **Library staff**, **Parent**, or **Student**.  
   That is their **account type**—like the colour of their badge. It does not change when you give them extra duties.

2. **The “keys on the keyring” (access rights / permissions)**  
   Each important action in the app (fees, payroll, settings, reports, etc.) is protected by a **small, named right**. We call these **permissions** (or access rights).  
   A person’s **effective access** is the **set of keys** they hold—not a single “Admin on / off” switch.

3. **Responsibility bundles (school roles)**  
   The school can hand someone a **named bundle** of keys, for example “Fee & accounts desk” or “Academic staff”.  
   A **Teacher** can still be a teacher *and* carry the “Fee office” bundle if the school wants—**without** turning them into a full admin account.

4. **Custom job titles (custom roles)**  
   The school can also **create its own** bundles (e.g. “Front desk – fee view only”) by picking from the same master list of permissions.  
   That way the product matches **how the school is organised in real life**, not a one-size-fits-all chart.

5. **Safety and traceability**  
   The system is built so a school is **not left with nobody who can manage configuration**, and important access changes can show up in the **audit trail** (who changed what, when).

That is the story you can tell customers: **badge type + bundles of keys + optional custom bundles + safety + record of changes.**

---

## Phase 1–4 in one sentence each (for internal use)

| Phase | What we delivered (customer-friendly) |
|--------|----------------------------------------|
| **1** | Every screen and API is tied to **named access rights**; the app knows a user’s full set of rights when they work. |
| **2** | The school gets **ready-made responsibility bundles** (templates) and can **assign** them to staff. |
| **3** | Schools can **add their own** bundles, we protect the **last configuration owner**, and we can keep login tokens **lean** while still enforcing rights on the server. |
| **4** | Changes to custom bundles and to **who** holds which bundle are **recorded** in the school’s **audit log** (under “Roles & access” / **RBAC**), so compliance and accountability are visible. |

---

## Sign-in types (portal roles) — what they mean in conversation

These are the **account types** (the “badge”). They describe **who the person is** in the school, not every task they are allowed to do (that comes from **permissions** and **school roles** below).

| Sign-in type | In simple words | Typical use |
|--------------|-----------------|------------|
| **Platform / Super Admin** (SaaS operator) | The **vendor team** that runs the whole platform across many schools. | Support, billing, feature rollout—**not** the day-to-day school head. |
| **School Admin** | Someone who can run **this school’s** back office (within what the product and subscription allow). | Principal office, head admin, IT lead for the school. |
| **Teacher** | **Teaching and class-related** work; not automatically full access to fees or payroll unless given. | Class teachers, subject teachers. |
| **Library staff** | **Library** catalogue and issue/return. | Librarian, library assistant. |
| **Parent** | Sees their **own children’s** information and school-facing parent flows. | Guardians. |
| **Student** | **Student** portal, scoped to the learner. | Older students on portal. |

**Key sales line:** *“Admin / Teacher / Parent is **who** they are. What they can **open** in the app is a **separate** layer: responsibility bundles and permissions—so a fee clerk doesn’t have to be a full admin user.”*

---

## Ready-made “responsibility bundles” (system templates)

These are the **pre-built** job-style bundles schools get. Each one is a **set of access rights** with a clear name. Staff accounts can be given **one or more** of these, on top of their sign-in type.

| Bundle (example name) | In plain language |
|----------------------|------------------|
| **Full school administration** | Broad access across configuration, users, fees, payroll, exams, import/export, reports, and **tenant-level** school settings. Typical head-office / principal-style control (within the product’s modules). |
| **Academic staff** | Roster, attendance, marks, timetable in scope, plus **reading** published fee information where needed for class context. |
| **Fee & accounts desk** | Fee structures, collection, fee-side reporting—**not** the full “everything in the school” power unless also given **tenant admin** rights. |
| **Payroll & salary desk** | Salary and payslip type work for the school. |
| **Examination cell** | Exam cycles, exam reports in scope. |
| **Library operations** | **Library** management and issue/return. |
| **School settings & finance profile** | **Branding**, school-level settings, and **finance / payment routing** setup—**without** necessarily giving every other admin module. |

**Custom bundles:** the school can **add** new bundles with a **custom name** and pick the **exact** permissions (from the same master list). They can also **retire** a custom bundle when it is no longer used, subject to safety rules below.

---

## The “ingredients” (permissions) — for accurate demos

Below is a **summary map** of what our **named access rights** cover, in business language. You usually **don’t** read this list to a parent—**do** use it to answer “can we restrict X without making them admin?”

| Access right (internal name) | In sales language |
|------------------------------|-------------------|
| **TENANT_ADMIN** | “Full **school configuration** owner”: settings, many cross-cutting admin controls, user-directory style operations—**the serious master key** for that school. |
| **SCHOOL_FEES_READ** | View fee structures, payment ledgers, and collection summary dashboards. |
| **SCHOOL_FEES_WRITE** | Manage fee structures, collect payments, send reminders, and process refund actions. |
| **SCHOOL_SETTINGS_FINANCE_READ** | View payment routing, finance profile, and settlement onboarding status. |
| **SCHOOL_SETTINGS_FINANCE_WRITE** | Update payment routing, finance profile, and settlement onboarding workflow. |
| **SCHOOL_PAYROLL_READ** | View salary structures, payslips, and disbursement queue status. |
| **SCHOOL_PAYROLL_WRITE** | Manage salary structures, generate payslips, and perform disbursement/settlement actions. |
| **SCHOOL_SETTINGS_CORE_READ** | View branding, school identity profile, and feature-flag settings. |
| **SCHOOL_SETTINGS_CORE_WRITE** | Update branding, school identity profile, and feature-flag settings. |
| **SCHOOL_RBAC_READ** | View role catalog, permission packs, and current duty assignments for staff. |
| **SCHOOL_RBAC_WRITE** | Manage role assignments, custom roles, and reusable permission packs. |
| **SCHOOL_GUARDIAN_READ** | View guardian directory records used for student linkage workflows. |
| **SCHOOL_GUARDIAN_WRITE** | Create/update guardian directory records and guardian linkage metadata. |
| **SCHOOL_STUDENT_READ** | View student master roster and profile records. |
| **SCHOOL_STUDENT_WRITE** | Create/update student records, run bulk imports, and execute promotions. |
| **SCHOOL_EXAMS_READ** | View exam cycles, marks records, schedules, and publication snapshots. |
| **SCHOOL_EXAMS_WRITE** | Manage exam templates/workflows, marks entry, schedules, and result publication controls. |
| **SCHOOL_IMPORT_EXPORT_READ** | **Read import/export operations**: preview, dry-run validation, job history, and template exports. |
| **SCHOOL_IMPORT_EXPORT_WRITE** | **Write import/export operations**: queue import jobs and retry failed rows. |
| **SCHOOL_COMMUNICATION_READ** | View inbox feed operations, campaign analytics/history, and provider health/dead-letter visibility. |
| **SCHOOL_COMMUNICATION_WRITE** | Publish announcements/events, queue campaigns, and replay failed delivery queues. |
| **SCHOOL_DIRECTORY_READ** | Search and view teacher/student/staff directory entries. |
| **SCHOOL_DIRECTORY_WRITE** | Manage directory administration actions and future directory updates. |
| **SCHOOL_OPERATIONS_READ** | View operations-hub queues and dashboards (visitors, gate passes, inventory, reminders). |
| **SCHOOL_OPERATIONS_WRITE** | Execute operations-hub workflow actions (staff, visitors, gate, inventory, reminders). |
| **SCHOOL_ACADEMIC_READ** | View academic rosters, classes, sections, assignments, attendance, and timetable data. |
| **SCHOOL_ACADEMIC_WRITE** | Manage academic setup, assignments, promotions, and academic workflow updates. |
| **SCHOOL_REPORTS_READ** | View school-scoped reporting dashboards, summaries, and generated report history. |
| **SCHOOL_REPORTS_WRITE** | Manage report templates, workflow actions (approve/publish/rollback), and report processing jobs. |
| **SCHOOL_CHAT_READ** | View chat inbox, conversation history, and role-aware participant directory. |
| **SCHOOL_CHAT_WRITE** | Start conversations, send messages, and update read markers. |
| **FEE_STRUCTURES_READ** | **Read** published fee information (e.g. teachers seeing relevant fee context for a class). |
| **ACADEMIC_TEACHER** | **Classroom** side: roster, attendance, marks, timetable within assigned scope. |
| **LIBRARY_MANAGE** / **LIBRARY_CIRCULATION** | **Library** catalogue and circulation. |
| **PORTAL_PARENT** / **PORTAL_STUDENT** | **Parent** and **student** portal surfaces (separate from staff). |
| **PLATFORM_ADMIN** | **Platform** operator (cross-tenant). Not a school role. |

---

## Non-negotiable safety rules (what to say to the customer)

1. **The school is never “locked out” of configuration**  
   We block changes that would remove **TENANT-level** access from *every* eligible staff person. In practice: there must always be a path for someone in the school to still **manage the workspace** in line with the product’s rules.

2. **No silent surprise** (audit)  
   **Creating / editing / removing** custom bundles, and **changing** which bundles are assigned to a staff member, is written to the **school audit log** (filter: **“Roles & access” / RBAC**). That helps with “who changed access for whom?” in audits and disputes.

3. **Lean login tickets (optional)**  
   The product can keep the **login ticket small** and still recalculate access on the **server** when needed, so it scales well and stays **correct** when access changes. (No need to explain *how* in a customer demo unless they ask about security at scale.)

---

## What to say in a 30-second customer pitch

> “In our app, **how you sign in**—admin, teacher, parent—is only the first step. The school can then hand out **responsibility bundles**—like ‘fee desk’ or ‘exam cell’—and even **create** its own job descriptions from a **clear checklist** of access rights. The **full configuration owner** right is special: we make sure the school is never left with **nobody** who can manage the workspace, and we **log** when someone’s access bundles change, so you have an audit trail. That is how we stay close to how **real** Indian school offices are organised, without turning every person into a ‘super user’ by default.”

---

## Phases 1–4 — technical labels → sales language (one-liner)

| Label | What it really means for the school |
|--------|-------------------------------------|
| **Phase 1** | A single, consistent **set of access rights** across the whole app and API. |
| **Phase 2** | **Templates + assignments**—“give this staff member these bundles.” |
| **Phase 3** | **Custom bundles** + “don’t break the last admin” + **efficient** access checks. |
| **Phase 4** | **Visibility**: access and bundle changes show in the **audit** story for the school. |

---

## What we do *not* promise in this document

- Exact **subscription** or **module** gating (some screens depend on the school’s plan or feature flags).  
- **Row-level** “only this branch” or “only this bank account” **unless** the product module explicitly enforces it—**permissions** are about **which areas** of the app you can use; finer **data scoping** can be a separate roadmap talk.  
- **Single sign-on (SSO) with the school’s Microsoft/Google**—a common enterprise ask, but it is a **separate** integration project from “roles and permissions as described here.”

---

## Document version

- **Scope:** Authentication model, sign-in types, **school responsibility bundles** (template + custom), access rights, safety rules, and audit of RBAC changes (**Phases 1–4** as implemented in the product).  
- **Audience:** Non-technical **sales** and **school decision-makers**; for engineering detail, refer to technical / architecture docs.

---

*This brief is for customer-facing clarity. For implementation guarantees, the shipped product, subscription, and current module list remain the source of truth.*
