# School data import and onboarding – what we built (Phases 1–3)

*Plain-language note for sales, support, and school leaders. No technical steps required to read this.*

---

## The big picture

Think of the ERP as a **filing room** for a school. **Bulk import** is the delivery truck that brings many student or staff “cards” at once instead of typing each card by hand. We improved **how the truck is loaded**, **what happens if something is wrong**, and **how you can see what was actually filed** so nobody is left guessing.

---

## Phase 1 – Trustworthy contact data (no fake emails)

**What we changed**

- Teacher records can exist **without** forcing a made-up email just to satisfy the computer.
- The system prefers **real phone numbers** for parents and staff when email is not available.
- Messages to parents and staff are aligned with **“prove who you are”** flows: OTP on phone, optional email and password when real email exists.

**Impact for the school**

- Data looks like real life (India-first): many families and staff are **phone-first**.
- You avoid a messy address book full of **dummy emails** that nobody owns.
- Compliance and trust improve because you are not inventing inboxes to pass validation.

*Analogy:* It is the difference between **writing a real mobile number on a form** versus writing `test@test.com` just because the form insisted on *something* in the email box.

---

## Phase 2 – How much of the file must succeed, and not getting “stuck”

**What we changed**

- **Two execution styles** for a big file:
  - **Best effort** — if one row is bad, the others can still be saved.
  - **All-or-nothing** — the whole file succeeds or the whole file rolls back (safety for smaller, critical loads).
- A **watchdog** notices import jobs that stay “running” too long and marks them as failed with a clear reason, so the screen does not stay stuck forever.

**Impact**

- Large schools can **scale** imports without one bad line ruining a whole day of work (when using best effort).
- Critical smaller loads can be protected with all-or-nothing when the leadership wants **strong consistency**.

*Analogy:* **Best effort** is like a delivery where good boxes are brought inside and one damaged box is set aside. **All-or-nothing** is like refusing the whole shipment if any box is damaged.

---

## Phase 3 – Full trace, “undo” guidance, duplicate safety, and email verification (product)

### A) **Import ledger** (per row: created / updated / skipped)

**What it is**

- After a successful import line, the system can record **one ledger line**: what happened (**created**, **updated**, or **skipped** because it already existed), with the **entity type**, **ID**, a **short business key** (e.g. admission id or phone), and **plain-English “what to do if this was a mistake”** text.
- The admin UI can show a **table** and a **summary** for that job.

**Impact**

- **Auditability:** You can answer “what did this file actually change?” without opening each student or teacher screen one by one.
- **Support:** When a school calls, you can point to a **concrete list** of outcomes instead of guessing.

*Analogy:* A **shop receipt** that lists not only the total but **each line item** and whether it was a new item or a price update.

### B) **Guided rollback bundle** (not automatic deletion)

**What it is**

- A short **“undo guide”** for operators: counts of **created / updated / skipped** rows and **numbered steps** (e.g. remove mistaken records in the directory, or restore from a backup for updates).
- The product **does not auto-delete** school business data; that stays a **controlled, human** action in the right screens.

**Impact**

- Reduces panicked support calls: people see **what to open** and **what kind of fix** applies.
- Stays **safe** for real schools: no silent mass delete from a button.

*Analogy:* A **warranty card** that tells you how to return an item, not a robot that throws things in the bin without asking.

### C) **CREATE-only duplicate ratio guard** (dry-run)

**What it is**

- On validate (dry run), the system can estimate how many **“create new only”** rows would **fail because the key already exists** in the school’s live data.
- If that rate is **too high**, the run can be **flagged as blocked** so the operator does not queue a file that is clearly a **re-upload of the same roster**.

**Impact**

- Prevents “I uploaded the same spreadsheet twice and nobody noticed until 5,000 duplicates” scenarios.
- Aligns with **SLO thinking**: measure and block predictable failure modes, not just single-row errors.

*Analogy:* A **safety interlock** on a factory line that stops the belt if the batch looks like last week’s batch.

### D) **Observability (metrics hooks)**

**What it is**

- Counters and timers in the import module (e.g. dry-run use, job duration, ledger rows written, duplicate-ratio blocks). Operators with monitoring tools (or the built-in **metrics** panel where enabled) can see **trends** as schools grow.

**Impact**

- You can **plan capacity** and **prove reliability** in reviews or tenders.

*Analogy:* A **car dashboard** with fuel and temperature gauges—not only whether you arrived, but **how hard the engine worked**.

### E) **Email verification and password story (product, separate from import row logic)**

**What it is**

- A **request / confirm** flow for **verifying the user’s own email** (with secure one-time tokens stored as **hashes** in the database).
- Development mode can **expose a plain token in the API** for testing; production should rely on **email delivery** (integration point).
- Settings shows **“verify email”** when an address is present but not verified, and a **success badge** when done.
- The profile from login now carries **email verified / phone verified** flags for the UI.
- **Set password** remains the normal **change password** after login; there is no separate “fake” flow tied to import.

**Impact**

- Schools get a **credible, standard** path: phone OTP now, **email + password** when the mailbox is real and verified.
- Support has fewer “I cannot log in with email” tickets caused by unverified or missing addresses.

*Analogy:* **Bank KYC** — you can use the ATM with a card, but to unlock all channels you **confirm your email** once.

---

## What we did *not* change (on purpose)

- We did not add a **one-click “delete the whole import”** that wipes students or fees automatically. Real schools need **human judgment** and often **compliance** around deletion.
- Import **ledger** and **operator guidance** are for **transparency and next steps**; they complement your existing **directory and finance** screens.

---

## How to talk about this with a school

1. “Your **phone is first-class** for staff and parent access; **email** is only pushed when it is real and **verified**.”
2. “**Large files** can run in the mode you choose: **tolerate a few bad rows** or **all succeed or nothing** for critical loads.”
3. “You get a **receipt** for every import: what was new, what was updated, what was skipped.”
4. “If a file is mostly **duplicates in create-only mode**, we **warn you before** you waste a queue run.”
5. “If something is wrong, the screen **tells you what kind of problem** it is, not just ‘error 500’.”

This document is the **business-facing summary** of Phases 1–3. Technical teams should rely on the code, migrations, and API contracts for exact behaviour.