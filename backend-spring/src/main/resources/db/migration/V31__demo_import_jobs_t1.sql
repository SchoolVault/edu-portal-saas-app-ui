-- Import/export demo jobs for default Flyway tenant `t1` (admin@school.com) — UI always has sample jobs in QA / local without Java demo seed.
SET @t1 := 't1';
SET @t1_class := (SELECT CAST(id AS CHAR) FROM school_classes WHERE tenant_id = @t1 AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY id LIMIT 1);

INSERT INTO import_jobs (tenant_id, created_by_user_id, job_type, status, original_filename, total_rows, success_count, fail_count,
                         started_at, finished_at, summary_message, is_active, is_deleted, created_at, updated_at)
SELECT @t1, (SELECT id FROM users WHERE tenant_id = @t1 AND email = 'admin@school.com' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1),
       'STUDENTS', 'COMPLETED', 't1-admissions-demo.zip', 2, 1, 1,
       NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 5 MINUTE,
       'Processed 2 row(s): 1 succeeded, 1 failed.', TRUE, FALSE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM tenant_configs tc WHERE tc.tenant_id = @t1)
  AND NOT EXISTS (SELECT 1 FROM import_jobs j WHERE j.tenant_id = @t1 AND j.original_filename = 't1-admissions-demo.zip');

SET @ij_t1 := (SELECT id FROM import_jobs WHERE tenant_id = @t1 AND original_filename = 't1-admissions-demo.zip' ORDER BY id DESC LIMIT 1);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @t1, @ij_t1, 0, 'SUCCESS',
       CONCAT('{"firstname":"Jordan","lastname":"Lee","classid":"', IFNULL(@t1_class, '1'), '","admissionnumber":"T1-DEMO-IMP-01","parentemail":"parent@school.com"}'),
       NULL, 'STUDENT', NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij_t1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij_t1 AND l.line_index = 0);

INSERT INTO import_job_lines (tenant_id, job_id, line_index, status, payload_json, error_message, entity_type, entity_id, is_active, is_deleted, created_at, updated_at)
SELECT @t1, @ij_t1, 1, 'FAILED',
       '{"firstname":"","lastname":"BadRow","classid":"1"}',
       'Missing required column: firstname', NULL, NULL, TRUE, FALSE, NOW(), NOW()
WHERE @ij_t1 IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM import_job_lines l WHERE l.job_id = @ij_t1 AND l.line_index = 1);

INSERT INTO import_jobs (tenant_id, created_by_user_id, job_type, status, original_filename, total_rows, success_count, fail_count,
                         started_at, finished_at, summary_message, is_active, is_deleted, created_at, updated_at)
SELECT @t1, (SELECT id FROM users WHERE tenant_id = @t1 AND email = 'admin@school.com' AND (is_deleted IS NULL OR is_deleted = FALSE) LIMIT 1),
       'TEACHERS', 'QUEUED', 't1-faculty-pending-demo.zip', 0, 0, 0,
       NULL, NULL, NULL, TRUE, FALSE, NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM tenant_configs tc WHERE tc.tenant_id = @t1)
  AND NOT EXISTS (SELECT 1 FROM import_jobs j WHERE j.tenant_id = @t1 AND j.original_filename = 't1-faculty-pending-demo.zip');
