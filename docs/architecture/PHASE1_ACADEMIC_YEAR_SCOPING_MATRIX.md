# Phase 1 Academic-Year Scoping Matrix

This matrix defines the first rollout slice before strict `NOT NULL` enforcement.

## Scope Principles

- Keep migration additive and backward-compatible.
- Backfill where deterministic joins exist.
- Add `(tenant_id, academic_year_id)` indexes for predictable read paths.
- Defer strict constraints to Phase 2 after data quality validation.

## Entity + Table Rollout (Phase 1)

| Module | Entity | Table | Column Added | Backfill Strategy | Index Added |
|---|---|---|---|---|---|
| Attendance | `AttendanceRecord` | `attendance_records` | `academic_year_id` | `class_id -> school_classes.academic_year_id` | `idx_att_tenant_year` |
| Exams | `MarkRecord` | `mark_records` | `academic_year_id` | `exam_id -> exams.academic_year_id` | `idx_marks_tenant_year` |
| Fees | `FeePayment` | `fee_payments` | `academic_year_id` | `fee_structure_id -> fee_structures.academic_year_id` | `idx_fee_payments_tenant_year` |
| Fees | `FeeTransaction` | `fee_transactions` | `academic_year_id` | `fee_payment_id -> fee_payments.academic_year_id` | `idx_fee_txn_tenant_year` |
| Notification | `Notification` | `notifications` | `academic_year_id` | no deterministic source; keep nullable in phase 1 | `idx_notifications_tenant_year` |
| Library | `BookIssue` | `book_issues` | `academic_year_id` | no deterministic source; keep nullable in phase 1 | `idx_book_issues_tenant_year` |
| Leave | `LeaveRequest` | `leave_requests` | `academic_year_id` | `start_date` in `academic_years.start_date..end_date` range | `idx_leave_requests_tenant_year` |
| Existing scoped entities | `Exam`, `TimetableEntry` | `exams`, `timetable_entries` | already present | existing values | existing indexes already exist; extend in phase 2 if required |

## Runtime Enforcement Added

- `AcademicYearContext` request/worker scope.
- `AcademicYearContextFilter` for automatic context binding.
- `TenantHibernateFilterSupport` now enables both:
  - tenant filter (`tenant_id = :tenantId`)
  - academic year filter (`academic_year_id = :academicYearId`) when context is present.
- Async context propagation updated in `TenantAndMdcTaskDecorator`.

## Validation Checklist Before Phase 2

- Null ratio report per table for `academic_year_id`.
- 10 high-traffic APIs verify no cross-year leakage.
- Slow query review on new `(tenant_id, academic_year_id)` indexes.
- Identify notification/library historical backfill heuristic.
