package com.school.erp.modules.student.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

public class StudentDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "First name is required")
        private String firstName;
        @NotBlank(message = "Last name is required")
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private Enums.Gender gender;
        @NotNull(message = "Class is required")
        private Long classId;
        @NotNull(message = "Section is required")
        private Long sectionId;
        private String rollNumber;
        private String admissionNumber;
        private LocalDate admissionDate;
        private Long parentId;
        private String parentName;
        private String address;
        private String bloodGroup;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private Enums.Gender gender;
        private Long classId;
        private Long sectionId;
        private String rollNumber;
        private Long parentId;
        private String parentName;
        private String address;
        private String bloodGroup;
        private Enums.StudentStatus status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private String gender;
        private Long classId;
        private String className;
        private Long sectionId;
        private String sectionName;
        private String rollNumber;
        private String admissionNumber;
        private LocalDate admissionDate;
        private Long parentId;
        private String parentName;
        private String address;
        private String bloodGroup;
        private String avatar;
        private String status;
        private String tenantId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BulkUploadRequest {
        private java.util.List<CreateRequest> students;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PromotionRequest {
        @NotNull private Long fromClassId;
        @NotNull private Long toClassId;
        private java.util.List<Long> studentIds;
    }
}
