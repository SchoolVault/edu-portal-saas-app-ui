# School demo import pack (~100 students)

This pack is a **end-to-end onboarding example** aligned with the backend’s canonical import columns (`ImportCanonicalFieldCatalog`) and the process described in [IMPORT_SEQUENCE.md](../../onboarding/IMPORT_SEQUENCE.md). Use it to validate imports (dry-run first) and as a model for the CSVs you ask from schools.

**Sample school (fictional demo only):** *Bal Vikas Public School, Noida Sector 62* — staff, teacher, parent, and student emails use the placeholder domain **`bvpsnoida62.edu.in`** (not a live organisation). Replace with your school’s real domains before production imports.

## What this dataset models

- **Class 1–4**: one combined “class” with **no** sections (empty `sections` in `01_classes.csv`). Students in `04_students.csv` use `classname=Class 1` … `Class 4` and a **blank** `sectionname`.
- **Class 5–12**: two sections **A** and **B** (`A|B` in classes CSV). Eighty students are split **five per section** per class (10 per class total).
- **100 students total**: twenty in 1–4, eighty in 5–12, unique `admissionnumber` and one parent contact per row (avoids `parentphone` + `parentemail` conflicts in one file).
- **Teachers** (`02_teachers.csv`): 20 class teachers with **one homeroom slot each** (no two rows for the same class+section). `classteacherfor` uses `Class 1` … `Class 4` for unsectioned classes, and `5A`, `5B`, … `12B` for sectioned ones. Five additional teachers have **no** homeroom. Column order matches the catalog: **`portalpassword` before `portalrole`**; `libraryrole` is for library/library-assistant semantics only, not for teachers.
- **Staff** (`03_staff.csv`): includes **library** rows (`portalrole=LIBRARY_STAFF`, `libraryrole` = `LIBRARIAN` / `ASSISTANT`) and **E2E-oriented school staff** rows: `SCHOOL_STAFF` with `schoolrolecodes` = `BASE_SCHOOL_STAFF` only, **empty** `schoolrolecodes` (assign extra catalog roles later in **Settings → access / RBAC**), or quoted stacks like `"BASE_SCHOOL_STAFF,FEE_OFFICE"`. Also includes **production-aligned desk examples**: `TRANSPORT_LOGISTICS`, `HOSTEL_RESIDENCE_DESK`, combined `TRANSPORT_HOSTEL_LOGISTICS`, and `TENANT_SETTINGS` (settings & finance profile — not full admin). **Do not** set `classteacherfor` on staff rows.
- **Timetable** (`05_timetable.csv`): a **minimal** MONDAY period 1 row per class+section, using the same teacher emails as homeroom teachers. Expand with more `dayofweek` / `period` in your own file.
- **Fee structures** (`06_fee_structures.csv`): one structure name per `Class 1` … `Class 12` for the current academic year.

## Run order (separate import jobs or one ZIP with multiple files)

Run in this order so references resolve like a typical K–12 rollout:

1. `01_classes.csv` — `CLASSES`
2. `02_teachers.csv` — `TEACHERS`
3. `03_staff.csv` — `STAFF`
4. `04_students.csv` — `STUDENTS`
5. `05_timetable.csv` — `TIMETABLE`
6. `06_fee_structures.csv` — `FEE_STRUCTURES`

Each job is asynchronous; wait for one job to finish (or at least for classes) before the next. Use **`academicyearid=CURRENT`** in these files; it resolves to the tenant’s current year when configured.

## RBAC: what CSV does and does not do

- Bulk import **creates people** (teachers, library staff, students, parents) and sets the **portal persona** (`portalrole`: `TEACHER`, `SCHOOL_STAFF`, `LIBRARY_STAFF`, …) plus optional **`schoolrolecodes`**: comma-separated **tenant school role codes** (same codes as in Settings, e.g. `BASE_SCHOOL_STAFF`, `FEE_OFFICE`, `LIBRARY_OPERATIONS`, `TRANSPORT_LOGISTICS`, `HOSTEL_RESIDENCE_DESK`, `TRANSPORT_HOSTEL_LOGISTICS`, `TENANT_SETTINGS`). When present, import **replaces** that user’s school-role assignments with exactly that set; use **quoted** fields if a cell contains commas (`"BASE_SCHOOL_STAFF,FEE_OFFICE"`). Omit or leave `schoolrolecodes` empty to skip pre-seeding so you can attach roles **only in the UI** (good for end-to-end “base staff then add duties” tests).
- **Fine-tuning** (extra roles, custom school roles, permission groups) remains available **after** import in the app, matching how most ERPs separate “data ingest” from “org permissions.”

## Pointers in the repo

- Column lists: `backend-spring/.../ImportCanonicalFieldCatalog.java`
- School-facing field help: `docs/sales/TEACHERS_AND_STAFF_CSV_FIELD_GUIDE.md` and the sales templates
- `libraryrole` must be `LIBRARIAN`, `ASSISTANT`, `HEAD`, `AUTO`, or empty — never `Yes`/`No`

## Export note

`GET` CSV exports (e.g. teachers) may not match import column order one-for-one. For onboarding handoffs, use **this pack** or the sales templates as the source of truth, not a re-export, when column order and optional columns matter.
