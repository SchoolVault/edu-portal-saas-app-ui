package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams", indexes = {@Index(name = "idx_exam_tenant", columnList = "tenant_id")})
public class Exam extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Column(name = "start_date")
    private LocalDate startDate;
    @Column(name = "end_date")
    private LocalDate endDate;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exam_classes", joinColumns = @JoinColumn(name = "exam_id"))
    @Column(name = "class_id")
    private List<Long> classIds = new ArrayList<>();
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Enums.ExamStatus status;


    public static class ExamBuilder {
        private String name;
        private Long academicYearId;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<Long> classIds;
        private Enums.ExamStatus status;

        ExamBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder academicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder startDate(final LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder endDate(final LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public Exam.ExamBuilder classIds(final List<Long> classIds) {
            this.classIds = classIds;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder status(final Enums.ExamStatus status) {
            this.status = status;
            return this;
        }

        public Exam build() {
            return new Exam(this.name, this.academicYearId, this.startDate, this.endDate, this.classIds, this.status);
        }

        @Override
        public String toString() {
            return "Exam.ExamBuilder(name=" + this.name + ", academicYearId=" + this.academicYearId + ", startDate=" + this.startDate + ", endDate=" + this.endDate + ", status=" + this.status + ")";
        }
    }

    public static Exam.ExamBuilder builder() {
        return new Exam.ExamBuilder();
    }

    public String getName() {
        return this.name;
    }

    public Long getAcademicYearId() {
        return this.academicYearId;
    }

    public LocalDate getStartDate() {
        return this.startDate;
    }

    public LocalDate getEndDate() {
        return this.endDate;
    }

    public List<Long> getClassIds() {
        return this.classIds;
    }

    public Enums.ExamStatus getStatus() {
        return this.status;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setAcademicYearId(final Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    public void setStartDate(final LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(final LocalDate endDate) {
        this.endDate = endDate;
    }

    public void setClassIds(final List<Long> classIds) {
        this.classIds = classIds;
    }

    public void setStatus(final Enums.ExamStatus status) {
        this.status = status;
    }

    public Exam() {
    }

    public Exam(final String name, final Long academicYearId, final LocalDate startDate, final LocalDate endDate, final List<Long> classIds, final Enums.ExamStatus status) {
        this.name = name;
        this.academicYearId = academicYearId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.classIds = classIds != null ? classIds : new ArrayList<>();
        this.status = status;
    }
}
