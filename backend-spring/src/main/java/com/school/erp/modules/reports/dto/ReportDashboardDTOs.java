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
        private String campaignId;

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

        public String getCampaignId() {
            return campaignId;
        }

        public void setCampaignId(String campaignId) {
            this.campaignId = campaignId;
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
        private String campaignId;

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

        public String getCampaignId() {
            return campaignId;
        }

        public void setCampaignId(String campaignId) {
            this.campaignId = campaignId;
        }
    }

    /** Class with no homeroom (class) teacher assigned — surfaced on admin dashboard for follow-up. */
    public static class ClassHomeroomGap {
        private Long classId;
        private String className;
        private Integer grade;

        public ClassHomeroomGap() {
        }

        public ClassHomeroomGap(Long classId, String className, Integer grade) {
            this.classId = classId;
            this.className = className;
            this.grade = grade;
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

        public Integer getGrade() {
            return grade;
        }

        public void setGrade(Integer grade) {
            this.grade = grade;
        }
    }

    public static class AdminDashboardResponse {
        private String dataComputedAt;
        private long totalStudents;
        private long totalTeachers;
        /** Running cumulative collection across all recorded fee payments. */
        private double feesCollected;
        /** Running cumulative pending amount across all recorded fee ledgers. */
        private double feesPending;
        /** Cumulative collection rate derived from {@link #feesCollected} and {@link #feesPending}. */
        private long collectionRate;
        /** Collected amount for the current calendar month (admin home KPI primary). */
        private double feesCollectedMonthly;
        /** Pending amount tied to current-month fee ledgers (KPI denominator context). */
        private double feesPendingMonthly;
        /** Monthly collection rate derived from month-scoped collected/pending totals. */
        private long collectionRateMonthly;
        /** Collected amount for current calendar year (secondary context / leadership trend). */
        private double feesCollectedYearly;
        /** Pending amount tied to current-year fee ledgers. */
        private double feesPendingYearly;
        /** Year-to-date collection rate derived from year-scoped collected/pending totals. */
        private long collectionRateYearly;
        private List<MetricPoint> monthlyAdmissions = new ArrayList<>();
        private List<MetricPoint> monthlyCollections = new ArrayList<>();
        private AttendanceOverview attendanceOverview;
        /** P/A/L/E counts for the calendar day only — admin KPI "attendance logged" (resets at midnight). */
        private AttendanceOverview attendanceToday;
        private List<ActivityItem> recentActivities = new ArrayList<>();
        private List<UpcomingEvent> upcomingEvents = new ArrayList<>();
        private List<ClassHomeroomGap> classesWithoutHomeroomTeacher = new ArrayList<>();
        /** Echo of {@link com.school.erp.modules.reports.dto.AdminAttendanceOverviewScope} for clients (i18n / chips). */
        private String attendanceOverviewScope = "MONTH_TO_DATE";
        /** Echo of selected attendance month filter (YYYY-MM). */
        private String attendanceOverviewMonth;

        public String getDataComputedAt() {
            return dataComputedAt;
        }

        public void setDataComputedAt(String dataComputedAt) {
            this.dataComputedAt = dataComputedAt;
        }

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

        public double getFeesCollectedMonthly() {
            return feesCollectedMonthly;
        }

        public void setFeesCollectedMonthly(double feesCollectedMonthly) {
            this.feesCollectedMonthly = feesCollectedMonthly;
        }

        public double getFeesPendingMonthly() {
            return feesPendingMonthly;
        }

        public void setFeesPendingMonthly(double feesPendingMonthly) {
            this.feesPendingMonthly = feesPendingMonthly;
        }

        public long getCollectionRateMonthly() {
            return collectionRateMonthly;
        }

        public void setCollectionRateMonthly(long collectionRateMonthly) {
            this.collectionRateMonthly = collectionRateMonthly;
        }

        public double getFeesCollectedYearly() {
            return feesCollectedYearly;
        }

        public void setFeesCollectedYearly(double feesCollectedYearly) {
            this.feesCollectedYearly = feesCollectedYearly;
        }

        public double getFeesPendingYearly() {
            return feesPendingYearly;
        }

        public void setFeesPendingYearly(double feesPendingYearly) {
            this.feesPendingYearly = feesPendingYearly;
        }

        public long getCollectionRateYearly() {
            return collectionRateYearly;
        }

        public void setCollectionRateYearly(long collectionRateYearly) {
            this.collectionRateYearly = collectionRateYearly;
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

        public AttendanceOverview getAttendanceToday() {
            return attendanceToday;
        }

        public void setAttendanceToday(final AttendanceOverview attendanceToday) {
            this.attendanceToday = attendanceToday;
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

        public List<ClassHomeroomGap> getClassesWithoutHomeroomTeacher() {
            return this.classesWithoutHomeroomTeacher;
        }

        public void setClassesWithoutHomeroomTeacher(final List<ClassHomeroomGap> classesWithoutHomeroomTeacher) {
            this.classesWithoutHomeroomTeacher = classesWithoutHomeroomTeacher;
        }

        public String getAttendanceOverviewScope() {
            return attendanceOverviewScope;
        }

        public void setAttendanceOverviewScope(final String attendanceOverviewScope) {
            this.attendanceOverviewScope = attendanceOverviewScope;
        }

        public String getAttendanceOverviewMonth() {
            return attendanceOverviewMonth;
        }

        public void setAttendanceOverviewMonth(String attendanceOverviewMonth) {
            this.attendanceOverviewMonth = attendanceOverviewMonth;
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
        /** Section primary key for deep links (students / attendance filters). */
        private Long sectionId;
        private int totalStudents;

        public TeacherClassTeacherRow() {
        }

        public TeacherClassTeacherRow(Long classId, String className, String sectionName, Long sectionId, int totalStudents) {
            this.classId = classId;
            this.className = className;
            this.sectionName = sectionName;
            this.sectionId = sectionId;
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

        public Long getSectionId() {
            return sectionId;
        }

        public void setSectionId(Long sectionId) {
            this.sectionId = sectionId;
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

    /** Monthly present % for teacher-scoped classes (GET /reports/dashboard/teacher). */
    public static class TeacherAttendanceTrendPoint {
        private String month;
        private double presentPercent;

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public double getPresentPercent() {
            return presentPercent;
        }

        public void setPresentPercent(double presentPercent) {
            this.presentPercent = presentPercent;
        }
    }

    public static class TeacherRecentActivityItem {
        private String code;
        private String type;
        private String timestamp;
        private java.util.Map<String, Object> params = new java.util.LinkedHashMap<>();
        private String linkRoute;
        private java.util.Map<String, String> linkQueryParams = new java.util.LinkedHashMap<>();

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public java.util.Map<String, Object> getParams() {
            return params;
        }

        public void setParams(java.util.Map<String, Object> params) {
            this.params = params != null ? params : new java.util.LinkedHashMap<>();
        }

        public String getLinkRoute() {
            return linkRoute;
        }

        public void setLinkRoute(String linkRoute) {
            this.linkRoute = linkRoute;
        }

        public java.util.Map<String, String> getLinkQueryParams() {
            return linkQueryParams;
        }

        public void setLinkQueryParams(java.util.Map<String, String> linkQueryParams) {
            this.linkQueryParams = linkQueryParams != null ? linkQueryParams : new java.util.LinkedHashMap<>();
        }
    }

    public static class TeacherHomeroomDayPoint {
        private String date;
        private double presentPercent;
        /** Shares of the day’s attendance rows; sum to ~100 when the day has rows (stacked bar). */
        private double absentPercent;
        private double latePercent;
        private double excusedPercent;
        /** Headcounts for that calendar day (one mark per pupil); primary series for day-by-day stacked chart. */
        private long presentCount;
        private long absentCount;
        private long lateCount;
        private long excusedCount;

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public double getPresentPercent() {
            return presentPercent;
        }

        public void setPresentPercent(double presentPercent) {
            this.presentPercent = presentPercent;
        }

        public double getAbsentPercent() {
            return absentPercent;
        }

        public void setAbsentPercent(double absentPercent) {
            this.absentPercent = absentPercent;
        }

        public double getLatePercent() {
            return latePercent;
        }

        public void setLatePercent(double latePercent) {
            this.latePercent = latePercent;
        }

        public double getExcusedPercent() {
            return excusedPercent;
        }

        public void setExcusedPercent(double excusedPercent) {
            this.excusedPercent = excusedPercent;
        }

        public long getPresentCount() {
            return presentCount;
        }

        public void setPresentCount(long presentCount) {
            this.presentCount = presentCount;
        }

        public long getAbsentCount() {
            return absentCount;
        }

        public void setAbsentCount(long absentCount) {
            this.absentCount = absentCount;
        }

        public long getLateCount() {
            return lateCount;
        }

        public void setLateCount(long lateCount) {
            this.lateCount = lateCount;
        }

        public long getExcusedCount() {
            return excusedCount;
        }

        public void setExcusedCount(long excusedCount) {
            this.excusedCount = excusedCount;
        }
    }

    public static class TeacherAttendanceBreakdown {
        private long present;
        private long absent;
        private long late;
        private long excused;

        public long getPresent() {
            return present;
        }

        public void setPresent(long present) {
            this.present = present;
        }

        public long getAbsent() {
            return absent;
        }

        public void setAbsent(long absent) {
            this.absent = absent;
        }

        public long getLate() {
            return late;
        }

        public void setLate(long late) {
            this.late = late;
        }

        public long getExcused() {
            return excused;
        }

        public void setExcused(long excused) {
            this.excused = excused;
        }
    }

    /** Homeroom / class-teacher section — daily trend + doughnut breakdown for {@code month} (YYYY-MM). */
    public static class TeacherHomeroomAttendanceDetail {
        private String month;
        private String classLabel;
        private List<TeacherHomeroomDayPoint> daily = new ArrayList<>();
        private TeacherAttendanceBreakdown breakdown = new TeacherAttendanceBreakdown();

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public String getClassLabel() {
            return classLabel;
        }

        public void setClassLabel(String classLabel) {
            this.classLabel = classLabel;
        }

        public List<TeacherHomeroomDayPoint> getDaily() {
            return daily;
        }

        public void setDaily(List<TeacherHomeroomDayPoint> daily) {
            this.daily = daily != null ? daily : new ArrayList<>();
        }

        public TeacherAttendanceBreakdown getBreakdown() {
            return breakdown;
        }

        public void setBreakdown(TeacherAttendanceBreakdown breakdown) {
            this.breakdown = breakdown != null ? breakdown : new TeacherAttendanceBreakdown();
        }
    }

    public static class TeacherDashboardResponse {
        private String dataComputedAt;
        private long assignedClasses;
        private long studentsAssigned;
        private long upcomingExams;
        private long unreadNotifications;
        /** Sessions still awaiting attendance capture (aligns with frontend KPI / deep link). */
        private long pendingAttendanceSessions;
        /** True when homeroom class attendance rows exist for local today (first class-teacher assignment). */
        private boolean homeroomTodayAttendanceComplete;
        private List<TeacherScheduleItem> todaySchedule = new ArrayList<>();
        private List<ActivityItem> pendingTasks = new ArrayList<>();
        private List<TeacherClassTeacherRow> classTeacherOf = new ArrayList<>();
        /** @deprecated Phase 1 — kept empty; parent messaging not surfaced in UI. */
        private List<TeacherMessageQueueItem> messageQueue = new ArrayList<>();
        private List<TeacherAttendanceTrendPoint> attendanceTrend = new ArrayList<>();
        private List<TeacherRecentActivityItem> recentActivities = new ArrayList<>();
        private TeacherHomeroomAttendanceDetail homeroomAttendance;

        public String getDataComputedAt() {
            return dataComputedAt;
        }

        public void setDataComputedAt(String dataComputedAt) {
            this.dataComputedAt = dataComputedAt;
        }

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

        public long getPendingAttendanceSessions() {
            return pendingAttendanceSessions;
        }

        public void setPendingAttendanceSessions(long pendingAttendanceSessions) {
            this.pendingAttendanceSessions = pendingAttendanceSessions;
        }

        public boolean isHomeroomTodayAttendanceComplete() {
            return homeroomTodayAttendanceComplete;
        }

        public void setHomeroomTodayAttendanceComplete(boolean homeroomTodayAttendanceComplete) {
            this.homeroomTodayAttendanceComplete = homeroomTodayAttendanceComplete;
        }

        public List<TeacherAttendanceTrendPoint> getAttendanceTrend() {
            return attendanceTrend;
        }

        public void setAttendanceTrend(List<TeacherAttendanceTrendPoint> attendanceTrend) {
            this.attendanceTrend = attendanceTrend != null ? attendanceTrend : new ArrayList<>();
        }

        public List<TeacherRecentActivityItem> getRecentActivities() {
            return recentActivities;
        }

        public void setRecentActivities(List<TeacherRecentActivityItem> recentActivities) {
            this.recentActivities = recentActivities != null ? recentActivities : new ArrayList<>();
        }

        public TeacherHomeroomAttendanceDetail getHomeroomAttendance() {
            return homeroomAttendance;
        }

        public void setHomeroomAttendance(TeacherHomeroomAttendanceDetail homeroomAttendance) {
            this.homeroomAttendance = homeroomAttendance;
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
