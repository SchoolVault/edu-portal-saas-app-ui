package com.school.erp.common.entity;

import com.school.erp.tenant.AcademicYearContext;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

/**
 * Enforces academic year write safety for {@link AcademicYearScopedEntity}.
 */
public class AcademicYearScopeGuardListener {

    @PrePersist
    @PreUpdate
    public void applyAcademicYearScope(Object entity) {
        if (!(entity instanceof AcademicYearScopedEntity scopedEntity)) {
            return;
        }

        Long contextAcademicYearId = AcademicYearContext.getAcademicYearId();
        if (contextAcademicYearId == null) {
            throw new IllegalStateException("Missing AcademicYearContext for academic-year scoped write");
        }

        Long existingAcademicYearId = scopedEntity.getAcademicYearId();
        if (existingAcademicYearId == null) {
            scopedEntity.setAcademicYearId(contextAcademicYearId);
            return;
        }

        if (!existingAcademicYearId.equals(contextAcademicYearId)) {
            throw new IllegalStateException("Academic year mismatch between entity and request scope");
        }
    }
}
