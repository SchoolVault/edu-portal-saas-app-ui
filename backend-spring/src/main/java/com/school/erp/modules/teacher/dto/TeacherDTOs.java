package com.school.erp.modules.teacher.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.*; import java.math.BigDecimal; import java.time.LocalDate; import java.util.List;
public class TeacherDTOs {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank private String firstName; @NotBlank private String lastName;
        @NotBlank private String email; private String phone; private String qualification;
        private String specialization; private LocalDate joinDate; private BigDecimal salary;
        private List<String> subjects;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UpdateRequest {
        private String firstName; private String lastName; private String email; private String phone;
        private String qualification; private String specialization; private BigDecimal salary;
        private List<String> subjects; private String status;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Response {
        private Long id; private String firstName; private String lastName; private String email;
        private String phone; private String qualification; private String specialization;
        private LocalDate joinDate; private BigDecimal salary; private String status;
        private List<String> subjects; private String avatar; private String tenantId;
    }
}
