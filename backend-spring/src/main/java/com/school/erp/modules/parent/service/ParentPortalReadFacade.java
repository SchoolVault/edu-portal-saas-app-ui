package com.school.erp.modules.parent.service;

import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.service.ExamService;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Read-only aggregates for the parent portal. Keeps controllers thin and allows future
 * batched endpoints (e.g. dashboard bundle) without duplicating guardian resolution.
 */
@Service
public class ParentPortalReadFacade {
    private final GuardianService guardianService;
    private final ExamService examService;

    public ParentPortalReadFacade(final GuardianService guardianService, final ExamService examService) {
        this.guardianService = guardianService;
        this.examService = examService;
    }

    /** Full exam card DTOs scoped to the current user’s linked students (class/section audience). */
    public List<ExamDTOs.ExamResponse> listExamsForCurrentParentUser() {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        List<Student> children = guardianService.findStudentsForParentUser(t, uid);
        return examService.listExamsForLinkedStudents(t, children);
    }
}
