-- Extra academic + timetable rows for default tenant t1 (parity with mock-heavy UI / local integration).
-- Idempotent: uses NOT EXISTS on names and admission numbers.

SET @demo_tenant := 't1';
SET @ay := (SELECT id FROM academic_years WHERE tenant_id = @demo_tenant AND is_current = TRUE LIMIT 1);
SET @u_parent := (SELECT id FROM users WHERE tenant_id = @demo_tenant AND email = 'parent@school.com' LIMIT 1);
SET @teach_id := (SELECT id FROM teachers WHERE tenant_id = @demo_tenant AND email = 'teacher@school.com' LIMIT 1);

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 6', 6, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 6' AND c.academic_year_id = @ay
  );

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 9', 9, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 9' AND c.academic_year_id = @ay
  );

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 11', 11, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 11' AND c.academic_year_id = @ay
  );

SET @c6 := (SELECT id FROM school_classes WHERE tenant_id = @demo_tenant AND name = 'Class 6' AND academic_year_id = @ay LIMIT 1);
SET @c9 := (SELECT id FROM school_classes WHERE tenant_id = @demo_tenant AND name = 'Class 9' AND academic_year_id = @ay LIMIT 1);
SET @c11 := (SELECT id FROM school_classes WHERE tenant_id = @demo_tenant AND name = 'Class 11' AND academic_year_id = @ay LIMIT 1);

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @c6, 40, 0, TRUE, FALSE
WHERE @c6 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c6 AND s.name = 'A');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'B', @c6, 40, 0, TRUE, FALSE
WHERE @c6 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c6 AND s.name = 'B');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @c9, 40, 0, TRUE, FALSE
WHERE @c9 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c9 AND s.name = 'A');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'B', @c9, 40, 0, TRUE, FALSE
WHERE @c9 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c9 AND s.name = 'B');

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @c11, 35, 0, TRUE, FALSE
WHERE @c11 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @c11 AND s.name = 'A');

SET @s6a := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c6 AND name = 'A' LIMIT 1);
SET @s9a := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c9 AND name = 'A' LIMIT 1);
SET @s9b := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c9 AND name = 'B' LIMIT 1);
SET @s11a := (SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @c11 AND name = 'A' LIMIT 1);

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Jordan', 'Lee', 'jordan.l@school.com', '+1-555-0301', '2013-04-20', 'MALE',
    @c6, @s6a, '601', 'DEMO-V27-0601', '2025-06-01',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @c6 IS NOT NULL AND @s6a IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0601');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Sam', 'Rivera', 'sam.r@school.com', '+1-555-0302', '2013-08-11', 'OTHER',
    @c6, @s6a, '602', 'DEMO-V27-0602', '2025-06-01',
    NULL, '—', 'ACTIVE', TRUE, FALSE
WHERE @c6 IS NOT NULL AND @s6a IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0602');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Nina', 'Park', 'nina.p@school.com', '+1-555-0303', '2011-01-30', 'FEMALE',
    @c9, @s9a, '901', 'DEMO-V27-0901', '2024-06-01',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @c9 IS NOT NULL AND @s9a IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0901');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Chris', 'Nguyen', 'chris.n@school.com', '+1-555-0304', '2011-11-02', 'MALE',
    @c9, @s9b, '915', 'DEMO-V27-0915', '2024-06-01',
    NULL, '—', 'ACTIVE', TRUE, FALSE
WHERE @c9 IS NOT NULL AND @s9b IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-0915');

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Taylor', 'Brooks', 'taylor.b@school.com', '+1-555-0305', '2009-06-18', 'FEMALE',
    @c11, @s11a, '1101', 'DEMO-V27-1101', '2023-06-01',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @c11 IS NOT NULL AND @s11a IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'DEMO-V27-1101');

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c6, @s6a, 'MONDAY', 1, '08:00:00', '08:45:00', 'Mathematics', @teach_id, 'Sarah Mitchell', 'Room 101', FALSE
WHERE @ay IS NOT NULL AND @c6 IS NOT NULL AND @s6a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c6 AND t.section_id = @s6a
        AND t.day = 'MONDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c6, @s6a, 'MONDAY', 2, '08:45:00', '09:30:00', 'English', @teach_id, 'Sarah Mitchell', 'Room 101', FALSE
WHERE @ay IS NOT NULL AND @c6 IS NOT NULL AND @s6a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c6 AND t.section_id = @s6a
        AND t.day = 'MONDAY' AND t.period = 2 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c9, @s9a, 'TUESDAY', 1, '08:00:00', '08:45:00', 'Science', @teach_id, 'Sarah Mitchell', 'Lab 1', FALSE
WHERE @ay IS NOT NULL AND @c9 IS NOT NULL AND @s9a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c9 AND t.section_id = @s9a
        AND t.day = 'TUESDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c9, @s9a, 'WEDNESDAY', 1, '08:00:00', '08:45:00', 'Mathematics', @teach_id, 'Sarah Mitchell', 'Room 301', FALSE
WHERE @ay IS NOT NULL AND @c9 IS NOT NULL AND @s9a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c9 AND t.section_id = @s9a
        AND t.day = 'WEDNESDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );

INSERT INTO timetable_entries (
    tenant_id, academic_year_id, class_id, section_id, day, period,
    start_time, end_time, subject_name, teacher_id, teacher_name, room, is_deleted
)
SELECT @demo_tenant, @ay, @c11, @s11a, 'MONDAY', 1, '08:00:00', '08:45:00', 'Physics', @teach_id, 'Sarah Mitchell', 'Lab 2', FALSE
WHERE @ay IS NOT NULL AND @c11 IS NOT NULL AND @s11a IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM timetable_entries t
      WHERE t.tenant_id = @demo_tenant AND t.class_id = @c11 AND t.section_id = @s11a
        AND t.day = 'MONDAY' AND t.period = 1 AND t.is_deleted = FALSE
  );
