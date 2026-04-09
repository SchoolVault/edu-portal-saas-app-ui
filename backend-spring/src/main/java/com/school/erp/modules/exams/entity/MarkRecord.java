package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "mark_records", indexes = {@Index(name = "idx_marks_exam", columnList = "tenant_id, exam_id"), @Index(name = "idx_marks_student", columnList = "tenant_id, student_id")})
public class MarkRecord extends BaseEntity {
    @Column(name = "exam_id", nullable = false)
    private Long examId;
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "subject_name", nullable = false, length = 100)
    private String subjectName;
    @Column(name = "marks_obtained", nullable = false)
    private Double marksObtained;
    @Column(name = "max_marks", nullable = false)
    private Double maxMarks;
    @Column(length = 5)
    private String grade;
    @Column(name = "class_id")
    private Long classId;


    public static class MarkRecordBuilder {
        private Long examId;
        private Long studentId;
        private String studentName;
        private String subjectName;
        private Double marksObtained;
        private Double maxMarks;
        private String grade;
        private Long classId;

        MarkRecordBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder examId(final Long examId) {
            this.examId = examId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder studentId(final Long studentId) {
            this.studentId = studentId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder studentName(final String studentName) {
            this.studentName = studentName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder subjectName(final String subjectName) {
            this.subjectName = subjectName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder marksObtained(final Double marksObtained) {
            this.marksObtained = marksObtained;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder maxMarks(final Double maxMarks) {
            this.maxMarks = maxMarks;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder grade(final String grade) {
            this.grade = grade;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public MarkRecord.MarkRecordBuilder classId(final Long classId) {
            this.classId = classId;
            return this;
        }

        public MarkRecord build() {
            return new MarkRecord(this.examId, this.studentId, this.studentName, this.subjectName, this.marksObtained, this.maxMarks, this.grade, this.classId);
        }

        @Override
        public String toString() {
            return "MarkRecord.MarkRecordBuilder(examId=" + this.examId + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", subjectName=" + this.subjectName + ", marksObtained=" + this.marksObtained + ", maxMarks=" + this.maxMarks + ", grade=" + this.grade + ", classId=" + this.classId + ")";
        }
    }

    public static MarkRecord.MarkRecordBuilder builder() {
        return new MarkRecord.MarkRecordBuilder();
    }

    public Long getExamId() {
        return this.examId;
    }

    public Long getStudentId() {
        return this.studentId;
    }

    public String getStudentName() {
        return this.studentName;
    }

    public String getSubjectName() {
        return this.subjectName;
    }

    public Double getMarksObtained() {
        return this.marksObtained;
    }

    public Double getMaxMarks() {
        return this.maxMarks;
    }

    public String getGrade() {
        return this.grade;
    }

    public Long getClassId() {
        return this.classId;
    }

    public void setExamId(final Long examId) {
        this.examId = examId;
    }

    public void setStudentId(final Long studentId) {
        this.studentId = studentId;
    }

    public void setStudentName(final String studentName) {
        this.studentName = studentName;
    }

    public void setSubjectName(final String subjectName) {
        this.subjectName = subjectName;
    }

    public void setMarksObtained(final Double marksObtained) {
        this.marksObtained = marksObtained;
    }

    public void setMaxMarks(final Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public void setGrade(final String grade) {
        this.grade = grade;
    }

    public void setClassId(final Long classId) {
        this.classId = classId;
    }

    public MarkRecord() {
    }

    public MarkRecord(final Long examId, final Long studentId, final String studentName, final String subjectName, final Double marksObtained, final Double maxMarks, final String grade, final Long classId) {
        this.examId = examId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.subjectName = subjectName;
        this.marksObtained = marksObtained;
        this.maxMarks = maxMarks;
        this.grade = grade;
        this.classId = classId;
    }
}
