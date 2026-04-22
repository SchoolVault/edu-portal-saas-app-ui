package com.school.erp.modules.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Async GDPR-style tenant wipe orchestrated by super-admin (platform scope — no {@code tenant_id} on this row).
 */
@Entity
@Table(name = "platform_tenant_purge_jobs")
public class PlatformTenantPurgeJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "school_code", nullable = false, length = 32)
    private String schoolCode;

    @Column(name = "school_name", length = 191)
    private String schoolName;

    @Column(name = "requested_by_user_id")
    private Long requestedByUserId;

    @Column(name = "requested_by_role", length = 64)
    private String requestedByRole;

    @Column(name = "requested_by_principal", length = 191)
    private String requestedByPrincipal;

    @Column(name = "requested_by_display_name", length = 191)
    private String requestedByDisplayName;

    @Column(name = "executed_by_user_id")
    private Long executedByUserId;

    @Column(name = "executed_by_role", length = 64)
    private String executedByRole;

    @Column(name = "executed_by_principal", length = 191)
    private String executedByPrincipal;

    @Column(name = "executed_by_display_name", length = 191)
    private String executedByDisplayName;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "rows_deleted_estimate")
    private Integer rowsDeletedEstimate;

    @Column(name = "affected_students")
    private Long affectedStudents;

    @Column(name = "affected_teachers")
    private Long affectedTeachers;

    @Column(name = "affected_admins")
    private Long affectedAdmins;

    @Column(name = "affected_parent_accounts")
    private Long affectedParentAccounts;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "execution_duration_ms")
    private Long executionDurationMs;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getSchoolCode() {
        return schoolCode;
    }

    public void setSchoolCode(String schoolCode) {
        this.schoolCode = schoolCode;
    }

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public Long getRequestedByUserId() {
        return requestedByUserId;
    }

    public void setRequestedByUserId(Long requestedByUserId) {
        this.requestedByUserId = requestedByUserId;
    }

    public String getRequestedByRole() {
        return requestedByRole;
    }

    public void setRequestedByRole(String requestedByRole) {
        this.requestedByRole = requestedByRole;
    }

    public String getRequestedByPrincipal() {
        return requestedByPrincipal;
    }

    public void setRequestedByPrincipal(String requestedByPrincipal) {
        this.requestedByPrincipal = requestedByPrincipal;
    }

    public String getRequestedByDisplayName() {
        return requestedByDisplayName;
    }

    public void setRequestedByDisplayName(String requestedByDisplayName) {
        this.requestedByDisplayName = requestedByDisplayName;
    }

    public Long getExecutedByUserId() {
        return executedByUserId;
    }

    public void setExecutedByUserId(Long executedByUserId) {
        this.executedByUserId = executedByUserId;
    }

    public String getExecutedByRole() {
        return executedByRole;
    }

    public void setExecutedByRole(String executedByRole) {
        this.executedByRole = executedByRole;
    }

    public String getExecutedByPrincipal() {
        return executedByPrincipal;
    }

    public void setExecutedByPrincipal(String executedByPrincipal) {
        this.executedByPrincipal = executedByPrincipal;
    }

    public String getExecutedByDisplayName() {
        return executedByDisplayName;
    }

    public void setExecutedByDisplayName(String executedByDisplayName) {
        this.executedByDisplayName = executedByDisplayName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Integer getRowsDeletedEstimate() {
        return rowsDeletedEstimate;
    }

    public void setRowsDeletedEstimate(Integer rowsDeletedEstimate) {
        this.rowsDeletedEstimate = rowsDeletedEstimate;
    }

    public Long getAffectedStudents() {
        return affectedStudents;
    }

    public void setAffectedStudents(Long affectedStudents) {
        this.affectedStudents = affectedStudents;
    }

    public Long getAffectedTeachers() {
        return affectedTeachers;
    }

    public void setAffectedTeachers(Long affectedTeachers) {
        this.affectedTeachers = affectedTeachers;
    }

    public Long getAffectedAdmins() {
        return affectedAdmins;
    }

    public void setAffectedAdmins(Long affectedAdmins) {
        this.affectedAdmins = affectedAdmins;
    }

    public Long getAffectedParentAccounts() {
        return affectedParentAccounts;
    }

    public void setAffectedParentAccounts(Long affectedParentAccounts) {
        this.affectedParentAccounts = affectedParentAccounts;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Long getExecutionDurationMs() {
        return executionDurationMs;
    }

    public void setExecutionDurationMs(Long executionDurationMs) {
        this.executionDurationMs = executionDurationMs;
    }
}
