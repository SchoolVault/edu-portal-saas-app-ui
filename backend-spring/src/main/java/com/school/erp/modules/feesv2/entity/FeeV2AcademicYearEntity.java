package com.school.erp.modules.feesv2.entity;

import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.entity.BaseEntity;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
public abstract class FeeV2AcademicYearEntity extends BaseEntity implements AcademicYearScopedEntity {

    @Column(name = "academic_year_id", nullable = false)
    private Long academicYearId;
}
