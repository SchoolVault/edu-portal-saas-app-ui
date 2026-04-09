package com.school.erp.modules.exams.dto;

import java.util.List;

/**
 * Exam audience (class ± section) and dated timetable slots — JSON-friendly DTOs kept small on purpose.
 */
public final class ExamScopeDtos {

    private ExamScopeDtos() {}

    public static class ClassScopeIn {
        private Long classId;
        /** Null or absent = entire class (all sections, including students with no section). */
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

    public static class ClassScopeOut {
        private Long classId;
        private Long sectionId;
        private String className;
        private String sectionName;

        public ClassScopeOut() {}

        public ClassScopeOut(Long classId, Long sectionId, String className, String sectionName) {
            this.classId = classId;
            this.sectionId = sectionId;
            this.className = className;
            this.sectionName = sectionName;
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

        public String getClassName() {
            return className;
        }

        public void setClassName(String className) {
            this.className = className;
        }

        public String getSectionName() {
            return sectionName;
        }

        public void setSectionName(String sectionName) {
            this.sectionName = sectionName;
        }
    }

    public static class ScheduleSlotIn {
        private Long classId;
        private Long sectionId;
        private String subjectName;
        private String examDate;
        private String startTime;
        private String endTime;
        private String room;
        private String notes;

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

        public String getExamDate() {
            return examDate;
        }

        public void setExamDate(String examDate) {
            this.examDate = examDate;
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

        public String getRoom() {
            return room;
        }

        public void setRoom(String room) {
            this.room = room;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class ScheduleSlotOut {
        private Long id;
        private Long classId;
        private Long sectionId;
        private String className;
        private String sectionName;
        private String subjectName;
        private String examDate;
        private String startTime;
        private String endTime;
        private String room;
        private String notes;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
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

        public String getClassName() {
            return className;
        }

        public void setClassName(String className) {
            this.className = className;
        }

        public String getSectionName() {
            return sectionName;
        }

        public void setSectionName(String sectionName) {
            this.sectionName = sectionName;
        }

        public String getSubjectName() {
            return subjectName;
        }

        public void setSubjectName(String subjectName) {
            this.subjectName = subjectName;
        }

        public String getExamDate() {
            return examDate;
        }

        public void setExamDate(String examDate) {
            this.examDate = examDate;
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

        public String getRoom() {
            return room;
        }

        public void setRoom(String room) {
            this.room = room;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class ReplaceScheduleRequest {
        private List<ScheduleSlotIn> slots;

        public List<ScheduleSlotIn> getSlots() {
            return slots;
        }

        public void setSlots(List<ScheduleSlotIn> slots) {
            this.slots = slots;
        }
    }
}
