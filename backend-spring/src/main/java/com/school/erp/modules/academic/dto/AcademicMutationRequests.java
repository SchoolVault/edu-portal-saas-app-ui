package com.school.erp.modules.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Small request bodies for class/section maintenance (kept separate from large {@link AcademicDTOs}).
 */
public final class AcademicMutationRequests {

    private AcademicMutationRequests() {
    }

    /** Admin: persist comma-separated “additional” subject names into the tenant subject catalog. */
    public static class RegisterSubjectCatalogNamesRequest {
        @NotNull
        @Size(max = 40)
        private List<@NotBlank @Size(max = 120) String> names;

        public List<String> getNames() {
            return names;
        }

        public void setNames(List<String> names) {
            this.names = names;
        }
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
