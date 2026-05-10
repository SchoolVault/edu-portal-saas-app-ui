package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dashboard_snapshots", indexes = {
        @Index(name = "idx_dash_snap_lookup", columnList = "tenant_id, snapshot_type, role_code, scope_key, is_deleted"),
        @Index(name = "idx_dash_snap_refresh", columnList = "refresh_required, generated_at, is_deleted")
})
public class DashboardSnapshot extends BaseEntity {

    @Column(name = "snapshot_type", nullable = false, length = 40)
    private String snapshotType;

    @Column(name = "role_code", nullable = false, length = 30)
    private String roleCode;

    @Column(name = "scope_key", nullable = false, length = 180)
    private String scopeKey;

    @Column(name = "window_start")
    private LocalDate windowStart;

    @Column(name = "window_end")
    private LocalDate windowEnd;

    @Column(name = "payload_json", nullable = false, columnDefinition = "json")
    private String payloadJson;

    @Column(name = "cache_version", nullable = false)
    private Integer cacheVersion = 1;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "refresh_required", nullable = false)
    private Boolean refreshRequired = false;

    public String getSnapshotType() {
        return snapshotType;
    }

    public void setSnapshotType(String snapshotType) {
        this.snapshotType = snapshotType;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public void setRoleCode(String roleCode) {
        this.roleCode = roleCode;
    }

    public String getScopeKey() {
        return scopeKey;
    }

    public void setScopeKey(String scopeKey) {
        this.scopeKey = scopeKey;
    }

    public LocalDate getWindowStart() {
        return windowStart;
    }

    public void setWindowStart(LocalDate windowStart) {
        this.windowStart = windowStart;
    }

    public LocalDate getWindowEnd() {
        return windowEnd;
    }

    public void setWindowEnd(LocalDate windowEnd) {
        this.windowEnd = windowEnd;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public Integer getCacheVersion() {
        return cacheVersion;
    }

    public void setCacheVersion(Integer cacheVersion) {
        this.cacheVersion = cacheVersion;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public Boolean getRefreshRequired() {
        return refreshRequired;
    }

    public void setRefreshRequired(Boolean refreshRequired) {
        this.refreshRequired = refreshRequired;
    }
}
