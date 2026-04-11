-- Sample completed import job for St. Xavier's demo workspace (UI parity for import/export screen).
SET @stx := 'tenant_stxaviers_heritage_k7m2n9p4';

INSERT INTO import_jobs (tenant_id, created_by_user_id, job_type, status, original_filename, total_rows, success_count, fail_count,
                         started_at, finished_at, summary_message, is_active, is_deleted, created_at, updated_at)
SELECT @stx, NULL, 'STUDENTS', 'COMPLETED', 'admissions-batch-2026-demo.zip', 3, 2, 1,
       NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 2 HOUR + INTERVAL 3 MINUTE,
       'Processed 3 row(s): 2 succeeded, 1 failed.', TRUE, FALSE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM tenant_configs tc WHERE tc.tenant_id = @stx)
  AND NOT EXISTS (SELECT 1 FROM import_jobs j WHERE j.tenant_id = @stx AND j.original_filename = 'admissions-batch-2026-demo.zip');

SET @ij := (SELECT id FROM import_jobs WHERE tenant_id = @stx AND original_filename = 'admissions-batch-2026-demo.zip' ORDER BY id DESC LIMIT 1);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @stx, @ij, 0, 'SUCCESS',
       '{"firstname":"Aarav","lastname":"Mehta","classid":"1","sectionid":"","admissionnumber":"DEMO-IMP-001","parentemail":"demo.parent1@example.com"}',
       NULL, 'STUDENT', NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij AND l.line_index = 0);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @stx, @ij, 1, 'FAILED',
       '{"firstname":"","lastname":"BrokenRow","classid":"1"}',
       'Missing required column: firstname', NULL, NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij AND l.line_index = 1);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @stx, @ij, 2, 'SUCCESS',
       '{"firstname":"Diya","lastname":"Ghosh","classid":"1","admissionnumber":"DEMO-IMP-002","parentemail":"demo.parent2@example.com"}',
       NULL, 'STUDENT', NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij AND l.line_index = 2);
