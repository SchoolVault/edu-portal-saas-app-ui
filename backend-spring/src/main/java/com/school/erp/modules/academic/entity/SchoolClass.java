package com.school.erp.modules.academic.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "school_classes", indexes = {@Index(name = "idx_class_tenant", columnList = "tenant_id")})
public class SchoolClass extends BaseEntity implements AcademicYearScopedEntity {
    @Column(nullable = false, length = 50)
    private String name;
    @Column(nullable = false)
    private Integer grade;
    @Column(name = "class_teacher_id")
    private Long classTeacherId;
    @Column(name = "class_teacher_name", length = 200)
    private String classTeacherName;
    @Column(name = "academic_year_id", nullable = false)
    private Long academicYearId;


    public static class SchoolClassBuilder {
        private String name;
        private Integer grade;
        private Long classTeacherId;
        private String classTeacherName;
        private Long academicYearId;

        SchoolClassBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public SchoolClass.SchoolClassBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SchoolClass.SchoolClassBuilder grade(final Integer grade) {
            this.grade = grade;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SchoolClass.SchoolClassBuilder classTeacherId(final Long classTeacherId) {
            this.classTeacherId = classTeacherId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SchoolClass.SchoolClassBuilder classTeacherName(final String classTeacherName) {
            this.classTeacherName = classTeacherName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public SchoolClass.SchoolClassBuilder academicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
            return this;
        }

        public SchoolClass build() {
            return new SchoolClass(this.name, this.grade, this.classTeacherId, this.classTeacherName, this.academicYearId);
        }

        @Override
        public String toString() {
            return "SchoolClass.SchoolClassBuilder(name=" + this.name + ", grade=" + this.grade + ", classTeacherId=" + this.classTeacherId + ", classTeacherName=" + this.classTeacherName + ", academicYearId=" + this.academicYearId + ")";
        }
    }

    public static SchoolClass.SchoolClassBuilder builder() {
        return new SchoolClass.SchoolClassBuilder();
    }

    public String getName() {
        return this.name;
    }

    public Integer getGrade() {
        return this.grade;
    }

    public Long getClassTeacherId() {
        return this.classTeacherId;
    }

    public String getClassTeacherName() {
        return this.classTeacherName;
    }

    public Long getAcademicYearId() {
        return this.academicYearId;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setGrade(final Integer grade) {
        this.grade = grade;
    }

    public void setClassTeacherId(final Long classTeacherId) {
        this.classTeacherId = classTeacherId;
    }

    public void setClassTeacherName(final String classTeacherName) {
        this.classTeacherName = classTeacherName;
    }

    public void setAcademicYearId(final Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    public SchoolClass() {
    }

    public SchoolClass(final String name, final Integer grade, final Long classTeacherId, final String classTeacherName, final Long academicYearId) {
        this.name = name;
        this.grade = grade;
        this.classTeacherId = classTeacherId;
        this.classTeacherName = classTeacherName;
        this.academicYearId = academicYearId;
    }
}
