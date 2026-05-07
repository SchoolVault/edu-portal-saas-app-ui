-- Backfill BaseEntity audit columns for library phase tables in case V52 already ran.

ALTER TABLE library_fine_policies
    ADD COLUMN is_active BIT(1) DEFAULT 1,
    ADD COLUMN deleted_at DATETIME NULL,
    ADD COLUMN created_by VARCHAR(100) NULL,
    ADD COLUMN updated_by VARCHAR(100) NULL;

ALTER TABLE library_reservations
    ADD COLUMN is_active BIT(1) DEFAULT 1,
    ADD COLUMN deleted_at DATETIME NULL,
    ADD COLUMN created_by VARCHAR(100) NULL,
    ADD COLUMN updated_by VARCHAR(100) NULL;

ALTER TABLE library_inventory_ledger
    ADD COLUMN is_active BIT(1) DEFAULT 1,
    ADD COLUMN deleted_at DATETIME NULL,
    ADD COLUMN created_by VARCHAR(100) NULL,
    ADD COLUMN updated_by VARCHAR(100) NULL;
