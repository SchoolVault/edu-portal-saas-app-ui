# SchoolVault Fees module — guide for school staff (non-technical)

This guide explains **what each part of Fees is for**, **in what order to use it**, and **what to type in each form**. Your screen may show slightly fewer tabs if your login role does not include every permission.

---

## Before you start

1. **Academic year** — The school should already have the current academic year selected in the app (most screens assume it).
2. **Classes and students** — Students should exist in the system with the correct class (and section, if you use sections).
3. **Who can do what** — Only some staff see every tab. If you cannot open a tab, ask your SchoolVault administrator to adjust your role.

---

## Two ways you might see “structures” and “payments”

Some schools still use the **older** fee screens; others use the **new** flow (fee items → class plans → billing). You might see:

| If you see these tabs | What they are |
|----------------------|----------------|
| **Fee structures** and **Payments** (older) | Classic flow: one list of structures and a payments list. The orange **Create fee structure** button often opens the old editor. |
| **Fee items**, **Class plans**, **Plan assignments**, … (newer) | The full modern workflow described below. |

If **both** appear, your school may be migrating: use the workflow your office has agreed on. When in doubt, prefer **Fee items → Class plans → Plan assignments → Billing runs** for the new system.

---

## Recommended order (new fees workflow)

Think of it as **building blocks → packages → who gets which package → posting charges → collecting money → checking reports**.

| Step | Tab | In plain English |
|-----|-----|------------------|
| 1 | **Fee items** | List every *type* of fee (tuition, transport, lab…). |
| 2 | **Class plans** | Bundle those items into a *plan* per class (with amounts). |
| 3 | **Plan assignments** | Say *which student* is on *which plan* (and from which date). |
| 4 | **Rules** (optional) | Automate plan changes or discounts (often set up once with support). |
| 5 | **Billing runs** | For a given **month**, create the charges for all students who have a plan. |
| 6 | **Student charges** | See or filter posted charges (what each student owes for each line). |
| 7 | **Discounts** (as needed) | Reduce amounts for specific students. |
| 8 | **Reports** | Totals collected, who still owes, class summaries. |
| 9 | **Payment register** | List of payments received (including online, when configured). |
|10 | **Reconciliation** | Spot mismatches between “what’s owed” and “account balance” (for office review). |
|11 | **Audit trail** | Read-only history of important fee actions. |
|12 | **Late fees** | Define penalty rules, then **apply** them for a date. |
|13 | **Account history** | Per-student timeline of charges and credits (ledger-style view). |

---

## Tab-by-tab: purpose, when to use it, what to fill in

### 1. Fee items

**Purpose:** Create reusable labels for each kind of fee (e.g. `TUITION`, `BUS`, `LAB`).

**When:** At the start of using the module, and whenever you add a new fee category.

**Typical fields:**

| Field | What to put |
|-------|-------------|
| **Short code** | A short internal code (letters/numbers). Example: `TUIT`, `BUS`. |
| **Name** | The name staff and parents understand. Example: `Tuition fee`. |
| **Type** | **Recurring** (happens again each term/month) vs **One-time** (e.g. admission). |
| **Frequency** | How often it repeats in planning (monthly, quarterly, yearly, custom). |
| **Optional** | Tick if this item can be skipped for some students. |
| **Refundable** | Tick if refunds are allowed for this item under your policy. |

**Actions:** **Save** adds the row to the table; use row actions to edit or remove if your role allows.

---

### 2. Class plans

**Purpose:** Build the **fee package** for a class: which **fee items** appear and how much each costs.

**When:** After fee items exist; before assigning students.

**Typical fields:**

| Field | What to put |
|-------|-------------|
| **Class** | The class this plan applies to. |
| **Structure / plan name** | A clear name, e.g. `Grade 5 — General 2025-26`. |
| **Plan version** | A version number if you keep multiple versions (e.g. when fees change mid-year). |
| **Status** | Usually **Active** when students should use it; **Draft** while you are still editing. |
| **Lines** | For each line: pick a **fee item**, enter the **amount**. Add lines with **Add line**. |

**Tip:** Total fee for the class is the sum of line amounts (plus anything added later by discounts or late fees).

---

### 3. Plan assignments

**Purpose:** Link each student to **one class fee plan** (and optionally a frozen version and effective dates).

**When:** When a student joins, changes class, or changes fee category.

**Sections you may see:**

1. **Manual assignment (IDs)**  
   - **Student ID**, **Class ID**, **Plan ID**, **Plan version**, **Note**, **Valid from / to** — use when you know the numeric IDs from another screen or export.  
   - **Save for student** stores the assignment.

2. **Rule-based assignment (preview & run)**  
   - Enter **class** (and **section** if needed), or a list of **student IDs** separated by commas.  
   - **Preview** shows who would change plan without saving.  
   - **Execute** applies changes.  
   - **Run reference key** — a unique label for this run so the system does not apply the same run twice by mistake.  
   - **Replace existing assignment** — only tick if you intend to overwrite what was there before.

3. **Table of current assignments**  
   - Filter by student ID if the list is long.

**Tip:** If this feels technical, do manual assignments with IDs from your student list export, or ask support to set up **Rules** so bulk assignment is one click.

---

### 4. Rules

**Purpose:** Store **automation rules** (which plan applies to whom, discounts, late-fee behaviour). Many schools configure this once with SchoolVault support.

**Typical fields:**

| Field | What to put |
|-------|-------------|
| **Short code / Name** | Identify the rule clearly. |
| **Rule type** | Assignment, discount, or late-fee related (depends on your setup). |
| **Priority** | Lower numbers often run first; follow your administrator’s convention. |
| **Stop on match** | If ticked, later rules may be skipped when this one matches. |

