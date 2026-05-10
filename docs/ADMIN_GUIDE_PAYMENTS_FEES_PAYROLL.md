# Payments, fees & payroll — guide for school admins & super admins

**Who this is for:** Owners, principals, finance heads, and IT admins who need the **business picture**, not technical jargon.  
**Scope:** India-first schools using **online fee collection** and **salary payouts** through our partner payment rails (e.g. Razorpay / RazorpayX).

---

## 1. The big picture (one glance)

| Area | What happens in plain English |
|------|--------------------------------|
| **Fees** | Parents pay against **their child’s fee bill**. Money is collected through a regulated payment checkout. The **school’s fee records** (paid / due / receipts) update automatically when the bank/payment partner confirms success. |
| **Where money settles** | You can run in **two ways** (see §3): money can stay on the **platform’s** collection account first, or—when configured—**a share can be routed** to the **school’s** linked account at the payment partner (Route-style). The **app’s fee ledger** stays correct in both cases. |
| **Payroll** | The school runs **salary payouts** to teachers’ **verified bank accounts**. Each payout is tied to **that school**, **that teacher**, and **that payslip**. Status updates (paid / failed / in progress) come from the payment partner so records stay honest. |
| **School safety** | Each school’s data and money events are kept **separate** in the system so **School A** never sees or updates **School B**’s fees or payroll. |

---

## 2. Fee payment flow — step by step

1. **Fee is assigned** to a student (class, structure, due date — as your school already does).  
2. **Parent** logs in, opens **Fees**, selects the right child and bill (e.g. Term 1).  
3. Parent chooses amount (full or partial, if you allow) and starts **Pay online**.  
4. The app opens the **payment partner’s secure checkout** (card, UPI, netbanking, etc.).  
5. When the parent pays successfully, the partner sends our system a **confirmation** (like a signed receipt).  
6. Our system finds the **correct school, child, and fee attempt**, then updates: **paid amount, balance due, status, receipt** for that bill.  
7. If payment **fails** or is **refunded** at the partner, the system can **adjust or reconcile** so your **books in the app** do not lie.

**What parents should experience:** One familiar checkout, clear confirmation, and correct balance on the parent portal and admin fee reports.

---

## 3. Where the rupees settle (important for trust)

Your organisation chooses **per school** (in **Settings → Finance routing**):

| Mode | In simple terms | Typical use |
|------|------------------|-------------|
| **Platform merchant (default)** | Parent pays into the **main collection account** used by the product. The **school’s fee ledger** in the app still shows exactly what was paid and what is due. | Simplest setup; settlement to the school may be handled **outside** the app (agreement with your vendor). |
| **Route to linked account** | Parent still pays in the same checkout, but the payment instruction includes a **split**: after any **small platform fee** you configure, the **school’s share** is directed to that school’s **linked account** at the payment partner (`acc_…`). | When you want **settlement identity** closer to “money belongs to the school’s account” at Razorpay, not only correct numbers inside the ERP. |

**Note:** Turning on “Route” requires the school to be **properly onboarded** at the payment partner (KYC, bank, linked account). Our screen stores the **linked account id and rules**; the heavy **compliance onboarding** still happens in the partner’s dashboard or with their support.

**Product / sales narrative (non-technical):** For how this feels to parents, school admins, and platform approvers—and why online pay can appear “paused” until approval—see **`docs/PRODUCT_GUIDE_PARENT_FEE_SETTLEMENT_ONBOARDING.md`**.

---

## 4. School safety & data separation (“tenant safety”)

- Every fee bill, payment attempt, transaction, and payslip is stored **under that school’s workspace**.  
- When the payment partner notifies us, we match the event using **identifiers we attached** (school, fee bill, attempt) so updates hit the **right school only**.  
- For **salary payouts**, we also carry **which school** the payout belongs to so status updates cannot apply to the wrong school.

**In one line:** Same product for many schools — each school’s money story stays **isolated and traceable**.

---

## 5. Payroll (teacher salary) flow — step by step

1. **Salary structures** and **payslips** are maintained for the school (as today).  
2. When it is time to pay, an authorised user **initiates a payout** for a payslip (or batch, depending on your process).  
3. The system records a **payout attempt** (amount, teacher, bank details on file, reference id).  
4. The request goes to **RazorpayX** (or mock mode in training).  
5. The partner **queues** the transfer to the teacher’s bank, then moves to **success** or **failure**.  
6. Our system receives **status updates** and updates **only that school’s** payslip and attempt — e.g. **Paid** when the bank confirms, **Failed** if not, without marking another school by mistake.

**What teachers should experience:** Payslip visible in the portal; status reflects reality; failed payouts do not show as paid.

---

## 6. What was already there vs what we improved

Use this table when talking to auditors, boards, or vendors.

| Topic | Already there (baseline) | What we improved / added |
|-------|---------------------------|---------------------------|
| **Parent fee checkout** | Real payment orders, checkout, signature check on confirm, fee ledger updates | **Clearer tagging** of each payment (school + bill + attempt) on the order so partner callbacks always know **which row to update** |
| **Fee settlement choice** | Single default: collections on the **platform** merchant | **Per-school setting**: default **or** **Route to school linked account** + optional **platform commission (bps)** on routed orders |
| **Linked-account “go live”** | Not distinguished in-product | **Onboarding gate**: school **submit for review** → platform **LIVE** approval → parent **Razorpay** checkout allowed for Route mode; changing linked id/commission after LIVE can require **re-submit / re-approve** |
| **Admin configuration** | General school settings | **Finance routing** screen for admins: mode, linked account id, commission, notes |
| **Refunds** | Refund request / approve / execute inside the ERP | **Partner refund events** can also update the ledger when refunds happen at Razorpay (including cases without a prior ERP refund row) |
| **Payroll webhooks** | Status updates by payout reference | **Stronger school matching**: when the partner echoes **school id** in payout metadata, we match **reference + school** first to reduce any cross-school ambiguity |
| **Stale / stuck payments** | Reconciliation jobs | **Cleanup** for very early “creating order” states so abandoned checkouts do not clutter forever |

---

## 7. What this document does *not* claim

- We are **not** replacing a full **statutory payroll** product (PF, ESI, TDS filings, Form 16, etc.) in one module — that is a **separate depth** many schools buy as specialised HR software.  
- **100% safety** is proven over time with **monitoring, audits, penetration tests, and real load** — the **design** here follows industry practice for India school SaaS; your operations team should still follow **runbooks** (secrets, webhooks URLs, Razorpay dashboard events).

---

## 8. Quick FAQ

**Q: Is parent money “safe”?**  
**A:** Checkout is handled by the **licensed payment partner**; we never ask parents to send money to a random bank account. Our app records **who paid what** for **which child and school**.

**Q: Can two schools’ payments get mixed up?**  
**A:** The system is built so fee and payout events are **scoped to the correct school** and matched using **stored references**.

**Q: Do we support “money goes to the school’s Razorpay identity”?**  
**A:** Yes, when you set **Route to linked account** and a valid **linked account id** from Razorpay Route onboarding for that school.

**Q: Who configures Finance routing?**  
**A:** **School admin** or **super admin** (roles you already use), not parents.

---

*Last updated for: India-first schools, fees + Razorpay-style collection, payroll payouts via RazorpayX-style flows. For technical webhook URLs and env vars, see `docs/FEES_PAYROLL_REAL_PAYMENT_PRODUCTION_CONFIG.md` and `backend-spring/docs/RAZORPAY_WEBHOOK_SETUP.md`.*
