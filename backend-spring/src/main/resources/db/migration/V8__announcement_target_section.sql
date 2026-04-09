ALTER TABLE announcements
    ADD COLUMN target_section_id BIGINT NULL AFTER target_class_id;

CREATE INDEX idx_ann_target ON announcements (tenant_id, target_audience, target_class_id, target_section_id);

