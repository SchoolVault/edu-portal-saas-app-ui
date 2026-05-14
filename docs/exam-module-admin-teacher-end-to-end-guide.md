# Exam Module End-to-End Guide (Admin + Teacher)

This document explains how to use the Exam module flow-wise from start to finish, for both **Admin** and **Teacher** roles.

Scope of this guide is the current implemented behavior in the app (`/app/exams`).

---

## 1) Purpose of the Module

The Exam module is built to manage:

- exam cycle setup (name, year, board/session/term/assessment fields)
- class/section audience scope
- exam timetable planning
- marks entry and grading
- exam workflow approvals (submit, approve, reject, freeze)
- optional result publishing visibility
- configuration engine (grading/report/workflow/AI schemas by academic year)

---

## 2) Role Responsibilities

### Admin (Exam Office / School Admin)

Admin can typically:

- create new exam cycles
- edit exam metadata (until locked by workflow)
- configure exam engine schemas
- approve/reject workflows
- freeze exam edits
- manage publish actions
- review marks and timetable

### Teacher

Teacher can typically:

- view exam cycles within access scope
- work on timetable and marks where permission allows
- submit exam for approval (if in draft/rejected-like state)
- enter marks only when workflow allows

Important: exact permission visibility depends on RBAC in your tenant.

---

## 3) Workflow States You Will See

You will see badges like:

- `DRAFT`
- `PENDING_APPROVAL`
- `APPROVED`
- `PUBLISHED`
- `FROZEN`
- `REJECTED`

### Practical meaning

- **DRAFT**: initial working state (editable)
- **PENDING_APPROVAL**: waiting for admin decision
- **APPROVED**: approved and generally operational
- **PUBLISHED**: locked for further editing in key areas
- **FROZEN**: fully locked from edit operations
- **REJECTED**: sent back for correction

### Lock behavior (current system)

- Timetable editing is blocked for `PUBLISHED` and `FROZEN`
- Exam metadata editing is blocked for `PUBLISHED` and `FROZEN`
- Marks entry is blocked for `FROZEN`, `REJECTED`, `DRAFT`, `PENDING_APPROVAL`

---

## 4) Recommended End-to-End Sequence (Best Practice)

Use this exact sequence for clean operations:

1. Configure engine (optional but recommended first)
2. Create exam cycle
3. Define class/section scope
4. Build timetable
5. Submit for approval
6. Approve (and optionally publish)
7. Enter marks (in allowed states)
8. Freeze once final

This reduces rework and avoids workflow/state conflicts.

---

## 5) Admin Flow (Step-by-Step)

## Step A: Open module

- Navigate to `Exams` from sidebar (`/app/exams`)
- Use search and cards to locate existing cycles

## Step B: Configure engine (recommended)

- Click **Configure engine**
- Choose academic year
- Optionally apply board preset (CBSE/ICSE/State)
- Save config blocks:
  - `GRADING_SCHEMA`
  - `REPORT_CARD_SCHEMA`
  - `WORKFLOW_SCHEMA`
  - `AI_SCHEMA`

Use this first so exam/report behavior is consistent before live data entry.

## Step C: Create exam

- Click **Create exam**
- Fill:
  - Exam name
  - Exam type
  - Board (`boardCode`)
  - Session (`sessionType`)
  - Term (`termCode`)
  - Assessment type (`assessmentKind`)
  - Marking scheme
  - Advanced rules (max papers/day, room/invigilator requirements)
  - Academic year
  - Start/end dates
  - Class and section scope
- Click **Create**

## Step D: Edit exam (if needed)

- Select exam card
- Click **Edit exam**
- Update metadata/scope fields
- Click **Update**

Note: edit is blocked when state is `PUBLISHED` or `FROZEN`.

## Step E: Build timetable

- Open **Timetable** tab
- Add rows with date/time/subject/class/section/room/invigilator
- Click **Save timetable**

The system validates conflicts and rules based on config/workflow constraints.

## Step F: Workflow control

- **Submit for approval** when ready
- **Approve** or **Approve & publish**
- **Reject** when corrections are needed
- **Freeze** when final lock is required

## Step G: Publish result visibility

- Results visibility is controlled at exam level
- Parent-side result view depends on publish setting

---

## 6) Teacher Flow (Step-by-Step)

## Step A: Open and select exam

- Go to `Exams`
- Select an exam card from list

## Step B: Understand current state

- Check workflow badge before editing
- If `DRAFT`/`PENDING_APPROVAL`/`REJECTED`, marks save may be blocked

## Step C: Timetable updates (if permitted)

- Go to **Timetable**
- Edit only if action controls are enabled
- Save timetable

## Step D: Marks entry

- Go to **Marks** tab
- Select class/section
- Choose subject
- Enter max marks
- Fill student marks
- Click **Save marks**

If marks save is disabled or blocked, usually the exam state is not eligible yet.

## Step E: Submit for approval

- If available, click **Submit for approval**
- Wait for admin to approve/publish

---

## 7) Parent-Impact Awareness (for Admin/Teacher)

- Parent can view timetable (read-only)
- Parent marks/results visibility depends on publish settings
- If not published, parent sees “results not published yet”

---

## 8) Common Errors and What to Do

### “Save timetable” blocked or fails

- Check workflow state (`PUBLISHED`/`FROZEN` lock edits)
- Check missing required fields (class/date/time/subject)
- Check max papers/day and slot conflicts

### “Save marks” blocked

- Check exam state (must be allowed state, not draft/pending/rejected/frozen)
- Ensure subject and class are selected
- Ensure marks are numeric and within max range

### Cannot see create/edit/config buttons

- RBAC/role permission likely missing
- confirm with admin role permissions

---

## 9) Operational Checklist (Admin)

- [ ] engine configured for academic year
- [ ] exam created with correct board/session/term/assessment
- [ ] class/section scope reviewed
- [ ] timetable validated and saved
- [ ] submitted and approved
- [ ] marks entered and reviewed
- [ ] results publish decision taken
- [ ] exam frozen after closure

---

## 10) Quick SOP (Teacher)

- [ ] open assigned exam
- [ ] verify state badge
- [ ] complete timetable tasks (if assigned)
- [ ] enter marks with correct subject/class
- [ ] submit for approval when ready
- [ ] re-check after admin action

---

## 11) Governance Notes

- Use one exam cycle per clear academic event (avoid duplicate overlapping cycles)
- Freeze only after verification, because freeze is a lock-control step
- Keep engine configs versioned by academic year and board policy

---

If you want, I can also create a second companion doc: **“Exam Module Troubleshooting Runbook”** (problem → root cause → fix commands) for support and QA teams.
