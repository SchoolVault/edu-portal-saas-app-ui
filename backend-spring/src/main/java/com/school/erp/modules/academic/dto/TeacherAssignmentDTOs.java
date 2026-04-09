package com.school.erp.modules.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public final class TeacherAssignmentDTOs {

    private TeacherAssignmentDTOs() {
    }

    public static class CreateClassTeacherAssignmentRequest {
        @NotNull
        private Long academicYearId;
        @NotNull
        private Long classId;
        private Long sectionId;
        @NotNull
        private Long teacherId;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public Long getClassId() {
            return classId;
        }

        public void setClassId(Long classId) {
            this.classId = classId;
        }

        public Long getSectionId() {
            return sectionId;
        }

        public void setSectionId(Long sectionId) {
            this.sectionId = sectionId;
        }

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public LocalDate getEffectiveFrom() {
            return effectiveFrom;
        }

        public void setEffectiveFrom(LocalDate effectiveFrom) {
            this.effectiveFrom = effectiveFrom;
        }

        public LocalDate getEffectiveTo() {
            return effectiveTo;
        }

        public void setEffectiveTo(LocalDate effectiveTo) {
            this.effectiveTo = effectiveTo;
        }
    }

    public static class CreateSubjectTeacherAssignmentRequest {
        @NotNull
        private Long academicYearId;
        @NotNull
        private Long classId;
        private Long sectionId;
        @NotBlank
        private String subjectName;
        @NotNull
        private Long teacherId;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public Long getClassId() {
            return classId;
        }

        public void setClassId(Long classId) {
            this.classId = classId;
        }

        public Long getSectionId() {
            return sectionId;
        }

        public void setSectionId(Long sectionId) {
            this.sectionId = sectionId;
        }

        public String getSubjectName() {
            return subjectName;
        }

        public void setSubjectName(String subjectName) {
            this.subjectName = subjectName;
        }

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public LocalDate getEffectiveFrom() {
            return effectiveFrom;
        }

        public void setEffectiveFrom(LocalDate effectiveFrom) {
            this.effectiveFrom = effectiveFrom;
        }

        public LocalDate getEffectiveTo() {
            return effectiveTo;
        }

        public void setEffectiveTo(LocalDate effectiveTo) {
            this.effectiveTo = effectiveTo;
        }
    }

    public static class ClassTeacherAssignmentResponse {
        private Long id;
        private Long academicYearId;
        private Long classId;
        private Long sectionId;
        private Long teacherId;
        private String teacherName;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public Long getClassId() {
            return classId;
        }

        public void setClassId(Long classId) {
            this.classId = classId;
        }

        public Long getSectionId() {
            return sectionId;
        }

        public void setSectionId(Long sectionId) {
            this.sectionId = sectionId;
        }

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public String getTeacherName() {
            return teacherName;
        }

        public void setTeacherName(String teacherName) {
            this.teacherName = teacherName;
        }

        public LocalDate getEffectiveFrom() {
            return effectiveFrom;
        }

        public void setEffectiveFrom(LocalDate effectiveFrom) {
            this.effectiveFrom = effectiveFrom;
        }

        public LocalDate getEffectiveTo() {
            return effectiveTo;
        }

        public void setEffectiveTo(LocalDate effectiveTo) {
            this.effectiveTo = effectiveTo;
        }
    }

    public static class SubjectTeacherAssignmentResponse {
        private Long id;
        private Long academicYearId;
        private Long classId;
        private Long sectionId;
        private String subjectName;
        private Long teacherId;
        private String teacherName;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public Long getClassId() {
            return classId;
        }

        public void setClassId(Long classId) {
            this.classId = classId;
        }

        public Long getSectionId() {
            return sectionId;
        }

        public void setSectionId(Long sectionId) {
            this.sectionId = sectionId;
        }

        public String getSubjectName() {
            return subjectName;
        }

        public void setSubjectName(String subjectName) {
            this.subjectName = subjectName;
        }

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public String getTeacherName() {
            return teacherName;
        }

        public void setTeacherName(String teacherName) {
            this.teacherName = teacherName;
        }

        public LocalDate getEffectiveFrom() {
            return effectiveFrom;
        }

        public void setEffectiveFrom(LocalDate effectiveFrom) {
            this.effectiveFrom = effectiveFrom;
        }

        public LocalDate getEffectiveTo() {
            return effectiveTo;
        }

        public void setEffectiveTo(LocalDate effectiveTo) {
            this.effectiveTo = effectiveTo;
        }
    }

    public static class TeacherWorkloadResponse {
        private Long teacherId;
        private String teacherName;
        private int classTeacherSlots;
        private int subjectAssignments;

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public String getTeacherName() {
            return teacherName;
        }

        public void setTeacherName(String teacherName) {
            this.teacherName = teacherName;
        }

        public int getClassTeacherSlots() {
            return classTeacherSlots;
        }

        public void setClassTeacherSlots(int classTeacherSlots) {
            this.classTeacherSlots = classTeacherSlots;
        }

        public int getSubjectAssignments() {
            return subjectAssignments;
        }

        public void setSubjectAssignments(int subjectAssignments) {
            this.subjectAssignments = subjectAssignments;
        }
    }
}
