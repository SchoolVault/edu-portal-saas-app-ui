package com.school.erp.modules.notification.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.modules.guardian.entity.Guardian;
import com.school.erp.modules.guardian.entity.StudentGuardianMapping;
import com.school.erp.modules.guardian.repository.GuardianRepository;
import com.school.erp.modules.guardian.repository.StudentGuardianMappingRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Resolves concrete users (and phones) for announcement fan-out. Scoped to the same rules as inbox visibility.
 */
@Service
public class AnnouncementAudienceResolver {
    private static final int CAP = 2000;

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentGuardianMappingRepository mappingRepository;
    private final GuardianRepository guardianRepository;

    public AnnouncementAudienceResolver(
            UserRepository userRepository,
            StudentRepository studentRepository,
            StudentGuardianMappingRepository mappingRepository,
            GuardianRepository guardianRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.mappingRepository = mappingRepository;
        this.guardianRepository = guardianRepository;
    }

    public record AudienceMember(Long userId, String phone, String role) {}

    @Transactional(readOnly = true)
    public List<AudienceMember> resolve(Announcement ann) {
        String tenantId = ann.getTenantId();
        Enums.TargetAudience aud = ann.getTargetAudience();
        if (aud == null) {
            return List.of();
        }
        Set<Long> userIds = new LinkedHashSet<>();
        switch (aud) {
            case ALL -> {
                /* In-app notifications must reach every active user; SMS/WhatsApp queues may still skip empty phones downstream. */
                for (User u : userRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId)) {
                    if (userIds.size() >= CAP) {
                        break;
                    }
                    userIds.add(u.getId());
                }
            }
            case TEACHERS -> addUsersByRole(tenantId, Enums.Role.TEACHER, userIds);
            case PARENTS -> addUsersByRole(tenantId, Enums.Role.PARENT, userIds);
            case CLASS -> {
                if (ann.getTargetClassId() == null) {
                    return List.of();
                }
                addParentUserIdsForStudents(studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, ann.getTargetClassId()), tenantId, userIds);
            }
            case SECTION -> {
                if (ann.getTargetClassId() == null || ann.getTargetSectionId() == null) {
                    return List.of();
                }
                addParentUserIdsForStudents(
                        studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(
                                tenantId, ann.getTargetClassId(), ann.getTargetSectionId()),
                        tenantId,
                        userIds);
            }
            default -> {
                return List.of();
            }
        }
        List<AudienceMember> out = new ArrayList<>();
        for (Long uid : userIds) {
            userRepository.findByIdAndTenantIdAndIsDeletedFalse(uid, tenantId).ifPresent(u ->
                    out.add(new AudienceMember(u.getId(), normalizePhone(u.getPhone()), u.getRole() != null ? u.getRole().name() : "")));
        }
        return out;
    }

    private void addUsersByRole(String tenantId, Enums.Role role, Set<Long> userIds) {
        for (User u : userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, role)) {
            if (userIds.size() >= CAP) {
                break;
            }
            userIds.add(u.getId());
        }
    }

    private void addParentUserIdsForStudents(List<Student> students, String tenantId, Set<Long> userIds) {
        for (Student s : students) {
            if (userIds.size() >= CAP) {
                break;
            }
            if (s.getParentId() != null) {
                userIds.add(s.getParentId());
            }
            for (StudentGuardianMapping m : mappingRepository.findByTenantIdAndStudentIdAndIsDeletedFalse(tenantId, s.getId())) {
                Guardian g = guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(m.getGuardianId(), tenantId).orElse(null);
                if (g != null && g.getUserId() != null) {
                    userIds.add(g.getUserId());
                }
            }
        }
    }

    private static String normalizePhone(String p) {
        return p == null ? "" : p.trim();
    }
}
