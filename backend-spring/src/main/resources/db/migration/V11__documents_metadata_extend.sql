ALTER TABLE documents
    ADD COLUMN owner_type VARCHAR(30) NULL AFTER related_entity_type,
    ADD COLUMN owner_id BIGINT NULL AFTER owner_type,
    ADD COLUMN visibility_scope VARCHAR(30) NULL AFTER owner_id,
    ADD COLUMN file_version INT NOT NULL DEFAULT 1 AFTER visibility_scope,
    ADD COLUMN mime_type VARCHAR(120) NULL AFTER file_version,
    ADD COLUMN size_bytes BIGINT NULL AFTER mime_type,
    ADD COLUMN storage_key VARCHAR(500) NULL AFTER size_bytes,
    ADD COLUMN parent_folder_id BIGINT NULL AFTER storage_key,
    ADD COLUMN tags_json JSON NULL AFTER parent_folder_id;

CREATE INDEX idx_documents_tenant_owner ON documents (tenant_id, owner_type, owner_id);
