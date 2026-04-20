-- Per-section class teacher (Indian school model). Homeroom on `sections` when the class has section rows;
-- `school_classes.class_teacher_*` remains for whole-class (no section rows).

ALTER TABLE sections
    ADD COLUMN class_teacher_id BIGINT NULL AFTER student_count,
    ADD COLUMN class_teacher_name VARCHAR(200) NULL AFTER class_teacher_id;

CREATE INDEX idx_section_homeroom_teacher ON sections (tenant_id, class_teacher_id);

-- Copy existing class-level homeroom onto each section (same teacher per section until admin reassigns).
UPDATE sections sec
    INNER JOIN school_classes sc ON sc.id = sec.class_id AND sc.tenant_id = sec.tenant_id
SET sec.class_teacher_id = sc.class_teacher_id,
    sec.class_teacher_name = sc.class_teacher_name
WHERE sec.is_deleted = 0
  AND sc.class_teacher_id IS NOT NULL;

-- When any section exists, canonical homeroom is on sections — clear denormalized class-level slots.
UPDATE school_classes sc
SET sc.class_teacher_id = NULL,
    sc.class_teacher_name = NULL
WHERE sc.is_deleted = 0
  AND EXISTS (SELECT 1 FROM sections s WHERE s.class_id = sc.id AND s.is_deleted = 0);
