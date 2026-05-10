package com.school.erp.modules.auth.dto;

import jakarta.validation.constraints.Size;
import java.util.List;

public class AuthPersonalProfileDTOs {

    public static class PersonalProfileResponse {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String tenantId;
        private String avatar;
        private String interfaceLocale;
        private String qualification;
        private String specialization;
        private String bankAccountHolder;
        private String bankName;
        private String bankAccountNumber;
        private String bankIfsc;
        private Boolean emailVerified;
        private Boolean phoneVerified;
        private List<String> editableScopes;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getTenantId() { return tenantId; }
        public void setTenantId(String tenantId) { this.tenantId = tenantId; }
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
        public String getInterfaceLocale() { return interfaceLocale; }
        public void setInterfaceLocale(String interfaceLocale) { this.interfaceLocale = interfaceLocale; }
        public String getQualification() { return qualification; }
        public void setQualification(String qualification) { this.qualification = qualification; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getBankAccountHolder() { return bankAccountHolder; }
        public void setBankAccountHolder(String bankAccountHolder) { this.bankAccountHolder = bankAccountHolder; }
        public String getBankName() { return bankName; }
        public void setBankName(String bankName) { this.bankName = bankName; }
        public String getBankAccountNumber() { return bankAccountNumber; }
        public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
        public String getBankIfsc() { return bankIfsc; }
        public void setBankIfsc(String bankIfsc) { this.bankIfsc = bankIfsc; }
        public Boolean getEmailVerified() { return emailVerified; }
        public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
        public Boolean getPhoneVerified() { return phoneVerified; }
        public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }
        public List<String> getEditableScopes() { return editableScopes; }
        public void setEditableScopes(List<String> editableScopes) { this.editableScopes = editableScopes; }
    }

    public static class UpdatePersonalProfileRequest {
        @Size(max = 120)
        private String name;
        @Size(max = 40)
        private String phone;
        @Size(max = 150)
        private String email;
        @Size(max = 500)
        private String avatar;
        @Size(max = 200)
        private String qualification;
        @Size(max = 120)
        private String specialization;
        @Size(max = 200)
        private String bankAccountHolder;
        @Size(max = 120)
        private String bankName;
        @Size(max = 64)
        private String bankAccountNumber;
        @Size(max = 32)
        private String bankIfsc;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
        public String getQualification() { return qualification; }
        public void setQualification(String qualification) { this.qualification = qualification; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getBankAccountHolder() { return bankAccountHolder; }
        public void setBankAccountHolder(String bankAccountHolder) { this.bankAccountHolder = bankAccountHolder; }
        public String getBankName() { return bankName; }
        public void setBankName(String bankName) { this.bankName = bankName; }
        public String getBankAccountNumber() { return bankAccountNumber; }
        public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
        public String getBankIfsc() { return bankIfsc; }
        public void setBankIfsc(String bankIfsc) { this.bankIfsc = bankIfsc; }
    }
}
