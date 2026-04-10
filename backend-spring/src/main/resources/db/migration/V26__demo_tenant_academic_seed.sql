-- Showcase / sales demo data for default tenant t1: one class, section, teacher row linked to Sarah's login, one student linked to parent user.
-- Idempotent: skips rows that already exist (by email / admission number).

SET @demo_tenant := 't1';
SET @ay := (SELECT id FROM academic_years WHERE tenant_id = @demo_tenant AND is_current = TRUE LIMIT 1);
SET @u_teacher := (SELECT id FROM users WHERE tenant_id = @demo_tenant AND email = 'teacher@school.com' LIMIT 1);
SET @u_parent := (SELECT id FROM users WHERE tenant_id = @demo_tenant AND email = 'parent@school.com' LIMIT 1);

INSERT INTO teachers (tenant_id, first_name, last_name, email, phone, qualification, specialization, join_date, salary, status, user_id, is_active, is_deleted)
SELECT @demo_tenant, 'Sarah', 'Mitchell', 'teacher@school.com', '+1-555-0102', 'M.Ed', 'Mathematics', '2020-08-01', 55000.00, 'ACTIVE', @u_teacher, TRUE, FALSE
WHERE @u_teacher IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.tenant_id = @demo_tenant AND t.email = 'teacher@school.com');

SET @teach_id := (SELECT id FROM teachers WHERE tenant_id = @demo_tenant AND email = 'teacher@school.com' LIMIT 1);

INSERT INTO school_classes (tenant_id, name, grade, class_teacher_id, class_teacher_name, academic_year_id, is_active, is_deleted)
SELECT @demo_tenant, 'Class 8', 8, @teach_id, 'Sarah Mitchell', @ay, TRUE, FALSE
WHERE @ay IS NOT NULL AND @teach_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_classes c
      WHERE c.tenant_id = @demo_tenant AND c.name = 'Class 8' AND c.academic_year_id = @ay
  );

SET @class_id := (
    SELECT id FROM school_classes
    WHERE tenant_id = @demo_tenant AND name = 'Class 8' AND academic_year_id = @ay
    LIMIT 1
);

INSERT INTO sections (tenant_id, name, class_id, capacity, student_count, is_active, is_deleted)
SELECT @demo_tenant, 'A', @class_id, 40, 0, TRUE, FALSE
WHERE @class_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sections s WHERE s.tenant_id = @demo_tenant AND s.class_id = @class_id AND s.name = 'A');

SET @sec_id := (
    SELECT id FROM sections WHERE tenant_id = @demo_tenant AND class_id = @class_id AND name = 'A' LIMIT 1
);

INSERT INTO students (
    tenant_id, first_name, last_name, email, phone, date_of_birth, gender,
    class_id, section_id, roll_number, admission_number, admission_date,
    parent_id, parent_name, status, is_active, is_deleted
)
SELECT
    @demo_tenant, 'Emma', 'Chen', 'emma.c@school.com', '+1-555-0212', '2009-02-14', 'FEMALE',
    @class_id, @sec_id, '805', 'ADM2022080', '2022-06-08',
    @u_parent, 'Michael Chen', 'ACTIVE', TRUE, FALSE
WHERE @class_id IS NOT NULL AND @sec_id IS NOT NULL AND @u_parent IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM students st WHERE st.tenant_id = @demo_tenant AND st.admission_number = 'ADM2022080');
