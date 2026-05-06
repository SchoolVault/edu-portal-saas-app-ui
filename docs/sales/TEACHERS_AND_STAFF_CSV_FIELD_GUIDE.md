# Teacher and staff import (`teachers.csv` / `staff.csv`) — field guide for sales and onboarding

This matches **`ImportCanonicalFieldCatalog`**, **`ImportBulkRowValidator`**, and **`ImportRowExecutor`** in the SchoolVault backend. Use this for tenant onboarding, not ad‑hoc “Yes/No” in wrong columns (which caused `Invalid libraryrole` when `Yes`/`No` were put in `libraryrole` — that column is **not** a boolean).

## How large Indian K–12 ERPs usually treat bulk staff files

- **One row = one person**; identity and HR fields (name, phone, optional bank) are in the file.
- **Coarse “portal / job family” in CSV** (teacher vs library vs admin-style staff), **not** full RBAC. Fine permissions (which menu, which report) are set **after** import in the **admin security / roles** screen — same idea as most legacy campus ERPs.
- **Class teacher** is often a **second pass** in the UI, or a column when sections are already stable in Academic master data.

## Column reference (in file order)

| Column | Required / notes | Valid values / pattern |
|--------|------------------|-------------------------|
| `firstname` | **Required** | Text |
| `lastname` | **Required** | Text |
| `email` | Optional | If `portalpassword` is set, **email is required** |
| `phone` | **Required** | **10-digit Indian mobile** in the CSV (no `+91` / E.164 in the sheet); imports normalize internally. Example: `9876543210` |
| `qualification` | Optional | e.g. B.Ed, M.Ed |
| `specialization` | Optional | e.g. Mathematics, English |
| `joindate` | Optional | `yyyy-MM-dd` |
| `salary` | Optional | Decimal number |
| `subjects` | Optional | Use `\|` to separate, e.g. `Mathematics\|Physics` |
| `createportal` | Optional | `Y`/`N`/`yes`/`1` = create login (default: **create** if empty) |
| `portalpassword` | Optional | Min **8** chars; only when pre-seeding password; if set, `email` required |
| `portalrole` | Optional | **`TEACHER`**, or aliases **`T`**, `TCH`. For **library** staff use **`LIB`** / **`LIBRARY`**, **`LIBRARY_STAFF`**. *Empty on `teachers.csv` → defaults to **TEACHER**; empty on `staff.csv` → defaults to **LIBRARY_STAFF** (see code).* |
| `libraryrole` | **Must not be `Yes`/`No`** | Empty for teachers. For **library** rows only: **`LIBRARIAN`**, **`ASSISTANT`**, **`HEAD`**, or leave empty and use `AUTO` (treated as auto). `LIBRARY` portal + empty → import defaults to **LIBRARIAN** in app logic. |
| `schoolrolecodes` | Optional | Comma-separated **school responsibility role codes** for this tenant (same codes as **Settings → Staff roles & access**), validated against the school’s catalog. Common catalog examples: `ACADEMIC_STAFF`, `FEE_OFFICE`, `LIBRARY_OPERATIONS`, `PAYROLL_OFFICE`, `EXAM_OFFICE`, `TENANT_SETTINGS` (settings & finance profile desk — **not** full tenant admin), `TRANSPORT_LOGISTICS` (routes/vehicles/drivers only), `HOSTEL_RESIDENCE_DESK` (hostel blocks/rooms/allocations only), `TRANSPORT_HOSTEL_LOGISTICS` (combined transport+hostel pack for one officer). Usually stack with `BASE_SCHOOL_STAFF`, e.g. `"BASE_SCHOOL_STAFF,TRANSPORT_LOGISTICS"`. **Requires a portal user on the row** (`createportal` + `email` when using `portalpassword`, or email/phone as applicable) — omit until the account exists if you create portals in a second pass. |
| `importmode` | Optional | **Empty = CREATE_ONLY**; or **`UPSERT`**, `U`, `UPDATE`; or **`SKIP`**, `IGNORE`, `SKIP_IF_EXISTS` |
| `bankaccountholder` … `bankifsc` | Optional | PII — only if the school provides |
| `notifycredentials` | Optional | `Y`/`N` to trigger credential SMS to **this** user when a portal is created (not the same as `libraryrole`!) |
| `classteacherfor` | Optional | Examples: `Class 6-A`, `6A`, `Class 10` (class-only; see `BulkImportAcademicResolver` rules). **Not used for** `LIBRARY_STAFF` / library portal — leave blank for library rows. **Each class+section homeroom can appear on at most one row** in a file: `Class 6-A` and `6A` are the *same* slot, so you cannot assign two different teachers to both in one import. |
| `classteacherclassid` / `…sectionid` / `…name` / `…` | Optional | Use when IDs or names are known from **Academic**; otherwise use `classteacherfor` |
| `classteacheracademicyearid` | As needed | Academic year for resolving class/section; can follow tenant default in product |

## Role behaviour (aligned with `ImportRowExecutor`)

- **`portalrole=TEACHER`** (or `T`/`TCH`): **`libraryrole` is forced to empty** in code — do not fill it for standard teachers.
- **`portalrole=LIBRARY` / `LIBRARY_STAFF` / `LIB`**: set **`libraryrole`** to `LIBRARIAN`, `ASSISTANT`, or `HEAD` (or leave blank for default `LIBRARIAN` in executor).
- **`schoolrolecodes`** (optional): assigns **school job roles** to the staff member’s portal account. Typical examples: teachers → `ACADEMIC_STAFF`; library team → `LIBRARY_OPERATIONS`; fee office → `FEE_OFFICE`; transport-only desk → `TRANSPORT_LOGISTICS`; hostel-only desk → `HOSTEL_RESIDENCE_DESK`; one person for both → `TRANSPORT_HOSTEL_LOGISTICS`; branding/finance settings desk → `TENANT_SETTINGS` (stack with `BASE_SCHOOL_STAFF` for `SCHOOL_STAFF` rows). Leave blank to rely on **Settings** assignments after import.
- **Raven / admin** assigning *any* feature permission in the app is a **separate** RBAC layer, **not** expressed row-by-row in this CSV.

## Files in this folder

- **`TEACHERS_IMPORT_TEMPLATE.csv`** — `TEACHERS` job: mostly teachers, mixed homeroom examples.
- **`STAFF_IMPORT_TEMPLATE.csv`** — `STAFF` job: library-focused rows (no `classteacherfor`).

**Job type when uploading:** choose **`TEACHERS`** or **`STAFF`** in the import UI; file name in ZIP should be `teachers.csv` or `staff.csv` as per `ImportJobType` (or follow your deployment’s ZIP layout).

## Difference from the API export of teachers

`GET /api/v1/import-export/export/teachers.csv` may emit columns in a **different** order and **omit** `portalpassword` — the **import** is authoritative with **`ImportCanonicalFieldCatalog`**. For sales packs, use the templates in **`docs/sales/`** and this guide.
