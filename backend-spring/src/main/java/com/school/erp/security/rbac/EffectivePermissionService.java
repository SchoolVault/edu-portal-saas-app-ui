package com.school.erp.security.rbac;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.rbac.entity.SchoolRole;
import com.school.erp.modules.rbac.entity.UserSchoolRoleAssignment;
import com.school.erp.modules.rbac.repository.UserSchoolRoleAssignmentRepository;
import com.school.erp.modules.rbac.service.SchoolRolePermissionResolver;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resolves effective {@link AppPermission} for a user: (1) database school-role assignments (union);
 * (2) otherwise legacy default by {@link User#getRole()}; (3) teacher+library add-on for roster-linked library duty.
 */
@Service
public class EffectivePermissionService {

    private static final Set<AppPermission> SCHOOL_TENANT_BUNDLE = EnumSet.of(
            AppPermission.TENANT_ADMIN,
            AppPermission.SCHOOL_FEE_OFFICE,
            AppPermission.SCHOOL_SETTINGS_FINANCE,
            AppPermission.SCHOOL_PAYROLL_OFFICE,
            AppPermission.SCHOOL_SETTINGS_CORE,
            AppPermission.SCHOOL_STUDENT_MASTER,
            AppPermission.SCHOOL_EXAMS_OFFICE,
            AppPermission.SCHOOL_IMPORT_EXPORT,
            AppPermission.SCHOOL_OPERATIONS_HUB,
            AppPermission.SCHOOL_TRANSPORT_DESK,
            AppPermission.SCHOOL_HOSTEL_DESK,
            AppPermission.SCHOOL_REPORTS_SCHOOL,
            AppPermission.FEE_STRUCTURES_READ
    );

    private static final Set<AppPermission> TEACHER_BASE = EnumSet.of(
            AppPermission.ACADEMIC_TEACHER,
            AppPermission.FEE_STRUCTURES_READ
    );

    private static final Set<AppPermission> LIBRARY_BUNDLE = EnumSet.of(
            AppPermission.LIBRARY_MANAGE,
            AppPermission.LIBRARY_CIRCULATION
    );

    private static final Set<AppPermission> SUPER_ADMIN_BUNDLE;

    static {
        SUPER_ADMIN_BUNDLE = new LinkedHashSet<>();
        SUPER_ADMIN_BUNDLE.add(AppPermission.PLATFORM_ADMIN);
        SUPER_ADMIN_BUNDLE.addAll(SCHOOL_TENANT_BUNDLE);
    }

    private final TeacherRepository teacherRepository;
    private final UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository;
    private final SchoolRolePermissionResolver schoolRolePermissionResolver;

    public EffectivePermissionService(
            TeacherRepository teacherRepository,
            UserSchoolRoleAssignmentRepository userSchoolRoleAssignmentRepository,
            SchoolRolePermissionResolver schoolRolePermissionResolver) {
        this.teacherRepository = teacherRepository;
        this.userSchoolRoleAssignmentRepository = userSchoolRoleAssignmentRepository;
        this.schoolRolePermissionResolver = schoolRolePermissionResolver;
    }

    public Set<AppPermission> resolveEffectivePermissions(User user) {
        if (user == null || user.getRole() == null) {
            return Set.of();
        }
        if (user.getRole() == Enums.Role.SUPER_ADMIN) {
            return Collections.unmodifiableSet(new LinkedHashSet<>(SUPER_ADMIN_BUNDLE));
        }
        if (user.getRole() == Enums.Role.PARENT) {
            return Set.of(AppPermission.PORTAL_PARENT);
        }
        if (user.getRole() == Enums.Role.STUDENT) {
            return Set.of(AppPermission.PORTAL_STUDENT);
        }
        if (user.getTenantId() != null && !user.getTenantId().isBlank()
                && (user.getRole() == Enums.Role.ADMIN
                || user.getRole() == Enums.Role.TEACHER
                || user.getRole() == Enums.Role.LIBRARY_STAFF
                || user.getRole() == Enums.Role.SCHOOL_STAFF)) {
            List<UserSchoolRoleAssignment> fromDb =
                    userSchoolRoleAssignmentRepository.findByTenantIdAndUserIdFetchRoles(user.getTenantId(), user.getId());
            if (!fromDb.isEmpty()) {
                return mergeDbAssignments(user, fromDb);
            }
        }
        return legacyByPortalRole(user);
    }

    private Set<AppPermission> mergeDbAssignments(User user, List<UserSchoolRoleAssignment> fromDb) {
        List<SchoolRole> roles = fromDb.stream().map(UserSchoolRoleAssignment::getSchoolRole).toList();
        return resolveFromExplicitSchoolRoles(user, roles);
    }

    /**
     * Same resolution as database-backed school roles: empty list falls back to legacy {@code User#role} bundles;
     * non-empty list is the union of role CSVs (plus teacher library add-on when applicable).
     */
    public Set<AppPermission> resolveFromExplicitSchoolRoles(User user, List<SchoolRole> schoolRoles) {
        if (user == null || user.getRole() == null) {
            return Set.of();
        }
        if (user.getRole() == Enums.Role.SUPER_ADMIN) {
            return Collections.unmodifiableSet(new LinkedHashSet<>(SUPER_ADMIN_BUNDLE));
        }
        if (user.getRole() == Enums.Role.PARENT) {
            return Set.of(AppPermission.PORTAL_PARENT);
        }
        if (user.getRole() == Enums.Role.STUDENT) {
            return Set.of(AppPermission.PORTAL_STUDENT);
        }
        if (user.getTenantId() != null && !user.getTenantId().isBlank()
                && (user.getRole() == Enums.Role.ADMIN
                || user.getRole() == Enums.Role.TEACHER
                || user.getRole() == Enums.Role.LIBRARY_STAFF
                || user.getRole() == Enums.Role.SCHOOL_STAFF)) {
            if (schoolRoles == null || schoolRoles.isEmpty()) {
                return legacyByPortalRole(user);
            }
            EnumSet<AppPermission> acc = EnumSet.noneOf(AppPermission.class);
            if (user.getRole() == Enums.Role.TEACHER) {
                acc.addAll(TEACHER_BASE);
            } else if (user.getRole() == Enums.Role.LIBRARY_STAFF) {
                acc.add(AppPermission.PORTAL_SCHOOL_STAFF);
                acc.addAll(LIBRARY_BUNDLE);
            } else if (user.getRole() == Enums.Role.SCHOOL_STAFF) {
                acc.add(AppPermission.PORTAL_SCHOOL_STAFF);
            }
            for (SchoolRole r : schoolRoles) {
                if (r != null) {
                    acc.addAll(schoolRolePermissionResolver.resolveEffective(r));
                }
            }
            if (user.getRole() == Enums.Role.TEACHER) {
                applyTeacherLibraryAddOn(user, acc);
            }
            return Collections.unmodifiableSet(acc);
        }
        return legacyByPortalRole(user);
    }

    public boolean hasTenantAdminPermission(User user) {
        return resolveEffectivePermissions(user).contains(AppPermission.TENANT_ADMIN);
    }

    public boolean hasTenantAdminWithExplicitSchoolRoles(User user, List<SchoolRole> schoolRoles) {
        return resolveFromExplicitSchoolRoles(user, schoolRoles).contains(AppPermission.TENANT_ADMIN);
    }

    private void applyTeacherLibraryAddOn(User user, EnumSet<AppPermission> acc) {
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            return;
        }
        boolean hasLib = acc.contains(AppPermission.LIBRARY_MANAGE) && acc.contains(AppPermission.LIBRARY_CIRCULATION);
        if (hasLib) {
            return;
        }
        teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(user.getTenantId(), user.getId())
                .filter(t -> t.getLibraryStaffRole() != null)
                .ifPresent(t -> acc.addAll(LIBRARY_BUNDLE));
    }

    private Set<AppPermission> legacyByPortalRole(User user) {
        return switch (user.getRole()) {
            case SUPER_ADMIN -> Collections.unmodifiableSet(new LinkedHashSet<>(SUPER_ADMIN_BUNDLE));
            case ADMIN -> Collections.unmodifiableSet(new LinkedHashSet<>(SCHOOL_TENANT_BUNDLE));
            case TEACHER -> resolveTeacherPermissions(user);
            case LIBRARY_STAFF -> {
                EnumSet<AppPermission> lib = EnumSet.copyOf(LIBRARY_BUNDLE);
                lib.add(AppPermission.PORTAL_SCHOOL_STAFF);
                yield Collections.unmodifiableSet(lib);
            }
            case SCHOOL_STAFF -> Set.of(AppPermission.PORTAL_SCHOOL_STAFF);
            case PARENT -> Set.of(AppPermission.PORTAL_PARENT);
            case STUDENT -> Set.of(AppPermission.PORTAL_STUDENT);
        };
    }

    private Set<AppPermission> resolveTeacherPermissions(User user) {
        Set<AppPermission> m = EnumSet.copyOf(TEACHER_BASE);
        if (user.getTenantId() == null || user.getTenantId().isBlank()) {
            return Collections.unmodifiableSet(m);
        }
        teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(user.getTenantId(), user.getId())
                .filter(t -> t.getLibraryStaffRole() != null)
                .ifPresent(t -> m.addAll(LIBRARY_BUNDLE));
        return Collections.unmodifiableSet(m);
    }

    public String toPermissionCsv(User user) {
        return resolveEffectivePermissions(user).stream()
                .map(AppPermission::name)
                .sorted()
                .collect(Collectors.joining(","));
    }

    public List<String> toSortedPermissionCodes(User user) {
        return new ArrayList<>(resolveEffectivePermissions(user).stream()
                .map(AppPermission::name)
                .sorted()
                .toList());
    }
}
