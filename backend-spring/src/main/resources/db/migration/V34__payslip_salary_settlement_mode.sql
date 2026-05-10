-- How salary for this payslip was confirmed as paid: outside the app (mark paid) vs digital payout API.
ALTER TABLE payslips
    ADD COLUMN salary_settlement_mode VARCHAR(32) NULL
        COMMENT 'OFFLINE_RECORDED | DIGITAL_PAYOUT when status=PAID; NULL if not yet settled or legacy';
