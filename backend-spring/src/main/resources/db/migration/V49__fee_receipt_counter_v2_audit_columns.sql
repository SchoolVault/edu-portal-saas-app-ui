-- Align fee_receipt_counter_v2 with BaseEntity (created_by / updated_by).

ALTER TABLE fee_receipt_counter_v2
    ADD COLUMN created_by VARCHAR(100) NULL AFTER updated_at,
    ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by;
