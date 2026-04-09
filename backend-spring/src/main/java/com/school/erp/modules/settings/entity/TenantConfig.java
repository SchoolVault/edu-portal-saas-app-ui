package com.school.erp.modules.settings.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tenant_configs", uniqueConstraints = @UniqueConstraint(columnNames = "tenant_id"))
public class TenantConfig extends BaseEntity {
    @Column(name = "school_name", nullable = false, length = 200)
    private String schoolName;
    @Column(name = "school_code", nullable = false, length = 20)
    private String schoolCode;
    @Column(length = 500)
    private String logo;
    @Column(length = 500)
    private String address;
    @Column(length = 20)
    private String phone;
    @Column(length = 150)
    private String email;
    @Column(name = "primary_color", length = 10)
    private String primaryColor;
    @Column(name = "secondary_color", length = 10)
    private String secondaryColor;
    @Column(name = "features_json", columnDefinition = "TEXT")
    private String featuresJson;
    @Column(name = "library_fine_per_day", precision = 10, scale = 2)
    private BigDecimal libraryFinePerDay = new BigDecimal("10.00");


    public static class TenantConfigBuilder {
        private String schoolName;
        private String schoolCode;
        private String logo;
        private String address;
        private String phone;
        private String email;
        private String primaryColor;
        private String secondaryColor;
        private String featuresJson;

        TenantConfigBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder schoolName(final String schoolName) {
            this.schoolName = schoolName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder schoolCode(final String schoolCode) {
            this.schoolCode = schoolCode;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder logo(final String logo) {
            this.logo = logo;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder address(final String address) {
            this.address = address;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder phone(final String phone) {
            this.phone = phone;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder email(final String email) {
            this.email = email;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder primaryColor(final String primaryColor) {
            this.primaryColor = primaryColor;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder secondaryColor(final String secondaryColor) {
            this.secondaryColor = secondaryColor;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TenantConfig.TenantConfigBuilder featuresJson(final String featuresJson) {
            this.featuresJson = featuresJson;
            return this;
        }

        public TenantConfig build() {
            return new TenantConfig(this.schoolName, this.schoolCode, this.logo, this.address, this.phone, this.email, this.primaryColor, this.secondaryColor, this.featuresJson);
        }

        @Override
        public String toString() {
            return "TenantConfig.TenantConfigBuilder(schoolName=" + this.schoolName + ", schoolCode=" + this.schoolCode + ", logo=" + this.logo + ", address=" + this.address + ", phone=" + this.phone + ", email=" + this.email + ", primaryColor=" + this.primaryColor + ", secondaryColor=" + this.secondaryColor + ", featuresJson=" + this.featuresJson + ")";
        }
    }

    public static TenantConfig.TenantConfigBuilder builder() {
        return new TenantConfig.TenantConfigBuilder();
    }

    public String getSchoolName() {
        return this.schoolName;
    }

    public String getSchoolCode() {
        return this.schoolCode;
    }

    public String getLogo() {
        return this.logo;
    }

    public String getAddress() {
        return this.address;
    }

    public String getPhone() {
        return this.phone;
    }

    public String getEmail() {
        return this.email;
    }

    public String getPrimaryColor() {
        return this.primaryColor;
    }

    public String getSecondaryColor() {
        return this.secondaryColor;
    }

    public String getFeaturesJson() {
        return this.featuresJson;
    }

    public BigDecimal getLibraryFinePerDay() {
        return libraryFinePerDay;
    }

    public void setLibraryFinePerDay(BigDecimal libraryFinePerDay) {
        this.libraryFinePerDay = libraryFinePerDay;
    }

    public void setSchoolName(final String schoolName) {
        this.schoolName = schoolName;
    }

    public void setSchoolCode(final String schoolCode) {
        this.schoolCode = schoolCode;
    }

    public void setLogo(final String logo) {
        this.logo = logo;
    }

    public void setAddress(final String address) {
        this.address = address;
    }

    public void setPhone(final String phone) {
        this.phone = phone;
    }

    public void setEmail(final String email) {
        this.email = email;
    }

    public void setPrimaryColor(final String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public void setSecondaryColor(final String secondaryColor) {
        this.secondaryColor = secondaryColor;
    }

    public void setFeaturesJson(final String featuresJson) {
        this.featuresJson = featuresJson;
    }

    public TenantConfig() {
    }

    public TenantConfig(final String schoolName, final String schoolCode, final String logo, final String address, final String phone, final String email, final String primaryColor, final String secondaryColor, final String featuresJson) {
        this.schoolName = schoolName;
        this.schoolCode = schoolCode;
        this.logo = logo;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.primaryColor = primaryColor;
        this.secondaryColor = secondaryColor;
        this.featuresJson = featuresJson;
    }
}
