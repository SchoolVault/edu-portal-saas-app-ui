package com.school.erp.modules.library.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Resolves member-lane borrower scope for library self-service APIs.
 * <p>
 * Current model supports:
 * <ul>
 *     <li>Student portal users -> own borrower scope</li>
 *     <li>Parent portal users -> linked ward borrower scope</li>
 * </ul>
 * This service is intentionally isolated so we can later extend to staff/self borrower identities
 * (e.g., teacher/library member borrowing rows) without rewriting controller/service endpoints.
 * </p>
 */
@Service
public class LibraryMemberScopeService {
    public record MemberBorrowerScope(Long userId, List<Long> studentBorrowerRefs) {}

    private final StudentRepository studentRepository;

    public LibraryMemberScopeService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public List<Long> resolveCurrentBorrowerStudentIds() {
        return resolveCurrentMemberBorrowerScope().studentBorrowerRefs();
    }

    @Transactional(readOnly = true)
    public MemberBorrowerScope resolveCurrentMemberBorrowerScope() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        if (tenantId == null || tenantId.isBlank() || userId == null) {
            return new MemberBorrowerScope(userId, List.of());
        }
        String role = TenantContext.getUserRole();
        if (role != null) {
            try {
                Enums.Role parsed = Enums.Role.valueOf(role.trim().toUpperCase());
                if (parsed == Enums.Role.STUDENT) {
                    // Legacy bootstrap uses user.id == student.id for student portal accounts.
                    return new MemberBorrowerScope(userId, List.of(userId));
                }
            } catch (IllegalArgumentException ignored) {
                // Unknown role string -> fall through to parent-linked lookup.
            }
        }
        List<Long> ids = new ArrayList<>();
        studentRepository.findByTenantIdAndParentIdAndIsDeletedFalse(tenantId, userId).forEach(s -> {
            if (s.getId() != null) {
                ids.add(s.getId());
            }
        });
        return new MemberBorrowerScope(userId, ids.stream().distinct().toList());
    }
}
