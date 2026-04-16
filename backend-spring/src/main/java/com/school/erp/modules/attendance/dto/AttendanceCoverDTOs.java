package com.school.erp.modules.attendance.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class AttendanceCoverDTOs {

    public static class CreateRequest {
        @NotNull
        private LocalDate coverDate;
        private Integer periodNumber;
        @NotNull
        private Long classId;
        private Long sectionId;
        private Long regularTeacherId;
        @NotNull
        private Long coveringTeacherId;
        private String reason;
        private Long timetableEntryId;

        /**
         * When the server detects an active cover already occupying the same class / section / period / day slice,
         * the client must resubmit with this id set to that row's id to confirm cancelling the prior cover atomically.
         */
        private Long replaceCoverAssignmentId;

        public LocalDate getCoverDate() {
            return coverDate;
        }

        public void setCoverDate(LocalDate coverDate) {
            this.coverDate = coverDate;
        }

        public Integer getPeriodNumber() {
            return periodNumber;
        }

        public void setPeriodNumber(Integer periodNumber) {
            this.periodNumber = periodNumber;
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

        public Long getRegularTeacherId() {
            return regularTeacherId;
        }

        public void setRegularTeacherId(Long regularTeacherId) {
            this.regularTeacherId = regularTeacherId;
        }

        public Long getCoveringTeacherId() {
            return coveringTeacherId;
        }

        public void setCoveringTeacherId(Long coveringTeacherId) {
            this.coveringTeacherId = coveringTeacherId;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public Long getTimetableEntryId() {
            return timetableEntryId;
        }

        public void setTimetableEntryId(Long timetableEntryId) {
            this.timetableEntryId = timetableEntryId;
        }

        public Long getReplaceCoverAssignmentId() {
            return replaceCoverAssignmentId;
        }

        public void setReplaceCoverAssignmentId(Long replaceCoverAssignmentId) {
            this.replaceCoverAssignmentId = replaceCoverAssignmentId;
        }
    }

    public static class Response {
        private Long id;
        private String coverDate;
        private Integer periodNumber;
        private Long classId;
        private Long sectionId;
        private Long regularTeacherId;
        private Long coveringTeacherId;
        private String reason;
        private String status;
        private Long timetableEntryId;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getCoverDate() {
            return coverDate;
        }

        public void setCoverDate(String coverDate) {
            this.coverDate = coverDate;
        }

        public Integer getPeriodNumber() {
            return periodNumber;
        }

        public void setPeriodNumber(Integer periodNumber) {
            this.periodNumber = periodNumber;
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

        public Long getRegularTeacherId() {
            return regularTeacherId;
        }

        public void setRegularTeacherId(Long regularTeacherId) {
            this.regularTeacherId = regularTeacherId;
        }

        public Long getCoveringTeacherId() {
            return coveringTeacherId;
        }

        public void setCoveringTeacherId(Long coveringTeacherId) {
            this.coveringTeacherId = coveringTeacherId;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Long getTimetableEntryId() {
            return timetableEntryId;
        }

        public void setTimetableEntryId(Long timetableEntryId) {
            this.timetableEntryId = timetableEntryId;
        }
    }

    /**
     * Returned with HTTP 409 when an active cover already occupies the requested slot for another teacher.
     */
    public static class ConflictPayload {
        private Long existingCoverAssignmentId;
        private Long existingCoveringTeacherId;
        private String existingCoveringTeacherName;
        private String coverDate;
        private Long classId;
        private Long sectionId;
        private Integer periodNumber;

        public Long getExistingCoverAssignmentId() {
            return existingCoverAssignmentId;
        }

        public void setExistingCoverAssignmentId(Long existingCoverAssignmentId) {
            this.existingCoverAssignmentId = existingCoverAssignmentId;
        }

        public Long getExistingCoveringTeacherId() {
            return existingCoveringTeacherId;
        }

        public void setExistingCoveringTeacherId(Long existingCoveringTeacherId) {
            this.existingCoveringTeacherId = existingCoveringTeacherId;
        }

        public String getExistingCoveringTeacherName() {
            return existingCoveringTeacherName;
        }

        public void setExistingCoveringTeacherName(String existingCoveringTeacherName) {
            this.existingCoveringTeacherName = existingCoveringTeacherName;
        }

        public String getCoverDate() {
            return coverDate;
        }

        public void setCoverDate(String coverDate) {
            this.coverDate = coverDate;
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

        public Integer getPeriodNumber() {
            return periodNumber;
        }

        public void setPeriodNumber(Integer periodNumber) {
            this.periodNumber = periodNumber;
        }
    }
}
