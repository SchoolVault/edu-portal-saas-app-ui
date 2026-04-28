package com.school.erp.modules.timetable.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Filter;
import org.hibernate.type.SqlTypes;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "timetable_entries", indexes = {@Index(name = "idx_tt_class_section", columnList = "tenant_id, class_id, section_id"), @Index(name = "idx_tt_teacher", columnList = "tenant_id, teacher_id")})
public class TimetableEntry extends BaseEntity implements AcademicYearScopedEntity {
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Column(name = "timetable_version")
    private Integer timetableVersion = 1;
    @Column(name = "has_conflict")
    private Boolean hasConflict = false;
    @Column(name = "class_id", nullable = false)
    private Long classId;
    @Column(name = "section_id")
    private Long sectionId;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private Enums.DayOfWeek day;
    @Column(nullable = false)
    private Integer period;
    @Column(name = "start_time")
    private LocalTime startTime;
    @Column(name = "end_time")
    private LocalTime endTime;
    @Column(name = "subject_name", nullable = false, length = 100)
    private String subjectName;
    @Column(name = "teacher_id")
    private Long teacherId;
    @Column(name = "teacher_name", length = 200)
    private String teacherName;
    @Column(length = 50)
    private String room;


    public static class TimetableEntryBuilder {
        private Long classId;
        private Long sectionId;
        private Enums.DayOfWeek day;
        private Integer period;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subjectName;
        private Long teacherId;
        private String teacherName;
        private String room;

        TimetableEntryBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder classId(final Long classId) {
            this.classId = classId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder sectionId(final Long sectionId) {
            this.sectionId = sectionId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder day(final Enums.DayOfWeek day) {
            this.day = day;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder period(final Integer period) {
            this.period = period;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder startTime(final LocalTime startTime) {
            this.startTime = startTime;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder endTime(final LocalTime endTime) {
            this.endTime = endTime;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder subjectName(final String subjectName) {
            this.subjectName = subjectName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder teacherId(final Long teacherId) {
            this.teacherId = teacherId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder teacherName(final String teacherName) {
            this.teacherName = teacherName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TimetableEntry.TimetableEntryBuilder room(final String room) {
            this.room = room;
            return this;
        }

        public TimetableEntry build() {
            return new TimetableEntry(this.classId, this.sectionId, this.day, this.period, this.startTime, this.endTime, this.subjectName, this.teacherId, this.teacherName, this.room);
        }

        @Override
        public String toString() {
            return "TimetableEntry.TimetableEntryBuilder(classId=" + this.classId + ", sectionId=" + this.sectionId + ", day=" + this.day + ", period=" + this.period + ", startTime=" + this.startTime + ", endTime=" + this.endTime + ", subjectName=" + this.subjectName + ", teacherId=" + this.teacherId + ", teacherName=" + this.teacherName + ", room=" + this.room + ")";
        }
    }

    public static TimetableEntry.TimetableEntryBuilder builder() {
        return new TimetableEntry.TimetableEntryBuilder();
    }

    public Long getAcademicYearId() {
        return academicYearId;
    }

    public void setAcademicYearId(Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    public Integer getTimetableVersion() {
        return timetableVersion;
    }

    public void setTimetableVersion(Integer timetableVersion) {
        this.timetableVersion = timetableVersion;
    }

    public Boolean getHasConflict() {
        return hasConflict;
    }

    public void setHasConflict(Boolean hasConflict) {
        this.hasConflict = hasConflict;
    }

    public Long getClassId() {
        return this.classId;
    }

    public Long getSectionId() {
        return this.sectionId;
    }

    public Enums.DayOfWeek getDay() {
        return this.day;
    }

    public Integer getPeriod() {
        return this.period;
    }

    public LocalTime getStartTime() {
        return this.startTime;
    }

    public LocalTime getEndTime() {
        return this.endTime;
    }

    public String getSubjectName() {
        return this.subjectName;
    }

    public Long getTeacherId() {
        return this.teacherId;
    }

    public String getTeacherName() {
        return this.teacherName;
    }

    public String getRoom() {
        return this.room;
    }

    public void setClassId(final Long classId) {
        this.classId = classId;
    }

    public void setSectionId(final Long sectionId) {
        this.sectionId = sectionId;
    }

    public void setDay(final Enums.DayOfWeek day) {
        this.day = day;
    }

    public void setPeriod(final Integer period) {
        this.period = period;
    }

    public void setStartTime(final LocalTime startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(final LocalTime endTime) {
        this.endTime = endTime;
    }

    public void setSubjectName(final String subjectName) {
        this.subjectName = subjectName;
    }

    public void setTeacherId(final Long teacherId) {
        this.teacherId = teacherId;
    }

    public void setTeacherName(final String teacherName) {
        this.teacherName = teacherName;
    }

    public void setRoom(final String room) {
        this.room = room;
    }

    public TimetableEntry() {
    }

    public TimetableEntry(final Long classId, final Long sectionId, final Enums.DayOfWeek day, final Integer period, final LocalTime startTime, final LocalTime endTime, final String subjectName, final Long teacherId, final String teacherName, final String room) {
        this.classId = classId;
        this.sectionId = sectionId;
        this.day = day;
        this.period = period;
        this.startTime = startTime;
        this.endTime = endTime;
        this.subjectName = subjectName;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.room = room;
    }
}
