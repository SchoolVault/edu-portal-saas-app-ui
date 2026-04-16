package com.school.erp.modules.parent.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.service.ExamService;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.parent.cache.ParentPortalExamPageCache;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Read-only aggregates for the parent portal. Keeps controllers thin and allows future
 * batched endpoints (e.g. dashboard bundle) without duplicating guardian resolution.
 */
@Service
public class ParentPortalReadFacade {
    private final GuardianService guardianService;
    private final ExamService examService;
    private final ParentPortalExamPageCache parentPortalExamPageCache;

    public ParentPortalReadFacade(
            final GuardianService guardianService,
            final ExamService examService,
            final ParentPortalExamPageCache parentPortalExamPageCache) {
        this.guardianService = guardianService;
        this.examService = examService;
        this.parentPortalExamPageCache = parentPortalExamPageCache;
    }

    /** Full exam card DTOs scoped to the current user’s linked students (class/section audience). */
    public List<ExamDTOs.ExamResponse> listExamsForCurrentParentUser() {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        List<Student> children = guardianService.findStudentsForParentUser(t, uid).stream()
                .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                .collect(Collectors.toList());
        return examService.listExamsForLinkedStudents(t, children);
    }

    /**
     * Paged exam cards for the parent portal with a short-lived per-tenant/user cache (see {@link ParentPortalExamPageCache}).
     */
    public PageResponse<ExamDTOs.ExamResponse> listExamsForCurrentParentUserPaged(int page, int size) {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        if (uid == null) {
            return PageResponse.of(List.of(), page, size, 0);
        }
        PageResponse<ExamDTOs.ExamResponse> cached = parentPortalExamPageCache.getIfPresent(t, uid, page, size);
        if (cached != null) {
            return cached;
        }
        List<Student> children = guardianService.findStudentsForParentUser(t, uid).stream()
                .filter(s -> s.getStatus() == Enums.StudentStatus.ACTIVE)
                .collect(Collectors.toList());
        PageResponse<ExamDTOs.ExamResponse> built = examService.listExamsForLinkedStudentsPaged(t, children, page, size);
        parentPortalExamPageCache.put(t, uid, page, size, built);
        return built;
    }
}
