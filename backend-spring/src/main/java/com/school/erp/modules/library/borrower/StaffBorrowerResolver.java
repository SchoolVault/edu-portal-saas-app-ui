package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

@Component
public class StaffBorrowerResolver implements LibraryBorrowerResolver {
    private static final Set<Enums.Role> STAFF_PORTAL_ROLES = EnumSet.of(
            Enums.Role.ADMIN,
            Enums.Role.TEACHER,
            Enums.Role.LIBRARY_STAFF,
            Enums.Role.SCHOOL_STAFF);

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    public StaffBorrowerResolver(TeacherRepository teacherRepository, UserRepository userRepository) {
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Enums.LibraryBorrowerType supportedType() {
        return Enums.LibraryBorrowerType.STAFF;
    }

    @Override
    public ResolvedBorrower resolve(String tenantId, BorrowerResolutionRequest request) {
        Long refId = request.borrowerRefId();
        Long explicitUserId = request.borrowerUserId();

        if (explicitUserId != null) {
            User u = requireStaffUser(tenantId, explicitUserId);
            String displayName = bestDisplayName(u.getName(), request.borrowerDisplayName());
            return new ResolvedBorrower(
                    Enums.LibraryBorrowerType.STAFF,
                    u.getId(),
                    u.getId(),
                    displayName,
                    null,
                    null);
        }

        if (refId == null) {
            throw new BusinessException("Staff borrower reference id is required");
        }

        Teacher teacher = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(refId, tenantId).orElse(null);
        if (teacher != null) {
            Long teacherUserId = teacher.getUserId();
            String teacherName = ((teacher.getFirstName() == null ? "" : teacher.getFirstName().trim()) + " "
                    + (teacher.getLastName() == null ? "" : teacher.getLastName().trim())).trim();
            if ((teacherName.isBlank()) && teacherUserId != null) {
                User linked = userRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherUserId, tenantId).orElse(null);
                if (linked != null) {
                    teacherName = bestDisplayName(linked.getName(), request.borrowerDisplayName());
                }
            }
            if (teacherName.isBlank()) {
                teacherName = bestDisplayName(null, request.borrowerDisplayName());
            }
            Long canonicalUserId = teacherUserId != null ? teacherUserId : refId;
            return new ResolvedBorrower(
                    Enums.LibraryBorrowerType.STAFF,
                    canonicalUserId,
                    canonicalUserId,
                    teacherName,
                    null,
                    null);
        }

        User u = requireStaffUser(tenantId, refId);
        String displayName = bestDisplayName(u.getName(), request.borrowerDisplayName());
        return new ResolvedBorrower(
                Enums.LibraryBorrowerType.STAFF,
                u.getId(),
                u.getId(),
                displayName,
                null,
                null);
    }

    private User requireStaffUser(String tenantId, Long userId) {
        User u = userRepository.findByIdAndTenantIdAndIsDeletedFalse(userId, tenantId)
                .orElseThrow(() -> new BusinessException("Staff borrower was not found in this school"));
        Enums.Role role = u.getRole();
        if (role == null || !STAFF_PORTAL_ROLES.contains(role)) {
            throw new BusinessException("Borrower user is not an eligible staff/admin persona");
        }
        return u;
    }

    private String bestDisplayName(String primary, String fallback) {
        String p = primary == null ? "" : primary.trim();
        if (!p.isBlank()) {
            return p;
        }
        return fallback == null ? "" : fallback.trim();
    }
}
