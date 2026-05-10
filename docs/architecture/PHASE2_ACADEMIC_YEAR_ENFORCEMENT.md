# Phase 2 Academic-Year Enforcement

Phase 2 hardens scope integrity introduced in Phase 1.

## What is enforced

- All phase-1 scoped tables are backfilled to remove null `academic_year_id`.
- `academic_year_id` is changed to `NOT NULL` for:
  - `attendance_records`
  - `mark_records`
  - `fee_payments`
  - `fee_transactions`
  - `notifications`
  - `book_issues`
  - `leave_requests`
- Runtime writes are guarded by `AcademicYearScopeGuardListener`:
  - If scope context is missing, write is rejected.
  - If entity year mismatches context year, write is rejected.

## Request safety behavior

- For authenticated tenant requests without configured active academic year:
  - API now fails fast with `400 Bad Request`.
- Platform super admin request path remains exempt from this hard failure.

## Operational note

If any tenant has no current academic year configured, this phase intentionally blocks regular API writes until setup is corrected. This is by design to prevent unscoped production data.
