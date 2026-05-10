# Academic Year Scope Sign-off Matrix

This matrix records end-to-end scope decisions after the final tenant/year audit.

## A) Enforced Year Scope (Required)

These tables/entities are now enforced for both `tenant_id` and `academic_year_id`:

- `attendance_records` / `AttendanceRecord`
- `timetable_entries` / `TimetableEntry`
- `exams` / `Exam`
- `mark_records` / `MarkRecord`
- `school_classes` / `SchoolClass`
- `class_teacher_assignments` / `ClassTeacherAssignment`
- `subject_teacher_assignments` / `SubjectTeacherAssignment`
- `fee_structures` / `FeeStructure`
- `fee_payments` / `FeePayment`
- `fee_payment_attempts` / `FeePaymentAttempt`
- `fee_transactions` / `FeeTransaction`
- `announcements` / `Announcement`
- `notifications` / `Notification`
- `communication_events` / `CommunicationEvent`
- `book_issues` / `BookIssue`
- `leave_requests` / `LeaveRequest`

### Enforcement layers active

- Schema-level `academic_year_id` on required tables.
- Composite query indexes include tenant/year on key paths.
- Hibernate year filter on scoped entities.
- Write guard listener validates/fills year from request context.
- Statement inspector blocks unsafe SQL lacking tenant/year predicates for scoped tables.

## B) Intentionally Excluded from Year Scope

These are intentionally tenant-scoped or global platform/system data, not academic-year partition data:

- Identity/Auth: `users`, `refresh_tokens`, `email_verification_tokens`, `otp_verifications`
- Tenant config/platform: `tenant_configs`, `platform_tenant_purge_jobs`, RBAC catalogs and mapping metadata
- Audit/platform ops: `audit_logs`, `financial_audit_events`, purge lifecycle records
- Infra integration logs/webhooks: payment webhook events, outbox infrastructure rows where year semantics are not primary

## C) Design Rule for Future Tables

Any new table that stores year-bound business transactions must include:

- `tenant_id` (not null)
- `academic_year_id` (not null)
- index starting with `(tenant_id, academic_year_id, ...)`

And the entity must:

- implement `AcademicYearScopedEntity`
- include `@Filter(name = AcademicYearScopedFilter.NAME, ...)`
- include `@EntityListeners(AcademicYearScopeGuardListener.class)`
