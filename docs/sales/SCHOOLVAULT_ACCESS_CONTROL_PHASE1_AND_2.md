# SchoolVault — How sign-in and access control work (for schools and sales)

**Who this document is for:** school principals and administrators, sales and implementation teams, and anyone explaining the product **without** reading code.

**What it explains:** how people prove who they are (**authentication**), how the system decides what they may do (**authorization**), and how **Phase 1** and **Phase 2** improvements make that model **clearer, safer, and easier to grow** as your school’s team changes.

---

## 1. A simple analogy: ID card, job hats, and key rings

Imagine your school building:

| Idea in plain English | What it maps to in SchoolVault |
|----------------------|---------------------------------|
| **Photo ID at the gate** — proves *who* you are (staff, parent, student) | **Authentication** — login, password, session |
| **Which main gate you use** — admin entrance vs teacher entrance vs parent portal | **Portal role** — the broad type of account (for example *school admin*, *teacher*, *library staff*) |
| **Job hats inside the building** — today you are “fee desk”, tomorrow “exam cell” | **School responsibility roles** — the *work areas* a staff member is allowed to use in the back office |
| **Individual keys on a keyring** — open only certain rooms | **Permissions** — small, precise capabilities (for example “fee collection”, “exam reports”) |
| **A labelled key ring sold as one unit** — “fee + reports read-only pack” | **Permission packs (Phase 2)** — reusable bundles you attach to roles instead of ticking fifty boxes every time |

No analogy is perfect, but it helps non-technical readers: **login** is the ID check; **roles and packs** decide **which rooms (screens and actions)** open for that person.

---

## 2. Authentication vs authorization (two different questions)

**Authentication — “Who are you?”**

- Handled at login: correct credentials, secure session, optional refresh.
- After success, the system **trusts the identity** of that user for a period of time.

**Authorization — “What are you allowed to do?”**

- Happens on **every important action**: opening a fee screen, running an import, changing settings.
- The system asks: *Does this person’s profile include the right permission for this school?*

**Why both matter for schools**

- **Authentication** keeps strangers out.
- **Authorization** keeps **honest insiders** in the right boundaries — a teacher should not accidentally change payroll; a fee clerk should not reconfigure the whole tenant.

SchoolVault separates these cleanly so your **IT narrative** is simple: *we verify identity first, then we enforce least privilege for each school.*

---

## 3. Two layers schools should understand

### 3.1 Portal role (broad identity — “what kind of account is this?”)

Each user has a **portal role** such as *school admin*, *teacher*, or *library staff*. That is mainly:

- **Who they are in the organisation** in a coarse sense.
- **Which parts of the product universe** they belong to (for example staff apps vs parent portal).

Think of it as the **main category on the ID card**. It does **not** replace fine-grained “which office jobs can this person perform?”

### 3.2 School responsibility roles (fine control — “which job areas?”)

On top of the portal role, staff can be given one or more **school responsibility roles** — named bundles aligned to real school offices, for example:

- Full school administration  
- Academic staff  
- Fee & accounts desk  
- Payroll desk  
- Examination cell  
- Library operations  
- School settings & finance profile (narrower than full admin)

These roles exist **per school (tenant)**. They describe **responsibilities**, not personality.

**Phase 1** made these roles **stable and portable**: each has a short **code** (like `FEE_OFFICE`) that can appear in **imports** and **exports**, so onboarding and audits stay consistent.

**Why schools care**

- The principal can say: *“Ravi is admin on paper, but day-to-day he only runs the fee desk.”*  
- The system can match that reality **without** giving Ravi every power a “full admin” might have.

---

## 4. Permissions — the smallest unit of “may do this”

Under the hood, each sensitive feature checks for an **atomic permission** — a single, named capability (examples: fee office, payroll office, import/export, exam office, library circulation, and so on).

**Benefits for schools**

- **Predictable behaviour:** the same word always means the same gate.
- **Safer upgrades:** new features can add new permissions without silently giving them to everyone.

**Benefits for your team (sales / implementation)**

