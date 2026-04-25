# School Onboarding Import Pack (Sales Ops)

This pack is for end-to-end school setup from the Super Admin flow plus Import/Export wizard.

## What can and cannot be imported

- Admin user: created from Super Admin onboarding flow (not via import CSV).
- Academic year: create in Academic module first (not via import CSV in current implementation).
- Classes and Sections: import via `CLASSES` CSV.
- Students: import via `STUDENTS` CSV.
- Teachers: import via `TEACHERS` CSV.
- Timetable: import via `TIMETABLE` CSV.
- Fee structures: import via `FEE_STRUCTURES` CSV.

## Required onboarding sequence (must follow)

1. Create school tenant from Super Admin module.
2. Login as school admin (or stay as super admin with import-export access).
3. During school onboarding, set the first academic year in the onboarding form.
4. Ensure this academic year is marked as Current in Academic module.
5. Import `01_classes_sections.csv` with job type `CLASSES`.
6. Import `02_teachers.csv` with job type `TEACHERS`.
7. Import `03_students.csv` with job type `STUDENTS`.
8. Import `04_timetable.csv` with job type `TIMETABLE`.
9. Import `05_fee_structures.csv` with job type `FEE_STRUCTURES`.
10. Verify records in Academic, Teachers, Students, Timetable, Fees screens.

Reason for this order:
- Students require class/section resolution.
- Classes and students files can auto-resolve to the Current academic year when `academicyearid` is blank.
- Teachers can be imported before/after students, but importing teachers before students is safer for complete setup.
- Timetable should be imported only after classes/sections and teachers are available.

## Important data preparation rules

- `academicyearid` is optional in classes/students files. When blank, importer uses Current academic year.
- If you provide `academicyearid`, it must be a valid numeric ID from your tenant.
- If no year is marked Current, importer falls back to the latest academic year configured for that tenant.
- This pack avoids empty CSV cells by using placeholders:
  - `CURRENT` for `academicyearid` (uses current academic year in tenant).
  - `AUTO` for optional numeric refs like `classid`, `sectionid`, `parentid` when name-based resolution is used.
- Date format must be `yyyy-MM-dd`.
- Time format must be `HH:mm` for timetable start/end.
- Email format must be valid.
- Teacher import login fields:
  - `phone` is mandatory (used for OTP login).
  - `email` is optional.
  - `portalpassword` is optional; when provided with `email`, teacher can sign in using email+password.
  - If `email` is blank, teacher can still sign in using mobile OTP.
- Use readable class names in files (recommended): `Class 6`, `Class 7`, etc. Numeric-only values like `6` are also accepted.
- `sections` in classes file is pipe-separated (example: `A|B|C`).
- Timetable section rule:
  - If the class has sections in Academic module, timetable rows must include `sectionname` (recommended) or `sectionid`.
  - If the class has no sections, keep both `sectionname` and `sectionid` blank.
- Student `gender` must be `male`, `female`, or `other`.
- `importmode`:
  - `UPSERT` = create or update existing by business keys.
  - `CREATE_ONLY` = fail if duplicate exists.
- Timetable import idempotency:
  - Re-importing the same slot (same class/section + day + period) updates that slot instead of creating duplicates.
- Fee structure import format:
  - `componentspec` is required.
  - Token format: `ComponentName:Amount[:Type]` (pipe-separated list).
  - Example: `Tuition:18000:TUITION|Lab:2000:LAB|Sports:1500:SPORTS`.
  - Supported types: `TUITION`, `TRANSPORT`, `LIBRARY`, `LAB`, `SPORTS`, `MISC` (unknown type defaults to `MISC`).
  - Identity key for idempotent upsert: `class + academicYear + structure name`.
  - `importmode`:
    - `UPSERT` = create if missing, update full component list if exists.
    - `CREATE_ONLY` = fail when same structure already exists.
    - `SKIP_IF_EXISTS` = keep existing structure unchanged.

## How to run in Import/Export wizard

For each file:
1. Go to Import/Export.
2. Select job type.
3. Upload CSV.
4. Review suggested column mapping.
5. Click Dry Run and fix any errors.
6. Queue import job.
7. Open line outcomes and verify success/fail rows.

### Visibility messages sales users should look for

- Dry run and queue now show an info note for academic year resolution.
- If a current year exists, you will see:
  - `Academic year not specified in file; using current academic year: <Year Name> (ID <id>).`
- If no current year is marked, you will see:
  - `No current academic year set; using latest academic year: <Year Name> (ID <id>).`
- This is informational (not an error). It confirms exactly which year will be used for class and student imports.
- If this year is not the one you want, stop and set the correct year as Current in Academic module, then run Dry Run again.

## Files in this pack

- `01_classes_sections.csv`
- `02_teachers.csv`
- `03_students.csv`
- `04_timetable.csv`
- `05_fee_structures.csv`

### Current load-test dataset sizing

- Classes: `8` (`Class 5` to `Class 12`)
- Sections: `2` per class (`A|B`) => `16` sections total
- Teachers: `20` total
- Subject coverage: `10` subjects with `2` teachers per subject
- Students: `400` (one parent profile mapping per student)
- Timetable: `672` rows (`16` sections × `6` weekdays × `7` periods)

Notes:
- Teacher emails are now realistic school-domain IDs.
- Student email is optional in import. Many rows intentionally keep it blank because most school students do not have personal email IDs.

### Import throttling for CPU-safe runs

The backend already supports a configurable pause between import orchestration pages:

- Env var: `APP_IMPORT_YIELD_MS`
- Example for your stress test: set `APP_IMPORT_YIELD_MS=10000` (10 seconds)

This helps reduce CPU spikes during long imports on lower-memory / shared instances.

## Real-school rollout tips

- Start with a pilot batch (10-20 rows) per file, then run full upload.
- Keep admission numbers and emails unique.
- Use `notifycredentials=Y` only when parents/teachers are ready to receive credentials.
