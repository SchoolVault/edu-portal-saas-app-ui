package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "transport_drivers", indexes = @Index(name = "idx_transport_driver_tenant", columnList = "tenant_id"))
public class TransportDriver extends BaseEntity {
    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;
    @Column(length = 30)
    private String phone;
    @Column(name = "license_number", length = 60)
    private String licenseNumber;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }
}