**Rule details (logic):** Advanced screen with conditions (“when…”) and actions (“then…”). Prefer not to change without training.

---

### 5. Billing runs

**Purpose:** For a given **month (billing period)**, **post charges** to every student who has an active plan assignment.

**When:** Start of each fee cycle (e.g. beginning of the month).

**Typical fields:**

| Field | What to put |
|-------|-------------|
| **Billing month / period** | Usually `YYYY-MM` (example: `2026-04` for April 2026). |
| **Run reference** | Any unique reference you choose for this run (prevents accidental duplicate runs). |
| **Trigger / source** | How the run was started (e.g. office, scheduler). |

**After a run:** New rows appear under **Student charges** and feed into balances and parent-facing totals (where configured).

---

### 6. Student charges

**Purpose:** See **posted charge lines** per student (amount, due date, paid vs outstanding, status).

**When:** Daily operations — answering “how much does this student owe for this item?”

**Typical use:** Filter by **student ID**; read **outstanding** and **status** (unpaid, partial, paid, overdue).

---

### 7. Discounts

**Purpose:** Reduce fees for a student (scholarship, sibling discount, staff child, etc.).

**Typical fields:**

| Field | What to put |
|-------|-------------|
| **Student** | The student receiving the discount. |
| **Discount type** | Flat amount or percentage. |
| **Value** | Amount or percent. |
| **Applies to** | All fee items, or only selected items (may ask for a list of item IDs). |
| **Valid from / to** | When the discount is active. |
| **Reason** | Short note for the audit trail. |

---

### 8. Reports

**Purpose:** Management view — **money collected**, **who still owes**, **totals by class**.

**Typical fields:**

| Field | What to put |
|-------|-------------|
| **From / To date** | Leave empty to use the full academic year context, or pick a range for a term. |

**Sections often include:** totals, defaulters list, class outstanding, and sometimes a **student statement** (open charges + recent account entries).

---

### 9. Payment register

**Purpose:** Operational list of **payments** (amount, method, status, receipt, time).

**When:** Reconciling collections, finding a payment, checking online receipts.

**Note:** Your school’s **finance settings** control whether parents can pay online; counter staff still record offline payments here or via related workflows your school uses.

---

### 10. Reconciliation (balance review)

**Purpose:** Shows students where **“amount due from charges”** and **“account balance”** **do not match**. This is for **review only** — it does not auto-fix.

**When:** Month-end or when something looks wrong.

**If you see rows here:** Escalate to your finance lead or SchoolVault support; do not guess corrections.

---

### 11. Audit trail (activity log)

**Purpose:** Read-only **history** of important actions (runs, payments, refunds).

**When:** Investigating “who changed what and when.”

---

### 12. Late fees

**Two parts:**

#### A) Policies

**Purpose:** Define **how** late fees work.

| Field | What to put |
|-------|-------------|
| **Policy code / name** | Short code and readable name. |
| **Grace days** | Days after due date before late fee applies. |
| **Calculation** | **Flat amount** (fixed rupee) or **percentage** of principal. |
| **Amount / rate / cap** | The penalty amount, percentage, and maximum cap (if your school uses caps). |
| **Active** | Turn on when the policy should be available for runs. |

#### B) Application runs

**Purpose:** **Apply** an active policy up to a chosen date.

| Field | What to put |
|-------|-------------|
| **Policy** | Pick the policy to apply. |
| **Apply through date** | Late fee logic uses due dates and grace relative to this date. |
| **Run reference** | Unique key for this application (same key = same result, avoids double charging). |

**Buttons:** **New run reference** generates a fresh key; **Apply late fees** executes the run.

**Table:** Past runs show policy, date, how many charge lines were updated, status, and when it ran.

---

### 13. Account history

**Purpose:** Per-student **timeline** of debits and credits (charges, payments, adjustments).

**When:** Explaining a balance or tracing a dispute.

**Typical field:** **Student ID** to load that student’s history.

---

## Buttons at the top of the page

| Button | Purpose |
|--------|---------|
| **Refresh** | Reload lists from the server. |
| **Export CSV** | Download fee structure / plan data (format depends on your version). |
| **Fee settlement (Settings)** | Opens finance settings (online checkout, gateways, settlement). Usually for administrators. |
| **Create fee structure** | Often opens the **legacy** structure creator if your school still uses it. |

---

## Parent portal (families)

If your school turns on **online fee payment** in finance settings, parents may pay from their portal; balances and receipts should reflect the same fee records your office maintains. Offline schools record cash/UPI at the counter according to your process.

---

## If something goes wrong

1. Note the **student**, **date**, and **tab** you were using.  
2. Check **Audit trail** for recent actions.  
3. Use **Reconciliation** only to see mismatches — do not treat it as a fix button.  
4. Contact your **SchoolVault administrator** or support with screenshots.

---

## Quick glossary

| Term in the app | Plain meaning |
|-----------------|----------------|
| **Fee item** | One type of fee (tuition, bus, etc.). |
| **Class plan** | Package of items and amounts for a class. |
| **Plan assignment** | Which plan applies to which student. |
| **Billing run** | “Post this month’s charges” for everyone on a plan. |
| **Student charge** | One posted amount line (may be part of a bill). |
| **Run reference** | A unique label so the same job is not accidentally run twice. |
| **Account history** | Running record of money in and out for a student. |

---

*Document version: aligned with SchoolVault Fees UI labels (Fee items, Class plans, Billing runs, etc.). For technical setup (webhooks, Razorpay, permissions), see separate technical docs in the `docs/` folder.*
