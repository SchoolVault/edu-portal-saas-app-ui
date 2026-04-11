# Role capabilities matrix (sales reference)

This document summarizes what each **role** can do in the school ERP web app. Use it to set expectations before a demo. Exact menu labels may vary by tenant configuration; APIs enforce tenant isolation and row-level rules (e.g. parents only see their own children).

| Capability | Super admin | Admin | Teacher | Parent | Student | Library staff |
|------------|-------------|-------|---------|--------|---------|---------------|
| **Tenant / school setup** (branding, school code, feature toggles) | Platform-level ops | Yes | No | No | No | No |
| **Users & roles** | Limited to platform bridge | Yes | No | No | No | No |
| **Students & classes** | — | Full CRUD, promotions | Roster / marks / attendance in scope | No | No | No |
| **Attendance** | — | View all; **edit any date** | Mark / correct **only today** for assigned class or **cover** slot; view scoped classes | View **own child** only | If enabled: own | No |
| **Examinations** | — | Create cycles, publish results, full timetable | Timetable + mark entry in scope | **Scoped exams**: timetable + **published** marks for **child’s class/section only** | If enabled: own | No |
| **Fees** | — | Structures, reconciliation | Usually view / limited | **Pay** + receipts + obligations for **linked children** | No | No |
| **Timetable** | — | School-wide | Own / class scope | **Not** full school (child context via portal) | Own if enabled | No |
| **Chat / inbox** | Message school admins (platform) | Directory, start threads | Parent / admin per policy | **Class teachers** of own children only (deduped thread per teacher) | — | — |
| **Announcements** | — | School broadcasts | See targeted | See targeted (class/parent scope when enforced) | See targeted | See targeted |
| **Library** | — | Oversight | — | — | — | **Catalog & circulation** |
| **Transport / hostel / payroll / operations** | — | Admin modules | Subset (e.g. trip visibility) | Parent may see child transport where implemented | — | — |
| **Reports** | — | Broad | Class / subject scoped | Via parent portal aggregates | Own if enabled | — |
| **Settings / profile** | Platform profile | Tenant config + own photo | Own profile / photo | Own profile / photo; **linked children** read-only school fields | Own if enabled | Own |

### Attendance policy (real-world alignment)

- **Same calendar day**: class teacher or **cover teacher** for that class/section/date may save or correct attendance.
- **After that day**: only **administrators** may change historical rows (audit-friendly). Teachers see history read-only and request corrections through the office if needed.

Some schools add a “correction request” workflow later; the rule above is a common baseline.

### Parent data scope (critical for demos)

Parents **never** receive another class’s exams, timetable rows, marks, or attendance. The backend filters by the child’s **classId** / **sectionId** and exam **scope**; marks appear only when **results are published**.

---

*Last updated with product behavior as of the parent exam portal and attendance policy changes.*
