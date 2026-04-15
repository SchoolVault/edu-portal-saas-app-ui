# Phase 3 — Repository ports (high-value modules)

## Technical

- **`StudentPersistencePort`:** Application service depends on this interface; **`StudentPersistenceJpaAdapter`** delegates to Spring Data `StudentRepository`. Keeps the door open for CQRS/read models later.
- **`AttendancePersistencePort`:** Same pattern for attendance records.
- **Mappers:** `StudentResponseMapper` centralizes entity → DTO mapping for student responses (class/section names resolved via lookups).
- **Fees / exams / reports:** Fee and exam modules still use Spring Data where refactor cost is high; **student reads inside fees** go through `StudentPersistencePort` to avoid direct repository coupling from fees → student.

## Plain language

Student and attendance data access goes through a **stable internal API** inside the app. That makes it easier to optimize queries, split databases, or add read replicas later **without changing** every controller.
