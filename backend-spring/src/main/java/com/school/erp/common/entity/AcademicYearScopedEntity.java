package com.school.erp.common.entity;

/**
 * Contract for entities that must always be scoped by academic year.
 */
public interface AcademicYearScopedEntity {

    Long getAcademicYearId();

    void setAcademicYearId(Long academicYearId);
}
