# Exam Module Overview for Schools (Non-Technical)

## What This Module Solves

The Exam module is built to support Indian schools of different sizes:

- small town and rural schools running simple class tests
- mid-size schools with term exams and practicals
- advanced schools needing approval and strict control

The same module supports all of them using configurable exam setup and role-based control.

## Core Capabilities

- Admin or teacher can create exams with custom exam type (for example: unit test, practical, viva, midterm, final)
- School can define marking strategy per exam (marks, grades, hybrid, weightage, rubric-ready)
- Exam audience can be set at class level or class + section level
- Timetable rows include date, time, subject, room, and notes
- Results visibility can be controlled for parents
- Multi-language UI support (English and Hindi)

## Approval and Governance Workflow

The module supports school governance:

1. Teacher creates exam (typically for class tests)
2. Exam goes to **Pending Approval**
3. Admin can **Approve**, **Approve & Publish**, or **Reject**
4. After finalization, admin can **Freeze** exam to lock edits

This reduces accidental edits and improves process control.

## Data Safety and Conflict Protection

To prevent wrong entries and stale data:

- Timetable validation checks time order and overlap conflicts
- Duplicate subject-slot entries are blocked for same class/section/date
- Marks cannot be negative or greater than maximum
- Database-level unique constraints prevent duplicate mark rows
- Workflow locks block editing when exam is frozen/published

## Teacher Permission Control (Important)

Only teachers assigned to a subject/class/section can upload marks for that subject.

- UI shows scoped marks-entry options
- Backend re-validates permission before saving
- Unauthorized uploads are rejected

This ensures secure and role-correct mark entry.

## School-Facing Business Benefits

- Works for 90%+ Indian school exam patterns without custom coding each time
- Reduces exam-operation mistakes
- Improves parent trust with controlled publishing
- Supports growth from basic schools to advanced processes on the same platform

## Current Delivery Status

- Phase 1: custom exam type + marking scheme + strong validation + conflict checks - **Implemented**
- Phase 2: approval workflow + publish/freeze controls + stricter teacher permissions - **Implemented**
- Phase 3: advanced customization safeguards (room/invigilator mandatory rules, per-day paper limits, richer schedule metadata) - **Implemented**

## Sales Talking Points (Quick)

- "You can run simple unit tests and board-style exams in one platform."
- "Teachers can create drafts; admin controls approval and publishing."
- "Parents only see what the school publishes."
- "System prevents timetable conflicts and invalid marks before data is saved."
- "Supports Hindi/English and school-specific configurations."
