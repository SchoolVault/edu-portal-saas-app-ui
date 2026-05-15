package com.school.erp.modules.platform.service;

import com.school.erp.modules.platform.dto.PlatformDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ExamArchiveGovernanceService {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ExamArchiveGovernanceService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Map<String, PolicyConfig> loadPolicyMap(String tenantId) {
        List<PolicyConfig> rows = listPolicies(tenantId);
        Map<String, PolicyConfig> out = new HashMap<>();
        for (PolicyConfig row : rows) {
            if (row.objectType() != null) {
                out.put(row.objectType().toLowerCase(Locale.ROOT), row);
            }
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<PolicyConfig> listPolicies(String tenantId) {
        return jdbcTemplate.query("""
                SELECT object_type, enabled, retention_days, verification_mode
                FROM exam_archive_policy
                WHERE tenant_id = ? AND is_deleted = 0
                ORDER BY object_type ASC
                """, (rs, rowNum) -> new PolicyConfig(
                rs.getString("object_type"),
                rs.getBoolean("enabled"),
                rs.getInt("retention_days"),
                rs.getString("verification_mode")
        ), tenantId);
    }

    @Transactional
    public List<PolicyConfig> upsertPolicies(String tenantId, List<PlatformDTOs.ExamArchivePolicyRequest> rows) {
        if (rows != null) {
            for (PlatformDTOs.ExamArchivePolicyRequest row : rows) {
                if (row == null || row.getObjectType() == null || row.getObjectType().isBlank()) {
                    continue;
                }
                String objectType = row.getObjectType().trim().toLowerCase(Locale.ROOT);
                int retention = Math.max(0, row.getRetentionDays());
                String mode = row.getVerificationMode() == null || row.getVerificationMode().isBlank()
                        ? "ROW_COUNT"
                        : row.getVerificationMode().trim().toUpperCase(Locale.ROOT);
                jdbcTemplate.update("""
                        INSERT INTO exam_archive_policy
                        (tenant_id, object_type, enabled, retention_days, verification_mode, created_at, updated_at, created_by, updated_by)
                        VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 'SYSTEM', 'SYSTEM')
                        ON DUPLICATE KEY UPDATE
                          enabled = VALUES(enabled),
                          retention_days = VALUES(retention_days),
                          verification_mode = VALUES(verification_mode),
                          is_deleted = 0,
                          updated_at = NOW(),
                          updated_by = 'SYSTEM'
                        """,
                        tenantId,
                        objectType,
                        row.isEnabled(),
                        retention,
                        mode);
            }
        }
        return listPolicies(tenantId);
    }

    @Transactional(readOnly = true)
    public boolean isLegalHoldActive(String tenantId, Long academicYearId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM exam_archive_legal_hold
                WHERE tenant_id = ? AND academic_year_id = ? AND active = 1 AND is_deleted = 0
                """, Integer.class, tenantId, academicYearId);
        return count != null && count > 0;
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.ExamArchiveLegalHoldResponse> listLegalHolds(String tenantId) {
        return jdbcTemplate.query("""
                SELECT id, academic_year_id, hold_scope, reason, active, created_at, updated_at
                FROM exam_archive_legal_hold
                WHERE tenant_id = ? AND is_deleted = 0
                ORDER BY academic_year_id DESC, id DESC
                """, (rs, rowNum) -> {
            PlatformDTOs.ExamArchiveLegalHoldResponse out = new PlatformDTOs.ExamArchiveLegalHoldResponse();
            out.setId(rs.getLong("id"));
            out.setAcademicYearId(rs.getLong("academic_year_id"));
            out.setHoldScope(rs.getString("hold_scope"));
            out.setReason(rs.getString("reason"));
            out.setActive(rs.getBoolean("active"));
            out.setCreatedAt(rs.getString("created_at"));
            out.setUpdatedAt(rs.getString("updated_at"));
            return out;
        }, tenantId);
    }

    @Transactional
    public List<PlatformDTOs.ExamArchiveLegalHoldResponse> upsertLegalHold(String tenantId, PlatformDTOs.ExamArchiveLegalHoldRequest req) {
        String scope = req.getHoldScope() == null || req.getHoldScope().isBlank()
                ? "EXAM_MODULE"
                : req.getHoldScope().trim().toUpperCase(Locale.ROOT);
        jdbcTemplate.update("""
                INSERT INTO exam_archive_legal_hold
                (tenant_id, academic_year_id, hold_scope, reason, active, created_at, updated_at, created_by, updated_by)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 'SYSTEM', 'SYSTEM')
                ON DUPLICATE KEY UPDATE
                  reason = VALUES(reason),
                  active = VALUES(active),
                  is_deleted = 0,
                  updated_at = NOW(),
                  updated_by = 'SYSTEM'
                """,
                tenantId,
                req.getAcademicYearId(),
                scope,
                req.getReason(),
                req.isActive());
        return listLegalHolds(tenantId);
    }

    @Transactional
    public void recordArchiveManifest(String tenantId, Long academicYearId, String sourceTable, String archiveTable, long movedRows) {
        String checksumToken = tenantId + ":" + academicYearId + ":" + sourceTable + ":" + movedRows;
        jdbcTemplate.update("""
                INSERT INTO exam_archive_manifest
                (tenant_id, academic_year_id, source_table, archive_table, rows_moved, checksum_token, status,
                 started_at, completed_at, verification_status, verification_notes, created_at, updated_at, created_by, updated_by)
                VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', NOW(), NOW(), 'PENDING', NULL, NOW(), NOW(), 'SYSTEM', 'SYSTEM')
                """,
                tenantId, academicYearId, sourceTable, archiveTable, movedRows, checksumToken);
    }

    @Transactional
    public void recordVerification(
            String tenantId,
            Long academicYearId,
            String sourceTable,
            String archiveTable,
            String actionType,
            long sourceRows,
            long archiveRows,
            String status,
            String details) {
        jdbcTemplate.update("""
                INSERT INTO exam_archive_verification_log
                (tenant_id, academic_year_id, source_table, archive_table, action_type, source_rows, archive_rows,
                 status, details, verified_at, created_at, updated_at, created_by, updated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW(), 'SYSTEM', 'SYSTEM')
                """, tenantId, academicYearId, sourceTable, archiveTable, actionType, sourceRows, archiveRows, status, details);
        jdbcTemplate.update("""
                UPDATE exam_archive_manifest
                SET verification_status = ?, verification_notes = ?, updated_at = NOW(), updated_by = 'SYSTEM'
                WHERE tenant_id = ? AND academic_year_id = ? AND source_table = ?
                ORDER BY id DESC
                LIMIT 1
                """, status, details, tenantId, academicYearId, sourceTable);
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.ExamArchiveManifestRow> listManifest(String tenantId, Long academicYearId) {
        return jdbcTemplate.query("""
                SELECT id, academic_year_id, source_table, archive_table, rows_moved, status, verification_status,
                       verification_notes, started_at, completed_at
                FROM exam_archive_manifest
                WHERE tenant_id = ? AND (? IS NULL OR academic_year_id = ?)
                ORDER BY id DESC
                LIMIT 500
                """, (rs, rowNum) -> {
            PlatformDTOs.ExamArchiveManifestRow out = new PlatformDTOs.ExamArchiveManifestRow();
            out.setId(rs.getLong("id"));
            out.setAcademicYearId(rs.getLong("academic_year_id"));
            out.setSourceTable(rs.getString("source_table"));
            out.setArchiveTable(rs.getString("archive_table"));
            out.setRowsMoved(rs.getLong("rows_moved"));
            out.setStatus(rs.getString("status"));
            out.setVerificationStatus(rs.getString("verification_status"));
            out.setVerificationNotes(rs.getString("verification_notes"));
            out.setStartedAt(rs.getString("started_at"));
            out.setCompletedAt(rs.getString("completed_at"));
            return out;
        }, tenantId, academicYearId, academicYearId);
    }

    @Transactional(readOnly = true)
    public PlatformDTOs.ExamSchoolRuntimePolicyResponse getRuntimePolicy(String tenantId) {
        PlatformDTOs.ExamSchoolRuntimePolicyResponse out = new PlatformDTOs.ExamSchoolRuntimePolicyResponse();
        out.setTenantId(tenantId);
        jdbcTemplate.query("""
                SELECT result_visibility_policy, board_pack_code, region_pack_code, school_type_pack_code
                FROM exam_school_runtime_policy
                WHERE tenant_id = ? AND is_deleted = 0
                LIMIT 1
                """, rs -> {
            out.setResultVisibilityPolicy(rs.getString("result_visibility_policy"));
            out.setBoardPackCode(rs.getString("board_pack_code"));
            out.setRegionPackCode(rs.getString("region_pack_code"));
            out.setSchoolTypePackCode(rs.getString("school_type_pack_code"));
        }, tenantId);
        if (out.getResultVisibilityPolicy() == null || out.getResultVisibilityPolicy().isBlank()) {
            out.setResultVisibilityPolicy("STRICT_PUBLISH");
        }
        return out;
    }

    @Transactional
    public PlatformDTOs.ExamSchoolRuntimePolicyResponse upsertRuntimePolicy(
            String tenantId,
            PlatformDTOs.ExamSchoolRuntimePolicyRequest req) {
        String visibility = req.getResultVisibilityPolicy() == null || req.getResultVisibilityPolicy().isBlank()
                ? "STRICT_PUBLISH"
                : req.getResultVisibilityPolicy().trim().toUpperCase(Locale.ROOT);
        jdbcTemplate.update("""
                INSERT INTO exam_school_runtime_policy
                (tenant_id, result_visibility_policy, board_pack_code, region_pack_code, school_type_pack_code,
                 created_at, updated_at, created_by, updated_by)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 'SYSTEM', 'SYSTEM')
                ON DUPLICATE KEY UPDATE
                  result_visibility_policy = VALUES(result_visibility_policy),
                  board_pack_code = VALUES(board_pack_code),
                  region_pack_code = VALUES(region_pack_code),
                  school_type_pack_code = VALUES(school_type_pack_code),
                  is_deleted = 0,
                  updated_at = NOW(),
                  updated_by = 'SYSTEM'
                """, tenantId, visibility, req.getBoardPackCode(), req.getRegionPackCode(), req.getSchoolTypePackCode());
        return getRuntimePolicy(tenantId);
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.ExamProfilePackRow> getEffectivePacks(String tenantId) {
        return jdbcTemplate.query("""
                SELECT pack_type, pack_code, CAST(config_json AS CHAR) AS config_json, enabled
                FROM exam_profile_pack_catalog
                WHERE is_deleted = 0
                  AND enabled = 1
                  AND (tenant_id IS NULL OR tenant_id = ?)
                ORDER BY tenant_id DESC, pack_type ASC, pack_code ASC
                """, (rs, rowNum) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("pack_type", rs.getString("pack_type"));
            row.put("pack_code", rs.getString("pack_code"));
            row.put("config_json", rs.getString("config_json"));
            row.put("enabled", rs.getBoolean("enabled"));
            return toPackRow(row);
        }, tenantId);
    }

    @Transactional
    public PlatformDTOs.ExamArchiveRestoreRequestRow submitRestoreRequest(
            String tenantId,
            Long requestedByUserId,
            PlatformDTOs.ExamArchiveRestoreRequestCreate req) {
        jdbcTemplate.update("""
                INSERT INTO exam_archive_restore_request
                (tenant_id, academic_year_id, request_notes, status, requested_by_user_id, dry_run,
                 created_at, updated_at, created_by, updated_by)
                VALUES (?, ?, ?, 'PENDING_APPROVAL', ?, ?, NOW(), NOW(), 'SYSTEM', 'SYSTEM')
                """, tenantId, req.getAcademicYearId(), req.getRequestNotes(), requestedByUserId, req.isDryRun());
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return getRestoreRequestById(id != null ? id : 0L);
    }

    @Transactional
    public PlatformDTOs.ExamArchiveRestoreRequestRow approveOrRejectRestoreRequest(
            Long requestId,
            Long reviewerUserId,
            PlatformDTOs.ExamArchiveRestoreApprovalRequest req) {
        PlatformDTOs.ExamArchiveRestoreRequestRow row = getRestoreRequestById(requestId);
        if (row == null || !"PENDING_APPROVAL".equalsIgnoreCase(row.getStatus())) {
            throw new IllegalStateException("Restore request is not in pending approval state.");
        }
        if (!req.isApprove()) {
            jdbcTemplate.update("""
                    UPDATE exam_archive_restore_request
                    SET status = 'REJECTED',
                        rejected_by_user_id = ?,
                        rejected_at = NOW(),
                        request_notes = COALESCE(?, request_notes),
                        updated_at = NOW(),
                        updated_by = 'SYSTEM'
                    WHERE id = ?
                    """, reviewerUserId, req.getReviewerNotes(), requestId);
            return getRestoreRequestById(requestId);
        }
        PlatformDTOs.ExamArchiveRestoreResponse result = restoreAcademicYear(row.getTenantId(), row.getAcademicYearId(), row.isDryRun());
        String resultJson;
        try {
            resultJson = objectMapper.writeValueAsString(result);
        } catch (Exception ex) {
            resultJson = "{\"error\":\"serialization_failed\"}";
        }
        jdbcTemplate.update("""
                UPDATE exam_archive_restore_request
                SET status = 'APPROVED_EXECUTED',
                    approved_by_user_id = ?,
                    approved_at = NOW(),
                    restore_result_json = CAST(? AS JSON),
                    request_notes = COALESCE(?, request_notes),
                    updated_at = NOW(),
                    updated_by = 'SYSTEM'
                WHERE id = ?
                """, reviewerUserId, resultJson, req.getReviewerNotes(), requestId);
        return getRestoreRequestById(requestId);
    }

    @Transactional(readOnly = true)
    public List<PlatformDTOs.ExamArchiveRestoreRequestRow> listRestoreRequests(String tenantId, String status) {
        String normalized = status == null ? null : status.trim().toUpperCase(Locale.ROOT);
        return jdbcTemplate.query("""
                SELECT id, tenant_id, academic_year_id, request_notes, status, requested_by_user_id, approved_by_user_id,
                       rejected_by_user_id, approved_at, rejected_at, dry_run,
                       CAST(restore_result_json AS CHAR) AS restore_result_json, created_at, updated_at
                FROM exam_archive_restore_request
                WHERE tenant_id = ?
                  AND (? IS NULL OR ? = '' OR status = ?)
                  AND is_deleted = 0
                ORDER BY id DESC
                LIMIT 500
                """, (rs, rowNum) -> toRestoreRequestRow(rs.getLong("id"),
                rs.getString("tenant_id"),
                rs.getLong("academic_year_id"),
                rs.getString("request_notes"),
                rs.getString("status"),
                rs.getObject("requested_by_user_id") != null ? rs.getLong("requested_by_user_id") : null,
                rs.getObject("approved_by_user_id") != null ? rs.getLong("approved_by_user_id") : null,
                rs.getObject("rejected_by_user_id") != null ? rs.getLong("rejected_by_user_id") : null,
                rs.getString("approved_at"),
                rs.getString("rejected_at"),
                rs.getBoolean("dry_run"),
                rs.getString("restore_result_json"),
                rs.getString("created_at"),
                rs.getString("updated_at")), tenantId, normalized, normalized, normalized);
    }

    @Transactional
    public PlatformDTOs.ExamArchiveRestoreResponse restoreAcademicYear(String tenantId, Long academicYearId, boolean dryRun) {
        List<TablePair> pairs = List.of(
                new TablePair("mark_records", "mark_records_archive"),
                new TablePair("attendance_records", "attendance_records_archive"),
                new TablePair("notifications", "notifications_archive")
        );
        long totalRestored = 0L;
        int tablesProcessed = 0;
        for (TablePair pair : pairs) {
            if (!tableExists(pair.sourceTable()) || !tableExists(pair.archiveTable())) {
                continue;
            }
            tablesProcessed++;
            long candidates = countRows(pair.archiveTable(), tenantId, academicYearId);
            if (dryRun || candidates <= 0) {
                recordVerification(tenantId, academicYearId, pair.sourceTable(), pair.archiveTable(), "RESTORE", 0, candidates, "DRY_RUN", "Restore candidates counted");
                continue;
            }
            int inserted = jdbcTemplate.update(
                    "INSERT IGNORE INTO " + pair.sourceTable() + " SELECT * FROM " + pair.archiveTable()
                            + " WHERE tenant_id = ? AND academic_year_id = ?",
                    tenantId, academicYearId);
            totalRestored += Math.max(0, inserted);
            recordVerification(
                    tenantId,
                    academicYearId,
                    pair.sourceTable(),
                    pair.archiveTable(),
                    "RESTORE",
                    inserted,
                    candidates,
                    "OK",
                    "Restored rows from archive to source");
        }
        PlatformDTOs.ExamArchiveRestoreResponse out = new PlatformDTOs.ExamArchiveRestoreResponse();
        out.setTenantId(tenantId);
        out.setAcademicYearId(academicYearId);
        out.setDryRun(dryRun);
        out.setTablesProcessed(tablesProcessed);
        out.setRowsRestored(totalRestored);
        out.setProcessedAt(LocalDateTime.now().toString());
        return out;
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                Integer.class,
                tableName);
        return count != null && count > 0;
    }

    private long countRows(String tableName, String tenantId, Long academicYearId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE tenant_id = ? AND academic_year_id = ?",
                Long.class,
                tenantId,
                academicYearId);
        return count != null ? count : 0L;
    }

    private PlatformDTOs.ExamProfilePackRow toPackRow(Map<String, Object> row) {
        PlatformDTOs.ExamProfilePackRow out = new PlatformDTOs.ExamProfilePackRow();
        out.setPackType(String.valueOf(row.get("pack_type")));
        out.setPackCode(String.valueOf(row.get("pack_code")));
        out.setConfig(row.get("config_json"));
        out.setEnabled(Boolean.TRUE.equals(row.get("enabled")) || "1".equals(String.valueOf(row.get("enabled"))));
        return out;
    }

    private PlatformDTOs.ExamArchiveRestoreRequestRow getRestoreRequestById(Long id) {
        List<PlatformDTOs.ExamArchiveRestoreRequestRow> rows = jdbcTemplate.query("""
                SELECT id, tenant_id, academic_year_id, request_notes, status, requested_by_user_id, approved_by_user_id,
                       rejected_by_user_id, approved_at, rejected_at, dry_run,
                       CAST(restore_result_json AS CHAR) AS restore_result_json, created_at, updated_at
                FROM exam_archive_restore_request
                WHERE id = ? AND is_deleted = 0
                LIMIT 1
                """, (rs, rowNum) -> toRestoreRequestRow(rs.getLong("id"),
                rs.getString("tenant_id"),
                rs.getLong("academic_year_id"),
                rs.getString("request_notes"),
                rs.getString("status"),
                rs.getObject("requested_by_user_id") != null ? rs.getLong("requested_by_user_id") : null,
                rs.getObject("approved_by_user_id") != null ? rs.getLong("approved_by_user_id") : null,
                rs.getObject("rejected_by_user_id") != null ? rs.getLong("rejected_by_user_id") : null,
                rs.getString("approved_at"),
                rs.getString("rejected_at"),
                rs.getBoolean("dry_run"),
                rs.getString("restore_result_json"),
                rs.getString("created_at"),
                rs.getString("updated_at")), id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private PlatformDTOs.ExamArchiveRestoreRequestRow toRestoreRequestRow(
            Long id,
            String tenantId,
            Long academicYearId,
            String notes,
            String status,
            Long requestedBy,
            Long approvedBy,
            Long rejectedBy,
            String approvedAt,
            String rejectedAt,
            boolean dryRun,
            String restoreResultJson,
            String createdAt,
            String updatedAt) {
        PlatformDTOs.ExamArchiveRestoreRequestRow out = new PlatformDTOs.ExamArchiveRestoreRequestRow();
        out.setId(id);
        out.setTenantId(tenantId);
        out.setAcademicYearId(academicYearId);
        out.setRequestNotes(notes);
        out.setStatus(status);
        out.setRequestedByUserId(requestedBy);
        out.setApprovedByUserId(approvedBy);
        out.setRejectedByUserId(rejectedBy);
        out.setApprovedAt(approvedAt);
        out.setRejectedAt(rejectedAt);
        out.setDryRun(dryRun);
        out.setRestoreResult(restoreResultJson);
        out.setCreatedAt(createdAt);
        out.setUpdatedAt(updatedAt);
        return out;
    }

    public record PolicyConfig(String objectType, boolean enabled, int retentionDays, String verificationMode) {
    }

    private record TablePair(String sourceTable, String archiveTable) {
    }
}
