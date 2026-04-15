package com.school.erp.modules.guardian.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.util.PhoneNormalization;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.guardian.entity.Guardian;
import com.school.erp.modules.guardian.entity.StudentGuardianMapping;
import com.school.erp.modules.guardian.repository.GuardianRepository;
import com.school.erp.modules.guardian.repository.StudentGuardianMappingRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Keeps {@code guardians} + {@code student_guardian_mappings} aligned with legacy {@link Student#getParentId()}
 * (portal user id), so parent users see all linked children via mappings as well as {@code parent_id}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuardianLinkSyncService {

    private final UserRepository userRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianMappingRepository mappingRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public void syncForStudent(Student student) {
        if (student == null || student.getId() == null || student.getParentId() == null) {
            return;
        }
        String tenantId = student.getTenantId();
        Long parentUserId = student.getParentId();

        User parent = userRepository.findByIdAndTenantIdAndIsDeletedFalse(parentUserId, tenantId).orElse(null);
        if (parent == null) {
            log.warn("Guardian sync skipped: parent user not found tenantId={} parentUserId={} studentId={}",
                    tenantId, parentUserId, student.getId());
            return;
        }

        Guardian guardian = guardianRepository
                .findFirstByTenantIdAndUserIdAndIsDeletedFalse(tenantId, parentUserId)
                .orElseGet(() -> createGuardianForParentUser(tenantId, parent));

        if (!mappingRepository.existsByTenantIdAndStudentIdAndGuardianIdAndIsDeletedFalse(
                tenantId, student.getId(), guardian.getId())) {
            List<StudentGuardianMapping> existing = mappingRepository.findByTenantIdAndStudentIdAndIsDeletedFalse(tenantId, student.getId());
            boolean hasPrimary = existing.stream().anyMatch(x -> Boolean.TRUE.equals(x.getIsPrimary()));

            StudentGuardianMapping m = new StudentGuardianMapping();
            m.setTenantId(tenantId);
            m.setStudentId(student.getId());
            m.setGuardianId(guardian.getId());
            m.setRelationType(Enums.GuardianRelationType.GUARDIAN);
            m.setIsPrimary(!hasPrimary);
            m.setIsEmergencyContact(true);
            m.setEffectiveFrom(LocalDate.now());
            m.setIsDeleted(false);
            m.setIsActive(true);
            mappingRepository.save(m);
            log.info("Guardian mapping created studentId={} guardianId={} parentUserId={}",
                    student.getId(), guardian.getId(), parentUserId);
        }

        if (student.getPrimaryContactGuardianId() == null) {
            student.setPrimaryContactGuardianId(guardian.getId());
            studentRepository.save(student);
        }
    }

    private Guardian createGuardianForParentUser(String tenantId, User parent) {
        Guardian g = new Guardian();
        g.setTenantId(tenantId);
        g.setFullName(parent.getName() != null && !parent.getName().isBlank() ? parent.getName().trim() : "Parent");
        g.setPrimaryPhone(PhoneNormalization.guardianPrimaryOrPlaceholder(parent.getPhone(), parent.getId()));
        g.setUserId(parent.getId());
        g.setIsActive(true);
        g.setIsDeleted(false);
        Guardian saved = guardianRepository.save(g);
        log.info("Guardian row created for parent user tenantId={} userId={} guardianId={}", tenantId, parent.getId(), saved.getId());
        return saved;
    }
}
