package com.school.erp.modules.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

public class AcademicDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateClassRequest {
        @NotBlank private String name;
        @NotNull private Integer grade;
        private Long classTeacherId;
        private String classTeacherName;
        @NotNull private Long academicYearId;
        private List<String> sectionNames; // e.g. ["A", "B", "C"]
        private Integer sectionCapacity;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ClassWithSectionsResponse {
        private Long id;
        private String name;
        private Integer grade;
        private Long classTeacherId;
        private String classTeacherName;
        private Long academicYearId;
        private int totalStudents;
        private List<SectionDTO> sections;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SectionDTO {
        private Long id;
        private String name;
        private Long classId;
        private Integer capacity;
        private Integer studentCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AddSectionRequest {
        @NotNull private Long classId;
        @NotBlank private String name;
        private Integer capacity;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignTeacherRequest {
        @NotNull private Long classId;
        @NotNull private Long teacherId;
        private String teacherName;
    }
}
