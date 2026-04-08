package com.school.erp.modules.exams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

public class ExamDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateExamRequest {
        @NotBlank private String name;
        private Long academicYearId;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<Long> classIds;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ExamResponse {
        private Long id;
        private String name;
        private Long academicYearId;
        private String startDate;
        private String endDate;
        private String status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BulkMarksRequest {
        @NotNull private Long examId;
        @NotNull private List<MarkEntry> marks;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MarkEntry {
        @NotNull private Long studentId;
        private String studentName;
        @NotBlank private String subjectName;
        @NotNull private Double marksObtained;
        @NotNull private Double maxMarks;
        private Long classId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MarkResponse {
        private Long id;
        private Long examId;
        private Long studentId;
        private String studentName;
        private String subjectName;
        private Double marksObtained;
        private Double maxMarks;
        private String grade;
        private Long classId;
        private double percentage;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReportCardResponse {
        private Long studentId;
        private String studentName;
        private List<MarkResponse> subjects;
        private double totalMarks;
        private double totalMaxMarks;
        private double overallPercentage;
        private String overallGrade;
    }
}
