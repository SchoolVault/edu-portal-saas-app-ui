ALTER TABLE tenant_configs
    ADD COLUMN library_fine_per_day DECIMAL(10, 2) NOT NULL DEFAULT 10.00 COMMENT 'INR per overdue day; tenant-specific' AFTER secondary_color;

ALTER TABLE teachers
    ADD COLUMN bank_account_holder VARCHAR(200) NULL AFTER avatar,
    ADD COLUMN bank_name VARCHAR(120) NULL AFTER bank_account_holder,
    ADD COLUMN bank_account_number VARCHAR(64) NULL AFTER bank_name,
    ADD COLUMN bank_ifsc VARCHAR(32) NULL AFTER bank_account_number;
