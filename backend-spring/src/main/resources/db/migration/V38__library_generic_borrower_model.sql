ALTER TABLE book_issues
    ADD COLUMN borrower_type VARCHAR(20) NULL,
    ADD COLUMN borrower_ref_id BIGINT NULL,
    ADD COLUMN borrower_user_id BIGINT NULL,
    ADD COLUMN borrower_display_name VARCHAR(200) NULL;

ALTER TABLE book_issues
    MODIFY COLUMN student_id BIGINT NULL;

UPDATE book_issues
SET borrower_type = 'STUDENT',
    borrower_ref_id = student_id,
    borrower_display_name = student_name
WHERE borrower_type IS NULL
  AND student_id IS NOT NULL;

CREATE INDEX idx_bi_borrower_ref ON book_issues (tenant_id, borrower_type, borrower_ref_id);
CREATE INDEX idx_bi_borrower_user ON book_issues (tenant_id, borrower_user_id);

ALTER TABLE tenant_configs
    ADD COLUMN library_borrower_policy_json TEXT NULL;

UPDATE tenant_configs
SET library_borrower_policy_json = '{"allowedBorrowerTypes":["STUDENT","STAFF"]}'
WHERE library_borrower_policy_json IS NULL;
