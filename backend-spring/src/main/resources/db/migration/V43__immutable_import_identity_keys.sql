ALTER TABLE teachers
    ADD COLUMN employee_code VARCHAR(64) NULL AFTER phone;

ALTER TABLE users
    ADD COLUMN parent_code VARCHAR(64) NULL AFTER preferred_locale;

CREATE UNIQUE INDEX uk_teachers_tenant_employee_code_active
    ON teachers (tenant_id, employee_code, is_deleted);

CREATE UNIQUE INDEX uk_users_tenant_parent_code_active
    ON users (tenant_id, parent_code, is_deleted);
