-- Supporting indexes for newly exposed paged list APIs (tenant + sort / filter columns).

CREATE INDEX idx_exams_tenant_deleted_start ON exams (tenant_id, is_deleted, start_date);
CREATE INDEX idx_exams_tenant_deleted_status ON exams (tenant_id, is_deleted, status);

CREATE INDEX idx_payslips_tenant_period ON payslips (tenant_id, is_deleted, year, payroll_month);
CREATE INDEX idx_payslips_tenant_teacher_period ON payslips (tenant_id, teacher_id, is_deleted, year, payroll_month);

CREATE INDEX idx_transport_routes_tenant_name ON transport_routes (tenant_id, is_deleted, name);

CREATE INDEX idx_visitor_logs_checkin ON visitor_logs (tenant_id, is_deleted, check_in_at);
CREATE INDEX idx_gate_passes_valid_from ON gate_passes (tenant_id, is_deleted, valid_from);
CREATE INDEX idx_inventory_items_name ON inventory_items (tenant_id, is_deleted, name);

CREATE INDEX idx_notifications_inbox_created ON notifications (tenant_id, user_id, is_deleted, created_at);

CREATE INDEX idx_tenant_configs_school_lookup ON tenant_configs (is_deleted, school_name, school_code);

CREATE INDEX idx_salary_structures_tenant_teacher ON salary_structures (tenant_id, is_deleted, teacher_name);
