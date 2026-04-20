package com.school.erp.modules.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Small request bodies for class/section maintenance (kept separate from large {@link AcademicDTOs}).
 */
public final class AcademicMutationRequests {

    private AcademicMutationRequests() {
    }

    public static class UpdateSchoolClassRequest {
        @NotBlank
        private String name;
        private Integer grade;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getGrade() {
            return grade;
        }

        public void setGrade(Integer grade) {
            this.grade = grade;
        }
    }

    public static class UpdateSectionRequest {
        @NotBlank
        private String name;
        @NotNull
        private Integer capacity;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getCapacity() {
            return capacity;
        }

        public void setCapacity(Integer capacity) {
            this.capacity = capacity;
        }
    }
}
