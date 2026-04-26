package com.school.erp.modules.rbac.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.rbac.dto.RbacDTOs;
import com.school.erp.modules.rbac.service.RbacService;
import com.school.erp.security.rbac.RbacSpel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rbac")
@Tag(name = "RBAC", description = "School responsibility roles and per-staff assignments")
public class RbacController {

    private final RbacService rbacService;

    public RbacController(RbacService rbacService) {
        this.rbacService = rbacService;
    }

    @GetMapping("/roles")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "List school-scoped responsibility role catalog for the current tenant")
    public ResponseEntity<ApiResponse<List<RbacDTOs.SchoolRoleResponse>>> listRoles() {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.listSchoolRoleCatalog()));
    }

    @GetMapping("/staff")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "List staff users (admin, teacher, library) for assignment UI")
    public ResponseEntity<ApiResponse<List<RbacDTOs.StaffUserRow>>> listStaff() {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.listStaffUsers()));
    }

    @GetMapping("/users/{userId}/assignments")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Get school role assignments for a staff user")
    public ResponseEntity<ApiResponse<RbacDTOs.UserSchoolRoleAssignmentResponse>> getAssignments(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.getUserAssignments(userId)));
    }

    @PutMapping("/users/{userId}/assignments")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Replace school role assignments (union of permissions issued at next login/refresh)")
    public ResponseEntity<ApiResponse<RbacDTOs.UserSchoolRoleAssignmentResponse>> putAssignments(
            @PathVariable Long userId, @Valid @RequestBody RbacDTOs.ReplaceUserSchoolRolesRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.replaceUserAssignments(userId, body), "Responsibility roles updated."));
    }

    @GetMapping("/permission-catalog")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "List AppPermission names assignable to custom school roles (for UI checklists)")
    public ResponseEntity<ApiResponse<List<String>>> permissionCatalog() {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.listPermissionCatalog()));
    }

    @PostMapping("/roles/custom")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Create a tenant-specific school role (non-template)")
    public ResponseEntity<ApiResponse<RbacDTOs.SchoolRoleResponse>> createCustomRole(
            @Valid @RequestBody RbacDTOs.CreateCustomSchoolRoleRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.createCustomSchoolRole(body), "Custom school role created."));
    }

    @PutMapping("/roles/{roleId}/custom")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Update a tenant-specific school role (system templates are immutable)")
    public ResponseEntity<ApiResponse<RbacDTOs.SchoolRoleResponse>> updateCustomRole(
            @PathVariable long roleId, @Valid @RequestBody RbacDTOs.UpdateCustomSchoolRoleRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.updateCustomSchoolRole(roleId, body), "Custom school role updated."));
    }

    @DeleteMapping("/roles/{roleId}/custom")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Soft-delete a tenant-specific school role (removes all assignments; system roles cannot be deleted)")
    public ResponseEntity<ApiResponse<Void>> deleteCustomRole(@PathVariable long roleId) {
        rbacService.deleteCustomSchoolRole(roleId);
        return ResponseEntity.ok(ApiResponse.ok((Void) null, "Custom school role removed."));
    }

    @GetMapping("/permission-groups")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "List reusable permission packs for the current tenant")
    public ResponseEntity<ApiResponse<List<RbacDTOs.PermissionGroupResponse>>> listPermissionGroups() {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.listPermissionGroups()));
    }

    @PostMapping("/permission-groups")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Create a tenant-defined permission pack (reusable across school roles)")
    public ResponseEntity<ApiResponse<RbacDTOs.PermissionGroupResponse>> createPermissionGroup(
            @Valid @RequestBody RbacDTOs.CreatePermissionGroupRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.createPermissionGroup(body), "Permission pack created."));
    }

    @PutMapping("/permission-groups/{groupId}")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Update a non-template permission pack")
    public ResponseEntity<ApiResponse<RbacDTOs.PermissionGroupResponse>> updatePermissionGroup(
            @PathVariable long groupId, @Valid @RequestBody RbacDTOs.UpdatePermissionGroupRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(rbacService.updatePermissionGroup(groupId, body), "Permission pack updated."));
    }

    @DeleteMapping("/permission-groups/{groupId}")
    @PreAuthorize(RbacSpel.SCHOOL_RBAC_API)
    @Operation(summary = "Soft-delete a tenant-defined permission pack (detaches from roles; system templates cannot be deleted)")
    public ResponseEntity<ApiResponse<Void>> deletePermissionGroup(@PathVariable long groupId) {
        rbacService.deletePermissionGroup(groupId);
        return ResponseEntity.ok(ApiResponse.ok((Void) null, "Permission pack removed."));
    }
}
