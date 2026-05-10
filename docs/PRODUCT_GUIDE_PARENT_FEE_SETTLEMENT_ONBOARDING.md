# Parent fees & school settlement — what changed (plain language)

**Who should read this:** Sales, customer success, product managers, principals, and school office staff who need to **explain the behaviour of the app** without reading code.  
**What it covers:** Online parent fee payments when a school uses **money routed to the school’s own payment-partner account** (often called “Route” or “linked account” in industry language).  
**Related technical / admin detail:** See also `docs/ADMIN_GUIDE_PAYMENTS_FEES_PAYROLL.md`.

---

## 1. The one-sentence story

**If the school chooses “collect fees into our school-linked account at the payment partner,” we now require a deliberate hand-off: the school submits details and a short written confirmation, the platform team reviews, and only then do we turn on that online payment path for parents.** Until that hand-off is complete, online pay on that path stays off by design—not because the app is “broken.”

---

## 2. Two ways schools can run (so you pitch and support correctly)

| How fees are collected | What parents see | Who does extra work |
|------------------------|-------------------|---------------------|
| **Default: platform collection** | Parents pay online as usual. Money flows through the **main collection setup** your product uses with the payment partner. The **school’s fee ledger** in the app (paid / due / receipts) still updates correctly. | **No new approval loop** in the app for this mode. |
| **School-linked account (Route-style)** | Same parent screens, **but** online pay for that “school account” path stays **paused** until the school has **submitted for review** and someone on the **platform** has marked them **LIVE**. | **School admin:** save settings, optional declaration, submit. **Platform super admin:** review and approve LIVE. |

**Important:** Fee structures, assignments, and balances are unchanged. Only **when** parents can complete **online** checkout on the **linked-account** rail is gated.

---

## 3. Why parents might say “online payment is slow” or “it doesn’t work”

Use this language with parents and front-desk staff:

- **Nothing is wrong with the child’s fee bill**—dues and receipts in the app can still be correct.
- If the school turned on **school-linked settlement**, the product **intentionally blocks** starting a new online card/UPI session **until the school is LIVE** on that path. That avoids parents paying into a configuration that has not been **authorised and checked** by the platform.
- **Cash, bank transfer, or other offline methods** the school already accepts are **unchanged** unless the school stops offering them.
- **If the school stays on the default (platform) collection mode**, parents are **not** affected by this new gate.

**Short line for WhatsApp / notice:**  
*“Online card/UPI for school-linked settlement may be paused briefly while the school and platform complete a one-time verification. Your balance in the portal is unchanged; use offline options if the school offers them, or try again after the office confirms.”*

---

## 4. School admin journey (what to demo in a call)

1. **Settings → Finance & payments → Fee settlement.**  
2. Choose **linked account / Route-style** settlement and enter the **linked account id** from the payment partner (the value that looks like `acc_…`). Save.  
3. The screen shows a **status** (for example Draft → Submitted → LIVE).  
4. When ready, the school completes a **short written declaration** (who they are, that they are authorised to use this account—your legal team can supply wording) and taps **Submit for platform review**.  
5. **While status is “waiting for platform”**, parents **cannot** start that **linked-account** online checkout.  
6. After the platform marks the school **LIVE**, parents can pay online on that path again.  
7. If the school **changes** the linked account or commission **after** LIVE, the system asks for **submit again** and **briefly pauses** that online path until the platform re-approves—this protects against silent rerouting of money.

**In the app (school admin UI):** Once status is **LIVE**, settlement fields (mode, linked account, commission) are **locked by default** like many finance ERPs. Admins use **“Change Route settlement…”** to unlock intentionally; saving material changes then follows the **pause → re-submit → re-approve** path above. **Internal notes** can still be updated without unlocking.

**Tip for support:** If a parent complains, ask the school admin to open the same screen and read the **status line** first.

---

## 5. Platform super admin journey (governance story)

1. Open **Super Admin → Schools**, select the school.  
2. Review the **finance / settlement** summary shown for that tenant (mode, onboarding status, and hints about the linked account).  
3. Perform **real-world checks** the way your organisation already does (KYC pack, board resolution, trust deed, signatories, etc.). The app does **not** replace legal or compliance sign-off.  
4. When satisfied, use **Approve Route (LIVE)** only when the school’s status is **ready for your approval** (submitted for review).  
5. After approval, **parent online fee checkout** on that linked path is **allowed**. The system records **who approved and when** for audit.  
6. If the school later edits sensitive settlement fields, they must **re-submit**; parents stay **paused** on that path until you approve again.

This is the product answer to: *“We want India-scale SaaS hygiene—central policy, fewer wrong account IDs, and a clear audit trail.”*

---

## 6. Status words → what to say to a non-technical person

| Status (in app) | Plain English |
|-----------------|---------------|
| **Not required** | This school is on the **default** collection path; the linked-account gate does not apply. |
| **Draft** | School is still editing or has not submitted for review yet. |
| **Submitted** | “In the platform team’s queue.” Parents’ **linked-path** online pay stays off until **LIVE**. |
| **LIVE** | Platform has approved; parents can pay online on the **linked-account** path. |
| **Pending changes** | School changed something important after LIVE; they need to **submit again** and you may need to **approve again** before parents can pay online on that path. |

Words like **Route**, **linked account**, or **merchant** are **vendor jargon**. Customers care about: *who checked it, when did online pay turn on, and what happens if the school changes the bank side.*

---

## 7. What to tell auditors or a board in one breath

“We separated **configuration** from **go-live**. Schools can still run fees and ledgers as before; for the optional path where money is routed to the school’s partner-linked account, we added an explicit **submit → platform approve → LIVE** step so parent checkout cannot start on half-onboarded or unreviewed setups, and we keep an audit trail of approval.”

---

## 8. Where this leaves implementation vs narrative

- **In the app:** School admins use **Settings → Finance & payments**; platform leaders use **Super Admin → Schools** for approval.  
- **In docs for engineers / DevOps:** Webhook URLs, keys, and environment configuration stay in the technical guides referenced from `ADMIN_GUIDE_PAYMENTS_FEES_PAYROLL.md`.

*This file is meant for go-to-market and operations alignment; keep it updated when you change the business rules or visible statuses.*
