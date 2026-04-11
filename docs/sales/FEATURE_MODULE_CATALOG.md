# Feature & module catalog (sales reference)

High-level map of **modules** and what to show in a **school tenant** demo. Prefer the seeded demo org (e.g. St. Xavier’s bulk seed, Meridian Ridge) so lists are populated.

## Core platform

- **Authentication**: Login by school code + email/password; JWT session; profile and password change.
- **Tenant isolation**: All school data scoped by `tenant_id`; switching schools never leaks data.

## Academic

- **Academic years & terms**: Current year drives timetables, exams, fees.
- **Classes & sections**: Master structure for roster, exams, attendance.
- **Subjects & teacher assignments**: Links teachers to classes for scope (attendance, marks).

## People

- **Students**: Admissions, class/section, parent linkage, status.
- **Teachers**: Staff records tied to user accounts; homeroom / subject teaching.
- **Parents / guardians**: Portal users linked to one or more students.
- **Staff (other roles)**: Library, operations, etc., as enabled.

## Daily operations

- **Attendance**: Bulk mark by class/section/date; monthly views; teacher same-day rule; admin historical edits.
- **Timetable**: Week grid per class/section; teacher names and rooms.

## Examinations

- **Exam cycles**: Name, date range, status (upcoming / ongoing / completed / cancelled).
- **Scope**: Per class, optionally **per section** (narrower than whole grade).
- **Timetable**: Dated slots per subject with room and notes.
- **Marks**: Entry by class/section/subject; grading; **publish** gate for parent visibility.
- **Parent portal**: Lists only exams that include the child’s class/section; timetable filtered to **their** papers; marks only if **published**.

## Fees & finance

- **Fee structures** and components (tuition, transport, etc.).
- **Parent obligations** and checkout-style payments (demo gateway).
- **Receipts** and payment history per child.

## Communication

- **Inbox / chat**: Direct threads; policy restricts parent ↔ teacher to children’s class teachers; duplicate threads collapse to one per teacher pair.
- **Announcements**: Target audiences (all, teachers, parents, class, section).

## Extended modules (where seeded)

- **Library**: Titles, copies, issue/return.
- **Transport**: Routes, vehicles, student mapping.
- **Hostel**: Hostels, rooms, allocations.
- **Payroll**: Structures, payslips, disbursement flows (demo depth varies).
- **Operations hub**: School ops tasks / extensions as implemented.

## Reports & dashboards

- Role-specific dashboards; performance / class reports for staff; parent sees child-level summaries in portal.

---

Use **`DEMO_VERIFICATION_CHECKLIST.md`** before a live demo to click through each area you plan to mention.
