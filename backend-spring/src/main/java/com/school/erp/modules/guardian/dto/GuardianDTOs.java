package com.school.erp.modules.guardian.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public final class GuardianDTOs {

    private GuardianDTOs() {
    }

    public static class CreateGuardianRequest {
        @NotBlank
        private String fullName;
        private String occupation;
        private String primaryPhone;
        private String phonesJson;
        private String emailsJson;
        private Long userId;
        private String attributesJson;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getOccupation() {
            return occupation;
        }

        public void setOccupation(String occupation) {
            this.occupation = occupation;
        }

        public String getPrimaryPhone() {
            return primaryPhone;
        }

        public void setPrimaryPhone(String primaryPhone) {
            this.primaryPhone = primaryPhone;
        }

        public String getPhonesJson() {
            return phonesJson;
        }

        public void setPhonesJson(String phonesJson) {
            this.phonesJson = phonesJson;
        }

        public String getEmailsJson() {
            return emailsJson;
        }

        public void setEmailsJson(String emailsJson) {
            this.emailsJson = emailsJson;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getAttributesJson() {
            return attributesJson;
        }

        public void setAttributesJson(String attributesJson) {
            this.attributesJson = attributesJson;
        }
    }

    public static class UpdateGuardianRequest {
        private String fullName;
        private String occupation;
        private String primaryPhone;
        private String phonesJson;
        private String emailsJson;
        private Long userId;
        private String attributesJson;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getOccupation() {
            return occupation;
        }

        public void setOccupation(String occupation) {
            this.occupation = occupation;
        }

        public String getPrimaryPhone() {
            return primaryPhone;
        }

        public void setPrimaryPhone(String primaryPhone) {
            this.primaryPhone = primaryPhone;
        }

        public String getPhonesJson() {
            return phonesJson;
        }

        public void setPhonesJson(String phonesJson) {
            this.phonesJson = phonesJson;
        }

        public String getEmailsJson() {
            return emailsJson;
        }

        public void setEmailsJson(String emailsJson) {
            this.emailsJson = emailsJson;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getAttributesJson() {
            return attributesJson;
        }

        public void setAttributesJson(String attributesJson) {
            this.attributesJson = attributesJson;
        }
    }

    public static class GuardianResponse {
        private Long id;
        private String fullName;
        private String occupation;
        private String primaryPhone;
        private String phonesJson;
        private String emailsJson;
        private Long userId;
        private String attributesJson;
        private String tenantId;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getOccupation() {
            return occupation;
        }

        public void setOccupation(String occupation) {
            this.occupation = occupation;
        }

        public String getPrimaryPhone() {
            return primaryPhone;
        }

        public void setPrimaryPhone(String primaryPhone) {
            this.primaryPhone = primaryPhone;
        }

        public String getPhonesJson() {
            return phonesJson;
        }

        public void setPhonesJson(String phonesJson) {
            this.phonesJson = phonesJson;
        }

        public String getEmailsJson() {
            return emailsJson;
        }

        public void setEmailsJson(String emailsJson) {
            this.emailsJson = emailsJson;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getAttributesJson() {
            return attributesJson;
        }

        public void setAttributesJson(String attributesJson) {
            this.attributesJson = attributesJson;
        }

        public String getTenantId() {
            return tenantId;
        }

        public void setTenantId(String tenantId) {
            this.tenantId = tenantId;
        }
    }

    public static class CreateMappingRequest {
        @NotNull
        private Long guardianId;
        @NotNull
        private Enums.GuardianRelationType relationType;
        private Boolean isPrimary;
        private Boolean isEmergencyContact;
        private String custodyType;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;

        public Long getGuardianId() {
            return guardianId;
        }

        public void setGuardianId(Long guardianId) {
            this.guardianId = guardianId;
        }

        public Enums.GuardianRelationType getRelationType() {
            return relationType;
        }

        public void setRelationType(Enums.GuardianRelationType relationType) {
            this.relationType = relationType;
        }

        public Boolean getIsPrimary() {
            return isPrimary;
        }

        public void setIsPrimary(Boolean primary) {
            isPrimary = primary;
        }

        public Boolean getIsEmergencyContact() {
            return isEmergencyContact;
        }

        public void setIsEmergencyContact(Boolean emergencyContact) {
            isEmergencyContact = emergencyContact;
        }

        public String getCustodyType() {
            return custodyType;
        }

        public void setCustodyType(String custodyType) {
            this.custodyType = custodyType;
        }

        public LocalDate getEffectiveFrom() {
            return effectiveFrom;
        }

        public void setEffectiveFrom(LocalDate effectiveFrom) {
            this.effectiveFrom = effectiveFrom;
        }

        public LocalDate getEffectiveTo() {
            return effectiveTo;
        }

        public void setEffectiveTo(LocalDate effectiveTo) {
            this.effectiveTo = effectiveTo;
        }
    }

    public static class MappingResponse {
        private Long id;
        private Long studentId;
        private Long guardianId;
        private String guardianName;
        private String relationType;
        private Boolean isPrimary;
        private Boolean isEmergencyContact;
        private String custodyType;
        private LocalDate effectiveFrom;
        private LocalDate effectiveTo;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public Long getGuardianId() {
            return guardianId;
        }

        public void setGuardianId(Long guardianId) {
            this.guardianId = guardianId;
        }

        public String getGuardianName() {
            return guardianName;
        }

        public void setGuardianName(String guardianName) {
            this.guardianName = guardianName;
        }

        public String getRelationType() {
            return relationType;
        }

        public void setRelationType(String relationType) {
            this.relationType = relationType;
        }

        public Boolean getIsPrimary() {
            return isPrimary;
        }

        public void setIsPrimary(Boolean primary) {
            isPrimary = primary;
        }

        public Boolean getIsEmergencyContact() {
            return isEmergencyContact;
        }

        public void setIsEmergencyContact(Boolean emergencyContact) {
            isEmergencyContact = emergencyContact;
        }

        public String getCustodyType() {
            return custodyType;
        }

        public void setCustodyType(String custodyType) {
            this.custodyType = custodyType;
        }

        public LocalDate getEffectiveFrom() {
            return effectiveFrom;
        }

        public void setEffectiveFrom(LocalDate effectiveFrom) {
            this.effectiveFrom = effectiveFrom;
        }

        public LocalDate getEffectiveTo() {
            return effectiveTo;
        }

        public void setEffectiveTo(LocalDate effectiveTo) {
            this.effectiveTo = effectiveTo;
        }
    }
}
