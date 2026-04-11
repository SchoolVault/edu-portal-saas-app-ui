# School onboarding — recommended import order

This document describes the **sequence** in which CSV/ZIP bulk imports should be run so foreign keys and business rules stay valid. The product runs each job **asynchronously**; ordering is a **process** concern for admins (and for any chained automation).

## 1. Workspace and academic spine

1. **Tenant / school workspace** — Super admin or first-time signup creates the school (`TenantConfig`, admin user, school code). All later rows are scoped by `tenant_id`.
2. **Academic year** — At least one `AcademicYear`; mark the current year before timetabling and class placement.
3. **Classes** — Import `CLASSES` (`classes.csv` in ZIP) **or** create classes in the UI. Optional **sections** in the same row (`sections` column, pipe-separated, e.g. `A|B|C`). Classes without sections are valid; sections can be added later via Academic UI.
4. **Subject catalog** (optional) — If you rely on named subjects from seed or UI, align before teacher subjects and assignments.

## 2. People who anchor rosters

5. **Teachers and library staff** — Import `TEACHERS` (`teachers.csv`) and/or `STAFF` (`staff.csv`). Staff import defaults to **library** portal role when columns are omitted. Use `createportal=Y` and `portalrole` / `libraryrole` as needed. Homeroom / class teacher assignment can be done **after** teachers exist (Academic UI or APIs).
6. **Other operational users** — Any additional admin-only users via normal registration flows if not in CSV.

## 3. Students and parents

7. **Students** — Import `STUDENTS` (`students.csv`). Each row must reference an existing **`classid`**; **`sectionid`** is optional (blank allowed). Use **`parentemail`** (+ optional `parentname`, `parentphone`) to **provision or reuse** a parent portal user and set `student.parent_id`. Use **`notifycredentials=Y`** to enqueue **in-app notification + SMS outbox** (mock worker marks SMS sent in demo environments).

## 4. Dependent academic and operations data

8. **Timetable, attendance, fees, transport, etc.** — After rosters exist: assignments, fee structures, routes, and other modules as supported by their own APIs or future import types.

## Retry policy

- Failed rows stay on the job with **per-line errors** and original **payload JSON**. Admin uses **Retry failed** to re-queue only failed lines after fixing data or dependencies.
- Re-importing the **same** admission number or teacher email will hit **duplicate** rules by design.

## ZIP layout (current implementation)

| `jobType` (API) | CSV file name inside ZIP |
|-----------------|---------------------------|
| `STUDENTS`      | `students.csv`            |
| `TEACHERS`      | `teachers.csv`            |
| `STAFF`         | `staff.csv`               |
| `CLASSES`       | `classes.csv`             |

Excel users should **Save as CSV** and pack into a `.zip` archive.

## Export

CSV exports for students and teachers match the import column shape where applicable (`GET /api/v1/import-export/export/students.csv` and `.../teachers.csv`) so admins can round-trip edit and re-import.

## Demo / QA sample jobs (UI)

- **Flyway `V31`**: seeds `import_jobs` + lines for default tenant **`t1`** (`admin@school.com`) so Import / export shows history without Java demo profiles.
- **`V30`**: optional SQL for St. Xavier’s tenant when `tenant_configs` already exists (e.g. restored DB).
- **`DemoDataSeedService`** (profiles `dev`, `showcase-seed`, `demo-seed`): idempotently adds sample jobs for **St. Xavier’s** (`admissions-batch-2026-demo.zip`) and **Meridian Ridge** (`mridge-faculty-import-demo.zip`) after those workspaces are created. Safe to replace with real jobs once admins run live imports.
