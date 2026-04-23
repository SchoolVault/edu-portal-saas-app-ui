# Safe Re-import Playbook for Sales and Admin

Use this one-page guide when a school asks to correct data after an import is already done.

Goal: re-import safely without duplicates, broken links, or corrupted data.

---

## ERP-Style Re-import Rule

- Re-import should be a **patch**, not a blind duplicate create.
- Expected outcomes on re-import:
  - `CREATED`: brand-new record was added.
  - `UPDATED`: existing record was corrected.
  - `SKIPPED`: row already matched current data.

If you see large `FAILED` counts, stop and fix the source CSV first.

---

## Correct Re-import Sequence

Always rerun in this order when master data may be affected:

1. `01_classes_sections.csv`
2. `02_teachers.csv`
3. `03_students.csv`
4. `04_timetable.csv`
5. `05_fee_structures.csv`

Why this order matters: each step depends on data created in earlier steps.

---

## Which File to Re-run for Which Correction

- **Class name, grade, section, section capacity**
  - Re-run: `01_classes_sections.csv`
  - Expected result: mostly `UPDATED` or `SKIPPED`

- **Teacher phone/email/name/specialization/class teacher mapping**
  - Re-run: `02_teachers.csv`
  - Expected result: mix of `UPDATED`, `CREATED`, `SKIPPED`

- **Student profile, class-section mapping, parent linkage**
  - Re-run: `03_students.csv`
  - Expected result: mostly `UPDATED` or `SKIPPED`

- **Teacher-period assignment, room, subject timetable fixes**
  - Re-run: `04_timetable.csv`
  - Expected result: mostly `UPDATED` or `SKIPPED`

- **Fee structure/component amount changes**
  - Re-run: `05_fee_structures.csv`
  - Expected result: mostly `UPDATED` or `SKIPPED`

---

## Mandatory Dry-run Checks Before Queueing

- `Missing linked record` must be zero for dependency-based files (students, timetable, fees).
- For timetable, teacher conflict should be zero (same teacher cannot teach two classes in the same day and period).
- Duplicate count should be near zero unless intentionally repeated identical rows.
- Academic year must be correct (`CURRENT` resolves correctly for the tenant).

If any of the above fails, do not queue import.

---

## Safe Patch Workflow (for Sales Calls)

1. Take corrected file from school.
2. Run dry-run for that specific file.
3. Fix all blocking errors.
4. Queue import.
5. Open line outcomes and confirm majority are `UPDATED` or `SKIPPED`.
6. Validate key screens (Classes, Teachers, Students, Timetable, Fees).

---

## Quick Error Decoder

- **Class name must be unique within academic year**
  - Meaning: class already exists in same year.
  - Action: re-import using patched class file; expect `UPDATED`/`SKIPPED`.

- **Missing linked record**
  - Meaning: referenced teacher/class/section does not exist yet.
  - Action: import dependency file first, then retry.

- **Duplicate rows in this file**
  - Meaning: same natural key repeated in CSV.
  - Action: deduplicate source sheet before queueing.

- **Teacher double-booking in timetable**
  - Meaning: same teacher is mapped to multiple classes in same slot.
  - Action: move one class to another period or assign another teacher.

---

## What Not To Do

- Do not upload all files blindly when only one module needs correction.
- Do not run timetable before teachers are successfully imported.
- Do not ignore dry-run warnings for missing links and teacher slot conflicts.
- Do not change import order during live onboarding.

---

## Success Criteria (When to Close the Ticket)

- Import job is completed without critical failures.
- Business screens show corrected values.
- Counts and mappings are consistent across dashboard and module pages.
- School admin confirms corrected data is visible.

---

This playbook is written for non-technical users and can be followed directly by Sales/Ops during production onboarding support.
