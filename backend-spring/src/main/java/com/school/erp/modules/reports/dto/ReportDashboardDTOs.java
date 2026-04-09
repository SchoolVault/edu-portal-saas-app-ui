package com.school.erp.modules.reports.dto;

import java.util.ArrayList;
import java.util.List;

public class ReportDashboardDTOs {

    public static class MetricPoint {
        private String label;
        private double value;

        public MetricPoint() {
        }

        public MetricPoint(final String label, final double value) {
            this.label = label;
            this.value = value;
        }

        public String getLabel() {
            return this.label;
        }

        public void setLabel(final String label) {
            this.label = label;
        }

        public double getValue() {
            return this.value;
        }

        public void setValue(final double value) {
            this.value = value;
        }
    }

    public static class ActivityItem {
        private String title;
        private String description;
        private String type;
        private String timestamp;

        public ActivityItem() {
        }

        public ActivityItem(final String title, final String description, final String type, final String timestamp) {
            this.title = title;
            this.description = description;
            this.type = type;
            this.timestamp = timestamp;
        }

        public String getTitle() {
            return this.title;
        }

        public void setTitle(final String title) {
            this.title = title;
        }

        public String getDescription() {
            return this.description;
        }

        public void setDescription(final String description) {
            this.description = description;
        }

        public String getType() {
            return this.type;
        }

        public void setType(final String type) {
            this.type = type;
        }

        public String getTimestamp() {
            return this.timestamp;
        }

        public void setTimestamp(final String timestamp) {
            this.timestamp = timestamp;
        }
    }

    public static class AttendanceOverview {
        private long total;
        private long present;
        private long absent;
        private long late;
        private long excused;

        public long getTotal() {
            return this.total;
        }

        public void setTotal(final long total) {
            this.total = total;
        }

        public long getPresent() {
            return this.present;
        }

        public void setPresent(final long present) {
            this.present = present;
        }

        public long getAbsent() {
            return this.absent;
        }

        public void setAbsent(final long absent) {
            this.absent = absent;
        }

        public long getLate() {
            return this.late;
        }

        public void setLate(final long late) {
            this.late = late;
        }

        public long getExcused() {
            return this.excused;
        }

        public void setExcused(final long excused) {
            this.excused = excused;
        }
    }

    public static class UpcomingEvent {
        private Long id;
        private String title;
        private String date;
        private String description;

        public Long getId() {
            return this.id;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public String getTitle() {
            return this.title;
        }

        public void setTitle(final String title) {
            this.title = title;
        }

        public String getDate() {
            return this.date;
        }

        public void setDate(final String date) {
            this.date = date;
        }

        public String getDescription() {
            return this.description;
        }

        public void setDescription(final String description) {
            this.description = description;
        }
    }

    public static class AdminDashboardResponse {
        private long totalStudents;
        private long totalTeachers;
        private double feesCollected;
        private double feesPending;
        private long collectionRate;
        private List<MetricPoint> monthlyAdmissions = new ArrayList<>();
        private List<MetricPoint> monthlyCollections = new ArrayList<>();
        private AttendanceOverview attendanceOverview;
        private List<ActivityItem> recentActivities = new ArrayList<>();
        private List<UpcomingEvent> upcomingEvents = new ArrayList<>();

        public long getTotalStudents() {
            return this.totalStudents;
        }

        public void setTotalStudents(final long totalStudents) {
            this.totalStudents = totalStudents;
        }

        public long getTotalTeachers() {
            return this.totalTeachers;
        }

        public void setTotalTeachers(final long totalTeachers) {
            this.totalTeachers = totalTeachers;
        }

        public double getFeesCollected() {
            return this.feesCollected;
        }

        public void setFeesCollected(final double feesCollected) {
            this.feesCollected = feesCollected;
        }

        public double getFeesPending() {
            return this.feesPending;
        }

        public void setFeesPending(final double feesPending) {
            this.feesPending = feesPending;
        }

        public long getCollectionRate() {
            return this.collectionRate;
        }

        public void setCollectionRate(final long collectionRate) {
            this.collectionRate = collectionRate;
        }

        public List<MetricPoint> getMonthlyAdmissions() {
            return this.monthlyAdmissions;
        }

        public void setMonthlyAdmissions(final List<MetricPoint> monthlyAdmissions) {
            this.monthlyAdmissions = monthlyAdmissions;
        }

        public List<MetricPoint> getMonthlyCollections() {
            return this.monthlyCollections;
        }

        public void setMonthlyCollections(final List<MetricPoint> monthlyCollections) {
            this.monthlyCollections = monthlyCollections;
        }

        public AttendanceOverview getAttendanceOverview() {
            return this.attendanceOverview;
        }

        public void setAttendanceOverview(final AttendanceOverview attendanceOverview) {
            this.attendanceOverview = attendanceOverview;
        }

        public List<ActivityItem> getRecentActivities() {
            return this.recentActivities;
        }

        public void setRecentActivities(final List<ActivityItem> recentActivities) {
            this.recentActivities = recentActivities;
        }

        public List<UpcomingEvent> getUpcomingEvents() {
            return this.upcomingEvents;
        }

        public void setUpcomingEvents(final List<UpcomingEvent> upcomingEvents) {
            this.upcomingEvents = upcomingEvents;
        }
    }

