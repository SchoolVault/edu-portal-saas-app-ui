package com.school.erp.modules.timetable.dto;

import com.school.erp.modules.academic.dto.AcademicDTOs;

import java.util.ArrayList;
import java.util.List;

/**
 * Admin onboarding: assign homeroom (class teacher) and recurring weekly teaching slots in one transaction.
 * Mirrors the frontend contract; unknown JSON fields are ignored for forward compatibility.
 */
public final class TeacherScheduleOnboardingDTOs {

    private TeacherScheduleOnboardingDTOs() {
    }

    public static class ApplyRequest {
        private Long teacherId;
        /** When set, runs {@code AcademicService.assignClassTeacher} for this teacher first. */
        private HomeroomPayload homeroom;
        /** Soft-delete these timetable rows before applying slots (frees class/teacher conflicts). */
        private List<Long> removeEntryIds = new ArrayList<>();
        private List<TeachingSlotPayload> slots = new ArrayList<>();
        private Options options = new Options();

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public HomeroomPayload getHomeroom() {
            return homeroom;
        }

        public void setHomeroom(HomeroomPayload homeroom) {
            this.homeroom = homeroom;
        }

        public List<Long> getRemoveEntryIds() {
            return removeEntryIds;
        }

        public void setRemoveEntryIds(List<Long> removeEntryIds) {
            this.removeEntryIds = removeEntryIds != null ? removeEntryIds : new ArrayList<>();
        }

        public List<TeachingSlotPayload> getSlots() {
            return slots;
        }

        public void setSlots(List<TeachingSlotPayload> slots) {
            this.slots = slots != null ? slots : new ArrayList<>();
        }

        public Options getOptions() {
            return options;
        }

        public void setOptions(Options options) {
            this.options = options != null ? options : new Options();
        }
    }

    public static class HomeroomPayload {
        private Long classId;
        /** Null when the class has no sections (whole-class homeroom). */
        private Long sectionId;

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
    }

    public static class TeachingSlotPayload {
        /** When set, updates that row; otherwise creates a new recurring slot. */
        private Long existingEntryId;
        private String day;
        private Integer period;
        private String startTime;
        private String endTime;
        private Long classId;
        private Long sectionId;
        private String subjectName;
        private String room;
        private Long replaceTimetableEntryId;

        public Long getExistingEntryId() {
            return existingEntryId;
        }

        public void setExistingEntryId(Long existingEntryId) {
            this.existingEntryId = existingEntryId;
        }

        public String getDay() {
            return day;
        }

        public void setDay(String day) {
            this.day = day;
        }

        public Integer getPeriod() {
            return period;
        }

        public void setPeriod(Integer period) {
            this.period = period;
        }

        public String getStartTime() {
            return startTime;
        }

        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public void setEndTime(String endTime) {
            this.endTime = endTime;
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

        public String getRoom() {
            return room;
        }

        public void setRoom(String room) {
            this.room = room;
        }

        public Long getReplaceTimetableEntryId() {
            return replaceTimetableEntryId;
        }

        public void setReplaceTimetableEntryId(Long replaceTimetableEntryId) {
            this.replaceTimetableEntryId = replaceTimetableEntryId;
        }
    }

    public static class Options {
        /**
         * After slots, ensure Monday period 1 for the homeroom class/section is taught by this teacher
         * (typical Indian-school anchor for class-teacher visibility).
         */
        private boolean anchorMondayFirstPeriod = true;

        public boolean isAnchorMondayFirstPeriod() {
            return anchorMondayFirstPeriod;
        }

        public void setAnchorMondayFirstPeriod(boolean anchorMondayFirstPeriod) {
            this.anchorMondayFirstPeriod = anchorMondayFirstPeriod;
        }
    }

    public static class ApplyResponse {
        private Long teacherId;
        private String teacherName;
        private AcademicDTOs.ClassWithSectionsResponse homeroomClass;
        private List<Long> createdEntryIds = new ArrayList<>();
        private List<Long> updatedEntryIds = new ArrayList<>();
        private List<Long> removedEntryIds = new ArrayList<>();
        private Long anchoredEntryId;

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

        public AcademicDTOs.ClassWithSectionsResponse getHomeroomClass() {
            return homeroomClass;
        }

        public void setHomeroomClass(AcademicDTOs.ClassWithSectionsResponse homeroomClass) {
            this.homeroomClass = homeroomClass;
        }

        public List<Long> getCreatedEntryIds() {
            return createdEntryIds;
        }

        public void setCreatedEntryIds(List<Long> createdEntryIds) {
            this.createdEntryIds = createdEntryIds != null ? createdEntryIds : new ArrayList<>();
        }

        public List<Long> getUpdatedEntryIds() {
            return updatedEntryIds;
        }

        public void setUpdatedEntryIds(List<Long> updatedEntryIds) {
            this.updatedEntryIds = updatedEntryIds != null ? updatedEntryIds : new ArrayList<>();
        }

        public List<Long> getRemovedEntryIds() {
            return removedEntryIds;
        }

        public void setRemovedEntryIds(List<Long> removedEntryIds) {
            this.removedEntryIds = removedEntryIds != null ? removedEntryIds : new ArrayList<>();
        }

        public Long getAnchoredEntryId() {
            return anchoredEntryId;
        }

        public void setAnchoredEntryId(Long anchoredEntryId) {
            this.anchoredEntryId = anchoredEntryId;
        }
    }

    /** Pre-save dry-run result for onboarding screens (no DB writes). */
    public static class ValidateResponse {
        private boolean valid;
        private Long teacherId;
        private String teacherName;
        private int slotsToCreate;
        private int slotsToUpdate;
        private int slotsToDelete;
        private List<ValidationIssue> issues = new ArrayList<>();

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
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

        public int getSlotsToCreate() {
            return slotsToCreate;
        }

        public void setSlotsToCreate(int slotsToCreate) {
            this.slotsToCreate = slotsToCreate;
        }

        public int getSlotsToUpdate() {
            return slotsToUpdate;
        }

        public void setSlotsToUpdate(int slotsToUpdate) {
            this.slotsToUpdate = slotsToUpdate;
        }

        public int getSlotsToDelete() {
            return slotsToDelete;
        }

        public void setSlotsToDelete(int slotsToDelete) {
            this.slotsToDelete = slotsToDelete;
        }

        public List<ValidationIssue> getIssues() {
            return issues;
        }

        public void setIssues(List<ValidationIssue> issues) {
            this.issues = issues != null ? issues : new ArrayList<>();
        }
    }

    public static class ValidationIssue {
        private String code;
        private String message;
        private String conflictType;
        private Long existingEntryId;
        private String day;
        private Integer period;
        private String startTime;
        private String endTime;
        private Long classId;
        private Long sectionId;
        private String room;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getConflictType() {
            return conflictType;
        }

        public void setConflictType(String conflictType) {
            this.conflictType = conflictType;
        }

        public Long getExistingEntryId() {
            return existingEntryId;
        }

        public void setExistingEntryId(Long existingEntryId) {
            this.existingEntryId = existingEntryId;
        }

        public String getDay() {
            return day;
        }

        public void setDay(String day) {
            this.day = day;
        }

        public Integer getPeriod() {
            return period;
        }

        public void setPeriod(Integer period) {
            this.period = period;
        }

        public String getStartTime() {
            return startTime;
        }

        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public void setEndTime(String endTime) {
            this.endTime = endTime;
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

        public String getRoom() {
            return room;
        }

        public void setRoom(String room) {
            this.room = room;
        }
    }
}
