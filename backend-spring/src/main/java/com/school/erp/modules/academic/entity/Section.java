package com.school.erp.modules.academic.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "sections", indexes = {@Index(name = "idx_section_class", columnList = "tenant_id, class_id")})
public class Section extends BaseEntity {
    @Column(nullable = false, length = 10)
    private String name;
    @Column(name = "class_id", nullable = false)
    private Long classId;
    @Column(nullable = false)
    private Integer capacity;
    @Column(name = "student_count")
    private Integer studentCount = 0;

    /** Homeroom / class teacher when this class is split into sections (Indian school model). */
    @Column(name = "class_teacher_id")
    private Long classTeacherId;

    @Column(name = "class_teacher_name", length = 200)
    private String classTeacherName;


    public static class SectionBuilder {
        private String name;
        private Long classId;
        private Integer capacity;
        private Integer studentCount;
        private Long classTeacherId;
        private String classTeacherName;

        SectionBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Section.SectionBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Section.SectionBuilder classId(final Long classId) {
            this.classId = classId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Section.SectionBuilder capacity(final Integer capacity) {
            this.capacity = capacity;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Section.SectionBuilder studentCount(final Integer studentCount) {
            this.studentCount = studentCount;
            return this;
        }

        public Section.SectionBuilder classTeacherId(final Long classTeacherId) {
            this.classTeacherId = classTeacherId;
            return this;
        }

        public Section.SectionBuilder classTeacherName(final String classTeacherName) {
            this.classTeacherName = classTeacherName;
            return this;
        }

        public Section build() {
            return new Section(this.name, this.classId, this.capacity, this.studentCount, this.classTeacherId, this.classTeacherName);
        }

        @Override
        public String toString() {
            return "Section.SectionBuilder(name=" + this.name + ", classId=" + this.classId + ", capacity=" + this.capacity + ", studentCount=" + this.studentCount + ", classTeacherId=" + this.classTeacherId + ", classTeacherName=" + this.classTeacherName + ")";
        }
    }

    public static Section.SectionBuilder builder() {
        return new Section.SectionBuilder();
    }

    public String getName() {
        return this.name;
    }

    public Long getClassId() {
        return this.classId;
    }

    public Integer getCapacity() {
        return this.capacity;
    }

    public Integer getStudentCount() {
        return this.studentCount;
    }

    public Long getClassTeacherId() {
        return this.classTeacherId;
    }

    public String getClassTeacherName() {
        return this.classTeacherName;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setClassId(final Long classId) {
        this.classId = classId;
    }

    public void setCapacity(final Integer capacity) {
        this.capacity = capacity;
    }

    public void setStudentCount(final Integer studentCount) {
        this.studentCount = studentCount;
    }

    public void setClassTeacherId(final Long classTeacherId) {
        this.classTeacherId = classTeacherId;
    }

    public void setClassTeacherName(final String classTeacherName) {
        this.classTeacherName = classTeacherName;
    }

    public Section() {
    }

    public Section(final String name, final Long classId, final Integer capacity, final Integer studentCount) {
        this.name = name;
        this.classId = classId;
        this.capacity = capacity;
        this.studentCount = studentCount;
    }

    public Section(
            final String name,
            final Long classId,
            final Integer capacity,
            final Integer studentCount,
            final Long classTeacherId,
            final String classTeacherName) {
        this.name = name;
        this.classId = classId;
        this.capacity = capacity;
        this.studentCount = studentCount;
        this.classTeacherId = classTeacherId;
        this.classTeacherName = classTeacherName;
    }
}
