package com.school.erp.modules.rbac.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.rbac.entity.SchoolRole;
import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import com.school.erp.modules.rbac.repository.UserSchoolRoleAssignmentRepository;
import com.school.erp.security.rbac.EffectivePermissionService;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Prevents a tenant from ending up with zero staff holding {@code TENANT_ADMIN} in effective permissions
 * (including legacy admin-with-no-RBAC assignments).
 */
@Component
public class RbacLastAdminEligibility {

    private static final Set<Enums.Role> STAFF = EnumSet.of(Enums.Role.ADMIN, Enums.Role.TEACHER, Enums.Role.LIBRARY_STAFF);

    private static final String MSG =
            "This change would remove the last user with full tenant configuration access (TENANT_ADMIN). Add another before continuing.";

    private final UserRepository userRepository;
    private final UserSchoolRoleAssignmentRepository assignmentRepository;
    private final EffectivePermissionService effectivePermissionService;

    public RbacLastAdminEligibility(
            UserRepository userRepository,
            UserSchoolRoleAssignmentRepository assignmentRepository,
            EffectivePermissionService effectivePermissionService) {
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.effectivePermissionService = effectivePermissionService;
    }

    public void assertAfterReplaceUserAssignments(
            String tenantId, long targetUserId, List<SchoolRole> newRolesForTarget) {
        List<User> staff = userRepository.findByTenantIdAndRoleInAndIsDeletedFalseOrderByNameAsc(tenantId, STAFF);
        int c = 0;
        for (User u : staff) {
            List<SchoolRole> explicit =
                    u.getId().equals(targetUserId) ? new ArrayList<>(newRolesForTarget) : schoolRolesForUser(tenantId, u.getId());
            if (effectivePermissionService.hasTenantAdminWithExplicitSchoolRoles(u, explicit)) {
                c++;
            }
        }
        if (c < 1) {
            throw new BusinessException(MSG);
        }
    }

    public void assertAfterCustomRoleContentChange(String tenantId, long roleId, SchoolRole newVersionNotYetSaved) {
        requirePositiveCount(tenantId, u -> {
            List<SchoolRole> roles = schoolRolesForUser(tenantId, u.getId());
            List<SchoolRole> patched = new ArrayList<>();
            for (SchoolRole r : roles) {
                if (Objects.equals(r.getId(), roleId)) {
                    patched.add(newVersionNotYetSaved);
                } else {
                    patched.add(r);
                }
            }
            return patched;
        });
    }

    public void assertAfterCustomRoleSoftDelete(String tenantId, long roleId) {
        requirePositiveCount(tenantId, u -> {
            List<SchoolRole> roles = schoolRolesForUser(tenantId, u.getId());
            return roles.stream().filter(r -> r.getId() == null || !r.getId().equals(roleId)).toList();
        });
    }

    private void requirePositiveCount(
            String tenantId, java.util.function.Function<User, List<SchoolRole>> proposedRolesFor) {
        List<User> staff = userRepository.findByTenantIdAndRoleInAndIsDeletedFalseOrderByNameAsc(tenantId, STAFF);
        int c = 0;
        for (User u : staff) {
            List<SchoolRole> explicit = proposedRolesFor.apply(u);
            if (effectivePermissionService.hasTenantAdminWithExplicitSchoolRoles(u, explicit)) {
                c++;
            }
        }
        if (c < 1) {
            throw new BusinessException(MSG);
        }
    }

    private List<SchoolRole> schoolRolesForUser(String tenantId, long userId) {
        return assignmentRepository.findByTenantIdAndUserIdFetchRoles(tenantId, userId).stream()
                .map(UserSchoolRoleAssignment::getSchoolRole)
                .filter(Objects::nonNull)
                .toList();
    }
}
