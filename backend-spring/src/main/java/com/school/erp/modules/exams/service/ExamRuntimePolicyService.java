package com.school.erp.modules.exams.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ExamRuntimePolicyService {
    public enum ResultVisibilityPolicy {
        STRICT_PUBLISH,
        DRAFT_VISIBLE
    }

    private final JdbcTemplate jdbcTemplate;

    public ExamRuntimePolicyService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public ResultVisibilityPolicy resultVisibilityPolicy(String tenantId) {
        String raw = jdbcTemplate.query("""
                SELECT result_visibility_policy
                FROM exam_school_runtime_policy
                WHERE tenant_id = ? AND is_deleted = 0
                LIMIT 1
                """, rs -> rs.next() ? rs.getString("result_visibility_policy") : null, tenantId);
        if (raw == null || raw.isBlank()) {
            return ResultVisibilityPolicy.STRICT_PUBLISH;
        }
        try {
            return ResultVisibilityPolicy.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return ResultVisibilityPolicy.STRICT_PUBLISH;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, String> effectivePackCodes(String tenantId) {
        Map<String, String> out = new HashMap<>();
        jdbcTemplate.query("""
                SELECT board_pack_code, region_pack_code, school_type_pack_code
                FROM exam_school_runtime_policy
                WHERE tenant_id = ? AND is_deleted = 0
                LIMIT 1
                """, rs -> {
            out.put("board", rs.getString("board_pack_code"));
            out.put("region", rs.getString("region_pack_code"));
            out.put("schoolType", rs.getString("school_type_pack_code"));
        }, tenantId);
        return out;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> resolvePackBundle(String tenantId) {
        return jdbcTemplate.queryForList("""
                SELECT pack_type, pack_code, config_json, enabled
                FROM exam_profile_pack_catalog
                WHERE is_deleted = 0
                  AND enabled = 1
                  AND (tenant_id IS NULL OR tenant_id = ?)
                ORDER BY tenant_id DESC, pack_type ASC, pack_code ASC
                """, tenantId);
    }
}
