package com.school.erp.modules.academic.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "academic_years", indexes = {@Index(name = "idx_ay_tenant", columnList = "tenant_id")})
public class AcademicYear extends BaseEntity {
    @Column(nullable = false, length = 50)
    private String name;
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    @Column(name = "is_current")
    private Boolean isCurrent = false;


    public static class AcademicYearBuilder {
        private String name;
        private LocalDate startDate;
        private LocalDate endDate;
        private Boolean isCurrent;

        AcademicYearBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public AcademicYear.AcademicYearBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AcademicYear.AcademicYearBuilder startDate(final LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AcademicYear.AcademicYearBuilder endDate(final LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AcademicYear.AcademicYearBuilder isCurrent(final Boolean isCurrent) {
            this.isCurrent = isCurrent;
            return this;
        }

        public AcademicYear build() {
            return new AcademicYear(this.name, this.startDate, this.endDate, this.isCurrent);
        }

        @Override
        public String toString() {
            return "AcademicYear.AcademicYearBuilder(name=" + this.name + ", startDate=" + this.startDate + ", endDate=" + this.endDate + ", isCurrent=" + this.isCurrent + ")";
        }
    }

    public static AcademicYear.AcademicYearBuilder builder() {
        return new AcademicYear.AcademicYearBuilder();
    }

    public String getName() {
        return this.name;
    }

    public LocalDate getStartDate() {
        return this.startDate;
    }

    public LocalDate getEndDate() {
        return this.endDate;
    }

    public Boolean getIsCurrent() {
        return this.isCurrent;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setStartDate(final LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(final LocalDate endDate) {
        this.endDate = endDate;
    }

    public void setIsCurrent(final Boolean isCurrent) {
        this.isCurrent = isCurrent;
    }

    public AcademicYear() {
    }

    public AcademicYear(final String name, final LocalDate startDate, final LocalDate endDate, final Boolean isCurrent) {
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isCurrent = isCurrent;
    }
}
