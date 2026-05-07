SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'documents'
              AND COLUMN_NAME = 'academic_year_id'
        ),
        'SELECT 1',
        'ALTER TABLE documents ADD COLUMN academic_year_id BIGINT NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'documents'
              AND COLUMN_NAME = 'checksum_sha256'
        ),
        'SELECT 1',
        'ALTER TABLE documents ADD COLUMN checksum_sha256 VARCHAR(64) NULL'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'documents'
              AND INDEX_NAME = 'idx_documents_tenant_year_created'
        ),
        'SELECT 1',
        'CREATE INDEX idx_documents_tenant_year_created ON documents (tenant_id, academic_year_id, created_at)'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
    SELECT IF(
        EXISTS(
            SELECT 1
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'documents'
              AND INDEX_NAME = 'idx_documents_tenant_owner_year'
        ),
        'SELECT 1',
        'CREATE INDEX idx_documents_tenant_owner_year ON documents (tenant_id, owner_type, owner_id, academic_year_id)'
    )
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
