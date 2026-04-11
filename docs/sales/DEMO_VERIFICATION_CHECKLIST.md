# Demo verification checklist (sales / success)

Run through this in the **demo tenant** with mocks **off** if you are proving live API behavior; use mocks only for offline pitches. Check each item you intend to verbalize in the meeting.

## Before the call

- [ ] Know **school code** and **user passwords** (see `backend-spring/docs/DEMO_LOGIN_CREDENTIALS.md` if maintained in repo).
- [ ] Confirm **demo seed** ran (fresh DB or known good QA org).
- [ ] Browser: clear stale local storage if login loops (old mock tokens).

## Super admin (if shown)

- [ ] Login; platform-only surfaces visible; no other-tenant data.
- [ ] Platform inbox / school admin search works as designed.

## School admin

- [ ] Dashboard loads with notifications / widgets.
- [ ] Students list; open one student record.
- [ ] Classes / sections; academic year visible.
- [ ] Fees: at least one structure and payment row.
- [ ] Exams: list exams; open one; timetable + marks for staff.
- [ ] Publish results flag behaves (parents see marks only when published).
- [ ] Attendance: open class for **today** as teacher context vs **past** as admin if demoing policy.
- [ ] Chat: start or open a thread; inbox refresh.

## Teacher

- [ ] Roster / class list matches seed.
- [ ] Attendance: can submit for **today** for assigned or cover class.
- [ ] Attendance: **cannot** change a **past** date (expect clear error).
- [ ] Exams: timetable edit (if role allows); mark entry for scoped class.
- [ ] Chat: message parent of student in roster (if enabled).

## Parent

- [ ] Children selector lists **only** linked students.
- [ ] Attendance stats + records for selected child only.
- [ ] Fees: obligations + pay flow (demo payment).
- [ ] **Exams** tab: exam list only for child’s **class/section**; timetable rows only for that child; marks only when **published**.
- [ ] **Marks** tab: aggregated published marks; exam names resolve.
- [ ] Chat: only children’s **class teachers**; same teacher does not duplicate after repeat “start chat”.
- [ ] Settings: profile / photo for parent.

## Student (if enabled in demo)

- [ ] Login; scoped dashboard and own data only.

## Library staff

- [ ] Catalog visible; circulation action if seeded.

## Closing

- [ ] Logout; no data from prior tenant after switching school code.

---

*Add a row per new module when the product team ships features—keep this file the single “go/no-go” gate for demos.*
