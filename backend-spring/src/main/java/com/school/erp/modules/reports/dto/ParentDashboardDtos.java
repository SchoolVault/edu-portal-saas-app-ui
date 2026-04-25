package com.school.erp.modules.reports.dto;

import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.student.entity.Student;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Parent role dashboard aggregate — JSON mirrors the Angular {@code ParentDashboardData} contract
 * (metrics, coded activity feed, optional drill-down arrays).
 */
public final class ParentDashboardDtos {

    private ParentDashboardDtos() {
    }

    public static class AttendanceMetric {
        private String band;
        private int schoolThresholdPercent = 85;

        public String getBand() {
            return band;
        }

        public void setBand(String band) {
            this.band = band;
        }

        public int getSchoolThresholdPercent() {
            return schoolThresholdPercent;
        }

        public void setSchoolThresholdPercent(int schoolThresholdPercent) {
            this.schoolThresholdPercent = schoolThresholdPercent;
        }
    }

    public static class ResultMetric {
        private String band;
        private Double averagePercent;

        public String getBand() {
            return band;
        }

        public void setBand(String band) {
            this.band = band;
        }

        public Double getAveragePercent() {
            return averagePercent;
        }

        public void setAveragePercent(Double averagePercent) {
            this.averagePercent = averagePercent;
        }
    }

    public static class FeeMetric {
        private String urgency;
        private String nextDueDate;
        private Integer daysUntilDue;

        public String getUrgency() {
            return urgency;
        }

        public void setUrgency(String urgency) {
            this.urgency = urgency;
        }

        public String getNextDueDate() {
            return nextDueDate;
        }

        public void setNextDueDate(String nextDueDate) {
            this.nextDueDate = nextDueDate;
        }

        public Integer getDaysUntilDue() {
            return daysUntilDue;
        }

        public void setDaysUntilDue(Integer daysUntilDue) {
            this.daysUntilDue = daysUntilDue;
        }
    }

    public static class ActivityCoded {
        private String code;
        private String type;
        private String timestamp;
        private Map<String, Object> params = new HashMap<>();

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

        public Map<String, Object> getParams() {
            return params;
        }

        public void setParams(Map<String, Object> params) {
            this.params = params != null ? params : new HashMap<>();
        }
    }

    public static class AttendanceSnapshot {
        private long totalDays;
        private long present;
        private long absent;
        private long late;
        private long excused;

        public long getTotalDays() {
            return totalDays;
        }

        public void setTotalDays(long totalDays) {
            this.totalDays = totalDays;
        }

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

    public static class Response {
        private String dataComputedAt;
        private long childCount;
        private List<Student> children = new ArrayList<>();
        private Long selectedChildId;
        private Student selectedChild;
        private double attendancePercentage;
        private String overallGrade = "-";
        private double feeDue;
        private List<ExamDTOs.MarkResponse> childPerformance = new ArrayList<>();
        private List<FeePayment> feeStatus = new ArrayList<>();
        private AttendanceMetric attendanceMetric = new AttendanceMetric();
        private ResultMetric resultMetric = new ResultMetric();
        private FeeMetric feeMetric = new FeeMetric();
        private List<ActivityCoded> recentActivities = new ArrayList<>();
        private List<ReportDashboardDTOs.UpcomingEvent> upcoming = new ArrayList<>();
        private AttendanceSnapshot attendanceSnapshot = new AttendanceSnapshot();

        public String getDataComputedAt() {
            return dataComputedAt;
        }

        public void setDataComputedAt(String dataComputedAt) {
            this.dataComputedAt = dataComputedAt;
        }

        public long getChildCount() {
            return childCount;
        }

        public void setChildCount(long childCount) {
            this.childCount = childCount;
        }

        public List<Student> getChildren() {
            return children;
        }

        public void setChildren(List<Student> children) {
            this.children = children != null ? children : new ArrayList<>();
        }

        public Long getSelectedChildId() {
            return selectedChildId;
        }

        public void setSelectedChildId(Long selectedChildId) {
            this.selectedChildId = selectedChildId;
        }

        public Student getSelectedChild() {
            return selectedChild;
        }

        public void setSelectedChild(Student selectedChild) {
            this.selectedChild = selectedChild;
        }

        public double getAttendancePercentage() {
            return attendancePercentage;
        }

        public void setAttendancePercentage(double attendancePercentage) {
            this.attendancePercentage = attendancePercentage;
        }

        public String getOverallGrade() {
            return overallGrade;
        }

        public void setOverallGrade(String overallGrade) {
            this.overallGrade = overallGrade;
        }

        public double getFeeDue() {
            return feeDue;
        }

        public void setFeeDue(double feeDue) {
            this.feeDue = feeDue;
        }

        public List<ExamDTOs.MarkResponse> getChildPerformance() {
            return childPerformance;
        }

        public void setChildPerformance(List<ExamDTOs.MarkResponse> childPerformance) {
            this.childPerformance = childPerformance != null ? childPerformance : new ArrayList<>();
        }

        public List<FeePayment> getFeeStatus() {
            return feeStatus;
        }

        public void setFeeStatus(List<FeePayment> feeStatus) {
            this.feeStatus = feeStatus != null ? feeStatus : new ArrayList<>();
        }

        public AttendanceMetric getAttendanceMetric() {
            return attendanceMetric;
        }

        public void setAttendanceMetric(AttendanceMetric attendanceMetric) {
            this.attendanceMetric = attendanceMetric;
        }

        public ResultMetric getResultMetric() {
            return resultMetric;
        }

        public void setResultMetric(ResultMetric resultMetric) {
            this.resultMetric = resultMetric;
        }

        public FeeMetric getFeeMetric() {
            return feeMetric;
        }

        public void setFeeMetric(FeeMetric feeMetric) {
            this.feeMetric = feeMetric;
        }

        public List<ActivityCoded> getRecentActivities() {
            return recentActivities;
        }

        public void setRecentActivities(List<ActivityCoded> recentActivities) {
            this.recentActivities = recentActivities != null ? recentActivities : new ArrayList<>();
        }

        public List<ReportDashboardDTOs.UpcomingEvent> getUpcoming() {
            return upcoming;
        }

        public void setUpcoming(List<ReportDashboardDTOs.UpcomingEvent> upcoming) {
            this.upcoming = upcoming != null ? upcoming : new ArrayList<>();
        }

        public AttendanceSnapshot getAttendanceSnapshot() {
            return attendanceSnapshot;
        }

        public void setAttendanceSnapshot(AttendanceSnapshot attendanceSnapshot) {
            this.attendanceSnapshot = attendanceSnapshot;
        }
    }
}