    public static class TeacherScheduleItem {
        private Long classId;
        private Long sectionId;
        private int period;
        private String subject;
        private String className;
        private String sectionName;
        private String room;
        private String startTime;
        private String endTime;

        public Long getClassId() {
            return this.classId;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public Long getSectionId() {
            return this.sectionId;
        }

        public void setSectionId(final Long sectionId) {
            this.sectionId = sectionId;
        }

        public int getPeriod() {
            return this.period;
        }

        public void setPeriod(final int period) {
            this.period = period;
        }

        public String getSubject() {
            return this.subject;
        }

        public void setSubject(final String subject) {
            this.subject = subject;
        }

        public String getClassName() {
            return this.className;
        }

        public void setClassName(final String className) {
            this.className = className;
        }

        public String getSectionName() {
            return this.sectionName;
        }

        public void setSectionName(final String sectionName) {
            this.sectionName = sectionName;
        }

        public String getRoom() {
            return this.room;
        }

        public void setRoom(final String room) {
            this.room = room;
        }

        public String getStartTime() {
            return this.startTime;
        }

        public void setStartTime(final String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return this.endTime;
        }

        public void setEndTime(final String endTime) {
            this.endTime = endTime;
        }
    }

    public static class TeacherClassTeacherRow {
        private Long classId;
        private String className;
        private String sectionName;
        private int totalStudents;

        public TeacherClassTeacherRow() {
        }

        public TeacherClassTeacherRow(Long classId, String className, String sectionName, int totalStudents) {
            this.classId = classId;
            this.className = className;
            this.sectionName = sectionName;
            this.totalStudents = totalStudents;
        }

        public Long getClassId() {
            return classId;
        }

        public void setClassId(Long classId) {
            this.classId = classId;
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

        public int getTotalStudents() {
            return totalStudents;
        }

        public void setTotalStudents(int totalStudents) {
            this.totalStudents = totalStudents;
        }
    }

    public static class TeacherMessageQueueItem {
        private long conversationId;
        private String fromName;
        private String studentName;
        private String preview;
        private String timestamp;
        private String priority;

        public TeacherMessageQueueItem() {
        }

        public TeacherMessageQueueItem(long conversationId, String fromName, String studentName, String preview, String timestamp, String priority) {
            this.conversationId = conversationId;
            this.fromName = fromName;
            this.studentName = studentName;
            this.preview = preview;
            this.timestamp = timestamp;
            this.priority = priority;
        }

        public long getConversationId() {
            return conversationId;
        }

        public void setConversationId(long conversationId) {
            this.conversationId = conversationId;
        }

        public String getFromName() {
            return fromName;
        }

        public void setFromName(String fromName) {
            this.fromName = fromName;
        }

        public String getStudentName() {
            return studentName;
        }

        public void setStudentName(String studentName) {
            this.studentName = studentName;
        }

        public String getPreview() {
            return preview;
        }

        public void setPreview(String preview) {
            this.preview = preview;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }
    }

    public static class TeacherDashboardResponse {
        private long assignedClasses;
        private long studentsAssigned;
        private long upcomingExams;
        private long unreadNotifications;
        private List<TeacherScheduleItem> todaySchedule = new ArrayList<>();
        private List<ActivityItem> pendingTasks = new ArrayList<>();
        private List<TeacherClassTeacherRow> classTeacherOf = new ArrayList<>();
        private List<TeacherMessageQueueItem> messageQueue = new ArrayList<>();

        public long getAssignedClasses() {
            return this.assignedClasses;
        }

        public void setAssignedClasses(final long assignedClasses) {
            this.assignedClasses = assignedClasses;
        }

        public long getStudentsAssigned() {
            return this.studentsAssigned;
        }

        public void setStudentsAssigned(final long studentsAssigned) {
            this.studentsAssigned = studentsAssigned;
        }

        public long getUpcomingExams() {
            return this.upcomingExams;
        }

        public void setUpcomingExams(final long upcomingExams) {
            this.upcomingExams = upcomingExams;
        }

        public long getUnreadNotifications() {
            return this.unreadNotifications;
        }

        public void setUnreadNotifications(final long unreadNotifications) {
            this.unreadNotifications = unreadNotifications;
        }

        public List<TeacherScheduleItem> getTodaySchedule() {
            return this.todaySchedule;
        }

        public void setTodaySchedule(final List<TeacherScheduleItem> todaySchedule) {
            this.todaySchedule = todaySchedule;
        }

        public List<ActivityItem> getPendingTasks() {
            return this.pendingTasks;
        }

        public void setPendingTasks(final List<ActivityItem> pendingTasks) {
            this.pendingTasks = pendingTasks;
        }

        public List<TeacherClassTeacherRow> getClassTeacherOf() {
            return classTeacherOf;
        }

        public void setClassTeacherOf(List<TeacherClassTeacherRow> classTeacherOf) {
            this.classTeacherOf = classTeacherOf != null ? classTeacherOf : new ArrayList<>();
        }

        public List<TeacherMessageQueueItem> getMessageQueue() {
            return messageQueue;
        }

        public void setMessageQueue(List<TeacherMessageQueueItem> messageQueue) {
            this.messageQueue = messageQueue != null ? messageQueue : new ArrayList<>();
        }
    }
}
