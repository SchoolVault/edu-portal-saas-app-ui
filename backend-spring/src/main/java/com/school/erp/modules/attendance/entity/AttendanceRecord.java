package com.school.erp.modules.attendance.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "attendance_records", indexes = {@Index(name = "idx_att_tenant_class_date", columnList = "tenant_id, class_id, date"), @Index(name = "idx_att_student_date", columnList = "tenant_id, student_id, date")})
public class AttendanceRecord extends BaseEntity {
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "class_id", nullable = false)
    private Long classId;
    @Column(name = "section_id", nullable = false)
    private Long sectionId;
    @Column(nullable = false)
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private Enums.AttendanceStatus status;
    @Column(name = "marked_by")
    private Long markedBy;
    @Column(length = 500)
    private String remarks;


    public static class AttendanceRecordBuilder {
        private Long studentId;
        private String studentName;
        private Long classId;
        private Long sectionId;
        private LocalDate date;
        private Enums.AttendanceStatus status;
        private Long markedBy;
        private String remarks;

        AttendanceRecordBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder studentId(final Long studentId) {
            this.studentId = studentId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder studentName(final String studentName) {
            this.studentName = studentName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder classId(final Long classId) {
            this.classId = classId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder sectionId(final Long sectionId) {
            this.sectionId = sectionId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder date(final LocalDate date) {
            this.date = date;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder status(final Enums.AttendanceStatus status) {
            this.status = status;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder markedBy(final Long markedBy) {
            this.markedBy = markedBy;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public AttendanceRecord.AttendanceRecordBuilder remarks(final String remarks) {
            this.remarks = remarks;
            return this;
        }

        public AttendanceRecord build() {
            return new AttendanceRecord(this.studentId, this.studentName, this.classId, this.sectionId, this.date, this.status, this.markedBy, this.remarks);
        }

        @Override
        public String toString() {
            return "AttendanceRecord.AttendanceRecordBuilder(studentId=" + this.studentId + ", studentName=" + this.studentName + ", classId=" + this.classId + ", sectionId=" + this.sectionId + ", date=" + this.date + ", status=" + this.status + ", markedBy=" + this.markedBy + ", remarks=" + this.remarks + ")";
        }
    }

    public static AttendanceRecord.AttendanceRecordBuilder builder() {
        return new AttendanceRecord.AttendanceRecordBuilder();
    }

    public Long getStudentId() {
        return this.studentId;
    }

    public String getStudentName() {
        return this.studentName;
    }

    public Long getClassId() {
        return this.classId;
    }

    public Long getSectionId() {
        return this.sectionId;
    }

    public LocalDate getDate() {
        return this.date;
    }

    public Enums.AttendanceStatus getStatus() {
        return this.status;
    }

    public Long getMarkedBy() {
        return this.markedBy;
    }

    public String getRemarks() {
        return this.remarks;
    }

    public void setStudentId(final Long studentId) {
        this.studentId = studentId;
    }

    public void setStudentName(final String studentName) {
        this.studentName = studentName;
    }

    public void setClassId(final Long classId) {
        this.classId = classId;
    }

    public void setSectionId(final Long sectionId) {
        this.sectionId = sectionId;
    }

    public void setDate(final LocalDate date) {
        this.date = date;
    }

    public void setStatus(final Enums.AttendanceStatus status) {
        this.status = status;
    }

    public void setMarkedBy(final Long markedBy) {
        this.markedBy = markedBy;
    }

    public void setRemarks(final String remarks) {
        this.remarks = remarks;
    }

    public AttendanceRecord() {
    }

    public AttendanceRecord(final Long studentId, final String studentName, final Long classId, final Long sectionId, final LocalDate date, final Enums.AttendanceStatus status, final Long markedBy, final String remarks) {
        this.studentId = studentId;
        this.studentName = studentName;
        this.classId = classId;
        this.sectionId = sectionId;
        this.date = date;
        this.status = status;
        this.markedBy = markedBy;
        this.remarks = remarks;
    }
}
