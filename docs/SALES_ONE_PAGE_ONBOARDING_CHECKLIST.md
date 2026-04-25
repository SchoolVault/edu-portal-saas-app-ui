# Sales One-Page School Onboarding Checklist (Non-Technical)

Use this page during live onboarding calls so your team can run school import safely and consistently.

---

## 1) Before Import (Readiness Check)

Mark each item as done before uploading any CSV:

- [ ] School workspace is created from Super Admin.
- [ ] You can log in to that school as Admin.
- [ ] Academic year is set and marked as **Current**.
- [ ] CSV files are ready in this sequence:
  1. `01_classes_sections.csv`
  2. `02_teachers.csv`
  3. `03_students.csv`
  4. `04_timetable.csv`
  5. `05_fee_structures.csv`
- [ ] No duplicate key values in file where uniqueness matters (admission number, teacher phone, etc.).
- [ ] Date format is `yyyy-MM-dd` (example: `2026-04-01`).
- [ ] Time format is `HH:mm` (example: `09:30`).

### Contact/Login field checks (important)

- **Teacher import**
  - [ ] `phone` is present (mandatory for real login flow).
  - [ ] `email` is optional.
  - [ ] `portalpassword` optional (if provided, email+password login can start immediately when email is present).
- **Student/Parent import**
  - [ ] Parent phone is present where parent portal should be enabled.
  - [ ] Parent email is optional.
- [ ] Do not use fake emails just to fill blanks.

---

## 2) During Dry-Run (Quality Gate)

For each file/job type:

1. Upload CSV.
2. Check column mapping (correct field matched).
3. Run **Dry Run**.

### Verify on dry-run screen

- [ ] Error count is acceptable (ideally 0 before queueing).
- [ ] Academic year message is correct (current/fallback year shown).
- [ ] Duplicate warnings are reviewed (especially for `CREATE_ONLY` mode).
- [ ] Import mode selected correctly:
  - `UPSERT` = create/update existing safely.
  - `CREATE_ONLY` = only new records; duplicate rows fail.

### Do NOT queue if

- [ ] Year resolution is wrong.
- [ ] High duplicate ratio appears in create-only scenario.
- [ ] Mapping is incorrect for key fields (phone, class/section, timetable slots).

---

## 3) After Import (Post-Run Validation)

After queueing and completion, validate module by module:

- [ ] **Classes/Sections:** expected classes and sections are visible.
- [ ] **Teachers:** teacher count is correct; phones present; optional emails look correct.
- [ ] **Students:** student count is correct; class/section mapping is correct.
- [ ] **Timetable:** no obvious missing slots for working days/periods.
- [ ] **Fees:** structures and component amounts match school-provided sheet.

### Job outcome checks

- [ ] Job status is `COMPLETED` (or reviewed if partial/best-effort mode).
- [ ] Time taken is visible and reasonable.
- [ ] Line outcomes/ledger reviewed:
  - created
  - updated
  - skipped
- [ ] If issues exist, use rollback guidance notes and fix targeted records (do not panic re-upload blindly).

---

## 4) First Login Checks (Teacher/Parent)

Run at least one real user check before closing onboarding:

### Teacher first login

- [ ] Phone OTP login works (`schoolCode + phone` flow).
- [ ] If teacher has email + password, email/password login also works.
- [ ] Profile opens and basic details are visible.
- [ ] If email exists, verify email flow can be triggered from settings/profile.

### Parent first login

- [ ] Parent mapped student(s) are visible.
- [ ] Parent can log in with phone OTP.
- [ ] If email/password is configured, test that as secondary channel.

---

## 5) Go-Live Sign-Off (Sales Handover)

Only mark onboarding complete when all are true:

- [ ] All 5 imports completed and validated.
- [ ] No unresolved critical errors in line outcomes.
- [ ] At least one teacher and one parent login tested successfully.
- [ ] School admin understands:
  - where to re-run dry-run,
  - how to read import outcomes,
  - when to use UPSERT vs CREATE_ONLY.
- [ ] Handover note sent to school with summary counts and next support contact.

---

## Quick “If Something Goes Wrong” Guide

- Wrong year detected -> stop, set correct Current academic year, dry-run again.
- Many duplicates in create-only -> switch to UPSERT if update is intended.
- Login issue for imported user -> verify school code, phone format, and whether portal user was intended.
- Missing records after import -> check line outcomes first before re-upload.

---

This checklist is for non-technical onboarding operations and can be used directly by Sales/Ops during live school setup calls.
