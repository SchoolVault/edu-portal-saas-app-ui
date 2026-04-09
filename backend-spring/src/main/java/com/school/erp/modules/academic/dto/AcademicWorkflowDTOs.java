package com.school.erp.modules.academic.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

public class AcademicWorkflowDTOs {

    public static class PromotionStudentPreview {
        private Long studentId;
        private String firstName;
        private String lastName;
        private String rollNumber;
        private String currentClassName;
        private double averageScore;
        private boolean eligible;

        public Long getStudentId() {
            return this.studentId;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public String getFirstName() {
            return this.firstName;
        }

        public void setFirstName(final String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return this.lastName;
        }

        public void setLastName(final String lastName) {
            this.lastName = lastName;
        }

        public String getRollNumber() {
            return this.rollNumber;
        }

        public void setRollNumber(final String rollNumber) {
            this.rollNumber = rollNumber;
        }

        public String getCurrentClassName() {
            return this.currentClassName;
        }

        public void setCurrentClassName(final String currentClassName) {
            this.currentClassName = currentClassName;
        }

        public double getAverageScore() {
            return this.averageScore;
        }

        public void setAverageScore(final double averageScore) {
            this.averageScore = averageScore;
        }

        public boolean isEligible() {
            return this.eligible;
        }

        public void setEligible(final boolean eligible) {
            this.eligible = eligible;
        }
    }

    public static class PromotionPreviewResponse {
        private Long sourceClassId;
        private String sourceClassName;
        private Long targetClassId;
        private String targetClassName;
        private Long defaultSectionId;
        private String defaultSectionName;
        private List<PromotionStudentPreview> students = new ArrayList<>();

        public Long getSourceClassId() {
            return this.sourceClassId;
        }

        public void setSourceClassId(final Long sourceClassId) {
            this.sourceClassId = sourceClassId;
        }

        public String getSourceClassName() {
            return this.sourceClassName;
        }

        public void setSourceClassName(final String sourceClassName) {
            this.sourceClassName = sourceClassName;
        }

        public Long getTargetClassId() {
            return this.targetClassId;
        }

        public void setTargetClassId(final Long targetClassId) {
            this.targetClassId = targetClassId;
        }

        public String getTargetClassName() {
            return this.targetClassName;
        }

        public void setTargetClassName(final String targetClassName) {
            this.targetClassName = targetClassName;
        }

        public Long getDefaultSectionId() {
            return this.defaultSectionId;
        }

        public void setDefaultSectionId(final Long defaultSectionId) {
            this.defaultSectionId = defaultSectionId;
        }

        public String getDefaultSectionName() {
            return this.defaultSectionName;
        }

        public void setDefaultSectionName(final String defaultSectionName) {
            this.defaultSectionName = defaultSectionName;
        }

        public List<PromotionStudentPreview> getStudents() {
            return this.students;
        }

        public void setStudents(final List<PromotionStudentPreview> students) {
            this.students = students;
        }
    }

    public static class PromoteStudentsRequest {
        @NotNull
        private Long sourceClassId;
        @NotNull
        private Long targetClassId;
        private Long targetSectionId;
        @NotEmpty
        private List<Long> studentIds;

        public Long getSourceClassId() {
            return this.sourceClassId;
        }

        public void setSourceClassId(final Long sourceClassId) {
            this.sourceClassId = sourceClassId;
        }

        public Long getTargetClassId() {
            return this.targetClassId;
        }

        public void setTargetClassId(final Long targetClassId) {
            this.targetClassId = targetClassId;
        }

        public Long getTargetSectionId() {
            return this.targetSectionId;
        }

        public void setTargetSectionId(final Long targetSectionId) {
            this.targetSectionId = targetSectionId;
        }

        public List<Long> getStudentIds() {
            return this.studentIds;
        }

        public void setStudentIds(final List<Long> studentIds) {
            this.studentIds = studentIds;
        }
    }

    public static class PromotionResultResponse {
        private int promotedCount;
        private String targetClassName;
        private String targetSectionName;

        public int getPromotedCount() {
            return this.promotedCount;
        }

        public void setPromotedCount(final int promotedCount) {
            this.promotedCount = promotedCount;
        }

        public String getTargetClassName() {
            return this.targetClassName;
        }

        public void setTargetClassName(final String targetClassName) {
            this.targetClassName = targetClassName;
        }

        public String getTargetSectionName() {
            return this.targetSectionName;
        }

        public void setTargetSectionName(final String targetSectionName) {
            this.targetSectionName = targetSectionName;
        }
    }
}
