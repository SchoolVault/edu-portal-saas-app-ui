package com.school.erp.modules.rbac.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class RbacDTOs {
    private RbacDTOs() {
    }

    public static class SchoolRoleResponse {
        private Long id;
        private String code;
        private String name;
        private String description;
        private boolean systemRole;
        private int sortOrder;
        private List<String> permissions;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public boolean isSystemRole() {
            return systemRole;
        }

        public void setSystemRole(boolean systemRole) {
            this.systemRole = systemRole;
        }

        public int getSortOrder() {
            return sortOrder;
        }

        public void setSortOrder(int sortOrder) {
            this.sortOrder = sortOrder;
        }

        public List<String> getPermissions() {
            return permissions;
        }

        public void setPermissions(List<String> permissions) {
            this.permissions = permissions;
        }
    }

    public static class StaffUserRow {
        private Long id;
        private String name;
        private String email;
        private String portalRole;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPortalRole() {
            return portalRole;
        }

        public void setPortalRole(String portalRole) {
            this.portalRole = portalRole;
        }
    }

    public static class UserSchoolRoleAssignmentResponse {
        private List<Long> schoolRoleIds;
        private List<SchoolRoleResponse> schoolRoles;

        public List<Long> getSchoolRoleIds() {
            return schoolRoleIds;
        }

        public void setSchoolRoleIds(List<Long> schoolRoleIds) {
            this.schoolRoleIds = schoolRoleIds;
        }

        public List<SchoolRoleResponse> getSchoolRoles() {
            return schoolRoles;
        }

        public void setSchoolRoles(List<SchoolRoleResponse> schoolRoles) {
            this.schoolRoles = schoolRoles;
        }
    }

    public static class ReplaceUserSchoolRolesRequest {
        /** Ids to assign; null or empty clears all school roles for the user (falls back to legacy enum permissions until reassigned). */
        private List<Long> schoolRoleIds;

        public List<Long> getSchoolRoleIds() {
            return schoolRoleIds;
        }

        public void setSchoolRoleIds(List<Long> schoolRoleIds) {
            this.schoolRoleIds = schoolRoleIds;
        }
    }

    public static class CreateCustomSchoolRoleRequest {
        @NotBlank
        @Size(min = 2, max = 64)
        @Pattern(regexp = "[A-Z][A-Z0-9_]+")
        private String code;
        @NotBlank
        @Size(max = 200)
        private String name;
        @Size(max = 500)
        private String description;
        private int sortOrder = 1000;
        @NotNull
        @Size(min = 1, max = 200)
        private List<String> permissions;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public int getSortOrder() {
            return sortOrder;
        }

        public void setSortOrder(int sortOrder) {
            this.sortOrder = sortOrder;
        }

        public List<String> getPermissions() {
            return permissions;
        }

        public void setPermissions(List<String> permissions) {
            this.permissions = permissions;
        }
    }

    public static class UpdateCustomSchoolRoleRequest {
        @NotBlank
        @Size(max = 200)
        private String name;
        @Size(max = 500)
        private String description;
        private int sortOrder = 1000;
        @NotNull
        @Size(min = 1, max = 200)
        private List<String> permissions;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public int getSortOrder() {
            return sortOrder;
        }

        public void setSortOrder(int sortOrder) {
            this.sortOrder = sortOrder;
        }

        public List<String> getPermissions() {
            return permissions;
        }

        public void setPermissions(List<String> permissions) {
            this.permissions = permissions;
        }
    }
}
