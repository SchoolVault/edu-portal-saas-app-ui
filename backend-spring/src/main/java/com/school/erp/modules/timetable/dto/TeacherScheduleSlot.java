package com.school.erp.modules.timetable.dto;

/**
 * Teacher-facing timetable row: recurring weekly slot or a one-day {@code COVER} overlay from attendance cover assignments.
 * Negative {@code id} denotes a virtual cover row (not persisted in {@code timetable_entries}).
 */
public class TeacherScheduleSlot {

    private Long id;
    private Long classId;
    private Long sectionId;
    private String day;
    private Integer period;
    private String startTime;
    private String endTime;
    private String subjectName;
    private Long teacherId;
    private String teacherName;
    private String room;
    /** {@code RECURRING} or {@code COVER} */
    private String scheduleSource;
    /** ISO date when {@code scheduleSource} is {@code COVER}; otherwise null */
    private String coverForDate;

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

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getScheduleSource() {
        return scheduleSource;
    }

    public void setScheduleSource(String scheduleSource) {
        this.scheduleSource = scheduleSource;
    }

    public String getCoverForDate() {
        return coverForDate;
    }

    public void setCoverForDate(String coverForDate) {
        this.coverForDate = coverForDate;
    }
}
