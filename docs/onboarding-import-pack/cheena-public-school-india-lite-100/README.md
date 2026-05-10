# Cheena Public School — Lite 100 onboarding pack

Lightweight onboarding set (same conventions as `CPS` 300-pack imports):
**100 students**, **33 teachers** (**12 homerooms** on **T001…T012**; remaining rows satisfy parallel-subject pooling on Mon–Fri),
**5 staff**, **classes 1–12** — **1–5** whole-cohort (**no section**); **6–12** use a **single section A** per grade (smaller teacher pool than A+B).
Calendar: **Monday–Friday**, **35 periods/week**, conflict-free classroom / teacher / room usage.

Timetable uses **Rule A (fixed periods)**: same subject + same teacher Mon–Fri in each period lane; templates are **rotated by grade** so parallel classes rarely share one subject at the same bell (pool sizing). Toggle `LITE_TIMETABLE_STRATEGY = LiteTimetableStrategy.ROTATING_DAY_GRID` inside `generate_india_school_lite_100_packs.py` for **Rule B**.

Fees: matching component pattern (tuition, activity, lab, sports, annual, transport).

> **Teacher count:** a full subject mix plus **twelve simultaneous classes** requires more specialists than twenty.
  This lite pack trims **calendar load** (no Saturday) instead of weakening academic columns. If your policy demands
  strictly twenty teacher rows, drop periods/days further or consolidate subjects in `generate_india_school_lite_100_packs.py` before regenerating.

## Contents

- `01_classes_sections.csv`: class rows above (whole primaries + one section band per senior grade).
- `02_teachers.csv`: `33` rows + header; each row has distinct name + credential-style qualification/specialization (pool subject still matches timetable); emails `firstname.lastname.t###@cheenapublicschool.edu.in`.
- `03_staff.csv`: `5` operations staff rows.
- `04_students.csv`: `100` admissions; guardian emails `guardian.<admission>-{seq}@cheenapublicschool.edu.in`.
- `05_timetable.csv`: `420` recurring slots referencing `employee_code`s; **`subject_name`** + optional stable **`subject_code`** (ERP mnemonic, aligned with seeded catalog defaults where applicable).
- `06_fee_structures.csv`: `12` annual fee bundles (Class 1–12).

## Import order

1. Classes/sections · 2. Teachers · 3. Staff · 4. Students · 5. Fee structures · 6. Timetable

Generate / refresh CSVs:

`python3 docs/onboarding-import-pack/generate_india_school_lite_100_packs.py`