- You can explain access as **building blocks**, not vague “admin rights”.

---

## 5. Phase 1 — what changed (plain language)

Phase 1 focused on **making school access real, repeatable, and operable at scale**:

1. **Stable role codes**  
   Every built-in school role has a machine-friendly **code** (for example `SCHOOL_FULL_ADMIN`, `ACADEMIC_STAFF`). Staff assignments and CSV onboarding use the **same codes** the Settings screen shows.

2. **Bulk onboarding alignment**  
   When you import teachers or staff, you can optionally pass **which school roles** they should receive — using those same codes. That reduces manual clicking after a big admission season.

3. **Exports speak the same language**  
   Exports can include the assigned role codes so your spreadsheet **matches** what the product will import again — fewer “it worked in Excel but not in the app” moments.

4. **Central rulebook for API protection**  
   Sensitive school APIs are guarded consistently. Practically: **fewer surprises** when a new screen is added — the pattern is “declare what permission it needs,” not “hope someone remembered.”

**In one sentence for a school admin:**  
*Phase 1 made “who can do what in our school” **explicit, copy-paste friendly, and aligned from the settings screen → imports → exports**.*

---

## 6. Phase 2 — permission packs and composition

Phase 2 adds **permission packs** (also called **permission groups** in technical language):

- A **pack** is a **named, reusable** set of permissions — for example “fee structures + school reports (read type)” for a reviewer.
- A **custom school role** can either:
  - pick permissions **directly** (simple path), or  
  - **link one or more packs** (recommended when the same bundle is reused across several people or roles).

Built-in (template) school roles are automatically backed by packs in the database so **effective access** stays consistent and the system can grow without breaking old tenants.

**In one sentence for a school admin:**  
*Phase 2 lets you treat access like **standard kits** — create a kit once, reuse it wherever it applies, instead of re-ticking the same boxes for every new hire.*

---

## 7. How “effective access” is decided (without jargon)

When a staff member uses the app:

1. The system knows **who they are** (authentication).
2. It loads their **portal role** (broad category).
3. It looks at their **assigned school responsibility roles** for that school.
4. For each role, it combines:
   - **Linked permission packs**, if any are attached; otherwise  
   - The role’s **legacy permission list** stored as a safe fallback.
5. The **union** (combination) of all those permissions is what they can actually do in that session.

Teachers may receive **extra library access** when their teacher profile is flagged for library duty — that is a deliberate “add-on” pattern so daily school operations match reality.

**Security takeaway:** access is **computed from assignments + roles + packs**, not from a single vague “is admin” switch.

---

## 8. Custom roles — when templates are not enough

Templates cover common offices (fee, payroll, exam, library, full admin, etc.). **Custom roles** exist for schools that need a **special mix** — for example “read-only fee reviewer for trustees” or “imports-only coordinator”.

**Phase 2** makes custom roles easier to manage at scale:

- Build a **pack** once, attach it to several custom roles or several people.
- Or use the **direct checklist** if the role is truly one-off.

**Extensibility (why this matters commercially)**

- New school processes often appear as **“we need one more narrow role.”**  
- With packs, you **clone policy** instead of reinventing it — fewer mistakes, faster onboarding.

---

## 9. Safety mechanisms schools can name in a meeting

These are **trust builders** for principals and bursars:

- **Tenant isolation:** each school’s data and roles stay inside that school’s workspace. One school cannot see another’s configuration.
- **“Last full-configuration admin” protection:** the system blocks changes that would leave **nobody** with the ability to manage core school configuration — reducing the risk of accidental lock-out.
- **Immutable built-in templates:** standard office roles shipped with the product are protected from accidental deletion; schools extend using **custom roles** and **custom packs**.
- **Audit awareness:** sensitive role and access changes are designed to leave **traceable activity** suitable for internal governance (exact UI labels may vary by module).

Use plain language in sales: *we reduce “oops, we removed everyone who could fix fees” classes of errors.*

---

## 10. Scalability — what we can honestly promise

