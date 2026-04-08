package com.school.erp.modules.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

public class AttendanceDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BulkMarkRequest {
        @NotNull private Long classId;
        @NotNull private Long sectionId;
        @NotNull private String date; // yyyy-MM-dd
        @NotNull private List<MarkEntry> records;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MarkEntry {
        @NotNull private Long studentId;
        private String studentName;
        @NotNull private String status; // PRESENT, ABSENT, LATE, EXCUSED
        private String remarks;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttendanceResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private Long classId;
        private Long sectionId;
        private String date;
        private String status;
        private Long markedBy;
        private String remarks;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AttendanceStatsResponse {
        private Long studentId;
        private long totalDays;
        private long present;
        private long absent;
        private long late;
        private long excused;
        private double attendancePercentage;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ClassAttendanceStatsResponse {
        private Long classId;
        private Long sectionId;
        private String date;
        private long totalStudents;
        private long present;
        private long absent;
        private long late;
        private double attendancePercentage;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyAttendanceRow {
        private Long studentId;
        private String studentName;
        private long present;
        private long absent;
        private long late;
        private long totalDays;
        private double attendancePercentage;
    }
}
