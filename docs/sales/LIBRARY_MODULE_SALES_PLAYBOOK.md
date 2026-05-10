# Library Module Sales Playbook (Non-Technical)

## What this module solves

The Library module gives schools a complete flow for:

- Managing the book catalog
- Issuing and returning books
- Tracking fines and overdue books
- Giving teachers, staff, students, and parents the right level of access
- Enforcing school-level policies without custom coding

This is designed for real school operations and aligns with how large ERP products separate desk operations from self-service access.

## Core operating model (easy to explain)

The module runs in two lanes:

- **Desk lane (library office operations)**
  - Used by librarian/circulation desk personas
  - Can add books, deactivate/restore titles, issue, and return
- **Member lane (self-service visibility)**
  - Used by teacher/student/school staff/parent personas with member read access
  - Can view catalog and eligible own/linked borrowing history
  - Cannot do circulation mutations

## Feature control for each school

Schools can independently turn Library on/off using tenant feature settings.

- **Feature ON**: library is available, then RBAC decides who can do what
- **Feature OFF**: library is hidden/blocked for everyone in that school

This protects multi-tenant environments and supports phased rollout by campus.

## RBAC highlights for sales conversations

- `SCHOOL_LIBRARY_WRITE`
  - Full desk circulation and catalog actions
- `SCHOOL_LIBRARY_READ`
  - Desk read visibility
- `SCHOOL_LIBRARY_MEMBER_READ`
  - Self-service member visibility (catalog + own/linked history)

Default examples:

- Librarian/library desk role -> write/read lane
- Teacher role -> member lane (plus desk only if explicitly assigned)
- School staff baseline -> member lane ready

## Borrower personas supported

Library circulation supports multiple borrower types:

- Student
- Staff (teacher, non-teaching staff, library staff, admin)
- Guardian
- Other (ad-hoc named borrower when school allows it)

This is implemented through a borrower strategy model so future borrower integrations can be added without redesigning circulation.

## School-level borrower policy (new enterprise capability)

Each school can define allowed borrower types (for example, only `STUDENT` + `STAFF`).

Why this is valuable:

- Different school policies across K-12, coaching, college-prep, etc.
- Compliance-ready control for who can borrow
- No deployment needed for policy changes

## Typical workflows supported

- Catalog setup and title lifecycle (active/inactive)
- Issue by librarian desk to approved borrower types
- Return flow with fine per day logic
- Overdue tracking and circulation status filters
- Member self-service history for eligible personas

## API and product readiness indicators

- Backward-compatible APIs for existing student circulation
- New enterprise APIs for generic borrower circulation
- Multi-tenant safe guards (feature + permission checks)
- Extensible borrower registry for future integrations

## Positioning statements for sales

- "You can start with student borrowing only and later add staff/guardian borrowing without a reimplementation."
- "Every school gets independent control over feature rollout and borrower policy."
- "Desk operations and self-service access are separated, which improves governance and reduces accidental misuse."
- "The model is future-ready for integrations and scale across campuses."

## Quick FAQ

- **Can non-teaching staff borrow?**  
  Yes, if borrower policy allows `STAFF` and desk user issues the book.

- **Can students issue books themselves?**  
  No. Issuing/returning is desk lane by design. Students get self-service visibility.

- **Can a school disable guardian borrowing?**  
  Yes. Borrower policy can restrict allowed borrower types.

- **What happens if library feature is off?**  
  Module access is blocked for that school regardless of role.
