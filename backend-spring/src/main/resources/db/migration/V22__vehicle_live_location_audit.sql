-- Align vehicle_live_locations with BaseEntity (created_by / updated_by)
ALTER TABLE vehicle_live_locations
    ADD COLUMN created_by VARCHAR(100) NULL,
    ADD COLUMN updated_by VARCHAR(100) NULL;