**“Scalable” has two meanings.** Both matter.

### 10.1 Product scalability (more users, more complexity)

- Adding **new staff** is mostly: create user → assign **school roles** (and packs if you use them).  
- Adding **new offices or processes** is mostly: add or adjust **permissions** and **packs**, then assign — **without** rewriting the whole login system.

That is how SchoolVault stays manageable when a school grows from 40 staff to 400.

### 10.2 Technical scalability (speed under load)

- The permission model is **database-backed and cache-aware** for sign-in payloads so routine operations stay fast as the school grows.
- **True** peak performance also depends on good hosting, database maintenance, and how heavy modules (imports, reports) are used — RBAC gives a **clean foundation**, not a substitute for capacity planning.

**Sales-safe wording:**  
*“Access control is designed to grow with the school — more roles and more users without a redesign; hosting and usage patterns decide raw speed.”*

---

## 11. Extensibility — how new features and new buyers fit in

When engineering adds a new module (for example a new compliance report or a new fee workflow):

1. They introduce a **new permission** if the feature should be gated.
2. You decide **which packs and template roles** should include it by default.
3. Existing schools **inherit** sensible defaults; picky schools **tune** via packs and custom roles.

**For chains and advanced buyers later:**  
Phase 1 + 2 already supports **reuse and standardisation** inside one school. If tomorrow you sell to **multi-campus trusts**, that is typically where **later phases** add **organisation-level** rules on top — without throwing away today’s model.

---

## 12. What the school admin does in Settings (story you can demo)

1. Open **Staff roles & access** (wording may match your UI).
2. See **built-in job roles** — aligned to common Indian school offices.
3. Optionally create **permission packs** for combinations you reuse (“fee read + reports”, etc.).
4. Create **custom job roles** if needed — either pick permissions directly or link packs.
5. Pick a **staff member** and assign one or more job roles — changes apply on next sign-in or session refresh.

That flow is intentionally **office language first**, engineering language second.

---

## 13. FAQ — short answers for sales calls

**Q: Is this “real RBAC”?**  
**A:** Yes in the practical sense schools care about: **roles** map to **permissions**, assignments are per user per school, and APIs enforce rules — not just a label on a user record.

**Q: Why not only “Admin / Teacher / Parent”?**  
**A:** Those labels are too coarse for a real school. A person may be “admin” on paper but only operate the **fee desk** day to day. School responsibility roles model that.

**Q: Can we start simple and get advanced later?**  
**A:** Yes. Use **templates only** at go-live; introduce **packs** when you have repetition; add **custom roles** when a trustee or auditor needs a narrow mix.

**Q: What if we onboard 200 teachers from CSV?**  
**A:** Phase 1 aligned **CSV role codes** with the same codes shown in Settings, so bulk onboarding and manual correction stay in sync.

**Q: Is parent/student access covered the same way?**  
**A:** Parents and students use **portal-appropriate** access patterns (their own app surfaces). Staff RBAC focuses on **back-office responsibility** — the highest-risk area for accidental over-access.

---

## 14. Closing — how to describe Phase 1 + 2 in one breath

> *SchoolVault knows **who** you are when you sign in, then applies **fine-grained school job roles** so each staff member only opens the **areas of the app** that match their real work. Phase 1 made those roles **consistent across imports, exports, and settings**. Phase 2 added **reusable permission packs** so schools can **standardise and reuse** access patterns as they grow — safely, tenant by tenant, without giving every power to every “admin” label.*

---

## Document control

| Item | Detail |
|------|--------|
| **Covers** | Phase 1 (stable school roles, import/export alignment, central API rules) and Phase 2 (permission packs / groups, role composition, effective access) |
| **Audience** | Non-technical: principals, school admins, sales, implementation |
| **Not covered here** | Future “Phase 3+” items unless your internal roadmap defines them (often: multi-campus hierarchy, delegated scoped admins, deeper row-level policy) |

*This document describes the product architecture at a conceptual level. Exact screen labels and menu paths follow your shipped UI and locale files.*
