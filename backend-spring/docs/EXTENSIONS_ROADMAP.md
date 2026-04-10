# Extensions roadmap (real-school scenarios)

Baseline implementations are in the codebase; extend tables/services as you harden each area.

## Substitute / cover attendance — **done (v1)**

- **DB:** `attendance_cover_assignments` (Flyway `V25__operations_extensions.sql`).
- **API:** `GET/POST /api/v1/attendance/covers`, `POST .../{id}/cancel`, `GET .../all-active` (admin).
- **Scope:** `TeacherRosterScopeService` unions cover classes per date; `AttendanceService` enforces `teacherMayMarkAttendance` for get/mark/stats/monthly.
- **UI:** Admin **Operations hub → Covers**; teachers see **Attendance → Your cover assignments** for the selected date.
- **Next:** Link `timetable_entry_id` to real timetable slots; period-level cover rules.

## Non-teaching staff, drivers — **done (v1)**

- **DB:** `operational_staff` with `staff_role`, optional `user_id`, optional `transport_route_id`.
- **API:** `GET/POST /api/v1/operations/staff` (admin).
- **UI:** Operations hub → **Staff**.
- **Next:** `staff_qualification` / `staff_document` tables; link driver rows to transport routes in UI.

## Promotion, unequal sections — **done (v1)**

- **API:** `sectionPlacementNote` on promotion preview; `GET /api/v1/academic/promotion/split-preview` (heuristic round-robin by capacity).
- **UI:** Academic → Class promotion: warning banner + **Split preview** table.
- **Next:** Optional auto-execute multi-section batch; respect hard capacity limits.

## Daily operations — **done (v1)**

- **DB:** `visitor_logs`, `gate_passes`, `inventory_items`, `fee_reminder_queue`.
- **API:** under `/api/v1/operations/...` (admin): visitors check-in/out, gate passes, inventory upsert, fee reminder enqueue, payroll accrual **summary stub**.
- **UI:** Operations hub tabs.
- **Next:** Background worker for `fee_reminder_queue`; gate kiosk mode; inventory stock movements table; payroll accrual fed from real payroll runs.
