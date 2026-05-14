package com.school.erp.modules.exams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class ExamConfigDTOs {
    public static class UpsertModuleConfigRequest {
        @NotNull
        private Long academicYearId;
        @NotNull
        private Map<String, Object> config;
        private String note;

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public Map<String, Object> getConfig() {
            return config;
        }

        public void setConfig(Map<String, Object> config) {
            this.config = config;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }

    public static class ModuleConfigResponse {
        private Long id;
        private Long academicYearId;
        private String configKey;
        private Map<String, Object> config;
        private Integer versionNo;
        private String note;
        private String updatedAt;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public String getConfigKey() {
            return configKey;
        }

        public void setConfigKey(String configKey) {
            this.configKey = configKey;
        }

        public Map<String, Object> getConfig() {
            return config;
        }

        public void setConfig(Map<String, Object> config) {
            this.config = config;
        }

        public Integer getVersionNo() {
            return versionNo;
        }

        public void setVersionNo(Integer versionNo) {
            this.versionNo = versionNo;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public String getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(String updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    public static class ModuleConfigHistoryResponse {
        private Long id;
        private Long academicYearId;
        private String configKey;
        private Map<String, Object> config;
        private Integer versionNo;
        private String changeNote;
        private String createdAt;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public String getConfigKey() {
            return configKey;
        }

        public void setConfigKey(String configKey) {
            this.configKey = configKey;
        }

        public Map<String, Object> getConfig() {
            return config;
        }

        public void setConfig(Map<String, Object> config) {
            this.config = config;
        }

        public Integer getVersionNo() {
            return versionNo;
        }

        public void setVersionNo(Integer versionNo) {
            this.versionNo = versionNo;
        }

        public String getChangeNote() {
            return changeNote;
        }

        public void setChangeNote(String changeNote) {
            this.changeNote = changeNote;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }
    }
}
