ALTER TABLE books
    ADD COLUMN accession_no VARCHAR(60) NULL AFTER shelf_location,
    ADD COLUMN lost_copies INT NULL DEFAULT 0 AFTER accession_no,
    ADD COLUMN written_off_copies INT NULL DEFAULT 0 AFTER lost_copies;

CREATE TABLE IF NOT EXISTS library_fine_policies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    school_id BIGINT NULL,
    is_deleted BIT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    borrower_type VARCHAR(20) NOT NULL,
    fine_per_day DECIMAL(10,2) NULL,
    grace_days INT NULL DEFAULT 0,
    max_books INT NULL DEFAULT 3,
    max_borrow_days INT NULL DEFAULT 14,
    CONSTRAINT uk_library_fine_policy_tenant_type UNIQUE (tenant_id, borrower_type)
);

CREATE TABLE IF NOT EXISTS library_reservations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    school_id BIGINT NULL,
    is_deleted BIT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    book_id BIGINT NOT NULL,
    book_title VARCHAR(200) NULL,
    borrower_type VARCHAR(20) NOT NULL,
    borrower_ref_id BIGINT NULL,
    borrower_user_id BIGINT NULL,
    borrower_display_name VARCHAR(200) NULL,
    status VARCHAR(20) NOT NULL,
    requested_at DATETIME NULL,
    expires_at DATETIME NULL,
    fulfilled_issue_id BIGINT NULL,
    note VARCHAR(300) NULL
);

CREATE INDEX idx_lr_tenant_status ON library_reservations (tenant_id, status, is_deleted);
CREATE INDEX idx_lr_tenant_book ON library_reservations (tenant_id, book_id, is_deleted);

CREATE TABLE IF NOT EXISTS library_inventory_ledger (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    school_id BIGINT NULL,
    is_deleted BIT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    book_id BIGINT NOT NULL,
    book_title VARCHAR(200) NULL,
    action VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    total_copies_after INT NULL,
    available_copies_after INT NULL,
    note VARCHAR(300) NULL
);

CREATE INDEX idx_lil_tenant_book ON library_inventory_ledger (tenant_id, book_id, created_at, is_deleted);
